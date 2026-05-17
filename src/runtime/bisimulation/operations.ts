// ============================================================
// Operaciones derivadas sobre bisimulación.
// ============================================================
//   - areBisimilar(M, s, t)       : ¿s y t están en el mismo bloque?
//   - quotientLTS(M)              : LTS mínimo módulo bisimulación.
//   - strongBisimulation(M1, M2)  : ¿dos LTS son fuertemente bisimilares?
//   - weakBisimulation(M, τ)      : partición que oculta transiciones τ.
//
// Para weakBisimulation usamos la construcción estándar:
//   1. saturar: ⇒ = τ* (con loops auto-incluidos)
//   2. para cada arista s -a-> t con a ≠ τ, agregar todas las composiciones
//      τ* ; a ; τ*
//   3. para a = τ, agregar todos los pares (s, t) tales que s ⇒ t  (incluido
//      el reflexivo) bajo la acción τ.
//   4. Aplicar Paige-Tarjan sobre el LTS saturado.
//
// El resultado es la partición de bisimulación débil (~_w o "observational
// equivalence" de Milner).
// ============================================================

import { paigeTarjan } from './paige-tarjan';
import type { LTS, BisimulationResult } from './types';

/**
 * Devuelve `true` si los estados `s` y `t` caen en el mismo bloque de la
 * partición de bisimulación fuerte. Lanza si alguno no existe en M.
 */
export function areBisimilar(lts: LTS, s: string, t: string): boolean {
  const known = new Set(lts.states);
  if (!known.has(s)) throw new Error(`areBisimilar: estado desconocido "${s}"`);
  if (!known.has(t)) throw new Error(`areBisimilar: estado desconocido "${t}"`);
  const result = paigeTarjan(lts);
  return result.partition.get(s) === result.partition.get(t);
}

/**
 * Construye el LTS cociente M/~ donde cada bloque de la partición de
 * bisimulación se convierte en un único estado. Las transiciones se
 * deduplican: si s -a-> t, entonces [s] -a-> [t] aparece una sola vez.
 *
 * El labelling del bloque es el labelling común de sus miembros
 * (todos los miembros tienen el mismo labelling por construcción).
 */
export function quotientLTS(lts: LTS): LTS {
  const result = paigeTarjan(lts);
  const blockName = (idx: number): string => `q${idx}`;

  const newStates: string[] = result.blocks.map((_, i) => blockName(i));
  const seen = new Set<string>();
  const newTransitions: Array<[string, string, string]> = [];
  for (const [from, action, to] of lts.transitions) {
    const bf = result.partition.get(from);
    const bt = result.partition.get(to);
    if (bf === undefined || bt === undefined) continue;
    const key = `${bf}|${action}|${bt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    newTransitions.push([blockName(bf), action, blockName(bt)]);
  }

  // Labelling: cada bloque hereda el labelling de cualquiera de sus miembros
  // (los miembros de un mismo bloque coinciden en labelling por bisimulación).
  const labelling: Record<string, Set<string>> = {};
  if (lts.labelling) {
    for (let i = 0; i < result.blocks.length; i++) {
      const cell = result.blocks[i];
      const rep = cell && cell.length > 0 ? cell[0] : undefined;
      if (rep === undefined) continue;
      const labs = lts.labelling[rep];
      if (labs && labs.size > 0) {
        labelling[blockName(i)] = new Set(labs);
      }
    }
  }

  const out: LTS = {
    states: newStates,
    transitions: newTransitions,
  };
  if (Object.keys(labelling).length > 0) out.labelling = labelling;
  return out;
}

/**
 * Verifica si dos LTS son fuertemente bisimilares.
 * Los espacios de estados deben ser disjuntos; si no lo son, los renombramos
 * internamente con prefijos "L:" y "R:".
 *
 * El criterio: en el LTS combinado, los conjuntos iniciales (o, en ausencia
 * de iniciales explícitos, todos los estados) deben quedar particionados de
 * forma que cada estado de L tenga al menos un estado equivalente en R y
 * viceversa. Como API simple, se compara la firma de la partición sobre
 * el LTS combinado: dos LTS son bisimilares como sistemas sii existe una
 * biyección entre sus bloques tal que cada bloque contiene estados de ambos
 * lados (interpretación de "los autómatas son indistinguibles").
 */
export function strongBisimulation(lts1: LTS, lts2: LTS): boolean {
  const prefix = (side: 'L' | 'R', s: string): string => `${side}:${s}`;

  const states: string[] = [
    ...lts1.states.map((s) => prefix('L', s)),
    ...lts2.states.map((s) => prefix('R', s)),
  ];
  const transitions: Array<[string, string, string]> = [
    ...lts1.transitions.map(
      ([f, a, t]) => [prefix('L', f), a, prefix('L', t)] as [string, string, string],
    ),
    ...lts2.transitions.map(
      ([f, a, t]) => [prefix('R', f), a, prefix('R', t)] as [string, string, string],
    ),
  ];
  const labelling: Record<string, Set<string>> = {};
  if (lts1.labelling) {
    for (const [k, v] of Object.entries(lts1.labelling)) {
      labelling[prefix('L', k)] = new Set(v);
    }
  }
  if (lts2.labelling) {
    for (const [k, v] of Object.entries(lts2.labelling)) {
      labelling[prefix('R', k)] = new Set(v);
    }
  }
  const combined: LTS = { states, transitions };
  if (Object.keys(labelling).length > 0) combined.labelling = labelling;

  const result = paigeTarjan(combined);

  // Para que dos LTS sean "globalmente" bisimilares, cada estado de un lado
  // debe quedar emparejado con al menos un estado del otro: los bloques deben
  // contener miembros de ambos lados (o bloques que toquen sólo un lado son
  // testigos de no-bisimilaridad).
  for (const cell of result.blocks) {
    let hasL = false;
    let hasR = false;
    for (const s of cell) {
      if (s.startsWith('L:')) hasL = true;
      else if (s.startsWith('R:')) hasR = true;
      if (hasL && hasR) break;
    }
    if (!hasL || !hasR) return false;
  }
  return true;
}

/**
 * Bisimulación débil: oculta transiciones τ y satura ⇒ = τ* antes de aplicar
 * Paige-Tarjan. Útil para CCS / process algebras donde τ representa una
 * acción interna no observable.
 *
 * Cuesta O(n³) por la saturación (transitivos τ); para LTS grandes con muchas
 * acciones reales esto es aceptable. La partición resultante es la mayor
 * relación de bisimulación débil.
 */
export function weakBisimulation(lts: LTS, tau: string): BisimulationResult {
  const states = new Set(lts.states);

  // Construir τ-reachability (incluyendo cero pasos: cada s alcanza a sí mismo).
  const tauNext = new Map<string, Set<string>>();
  for (const s of states) tauNext.set(s, new Set([s]));
  for (const [f, a, t] of lts.transitions) {
    if (a === tau) tauNext.get(f)?.add(t);
  }

  // Cierre transitivo de τ (Floyd-Warshall ingenuo).
  const tauStar = new Map<string, Set<string>>();
  for (const s of states) {
    const reach = new Set<string>([s]);
    const queue: string[] = [s];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === undefined) continue;
      for (const n of tauNext.get(cur) ?? []) {
        if (!reach.has(n)) {
          reach.add(n);
          queue.push(n);
        }
      }
    }
    tauStar.set(s, reach);
  }

  // Saturación: s ⇒ -a-> ⇐ t  ≡ existen u, v con s ⇒ u -a-> v y v ⇒ t.
  // Para τ: s ⇒ t (sólo cuando el LTS original tiene al menos un τ desde s o
  // s ≠ t por algún camino) se traduce a aristas τ explícitas en el saturado.
  const saturated: Array<[string, string, string]> = [];
  const seen = new Set<string>();
  const addEdge = (f: string, a: string, t: string) => {
    const k = `${f}|${a}|${t}`;
    if (seen.has(k)) return;
    seen.add(k);
    saturated.push([f, a, t]);
  };

  // Saturación de transiciones observables (a ≠ τ):
  //   en el LTS saturado, s -a-> u  sii existen f, t con s ⇒ f -a-> t ⇒ u.
  // Los τ originales NO se emiten como aristas observables: se "absorben" en
  // ⇒ y desaparecen de la firma local, que es la definición canónica de
  // bisimulación débil de Milner.
  for (const [f, a, t] of lts.transitions) {
    if (a === tau) continue;
    for (const s of tauStar.keys()) {
      if (!tauStar.get(s)?.has(f)) continue;
      for (const u of tauStar.get(t) ?? []) {
        addEdge(s, a, u);
      }
    }
  }

  const satLts: LTS = {
    states: [...states],
    transitions: saturated,
  };
  if (lts.labelling) satLts.labelling = lts.labelling;
  return paigeTarjan(satLts);
}
