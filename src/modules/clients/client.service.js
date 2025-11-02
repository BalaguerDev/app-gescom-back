import * as repo from "./client.repository.js";

export const getClientsForUser = async (user) => {
    if (!user.companyId) {
        console.warn("⚠️ Usuario sin companyId");
        return [];
    }

    const clients = await repo.getAllClientsByCompany(user.companyId);

    const mapped = clients.map((c) => {
        const totalCurrent = (c.monthlyRevenues || [])
            .filter((m) => m.year === new Date().getFullYear())
            .reduce((s, m) => s + (m.total || 0), 0);
        const totalLast = (c.monthlyRevenues || [])
            .filter((m) => m.year === new Date().getFullYear() - 1)
            .reduce((s, m) => s + (m.total || 0), 0);
        return { ...c, totalCurrent, totalLast };
    });

    return mapped;
};

export const createClientForCompany = (companyId, data) =>
    repo.createClient({ ...data, companyId });
