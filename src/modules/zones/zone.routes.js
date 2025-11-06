import express from "express";
import { checkJwt } from "../../middlewares/checkJwt.js";
import * as zoneController from "./zone.controller.js";

const router = express.Router();

// ✅ Obtener todas las zonas del usuario actual
router.get("/", checkJwt, zoneController.getZones);

// ✅ Crear una nueva zona
router.post("/", checkJwt, zoneController.createZone);

// ✅ Eliminar una zona
router.delete("/:id", checkJwt, zoneController.deleteZone);

// ✅ Generar Zona automáticamente
router.post("/auto", checkJwt, zoneController.autoGenerateZones);


export default router;
