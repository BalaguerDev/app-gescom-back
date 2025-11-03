import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import userRoutes from "./modules/users/user.routes.js";
import clientRoutes from "./modules/clients/client.routes.js";
import zoneRoutes from "./modules/zones/zone.routes.js";

export async function createServer() {
    const app = express();
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(requestLogger);

    app.get("/", (req, res) => res.send("✅ Gescom API running"));

    app.use("/api/users", userRoutes);
    app.use("/api/clients", clientRoutes);
    app.use("/api/zones", zoneRoutes);


    app.use(errorHandler);
    return app;
}
