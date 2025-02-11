import { sendResponse } from "#utils/response";
import UserService from "#services/user";
import httpStatus from "#utils/httpStatus";
import asyncHandler from "#utils/asyncHandler";

export const get = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const filter = req.query;
  const data = await UserService.get(id, filter);
  sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
});

export const getCurrentUser = asyncHandler(async (req, res, next) => {
  const { user } = req;
  sendResponse(httpStatus.OK, res, user);
});

export const getUserByRole = asyncHandler(async (req, res, next) => {
  const { role } = req.params;
  const filter = req.query;
  const salesPersonData = await UserService.getUserByRole(filter, role);
  sendResponse(
    httpStatus.OK,
    res,
    salesPersonData,
    "Record fetched successfully"
  );
});
export const getAdmins = asyncHandler(async (req, res, next) => {
  const filter = req.query;
  const admins = await UserService.getAdmins(filter);
  sendResponse(httpStatus.OK, res, admins, "Record fetched successfully");
});

export const sendSignupOtpEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const otpData = await UserService.signUpOtp(email);
  sendResponse(httpStatus.OK, res, null, "Otp sent successfully");
});

export const login = asyncHandler(async (req, res, next) => {
  const userData = req.body;
  const loginData = await UserService.loginUser(userData);
  sendResponse(httpStatus.OK, res, loginData, "Logged in successfully");
});
export const AdminLogin = asyncHandler(async (req, res, next) => {
  const userData = req.body;
  const loginData = await UserService.loginAdmin(userData);
  sendResponse(httpStatus.OK, res, loginData, "Logged in successfully");
});

export const forgotPass = asyncHandler(async (req, res, next) => {
  const userData = req.body;
  const otpData = await UserService.forgotPasswordRequest(userData);
  sendResponse(httpStatus.OK, res, otpData, "Otp sent successfully");
});

export const verifyPasswordResetOtp = asyncHandler(async (req, res, next) => {
  const otpData = req.body;
  const tokenData = await UserService.verifyOTP(otpData);
  sendResponse(httpStatus.OK, res, tokenData, "Otp verified successfully");
});

export const resetPass = asyncHandler(async (req, res, next) => {
  const userData = req.body;
  await UserService.changePassword(userData);
  sendResponse(httpStatus.OK, res, null, "Password changed successfully");
});

export const create = asyncHandler(async (req, res, next) => {
  const data = req.body;
  const createdData = await UserService.create(data);
  sendResponse(
    httpStatus.CREATED,
    res,
    createdData,
    "Record created successfully"
  );
});
export const createUserByAdmin = asyncHandler(async (req, res, next) => {
  const data = req.body;
  const createdData = await UserService.createUser(data);
  sendResponse(
    httpStatus.CREATED,
    res,
    createdData,
    "Record created successfully"
  );
});

export const update = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const data = req.body;
  const updatedData = await UserService.update(id, data);
  sendResponse(httpStatus.OK, res, updatedData, "Record updated successfully");
});

export const deleteData = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await UserService.deleteDoc(id);
  sendResponse(httpStatus.NO_CONTENT, res, null, "Record deleted successfully");
});
