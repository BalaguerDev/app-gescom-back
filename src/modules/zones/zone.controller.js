import * as zoneService from "./zone.service.js";
import prisma from "../../../prisma/client.js";

/**
 * 📍 Obtener el usuario real a partir del token (Auth0 o mock)
 */
const getUserFromAuth = async (req) => {
    const auth0Id = req.auth?.sub;
    if (!auth0Id) throw new Error("Token inválido o sin usuario");

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) throw new Error("Usuario no encontrado en la base de datos");

    return user;
};

/**
 * 📦 Obtener zonas del usuario actual
 */
export const getZones = async (req, res) => {
    try {
        const user = await getUserFromAuth(req);
        const zones = await zoneService.getZonesByUser(user.id);
        res.json({ success: true, zones });
    } catch (error) {
        console.error("❌ Error obteniendo zonas:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ➕ Crear una nueva zona
 */
export const createZone = async (req, res) => {
    try {
        const user = await getUserFromAuth(req);
        const { name, color, path, clients } = req.body;

        if (!name || !path) {
            return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
        }

        const zone = await zoneService.createZone({
            name,
            color,
            path,
            clients,
            userId: user.id,
            companyId: user.companyId,
        });

        res.status(201).json({ success: true, zone });
    } catch (error) {
        console.error("❌ Error creando zona:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 🗑️ Eliminar una zona
 */
export const deleteZone = async (req, res) => {
    try {
        const user = await getUserFromAuth(req);
        const { id } = req.params;

        await zoneService.deleteZone(Number(id), user.id);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error eliminando zona:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ⚙️ Generar zonas automáticamente
 */
export const autoGenerateZones = async (req, res) => {
    try {
        const user = await getUserFromAuth(req);
        const { k } = req.query;

        const zones = await zoneService.autoGenerateZones(user.id, Number(k) || 5);
        res.status(201).json({ success: true, zones });
    } catch (error) {
        console.error("❌ Error generando zonas automáticamente:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ✏️ Actualizar una zona existente
 */
export const updateZone = async (req, res) => {
    try {
        const user = await getUserFromAuth(req);
        const { id } = req.params;
        const { name, color, path, clients } = req.body;

        const updatedZone = await zoneService.updateZone(Number(id), user.id, {
            name,
            color,
            path,
            clients,
        });

        res.json({ success: true, zone: updatedZone });
    } catch (error) {
        console.error("❌ Error actualizando zona:", error);
        res.status(404).json({ success: false, message: error.message });
    }
};