import prisma from "../../prisma/client.js";

/**
 * repository: acceso directo a prisma
 */
export const findUserByAuth0Id = (auth0Id) =>
    prisma.user.findUnique({ where: { auth0Id } });

export const findUserByEmail = (email) =>
    prisma.user.findUnique({ where: { email } });

export const createUser = (data) =>
    prisma.user.create({ data });

export const updateUser = (where, data) =>
    prisma.user.update({ where, data });
