import BaseSchema from "#models/base";
import mongoose from "mongoose";
import uploadFile from "#utils/uploadFile";
import deleteAssociatedFiles from "#utils/removeFile";

const ProductSchema = new BaseSchema({
  name: {
    type: String,
    // required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["available", "unavailable", "out of stock"],
    default: "available",
  },
  image: {
    type: String,
    trim: true,
    file: true,
  },
  category: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

ProductSchema.pre("save", uploadFile);
ProductSchema.pre("deleteOne", deleteAssociatedFiles);
const Product = mongoose.model("Product", ProductSchema);

export default Product;
