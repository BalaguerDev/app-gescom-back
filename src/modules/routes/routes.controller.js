import { generateWeeklyPlanForUser } from "../../services/weeklyPlanner.service.js";
import { generateRouteForDay } from "./routeGenerator.service.js";

export const RoutesController = {
  async getDayRoute(req, res) {
    try {
      const userId = Number(req.query.userId || req.body.userId);
      const date = req.query.date || req.body.date || new Date();
      const startAddress = req.query.startAddress || req.body.startAddress;
      const endAddress = req.query.endAddress || req.body.endAddress || startAddress;

      if (!userId) throw new Error("Falta userId");
      if (!startAddress) throw new Error("Falta startAddress");

      const route = await generateRouteForDay(
        userId,
        date,
        startAddress,
        endAddress
      );

      res.json({ success: true, data: route });
    } catch (err) {
      console.error("❌ Error getDayRoute:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getWeeklyPlan(req, res) {
    try {
      const userId = Number(req.query.userId);
      const date = req.query.date || new Date();
      if (!userId) throw new Error("Falta userId");

      const plan = await generateWeeklyPlanForUser(userId, date);
      res.json({ success: true, data: plan });
    } catch (err) {
      console.error("❌ Error getWeeklyPlan:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async regenerateRoute(req, res) {
    try {
      const { userId, date, startAddress, endAddress } = req.body;

      const route = await generateRouteForDay(
        userId,
        date || new Date(),
        startAddress,
        endAddress
      );

      res.json({ success: true, data: route });
    } catch (err) {
      console.error("❌ Error regenerateRoute:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ⭐ NUEVO MÉTODO NECESARIO
  async getRouteByDate(req, res) {
    try {
      const userId = Number(req.query.userId || 1);
      const date = new Date(req.params.date);

      const startAddress = req.query.startAddress || "Carrer de Pujades 19, 08018 Barcelona";
      const endAddress = req.query.endAddress || startAddress;

      if (isNaN(date.getTime())) {
        return res.status(400).json({ success: false, error: "Fecha inválida" });
      }

      const route = await generateRouteForDay(
        userId,
        date,
        startAddress,
        endAddress
      );

      res.json({ success: true, data: route });
    } catch (err) {
      console.error("❌ Error getRouteByDate:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
