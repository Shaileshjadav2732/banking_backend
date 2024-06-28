import { body, param } from "express-validator";
import express from "express";
import { isAuth } from "../middleware/is-auth.js";
import {
   getTransactionDetailsReceive,
   getTransactionDetailsSent,
   makeTransactionUsingAccNo,
   makeTransactionUsingPhoneNo
} from "../controllers/transaction.js";
import { User } from "../model/user.js";

const router = express.Router();


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
   makeTransactionUsingAccNo
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
   makeTransactionUsingPhoneNo
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
