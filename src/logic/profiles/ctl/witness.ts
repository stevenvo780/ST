// ============================================================
// Witness paths para fórmulas CTL existenciales.
// ============================================================
// Solo los operadores existenciales (EX, EF, EG, EU) admiten witness:
// para AX/AF/AG/AU el "testigo" sería el modelo entero (no hay un
// único camino que justifique la propiedad). Si el caller pide
// witness para una fórmula universal devolvemos `null`.
// ============================================================

import { modelCheckCTL } from './check';
import type { CTLFormula, KripkeStructure } from './types';

interface CompiledModel {
  states: Set<string>;
  succ: Map<string, Set<string>>;
  labels: Map<string, Set<string>>;
}

function compile(M: KripkeStructure): CompiledModel {
  const states = new Set<string>();
  const succ = new Map<string, Set<string>>();
  const labels = new Map<string, Set<string>>();
  for (const s of M.states) {
    states.add(s.id);
    succ.set(s.id, new Set());
    labels.set(s.id, new Set(s.labels));
  }
  for (const [from, to] of M.transitions) {
    succ.get(from)?.add(to);
  }
  return { states, succ, labels };
}

function bfsTo(
  model: CompiledModel,
  start: string,
  isGoal: (id: string) => boolean,
  isStep: (id: string) => boolean = () => true,
  allowStartAsGoal = true,
): string[] | null {
  if (allowStartAsGoal && isGoal(start)) return [start];
  const visited = new Set<string>([start]);
  const parent = new Map<string, string>();
  const queue: string[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === undefined) break;
    for (const s of model.succ.get(cur) ?? []) {
      if (visited.has(s)) continue;
      visited.add(s);
      parent.set(s, cur);
      if (isGoal(s)) {
        const path: string[] = [s];
        let p: string | undefined = cur;
        while (p !== undefined) {
          path.push(p);
          p = parent.get(p);
        }
        return path.reverse();
      }
      if (isStep(s)) queue.push(s);
    }
  }
  return null;
}

/**
 * Encuentra un camino testigo finito (`stateId[]`) que justifique
 * que `phi` se cumple en `state`. Devuelve `null` si:
 *  - `phi` no se cumple en `state`, o
 *  - `phi` es universal (AX/AF/AG/AU) — no admite un único witness path, o
 *  - `state` no existe en el modelo.
 *
 * Convenciones del path devuelto:
 *  - EX φ        → `[state, next]` con `next ⊨ φ`.
 *  - EF φ        → camino más corto desde `state` hasta un estado con `φ`.
 *  - EG φ        → camino que entra en un ciclo de estados con `φ`;
 *                  el último elemento del camino aparece dos veces para
 *                  marcar el lazo (lasso witness).
 *  - E[A U B]    → camino donde todos los intermedios cumplen A y el
 *                  último cumple B.
 *  - cualquier otro operador no existencial → `null`.
 */
export function generateWitness(
  M: KripkeStructure,
  phi: CTLFormula,
  state: string,
): string[] | null {
  const model = compile(M);
  if (!model.states.has(state)) return null;

  // Solo damos witness cuando φ se cumple efectivamente.
  const sat = modelCheckCTL(M, phi);
  if (!sat.get(state)) return null;

  switch (phi.kind) {
    case 'EX': {
      const subSat = modelCheckCTL(M, phi.arg);
      for (const s of model.succ.get(state) ?? []) {
        if (subSat.get(s)) return [state, s];
      }
      return null;
    }
    case 'EF': {
      const subSat = modelCheckCTL(M, phi.arg);
      return bfsTo(model, state, (id) => subSat.get(id) === true);
    }
    case 'EU': {
      const aSat = modelCheckCTL(M, phi.left);
      const bSat = modelCheckCTL(M, phi.right);
      // Si state ya cumple B, devolvemos camino trivial.
      if (bSat.get(state)) return [state];
      // Caminos donde los intermedios cumplen A; el goal cumple B.
      if (!aSat.get(state)) return null;
      return bfsTo(
        model,
        state,
        (id) => bSat.get(id) === true,
        (id) => aSat.get(id) === true,
        false,
      );
    }
    case 'EG': {
      const subSat = modelCheckCTL(M, phi.arg);
      // EG φ ⇔ existe camino infinito desde state con φ siempre.
      // En modelos finitos esto equivale a alcanzar un ciclo donde todos los
      // estados del ciclo cumplen φ, pasando por estados que también cumplen φ.
      const egSat = sat; // sat[state] true → existe tal camino
      // Encontrar el camino lazo: BFS desde state por estados que cumplen
      // EG φ, hasta llegar a un estado desde el cual se cierre un ciclo.
      if (!subSat.get(state) || !egSat.get(state)) return null;
      // DFS para encontrar un ciclo dentro del sub-grafo {s : EG φ holds}.
      const inSubgraph = (id: string) => egSat.get(id) === true && subSat.get(id) === true;
      const stack: string[] = [state];
      const onStack = new Set<string>([state]);
      const visited = new Set<string>([state]);
      const result = dfsLasso(model, state, inSubgraph, stack, onStack, visited);
      return result;
    }
    default:
      return null;
  }
}

function dfsLasso(
  model: CompiledModel,
  current: string,
  inSubgraph: (id: string) => boolean,
  stack: string[],
  onStack: Set<string>,
  visited: Set<string>,
): string[] | null {
  for (const s of model.succ.get(current) ?? []) {
    if (!inSubgraph(s)) continue;
    if (onStack.has(s)) {
      // Encontramos un back-edge: stack contiene path hasta `current`,
      // y `s` está en stack → ciclo desde s.
      const path = [...stack, s];
      return path;
    }
    if (visited.has(s)) continue;
    visited.add(s);
    stack.push(s);
    onStack.add(s);
    const r = dfsLasso(model, s, inSubgraph, stack, onStack, visited);
    if (r) return r;
    stack.pop();
    onStack.delete(s);
  }
  return null;
}
