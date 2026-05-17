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
// `intro(name?)` — para goal `P -> Q`, descarga `P` con nombre `name`
// (o auto) y deja goal `Q`. Soporta también `~P` (≡ `P -> False`).

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
// `exact(term)` — cierra el goal si `term` (interpretado como nombre
// de una hipótesis O como string igual al goal) coincide con la
// conclusión.

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
// Cierra el goal si alguna hipótesis tiene el mismo tipo que la conclusión.

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
// `apply(thm)` — backward chaining sobre una hipótesis `thm`.
// Si `thm : A -> B` y goal es `B`, deja goal `A`.
// Si `thm : A -> B -> C` y goal es `C`, deja goals `A`, `B`.
// args opcional: lista de hipótesis/strings que satisfacen las premisas
// inmediatamente.

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
// `rewrite(eqName, dir?)` — usa la hipótesis `eqName: lhs = rhs` para
// reemplazar ocurrencias de lhs por rhs en la conclusión (o al revés).

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
// Cierra goals de la forma `a = a` (reflexividad sintáctica tras normalizar).

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
// Cierra goals obvios: True, o conclusión equivalente a una hipótesis True.

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
// ∧-intro: goal `P /\ Q` produce dos sub-goals `P` y `Q`.

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
// ∨-intro: goal `P \/ Q` deja sub-goal `P` (left) o `Q` (right).

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
// Caso por hipótesis. Para `H: P /\ Q` desglosa en dos hipótesis `H_L:P`,
// `H_R:Q` en el mismo goal. Para `H: P \/ Q` produce dos sub-goals
// (cada uno con la hipótesis correspondiente). Para `H: P -> Q` no aplica.

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
// Esquema mínimo sobre Nat. Para una hipótesis `n: Nat`, produce dos goals:
//   zero-case: concl[n := zero]
//   succ-case: hyps ∪ { IH: concl[n := k] }, concl[n := succ(k)]
// El user puede declarar otros tipos de inducción registrándolos antes,
// pero la versión base sólo cubre Nat.

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
// Alias de `destruct` con semántica explícita de "análisis por casos".
// Mantenemos el nombre `case` por afinidad con Coq pero el constructor
// JS reservado nos obliga a usar `caseAnalysis`/`caseT`. Exportamos
// como `case` desde index via re-export con alias.

export function caseAnalysis(name: string): Tactic {
  return destruct(name);
}

// ---------- unfold ----------
// Reemplaza un identificador opaco `def` por su body registrado en un
// "diccionario de definiciones". El tactic no tiene estado global: las
// definiciones se proveen al construir el tactic. Por defecto, `unfold`
// con un diccionario vacío es una no-op que falla.

export interface DefDictionary {
  [name: string]: string;
}

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
// Simplificación rudimentaria:
//   True /\ X  →  X
//   X /\ True  →  X
//   False \/ X →  X
//   X \/ False →  X
//   ~~X        →  X
// Se aplica recursivamente hasta punto fijo. Si no cambia nada, falla.

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
