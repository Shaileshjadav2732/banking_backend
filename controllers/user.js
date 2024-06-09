import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../model/user.js";
import ErrorHandler from "../middleware/errror.js";
import { otpVerification } from "../model/otpver.js";
import transporter from "../app.js";

export const register = async (req, res, next) => {

   try {
      const { deviceDetails, phoneNo, email, password } = req.body;

      let user = await User.findOne({ email });

      if (user) return next(new ErrorHandler("User Already Exist", 400));

      const hashedPassword = await bcrypt.hash(password, 10);
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

      const upiId = await phoneNo.toString() + "@xyzbanking";

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
         password: hashedPassword,
         verified: false,
      }).then((result) => {
         console.log(result);
         res.status(201).json({
            success: true,
            message: "You Are Registered Successfully!"
         })
      })
      sendOtp(result, res, next);
   } catch (error) {
      next(error)
   }

}


export const sendOtp = async ({ _id,email }, res, next) => {

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

      const saltRounds = 10;
      const hashedOtp = await bcrypt.hash(otp, saltRounds);

      otpVerification.create({
         userId: _id,
         otp: hashedOtp,
         createdAt: Date.now(),
         expiresAt: Date.now() + 60 * 60 * 1000
      })

      await transporter.sendMail(mailOptions);

    email = res.status(250).json({
         status: "PENDING",
         message: "Verification",
         data: {
            userId: _id,
            email
         }
      })
      console.log(email)
   } catch (error) {
      next(error)
   }

}
export const verifyOtp = async (req, res, next) => {
   try {
      const { otp, userId } = req.body;

      if (!userId || !otp) {
         return next(new ErrorHandler("Empty OTP details are not allowed!", 400));
      }

      const otpVerificationRecords = await otpVerification.find({ userId });

      if (otpVerificationRecords.length === 0) {
         return next(
            new ErrorHandler(
               "Account record doesn't exist or has been verified already. Please sign up or log in!",
               400
            )
         );
      }

      const { expiresAt, otp: hashedOtp } = otpVerificationRecords[0];

      if (expiresAt < Date.now()) {
         await otpVerification.deleteMany({ userId });
         return next(new ErrorHandler("Code has expired, please try again!", 400));
      }

      const validOtp = await bcrypt.compare(otp, hashedOtp);

      if (!validOtp) {
         return next(new ErrorHandler("Invalid code passed!", 400));
      }

      const token = jwt.sign({ _id: userId }, "jdfkwfhwufh");

      res
         .status(200)
         .cookie("userId", token, {
            httpOnly: true,
            maxAge: 3600 * 1000,
         })
         .json({
            success: true,
            message: "Cookie sent & user verified",
         });

      await User.updateOne({ _id: userId }, { verified: true });
      await otpVerification.deleteOne({ userId });
   } catch (error) {
      next(error);
   }
};
