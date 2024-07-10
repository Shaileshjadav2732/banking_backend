import mongoose, { Schema } from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    senderId: {
      type: Number,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: Number,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
