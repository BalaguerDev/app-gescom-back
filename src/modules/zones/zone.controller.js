import * as zoneService from "./zone.service.js";
import prisma from "../../../prisma/client.js";

/**
 * 📍 Obtener el usuario real a partir del token (Auth0 o mock)
 */
const getUserFromAuth = async (req) => {
    const auth0Id = req.auth?.sub;
    if (!auth0Id) throw new Error("Token inválido o sin usuario");

    const user = await prisma.user.findUnique({
        where: { auth0Id },
    });

    if (!user) throw new Error("Usuario no encontrado en la base de datos");
    return user;
};

// 📍 Obtener zonas del usuario actual
export const getZones = async (req, res) => {
    try {
        const user = await getUserFromAuth(req);
        const zones = await zoneService.getZonesByUser(user.id);
        res.json(zones);
    } catch (error) {
        console.error("❌ Error obteniendo zonas:", error);
        res.status(500).json({ message: "Error al obtener las zonas" });
    }
};

// ➕ Crear una nueva zona
export const createZone = async (req, res) => {
    try {
        const user = await getUserFromAuth(req);
        const { name, color, path, clients } = req.body;

        if (!name || !path) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        const zone = await zoneService.createZone({
            name,
            color,
            path,
            clients,
            userId: user.id,
            companyId: user.companyId,
        });

        res.status(201).json(zone);
    } catch (error) {
        console.error("❌ Error creando zona:", error);
        res.status(500).json({ message: "Error al crear la zona" });
    }
};

// 🗑️ Eliminar zona
export const deleteZone = async (req, res) => {
    try {
        const user = await getUserFromAuth(req);
        const { id } = req.params;

        await zoneService.deleteZone(Number(id), user.id);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error eliminando zona:", error);
        res.status(500).json({ message: "Error al eliminar la zona" });
    }
};
