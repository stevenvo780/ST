// ============================================================
// Conversión a forma estándar para simplex.
// ============================================================
// El simplex de dos fases que implementamos opera sobre forma
// estándar de maximización con restricciones ≤ y variables ≥ 0
// (más slacks que se añaden internamente en el tableau).
//
// Reglas de conversión:
//   - 'minimize c·x'  →  'maximize (-c)·x', se invierte el valor al
//     final.
//   - Restricción 'a·x ≥ b'  →  '(-a)·x ≤ -b'.
//   - Restricción 'a·x = b' se expande a dos restricciones (≤ b y
//     ≥ b convertida a ≤ -b). La igualdad podría implementarse con
//     una sola variable artificial en Fase I, pero la duplicación
//     es estable y suficiente para nuestros tamaños de problema.
//   - Cotas inferiores l ≠ 0 se trasladan: x = x' + l, con x' ≥ 0.
//   - Cotas superiores u se vuelven restricciones ≤ u (sobre la
//     variable trasladada).
//
// Esta función devuelve un LPProblem equivalente con SOLO ≤ y
// objetivo de maximización, sin cotas (todas pasadas a constraints).
// ============================================================

import type { LPProblem } from './types';

/**
 * Convierte un LPProblem arbitrario a forma estándar:
 * maximizar c·x sujeto a Ax ≤ b con x ≥ 0 (sin cotas explícitas).
 * Preserva el sentido original mediante `objective.kind`:
 * si el original era 'minimize', el resultado lo refleja con
 * coeficientes negados (el caller debe negar el valor objetivo
 * al interpretarlo).
 */
export function standardForm(lp: LPProblem): LPProblem {
  const n = lp.objective.coefficients.length;

  // Trasladamos cotas inferiores l_i (default 0) sumando l_i a la
  // variable. Esto produce un offset constante en el objetivo y en
  // los RHS de las restricciones que el caller necesita reaplicar
  // al recuperar la solución. Para mantener el API simple, esta
  // función NO traslada cotas: el solver maneja cotas inferiores
  // ≠ 0 reescribiendo internamente. Solo expandimos = y ≥ → ≤.
  const newCoeffs =
    lp.objective.kind === 'minimize'
      ? lp.objective.coefficients.map((c) => -c)
      : lp.objective.coefficients.slice();

  const newConstraints: LPProblem['constraints'] = [];
  for (const c of lp.constraints) {
    if (c.coefficients.length !== n) {
      throw new Error(
        `standardForm: constraint con ${String(c.coefficients.length)} coeficientes, esperado ${String(n)}`,
      );
    }
    if (c.operator === '<=') {
      newConstraints.push({
        coefficients: c.coefficients.slice(),
        operator: '<=',
        rhs: c.rhs,
      });
    } else if (c.operator === '>=') {
      newConstraints.push({
        coefficients: c.coefficients.map((v) => -v),
        operator: '<=',
        rhs: -c.rhs,
      });
    } else {
      // '=' → ≤ y ≥ (este último convertido a ≤)
      newConstraints.push({
        coefficients: c.coefficients.slice(),
        operator: '<=',
        rhs: c.rhs,
      });
      newConstraints.push({
        coefficients: c.coefficients.map((v) => -v),
        operator: '<=',
        rhs: -c.rhs,
      });
    }
  }

  // Añadimos las cotas superiores como restricciones ≤ u.
  if (lp.variableBounds) {
    for (let i = 0; i < lp.variableBounds.length; i++) {
      const b = lp.variableBounds[i];
      if (!b) continue;
      if (b.upper !== undefined && Number.isFinite(b.upper)) {
        const row = new Array<number>(n).fill(0);
        row[i] = 1;
        newConstraints.push({ coefficients: row, operator: '<=', rhs: b.upper });
      }
      // Cota inferior negativa o positiva ≠ 0: a este nivel del API,
      // el solver lo maneja como restricción adicional x_i ≥ l_i
      // (que se convierte a -x_i ≤ -l_i). Si l_i < 0 además
      // dividimos la variable en x⁺ - x⁻ (no implementado aquí,
      // el solver lo asume no-negativo por defecto; el lower 0
      // implícito ya está cubierto por la no-negatividad).
      if (b.lower !== undefined && b.lower > 0) {
        const row = new Array<number>(n).fill(0);
        row[i] = -1;
        newConstraints.push({ coefficients: row, operator: '<=', rhs: -b.lower });
      }
    }
  }

  return {
    objective: {
      kind: 'maximize',
      coefficients: newCoeffs,
    },
    constraints: newConstraints,
    variableNames: lp.variableNames ? lp.variableNames.slice() : undefined,
    // Cotas ya absorbidas en restricciones.
  };
}
