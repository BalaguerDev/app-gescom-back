// src/services/route/matrix.service.js

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ENV } from "../config/env.js";

const CACHE_DIR = path.resolve("cache/matrix");
const GOOGLE_LIMIT = 25;

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.sqrt(h);
}

export async function buildMatrix(points) {
  const hash = crypto
    .createHash("md5")
    .update(points.map(p => `${p.lat},${p.lng}`).join("|"))
    .digest("hex");

  const file = path.join(CACHE_DIR, `${hash}.json`);

  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  const N = points.length;
  const timeMatrix = Array.from({ length: N }, () => Array(N).fill(Infinity));
  const distanceMatrix = Array.from({ length: N }, () => Array(N).fill(Infinity));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === j) {
        timeMatrix[i][j] = 0;
        distanceMatrix[i][j] = 0;
        continue;
      }

      const d = haversine(points[i], points[j]);
      distanceMatrix[i][j] = d;
      timeMatrix[i][j] = Math.round((d / 40) * 60); // 40 km/h
    }
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ timeMatrix, distanceMatrix }), "utf8");

  return { timeMatrix, distanceMatrix };
}
