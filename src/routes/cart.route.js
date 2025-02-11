import express from "express";
import { get, create, update, deleteData, getUsersCart } from "#controllers/cart";
import { authentication } from "#middlewares/auth";

const router = express.Router();

router.use(authentication);
router.route("/details").get(getUsersCart);
router.route("/:id?").get(get).post(create).put(update).delete(deleteData);
export default router;
