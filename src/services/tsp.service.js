// src/services/route/tsp.service.js

function totalDistance(matrix, route) {
  let sum = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const d = matrix[route[i]][route[i + 1]];
    sum += (typeof d === "number" && isFinite(d)) ? d : 1e9;
  }
  return sum;
}

export function nearestNeighbor(matrix, start = 0, end = null) {
  const n = matrix.length;
  const visited = Array(n).fill(false);

  const order = [start];
  visited[start] = true;

  let current = start;

  for (;;) {
    let best = -1;
    let bestDist = Infinity;

    for (let j = 0; j < n; j++) {
      if (visited[j]) continue;
      const d = matrix[current][j];
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }

    if (best === -1) break;

    visited[best] = true;
    order.push(best);
    current = best;
  }

  // mover end al final
  if (end !== null && end !== start) {
    const filtered = order.filter(i => i !== end);
    filtered.push(end);
    return filtered;
  }

  return order;
}

export function twoOpt(matrix, route, maxIter = 1000) {
  let best = route;
  let bestDist = totalDistance(matrix, route);

  let improved = true;
  let iter = 0;

  while (improved && iter < maxIter) {
    improved = false;
    iter++;

    for (let i = 1; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length - 1; k++) {
        const newRoute = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ];

        const newDist = totalDistance(matrix, newRoute);

        if (newDist < bestDist) {
          best = newRoute;
          bestDist = newDist;
          improved = true;
        }
      }
      if (improved) break;
    }
  }

  return best;
}

export function solveTSP(matrix, start = 0, end = null) {
  let initial = nearestNeighbor(matrix, start, end);
  return twoOpt(matrix, initial, 1500);
}
