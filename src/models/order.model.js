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
  products: {
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1, // Ensure at least 1 item is ordered
        },
      },
    ],
    default: [],
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["initiated", "processing", "completed", "cancelled"],
    default: "initiated",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
