// ============================================================
// ST SMT — Mock backend in-process (resuelve casos triviales sin solver real)
// ============================================================

import type { Formula } from '../../types';
import type {
  ConstDeclaration,
  SMTBackend,
  SMTModel,
  SMTResult,
  SMTScope,
  SMTSort,
  ScopedAssertion,
} from './types';

/**
 * MockSMTBackend resuelve un subconjunto del SMT-LIB v2 sin solver externo:
 *  - constantes booleanas con asserts directos (P, ¬P, P→P, P∧¬P)
 *  - lineales triviales en una sola variable (x > c, x < c, x = c)
 *  - combinaciones con `and` / `or` / `not` recursivas
 *
 * No pretende ser completo. Devuelve `unknown` cuando no sabe.
 */
export class MockSMTBackend implements SMTBackend {
  readonly name = 'mock';
  private scopes: SMTScope[] = [{ decls: [], assertions: [] }];
  private lastModel: SMTModel | undefined;

  reset(): void {
    this.scopes = [{ decls: [], assertions: [] }];
    this.lastModel = undefined;
  }

  push(): void {
    this.scopes.push({ decls: [], assertions: [] });
  }

  pop(levels = 1): void {
    for (let i = 0; i < levels; i += 1) {
      if (this.scopes.length <= 1) break;
      this.scopes.pop();
    }
  }

  declareConst(name: string, sort: SMTSort): void {
    const top = this.currentScope();
    top.decls.push({ name, sort });
  }

  assertFormula(smtlib: string): void {
    const top = this.currentScope();
    top.assertions.push({ body: smtlib });
  }

  /** Versión interna (no parte del contrato público) para inyectar fórmula AST. */
  assertAst(formula: Formula, smtlib?: string): void {
    const top = this.currentScope();
    const body = smtlib ?? `<ast:${formula.kind}>`;
    top.assertions.push({ body, formula });
  }

  /** Versión interna para inyectar declaraciones detectadas por el serializer. */
  declareFromInference(decls: ConstDeclaration[]): void {
    const top = this.currentScope();
    for (const d of decls) {
      if (!top.decls.some((existing) => existing.name === d.name)) {
        top.decls.push(d);
      }
    }
  }

  checkSat(): SMTResult {
    const allAssertions = this.collectAssertions();
    if (allAssertions.length === 0) {
      this.lastModel = {};
      return 'sat';
    }

    const formulas: Formula[] = [];
    for (const a of allAssertions) {
      if (a.formula) formulas.push(a.formula);
    }

    if (formulas.length === 0) {
      this.lastModel = undefined;
      return 'unknown';
    }

    const result = solveConjunction(formulas);
    this.lastModel = result.status === 'sat' ? result.model : undefined;
    return result.status;
  }

  getModel(): SMTModel | undefined {
    return this.lastModel ? { ...this.lastModel } : undefined;
  }

  getUnsatCore(): string[] {
    // El mock no calcula core en forma estricta; devuelve los nombres
    // de las aserciones del scope actual cuando el último checkSat fue unsat.
    if (this.lastModel) return [];
    const assertions = this.collectAssertions();
    return assertions.map((_a, i) => `a${i}`);
  }

  private currentScope(): SMTScope {
    const top = this.scopes[this.scopes.length - 1];
    if (!top) {
      const fresh: SMTScope = { decls: [], assertions: [] };
      this.scopes.push(fresh);
      return fresh;
    }
    return top;
  }

  private collectAssertions(): ScopedAssertion[] {
    const out: ScopedAssertion[] = [];
    for (const scope of this.scopes) {
      out.push(...scope.assertions);
    }
    return out;
  }
}

// ── Resolución trivial ─────────────────────────────────────────

interface SolveResult {
  status: SMTResult;
  model?: SMTModel;
}

/** Evalúa una fórmula booleana cerrada bajo una valuación. */
function evalBoolean(f: Formula, val: Map<string, boolean>): boolean | undefined {
  switch (f.kind) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'atom': {
      const name = f.name ?? '';
      return val.get(name);
    }
    case 'not': {
      const inner = (f.args ?? [])[0];
      if (!inner) return undefined;
      const v = evalBoolean(inner, val);
      return v === undefined ? undefined : !v;
    }
    case 'and': {
      for (const a of f.args ?? []) {
        const v = evalBoolean(a, val);
        if (v === false) return false;
        if (v === undefined) return undefined;
      }
      return true;
    }
    case 'or': {
      let undef = false;
      for (const a of f.args ?? []) {
        const v = evalBoolean(a, val);
        if (v === true) return true;
        if (v === undefined) undef = true;
      }
      return undef ? undefined : false;
    }
    case 'implies': {
      const [p, q] = f.args ?? [];
      if (!p || !q) return undefined;
      const pv = evalBoolean(p, val);
      const qv = evalBoolean(q, val);
      if (pv === false) return true;
      if (qv === true) return true;
      if (pv === undefined || qv === undefined) return undefined;
      return false;
    }
    case 'biconditional': {
      const [p, q] = f.args ?? [];
      if (!p || !q) return undefined;
      const pv = evalBoolean(p, val);
      const qv = evalBoolean(q, val);
      if (pv === undefined || qv === undefined) return undefined;
      return pv === qv;
    }
    case 'xor': {
      let acc: boolean | undefined = false;
      for (const a of f.args ?? []) {
        const v = evalBoolean(a, val);
        if (v === undefined) return undefined;
        acc = acc !== v;
      }
      return acc;
    }
    case 'nand': {
      const args = f.args ?? [];
      for (const a of args) {
        const v = evalBoolean(a, val);
        if (v === false) return true;
        if (v === undefined) return undefined;
      }
      return false;
    }
    case 'nor': {
      let undef = false;
      for (const a of f.args ?? []) {
        const v = evalBoolean(a, val);
        if (v === true) return false;
        if (v === undefined) undef = true;
      }
      return undef ? undefined : true;
    }
    default:
      return undefined;
  }
}

/** Recolecta los átomos booleanos de una fórmula. */
function collectAtoms(f: Formula, out: Set<string>): void {
  if (f.kind === 'atom' && f.name) {
    out.add(f.name);
    return;
  }
  for (const a of f.args ?? []) {
    collectAtoms(a, out);
  }
}

/** Detecta si la fórmula tiene aritmética/comparaciones. */
function isPurelyBoolean(f: Formula): boolean {
  switch (f.kind) {
    case 'atom':
    case 'true':
    case 'false':
      return true;
    case 'not':
    case 'and':
    case 'or':
    case 'implies':
    case 'biconditional':
    case 'nand':
    case 'nor':
    case 'xor': {
      for (const a of f.args ?? []) {
        if (!isPurelyBoolean(a)) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

/** Resuelve un conjunto de aserciones (interpretadas como conjunción). */
function solveConjunction(formulas: Formula[]): SolveResult {
  if (formulas.every(isPurelyBoolean)) {
    return solveBooleanSAT(formulas);
  }

  const arithResult = trySolveLinearArith(formulas);
  if (arithResult) return arithResult;

  return { status: 'unknown' };
}

/** SAT booleano por enumeración (suficiente para fragmentos triviales <16 atoms). */
function solveBooleanSAT(formulas: Formula[]): SolveResult {
  const atoms = new Set<string>();
  for (const f of formulas) collectAtoms(f, atoms);

  if (atoms.size === 0) {
    let allTrue = true;
    for (const f of formulas) {
      const v = evalBoolean(f, new Map());
      if (v !== true) allTrue = false;
    }
    return allTrue ? { status: 'sat', model: {} } : { status: 'unsat' };
  }

  if (atoms.size > 16) {
    return { status: 'unknown' };
  }

  const atomList = [...atoms];
  const total = 1 << atomList.length;

  for (let mask = 0; mask < total; mask += 1) {
    const val = new Map<string, boolean>();
    for (let i = 0; i < atomList.length; i += 1) {
      const name = atomList[i];
      if (!name) continue;
      val.set(name, ((mask >> i) & 1) === 1);
    }
    let allOk = true;
    for (const f of formulas) {
      const r = evalBoolean(f, val);
      if (r !== true) {
        allOk = false;
        break;
      }
    }
    if (allOk) {
      const model: SMTModel = {};
      for (const [k, v] of val) model[k] = v;
      return { status: 'sat', model };
    }
  }
  return { status: 'unsat' };
}

interface LinearConstraint {
  variable: string;
  op: '<' | '<=' | '>' | '>=' | '=';
  bound: number;
}

/**
 * Intenta extraer constraints lineales en una sola variable (x op c) y
 * verifica consistencia. Soporta:
 *   x > c, x < c, x >= c, x <= c, x = c
 * Si encuentra mezcla de variables u operadores no soportados, devuelve null.
 */
function trySolveLinearArith(formulas: Formula[]): SolveResult | null {
  const constraints: LinearConstraint[] = [];

  for (const f of formulas) {
    const extracted = extractConstraints(f);
    if (!extracted) return null;
    constraints.push(...extracted);
  }

  // Agrupar por variable
  const byVar = new Map<string, LinearConstraint[]>();
  for (const c of constraints) {
    const existing = byVar.get(c.variable);
    if (existing) {
      existing.push(c);
    } else {
      byVar.set(c.variable, [c]);
    }
  }

  if (byVar.size === 0) return null;

  const model: SMTModel = {};
  for (const [variable, cs] of byVar) {
    let lo = Number.NEGATIVE_INFINITY;
    let hi = Number.POSITIVE_INFINITY;
    let loInclusive = false;
    let hiInclusive = false;
    let fixed: number | undefined;

    for (const c of cs) {
      if (c.op === '=') {
        if (fixed !== undefined && fixed !== c.bound) {
          return { status: 'unsat' };
        }
        fixed = c.bound;
      } else if (c.op === '<') {
        if (c.bound < hi || (c.bound === hi && hiInclusive)) {
          hi = c.bound;
          hiInclusive = false;
        }
      } else if (c.op === '<=') {
        if (c.bound < hi) {
          hi = c.bound;
          hiInclusive = true;
        }
      } else if (c.op === '>') {
        if (c.bound > lo || (c.bound === lo && loInclusive)) {
          lo = c.bound;
          loInclusive = false;
        }
      } else if (c.op === '>=') {
        if (c.bound > lo) {
          lo = c.bound;
          loInclusive = true;
        }
      }
    }

    if (fixed !== undefined) {
      const okLo = loInclusive ? fixed >= lo : fixed > lo;
      const okHi = hiInclusive ? fixed <= hi : fixed < hi;
      if (!okLo || !okHi) return { status: 'unsat' };
      model[variable] = fixed;
      continue;
    }

    if (lo > hi) return { status: 'unsat' };
    if (lo === hi && !(loInclusive && hiInclusive)) return { status: 'unsat' };

    const witness = pickWitness(lo, hi, loInclusive, hiInclusive);
    if (witness === undefined) return { status: 'unsat' };
    model[variable] = witness;
  }

  return { status: 'sat', model };
}

function pickWitness(
  lo: number,
  hi: number,
  loInclusive: boolean,
  hiInclusive: boolean,
): number | undefined {
  const isLoInfinite = lo === Number.NEGATIVE_INFINITY;
  const isHiInfinite = hi === Number.POSITIVE_INFINITY;

  if (isLoInfinite && isHiInfinite) return 0;
  if (isLoInfinite) return hiInclusive ? hi : hi - 1;
  if (isHiInfinite) return loInclusive ? lo : lo + 1;

  // Intervalo finito; preferir punto medio entero si encaja.
  const mid = (lo + hi) / 2;
  const okLo = loInclusive ? mid >= lo : mid > lo;
  const okHi = hiInclusive ? mid <= hi : mid < hi;
  if (okLo && okHi) return mid;

  if (loInclusive) return lo;
  if (hiInclusive) return hi;
  return undefined;
}

function extractConstraints(f: Formula): LinearConstraint[] | null {
  if (f.kind === 'and') {
    const out: LinearConstraint[] = [];
    for (const a of f.args ?? []) {
      const sub = extractConstraints(a);
      if (!sub) return null;
      out.push(...sub);
    }
    return out;
  }

  if (
    f.kind === 'less' ||
    f.kind === 'less_eq' ||
    f.kind === 'greater' ||
    f.kind === 'greater_eq' ||
    f.kind === 'equals'
  ) {
    const args = f.args ?? [];
    const [lhs, rhs] = args;
    if (!lhs || !rhs) return null;

    const lhsAtom = lhs.kind === 'atom' ? lhs.name : undefined;
    const rhsAtom = rhs.kind === 'atom' ? rhs.name : undefined;
    const lhsNum = lhs.kind === 'number' ? lhs.value : undefined;
    const rhsNum = rhs.kind === 'number' ? rhs.value : undefined;

    if (lhsAtom && rhsNum !== undefined) {
      return [{ variable: lhsAtom, op: mapOp(f.kind), bound: rhsNum }];
    }
    if (rhsAtom && lhsNum !== undefined) {
      return [{ variable: rhsAtom, op: flipOp(mapOp(f.kind)), bound: lhsNum }];
    }
    return null;
  }

  return null;
}

function mapOp(kind: FormulaKindRel): LinearConstraint['op'] {
  switch (kind) {
    case 'less':
      return '<';
    case 'less_eq':
      return '<=';
    case 'greater':
      return '>';
    case 'greater_eq':
      return '>=';
    case 'equals':
      return '=';
  }
}

function flipOp(op: LinearConstraint['op']): LinearConstraint['op'] {
  switch (op) {
    case '<':
      return '>';
    case '<=':
      return '>=';
    case '>':
      return '<';
    case '>=':
      return '<=';
    case '=':
      return '=';
  }
}

type FormulaKindRel = 'less' | 'less_eq' | 'greater' | 'greater_eq' | 'equals';
