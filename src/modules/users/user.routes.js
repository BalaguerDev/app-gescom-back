import express from "express";
import { getUserProfile } from "./user.controller.js";
import { checkJwt } from "../../middlewares/checkJwt.js";

const router = express.Router();

// GET /api/users/profile
router.get("/profile", checkJwt, getUserProfile);

export default router;
