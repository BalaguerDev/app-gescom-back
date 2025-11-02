import { findOrCreateUser } from "./user.service.js";

/**
 * Endpoint que recibe token (middleware checkJwt) y devuelve perfil.
 * En este handler puedes llamar a findOrCreateUser para sincronizar.
 */
export const getUserProfile = async (req, res, next) => {
    try {
        const auth0User = req.auth || req.user || req.body.user; // depende de tu middleware
        const sub = auth0User?.sub || auth0User?.user_id;
        const email = auth0User?.email;
        const name = auth0User?.name;

        if (!sub || !email) return res.status(400).json({ success: false, message: "No sub/email" });

        const user = await findOrCreateUser({ sub, email, name });
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};
