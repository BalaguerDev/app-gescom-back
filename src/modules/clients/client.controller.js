import prisma from "../../../prisma/client.js";
import { getClientsForUser, createClientForCompany } from "./client.service.js";

export const getClientsHandler = async (req, res) => {
    try {
        const authUser = req.auth;
        if (!authUser?.sub)
            return res.status(401).json({ success: false, message: "Unauthorized" });

        const user = await prisma.user.findUnique({
            where: { auth0Id: authUser.sub },
        });

        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        const clients = await getClientsForUser(user);
        res.json({ success: true, data: clients });
    } catch (err) {
        console.error("❌ getClientsHandler error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const createClientHandler = async (req, res) => {
    try {
        const authUser = req.auth;
        const user = await prisma.user.findUnique({
            where: { auth0Id: authUser.sub },
        });

        if (!user) return res.status(401).json({ success: false });

        const newClient = await createClientForCompany(user.companyId, req.body);
        res.status(201).json({ success: true, data: newClient });
    } catch (err) {
        console.error("❌ createClientHandler error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
