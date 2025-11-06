import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ENV } from "../config/env.js";

const MATRIX_CACHE_DIR = path.resolve("cache/matrix");

export async function buildMatrix(points) {
  const hash = crypto.createHash("md5")
    .update(points.map(p => `${p.lat},${p.lng}`).join("|"))
    .digest("hex");

  const cacheFile = path.join(MATRIX_CACHE_DIR, `matrix_${hash}.json`);
  if (fs.existsSync(cacheFile))
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));

  const origins = points.map(p => `${p.lat},${p.lng}`).join("|");
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origins}&destinations=${origins}&key=${ENV.GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  const timeMatrix = [];
  const distanceMatrix = [];
  data.rows.forEach(row => {
    const t = [], d = [];
    row.elements.forEach(e => {
      t.push(Math.round(e.duration.value / 60));
      d.push(e.distance.value / 1000);
    });
    timeMatrix.push(t); distanceMatrix.push(d);
  });

  fs.mkdirSync(MATRIX_CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify({ timeMatrix, distanceMatrix }), "utf8");

  return { timeMatrix, distanceMatrix };
}
