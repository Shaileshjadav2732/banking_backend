import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../model/user.js";
import ErrorHandler from "../middleware/errror.js";
import { otpVerification } from "../model/otpver.js";
import transporter from "../app.js";
import { validationResult } from "express-validator";

export const register = async (req, res, next) => {
   const errors = validationResult(req);

   if (!errors.isEmpty()) {
      console.log(errors);
      const error = new Error("Validation Failed!");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
   }
   try {
      const { deviceDetails, phoneNo, email, password } = req.body;

      console.log(phoneNo);
      let user = await User.findOne({ email });
      if (user) return next(new ErrorHandler("User Already Exist", 400));

      const hashedPassword = await bcrypt.hash(password, 10);

      if (!deviceDetails.id || !deviceDetails.os || !deviceDetails.version || !deviceDetails.manufacturer || !deviceDetails.model) {
         return next(new ErrorHandler("Please provide valid device details!", 400));
      }

      const hashedDid = await bcrypt.hash(deviceDetails.id, 10);
      const hashedDos = await bcrypt.hash(deviceDetails.os, 10);
      const hashedDversion = await bcrypt.hash(deviceDetails.version, 10);
      const hashedDmanufacturer = await bcrypt.hash(
         deviceDetails.manufacturer,
         10
      );
      const hashedDmodel = await bcrypt.hash(deviceDetails.model, 10);

      const upiId = phoneNo.toString() + "@xyzbanking";

      console.log(upiId);

      user = await User.create({
         deviceDetails: { id: hashedDid, os: hashedDos, version: hashedDversion, manufacturer: hashedDmanufacturer, model: hashedDmodel },
         email,
         phone: phoneNo,
         upiId: upiId,
         password: hashedPassword,
         verified: false,
      }).then((result) => sendOtp(result, res, next));


   } catch (error) {
      console.error('Registration Error:', error);
      next(error);
   }
};

export const sendOtp = async ({ _id, email }, res, next) => {
   try {
      const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
      const mailOptions = {
         from: "banking@gmail.com",
         to: email,
         subject: "Verify Your Email",
         html: `<p style="color:white;"><b style="color:red">${otp}</b> in the app to verify your email address and complete the verification</p>`,
      };

      const saltRounds = 10;
      const hashedOtp = await bcrypt.hash(otp, saltRounds);

      await otpVerification.create({
         userId: _id,
         otp: hashedOtp,
         createdAt: Date.now(),
         expiresAt: Date.now() + 60 * 60 * 1000
      });

      await transporter.sendMail(mailOptions);

      res.status(250).json({
         status: "PENDING",
         message: "Verification",
         data: { userId: _id, email }
      });
   } catch (error) {
      console.error('OTP Sending Error:', error);
      next(error);
   }
};

export const verifyotp = async (req, res, next) => {
   const errors = validationResult(req);

   if (!errors.isEmpty()) {
      console.log(errors);
      const error = new Error("Validation Failed!");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
   }

   try {
      let { otp, userId } = req.body;
      console.log(`OTP: ${otp}, User ID: ${userId}`); // Log received data

      if (!userId || !otp) {
         return next(new ErrorHandler("Empty otp details are not allowed!", 400));
      } else {
         const OtpVerificationRecords = await OtpVerification.find({ userId });
         console.log(`OtpVerificationRecords: ${OtpVerificationRecords}`); // Log OTP records

         if (!OtpVerificationRecords || OtpVerificationRecords.length === 0) {
            return next(
               new ErrorHandler(
                  "Account record doesn't exist or has been verified already. Please sign up or logIn!",
                  400
               )
            );
         } else {
            const { expiresAt, otp: hashedOtp } = OtpVerificationRecords[0];
            console.log(`Expires At: ${expiresAt}, Hashed OTP: ${hashedOtp}`); // Log expiry and hashed OTP

            if (expiresAt < Date.now()) {
               await OtpVerificationRecords.deleteMany({ userId });
               return next(
                  new ErrorHandler("Code Has Expired, Please Try again!", 400)
               );
            } else {
               const validOtp = await bcrypt.compare(otp, hashedOtp);
               console.log(`Is OTP valid: ${validOtp}`); // Log OTP validation result

               if (!validOtp) {
                  return next(new ErrorHandler("Invalid Code Passed!", 400));
               } else {
                  const sentCookie = jwt.sign({ _id: userId }, "dbdhbzssm");

                  res
                     .status(200)
                     .cookie("userId", sentCookie, {
                        httpOnly: true,
                        maxAge: 3600 * 1000,
                     })
                     .json({
                        success: true,
                        message: "cookie sent & userVerified",
                     });

                  await User.updateOne({ _id: userId }, { verified: true });
                  await OtpVerificationRecords  .deleteOne({ userId });
               }
            }
         }
      }
   } catch (error) {
      next(error);
   }
};
export const login = async (req, res, next) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      console.log(errors);
      const error = new Error(errors.errors[0].msg);
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
   }


   const { email, password } = req.body;
   try {
      const user = await User.findOne({ email: email })
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
         const error = new Error("Incorrect Password!");
         error.statusCode = 401;

         return next(error);
      }
      const token = jwt.sign(
         {
            email: user.email,
            userId: user._id.toString(),
         }, "huheughie", { expiresIn: "1h" }
      );

      res.status(200).json({
         token: token,
         userId: user._id.toString(),
         message: "Login Successfully!",
      });


   } catch (error) {

      if (!error.statusCode) {
         error.statusCode = 500;

      } next(error);

   }

};


export const completeProfile = async (req, res, next) => {

   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      console.log(errors);
      const error = new Error("validation Failed!");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
   }
   
   if (!req.file) {
      const error = new Error("No image provided.");
      error.statusCode = 422;
      return next(error);
   }
   
   const imageUrl = req.file.path.replace("\\", "/");
   const { userId, name, address, dob, bank, upipin } = req.body;


   try {
      const hashedUPI = await bcrypt.hash(upipin, 10);
      const user = await User.findOne({ _id: userId });

      user.name = name;
      user.address = address;
      user.dob = dob;
      user.bank = bank;
      user.upipin = hashedUPI;
      user.image = imageUrl;
      user.accountNum;
      const result = await user.save();
      res.status(201).json({ message: "Profile complete!", result: result });
   } catch (error) {
      if (!err.statusCode) {
         err.statusCode = 500;
      }
      next(err);
   }
};

// gives profile details using user id

export const getProfileDetails = (req, res, next) => {
   const userId = req.params.userId;

   User.findOne({ _Id: userId }).then((user) => {
      if (!user) {
         const error = new Error("User does nor exist!");
         error.status = 404;
         return next(error);
      }
      res.status(200).json({ message: "User details fetched!", user: user });

   }).catch((err) => {
      if (!err.statusCode) {
         err.statusCode = 500;
      }
      next(err);
   })

}


export const getProfileDetailsUsingEmail = (req, res, next) => {
   const email = req.params.email;

   User.findOne({ email: email }).then((user) => {
      if (!user) {
         const error = new Error("User does not exist!");
         error.status = 404;
         return next(error);
      }
      res.status(200).json({ message: "User details fetched!", user: user });

   }).catch((err) => {
      if (!err.statusCode) {
         err.statusCode = 500;
      }
      next(err);
   });
};