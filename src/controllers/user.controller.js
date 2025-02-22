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
