import express from "express";
import { getClientsHandler, createClientHandler } from "./client.controller.js";
import { checkJwt } from "../../middlewares/checkJwt.js";

const router = express.Router();

router.get("/", checkJwt, getClientsHandler);
router.post("/", checkJwt, createClientHandler);

export default router;
