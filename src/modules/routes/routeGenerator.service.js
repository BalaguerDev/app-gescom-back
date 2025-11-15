// src/services/route/routeGenerator.service.js
import prisma from "../../../prisma/client.js";
import { VISIT_PERIODICITY } from "../../constants/visitPeriodicity.js";
import { optimizeRouteFromMatrix } from "../../services/routeOptimizer.service.js";
import { getCoordinatesFromAddress } from "../../services/geocode.service.js";
import { classifyClientsPareto } from "../../services/pareto.service.js";
import { planWeeklyVisits } from "../../services/weeklyPlanner.service.js";
import { clusterClients, findBestClusterForStart } from "../../services/clustering.service.js";
import { buildMatrix } from "../../services/matrix.service.js";

export async function generateRouteForDay(
    userId,
    date,
    startAddress,
    endAddress,
    opts = {}
) {
    const { maxClientsPerRoute = 30, clusters = 4 } = opts;

    const day = new Date(date);
    day.setHours(0, 0, 0, 0);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true },
    });

    if (!user) throw new Error("Usuario no encontrado");

    const companyId = user.companyId;

    const rawClients = await prisma.client.findMany({
        where: {
            companyId,
            assignedToId: userId,
            active: true,
            lat: { not: null },
            lng: { not: null },
        },
        include: {
            visits: { orderBy: { date: "desc" }, take: 1 },
        },
    });

    if (!rawClients.length) throw new Error("No hay clientes asignados");

    // Clasificación Pareto
    const month = day.getMonth() + 1;
    const classified = classifyClientsPareto(rawClients, month);

    // Filtrado por frecuencia mínima
    const filtered = classified.filter(c => {
        const lastVisit = c.visits?.[0]?.date ? new Date(c.visits[0].date) : null;
        const minDays = VISIT_PERIODICITY[c.paretoClass] || 30;

        if (!lastVisit) return true;

        const diff = Math.floor((day - lastVisit) / 86400000);
        return diff >= minDays;
    });

    if (!filtered.length) throw new Error("Ningún cliente cumple las condiciones");

    // Plan semanal → escoger solo clientes de hoy
    const weekly = planWeeklyVisits(filtered, day, {
        maxPerDay: Math.ceil(maxClientsPerRoute / 5),
    });

    const todayKey = day.toDateString();
    let clientsToday = weekly[todayKey] || [];

    if (!clientsToday.length) clientsToday = filtered;

    // Clustering
    const k = Math.max(1, Math.floor(clientsToday.length / 10));
    const clustersList = clusterClients(clientsToday, k);

    const startCoords = await getCoordinatesFromAddress(startAddress);
    const endCoords = await getCoordinatesFromAddress(endAddress);

    const bestCluster = findBestClusterForStart(clustersList, startCoords);

    let clientsToUse = clustersList[bestCluster] || clientsToday;
    clientsToUse = clientsToUse.slice(0, maxClientsPerRoute);

    // Matriz
    const points = [
        startCoords,
        ...clientsToUse.map(c => ({ lat: c.lat, lng: c.lng })),
        endCoords,
    ];

    const { timeMatrix, distanceMatrix } = await buildMatrix(points);

    // Optimización
    const routeStops = optimizeRouteFromMatrix(
        points,
        timeMatrix,
        distanceMatrix,
        clientsToUse,
        {
            startHourMinutes: 7 * 60,
            endLimitMinutes: 18 * 60,
            includeClientObject: false,
        }
    );

    // 1) Buscar si ya existe
    const existing = await prisma.route.findFirst({
        where: { userId, date: day },
        include: { stops: { include: { client: true } } }
    });

    if (existing) {
        console.log("ℹ️ Ruta ya existente, devolviendo sin regenerar");
        return existing;
    }

    // === CÁLCULO DE DISTANCIA TOTAL & CONDUCCIÓN TOTAL ===
    let totalKm = 0;
    let totalDrivingMin = 0;

    if (routeStops.length > 0) {
        const indices = [0]; // start

        // cliente → índice en points[]
        for (const stop of routeStops) {
            const idx = clientsToUse.findIndex(c => c.id === stop.clientId);
            if (idx >= 0) indices.push(idx + 1); // +1 por start
        }

        indices.push(points.length - 1); // end

        for (let i = 0; i < indices.length - 1; i++) {
            const a = indices[i];
            const b = indices[i + 1];

            totalKm += distanceMatrix[a]?.[b] ?? 0;
            totalDrivingMin += timeMatrix[a]?.[b] ?? 0;
        }
    }

    // Crear ruta en BD
    const route = await prisma.route.create({
        data: {
            userId,
            companyId,
            date: day,
            startAddress,
            endAddress,
            startLat: startCoords.lat,
            startLng: startCoords.lng,
            endLat: endCoords.lat,
            endLng: endCoords.lng,
            startTime: "07:00",
            endTime: "18:30",
            breakMinutes: 90,
            totalKm: Number(totalKm.toFixed(1)),
            totalDrivingMin: Math.round(totalDrivingMin),
            totalVisitMin: routeStops.reduce((a, s) => a + s.visitMinutes, 0),
            estimatedRevenue: routeStops.reduce((a, s) => a + (s.estimatedRevenue || 0), 0),
            stops: { create: routeStops },
        },
        include: { stops: { include: { client: true } } },
    });

    return route;
}
