import { expressjwt as jwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import { ENV } from "../config/env.js";

const isDev = ENV.NODE_ENV !== "production";

// Middleware demo (sin Auth0)
const mockJwt = (req, res, next) => {
    req.auth = { sub: "demo-sub-123" }; // Usuario del seed
    console.warn("⚠️ checkJwt: Modo demo activo");
    next();
};

// Middleware real (Auth0)
const realJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `https://${ENV.AUTH0_DOMAIN}/.well-known/jwks.json`,
    }),
    audience: ENV.AUTH0_AUDIENCE,
    issuer: `https://${ENV.AUTH0_DOMAIN}/`,
    algorithms: ["RS256"],
});

export const checkJwt = isDev ? mockJwt : realJwt;
