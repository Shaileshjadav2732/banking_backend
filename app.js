import express from "express"
import userRouter from "./routes/user.js";
import cookieParser from "cookie-parser"
import nodemailer from "nodemailer"
import { config } from "dotenv";
import transactionRoutes from "./routes/transaction.js";
export const app = express();


app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRouter);

config({
   path: "./data/config.env",
});


//made prefix route so now we not have to write again and again same path for user/...
app.use("/users", userRouter);
app.use("/transaction", transactionRoutes);
export const transporter = nodemailer.createTransport({
   service: "Gmail",
   port: 587,
   auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
   },
});


export default transporter;

