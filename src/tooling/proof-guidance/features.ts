// ============================================================
// ST Proof Guidance — Feature extraction
//
// Features simples y baratas (sin embeddings). El extractor es
// determinístico: para el mismo state siempre devuelve los mismos
// (name, value). Los tests de `extractFeatures determinístico'
// dependen de esa propiedad.
// ============================================================

import type { Feature, ProofState } from './types';

/**
 * Símbolos top-level que reconocemos como features one-hot.
 * El orden es estable — esos son los nombres de feature usados por
 * el modelo.
 */
const TOP_LEVEL_SYMBOLS = ['→', '∧', '∨', '¬', '↔', '∀', '∃', '='] as const;

/**
 * Operadores que cuentan para "depth" del goal — cualquier ocurrencia
 * de uno de estos (no solo top-level) suma 1.
 */
const DEPTH_OPERATORS = ['→', '∧', '∨', '¬', '↔', '∀', '∃', '⊥', '⊤'] as const;

function countOperators(s: string): number {
  let n = 0;
  for (const op of DEPTH_OPERATORS) {
    let idx = 0;
    while ((idx = s.indexOf(op, idx)) !== -1) {
      n++;
      idx += op.length;
    }
  }
  return n;
}

/** ¿el goal contiene el símbolo? (no necesariamente top-level). */
function containsSymbol(goal: string, sym: string): boolean {
  return goal.includes(sym);
}

/** ¿alguna hipótesis aparece textualmente dentro del goal? */
function hypInGoal(state: ProofState): boolean {
  if (state.hypotheses.length === 0) return false;
  for (const h of state.hypotheses) {
    const trimmed = h.trim();
    if (trimmed.length > 0 && state.goal.includes(trimmed)) return true;
  }
  return false;
}

/** ¿alguna hipótesis es exactamente el goal? (caso trivial de assumption). */
function hypEqualsGoal(state: ProofState): boolean {
  const goal = state.goal.trim();
  return state.hypotheses.some((h) => h.trim() === goal);
}

/**
 * Extrae features del estado. Estabilidad:
 * - mismo state → mismo array (orden, nombres, valores).
 * - todos los valores son números finitos.
 */
export function extractFeatures(state: ProofState): Feature[] {
  const goal = state.goal;
  const features: Feature[] = [];

  // Conteo de hipótesis (saturado en 10 para evitar dominio del feature).
  features.push({ name: 'numHypotheses', value: Math.min(state.hypotheses.length, 10) });

  // Profundidad del goal (saturada en 20).
  features.push({ name: 'goalDepth', value: Math.min(countOperators(goal), 20) });

  // Longitud del goal en chars / 10 (proxy de complejidad sintáctica).
  features.push({ name: 'goalLength', value: Math.min(goal.length / 10, 20) });

  // One-hot de símbolos presentes en el goal.
  for (const sym of TOP_LEVEL_SYMBOLS) {
    features.push({
      name: `hasSymbol:${sym}`,
      value: containsSymbol(goal, sym) ? 1 : 0,
    });
  }

  // Booleanos derivados.
  features.push({ name: 'hypInGoal', value: hypInGoal(state) ? 1 : 0 });
  features.push({ name: 'hypEqualsGoal', value: hypEqualsGoal(state) ? 1 : 0 });
  features.push({ name: 'goalIsEmpty', value: goal.trim().length === 0 ? 1 : 0 });

  // Goal contiene `→`, `∧`, `∨` ya está cubierto arriba pero los
  // duplicamos con nombres explícitos del spec para legibilidad y
  // para que los tests que buscan estos nombres pasen.
  features.push({ name: 'goalHasArrow', value: containsSymbol(goal, '→') ? 1 : 0 });
  features.push({ name: 'goalHasAnd', value: containsSymbol(goal, '∧') ? 1 : 0 });
  features.push({ name: 'goalHasOr', value: containsSymbol(goal, '∨') ? 1 : 0 });

  return features;
}

/** Lista cerrada de feature names — útil para inicializar el modelo. */
export function featureNames(): string[] {
  const names: string[] = ['numHypotheses', 'goalDepth', 'goalLength'];
  for (const sym of TOP_LEVEL_SYMBOLS) names.push(`hasSymbol:${sym}`);
  names.push('hypInGoal', 'hypEqualsGoal', 'goalIsEmpty');
  names.push('goalHasArrow', 'goalHasAnd', 'goalHasOr');
  return names;
}
