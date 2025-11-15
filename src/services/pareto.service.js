// src/services/route/pareto.service.js

export function classifyClientsPareto(clients) {
  // 1) calcular ingresos anuales reales desde monthlyRevenues
  const clientsWithTotals = clients.map(c => {
    const totalYear = (c.monthlyRevenues || []).reduce((sum, m) => {
      return sum + (m.total || 0);
    }, 0);

    return { ...c, totalYear };
  });

  // 2) ordenar por ingresos desc
  clientsWithTotals.sort((a, b) => b.totalYear - a.totalYear);

  const n = clientsWithTotals.length;

  // 3) calcular cortes
  const top20 = Math.floor(n * 0.2);
  const next30 = Math.floor(n * 0.5);

  // 4) asignar Pareto
  return clientsWithTotals.map((c, i) => {
    let paretoClass = "C";
    if (i < top20) paretoClass = "A";
    else if (i < next30) paretoClass = "B";

    return { ...c, paretoClass };
  });
}
