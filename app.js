import cookieParser from "cookie-parser";
import express from "express";
import userRouter from "./routes/user.js";
import { errorMiddleWare } from "./middlewares/error.js";
import cors from "cors";
import session from "express-session";
import { config } from "dotenv";
import nodemailer from "nodemailer";
import multer from "multer";
import { uuid } from "uuidv4";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { router as adminRouter } from "./routes/admin.js";
import transactionRoutes from "./routes/transaction.js";

export const app = express();

//use middleWare for getData from postman!  // this use before the make router..
app.use(express.json());
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(null, uuid());
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));


app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: 'File upload error', message: err.message });
  } else {
    next(err);
  }
});

config({
  path: "./data/config.env",
});

//for deployment
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", //we can give specific domain , that only take accept the request from that specific domain
    methods: ["GET", "PUT", "DELETE", "POST","PATCH"],
    credentials: true, //for get header details like cookie...
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Set up express-session middleware
app.use(
  session({
    secret: "shailesh", // Use a random string for better security
    resave: false,
    saveUninitialized: false,
  })
);


export const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 587,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

//using error middleware
app.use(errorMiddleWare);
