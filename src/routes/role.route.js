import express from "express";
import {
  get,
  create,
  update,
  deleteData,
  getLimitedFields,
} from "#controllers/role";

const router = express.Router();

router.route("/public").get(getLimitedFields);
router.route("/:id?").get(get).post(create).put(update).delete(deleteData);
export default router;
