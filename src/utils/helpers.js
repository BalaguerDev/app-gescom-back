import { faker as fakerAll } from "@faker-js/faker";
import { productos } from "../data/products.js";

const faker = fakerAll;

export function generarReferencia() {
  return faker.string.numeric(10);
}

function generarRevenueData() {
  return Array.from({ length: 12 }, (_, i) => {
    const maquinas = faker.number.int({ min: 300, max: 4000 });
    const accesorios = faker.number.int({ min: 300, max: 4000 });
    const herramienta = faker.number.int({ min: 300, max: 4000 });
    const total = maquinas + accesorios + herramienta;

    return {
      month: i + 1,
      total,
      families: { maquinas, accesorios, herramienta },
    };
  });
}

export function generarClienteData(empresa) {
  return {
    name: empresa.nombre,
    cif: "B" + faker.string.numeric(8),
    phone: faker.phone.number("+34 6## ### ###"),
    email: faker.internet.email({ firstName: empresa.nombre.split(" ")[0], provider: empresa.nombre.replace(/\s+/g, "").toLowerCase() + ".es" }),
    address: `${empresa.direccion}, ${empresa.cp} ${empresa.ciudad}`,
    category: faker.helpers.arrayElement(["Construcción", "Electricidad", "Climatización", "Suministro Industrial"]),
    notes: faker.lorem.sentence(),
    revenueCurrentYear: generarRevenueData(),
    revenueLastYear: generarRevenueData(),
  };
}

export function generarItem() {
  const prod = faker.helpers.arrayElement(productos);
  const cantidad = faker.number.int({ min: 1, max: 10 });
  const total = parseFloat((prod.precio * cantidad).toFixed(2));
  return {
    ref: generarReferencia(),
    name: prod.nombre,
    cantidad,
    precio: prod.precio,
    total,
  };
}

export function generarPedidoData(clientId, esInactivo = false) {
  const numItems = faker.number.int({ min: 1, max: 5 });
  const items = Array.from({ length: numItems }, generarItem);
  const totalPedido = items.reduce((sum, item) => sum + item.total, 0);

  const fechaPedido = esInactivo ? faker.date.recent({ days: 60 }) : faker.date.recent({ days: 20 });

  return {
    clientId,
    orderNumber: faker.string.alphanumeric(8).toUpperCase(),
    date: fechaPedido,
    total: parseFloat(totalPedido.toFixed(2)),
    items: { create: items },
  };
}
