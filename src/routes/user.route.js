import express from "express";
import { authentication, authorization } from "#middlewares/auth";
import {
  get,
  update,
  deleteData,
  getUserByRole,
  getCurrentUser,
} from "#controllers/user";
import { ADMIN } from "#middlewares/auth";
const router = express.Router();

router.route("/public-role/:role?").get(getUserByRole);
router.route("/get-current-user").get(authentication, getCurrentUser);
router.route("/:id?").get(get).put(update).delete(deleteData);

export default router;
