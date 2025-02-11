import mongoose from "mongoose";
import BaseSchema from "#models/base";

const CartSchema = new BaseSchema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  products: {
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          min: [1, "Quantity must be at least 1"],
        },
      },
    ],
    _id: false,
    default: [],
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
});

// Update totalAmount and totalItems when cart is modified
CartSchema.methods.updateCartValues = async function () {
  await this.populate("products.product", "price");

  let totalAmount = 0;
  let totalItems = 0;

  this.products.forEach((item) => {
    totalAmount += item?.product?.price * item.quantity;
    totalItems += item?.quantity;
  });

  this.totalAmount = totalAmount;
  this.totalItems = totalItems;
};

// Automatically update values before saving
CartSchema.pre("save", async function (next) {
  await this.updateCartValues();
  next();
});

const Cart = mongoose.model("Cart", CartSchema);
export default Cart;
