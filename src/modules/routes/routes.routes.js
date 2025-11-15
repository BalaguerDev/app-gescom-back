import express from "express";
import { RoutesController } from "./routes.controller.js";

const router = express.Router();

// Rutas existentes
router.get("/day", RoutesController.getDayRoute);
router.get("/week", RoutesController.getWeeklyPlan);
router.post("/regenerate", RoutesController.regenerateRoute);
router.get("/:date", RoutesController.getRouteByDate);

export default router;
