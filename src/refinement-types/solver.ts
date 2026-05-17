// ============================================================
// Refinement types — Solver bounded de VCs
// ============================================================
//
// Las VCs (verification conditions) son listas de predicados que
// se conjuntan. checkVC(P) responde:
//   - satisfiable: ¿existe asignación que haga ⋀P verdadero?
//   - counter:     dicha asignación si la hay (testigo).
//
// Algoritmo: enumeración acotada sobre Int en [-bound, +bound]
// y sobre Bool. Es deliberadamente simple — Liquid Haskell usa Z3,
// nosotros usamos búsqueda finita suficiente para los tests
// del módulo y para subtipado de rangos pequeños.
//
// Para chequear "P ⇒ Q" (validez del implicador), se busca un
// contraejemplo a "P ∧ ¬Q": si NO se halla en el dominio acotado,
// se reporta válido.

import {
  evalPredicate,
  freeVars,
  parsePredicate,
  type PEnv,
  type PExpr,
  type PValue,
} from './predicate';

export interface SolverOpts {
  /** Cota inclusiva para enteros: dominio [-intBound, +intBound]. */
  intBound?: number;
  /** Cota total de intentos para abortar enumeración excesiva. */
  maxAttempts?: number;
}

export interface CheckResult {
  satisfiable: boolean;
  counter?: Record<string, number | boolean>;
}

interface VarInfo {
  name: string;
  kind: 'int' | 'bool';
}

/**
 * Heurística para clasificar variables libres en booleanas o enteras.
 * Una variable se marca como booleana si aparece como operando directo
 * de !, &&, || o en comparaciones contra booleanos literales.
 */
function classifyVars(ast: PExpr): Map<string, 'int' | 'bool'> {
  const kinds = new Map<string, 'int' | 'bool'>();
  function visit(e: PExpr, expectedBool: boolean) {
    switch (e.kind) {
      case 'num':
      case 'bool':
      case 'str':
        return;
      case 'var':
        if (expectedBool) {
          const prev = kinds.get(e.name);
          if (!prev) kinds.set(e.name, 'bool');
        } else if (!kinds.has(e.name)) {
          kinds.set(e.name, 'int');
        }
        return;
      case 'unop':
        visit(e.arg, e.op === '!');
        return;
      case 'binop': {
        switch (e.op) {
          case '&&':
          case '||':
            visit(e.left, true);
            visit(e.right, true);
            return;
          case '+':
          case '-':
          case '*':
          case '/':
          case '<':
          case '<=':
          case '>':
          case '>=':
            visit(e.left, false);
            visit(e.right, false);
            return;
          case '==':
          case '!=': {
            const rightBool = e.right.kind === 'bool' || e.left.kind === 'bool';
            visit(e.left, rightBool);
            visit(e.right, rightBool);
            return;
          }
        }
      }
    }
  }
  visit(ast, true); // top-level expected boolean
  return kinds;
}

function collectVars(predicates: string[]): { vars: VarInfo[]; asts: PExpr[] } {
  const all = new Map<string, 'int' | 'bool'>();
  const asts: PExpr[] = [];
  for (const src of predicates) {
    const ast = parsePredicate(src);
    asts.push(ast);
    const local = classifyVars(ast);
    const free = freeVars(ast);
    for (const v of free) {
      const newKind = local.get(v) ?? 'int';
      const prev = all.get(v);
      if (!prev) all.set(v, newKind);
      else if (prev !== newKind) {
        // conflicto: optamos por 'int' (más informativo)
        all.set(v, 'int');
      }
    }
  }
  const vars: VarInfo[] = Array.from(all.entries()).map(([name, kind]) => ({ name, kind }));
  return { vars, asts };
}

function envValueAt(info: VarInfo, index: number, intBound: number): PValue {
  if (info.kind === 'bool') {
    return index % 2 === 0;
  }
  // enumerar 0, 1, -1, 2, -2, ..., intBound, -intBound
  if (index === 0) return 0;
  const half = Math.ceil(index / 2);
  if (half > intBound) return intBound + 1; // fuera de cota — caller deberá filtrar
  return index % 2 === 1 ? half : -half;
}

function domainSize(info: VarInfo, intBound: number): number {
  if (info.kind === 'bool') return 2;
  return 2 * intBound + 1;
}

/**
 * checkVC — devuelve si la conjunción de predicados es satisfacible.
 * Si lo es, incluye un testigo `counter` con la asignación encontrada.
 * El nombre "counter" se conserva por compatibilidad con la firma
 * típica de verificadores que buscan contraejemplos de implicaciones.
 */
export function checkVC(predicates: string[], opts: SolverOpts = {}): CheckResult {
  const intBound = opts.intBound ?? 8;
  const maxAttempts = opts.maxAttempts ?? 50_000;

  // VC vacía o sólo "true": trivialmente satisfacible con env vacío.
  if (predicates.length === 0) {
    return { satisfiable: true, counter: {} };
  }
  const { vars, asts } = collectVars(predicates);

  // Caso sin variables libres: evaluar directo.
  if (vars.length === 0) {
    try {
      for (const a of asts) {
        const v = evalPredicate(a, {});
        if (v !== true) return { satisfiable: false };
      }
      return { satisfiable: true, counter: {} };
    } catch {
      return { satisfiable: false };
    }
  }

  const sizes = vars.map((v) => domainSize(v, intBound));
  const total = sizes.reduce((a, b) => a * b, 1);
  const attempts = Math.min(total, maxAttempts);

  for (let i = 0; i < attempts; i++) {
    const env: PEnv = {};
    let idx = i;
    let outOfDomain = false;
    for (let j = 0; j < vars.length; j++) {
      const info = vars[j];
      const size = sizes[j];
      const localIdx = idx % size;
      idx = Math.floor(idx / size);
      const val = envValueAt(info, localIdx, intBound);
      if (typeof val === 'number' && Math.abs(val) > intBound) {
        outOfDomain = true;
        break;
      }
      env[info.name] = val;
    }
    if (outOfDomain) continue;
    let allTrue = true;
    try {
      for (const a of asts) {
        const v = evalPredicate(a, env);
        if (v !== true) {
          allTrue = false;
          break;
        }
      }
    } catch {
      allTrue = false;
    }
    if (allTrue) {
      const counter: Record<string, number | boolean> = {};
      for (const v of vars) {
        const val = env[v.name];
        if (typeof val === 'number' || typeof val === 'boolean') {
          counter[v.name] = val;
        }
      }
      return { satisfiable: true, counter };
    }
  }
  return { satisfiable: false };
}

/**
 * implies — chequea si `premises ⇒ conclusion` es válido en el dominio
 * acotado. Implementado como búsqueda de contraejemplo a
 * `premises ∧ ¬conclusion`.
 */
export function implies(premises: string[], conclusion: string, opts: SolverOpts = {}): boolean {
  const negated = `!(${conclusion})`;
  const res = checkVC([...premises, negated], opts);
  // Si NO encontramos asignación que satisfaga premises ∧ ¬conclusion,
  // entonces la implicación es válida (en el dominio acotado).
  return !res.satisfiable;
}
