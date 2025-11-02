import prisma from "../../../prisma/client.js";

export const getAllClientsByCompany = async (companyId) => {
    if (!companyId) return []; // Evita error Prisma
    return prisma.client.findMany({
        where: { companyId },
        include: {
            orders: { include: { items: true } },
            monthlyRevenues: true,
        },
        orderBy: { name: "asc" },
    });
};

export const createClient = (data) => prisma.client.create({ data });
