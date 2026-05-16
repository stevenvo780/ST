// LBD (Literal Block Distance) — Audemard & Simon (2009) "Predicting Learnt
// Clauses Quality in Modern SAT Solvers" (Glucose). El LBD de una cláusula
// es la cantidad de niveles de decisión distintos representados por sus
// literales. Cláusulas con LBD bajo (especialmente LBD <= 2, "glue clauses")
// son los aprendizajes más útiles y nunca se descartan.

/**
 * Calcula el LBD de una cláusula dado el nivel de decisión actual de cada
 * variable. Usa un buffer compartido `seenLevels` (reseteado internamente
 * cada llamada) para evitar allocaciones repetidas.
 *
 * Si una variable no está asignada (level = -1), no se cuenta.
 */
export function computeLBD(
  clause: Int32Array,
  varLevel: Int32Array,
  seenBuffer: Uint8Array,
): number {
  // Buffer indexed by level + 1 (para tolerar -1).
  // El caller garantiza seenBuffer.length >= max nivel + 2.
  // Reseteamos sólo las posiciones que tocamos para mantener O(|clause|).
  const touched: number[] = [];
  let lbd = 0;
  for (let i = 0; i < clause.length; i++) {
    const v = Math.abs(clause[i] ?? 0);
    if (v === 0) continue;
    const lvl = varLevel[v];
    if (lvl < 0) continue;
    if (!seenBuffer[lvl]) {
      seenBuffer[lvl] = 1;
      touched.push(lvl);
      lbd++;
    }
  }
  for (const lvl of touched) seenBuffer[lvl] = 0;
  return lbd;
}

/**
 * Metadatos de una cláusula aprendida usados para decidir si conservarla.
 */
export interface LearnedMeta {
  /** Índice en el array de cláusulas. */
  index: number;
  /** LBD calculado al momento del aprendizaje (y opcionalmente actualizado). */
  lbd: number;
  /** Activity de la cláusula (analogía VSIDS para cláusulas). */
  activity: number;
  /** True si actualmente "bloquea" la asignación de alguna variable (no descartable). */
  locked: boolean;
  /** Longitud de la cláusula (útil como tiebreaker). */
  length: number;
}

/**
 * Selecciona cláusulas a eliminar de un conjunto de aprendidas.
 *
 * Política: preservar siempre las "glue clauses" (LBD <= 2). Del resto,
 * ordenar por (lbd desc, activity asc, length desc) y eliminar la mitad
 * con menor utilidad. Cláusulas locked nunca se eliminan.
 *
 * Retorna los `index` (relativos a `metas`) a eliminar.
 */
export function selectClausesToRemove(
  metas: ReadonlyArray<LearnedMeta>,
  lbdProtectThreshold: number = 2,
): number[] {
  const candidates: LearnedMeta[] = [];
  for (const m of metas) {
    if (m.locked) continue;
    if (m.lbd <= lbdProtectThreshold) continue;
    if (m.length <= 2) continue;
    candidates.push(m);
  }
  if (candidates.length === 0) return [];
  candidates.sort((a, b) => {
    if (a.lbd !== b.lbd) return b.lbd - a.lbd;
    if (a.activity !== b.activity) return a.activity - b.activity;
    return b.length - a.length;
  });
  const half = Math.floor(candidates.length / 2);
  return candidates.slice(0, half).map((m) => m.index);
}
