import prisma from "../../../prisma/client.js";

export const getZonesByUser = async (userId) => {
    return prisma.zone.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};

export const createZone = async ({ name, color, path, clients, userId, companyId }) => {
    return prisma.zone.create({
        data: {
            name,
            color: color || "#3b82f6",
            path,
            clients,
            userId,
            companyId,
        },
    });
};

export const deleteZone = async (id, userId) => {
    const zone = await prisma.zone.findFirst({
        where: { id, userId },
    });

    if (!zone) throw new Error("Zona no encontrada o sin permiso");

    return prisma.zone.delete({ where: { id } });
};
