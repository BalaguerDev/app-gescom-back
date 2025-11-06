// src/services/geocode.service.js
import fetch from "node-fetch";
import { ENV } from "../config/env.js";

/**
 * Servicio de geocodificación de direcciones mediante la API de Google Maps
 */
export async function getCoordinatesFromAddress(address) {
    if (!address) return null;

    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${ENV.GOOGLE_MAPS_API_KEY}`;

    try {
        console.log("📍 Solicitando coordenadas para:", address);
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== "OK" || !data.results.length) {
            console.warn("⚠️ No se encontraron coordenadas para:", address);
            return null;
        }

        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
    } catch (err) {
        console.error("❌ Error obteniendo coordenadas:", err.message);
        return null;
    }
}
