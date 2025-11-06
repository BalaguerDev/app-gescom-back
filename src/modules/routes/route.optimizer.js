import { buildMatrix } from "../../services/matrix.service.js";
import { parseTime, formatMinutes } from "../../utils/time.utils.js";

export async function buildAdvancedRoute(clients, settings) {
    if (!clients.length) return { optimizedRoute: [], stats: { totalDistance: 0, totalDuration: 0 } };

    const startMinutes = parseTime(settings.startTime || "08:00");
    const endMinutes = parseTime(settings.endTime || "17:30");

    const points = [
        { id: "start", lat: settings.startLat, lng: settings.startLng, visitMinutes: 0 },
        ...clients,
        { id: "end", lat: settings.endLat, lng: settings.endLng, visitMinutes: 0 },
    ];

    const { timeMatrix, distanceMatrix } = await buildMatrix(points);
    let totalDistance = 0, totalDuration = 0, currentTime = startMinutes;
    const route = [];

    for (let i = 1; i < clients.length + 1; i++) {
        const travelTime = timeMatrix[i - 1][i];
        const travelDist = distanceMatrix[i - 1][i];
        currentTime += travelTime;
        const arrival = formatMinutes(currentTime);
        currentTime += clients[i - 1].visitMinutes;
        const departure = formatMinutes(currentTime);
        totalDistance += travelDist;
        totalDuration += travelTime + clients[i - 1].visitMinutes;

        if (currentTime > endMinutes) break;

        route.push({
            clientId: clients[i - 1].id,
            arrivalTime: arrival,
            departureTime: departure,
        });
    }

    return {
        optimizedRoute: route,
        stats: { totalDistance, totalDuration, endTime: formatMinutes(currentTime) },
    };
}
