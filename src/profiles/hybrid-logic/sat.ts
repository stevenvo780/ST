// ============================================================
// ST Hybrid Logic — Decisor de satisfacibilidad (búsqueda acotada)
// ============================================================
// La satisfacibilidad del fragmento H(@, ↓, ∃) es indecidible en
// general (Areces, Blackburn & Marx 1999). Aquí implementamos un
// búsqueda finita acotada: enumeramos frames con ≤ N mundos y
// probamos cada uno. Es completo para fórmulas con modelo finito
// pequeño y robusto para los tests del perfil.
//
// La cota se elige en función del tamaño sintáctico de φ:
//   bound = max(2, atoms + nominals + 2)
// suficiente para todas las patologías clásicas (loops, modelos
// con varios mundos para ∃, etc.).
// ============================================================

import { isSatisfiableInFrame } from './semantics';
import type { HybridFormula, HybridFrame } from './types';

interface SyntacticInfo {
  atoms: string[];
  freeNominals: string[];
}

/** Recolecta átomos y nominales libres (los ligados por ↓/∃ no cuentan). */
function collectSyntax(phi: HybridFormula): SyntacticInfo {
  const atoms = new Set<string>();
  const free = new Set<string>();

  const visit = (node: HybridFormula, bound: Set<string>): void => {
    switch (node.kind) {
      case 'atom':
        atoms.add(node.name);
        return;
      case 'nominal':
        if (!bound.has(node.name)) free.add(node.name);
        return;
      case 'not':
        visit(node.arg, bound);
        return;
      case 'and':
      case 'or':
        for (const sub of node.args) visit(sub, bound);
        return;
      case 'implies':
        visit(node.left, bound);
        visit(node.right, bound);
        return;
      case 'box':
      case 'diamond':
        visit(node.arg, bound);
        return;
      case 'at':
        if (!bound.has(node.nominal)) free.add(node.nominal);
        visit(node.arg, bound);
        return;
      case 'down':
      case 'exists-world': {
        const inner = new Set(bound);
        inner.add(node.bind);
        visit(node.arg, inner);
        return;
      }
    }
  };

  visit(phi, new Set<string>());
  return { atoms: [...atoms], freeNominals: [...free] };
}

/** Genera todos los subconjuntos de `items` como Set<string>. */
function* powerset<T>(items: T[]): Generator<T[]> {
  const n = items.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const out: T[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) out.push(items[i]);
    }
    yield out;
  }
}

/** Genera todas las asignaciones de los nominales libres a worlds. */
function* nominalAssignments(noms: string[], worlds: string[]): Generator<Record<string, string>> {
  if (noms.length === 0) {
    yield {};
    return;
  }
  const [head, ...rest] = noms;
  for (const w of worlds) {
    for (const sub of nominalAssignments(rest, worlds)) {
      yield { ...sub, [head]: w };
    }
  }
}

/** Genera todas las valuaciones posibles sobre `atoms` y `worlds`. */
function* valuations(atoms: string[], worlds: string[]): Generator<Record<string, Set<string>>> {
  if (atoms.length === 0) {
    yield {};
    return;
  }
  const [head, ...rest] = atoms;
  for (const subset of powerset(worlds)) {
    for (const sub of valuations(rest, worlds)) {
      yield { ...sub, [head]: new Set(subset) };
    }
  }
}

/** Genera todas las relaciones binarias sobre `worlds`. */
function* accessibilities(worlds: string[]): Generator<Array<[string, string]>> {
  const pairs: Array<[string, string]> = [];
  for (const u of worlds) {
    for (const v of worlds) pairs.push([u, v]);
  }
  for (const subset of powerset(pairs)) {
    yield subset;
  }
}

/**
 * Búsqueda exhaustiva de modelo en frames de tamaño ≤ `maxWorlds`.
 *
 * Para una explosión combinatoria controlada, sólo intentamos
 * tamaños desde 1 hasta `maxWorlds`. Es completo dentro de ese rango.
 */
export function isSatisfiable(
  phi: HybridFormula,
  options: { maxWorlds?: number } = {},
): { sat: boolean; frame?: HybridFrame; world?: string } {
  const { atoms, freeNominals } = collectSyntax(phi);
  const defaultBound = Math.max(2, atoms.length + freeNominals.length + 2);
  const maxWorlds = options.maxWorlds ?? defaultBound;

  for (let size = 1; size <= maxWorlds; size++) {
    const worlds: string[] = [];
    for (let i = 0; i < size; i++) worlds.push(`w${i}`);

    for (const accessibility of accessibilities(worlds)) {
      for (const nominals of nominalAssignments(freeNominals, worlds)) {
        for (const valuation of valuations(atoms, worlds)) {
          const frame: HybridFrame = { worlds, accessibility, nominals, valuation };
          const w = isSatisfiableInFrame(frame, phi);
          if (w !== undefined) {
            return { sat: true, frame, world: w };
          }
        }
      }
    }
  }
  return { sat: false };
}
