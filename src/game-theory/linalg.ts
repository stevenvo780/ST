// ============================================================
// Mini álgebra lineal (sin dependencias) — para resolver los
// sistemas indiferentes del support enumeration y los pivots de
// Lemke-Howson.
// ============================================================

/**
 * Resuelve A x = b por eliminación gaussiana con pivot parcial.
 * Devuelve null si el sistema es singular (no único o sin solución).
 * Diseñado para matrices chicas (n ≤ 20).
 */
export function solveLinear(A: number[][], b: number[], tol = 1e-10): number[] | null {
  const n = A.length;
  if (n === 0) return [];
  for (const row of A) {
    if (row.length !== n) throw new Error('solveLinear: matrix must be square');
  }
  if (b.length !== n) throw new Error('solveLinear: b length mismatch');

  // Matriz aumentada
  const M: number[][] = A.map((row, i) => {
    const r = row.slice();
    r.push(b[i]);
    return r;
  });

  for (let col = 0; col < n; col++) {
    // pivot parcial
    let pivotRow = col;
    let pivotVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > pivotVal) {
        pivotVal = v;
        pivotRow = r;
      }
    }
    if (pivotVal < tol) return null; // singular
    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
    }
    const pivot = M[col][col];
    const pivRow = M[col];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const rowR = M[r];
      const factor = rowR[col] / pivot;
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) {
        rowR[c] = rowR[c] - factor * pivRow[c];
      }
    }
  }

  const x = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const row = M[i];
    x[i] = row[n] / row[i];
  }
  return x;
}
