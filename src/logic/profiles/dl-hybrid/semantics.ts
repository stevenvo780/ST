// ============================================================
// ST dL-Hybrid — Semántica concreta (interpretación de términos y fórmulas)
// ============================================================
// Funciones puras que dan significado a términos y fórmulas dL sobre un
// estado concreto `State = Map<varName, value: number>`. Esta capa NO
// decide validez universal; sólo evalúa con valores concretos. La capa
// `tableau.ts` la usa para chequear contramodelos y propagar estados a
// través de programas híbridos.
//
// Convenciones:
//   • División por cero → NaN (la comparación con NaN cae al lado false).
//   • Comparación = sobre flotantes usa tolerancia EPS = 1e-9.
//   • Una variable no presente en el estado se interpreta como 0.
// ============================================================

import type { DLTerm, DLFormula, State, CompOp } from './ast';

const EPS = 1e-9;

/** Evalúa un término sobre un estado concreto. */
export function evalTerm(t: DLTerm, s: State): number {
  switch (t.kind) {
    case 'num':
      return t.value;
    case 'var':
      return s.get(t.name) ?? 0;
    case 'plus':
      return evalTerm(t.left, s) + evalTerm(t.right, s);
    case 'minus':
      return evalTerm(t.left, s) - evalTerm(t.right, s);
    case 'times':
      return evalTerm(t.left, s) * evalTerm(t.right, s);
    case 'div': {
      const den = evalTerm(t.right, s);
      if (Math.abs(den) < EPS) return NaN;
      return evalTerm(t.left, s) / den;
    }
    case 'neg':
      return -evalTerm(t.arg, s);
    case 'pow': {
      const b = evalTerm(t.base, s);
      return Math.pow(b, t.exp);
    }
  }
}

/** Evalúa una comparación con tolerancia. */
export function evalComp(op: CompOp, a: number, b: number): boolean {
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  switch (op) {
    case '=':
      return Math.abs(a - b) < EPS;
    case '!=':
      return Math.abs(a - b) >= EPS;
    case '<':
      return a < b - EPS;
    case '<=':
      return a <= b + EPS;
    case '>':
      return a > b + EPS;
    case '>=':
      return a >= b - EPS;
  }
}

/**
 * Evalúa una fórmula proposicional / aritmética (sin modalidades) sobre
 * un estado concreto. Para fórmulas con [α]/⟨α⟩ se requiere el motor de
 * tableau (`tableau.ts`).
 */
export function evalQuantifierFree(f: DLFormula, s: State): boolean {
  switch (f.kind) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'comp':
      return evalComp(f.op, evalTerm(f.left, s), evalTerm(f.right, s));
    case 'not':
      return !evalQuantifierFree(f.arg, s);
    case 'and':
      return evalQuantifierFree(f.left, s) && evalQuantifierFree(f.right, s);
    case 'or':
      return evalQuantifierFree(f.left, s) || evalQuantifierFree(f.right, s);
    case 'implies':
      return !evalQuantifierFree(f.left, s) || evalQuantifierFree(f.right, s);
    case 'iff':
      return evalQuantifierFree(f.left, s) === evalQuantifierFree(f.right, s);
    case 'box':
    case 'diamond':
      throw new Error('evalQuantifierFree no maneja modalidades; usar tableau.');
  }
}

/** Substitución de un término por otro dentro de un término. */
export function substTerm(t: DLTerm, varName: string, replacement: DLTerm): DLTerm {
  switch (t.kind) {
    case 'num':
      return t;
    case 'var':
      return t.name === varName ? replacement : t;
    case 'plus':
      return {
        kind: 'plus',
        left: substTerm(t.left, varName, replacement),
        right: substTerm(t.right, varName, replacement),
      };
    case 'minus':
      return {
        kind: 'minus',
        left: substTerm(t.left, varName, replacement),
        right: substTerm(t.right, varName, replacement),
      };
    case 'times':
      return {
        kind: 'times',
        left: substTerm(t.left, varName, replacement),
        right: substTerm(t.right, varName, replacement),
      };
    case 'div':
      return {
        kind: 'div',
        left: substTerm(t.left, varName, replacement),
        right: substTerm(t.right, varName, replacement),
      };
    case 'neg':
      return { kind: 'neg', arg: substTerm(t.arg, varName, replacement) };
    case 'pow':
      return { kind: 'pow', base: substTerm(t.base, varName, replacement), exp: t.exp };
  }
}

/** Substitución dentro de una fórmula (sólo a través de comparaciones). */
export function substFormula(f: DLFormula, varName: string, replacement: DLTerm): DLFormula {
  switch (f.kind) {
    case 'true':
    case 'false':
      return f;
    case 'comp':
      return {
        kind: 'comp',
        op: f.op,
        left: substTerm(f.left, varName, replacement),
        right: substTerm(f.right, varName, replacement),
      };
    case 'not':
      return { kind: 'not', arg: substFormula(f.arg, varName, replacement) };
    case 'and':
      return {
        kind: 'and',
        left: substFormula(f.left, varName, replacement),
        right: substFormula(f.right, varName, replacement),
      };
    case 'or':
      return {
        kind: 'or',
        left: substFormula(f.left, varName, replacement),
        right: substFormula(f.right, varName, replacement),
      };
    case 'implies':
      return {
        kind: 'implies',
        left: substFormula(f.left, varName, replacement),
        right: substFormula(f.right, varName, replacement),
      };
    case 'iff':
      return {
        kind: 'iff',
        left: substFormula(f.left, varName, replacement),
        right: substFormula(f.right, varName, replacement),
      };
    case 'box':
    case 'diamond':
      // No se hace alfa-renaming: si la variable es modificada dentro del
      // programa la substitución podría capturar; el tableau se encarga
      // de no introducir estas situaciones (asigna desde el estado actual).
      return f;
  }
}
