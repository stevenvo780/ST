// ============================================================
// ST TypeChecker — Levenshtein distance + sugerencia automática
// ============================================================

/**
 * Calcula la distancia de edición (Levenshtein) entre dos strings.
 * Complejidad: O(|a| * |b|) en tiempo y espacio.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Matriz dp: dp[i][j] = distancia entre a[0..i-1] y b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] ?? 0;
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // delete
            dp[i][j - 1], // insert
            dp[i - 1][j - 1], // substitute
          );
      }
    }
  }

  return dp[m][n];
}

/**
 * Dado un identificador no reconocido y un set de candidatos declarados,
 * devuelve el más cercano si su distancia ≤ maxDistance, o undefined.
 */
export function findClosest(
  unknown: string,
  candidates: Iterable<string>,
  maxDistance = 2,
): string | undefined {
  let best: string | undefined;
  let bestDist = maxDistance + 1;

  for (const candidate of candidates) {
    const d = levenshtein(unknown, candidate);
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }

  return bestDist <= maxDistance ? best : undefined;
}
