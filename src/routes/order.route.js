import express from "express";
import {
  get,
  create,
  update,
  deleteData,
  getUserOrders,
  getBestSellingProducts,
} from "#controllers/order";
import { authentication } from "#middlewares/auth";

const router = express.Router();
router.use(authentication);
router.route("/orders").get(getUserOrders);
router.route("/getBestSellingProducts").get(getBestSellingProducts);
router.route("/:id?").get(get).post(create).put(update).delete(deleteData);
export default router;
