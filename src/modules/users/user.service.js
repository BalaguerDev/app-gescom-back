import { empresas } from "../../data/clients.js";
import prisma from "../../../prisma/client.js";
import { generarClienteData, generarPedidoData } from "../../utils/helpers.js";
import { faker as fakerAll } from "@faker-js/faker";

const faker = fakerAll;

/**
 * findOrCreateUser: cuando token Auth0 trae sub+email
 * - si no existe usuario: crea usuario y (opcional) seed DEMO
 */
export const findOrCreateUser = async ({ sub, email, name }) => {
    // si existe por auth0Id -> devolver
    let user = await prisma.user.findUnique({ where: { auth0Id: sub } });
    if (user) return user;

    // si no existe, intentar buscar por email (migración)
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        // asociar auth0Id
        return prisma.user.update({ where: { id: user.id }, data: { auth0Id: sub } });
    }

    // ✅ Crear empresa demo + usuario demo
    const company = await prisma.company.create({
        data: {
            name: `${email.split("@")[1]} (demo)`,
            slug: `demo-${faker.string.uuid().slice(0, 8)}`,
        },
    });

    const createdUser = await prisma.user.create({
        data: {
            auth0Id: sub,
            email,
            name: name || "Usuario demo",
            companyId: company.id,
            role: "SALES",
            dataSource: "DEMO",
            hasConfigured: false,
        },
    });

    // generar clientes demo y pedidos para este company y asignarlos al user
    const totalClientes = empresas.length;
    const porcentajeInactivos = faker.number.int({ min: 10, max: 15 });
    const numInactivos = Math.floor((totalClientes * porcentajeInactivos) / 100);

    // seleccionar índices inactivos
    const indicesInactivos = new Set();
    while (indicesInactivos.size < numInactivos) {
        indicesInactivos.add(faker.number.int({ min: 0, max: totalClientes - 1 }));
    }

    for (let i = 0; i < totalClientes; i++) {
        const empresa = empresas[i];
        const esInactivo = indicesInactivos.has(i);

        // crear cliente
        const clientData = generarClienteData(empresa);
        // asignar companyId y assignedToId
        const client = await prisma.client.create({
            data: {
                ...clientData,
                companyId: company.id,
                assignedToId: createdUser.id,
            },
        });

        // generar pedidos
        const numPedidos = esInactivo ? faker.number.int({ min: 0, max: 2 }) : faker.number.int({ min: 1, max: 5 });
        for (let j = 0; j < numPedidos; j++) {
            const pedido = generarPedidoData(client.id, esInactivo);
            // enlazar company and user fields
            await prisma.order.create({
                data: {
                    ...pedido,
                    companyId: company.id,
                    userId: createdUser.id,
                },
            });
        }

        // opcional: crear monthlyRevenues (desnormalizados) a partir de revenueCurrentYear
        const rc = clientData.revenueCurrentYear || [];
        for (const m of rc) {
            await prisma.monthlyClientRevenue.create({
                data: {
                    clientId: client.id,
                    year: new Date().getFullYear(),
                    month: m.month,
                    total: m.total,
                    byFamily: m.families,
                },
            });
        }
    }

    return createdUser;
};
