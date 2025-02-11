import express from "express";
import {login,callback } from "#controllers/auth";

const router = express.Router();

// Route to redirect to the OAuth provider for login
router.route("/login/:provider").get(login);

// Callback route that OAuth providers will call after successful authentication
router.get("/callback/:provider",callback);

export default router;

