import prisma from "../../../prisma/client.js";
import dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc.js";
dayjs.extend(utc.default || utc);

import { buildAdvancedRoute } from "./route.optimizer.js";
import { getCoordinatesFromAddress } from "../../services/geocode.service.js";
import { classifyClients, skipWeekends } from "./route.utils.js";

let isGenerating = false; // 🔒 evita bucles de generación

/** 🔁 Generar rutas automáticas del mes respetando horarios del usuario **/
export async function generateMonthlyRoutes(userSession) {
    // 🧠 Garantiza un usuario válido aunque algo falle en el middleware
    const user = userSession && userSession.id
        ? userSession
        : { id: 1, companyId: 1, name: "Demo User", startTime: "08:00", endTime: "17:00" };

    console.log("🧩 Generando rutas con usuario:", user.id, user.name);

    if (isGenerating) {
        console.log("⚠️ Generación de rutas ya en curso → ignorando llamada duplicada");
        return { created: [] };
    }

    isGenerating = true;
    try {
        const start = dayjs().startOf("month");
        const end = dayjs().endOf("month");

        const clients = await prisma.client.findMany({
            where: { assignedToId: user.id, active: true },
        });

        if (!clients.length) throw new Error("No hay clientes activos.");

        console.log(`🧭 Generando rutas para ${user.id} (${clients.length} clientes)`);

        const routes = [];
        let clientIndex = 0;

        // 🕒 Funciones de utilidad
        const parseToMinutes = (timeStr = "08:00") => {
            const [h, m] = timeStr.split(":").map(Number);
            return h * 60 + m;
        };
        const startMinutes = parseToMinutes(user.startTime || "08:00");
        const endMinutes = parseToMinutes(user.endTime || "17:00");
        const availableMinutes = endMinutes - startMinutes;

        // 🗓️ Generar rutas día a día
        for (let d = start; d.isBefore(end) || d.isSame(end, "day"); d = d.add(1, "day")) {
            if (skipWeekends(d)) {
                console.log("🚫 Fin de semana, sin ruta:", d.format("YYYY-MM-DD"));
                continue;
            }

            const date = d.startOf("day").toDate();
            const monthKey = d.format("YYYY-MM");

            const totalStops = Math.min(12, clients.length);
            const visitDuration = Math.floor(availableMinutes / totalStops);

            const stops = Array.from({ length: totalStops }).map((_, i) => {
                const arrival = startMinutes + i * visitDuration;
                const departure = arrival + Math.floor(visitDuration * 0.7);
                return {
                    orderIndex: i,
                    clientId: clients[(clientIndex + i) % clients.length].id,
                    arrival: `${String(Math.floor(arrival / 60)).padStart(2, "0")}:${String(arrival % 60).padStart(2, "0")}`,
                    departure: `${String(Math.floor(departure / 60)).padStart(2, "0")}:${String(departure % 60).padStart(2, "0")}`,
                };
            });

            clientIndex += stops.length;

            const route = await prisma.userRoute.create({
                data: {
                    userId: user.id,
                    date,
                    monthKey,
                    totalKm: 80 + Math.random() * 10,
                    totalTime: 400 + Math.floor(Math.random() * 60),
                    status: "PLANNED",
                    stops: { create: stops },
                },
            });

            routes.push(route);
            console.log(`📅 Ruta creada → ${d.format("YYYY-MM-DD")} (${stops.length} paradas)`);
        }

        console.log(`✅ Total rutas generadas: ${routes.length}`);
        return { created: routes };
    } catch (err) {
        console.error("❌ Error generando rutas:", err);
        throw err;
    } finally {
        isGenerating = false;
    }
}

/** 📅 Obtener ruta diaria **/
export async function getDailyRoute(userSession, date) {
    const user = userSession || { id: 1 };
    const target = dayjs(date).startOf("day");
    const startOfDay = target.toDate();
    const endOfDay = target.endOf("day").toDate();

    console.log("🕒 Buscando ruta entre:", startOfDay, "y", endOfDay);

    const route = await prisma.userRoute.findFirst({
        where: {
            userId: user.id,
            date: { gte: startOfDay, lte: endOfDay },
        },
        include: {
            stops: { include: { client: true }, orderBy: { orderIndex: "asc" } },
        },
    });

    console.log("📦 Resultado de búsqueda:", route ? `Encontrada → ${route.date}` : "No encontrada");

    if (!route) {
        console.warn(`⚠️ No se encontró ruta para ${date}`);
        return null;
    }

    return route;
}

/** ✏️ Marcar visita **/
export async function markVisit(routeStopId, { status, notes }) {
    return prisma.routeStop.update({
        where: { id: Number(routeStopId) },
        data: {
            visited: status === "visited",
            visitData: { notes, updatedAt: new Date() },
        },
        include: { client: true },
    });
}
