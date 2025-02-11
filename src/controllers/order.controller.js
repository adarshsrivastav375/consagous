import { sendResponse } from "#utils/response";
import OrderService from "#services/order";
import httpStatus from "#utils/httpStatus";
import asyncHandler from "#utils/asyncHandler";

export const get = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const filter = req.query;
  const data = await OrderService.get(id, filter);
  sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
});

export const getLimitedFields = asyncHandler(async (req, res, next) => {
  const fields = req.params;
  const data = await OrderService.getLimitedOrderFields(fields);
  sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
});

export const create = asyncHandler(async (req, res, next) => {
  const {cartId} = req.params;
  const createdData = await OrderService.create(cartId);
  req.order = createdData;
  return next();
});

export const update = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const data = req.body;
  const updatedData = await OrderService.update(id, data);
  sendResponse(httpStatus.OK, res, updatedData, "Record updated successfully");
});

export const deleteData = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await OrderService.deleteDoc(id);
  sendResponse(httpStatus.OK, res, null, "Record deleted successfully");
});
