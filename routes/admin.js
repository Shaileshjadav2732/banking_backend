import express from "express";
import {
   signIn,
   logOut,
   allusers,
   getprofile,
   deleteuser,
   getuserTransaction,
   getTransaction,
} from "../controllers/admin.js";

import { isAuth } from "../controllers/authadmin.js";
export const router = express.Router();

router.post("/login", signIn);
router.get("/logout", logOut);
router.get("/allusers", isAuth, allusers);
router.get("/profile", isAuth, getprofile);
router.get("/transaction", isAuth, getTransaction);
router.post("/usertran", isAuth, getuserTransaction);
// router.patch("/edituser",isAuth , editUser);
router.delete("/deleteuser", deleteuser);