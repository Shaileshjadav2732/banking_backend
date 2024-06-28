import { validationResult } from "express-validator";
import nodemailer from "nodemailer";
import { User } from "../model/user.js";
import { config } from "dotenv";
import bcrypt from "bcrypt";

config({
   path: "./data/config.env",
});



// Declare the nodemailer that we are using brevo(speciflying all brevo credentials) as our server to send emails



config({ path: './data/config.env' });

 const transporter = nodemailer.createTransport({
   service: "Gmail",
   port: 587,
   auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
   },
});


// export const generateSignature=(req,res,next)=>{
// const{sendId}=req.body;
// let {privatekey}=req.body;


export const makeTransactionUsingAccNo = (req, res, next) => {
   const errors = validationResult(req);
   try {

      if (!errors.isEmpty) {
         console.log(errors);
         const error = new Error(errors.errors[0].msg);
         error.statusCode = 422;
         error.data = errors.array();
         return next(error);

      }
   } catch (error) {
      return next(err);
   }


   const { senderId, acNo, upiPin, title, amount } = req.body;

   const decryptPIN = decryptData(upiPin);
   let user;
   let receiverUser;

   return User.finOne({ _id: senderId })
      .then((userDoc) => {
         if (amount > userDoc.wallet) {
            const error = new Error("Does not have enough balance!");
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
         }
         user = userDoc;
         return bcrypt.compare(decryptPIN, userDoc.upiPin);

      }).
      then((isEqual) => {
         if (!isEqual) {
            const error = new Error("Incorrect UPI PIN");
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
         }
      })
      .then(() => {
         user.wallet = user.wallet - amount;
         return user.save();
      }).then(() => {
         return User.findOne({ _id: acNo });
      }).then((user) => {
         receiverUser = user;
         const updateWallet = Number(user.wallet) + Number(amount);
         user.wallet = updateWallet;
         return user.save();
      }).then(() => {
         const transaction = new Transaction();
         transaction.senderId = senderId;
         transaction.receiverId = receiverUser._id;
         transaction.title = title;
         transaction.amount = amount;
         return transaction.save();
      }).then((result) => {
         transporter.sendMail({
            from: '"XYZBanking" xyzbanking@gmail.com', // sender address
            to: user.email, // list of receivers
            subject: "DEBITED Money from XYZBanking 💸", // Subject line
            text: `Hello  ${user.name},your account has been debited by ${amount}₹ to account number ${acNo} (the transaction id is ${result._id}), Total available balance is ${user.wallet}₹.`, // plain text body
         });
         return result;
      })
      .then((result) => {
         transporter.sendMail({
            from: '"XYZBanking" xyzbanking@gmail.com', // sender address
            to: receiverUser.email, // list of receivers
            subject: "CREDITED Money to your account in XYZBanking 💵🤑", // Subject line
            text: `Hello  ${receiverUser.name},your account has been credited by ${amount}₹ from account number ${user._id} (the transaction id is ${result._id}), Total available balance is ${receiverUser.wallet}₹.`, // plain text body
         });
         return result;
      })
      .then((result) => {
         res
            .status(201)
            .json({ message: "transcation made successfully!", result: result });
      })
      .catch((err) => {
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
}

// Get sent Transaction
export const getTransactionDetailsSent = async (req, res, next) => {
   const userId = req.params.userId;

   const transcations = await Transaction.find({ senderId: userId })
      .populate("senderId")
      .populate("receiverId");

   res
      .status(200)
      .json({ message: "Transactions Fetched!", transcations: transcations });
};

export const makeTransactionUsingPhoneNo = async (req, res, next) => {
   const errors = validationResult(req);

   if (!errors.isEmpty()) {
      console.log(errors);
      const error = new Error(errors.errors[0].msg);
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
   }
   const { senderId, phone, upiPin, title, amount } =
      req.body;
   try {

      if (result === false) {
         const error = new Error("Digital signature Verification failed!");
         error.statusCode = 422;
         error.data = errors.array();
         return next(error);
      }
   } catch (err) {
      return next(err);
   }

   const decryptPIN = decryptData(upiPin);

   let user;
   let receiverUser;
   return User.findOne({ _id: senderId })
      .then((userDoc) => {
         if (amount > userDoc.wallet) {
            const error = new Error("Does not have enough balance!");
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
         }

         user = userDoc;
         return bcrypt.compare(decryptPIN, userDoc.upipin);
      })
      .then((isEqual) => {
         if (!isEqual) {
            const error = new Error("Incorrect UPI PIN!");
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
         }
      })
      .then(() => {
         user.wallet = user.wallet - amount;
         return user.save();
      })
      .then(() => {
         return User.findOne({ phone: phone });
      })
      .then((user) => {
         receiverUser = user;
         const updatedWallet = Number(user.wallet) + Number(amount);
         user.wallet = updatedWallet;
         return user.save();
      })
      .then(() => {
         const transaction = new Transaction();
         transaction.senderId = senderId;
         transaction.receiverId = receiverUser._id;
         transaction.title = title;
         transaction.amount = amount;
         return transaction.save();
      })
      .then((result) => {
         transporter.sendMail({
            from: '"XYZBanking" xyzbanking@gmail.com', // sender address
            to: user.email, // list of receivers
            subject: "DEBITED Money from XYZBanking 💸", // Subject line
            text: `Hello  ${user.name},your account has been debited by ${amount}₹ to UPI ID ${receiverUser.upiId} (the transaction id is ${result._id}), Total available balance is ${user.wallet}₹.`, // plain text body
         });
         return result;
      })
      .then((result) => {
         transporter.sendMail({
            from: '"XYZBanking" xyzbanking@gmail.com', // sender address
            to: receiverUser.email, // list of receivers
            subject: "CREDITED Money to your account in XYZBanking 💵🤑", // Subject line
            text: `Hello  ${receiverUser.name},your account has been credited by ${amount}₹ from UPI ID  number ${user.upiId} (the transaction id is ${result._id}), Total available balance is ${receiverUser.wallet}₹.`, // plain text body
         });
         return result;
      })
      .then((result) => {
         res
            .status(201)
            .json({ message: "transcation made successfully!", result: result });
      })
      .catch((err) => {
         if (!err.statusCode) {
            err.statusCode = 500;
         }
         next(err);
      });
};


// Get receive Transaction
export const getTransactionDetailsReceive = async (req, res, next) => {
   const userId = req.params.userId;

   const transcations = await Transaction.find({ receiverId: userId })
      .populate("senderId")
      .populate("receiverId");

   res
      .status(200)
      .json({ message: "Transactions Fetched!", transcations: transcations });
};
