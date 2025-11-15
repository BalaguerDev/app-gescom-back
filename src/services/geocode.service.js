// src/services/route/geocode.service.js
import fetch from "node-fetch";
import { ENV } from "../config/env.js";

export async function getCoordinatesFromAddress(address) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${ENV.GOOGLE_MAPS_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.results?.length) {
      console.error("❌ Geocode sin resultados:", data);
      return null;
    }

    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  } catch (err) {
    console.error("❌ Error geocode:", err);
    return null;
  }
}
