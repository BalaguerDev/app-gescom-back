import prisma from "../prisma/client.js";
import dayjs from "dayjs";


async function fixUserRoutes() {
  const userId = 1; // ⚙️ modo demo o cámbialo por el usuario real
  const startOfMonth = dayjs().startOf("month");
  const endOfMonth = dayjs().endOf("month");

  console.log(`🧭 Generando rutas desde ${startOfMonth.format("YYYY-MM-DD")} hasta ${endOfMonth.format("YYYY-MM-DD")}`);

  for (let d = startOfMonth; d.isBefore(endOfMonth) || d.isSame(endOfMonth); d = d.add(1, "day")) {
    const date = d.format("YYYY-MM-DD");
    const monthKey = d.format("YYYY-MM");

    const existing = await prisma.userRoute.findFirst({
      where: { userId, date: new Date(date) },
    });

    if (!existing) {
      await prisma.userRoute.create({
        data: {
          userId,
          date: new Date(date),
          monthKey,
          totalKm: 0,
          totalTime: 0,
          stops: { create: [] },
        },
      });
      console.log(`✅ Ruta creada para ${date}`);
    } else {
      console.log(`🔹 Ya existía ruta para ${date}`);
    }
  }

  console.log("🎯 Sincronización completada.");
}

fixUserRoutes()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Error en fixUserRoutes:", e);
    process.exit(1);
  });
