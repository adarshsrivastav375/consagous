import express from "express";
import { authentication, authorization } from "#middlewares/auth";
import {
  get,
  create,
  update,
  login,
  deleteData,
  getUserByRole,
  getCurrentUser,
  getAdmins,
  AdminLogin,
} from "#controllers/user";
import { ADMIN } from "#middlewares/auth";
const router = express.Router();

router.route("/login").post(login);
router.route("/admin/login").post(AdminLogin);
router.route("/public-role/:role?").get(getUserByRole);
router.route("/admins").get(authentication, authorization(ADMIN), getAdmins);
router.route("/get-current-user").get(authentication, getCurrentUser);
router.route("/:id?").get(get).post(create).put(update).delete(deleteData);

export default router;
