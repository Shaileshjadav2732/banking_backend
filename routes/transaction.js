import { body, param } from "express-validator";
import express from "express";
import { isAuth } from "../middlewares/is-auth.js";
import {
  generateSignature,
  getTransactionDetailsReceive,
  getTransactionDetailsSent,
  makeTranscationUsingAccNo,
  makeTranscationUsingPhoneNo,
} from "../controllers/transaction.js";
import { User } from "../model/user.js";

const router = express.Router();

router.post("/generateSignature", isAuth, generateSignature);

// Using Acc No
router.put(
  "/makeTranscationUsingAccNo",
  isAuth,
  [
    body("acNo")
      .custom((value, { req }) => {
        return User.findOne({ _id: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject("User does not exists!");
          }
        });
      })
      .not()
      .isEmpty(),
    body("title").not().isEmpty(),
    body("amount").not().isEmpty(),
  ],
  makeTranscationUsingAccNo
);

// Using Phone No
router.put(
  "/makeTranscationUsingPhoneNo",
  isAuth,
  [
    body("phone")
      .custom((value, { req }) => {
        return User.findOne({ phone: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject("User does not exists!");
          }
        });
      })
      .not()
      .isEmpty(),
    body("title").not().isEmpty(),
    body("amount").not().isEmpty(),
  ],
  makeTranscationUsingPhoneNo
);

router.get(
  "/getHistorySent/:userId",
  isAuth,
  [
    param("userId").custom((value, { req }) => {
      return User.findById(value).then((userDoc) => {
        if (!userDoc) {
          return Promise.reject("User does not exists!");
        }
      });
    }),
  ],
  getTransactionDetailsSent
);

router.get(
  "/getHistoryReceive/:userId",
  isAuth,
  [
    param("userId").custom((value, { req }) => {
      return User.findById(value).then((userDoc) => {
        if (!userDoc) {
          return Promise.reject("User does not exists!");
        }
      });
    }),
  ],
  getTransactionDetailsReceive
);

export default router;
