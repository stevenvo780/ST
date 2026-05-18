// ============================================================
// ST dL-Hybrid — Resolución y análisis de ODEs (subset decidible)
// ============================================================
// Tres capacidades:
//   1. Clasificación de un sistema ODE como cerrado-soluble
//      (constante x' = c o lineal x' = a*x + b con a, b constantes).
//   2. Solución analítica en tiempo t para esos casos:
//        x' = c              → x(t) = x₀ + c·t
//        x' = a·x + b (a≠0)  → x(t) = (x₀ + b/a)·e^{a·t} − b/a
//        x' = a·x (a=0,b=0)  → x(t) = x₀  (cubierto por caso constante)
//   3. Derivada de Lie L_f(p) = Σᵢ (∂p/∂xᵢ)·fᵢ para chequeo de
//      invariantes diferenciales: si L_f(p) ≥ 0 en el dominio, entonces
//      p ≥ 0 es invariante a lo largo de la evolución (Platzer 2010,
//      teorema de invariantes diferenciales).
//
// Para casos no soportados (acoplamiento, no-lineal), retornar
// `{ kind: 'unsupported' }` y dejar que el tableau cierre como `unknown`.
//
// La derivada de Lie usa el motor existente `runtime/symbolic-diff` para
// la parte simbólica (Expr ↔ DLTerm via puentes).
// ============================================================

import type { Expr as SymExpr } from '../../../runtime/symbolic-diff';
import {
  cst as symCst,
  v as symVar,
  add as symAdd,
  mul as symMul,
  sub as symSub,
  pow as symPow,
  neg as symNeg,
  differentiate,
  simplify,
} from '../../../runtime/symbolic-diff';
import type { DLTerm, OdeSystem, State } from './ast';

// --- Puentes DLTerm ↔ SymExpr -----------------------------------------

/** Convierte un DLTerm en una Expr del motor symbolic-diff. */
export function termToExpr(t: DLTerm): SymExpr {
  switch (t.kind) {
    case 'num':
      return symCst(t.value);
    case 'var':
      return symVar(t.name);
    case 'plus':
      return symAdd(termToExpr(t.left), termToExpr(t.right));
    case 'minus':
      return symSub(termToExpr(t.left), termToExpr(t.right));
    case 'times':
      return symMul(termToExpr(t.left), termToExpr(t.right));
    case 'div':
      // symbolic-diff no tiene 'sub'-div constructor con shortcut; usamos div directo.
      return { kind: 'div', left: termToExpr(t.left), right: termToExpr(t.right) };
    case 'neg':
      return symNeg(termToExpr(t.arg));
    case 'pow':
      return symPow(termToExpr(t.base), symCst(t.exp));
  }
}

/** Evalúa una Expr de symbolic-diff con una valuación numérica. */
function evalSymExpr(e: SymExpr, env: Map<string, number>): number {
  switch (e.kind) {
    case 'const':
      return e.value;
    case 'var':
      return env.get(e.name) ?? 0;
    case 'add':
      return e.args.reduce((acc, a) => acc + evalSymExpr(a, env), 0);
    case 'mul':
      return e.args.reduce((acc, a) => acc * evalSymExpr(a, env), 1);
    case 'sub':
      return evalSymExpr(e.left, env) - evalSymExpr(e.right, env);
    case 'div': {
      const d = evalSymExpr(e.right, env);
      if (d === 0) return NaN;
      return evalSymExpr(e.left, env) / d;
    }
    case 'pow':
      return Math.pow(evalSymExpr(e.base, env), evalSymExpr(e.exp, env));
    case 'neg':
      return -evalSymExpr(e.arg, env);
    case 'sin':
      return Math.sin(evalSymExpr(e.arg, env));
    case 'cos':
      return Math.cos(evalSymExpr(e.arg, env));
    case 'tan':
      return Math.tan(evalSymExpr(e.arg, env));
    case 'log':
      return Math.log(evalSymExpr(e.arg, env));
    case 'exp':
      return Math.exp(evalSymExpr(e.arg, env));
  }
}

// --- Clasificación de ODEs --------------------------------------------

/**
 * Resultado de intentar resolver un sistema ODE.
 *
 * `constant`  — todos los rhs son constantes (x' = c).
 * `linear`    — sistema desacoplado lineal: cada x' = a*x + b con a, b
 *               constantes y no involucra otras variables del sistema.
 * `unsupported` — fuera del subset decidible.
 */
export type SolutionKind =
  | { kind: 'constant'; rates: Map<string, number> }
  | { kind: 'linear'; coeffs: Map<string, { a: number; b: number }> }
  | { kind: 'unsupported'; reason: string };

/** Verifica si un término es una constante numérica (con simplificación). */
export function termIsConstant(t: DLTerm): number | null {
  const e = simplify(termToExpr(t));
  if (e.kind === 'const') return e.value;
  if (e.kind === 'neg' && e.arg.kind === 'const') return -e.arg.value;
  return null;
}

/**
 * Intenta extraer (a, b) tal que `rhs = a*var + b` sobre las constantes
 * (ignora otras variables → en ese caso devuelve null).
 */
export function termIsLinearIn(t: DLTerm, varName: string): { a: number; b: number } | null {
  // Estrategia: simplifica, luego evalúa la derivada simbólica respecto
  // a varName con 0 — eso da `a` si es lineal y libre de otras vars.
  const e = simplify(termToExpr(t));
  // El coeficiente a = d/dvar rhs, debe ser una constante.
  const derivative = simplify(differentiate(e, varName));
  let a: number;
  if (derivative.kind === 'const') a = derivative.value;
  else if (derivative.kind === 'neg' && derivative.arg.kind === 'const') a = -derivative.arg.value;
  else return null;
  // b = rhs(var=0, otras vars deben ser ignoradas: si aparecen → null).
  // Validamos que no haya OTRAS variables.
  const env = new Map<string, number>([[varName, 0]]);
  // Si la expresión menciona variables ajenas distintas a varName, falla.
  const vars = new Set<string>();
  const collect = (x: SymExpr): void => {
    switch (x.kind) {
      case 'var':
        vars.add(x.name);
        return;
      case 'const':
        return;
      case 'add':
      case 'mul':
        x.args.forEach(collect);
        return;
      case 'sub':
      case 'div':
        collect(x.left);
        collect(x.right);
        return;
      case 'pow':
        collect(x.base);
        collect(x.exp);
        return;
      case 'neg':
      case 'sin':
      case 'cos':
      case 'tan':
      case 'log':
      case 'exp':
        collect(x.arg);
        return;
    }
  };
  collect(e);
  for (const v of vars) {
    if (v !== varName) return null;
  }
  const b = evalSymExpr(e, env);
  if (Number.isNaN(b)) return null;
  return { a, b };
}

/**
 * Clasifica un sistema ODE en uno de los casos solubles cerrados.
 * El sistema debe ser desacoplado: cada x' = f(x) sólo puede mencionar
 * a la propia variable. Acoplamientos genéricos → unsupported.
 */
export function classifyOde(system: OdeSystem): SolutionKind {
  // Caso 1: todas constantes.
  const rates = new Map<string, number>();
  let allConstant = true;
  for (const eq of system.equations) {
    const c = termIsConstant(eq.rhs);
    if (c === null) {
      allConstant = false;
      break;
    }
    rates.set(eq.varName, c);
  }
  if (allConstant) return { kind: 'constant', rates };

  // Caso 2: sistema lineal desacoplado.
  const coeffs = new Map<string, { a: number; b: number }>();
  for (const eq of system.equations) {
    const lin = termIsLinearIn(eq.rhs, eq.varName);
    if (lin === null) {
      return {
        kind: 'unsupported',
        reason: `Ecuación ${eq.varName}' = ... no es lineal desacoplada cerrada.`,
      };
    }
    coeffs.set(eq.varName, lin);
  }
  return { kind: 'linear', coeffs };
}

// --- Evolución analítica ---------------------------------------------

const EPS = 1e-9;

/**
 * Calcula el estado tras evolucionar la ODE por tiempo t exacto (sin
 * domain check). Sólo soporta `constant` y `linear`. Para no soportadas
 * lanza error — el caller usa `classifyOde` antes.
 */
export function flow(system: OdeSystem, initial: State, t: number): State {
  const klass = classifyOde(system);
  if (klass.kind === 'unsupported') {
    throw new Error(`flow: ODE no soportada (${klass.reason})`);
  }
  const next = new Map(initial);
  if (klass.kind === 'constant') {
    for (const [v, c] of klass.rates) {
      next.set(v, (initial.get(v) ?? 0) + c * t);
    }
    return next;
  }
  // linear: x(t) = (x0 + b/a) e^{at} - b/a  (a != 0)
  //         x(t) = x0 + b*t                  (a == 0)
  for (const [v, { a, b }] of klass.coeffs) {
    const x0 = initial.get(v) ?? 0;
    if (Math.abs(a) < EPS) {
      next.set(v, x0 + b * t);
    } else {
      next.set(v, (x0 + b / a) * Math.exp(a * t) - b / a);
    }
  }
  return next;
}

// --- Derivada de Lie --------------------------------------------------

/**
 * Derivada de Lie de un término p a lo largo del campo vectorial f
 * definido por la ODE:
 *      L_f(p) = Σᵢ (∂p/∂xᵢ) · fᵢ
 * Si una variable de p no tiene ecuación, su derivada respecto al
 * tiempo es 0 (variable estática).
 */
export function lieDerivative(p: DLTerm, system: OdeSystem): SymExpr {
  const pExpr = termToExpr(p);
  const eqsByVar = new Map<string, DLTerm>();
  for (const eq of system.equations) eqsByVar.set(eq.varName, eq.rhs);

  // Conjunto de variables que aparecen en p.
  const pVars = new Set<string>();
  const collect = (x: SymExpr): void => {
    switch (x.kind) {
      case 'var':
        pVars.add(x.name);
        return;
      case 'const':
        return;
      case 'add':
      case 'mul':
        x.args.forEach(collect);
        return;
      case 'sub':
      case 'div':
        collect(x.left);
        collect(x.right);
        return;
      case 'pow':
        collect(x.base);
        collect(x.exp);
        return;
      case 'neg':
      case 'sin':
      case 'cos':
      case 'tan':
      case 'log':
      case 'exp':
        collect(x.arg);
        return;
    }
  };
  collect(pExpr);

  const terms: SymExpr[] = [];
  for (const xi of pVars) {
    const f_i = eqsByVar.get(xi);
    if (!f_i) continue; // variable estática
    const dp_dxi = differentiate(pExpr, xi);
    terms.push(symMul(dp_dxi, termToExpr(f_i)));
  }
  if (terms.length === 0) return symCst(0);
  return simplify(symAdd(...terms));
}

/**
 * Evalúa una Expr de symbolic-diff en un estado concreto. Útil para
 * chequear si la derivada de Lie es ≥ 0 en un punto específico.
 */
export function evalSym(e: SymExpr, state: State): number {
  return evalSymExpr(e, state);
}
