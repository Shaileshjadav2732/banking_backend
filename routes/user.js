import { register, sendOtp } from "../controllers/user.js";
import express from "express";
import { verifyOtp } from "../controllers/user.js";

const router = express.Router();

// prefix route is-> /users

router.post("/register", register);
// router.post("/verifyotp", verifyotp);

router.post("/verifyotp", verifyOtp);
router.post("/sendotp",sendOtp)

export default router;