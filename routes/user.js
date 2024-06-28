import { completeProfile, getProfileDetails, getProfileDetailsUsingEmail, login, register, sendOtp } from "../controllers/user.js";
import express from "express";
import { verifyOtp } from "../controllers/user.js";
import { isAuth } from "../middleware/is-auth.js";

const router = express.Router();

// prefix route is-> /users

router.post("/register", register);

// router.post("/verifyotp", verifyotp);
router.post("/login",login)
router.post("/verifyotp", verifyOtp);
router.post("/sendotp",sendOtp);

router.post("/completeProfile",completeProfile);
router.get("/getProfileDetails/:userId",isAuth,getProfileDetails);

router.get("/getProfileDetailsUsingEmail/:email", getProfileDetailsUsingEmail);

export default router;  