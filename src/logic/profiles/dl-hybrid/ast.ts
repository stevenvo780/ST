// ============================================================
// ST dL-Hybrid — AST de Differential Dynamic Logic (subset)
// ============================================================
// Tipos AST para Differential Dynamic Logic (Platzer 2008/2010),
// subset suficiente para verificación de sistemas híbridos: estados
// continuos modelados por ODEs polinomiales y discretos por
// asignaciones / saltos no deterministas.
//
// El AST separa cuatro estratos:
//   • Term      — expresiones aritméticas reales sobre variables.
//   • Comparison— átomos del tipo t₁ ⋈ t₂ con ⋈ ∈ {=,≠,<,≤,>,≥}.
//   • DLFormula — fórmulas dL: booleanos + modalidades [α]φ y ⟨α⟩φ.
//   • HybridProgram — programas híbridos (asignación, ODE, secuencia,
//     choice no determinista, test, loop *).
//
// El loop α* está limitado a un horizonte finito en la implementación
// (decidible). Se documenta la limitación abajo.
// ============================================================

/** Término aritmético real. Subset de R[x₁,…,xₙ]. */
export type DLTerm =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'plus'; left: DLTerm; right: DLTerm }
  | { kind: 'minus'; left: DLTerm; right: DLTerm }
  | { kind: 'times'; left: DLTerm; right: DLTerm }
  | { kind: 'div'; left: DLTerm; right: DLTerm }
  | { kind: 'neg'; arg: DLTerm }
  | { kind: 'pow'; base: DLTerm; exp: number };

/** Operador de comparación sobre términos. */
export type CompOp = '=' | '!=' | '<' | '<=' | '>' | '>=';

/** Sistema de ODEs: lista de (variable, ladoDerecho) + dominio opcional. */
export interface OdeSystem {
  /** Cada par representa la ecuación var' = rhs. */
  equations: Array<{ varName: string; rhs: DLTerm }>;
  /** Dominio Q: la evolución continúa mientras Q se mantiene. */
  domain?: DLFormula;
}

/**
 * Programa híbrido del cálculo dL.
 *
 * Operadores:
 *   x := e          asignación discreta
 *   x := *          asignación no determinista (any-real)
 *   ?φ              test (bloquea si φ no se cumple)
 *   α ; β           secuencia
 *   α ∪ β           choice no determinista
 *   α*              loop (bounded en la implementación)
 *   x' = f(x) & Q   evolución continua según ODE bajo dominio Q
 */
export type HybridProgram =
  | { kind: 'assign'; varName: string; rhs: DLTerm }
  | { kind: 'nondet'; varName: string }
  | { kind: 'test'; cond: DLFormula }
  | { kind: 'seq'; left: HybridProgram; right: HybridProgram }
  | { kind: 'choice'; left: HybridProgram; right: HybridProgram }
  | { kind: 'loop'; body: HybridProgram }
  | { kind: 'ode'; system: OdeSystem };

/** Fórmula del cálculo dL. */
export type DLFormula =
  | { kind: 'true' }
  | { kind: 'false' }
  | { kind: 'comp'; op: CompOp; left: DLTerm; right: DLTerm }
  | { kind: 'not'; arg: DLFormula }
  | { kind: 'and'; left: DLFormula; right: DLFormula }
  | { kind: 'or'; left: DLFormula; right: DLFormula }
  | { kind: 'implies'; left: DLFormula; right: DLFormula }
  | { kind: 'iff'; left: DLFormula; right: DLFormula }
  | { kind: 'box'; program: HybridProgram; post: DLFormula }
  | { kind: 'diamond'; program: HybridProgram; post: DLFormula };

// --- constructores cómodos ---

export const num = (value: number): DLTerm => ({ kind: 'num', value });
export const variable = (name: string): DLTerm => ({ kind: 'var', name });
export const plus = (left: DLTerm, right: DLTerm): DLTerm => ({ kind: 'plus', left, right });
export const minus = (left: DLTerm, right: DLTerm): DLTerm => ({ kind: 'minus', left, right });
export const times = (left: DLTerm, right: DLTerm): DLTerm => ({ kind: 'times', left, right });
export const divide = (left: DLTerm, right: DLTerm): DLTerm => ({ kind: 'div', left, right });
export const negTerm = (arg: DLTerm): DLTerm => ({ kind: 'neg', arg });
export const power = (base: DLTerm, exp: number): DLTerm => ({ kind: 'pow', base, exp });

export const comp = (op: CompOp, left: DLTerm, right: DLTerm): DLFormula => ({
  kind: 'comp',
  op,
  left,
  right,
});
export const trueF: DLFormula = { kind: 'true' };
export const falseF: DLFormula = { kind: 'false' };
export const notF = (arg: DLFormula): DLFormula => ({ kind: 'not', arg });
export const andF = (left: DLFormula, right: DLFormula): DLFormula => ({
  kind: 'and',
  left,
  right,
});
export const orF = (left: DLFormula, right: DLFormula): DLFormula => ({ kind: 'or', left, right });
export const implies = (left: DLFormula, right: DLFormula): DLFormula => ({
  kind: 'implies',
  left,
  right,
});
export const iff = (left: DLFormula, right: DLFormula): DLFormula => ({ kind: 'iff', left, right });
export const box = (program: HybridProgram, post: DLFormula): DLFormula => ({
  kind: 'box',
  program,
  post,
});
export const diamond = (program: HybridProgram, post: DLFormula): DLFormula => ({
  kind: 'diamond',
  program,
  post,
});

export const assign = (varName: string, rhs: DLTerm): HybridProgram => ({
  kind: 'assign',
  varName,
  rhs,
});
export const nondet = (varName: string): HybridProgram => ({ kind: 'nondet', varName });
export const test = (cond: DLFormula): HybridProgram => ({ kind: 'test', cond });
export const seq = (left: HybridProgram, right: HybridProgram): HybridProgram => ({
  kind: 'seq',
  left,
  right,
});
export const choice = (left: HybridProgram, right: HybridProgram): HybridProgram => ({
  kind: 'choice',
  left,
  right,
});
export const loop = (body: HybridProgram): HybridProgram => ({ kind: 'loop', body });
export const ode = (system: OdeSystem): HybridProgram => ({ kind: 'ode', system });

/** Estado en R^n: asignación variable → número. */
export type State = Map<string, number>;

/** Clona un estado para uso inmutable durante traversal. */
export function cloneState(s: State): State {
  return new Map(s);
}

/** Recoge las variables libres en un término. */
export function termVars(t: DLTerm, acc: Set<string> = new Set()): Set<string> {
  switch (t.kind) {
    case 'num':
      return acc;
    case 'var':
      acc.add(t.name);
      return acc;
    case 'plus':
    case 'minus':
    case 'times':
    case 'div':
      termVars(t.left, acc);
      termVars(t.right, acc);
      return acc;
    case 'neg':
    case 'pow':
      termVars(t.kind === 'neg' ? t.arg : t.base, acc);
      return acc;
  }
}

/** Recoge las variables que aparecen en una fórmula. */
export function formulaVars(f: DLFormula, acc: Set<string> = new Set()): Set<string> {
  switch (f.kind) {
    case 'true':
    case 'false':
      return acc;
    case 'comp':
      termVars(f.left, acc);
      termVars(f.right, acc);
      return acc;
    case 'not':
      return formulaVars(f.arg, acc);
    case 'and':
    case 'or':
    case 'implies':
    case 'iff':
      formulaVars(f.left, acc);
      formulaVars(f.right, acc);
      return acc;
    case 'box':
    case 'diamond':
      programVars(f.program, acc);
      formulaVars(f.post, acc);
      return acc;
  }
}

/** Recoge variables modificadas/leídas por un programa. */
export function programVars(p: HybridProgram, acc: Set<string> = new Set()): Set<string> {
  switch (p.kind) {
    case 'assign':
      acc.add(p.varName);
      termVars(p.rhs, acc);
      return acc;
    case 'nondet':
      acc.add(p.varName);
      return acc;
    case 'test':
      return formulaVars(p.cond, acc);
    case 'seq':
    case 'choice':
      programVars(p.left, acc);
      programVars(p.right, acc);
      return acc;
    case 'loop':
      return programVars(p.body, acc);
    case 'ode':
      for (const eq of p.system.equations) {
        acc.add(eq.varName);
        termVars(eq.rhs, acc);
      }
      if (p.system.domain) formulaVars(p.system.domain, acc);
      return acc;
  }
}

/** Render legible de un término dL. */
export function termToString(t: DLTerm): string {
  switch (t.kind) {
    case 'num':
      return String(t.value);
    case 'var':
      return t.name;
    case 'plus':
      return `(${termToString(t.left)} + ${termToString(t.right)})`;
    case 'minus':
      return `(${termToString(t.left)} - ${termToString(t.right)})`;
    case 'times':
      return `(${termToString(t.left)} * ${termToString(t.right)})`;
    case 'div':
      return `(${termToString(t.left)} / ${termToString(t.right)})`;
    case 'neg':
      return `-${termToString(t.arg)}`;
    case 'pow':
      return `${termToString(t.base)}^${t.exp}`;
  }
}

/** Render legible de un programa híbrido. */
export function programToString(p: HybridProgram): string {
  switch (p.kind) {
    case 'assign':
      return `${p.varName} := ${termToString(p.rhs)}`;
    case 'nondet':
      return `${p.varName} := *`;
    case 'test':
      return `?(${formulaToString(p.cond)})`;
    case 'seq':
      return `${programToString(p.left)}; ${programToString(p.right)}`;
    case 'choice':
      return `(${programToString(p.left)} ∪ ${programToString(p.right)})`;
    case 'loop':
      return `(${programToString(p.body)})*`;
    case 'ode': {
      const eqs = p.system.equations
        .map((e) => `${e.varName}' = ${termToString(e.rhs)}`)
        .join(', ');
      const dom = p.system.domain ? ` & ${formulaToString(p.system.domain)}` : '';
      return `{${eqs}${dom}}`;
    }
  }
}

/** Render legible de una fórmula dL. */
export function formulaToString(f: DLFormula): string {
  switch (f.kind) {
    case 'true':
      return 'true';
    case 'false':
      return 'false';
    case 'comp':
      return `${termToString(f.left)} ${f.op} ${termToString(f.right)}`;
    case 'not':
      return `¬${formulaToString(f.arg)}`;
    case 'and':
      return `(${formulaToString(f.left)} ∧ ${formulaToString(f.right)})`;
    case 'or':
      return `(${formulaToString(f.left)} ∨ ${formulaToString(f.right)})`;
    case 'implies':
      return `(${formulaToString(f.left)} → ${formulaToString(f.right)})`;
    case 'iff':
      return `(${formulaToString(f.left)} ↔ ${formulaToString(f.right)})`;
    case 'box':
      return `[${programToString(f.program)}] ${formulaToString(f.post)}`;
    case 'diamond':
      return `<${programToString(f.program)}> ${formulaToString(f.post)}`;
  }
}
