// src/utils/time.utils.js

/**
 * Convierte una hora (HH:mm) a minutos totales
 * @param {string} str - Ej: "08:30"
 * @returns {number} minutos totales desde las 00:00
 */
export function parseTime(str) {
    const [h = 0, m = 0] = String(str).split(":").map(Number);
    return h * 60 + m;
}

/**
 * Convierte minutos a formato HH:mm
 * @param {number} mins
 * @returns {string} - Ej: "14:05"
 */
export function formatMinutes(mins) {
    let h = Math.floor(mins / 60);
    let m = Math.round(mins % 60);
    if (m >= 60) { h++; m = 0; }
    if (h >= 24) { h = 23; m = 59; }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Añade minutos a una hora HH:mm
 */
export function addMinutes(timeStr, minutes) {
    return formatMinutes(parseTime(timeStr) + minutes);
}

/**
 * Calcula la diferencia en minutos entre dos horas HH:mm
 */
export function diffMinutes(start, end) {
    return parseTime(end) - parseTime(start);
}
