import { sendResponse } from "#utils/response";
import CartService from "#services/cart";
import httpStatus from "#utils/httpStatus";
import asyncHandler from "#utils/asyncHandler";

export const get = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const filter = req.query;
  const data = await CartService.get(id, filter);
  sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
});

export const create = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { id: productId } = req.params;
  const {
    message,
    data: createdData,
    httpStatus: status,
  } = await CartService.create(userId, productId);
  sendResponse(status, res, createdData, message);
});

export const update = asyncHandler(async (req, res, next) => {
  const { id: productId } = req.params;
  const userId = req.user._id;
  const data = await CartService.removeItemFromCart(userId, productId);
  sendResponse(
    httpStatus.OK,
    res,
    data,
    "Course removed from cart successfully"
  );
});

export const deleteData = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const data = await CartService.emptyCart(userId);
  sendResponse(httpStatus.OK, res, null, "Cart emptied successfully");
});

export const getUsersCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const data = await CartService.getUsersCart(userId);
  sendResponse(httpStatus.OK, res, data, "Cart fetched successfully");
});
