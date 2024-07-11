import mongoose from "mongoose";

const schema = mongoose.Schema({
  name: String,
  email:String,
  password:String
});

export const Adminmodal = mongoose.model("Admin", schema);
