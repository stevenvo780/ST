// ============================================================
// G3 — Normalizacion de formulas a {atom, not, and, or, implies}
// ============================================================
//
// El nucleo G3 razona sobre 5 conectivos. Las formulas con
// biconditional, xor, nand, nor se reescriben a esa base; tambien
// se expanden cuantificadores y operadores aritmeticos no
// soportados (devolviendo error semantico via NaN-formula).

import { Formula } from '../../types';

/**
 * Reescribe la formula al nucleo {atom, true, false, not, and, or, implies}
 * preservando las locaciones. Las formulas no proposicionales se dejan tal
 * cual: el prover las tratara como atomicas y normalmente no podra cerrar
 * la prueba salvo coincidencia sintactica exacta.
 */
export function normalizeForG3(f: Formula): Formula {
  switch (f.kind) {
    case 'atom':
    case 'true':
    case 'false':
      return f;
    case 'not': {
      const inner = f.args && f.args[0] ? normalizeForG3(f.args[0]) : f;
      return { kind: 'not', args: [inner], source: f.source };
    }
    case 'and':
    case 'or':
    case 'implies': {
      const a = f.args && f.args[0] ? normalizeForG3(f.args[0]) : f;
      const b = f.args && f.args[1] ? normalizeForG3(f.args[1]) : f;
      return { kind: f.kind, args: [a, b], source: f.source };
    }
    case 'biconditional': {
      // A ↔ B  ≡  (A → B) ∧ (B → A)
      if (!f.args || !f.args[0] || !f.args[1]) return f;
      const a = normalizeForG3(f.args[0]);
      const b = normalizeForG3(f.args[1]);
      return {
        kind: 'and',
        args: [
          { kind: 'implies', args: [a, b] },
          { kind: 'implies', args: [b, a] },
        ],
        source: f.source,
      };
    }
    case 'xor': {
      // A ⊕ B  ≡  (A ∧ ¬B) ∨ (¬A ∧ B)
      if (!f.args || !f.args[0] || !f.args[1]) return f;
      const a = normalizeForG3(f.args[0]);
      const b = normalizeForG3(f.args[1]);
      return {
        kind: 'or',
        args: [
          { kind: 'and', args: [a, { kind: 'not', args: [b] }] },
          { kind: 'and', args: [{ kind: 'not', args: [a] }, b] },
        ],
        source: f.source,
      };
    }
    case 'nand': {
      // A ↑ B  ≡  ¬(A ∧ B)
      if (!f.args || !f.args[0] || !f.args[1]) return f;
      const a = normalizeForG3(f.args[0]);
      const b = normalizeForG3(f.args[1]);
      return { kind: 'not', args: [{ kind: 'and', args: [a, b] }], source: f.source };
    }
    case 'nor': {
      // A ↓ B  ≡  ¬(A ∨ B)
      if (!f.args || !f.args[0] || !f.args[1]) return f;
      const a = normalizeForG3(f.args[0]);
      const b = normalizeForG3(f.args[1]);
      return { kind: 'not', args: [{ kind: 'or', args: [a, b] }], source: f.source };
    }
    default:
      // Cuantificadores, predicados, modales, aritmetica: el prover
      // proposicional los trata como atomos opacos.
      return f;
  }
}

/**
 * Canoniza una formula a una representacion textual estable que ignora
 * `source` y normaliza orden interno donde aplica. Sirve como clave para
 * comparar formulas en multisets.
 */
export function formulaKey(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return `a:${f.name ?? '?'}`;
    case 'true':
      return 'T';
    case 'false':
      return 'F';
    case 'not':
      return `n(${f.args && f.args[0] ? formulaKey(f.args[0]) : '?'})`;
    case 'and':
    case 'or':
    case 'implies':
    case 'biconditional': {
      const a = f.args && f.args[0] ? formulaKey(f.args[0]) : '?';
      const b = f.args && f.args[1] ? formulaKey(f.args[1]) : '?';
      return `${f.kind}(${a},${b})`;
    }
    case 'predicate':
      return `p:${f.name ?? '?'}(${(f.params ?? f.terms ?? []).join(',')})`;
    case 'forall':
    case 'exists':
      return `${f.kind}:${f.variable ?? '?'}(${f.args && f.args[0] ? formulaKey(f.args[0]) : '?'})`;
    default:
      // Fallback: usar kind + estructura recursiva
      return `${f.kind}(${(f.args ?? []).map(formulaKey).join(',')})`;
  }
}
