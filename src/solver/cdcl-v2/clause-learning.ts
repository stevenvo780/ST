// First-UIP Conflict Analysis — Marques-Silva & Sakallah (GRASP, 1996).
// Recorremos hacia atrás el grafo de implicaciones desde la cláusula en
// conflicto hasta hallar el primer Unique Implication Point: el único
// literal del nivel de decisión actual que queda en la "frontera" del
// corte. Eso produce la cláusula aprendida mínima respecto al esquema 1UIP.

import { NO_ANTECEDENT } from './state';

export interface AnalysisResult {
  /** Cláusula aprendida. learned[0] es el literal asertivo (a propagar tras backtrack). */
  learned: Int32Array;
  /** Nivel de decisión al que retroceder (0 si la cláusula es unitaria). */
  btLevel: number;
  /** Variables que fueron "bumped" durante el análisis (para que VSIDS las premie). */
  bumped: number[];
}

/** Función mínima requerida del solver para acceder al antecedente de cada lit. */
export interface ConflictContext {
  /** Array de cláusulas indexadas por índice (mutable, learned clauses incluidas). */
  clauses: ReadonlyArray<Int32Array>;
  /** Trail completo de literales asignados en orden. */
  trail: ReadonlyArray<number>;
  /** Nivel de decisión actual. */
  currentLevel: number;
  /** Nivel de decisión en que se asignó cada variable (1-indexado, -1 si libre). */
  varLevel: Int32Array;
  /** Cláusula antecedente que propagó cada variable (-1 si fue decisión). */
  varAnte: Int32Array;
}

/**
 * Analiza un conflicto usando el esquema 1UIP.
 *
 * @param conflictCi cláusula que entró en conflicto durante BCP.
 * @param ctx contexto inmutable del solver (trail, levels, antecedents).
 * @returns cláusula aprendida + nivel de backtrack + variables bumpeadas.
 *
 * Si retorna learned.length === 0 y btLevel === -1, el solver debe interpretar
 * UNSAT raíz (conflicto en nivel 0).
 */
export function analyzeConflict1UIP(conflictCi: number, ctx: ConflictContext): AnalysisResult {
  const { clauses, trail, currentLevel, varLevel, varAnte } = ctx;
  if (currentLevel === 0) {
    return { learned: new Int32Array(0), btLevel: -1, bumped: [] };
  }

  const numVarsPlus1 = varLevel.length;
  const seen = new Uint8Array(numVarsPlus1);
  const outLits: number[] = [];
  const bumped: number[] = [];
  let counter = 0;
  let btLevel = 0;

  // addLits: agrega los literales de la cláusula `ci` (excepto skipVar) al
  // conjunto "seen", actualizando counter (lits del nivel actual) y outLits.
  const addLits = (ci: number, skipVar: number): void => {
    const c = clauses[ci];
    if (!c) return;
    for (let i = 0; i < c.length; i++) {
      const lit = c[i] ?? 0;
      const v = Math.abs(lit);
      if (v === 0 || v === skipVar || seen[v]) continue;
      seen[v] = 1;
      bumped.push(v);
      const lvl = varLevel[v];
      if (lvl === currentLevel) {
        counter++;
      } else if (lvl > 0) {
        outLits.push(lit);
        if (lvl > btLevel) btLevel = lvl;
      }
    }
  };

  addLits(conflictCi, 0);

  let ti = trail.length - 1;
  let assertLit = 0;

  while (counter > 0) {
    while (ti >= 0 && !seen[Math.abs(trail[ti] ?? 0)]) ti--;
    if (ti < 0) break;

    const p = trail[ti] ?? 0;
    ti--;
    const v = Math.abs(p);
    seen[v] = 0;
    counter--;

    if (counter === 0) {
      assertLit = -p;
    } else if (varAnte[v] !== NO_ANTECEDENT) {
      addLits(varAnte[v], v);
    }
  }

  const learned: number[] = [];
  if (assertLit !== 0) learned.push(assertLit);
  for (const l of outLits) learned.push(l);

  if (learned.length === 0) {
    return { learned: new Int32Array(0), btLevel: -1, bumped };
  }
  if (learned.length === 1) {
    return { learned: new Int32Array(learned), btLevel: 0, bumped };
  }

  // Posicionar el literal de mayor nivel-de-decisión-no-actual en learned[1].
  // Esa colocación garantiza que tras backtrack(btLevel) ambos watched literals
  // de la cláusula aprendida quedan bien definidos (learned[0] no asignado,
  // learned[1] falso al nivel btLevel).
  let mx = 1;
  for (let i = 2; i < learned.length; i++) {
    const li = learned[i];
    const lmx = learned[mx];
    if (li === undefined || lmx === undefined) continue;
    if (varLevel[Math.abs(li)] > varLevel[Math.abs(lmx)]) {
      mx = i;
    }
  }
  if (mx !== 1) {
    const tmp = learned[1];
    const swap = learned[mx];
    if (tmp !== undefined && swap !== undefined) {
      learned[1] = swap;
      learned[mx] = tmp;
    }
  }

  return { learned: new Int32Array(learned), btLevel, bumped };
}
