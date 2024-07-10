import mongoose from "mongoose";

const schema = mongoose.Schema({
  userId: String,
  otp: String,
  createdAt: Date,
  expiresAt: Date,
});

export const OtpVerification = mongoose.model("OtpVerification", schema);
