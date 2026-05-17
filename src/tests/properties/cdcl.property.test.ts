// ============================================================
// Property: CDCL v2 — consistencia SAT/UNSAT
// ============================================================
//
// ∀ random 3-SAT clauses, el resultado del solver es consistente:
//   - si sat=true ⇒ el modelo retornado satisface TODAS las cláusulas.
//   - si unsat=true ⇒ no existe asignación que satisfaga todas las cláusulas
//     (verificado por enumeración brute-force, sólo viable con pocas vars).

import { describe, it } from 'vitest';
import { fc, dimacs3SAT } from './generators';
import { solveCDCLv2 } from '../../solver/cdcl-v2';

function clauseSatisfied(clause: Int32Array, model: Record<string, boolean>): boolean {
  for (let i = 0; i < clause.length; i++) {
    const lit = clause[i]!;
    const v = Math.abs(lit);
    // El solver default usa keys "x1", "x2", ... (sin atomNames).
    const assigned = model[`x${v}`];
    if (assigned === undefined) continue;
    if ((lit > 0 && assigned) || (lit < 0 && !assigned)) return true;
  }
  return false;
}

function enumerateAllAssignments(
  numVars: number,
  clauses: Int32Array[],
): boolean {
  // Brute-force: si existe asignación que satisface, retorna true.
  // Solo seguro hasta ~10 vars (2^10 = 1024).
  const total = 1 << numVars;
  for (let mask = 0; mask < total; mask++) {
    const model: Record<string, boolean> = {};
    for (let v = 1; v <= numVars; v++) {
      model[`x${v}`] = ((mask >> (v - 1)) & 1) === 1;
    }
    if (clauses.every((c) => clauseSatisfied(c, model))) return true;
  }
  return false;
}

describe('property: CDCL v2 consistency', () => {
  it('SAT result yields model that satisfies every clause', () => {
    fc.assert(
      fc.property(dimacs3SAT(6, 4), ({ clauses, numVars }) => {
        const r = solveCDCLv2(clauses, numVars, { timeoutMs: 2000 });
        if (!('sat' in r) || !r.sat) return true; // skip UNSAT casos
        // Verificar: cada cláusula satisfecha.
        for (const c of clauses) {
          if (!clauseSatisfied(c, r.model)) {
            throw new Error(
              `Modelo SAT no satisface cláusula ${Array.from(c).join(' ')}: model=${JSON.stringify(r.model)}`,
            );
          }
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it('UNSAT result agrees with brute-force enumeration', () => {
    fc.assert(
      fc.property(dimacs3SAT(6, 4), ({ clauses, numVars }) => {
        const r = solveCDCLv2(clauses, numVars, { timeoutMs: 2000 });
        if (!('unsat' in r) || !r.unsat) return true; // skip SAT casos
        // brute-force: no debe existir asignación.
        const existsSat = enumerateAllAssignments(numVars, clauses);
        if (existsSat) {
          throw new Error(
            `Solver declaró UNSAT pero existe asignación satisfactoria. clauses=${clauses.map((c) => Array.from(c).join(' ')).join('|')}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
