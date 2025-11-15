// src/services/route/weeklyPlanner.service.js

import { VISIT_PERIODICITY } from "../constants/visitPeriodicity.js";

export function getWorkWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);

  const diffToMonday = (day + 6) % 7;
  monday.setDate(d.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const arr = [];
  for (let i = 0; i < 5; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    arr.push(dt);
  }
  return arr;
}

export function planWeeklyVisits(clients, today = new Date(), opts = {}) {
  const { maxPerDay = 8 } = opts;

  const week = getWorkWeek(today);

  const scored = clients.map(c => {
    const lastVisit = c.visits?.[0]?.date
      ? new Date(c.visits[0].date)
      : null;

    const daysSince = lastVisit
      ? Math.floor((today - lastVisit) / 86400000)
      : 999;

    const minDays = VISIT_PERIODICITY[c.paretoClass] || 30;
    const factor = { A: 1.3, B: 1.0, C: 0.7 }[c.paretoClass] || 1;

    return {
      ...c,
      priority: (daysSince / minDays) * factor,
    };
  });

  scored.sort((a, b) => b.priority - a.priority);

  const plan = {};
  week.forEach(d => (plan[d.toDateString()] = []));

  for (const client of scored) {
    const dayKey = Object.keys(plan).find(k => plan[k].length < maxPerDay);
    if (!dayKey) break;
    plan[dayKey].push(client);
  }

  return plan;
}

export async function generateWeeklyPlanForUser(userId, date = new Date()) {
  // este método es simplificado y depende del controller invocarlo
  return {}; // si quieres lo implemento completo
}
