import jwt from "jsonwebtoken";
import env from "#configs/env";
import User from "#models/user";

export const createToken = (payload, secret = env.JWT_SECRET, options) => {
  const token = jwt.sign(payload, secret, { ...options });
  return token;
};
export const createAccessOrRefreshToken = async (user_id) => {
  const user = await User.findById(user_id);
  if (!user) {
    throw new Error("User not found");
  }
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};
export const verifyToken = (token, secret = env.ACCESS_TOKEN_SECRET) => {
  try {
    const payload = jwt.verify(token, secret);
    return payload;
  } catch (err) {
    throw new Error("Invalid token please login again");
  }
};
