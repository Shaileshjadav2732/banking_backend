import { validationResult } from "express-validator";
import { User } from "../model/user.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { decryptData } from "../utils/decrypt.js";
import nodemailer from "nodemailer";
import { Transaction } from "../model/transaction.js";
import { config } from "dotenv";

config({
  path: "./data/config.env",
});

// Declare the nodemailer that we are using brevo(speciflying all brevo credentials) as our server to send emails
let transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.Brevo_USER, // generated ethereal user
    pass: process.env.Brevo_PASSWORD, // generated ethereal password
  },
});

// Generating KEY Pairs
export const generateSignature = (req, res, next) => {
  const { senderId } = req.body;
  let { privateKey } = req.body;
  //   console.log(privateKey);

  privateKey = crypto.createPrivateKey({
    key: Buffer.from(privateKey, "base64"),
    type: "pkcs8",
    format: "der",
  });

  //   console.log(senderId.toString());
  const sign = crypto.createSign("SHA256");
  sign.update(senderId.toString());
  sign.end();
  const signature = sign.sign(privateKey).toString("base64");

  res.status(201).json({
    message: "Signature generated Successfully!",
    signature: signature,
  });
};

// Verify Sign
const verifySign = (userId, publicKey, signature) => {
  //   let { userId, publicKey, signature } = req.body;

  publicKey = crypto.createPublicKey({
    key: Buffer.from(publicKey, "base64"),
    type: "spki",
    format: "der",
  });

  const verify = crypto.createVerify("SHA256");
  verify.update(userId.toString());
  verify.end();

  let result = verify.verify(publicKey, Buffer.from(signature, "base64"));

  return result;
};

// Make transaction using acc no
export const makeTranscationUsingAccNo = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    const error = new Error(errors.errors[0].msg);
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  const { senderId, acNo, upiPin, title, amount, publicKey, signature } =
    req.body;

  try {
    const result = verifySign(senderId, publicKey, signature);
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
      return User.findOne({ _id: acNo });
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
      transaction.receiverId = acNo;
      transaction.title = title;
      transaction.amount = amount;
      return transaction.save();
    })
    .then((result) => {
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
};

// Using PhoneNo
export const makeTranscationUsingPhoneNo = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    const error = new Error(errors.errors[0].msg);
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  const { senderId, phone, upiPin, title, amount, publicKey, signature } =
    req.body;

  try {
    const result = verifySign(senderId, publicKey, signature);
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
