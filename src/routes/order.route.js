import express from "express";
import {
  get,
  create,
  update,
  deleteData,
  getUserOrders,
  getBestSellingProducts,
  getOrdersWithMonthlySummary,
  getSalesData,
} from "#controllers/order";
import { authentication } from "#middlewares/auth";

const router = express.Router();
router.use(authentication);
router.route("/orders").get(getUserOrders);
router.route("/getSalesData").get(getSalesData);
router.route("/getBestSellingProducts").get(getBestSellingProducts);
router.route("/monthlySummary").get(getOrdersWithMonthlySummary);
router.route("/:id?").get(get).post(create).put(update).delete(deleteData);
export default router;
