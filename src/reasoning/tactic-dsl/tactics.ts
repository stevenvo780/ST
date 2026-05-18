// ============================================================
// Tactic DSL — tactics built-in
// ============================================================
//
// Cada tactic recibe un ProofState y devuelve un ProofState nuevo
// (inmutable). Si la tactic no aplica al goal actual, lanza
// TacticError. Eso permite que `orElse` capture la falla y pruebe
// otra alternativa.
//
// Convención: el goal "activo" es siempre `state.goals[0]`. Las
// reglas que generan sub-goals (split, induction, destruct, …) los
// insertan al frente para que se trabajen en orden.

import {
  formulaEq,
  formulaToString,
  normalizeFormula,
  parseFormula,
  substitute,
  TacticError,
} from './types';
import type { Formula, Goal, ProofState, Tactic, TacticInvocation } from './types';

let goalCounter = 0;
function freshGoalId(prefix = 'g'): string {
  goalCounter++;
  return `${prefix}${goalCounter}`;
}

// Reset para tests deterministas (no exportado en el API público).
/** Resets the internal goal ID counter to 0. Intended for deterministic tests only. */
export function _resetGoalCounter(): void {
  goalCounter = 0;
}

function activeGoal(state: ProofState, tactic: string): Goal {
  if (state.done || state.goals.length === 0) {
    throw new TacticError(tactic, 'no hay goals activos');
  }
  const g = state.goals[0];
  if (!g) {
    throw new TacticError(tactic, 'goal frontal indefinido');
  }
  return g;
}

function withNewGoals(state: ProofState, replace: Goal[]): ProofState {
  const rest = state.goals.slice(1);
  const next = [...replace, ...rest];
  return {
    goals: next,
    history: state.history,
    done: next.length === 0,
  };
}

function recordHistory(
  before: ProofState,
  after: ProofState,
  tactic: string,
  args: unknown[],
): ProofState {
  const invocation: TacticInvocation = { tactic, args, before, after };
  return {
    ...after,
    history: [...before.history, invocation],
  };
}

// ---------- intro ----------

/**
 * `intro(name?)` — For a goal of the form `P → Q`, moves the antecedent `P`
 * into the hypothesis context under `name` (auto-generated when omitted) and
 * leaves `Q` as the new goal. Also handles `¬P` (≡ `P → False`).
 * @throws {@link TacticError} When the goal is not an implication or negation.
 */
export function intro(name?: string): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'intro');
    const f = parseFormula(goal.concl);
    let hypType: Formula;
    let newConcl: Formula;
    if (f.kind === 'imp') {
      hypType = f.left;
      newConcl = f.right;
    } else if (f.kind === 'not') {
      hypType = f.body;
      newConcl = { kind: 'false' };
    } else {
      throw new TacticError('intro', `goal no es una implicación: ${goal.concl}`);
    }
    const hypName = name ?? autoFreshHypName(goal.hyps);
    if (goal.hyps[hypName] !== undefined) {
      throw new TacticError('intro', `nombre de hipótesis '${hypName}' ya existe`);
    }
    const newGoal: Goal = {
      id: goal.id,
      hyps: { ...goal.hyps, [hypName]: formulaToString(hypType) },
      concl: formulaToString(newConcl),
    };
    const after = withNewGoals(state, [newGoal]);
    return recordHistory(state, after, 'intro', [name ?? null]);
  };
}

function autoFreshHypName(hyps: Record<string, string>): string {
  let i = 1;
  while (hyps[`H${i}`] !== undefined) i++;
  return `H${i}`;
}

// ---------- exact ----------

/**
 * `exact(term)` — Closes the current goal when `term` is either the name of
 * a hypothesis whose type matches the conclusion, or a string syntactically
 * equal to the conclusion.
 * @throws {@link TacticError} When `term` does not match the goal.
 */
export function exact(term: string): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'exact');
    const hypType = goal.hyps[term];
    if (hypType !== undefined && formulaEq(hypType, goal.concl)) {
      const after = withNewGoals(state, []);
      return recordHistory(state, after, 'exact', [term]);
    }
    if (formulaEq(term, goal.concl)) {
      const after = withNewGoals(state, []);
      return recordHistory(state, after, 'exact', [term]);
    }
    throw new TacticError(
      'exact',
      `'${term}' no coincide con goal '${goal.concl}' (hyps: ${Object.keys(goal.hyps).join(', ')})`,
    );
  };
}

// ---------- assumption ----------

/**
 * Closes the goal by finding a hypothesis whose type is syntactically equal
 * to the conclusion. Equivalent to `exact` over the full hypothesis map.
 * @throws {@link TacticError} When no hypothesis matches the conclusion.
 */
export function assumption(): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'assumption');
    for (const [name, ty] of Object.entries(goal.hyps)) {
      if (formulaEq(ty, goal.concl)) {
        const after = withNewGoals(state, []);
        return recordHistory(state, after, 'assumption', [name]);
      }
    }
    throw new TacticError(
      'assumption',
      `ninguna hipótesis prueba '${goal.concl}' (tenía: ${formatHypList(goal.hyps)})`,
    );
  };
}

function formatHypList(hyps: Record<string, string>): string {
  const entries = Object.entries(hyps);
  if (entries.length === 0) return '∅';
  return entries.map(([n, t]) => `${n}:${t}`).join(', ');
}

// ---------- apply ----------

/**
 * `apply(thm, args?)` — Backward chaining on hypothesis `thm`.
 * If `thm : A → B` and the goal is `B`, leaves sub-goal `A`.
 * Multi-premise: `thm : A → B → C` with goal `C` leaves goals `A` and `B`.
 * `args` allows immediately discharging leading premises with matching hypotheses.
 * @throws {@link TacticError} When `thm` is not in scope, its conclusion does not unify with the goal, or args are mismatched.
 */
export function apply(thm: string, args?: string[]): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'apply');
    const thmType = goal.hyps[thm];
    if (thmType === undefined) {
      throw new TacticError('apply', `'${thm}' no está en hipótesis`);
    }
    // Aplanar la flecha en (premisas[], conclusión).
    const f = parseFormula(thmType);
    const premises: Formula[] = [];
    let cur: Formula = f;
    while (cur.kind === 'imp') {
      premises.push(cur.left);
      cur = cur.right;
    }
    if (!formulaEq(formulaToString(cur), goal.concl)) {
      throw new TacticError(
        'apply',
        `conclusión de '${thm}' (${formulaToString(cur)}) no unifica con goal '${goal.concl}'`,
      );
    }
    // Descontar argumentos ya provistos: cada arg debe ser una hipótesis
    // cuyo tipo case con la siguiente premisa.
    let remaining = premises;
    if (args && args.length > 0) {
      if (args.length > premises.length) {
        throw new TacticError('apply', `demasiados args (${args.length} > ${premises.length})`);
      }
      for (let i = 0; i < args.length; i++) {
        const argName = args[i];
        const argType = goal.hyps[argName];
        const expected = premises[i];
        if (argType === undefined || expected === undefined) {
          throw new TacticError('apply', `arg '${argName}' no es hipótesis válida`);
        }
        if (!formulaEq(argType, formulaToString(expected))) {
          throw new TacticError(
            'apply',
            `arg '${argName}:${argType}' no encaja con premisa ${i + 1} (${formulaToString(expected)})`,
          );
        }
      }
      remaining = premises.slice(args.length);
    }
    const subGoals: Goal[] = remaining.map((p) => ({
      id: freshGoalId(goal.id + '_'),
      hyps: { ...goal.hyps },
      concl: formulaToString(p),
    }));
    const after = withNewGoals(state, subGoals);
    return recordHistory(state, after, 'apply', [thm, args ?? []]);
  };
}

// ---------- rewrite ----------

/**
 * `rewrite(eq, dir?)` — Uses hypothesis `eq : lhs = rhs` to replace
 * occurrences of `lhs` with `rhs` in the conclusion (left-to-right by default),
 * or `rhs` with `lhs` when `dir = 'right-to-left'`.
 * @throws {@link TacticError} When `eq` is not an equality or the pattern is absent from the conclusion.
 */
export function rewrite(
  eq: string,
  dir: 'left-to-right' | 'right-to-left' = 'left-to-right',
): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'rewrite');
    const eqType = goal.hyps[eq];
    if (eqType === undefined) {
      throw new TacticError('rewrite', `'${eq}' no está en hipótesis`);
    }
    const f = parseFormula(eqType);
    if (f.kind !== 'eq') {
      throw new TacticError('rewrite', `'${eq}:${eqType}' no es una igualdad`);
    }
    const lhsStr = formulaToString(f.left);
    const rhsStr = formulaToString(f.right);
    const from = dir === 'left-to-right' ? lhsStr : rhsStr;
    const to = dir === 'left-to-right' ? rhsStr : lhsStr;
    const newConcl = substitute(goal.concl, from, to);
    if (newConcl === goal.concl) {
      throw new TacticError('rewrite', `no se encontró '${from}' en la conclusión '${goal.concl}'`);
    }
    const newGoal: Goal = {
      id: goal.id,
      hyps: { ...goal.hyps },
      concl: normalizeFormula(newConcl),
    };
    const after = withNewGoals(state, [newGoal]);
    return recordHistory(state, after, 'rewrite', [eq, dir]);
  };
}

// ---------- rfl ----------

/**
 * Closes goals of the form `a = a` (syntactic reflexivity after normalization).
 * @throws {@link TacticError} When the goal is not an equality or the two sides differ.
 */
export function rfl(): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'rfl');
    const f = parseFormula(goal.concl);
    if (f.kind !== 'eq') {
      throw new TacticError('rfl', `goal no es una igualdad: ${goal.concl}`);
    }
    if (formulaToString(f.left) !== formulaToString(f.right)) {
      throw new TacticError('rfl', `no es reflexiva: ${goal.concl}`);
    }
    const after = withNewGoals(state, []);
    return recordHistory(state, after, 'rfl', []);
  };
}

// ---------- trivial ----------

/**
 * Closes trivially true goals: `True`, or any goal when `False` is in the hypotheses
 * (ex falso quodlibet).
 * @throws {@link TacticError} When the goal is not trivially provable.
 */
export function trivial(): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'trivial');
    const f = parseFormula(goal.concl);
    if (f.kind === 'true') {
      const after = withNewGoals(state, []);
      return recordHistory(state, after, 'trivial', []);
    }
    // True ∈ hyps no cierra ningún goal, pero si hay False en hyps, ex falso:
    for (const ty of Object.values(goal.hyps)) {
      const hf = parseFormula(ty);
      if (hf.kind === 'false') {
        const after = withNewGoals(state, []);
        return recordHistory(state, after, 'trivial', ['ex_falso']);
      }
    }
    throw new TacticError('trivial', `goal '${goal.concl}' no es trivialmente cierto`);
  };
}

// ---------- split ----------

/**
 * ∧-introduction: splits a conjunction goal `P ∧ Q` into two sub-goals `P` and `Q`.
 * @throws {@link TacticError} When the goal is not a conjunction.
 */
export function split(): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'split');
    const f = parseFormula(goal.concl);
    if (f.kind !== 'and') {
      throw new TacticError('split', `goal no es conjunción: ${goal.concl}`);
    }
    const subs: Goal[] = [
      { id: freshGoalId(goal.id + '_L'), hyps: { ...goal.hyps }, concl: formulaToString(f.left) },
      { id: freshGoalId(goal.id + '_R'), hyps: { ...goal.hyps }, concl: formulaToString(f.right) },
    ];
    const after = withNewGoals(state, subs);
    return recordHistory(state, after, 'split', []);
  };
}

// ---------- left / right ----------

/**
 * ∨-introduction (left): for a disjunction goal `P ∨ Q`, reduces to proving `P`.
 * @throws {@link TacticError} When the goal is not a disjunction.
 */
export function left(): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'left');
    const f = parseFormula(goal.concl);
    if (f.kind !== 'or') {
      throw new TacticError('left', `goal no es disyunción: ${goal.concl}`);
    }
    const sub: Goal = { id: goal.id, hyps: { ...goal.hyps }, concl: formulaToString(f.left) };
    const after = withNewGoals(state, [sub]);
    return recordHistory(state, after, 'left', []);
  };
}

/**
 * ∨-introduction (right): for a disjunction goal `P ∨ Q`, reduces to proving `Q`.
 * @throws {@link TacticError} When the goal is not a disjunction.
 */
export function right(): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'right');
    const f = parseFormula(goal.concl);
    if (f.kind !== 'or') {
      throw new TacticError('right', `goal no es disyunción: ${goal.concl}`);
    }
    const sub: Goal = { id: goal.id, hyps: { ...goal.hyps }, concl: formulaToString(f.right) };
    const after = withNewGoals(state, [sub]);
    return recordHistory(state, after, 'right', []);
  };
}

// ---------- destruct ----------

/**
 * Case analysis on hypothesis `name`.
 * - `H: P ∧ Q` → splits into hypotheses `H_L: P` and `H_R: Q` in the same goal.
 * - `H: P ∨ Q` → produces two sub-goals, each with the respective disjunct.
 * - `H: ⊥` → closes the goal (ex falso).
 * @throws {@link TacticError} When `name` is not in scope or its type cannot be destructured.
 */
export function destruct(name: string): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'destruct');
    const hypType = goal.hyps[name];
    if (hypType === undefined) {
      throw new TacticError('destruct', `'${name}' no está en hipótesis`);
    }
    const f = parseFormula(hypType);
    if (f.kind === 'and') {
      const next: Record<string, string> = { ...goal.hyps };
      delete next[name];
      next[`${name}_L`] = formulaToString(f.left);
      next[`${name}_R`] = formulaToString(f.right);
      const newGoal: Goal = { id: goal.id, hyps: next, concl: goal.concl };
      const after = withNewGoals(state, [newGoal]);
      return recordHistory(state, after, 'destruct', [name]);
    }
    if (f.kind === 'or') {
      const baseHyps = { ...goal.hyps };
      delete baseHyps[name];
      const left: Goal = {
        id: freshGoalId(goal.id + '_L'),
        hyps: { ...baseHyps, [`${name}_L`]: formulaToString(f.left) },
        concl: goal.concl,
      };
      const right: Goal = {
        id: freshGoalId(goal.id + '_R'),
        hyps: { ...baseHyps, [`${name}_R`]: formulaToString(f.right) },
        concl: goal.concl,
      };
      const after = withNewGoals(state, [left, right]);
      return recordHistory(state, after, 'destruct', [name]);
    }
    if (f.kind === 'false') {
      const after = withNewGoals(state, []);
      return recordHistory(state, after, 'destruct', [name, 'ex_falso']);
    }
    throw new TacticError(
      'destruct',
      `'${name}:${hypType}' no es ∧, ∨, ni ⊥ — no se puede destructurar`,
    );
  };
}

// ---------- induction ----------

/**
 * Structural induction on hypothesis `name: Nat`.
 * Produces two sub-goals:
 * - **zero case**: conclusion with `name` substituted by `zero`.
 * - **succ case**: adds `IH: P(k)` and `k: Nat`; conclusion is `P(succ(k))`.
 *
 * Only Nat induction is supported in this base implementation.
 * @throws {@link TacticError} When `name` is not a `Nat` hypothesis.
 */
export function induction(name: string): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'induction');
    const hypType = goal.hyps[name];
    if (hypType === undefined) {
      throw new TacticError('induction', `'${name}' no está en hipótesis`);
    }
    if (hypType !== 'Nat' && hypType !== 'nat' && hypType !== 'ℕ') {
      throw new TacticError(
        'induction',
        `inducción soportada solo sobre Nat (recibió '${name}:${hypType}')`,
      );
    }
    // hipótesis sin el nombre del inductor.
    const baseHyps: Record<string, string> = { ...goal.hyps };
    delete baseHyps[name];

    // Reusamos `name` como el binder del caso sucesor cuando es posible
    // (queda libre tras retirar la hipótesis del inductor). Esto da goals
    // legibles tipo `P(succ(n))` en vez de `P(succ(n1))`.
    const zeroConcl = substitute(goal.concl, name, 'zero');
    const succVar = pickFreshVar(baseHyps, name);
    const succConcl = substitute(goal.concl, name, `succ(${succVar})`);
    const ihConcl = substitute(goal.concl, name, succVar);

    const zeroGoal: Goal = {
      id: freshGoalId(goal.id + '_zero'),
      hyps: { ...baseHyps },
      concl: normalizeFormula(zeroConcl),
    };
    const succGoal: Goal = {
      id: freshGoalId(goal.id + '_succ'),
      hyps: { ...baseHyps, [succVar]: 'Nat', IH: normalizeFormula(ihConcl) },
      concl: normalizeFormula(succConcl),
    };
    const after = withNewGoals(state, [zeroGoal, succGoal]);
    return recordHistory(state, after, 'induction', [name]);
  };
}

function pickFreshVar(hyps: Record<string, string>, hint: string): string {
  if (hyps[hint] === undefined) return hint;
  let i = 1;
  while (hyps[`${hint}${i}`] !== undefined) i++;
  return `${hint}${i}`;
}

// ---------- case ----------

/**
 * Alias of {@link destruct} with the semantics of "case analysis".
 * Exported as `case` from `index.ts` via re-export alias (JS keyword conflict).
 */
export function caseAnalysis(name: string): Tactic {
  return destruct(name);
}

// ---------- unfold ----------
// Reemplaza un identificador opaco `def` por su body registrado en un
// "diccionario de definiciones". El tactic no tiene estado global: las
// definiciones se proveen al construir el tactic. Por defecto, `unfold`
// con un diccionario vacío es una no-op que falla.

/** Maps definition names to their body expressions. Passed to {@link unfold}. */
export interface DefDictionary {
  [name: string]: string;
}

/**
 * `unfold(def, dict)` — Replaces the identifier `def` by its body from `dict`
 * in the current conclusion. The definition dictionary is caller-supplied;
 * no global state is maintained.
 * @throws {@link TacticError} When `def` is not in `dict` or does not appear in the goal.
 */
export function unfold(def: string, dict: DefDictionary = {}): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'unfold');
    const body = dict[def];
    if (body === undefined) {
      throw new TacticError('unfold', `definición '${def}' no registrada`);
    }
    const newConcl = substitute(goal.concl, def, body);
    if (newConcl === goal.concl) {
      throw new TacticError('unfold', `'${def}' no aparece en goal`);
    }
    const newGoal: Goal = {
      id: goal.id,
      hyps: { ...goal.hyps },
      concl: normalizeFormula(newConcl),
    };
    const after = withNewGoals(state, [newGoal]);
    return recordHistory(state, after, 'unfold', [def]);
  };
}

// ---------- simp ----------

/**
 * Applies the following rewrite rules recursively to a fixed point:
 * - `True ∧ X → X`, `X ∧ True → X`, `False ∧ X → False`
 * - `False ∨ X → X`, `X ∨ False → X`, `True ∨ X → True`
 * - `True → X → X`, `X → True → True`, `False → X → True`
 * - `¬¬X → X`
 * @throws {@link TacticError} When the goal is unchanged after all rules.
 */
export function simp(): Tactic {
  return (state) => {
    const goal = activeGoal(state, 'simp');
    const original = normalizeFormula(goal.concl);
    let cur = parseFormula(goal.concl);
    let changed = true;
    let safety = 0;
    while (changed) {
      changed = false;
      safety++;
      if (safety > 100) break;
      const before = formulaToString(cur);
      cur = simpStep(cur, () => {
        changed = true;
      });
      if (formulaToString(cur) !== before) changed = true;
    }
    const next = formulaToString(cur);
    if (next === original) {
      throw new TacticError('simp', `nada que simplificar en '${goal.concl}'`);
    }
    const newGoal: Goal = { id: goal.id, hyps: { ...goal.hyps }, concl: next };
    const after = withNewGoals(state, [newGoal]);
    return recordHistory(state, after, 'simp', []);
  };
}

function simpStep(f: Formula, mark: () => void): Formula {
  switch (f.kind) {
    case 'atom':
    case 'true':
    case 'false':
      return f;
    case 'not': {
      const inner = simpStep(f.body, mark);
      if (inner.kind === 'not') {
        mark();
        return inner.body;
      }
      return { kind: 'not', body: inner };
    }
    case 'and': {
      const L = simpStep(f.left, mark);
      const R = simpStep(f.right, mark);
      if (L.kind === 'true') {
        mark();
        return R;
      }
      if (R.kind === 'true') {
        mark();
        return L;
      }
      if (L.kind === 'false' || R.kind === 'false') {
        mark();
        return { kind: 'false' };
      }
      return { kind: 'and', left: L, right: R };
    }
    case 'or': {
      const L = simpStep(f.left, mark);
      const R = simpStep(f.right, mark);
      if (L.kind === 'false') {
        mark();
        return R;
      }
      if (R.kind === 'false') {
        mark();
        return L;
      }
      if (L.kind === 'true' || R.kind === 'true') {
        mark();
        return { kind: 'true' };
      }
      return { kind: 'or', left: L, right: R };
    }
    case 'imp': {
      const L = simpStep(f.left, mark);
      const R = simpStep(f.right, mark);
      if (L.kind === 'true') {
        mark();
        return R;
      }
      if (R.kind === 'true') {
        mark();
        return { kind: 'true' };
      }
      if (L.kind === 'false') {
        mark();
        return { kind: 'true' };
      }
      return { kind: 'imp', left: L, right: R };
    }
    case 'eq': {
      // intentionally leave equality untouched: it requires semantic info.
      return f;
    }
  }
}
