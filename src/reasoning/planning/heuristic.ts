// ============================================================
// ST Planning — Heurísticas
// ============================================================
//
// Heurística "Fast-Forward" simplificada (Hoffmann & Nebel 2001):
// ignora la delete-list (delete-relaxation), construye un grafo de
// planificación relajado por "niveles" hasta que todos los hechos
// del goal aparezcan, y devuelve el número de niveles como estima.
//
// Es admisible (en el sentido relajado) y barata; en práctica guía
// muy bien a A* clásico para STRIPS.
//
// La versión completa de FF haría además extracción de plan relajado
// con contadores de "support" para mejorar el factor de rama. Acá nos
// quedamos con la estima por niveles, que ya es estricta mejor que
// `|goal \ state|` para problemas no triviales.

import { substituteVars } from './ground';
import type { Fact, Heuristic, STRIPSAction, STRIPSProblem } from './types';

/**
 * Distancia básica: `|goal \ state|` (número de hechos del goal aún
 * no presentes en state). Es admisible pero muy débil.
 */
export const goalCountHeuristic: Heuristic = (state, goal) => {
  let missing = 0;
  for (const g of goal) if (!state.has(g)) missing++;
  return missing;
};

/**
 * Heurística Fast-Forward (versión por niveles, ignora delete-list).
 *
 * Construcción:
 *   F₀ = state
 *   F_{i+1} = F_i ∪ {add-effects de toda acción ground con pre ⊆ F_i}
 *   Termina cuando goal ⊆ F_k → devuelve k.
 *   Si F se estabiliza sin alcanzar el goal → devuelve Infinity
 *   (estado dead-end del problema relajado, por lo tanto del original).
 *
 * Sin delete-list, F crece monotónicamente, así que la iteración
 * termina en ≤ |universo de hechos accesibles| pasos.
 *
 * `actions` debe ser una lista de schemas (lifted). Internamente
 * grounded en cada nivel con los objetos del dominio.
 */
export function fastForwardHeuristic(
  state: Set<Fact>,
  goal: Set<Fact>,
  actions: STRIPSAction[],
  objects?: Record<string, string[]>,
): number {
  // Early exit.
  let missing = 0;
  for (const g of goal) if (!state.has(g)) missing++;
  if (missing === 0) return 0;

  // Universo plano de objetos para grounding.
  const allObjects: string[] = [];
  if (objects) {
    const seen = new Set<string>();
    for (const vals of Object.values(objects)) {
      for (const v of vals) {
        if (!seen.has(v)) {
          seen.add(v);
          allObjects.push(v);
        }
      }
    }
  }

  // Si no hay objetos, solo aplican acciones sin parámetros.
  const facts = new Set<Fact>(state);
  let level = 0;
  const maxLevel = 1000; // Safety.

  while (level < maxLevel) {
    // Goal satisfied en este nivel.
    let allPresent = true;
    for (const g of goal) {
      if (!facts.has(g)) {
        allPresent = false;
        break;
      }
    }
    if (allPresent) return level;

    // Expandir un nivel: snapshot del nivel actual y aplicar toda
    // acción ground cuyas pre ⊆ snapshot. Los efectos se aplican
    // sobre `facts` pero las preconditions se chequean contra
    // `snapshot` — así un mismo nivel no encadena varios pasos.
    const snapshot = new Set<Fact>(facts);
    let added = false;
    for (const a of actions) {
      if (a.parameters.length === 0) {
        // Acción ground directa.
        let ok = true;
        for (const p of a.preconditions) {
          if (!snapshot.has(p)) {
            ok = false;
            break;
          }
        }
        if (ok) {
          for (const eff of a.addList) {
            if (!facts.has(eff)) {
              facts.add(eff);
              added = true;
            }
          }
        }
      } else {
        // Enumerar bindings (producto cartesiano).
        const indices: number[] = Array.from({ length: a.parameters.length }, () => 0);
        const n = allObjects.length;
        if (n === 0) continue;
        while (true) {
          const bindings: Record<string, string> = {};
          for (let i = 0; i < a.parameters.length; i++) {
            bindings[a.parameters[i]] = allObjects[indices[i]];
          }
          // Chequear pre contra snapshot.
          let ok = true;
          for (const p of a.preconditions) {
            const inst = substituteVars(p, bindings);
            if (!snapshot.has(inst)) {
              ok = false;
              break;
            }
          }
          if (ok) {
            for (const eff of a.addList) {
              const inst = substituteVars(eff, bindings);
              if (!facts.has(inst)) {
                facts.add(inst);
                added = true;
              }
            }
          }
          // Ripple.
          let k = a.parameters.length - 1;
          while (k >= 0) {
            const cur = indices[k] + 1;
            if (cur < n) {
              indices[k] = cur;
              break;
            }
            indices[k] = 0;
            k--;
          }
          if (k < 0) break;
        }
      }
    }
    if (!added) {
      // Fixed point: relajación se estabilizó sin alcanzar goal → dead end.
      return Infinity;
    }
    level++;
  }
  return Infinity;
}

/**
 * Helper para crear una heurística FF cerrada sobre el problema.
 * Devuelve una función `Heuristic` que `aStarPlan` puede consumir.
 */
export function makeFFHeuristic(problem: STRIPSProblem): Heuristic {
  return (state, goal) => fastForwardHeuristic(state, goal, problem.actions, problem.objects);
}
