import { body } from "express-validator";
import express from "express";
import { isAuth } from "../middlewares/is-auth.js";

import {
  register,
  verifyotp,
  generateKeyPairs,
  verifySign,
  login,
  completeProfile,
  getProfileDetails,
  getProfileDetailsUsingEmail,
} from "../controllers/user.js";
import { User } from "../model/user.js";

const router = express.Router();

// prefix route is-> /user

router.get("/keyGeneration", generateKeyPairs);

router.post("/verify", verifySign);

router.put(
  "/register",
  [
    body("deviceDetails", "Please provide valid device details!")
      .not()
      .isEmpty()
      .isObject(),
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email!")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("User already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("phoneNo", "Please provide valid mobile number!")
      .custom((value, { req }) => {
        return User.findOne({ phone: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Phone no already exists!");
          }
        });
      })
      .isNumeric()
      .not()
      .isEmpty()
      .isLength({ min: 10, max: 10 }),
    body("password", "Password must be 8 characters long!")
      .trim()
      .isLength({ min: 8 }),
  ],
  register
);

router.post("/verifyotp", [body("otp").not().isEmpty().isNumeric()], verifyotp);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email!")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject("User does not exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password", "Password must be 8 characters long!")
      .trim()
      .isLength({ min: 8 }),
  ],
  login
);

router.post(
  "/completeProfile",
  isAuth,
  [
    body("userId").custom((value, { req }) => {
      return User.findOne({ _id: value }).then((userDoc) => {
        if (!userDoc) {
          return Promise.reject("User does not exists!");
        }
      });
    }),
    body("name").isLength({ min: 5 }).withMessage("Please enter your name!"),
    body("address")
      .isLength({ min: 10 })
      .withMessage("Address must not be empty"),
    body("dob").isDate().withMessage("please enter valid birth date"),
    // body("bank").not().isEmpty().withMessage("Please choose a bank"),
    body("upipin", "Upi Pin must be 6 characters long")
      .trim()
      .isLength({ min: 6, max: 6 }),
  ],
  completeProfile
);

router.get("/getProfileDetails/:userId", isAuth, getProfileDetails);
router.get("/getProfileDetailsUsingEmail/:email", getProfileDetailsUsingEmail);
export default router;
