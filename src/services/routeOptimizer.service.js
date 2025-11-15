// src/services/route/routeOptimizer.service.js
import { solveTSP } from "./tsp.service.js";

export function optimizeRouteFromMatrix(
  points,
  timeMatrix,
  distanceMatrix,
  clients,
  opts = {}
) {
  const {
    startHourMinutes = 7 * 60,
    endLimitMinutes = 18 * 60,
    visitTimeMap = { A: 80, B: 40, C: 20 },
  } = opts;

  const startIndex = 0;
  const endIndex = points.length - 1;

  const route = solveTSP(timeMatrix, startIndex, endIndex);

  let clock = startHourMinutes;
  const stops = [];

  for (let i = 1; i < route.length - 1; i++) {
    const idx = route[i];
    const client = clients[idx - 1];
    const prevIdx = route[i - 1];

    const drive = timeMatrix[prevIdx][idx];
    const dist = distanceMatrix[prevIdx][idx];

    const visit = visitTimeMap[client.paretoClass] || 30;
    const need = drive + visit;

    if (clock + need > endLimitMinutes) break;

    clock += drive;
    const arrival = toHHMM(clock);

    clock += visit;
    const departure = toHHMM(clock);

    stops.push({
      clientId: client.id,
      orderIndex: stops.length + 1,
      arrivalTime: arrival,
      departureTime: departure,
      visitMinutes: visit,
      driveMinutes: drive,
      distanceKm: Number(dist.toFixed(2)),
      paretoClass: client.paretoClass,
      estimatedRevenue: Math.round((client.totalRevenue || 0) / 12) || 0,
    });
  }

  return stops;
}

function toHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
