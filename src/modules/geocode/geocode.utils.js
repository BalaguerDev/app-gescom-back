import fetch from "node-fetch";
import { ENV } from "../../config/env.js";

export async function getCoordinatesFromAddress(address) {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${ENV.GOOGLE_MAPS_API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== "OK" || !data.results.length) return null;
        return data.results[0].geometry.location;
    } catch (err) {
        console.error("Error obteniendo coordenadas:", err.message);
        return null;
    }
}
