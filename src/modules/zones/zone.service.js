import prisma from "../../../prisma/client.js";
import kmeansImport from "ml-kmeans";

const kmeans =
    typeof kmeansImport === "function"
        ? kmeansImport
        : typeof kmeansImport.default === "function"
            ? kmeansImport.default
            : kmeansImport.kmeans || kmeansImport.default?.kmeans;

// 🎨 Colores de zonas
function randomColor() {
    const colors = ["#3b82f6", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6"];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 🧭 Convex hull (envolvente convexa)
function convexHull(points) {
    if (points.length < 3) return points;
    points.sort((a, b) => (a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat));

    const cross = (o, a, b) =>
        (a.lat - o.lat) * (b.lng - o.lng) - (a.lng - o.lng) * (b.lat - o.lat);

    const lower = [];
    for (const p of points) {
        while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0)
            lower.pop();
        lower.push(p);
    }

    const upper = [];
    for (const p of [...points].reverse()) {
        while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0)
            upper.pop();
        upper.push(p);
    }

    return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// 📦 Obtener zonas de un usuario
export const getZonesByUser = async (userId) => {
    return prisma.zone.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};

// ➕ Crear zona manual
export const createZone = async ({ name, color, path, clients, userId, companyId }) => {
    return prisma.zone.create({
        data: {
            name,
            color: color || randomColor(),
            path,
            clients,
            userId,
            companyId,
        },
    });
};

// 🗑️ Eliminar zona
export const deleteZone = async (id, userId) => {
    const zone = await prisma.zone.findFirst({ where: { id, userId } });
    if (!zone) throw new Error("Zona no encontrada o sin permiso");
    return prisma.zone.delete({ where: { id } });
};

// 🤖 Generar zonas automáticas sin duplicar clientes
export const autoGenerateZones = async (userId, k = 5) => {
    console.log(`🧠 [autoGenerateZones] Generando zonas para userId=${userId}`);

    // 1️⃣ Verificar si existen zonas activas
    const existingZones = await prisma.zone.findMany({
        where: { userId },
    });
    if (existingZones && existingZones.length > 0) {
        console.log(
            `⚠️ Ya existen ${existingZones.length} zonas en la BD → no se generarán nuevas.`
        );
        return existingZones;
    }

    // 2️⃣ Usuario y clientes
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true },
    });
    if (!user) throw new Error("Usuario no encontrado.");

    const clientFilter =
        user.role === "SALES"
            ? { assignedToId: user.id }
            : { companyId: user.companyId };

    const clients = await prisma.client.findMany({
        where: {
            ...clientFilter,
            lat: { not: null },
            lng: { not: null },
        },
    });

    if (clients.length < 2) {
        console.warn("⚠️ No hay suficientes clientes con coordenadas para generar zonas");
        return [];
    }

    // 3️⃣ Ejecutar K-Means clustering
    const coordinates = clients.map((c) => [c.lat, c.lng]);
    let kmeansResult;
    try {
        kmeansResult = kmeans(coordinates, Math.min(k, clients.length));
    } catch (err) {
        console.error("❌ Error ejecutando K-Means:", err.message);
        throw new Error("Error al ejecutar K-Means");
    }

    const { centroids } = kmeansResult;

    // 4️⃣ Asignar cada cliente al centroide más cercano (solo una zona)
    const grouped = Array.from({ length: k }, () => []);
    clients.forEach((client) => {
        let closestIndex = 0;
        let minDist = Infinity;
        centroids.forEach((centroid, idx) => {
            const d =
                (client.lat - centroid[0]) ** 2 + (client.lng - centroid[1]) ** 2;
            if (d < minDist) {
                minDist = d;
                closestIndex = idx;
            }
        });
        grouped[closestIndex].push(client);
    });

    // 5️⃣ Crear zonas únicas sin solapamientos
    const createdZones = [];
    for (let i = 0; i < grouped.length; i++) {
        const group = grouped[i];
        if (group.length === 0) continue;

        const name = `Zona ${i + 1}`;
        const color = randomColor();
        const path = convexHull(group.map((c) => ({ lat: c.lat, lng: c.lng })));

        const simplifiedClients = group.map((c) => ({
            id: c.id,
            name: c.name,
            lat: c.lat,
            lng: c.lng,
            type: c.type,
            totalCurrent: c.totalCurrent,
        }));

        const zone = await prisma.zone.create({
            data: {
                name,
                color,
                path,
                clients: simplifiedClients,
                userId: user.id,
                companyId: user.companyId,
            },
        });

        createdZones.push(zone);
    }

    console.log(`✅ ${createdZones.length} zonas creadas sin duplicar clientes.`);
    return createdZones;
};
