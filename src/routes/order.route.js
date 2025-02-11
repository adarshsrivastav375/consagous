import express from "express";
import {
  get,
  create,
  update,
  deleteData,
  getUserOrders,
  getBestSellingProducts,
  getOrdersWithMonthlySummary,
} from "#controllers/order";
import { authentication } from "#middlewares/auth";

const router = express.Router();
router.use(authentication);
router.route("/orders").get(getUserOrders);
router.route("/getBestSellingProducts").get(getBestSellingProducts);
router.route("/monthlySummary").get(getOrdersWithMonthlySummary);
router.route("/:id?").get(get).post(create).put(update).delete(deleteData);
export default router;
