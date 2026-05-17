// ============================================================
// ST Planning — Tipos públicos (STRIPS / PDDL light)
// ============================================================
//
// STRIPS (Fikes & Nilsson 1971): planificación clásica donde el
// estado es un conjunto finito de hechos atómicos y las acciones
// modifican ese conjunto mediante:
//
//   - preconditions: hechos que deben estar presentes para aplicar
//   - addList:       hechos que se vuelven verdaderos tras aplicar
//   - delList:       hechos que se eliminan tras aplicar
//
// El planificador busca una secuencia ⟨a₁, …, aₙ⟩ tal que aplicarla
// al estado inicial S₀ produzca un estado Sₙ ⊇ goal.
//
// "PDDL light": soportamos parámetros tipados via `objects` y
// `parameters` (los strings con `?x` se sustituyen). No soportamos
// fluents numéricos, cuantificadores universales, ni tipos
// jerárquicos — el grueso del PDDL nivel 1 (STRIPS + typing).

/**
 * Un hecho atómico ground. Lo representamos como string opaque al
 * motor — el formato típico es `predicate(arg1, arg2, …)` o simplemente
 * `predicate-arg1-arg2`. El motor solo compara igualdad de strings.
 */
export type Fact = string;

/**
 * Una acción STRIPS (puede ser lifted con `?` en los parámetros).
 *
 * Convención: los parámetros se nombran con prefijo `?` dentro de
 * los strings de preconditions/addList/delList. Ejemplo:
 *
 *   {
 *     name: 'move',
 *     parameters: ['?from', '?to'],
 *     preconditions: ['at(?from)', 'connected(?from, ?to)'],
 *     addList: ['at(?to)'],
 *     delList: ['at(?from)'],
 *   }
 *
 * Para acciones ya ground, `parameters` puede ser `[]` y los strings
 * no contienen `?`.
 */
export interface STRIPSAction {
  name: string;
  parameters: string[];
  preconditions: string[];
  addList: string[];
  delList: string[];
}

/**
 * Problema de planificación STRIPS.
 *
 * - `predicates`: lista declarativa (puramente documental — no se
 *   valida internamente, pero sirve para introspección).
 * - `objects`: mapa de `tipo → valores`. Si no usás tipos, podés
 *   usar `{ object: [...] }` y referir `object` como el "tipo" en los
 *   parámetros si quisieras, pero el grounding por defecto enumera
 *   todos los objetos para cada parámetro (sin filtrar por tipo).
 * - `actions`: schemas de acciones (lifted o ground).
 * - `initialState`: hechos verdaderos en S₀ (closed-world assumption).
 * - `goal`: hechos que deben estar en el estado final. Si goal ⊆ S
 *   entonces S satisface el goal.
 */
export interface STRIPSProblem {
  predicates: string[];
  objects: Record<string, string[]>;
  actions: STRIPSAction[];
  initialState: Set<Fact>;
  goal: Set<Fact>;
}

/**
 * Una acción ya instanciada (ground) — el resultado de aplicar un
 * binding concreto a un schema lifted.
 */
export interface GroundedAction {
  preconditions: Set<Fact>;
  addList: Set<Fact>;
  delList: Set<Fact>;
}

/** Un paso del plan: el schema + el binding que lo grounded. */
export interface PlanStep {
  action: STRIPSAction;
  bindings: Record<string, string>;
}

/**
 * Plan completo.
 *
 * - `actions`: secuencia ordenada de pasos.
 * - `length`: número de pasos (= actions.length).
 * - `cost`: costo total. Por default = length (cada acción cuesta 1).
 */
export interface Plan {
  actions: PlanStep[];
  length: number;
  cost: number;
}

/**
 * Heurística admisible: estima el costo restante desde `state` hasta
 * algún estado que satisfaga `goal`. Para A* admisible, debe ser
 * ≤ costo real (no sobreestimar).
 */
export type Heuristic = (state: Set<Fact>, goal: Set<Fact>) => number;

/** Costo por acción (default: 1). Permite acciones de costo variable. */
export type CostFunction = (step: PlanStep) => number;

export interface PlannerOptions {
  /** Profundidad máxima del plan. Default: 50 para BFS, 200 para A*. */
  maxDepth?: number;
  /**
   * Límite de nodos expandidos (corta búsqueda explosiva). Default:
   * 100_000.
   */
  maxNodes?: number;
  /** Costo por acción. Default: () => 1. */
  costFunction?: CostFunction;
}

export interface AStarOptions extends PlannerOptions {
  heuristic?: Heuristic;
}
