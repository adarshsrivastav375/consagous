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
export const getUserOrders = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const filter = req.query;
  const data = await OrderService.getUserOrders(user._id, filter);
  sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
});

export const getBestSellingProducts = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const filter = req.query;
  const data = await OrderService.getBestSellingProducts(filter);
  sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
});

export const getOrdersWithMonthlySummary = asyncHandler(
  async (req, res, next) => {
    const user = req.user;
    const filter = req.query;
    const data = await OrderService.orderswithMonthlySummary(user._id, filter);
    sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
  }
);
export const getSalesData = asyncHandler(async (req, res, next) => {
  const { category, sortBy } = req.query; // Get filters from query params
  const data = await OrderService.getTotalSales({ category, sortBy });
  sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
});

export const create = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const data = await OrderService.create(user);
  sendResponse(httpStatus.OK, res, data, "Record created successfully");
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
