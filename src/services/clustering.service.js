// src/services/route/clustering.service.js
export function clusterClients(clients, k = 4) {
  if (clients.length <= k) return clients.map(c => [c]);

  const centroids = clients.slice(0, k).map(c => ({ lat: c.lat, lng: c.lng }));
  let changed = true;

  let groups = Array.from({ length: k }, () => []);

  while (changed) {
    changed = false;

    groups = Array.from({ length: k }, () => []);

    for (const client of clients) {
      let best = 0;
      let bestDist = Infinity;

      for (let i = 0; i < k; i++) {
        const d = Math.sqrt(
          (client.lat - centroids[i].lat) ** 2 +
          (client.lng - centroids[i].lng) ** 2
        );
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }

      groups[best].push(client);
    }

    for (let i = 0; i < k; i++) {
      if (!groups[i].length) continue;

      const avgLat = groups[i].reduce((a, c) => a + c.lat, 0) / groups[i].length;
      const avgLng = groups[i].reduce((a, c) => a + c.lng, 0) / groups[i].length;

      if (centroids[i].lat !== avgLat || centroids[i].lng !== avgLng) {
        centroids[i] = { lat: avgLat, lng: avgLng };
        changed = true;
      }
    }
  }

  return groups;
}

export function findBestClusterForStart(clusterList, startCoords) {
  let best = 0;
  let min = Infinity;

  clusterList.forEach((cluster, i) => {
    if (!cluster.length) return;

    const avg = cluster.reduce(
      (a, c) => ({ lat: a.lat + c.lat, lng: a.lng + c.lng }),
      { lat: 0, lng: 0 }
    );

    avg.lat /= cluster.length;
    avg.lng /= cluster.length;

    const d = Math.sqrt(
      (avg.lat - startCoords.lat) ** 2 +
      (avg.lng - startCoords.lng) ** 2
    );

    if (d < min) {
      min = d;
      best = i;
    }
  });

  return best;
}
