import express from "express"
import userRouter from "./routes/user.js";
import cookieParser from "cookie-parser"
import nodemailer from "nodemailer"
export const app = express();

app.use(express.json());
app.use(cookieParser());


app.use("/api/v1/users", userRouter);




const transporter = nodemailer.createTransport({
   host: process.env.SMTP_HOST,
   port: process.env.SMTP_PORT,
   secure: false, // true for 465, false for other ports
   auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
   },
});

export default transporter;

