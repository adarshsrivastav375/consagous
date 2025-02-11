import bcrypt from "bcryptjs";
import Role from "#models/role";
import mongoose, { Schema } from "mongoose";
import BaseSchema from "#models/base";
import httpStatus from "#utils/httpStatus";
import uploadFile from "#utils/uploadFile";
import jwt from "jsonwebtoken";
import env from "#configs/env";


const userSchema = new BaseSchema({
  // Personal Details
  socialId: {
    type: String,
    trim: true,
    default: '',
  },
  provider: {
    type: String,
    trim: true,
    default: '',
  },
  name: {
    type: String,
    trim: true,
  },
  profilePic: {
    type: String,
    file: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowerCase: true,
  },
  // Role
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Role,
    required: true,
  },
  // Active Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  // Authentication
  password: {
    type: String,
    trim: true,
  },
  refreshToken: {
    type: String,
  },
});

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.pre("save", uploadFile);

userSchema.statics.findUserById = async function (id) {
  const user = await this.findById(id);
  if (!user) {
    throw {
      status: false,
      message: "User not found",
      httpStatus: httpStatus.NOT_FOUND,
    };
  }
  return user;
};

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ userId: this._id }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ userId: this._id }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export default mongoose.model("User", userSchema);
