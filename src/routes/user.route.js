import express from "express";
import { authentication, authorization } from "#middlewares/auth";
import {
  get,
  create,
  update,
  login,
  deleteData,
  forgotPass,
  resetPass,
  getUserByRole,
  verifyPasswordResetOtp,
  getCurrentUser,
  sendSignupOtpEmail,
  createUserByAdmin,
  getAdmins,
  AdminLogin
} from "#controllers/user";
import { ADMIN } from "#middlewares/auth";
const router = express.Router();

router.route("/login").post(login);
router.route("/admin/login").post(AdminLogin);
router.route("/forgot-pass").post(forgotPass);
router.route("/email-signup-otp").post(sendSignupOtpEmail);
router.route("/public-role/:role?").get(getUserByRole);
router.route("/admins").get(authentication, authorization(ADMIN), getAdmins);
router.route("/forgot-pass-otp-verify").post(verifyPasswordResetOtp);
router.route("/reset-pass").post(authentication, resetPass);
router.route("/get-current-user").get(authentication, getCurrentUser);
router.route("/create-user").post(authentication, createUserByAdmin);
router.route("/:id?").get(get).post(create).put(update).delete(deleteData);


export default router;
