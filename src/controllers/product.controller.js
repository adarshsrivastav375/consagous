import { sendResponse } from "#utils/response";
import ProductService from "#services/product";
import httpStatus from "#utils/httpStatus";
import asyncHandler from "#utils/asyncHandler";
import { productValidation } from "#validations/input";

export const get = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const filter = req.query;
  const data = await ProductService.get(id, filter);
  sendResponse(httpStatus.OK, res, data, "Record fetched successfully");
});

export const create = asyncHandler(async (req, res, next) => {
  const { error } = productValidation.validate(req.body);
  if (error) {
    sendResponse(httpStatus.BAD_REQUEST, res, null, error.message);
    return;
  }
  const data = req.body;
  const createdData = await ProductService.create(data);
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
  const updatedData = await ProductService.update(id, data);
  sendResponse(httpStatus.OK, res, updatedData, "Record updated successfully");
});

export const deleteData = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await ProductService.deleteDoc(id);
  sendResponse(httpStatus.NO_CONTENT, res, null, "Record deleted successfully");
});
