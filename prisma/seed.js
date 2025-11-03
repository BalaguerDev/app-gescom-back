import prisma from "./client.js";
import { empresas } from "../src/data/clients.js";
import { generarClienteData, generarPedidoData } from "../src/utils/helpers.js";
import { getCoordinatesFromAddress } from "../src/utils/geocode.utils.js";
import { faker } from "@faker-js/faker";

const run = async () => {
  try {
    console.log("🌱 Iniciando seed de Gescom...");

    // 1️⃣ Crear empresa demo
    let company = await prisma.company.findUnique({
      where: { slug: "demo-company" },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Demo Company",
          slug: "demo-company",
          taxId: "B00000001",
        },
      });
      console.log("🏢 Empresa creada:", company.name);
    }

    // 2️⃣ Crear usuario demo
    let user = await prisma.user.findUnique({
      where: { auth0Id: "demo-sub-123" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          auth0Id: "demo-sub-123",
          email: "demo@demo.local",
          name: "Demo User",
          companyId: company.id,
          role: "SALES",
          dataSource: "DEMO",
        },
      });
      console.log("👤 Usuario demo creado:", user.email);
    }

    // 3️⃣ Crear clientes y pedidos demo
    const totalClientes = empresas.length;
    const porcentajeInactivos = faker.number.int({ min: 10, max: 15 });
    const numInactivos = Math.floor((totalClientes * porcentajeInactivos) / 100);
    const indicesInactivos = new Set();

    while (indicesInactivos.size < numInactivos) {
      indicesInactivos.add(faker.number.int({ min: 0, max: totalClientes - 1 }));
    }

    console.log(`🏪 Creando ${totalClientes} clientes...`);

    for (let i = 0; i < totalClientes; i++) {
      const empresa = empresas[i];
      const esInactivo = indicesInactivos.has(i);
      const clientData = generarClienteData(empresa);

      // 📍 Obtener coordenadas del cliente
      const coords = await getCoordinatesFromAddress(clientData.address);
      if (coords) {
        clientData.lat = coords.lat;
        clientData.lng = coords.lng;
        console.log(`✅ Coordenadas ${empresa.nombre}:`, coords);
      } else {
        console.warn(`⚠️ Sin coordenadas para: ${empresa.nombre}`);
      }

      // 💾 Crear cliente
      const client = await prisma.client.create({
        data: {
          ...clientData,
          companyId: company.id,
          assignedToId: user.id,
        },
      });

      // 🧾 Crear pedidos
      const numPedidos = esInactivo
        ? faker.number.int({ min: 0, max: 2 })
        : faker.number.int({ min: 1, max: 5 });

      for (let j = 0; j < numPedidos; j++) {
        const pedido = generarPedidoData(client.id, esInactivo);
        await prisma.order.create({
          data: {
            ...pedido,
            companyId: company.id,
            userId: user.id,
          },
        });
      }

      // 📊 Revenue mensual
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

    console.log("🎉 Seed completado correctamente.");

  } catch (e) {
    console.error("❌ Error en seed:", e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

run();
