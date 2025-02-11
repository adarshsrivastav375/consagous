import PayPalService from "#services/payPal";
import httpStatus from "#utils/httpStatus";
import { sendResponse } from "#utils/response";
import OrderService from "#services/order";
import asyncHandler from "#utils/asyncHandler";

const payPalService = new PayPalService();

export const initiatePayment = asyncHandler(async (req, res, next) => {
  const { order } = req;
  const initiatedOrder = await payPalService.createOrder(order);
  sendResponse(httpStatus.OK, res, initiatedOrder, "Order placed successfully");
});
export const completePayment = asyncHandler(async (req, res, next) => {
  const { token, PayerID } = req.query;
  const capturedOrder = await payPalService.captureOrder(token);
  const order = await OrderService.getDoc({ transactionId: capturedOrder.id });
  order.paymentStatus = capturedOrder.status;
  order.status = capturedOrder.status === "COMPLETED" ? "completed" : "failed";
  order.paymentDetails = capturedOrder;
  await order.save();
  if (capturedOrder.status === "COMPLETED") {
    req.paymentDetails = capturedOrder;
    req.order = order;
    return next();
  }
  sendResponse(httpStatus.OK, res, order, "unsuccesful payment");
});

export const cancelPayment = asyncHandler(async (req, res, next) => {
  res.redirect("/cancel");
});
