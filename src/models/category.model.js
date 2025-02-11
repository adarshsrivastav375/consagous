import mongoose from "mongoose";
import BaseSchema from "#models/base";

const CategorySchema = new BaseSchema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Category = mongoose.model("Category", CategorySchema);
export default Category;
