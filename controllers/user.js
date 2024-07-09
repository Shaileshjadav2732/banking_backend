import crypto from "crypto";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

import { transporter } from "../app.js";
import { User } from "../model/user.js";
import { OtpVerification } from "../model/otpver.js";
import ErrorHandler from "../middlewares/error.js";

//Genration of keyPairs
export const generateKeyPairs = (req, res, next) => {
   const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      // key's size
      modulusLength: 2048,
      publicKeyEncoding: {
         type: "spki",
         format: "der",
      },
      privateKeyEncoding: {
         type: "pkcs8",
         format: "der",
      },
   });

   res.status(201).json({
      publicKey: publicKey.toString("base64"),
      privateKey: privateKey.toString("base64"),
   });
};

// Verification of sent data with signature
export const verifySign = (req, res, next) => {
   let { phoneNo, publicKey, signature } = req.body;

   publicKey = crypto.createPublicKey({
      key: Buffer.from(publicKey, "base64"),
      type: "spki",
      format: "der",
   });

   const verify = crypto.createVerify("SHA256");
   verify.update(phoneNo.toString());
   verify.end();

   let result = verify.verify(publicKey, Buffer.from(signature, "base64"));

   res.status(200).json({ result });
};

// Register
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

      // Signature Generation using crypto package!
      let { privateKey } = req.body;

      privateKey = crypto.createPrivateKey({
         key: Buffer.from(privateKey, "base64"),
         type: "pkcs8",
         format: "der",
      });

      console.log(phoneNo.toString());
      const sign = crypto.createSign("SHA256");
      sign.update(phoneNo.toString());
      sign.end();
      const signature = sign.sign(privateKey).toString("base64");

      let user = await User.findOne({ email });

      if (user) return next(new ErrorHandler("user already exist!", 400));

      const hashedpassword = await bcrypt.hash(password, 10);

      if (
         !deviceDetails.id ||
         !deviceDetails.os ||
         !deviceDetails.version ||
         !deviceDetails.manufacturer ||
         !deviceDetails.model
      ) {
         return next(
            new ErrorHandler("please provide valid device details!", 400)
         );
      }

      const hashedDid = await bcrypt.hash(deviceDetails.id, 10);
      const hashedDos = await bcrypt.hash(deviceDetails.os, 10);
      const hashedDversion = await bcrypt.hash(deviceDetails.version, 10);
      const hashedDmanufacturer = await bcrypt.hash(
         deviceDetails.manufacturer,
         10
      );
      const hashedDmodel = await bcrypt.hash(deviceDetails.model, 10);

      // Generating Upi Id
      const upiId = phoneNo.toString() + "@xyzbanking";

      user = await User.create({
         deviceDetails: {
            id: hashedDid,
            os: hashedDos,
            version: hashedDversion,
            manufacturer: hashedDmanufacturer,
            model: hashedDmodel,
         },
         email,
         phone: phoneNo,
         upiId: upiId,
         password: hashedpassword,
         verified: false,
      }).then((result) => {
         console.log(result);
         // const d = (req.session.myData = result._id);
         // console.log(req.session.myData);
         sendOtp(result, res, next, signature);
         // console.log(d);
      });
   } catch (error) {
      next(error);
   }
};

//send otp verification email
const sendOtp = async ({ _id, email }, res, next, signature) => {
   try {
      const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
      const mailOptions = {
         from: "banking@gmail.com",
         to: email,
         subject: "Verify Your Email",
         html: ` <p style={{ color: "red" }}>
          <b>${otp}</b> in the app to verify your email address and complete the verification
        </p>`,
      };

      //hash otp
      const saltRounds = 10;
      const hashedOtp = await bcrypt.hash(otp, saltRounds);

      await OtpVerification.create({
         userId: _id,
         otp: hashedOtp,
         createdAt: Date.now(),
         expiresAt: Date.now() + 3600000,
      });

      await transporter.sendMail(mailOptions);

      res.status(250).json({
         status: "PENDING",
         message: "Verification otp email sent",
         data: {
            userId: _id,
            email,
            // signature sent to user
            signature,
         },
      });
   } catch (error) {
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

      if (!userId || !otp) {
         return next(new ErrorHandler("Empty otp details are not allowed!", 400));
      } else {
         const OtpVerificationRecords = await OtpVerification.find({ userId });


         if (!OtpVerificationRecords) {
            return next(
               new ErrorHandler(
                  "Account record doesn't exist or has been verified already . Please sign up or logIn!",
                  400
               )
            );
         } else {
            const { expiresAt } = OtpVerificationRecords[0];
            const hashedOtp = OtpVerificationRecords[0].otp;

            if (expiresAt < Date.now()) {
               //for delete expiried otp
               await OtpVerification.deleteMany({ userId });
               return next(
                  new ErrorHandler("Code Has Expired , Please Try again!", 400)
               );
            } else {
               const validOtp = await bcrypt.compare(otp, hashedOtp);

               if (!validOtp) {
                  return next(new ErrorHandler("Invalid Code Passed!", 400));
               } else {
                  //success
                  const sentCookie = jwt.sign({ _id: userId }, "dbdhbzssm");

                  res
                     .status(200)
                     .cookie("userId", sentCookie, {
                        httpOnly: "true",
                        maxAge: 3600 * 1000,
                     })
                     .json({
                        success: true,
                        message: "cookie sent & userVerified",
                     });

                  await User.updateOne({ _id: userId }, { verified: true });
                  await OtpVerification.deleteOne({ userId });
                  await req.session.destroy();
               }
            }
         }
      }
   } catch (error) {
      next(error);
   }
};

// Login
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

      const user = await User.findOne({ email: email });

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
         },
         "somesupersecretsecret",
         { expiresIn: "1h" }
      );

      res.status(200).json({
         token: token,
         userId: user._id.toString(),
         message: "Login Sucessfully!",
      });
   } catch (err) {
      if (!err.statusCode) {
         err.statusCode = 500;
      }
      next(err);
   }
};

// Complete Profile
export const completeProfile = async (req, res, next) => {
   const errors = validationResult(req);

   if (!errors.isEmpty()) {
      console.log(errors);
      const error = new Error("Validation Failed!");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
   }

   if (!req.file) {
      const error = new Error("No image provided.");
      error.statusCode = 422;
      return next(error);
   }

   const { userId, name, address, dob, bank, upipin } = req.body;
   const imageUrl = req.file.path.replace("\\", "/");

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
   } catch (err) {
      if (!err.statusCode) {
         err.statusCode = 500;
      }
      next(err);
   }
};

// Gives user Profile details using user id
export const getProfileDetails = (req, res, next) => {
   const userId = req.params.userId;

   User.findOne({ _id: userId })
      .then((user) => {
         if (!user) {
            const error = new Error("User does not exits!");
            error.status = 404;
            return next(error);
         }

         res.status(200).json({ message: "User details fetched!", user: user });
      })
      .catch((err) => {
         if (!err.statusCode) {
            // Server side error
            err.statusCode = 500;
         }
         next(err);
      });
};

// Gives user Profile details using email
export const getProfileDetailsUsingEmail = (req, res, next) => {
   const email = req.params.email;

   User.findOne({ email: email })
      .then((user) => {
         if (!user) {
            const error = new Error("User does not exits!");
            error.status = 404;
            return next(error);
         }

         res.status(200).json({ message: "User details fetched!", user: user });
      })
      .catch((err) => {
         if (!err.statusCode) {
            // Server side error
            err.statusCode = 500;
         }
         next(err);
      });
};
