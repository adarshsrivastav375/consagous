import mongoose from "mongoose";
import BaseSchema from "#models/base";

const orderSchema = new BaseSchema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  transactionId: {
    type: String,
    default: "",
  },
  courses: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
    ],
    default: [],
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["initiated", "processing", "completed", "cancelled"],
    default: "initiated",
  },
  paymentStatus: {
    type: String,
    // enum: ["PENDING", "completed", "failed"],
    default: "PENDING",
  },
  paymentDetails: {
    type: Object,
    required: true,
    default: {},
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
