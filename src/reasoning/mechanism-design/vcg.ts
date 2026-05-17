// ============================================================
// VCG mechanism (Vickrey-Clarke-Groves)
// ============================================================
//
// El VCG mechanism elige la allocation que maximiza social welfare
// (suma de valuations reportadas). Cobra a cada agente la
// "externalidad" que impone sobre el resto: la diferencia entre el
// welfare máximo de los OTROS agentes cuando él NO participa y el
// welfare de los OTROS en la allocation elegida.
//
// Esta implementación cubre dos regímenes:
//
// 1. Single-item per agent (caso default): cada agente puede recibir
//    a lo sumo 1 item, cada item se asigna a lo sumo 1 agente.
//    Resolvemos el problema de asignación máxima por enumeración
//    (Hungarian sería más eficiente pero alcanza para los tamaños
//    de test, n ≤ ~8).
//
// 2. Combinatorial (bundles): si las valuations incluyen claves que
//    representan combinaciones — convención: outcomes "*" significa
//    "todos los items" — el algoritmo enumera particiones de items
//    en agentes y elige la de mayor welfare. Por simplicidad y para
//    los tests, asumimos que las claves del Map son subconjuntos de
//    items separados por "+" o son items individuales.
//
// Para el caso combinatorial usamos enumeración exhaustiva de
// asignaciones agente→bundle (cada item al primer agente que lo
// quiera con mayor valor o sin asignar). Esto es exponencial en items
// pero claro y suficiente para tests pequeños.
//
// Strategy-proof: VCG es DSIC (dominant-strategy incentive-compatible).
// Verificamos esta propiedad empíricamente vía `isStrategyProof`.

import type { Agent, MechanismOutcome } from './types';

const EMPTY_BUNDLE = '';

/** Junta items en una clave canónica ordenada. */
function makeBundle(items: string[]): string {
  if (items.length === 0) return EMPTY_BUNDLE;
  return [...items].sort().join('+');
}

/** Lectura segura: 0 si el outcome no aparece en la valuation. */
function vOf(a: Agent, outcome: string): number {
  return a.valuation.get(outcome) ?? 0;
}

/**
 * Enumera todas las asignaciones agente→item para single-item case.
 * Devuelve la asignación que maximiza la suma de valuations.
 *
 * - agentSubset = lista de agentes participantes.
 * - items = lista de items disponibles.
 *
 * Cada agente puede quedarse sin item (item = EMPTY_BUNDLE). Cada item
 * se asigna a 0 o 1 agente.
 *
 * Complejidad: O((|items|+1)^|agents|) en worst case; OK para tests.
 */
function bestSingleItemAssignment(
  agentSubset: Agent[],
  items: string[],
): { allocation: Map<string, string>; welfare: number } {
  let bestWelfare = -Infinity;
  let bestAllocation = new Map<string, string>();

  // Asignamos recursivamente. choices[i] ∈ items ∪ {EMPTY_BUNDLE},
  // con restricción de unicidad de item.
  const n = agentSubset.length;
  const taken = new Set<string>();
  const current: string[] = new Array<string>(n).fill(EMPTY_BUNDLE);

  function recurse(idx: number, welfareSoFar: number): void {
    if (idx === n) {
      if (welfareSoFar > bestWelfare) {
        bestWelfare = welfareSoFar;
        const alloc = new Map<string, string>();
        for (let i = 0; i < n; i++) {
          if (current[i] !== EMPTY_BUNDLE) {
            alloc.set(agentSubset[i].id, current[i]);
          }
        }
        bestAllocation = alloc;
      }
      return;
    }
    const agent = agentSubset[idx];
    // Opción A: agente no recibe nada.
    current[idx] = EMPTY_BUNDLE;
    recurse(idx + 1, welfareSoFar);
    // Opción B: agente recibe alguno de los items libres.
    for (const item of items) {
      if (taken.has(item)) continue;
      taken.add(item);
      current[idx] = item;
      recurse(idx + 1, welfareSoFar + vOf(agent, item));
      taken.delete(item);
    }
    current[idx] = EMPTY_BUNDLE;
  }

  if (n === 0) {
    return { allocation: new Map(), welfare: 0 };
  }
  recurse(0, 0);
  if (bestWelfare === -Infinity) bestWelfare = 0;
  return { allocation: bestAllocation, welfare: bestWelfare };
}

/**
 * Enumera particiones de items en bundles asignados a agentes (con
 * agente "vacío" como opción) — usado cuando las valuations incluyen
 * bundles compuestos ("A+B").
 *
 * Decisión por item: a qué agente va (o a ninguno). Luego cada agente
 * obtiene el bundle canónico de los items que recibió y se consulta
 * la valuation con esa clave (default 0).
 */
function bestCombinatorialAssignment(
  agentSubset: Agent[],
  items: string[],
): { allocation: Map<string, string>; welfare: number } {
  let bestWelfare = -Infinity;
  let bestAssignment = new Array<number>(items.length).fill(-1);

  const assignment: number[] = new Array<number>(items.length).fill(-1);

  function evalWelfare(): number {
    const bundlesPerAgent: string[][] = agentSubset.map(() => []);
    for (let i = 0; i < items.length; i++) {
      const ai = assignment[i];
      if (ai >= 0) bundlesPerAgent[ai].push(items[i]);
    }
    let w = 0;
    for (let a = 0; a < agentSubset.length; a++) {
      const bundle = makeBundle(bundlesPerAgent[a]);
      if (bundle === EMPTY_BUNDLE) continue;
      w += vOf(agentSubset[a], bundle);
    }
    return w;
  }

  function recurse(idx: number): void {
    if (idx === items.length) {
      const w = evalWelfare();
      if (w > bestWelfare) {
        bestWelfare = w;
        bestAssignment = assignment.slice();
      }
      return;
    }
    // Item no asignado.
    assignment[idx] = -1;
    recurse(idx + 1);
    // Item a cada agente.
    for (let a = 0; a < agentSubset.length; a++) {
      assignment[idx] = a;
      recurse(idx + 1);
    }
    assignment[idx] = -1;
  }

  if (agentSubset.length === 0 || items.length === 0) {
    return { allocation: new Map(), welfare: 0 };
  }
  recurse(0);
  if (bestWelfare === -Infinity) bestWelfare = 0;

  // Reconstruir allocation: mapAgentId → bundle.
  const alloc = new Map<string, string>();
  const bundlesPerAgent: string[][] = agentSubset.map(() => []);
  for (let i = 0; i < items.length; i++) {
    const ai = bestAssignment[i];
    if (ai >= 0) bundlesPerAgent[ai].push(items[i]);
  }
  for (let a = 0; a < agentSubset.length; a++) {
    const bundle = makeBundle(bundlesPerAgent[a]);
    if (bundle !== EMPTY_BUNDLE) alloc.set(agentSubset[a].id, bundle);
  }
  return { allocation: alloc, welfare: bestWelfare };
}

/**
 * Detecta si la valuation usa bundles compuestos (claves con "+").
 */
function hasCombinatorialValuations(agents: Agent[]): boolean {
  for (const a of agents) {
    for (const key of a.valuation.keys()) {
      if (key.includes('+')) return true;
    }
  }
  return false;
}

function bestAssignment(
  agentSubset: Agent[],
  items: string[],
): { allocation: Map<string, string>; welfare: number } {
  if (hasCombinatorialValuations(agentSubset)) {
    return bestCombinatorialAssignment(agentSubset, items);
  }
  return bestSingleItemAssignment(agentSubset, items);
}

/**
 * VCG mechanism: allocation maximiza welfare; pago de cada agente =
 * externalidad = (welfare óptimo de los demás cuando él NO participa)
 *                - (welfare de los demás en la allocation elegida).
 *
 * Devuelve allocation y payments. Payments son ≥ 0 si valuations son
 * monotónicas (las nuestras lo son).
 */
export function vcgMechanism(agents: Agent[], items: string[]): MechanismOutcome {
  if (agents.length === 0) {
    return { allocation: new Map(), payments: new Map() };
  }

  const { allocation } = bestAssignment(agents, items);

  // Welfare de los OTROS bajo la allocation elegida.
  const payments = new Map<string, number>();
  for (const a of agents) {
    const without = agents.filter((x) => x.id !== a.id);

    // Welfare de los demás en la allocation actual.
    let welfareOthersIn = 0;
    for (const other of without) {
      const got = allocation.get(other.id);
      if (got !== undefined) welfareOthersIn += vOf(other, got);
    }

    // Welfare óptimo si `a` no existiera (libera los items que tenía).
    const { welfare: welfareOthersOut } = bestAssignment(without, items);

    const payment = welfareOthersOut - welfareOthersIn;
    payments.set(a.id, payment);
  }

  return { allocation, payments };
}

/**
 * Welfare social bajo una allocation: suma de valuations de los agentes
 * por lo que recibieron.
 */
export function socialWelfare(outcome: MechanismOutcome, agents: Agent[]): number {
  let w = 0;
  for (const a of agents) {
    const got = outcome.allocation.get(a.id);
    if (got !== undefined) w += vOf(a, got);
  }
  return w;
}

/**
 * Strategy-proofness empírica: tomamos `samples` reportes aleatorios de
 * un agente (manteniendo a los demás truthful), corremos el mechanism,
 * y verificamos que la utilidad del agente que miente no supere la
 * utilidad reportando truthfully. Si para alguna sample el misreport
 * mejora estrictamente, retornamos false.
 *
 * Utilidad cuasi-lineal: v(allocation_i) - payment_i.
 *
 * Esto es probabilístico: con `samples=0` no chequeamos nada y devolvemos
 * true. Útil sobretodo para testing.
 */
export function isStrategyProof(
  mechanism: (agents: Agent[]) => MechanismOutcome,
  samples: number = 50,
): boolean {
  if (samples <= 0) return true;

  // Construimos un escenario base de 3 agentes y 2 items, con
  // valuations enteras en [0, 10]. Para cada sample mutamos la
  // valuation del primer agente y comparamos su utilidad con la
  // reportada truthfully. El mechanism recibe solo agents (los items
  // están implícitos en las valuations + closure del caller).
  const baseAgents: Agent[] = [
    {
      id: 'a',
      valuation: new Map([
        ['x', 8],
        ['y', 3],
      ]),
    },
    {
      id: 'b',
      valuation: new Map([
        ['x', 5],
        ['y', 6],
      ]),
    },
    {
      id: 'c',
      valuation: new Map([
        ['x', 2],
        ['y', 4],
      ]),
    },
  ];

  // Utilidad real del agente "a" si reporta `report` y los demás truthful.
  function utilityOfA(report: Map<string, number>): number {
    const truthA = baseAgents[0].valuation;
    const reported: Agent[] = [{ id: 'a', valuation: report }, baseAgents[1], baseAgents[2]];
    const out = mechanism(reported);
    const got = out.allocation.get('a');
    const value = got !== undefined ? (truthA.get(got) ?? 0) : 0;
    const pay = out.payments.get('a') ?? 0;
    return value - pay;
  }

  const truthful = utilityOfA(baseAgents[0].valuation);

  for (let s = 0; s < samples; s++) {
    const fakeX = Math.floor(Math.random() * 11);
    const fakeY = Math.floor(Math.random() * 11);
    const fake = new Map<string, number>([
      ['x', fakeX],
      ['y', fakeY],
    ]);
    const u = utilityOfA(fake);
    // Permitimos empates (igualdad): DSIC requiere truthful ∈ argmax.
    if (u > truthful + 1e-9) return false;
  }
  return true;
}
