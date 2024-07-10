import ErrorHandler from "../middlewares/error.js";
import { Adminmodal } from "../model/admin.js";
import { Transaction } from "../model/transaction.js";
import { User } from "../model/user.js";
import { sendCookie } from "../utils/features.js";
import jwt from "jsonwebtoken";

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Adminmodal.findOne({ email });
    console.log(admin);

    // if (!admin) return next(new ErrorHandler("Admin can't find", 400));

    if (email === admin.email && password === admin.password) {
      sendCookie(admin, res, `Welcome Back ${admin.name}`, 200);
    } else {
      return next(new ErrorHandler("Invalid email or password!", 400));
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logOut = async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      httpOnly: "true",
      sameSite: "none",
      secure: true,
    })
    .json({
      success: true,
    });
};

export const allusers = async (req, res, next) => {
  try {
    const users = await User.find().lean();

    res.status(200).json({
      message: "success",
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getprofile = async (req, res, next) => {
  try {
    // const { token } = req.cookies;

    // if (!token) {
    //   return res.status(404).json({
    //     success: "false",
    //     message: "Login first!",
    //   });
    // }
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // const admin = await Adminmodal.findById(token);

    res.status(200).json({
      message: "success",
      // admin: admin,
      admin: req.admin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.find().lean();

    res.status(200).json({
      message: "success",
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteuser = async (req, res, next) => {
  try {
    const { _id } = req.body;
    // console.log(token);
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ _id });
    if (!user) return next(new ErrorHandler("user does not exist", 400));

    await user.deleteOne();
    res.status(200).json({
      success: "True",
      message: "User is Deleted",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// export const editUser = async (req, res, next) => {
//   try {
//     const { _id, dob, address } = req.body;
//     if(!_id){
//       return next(new ErrorHandler("User Can't be found", 400));
//     }
//     if (!req.file) {
//       return next(new ErrorHandler("Image is required", 400));
//     }
//     const imageUrl = req.file.path.replace("\\", "/");

//     const user = await User.findOne({ _id });
//     if (!user) return next(new ErrorHandler("user does not exist", 400));

//     await User.updateOne(
//       { dob: dob },
//       { address: address },
//       { image: imageUrl }
//     );

//     res
//       .status(201)
//       .json({ message: "User Details Updated!", status: "Success" });
//   } catch (error) {
//     next(error);
//   }
// };

export const getuserTransaction = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) return next(new ErrorHandler("user not found!", 404));

    const transaction = await Transaction.find(
      { senderId: id } || { receiverId: id }
    );

    if (!transaction)
      return next(new ErrorHandler("Transaction not found", 404));

    res.status(200).json({
      message: "success",
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
