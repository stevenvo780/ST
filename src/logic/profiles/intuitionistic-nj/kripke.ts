// ============================================================
// Kripke counter-models para IPC
// ============================================================
//
// IPC es completa respecto a frames de Kripke finitos
// (Kripke 1965). Una fórmula no es un teorema intuicionista
// sii existe un modelo de Kripke finito (preorden + forcing
// persistente) cuya raíz no la fuerza.
//
// Estrategia: enumeración acotada de preórdenes sobre
// {w0,...,w_{k-1}} y todas las valuaciones persistentes
// (subconjuntos upward-closed por cada átomo).
//
// Para refutar contraejemplos clásicos típicos (¬¬P → P,
// P ∨ ¬P, Peirce) bastan 2-3 mundos.

import { IntuitFormula, KripkeIntuitModel } from './types';
import { collectAtoms } from './formula';

interface InternalModel {
  worlds: number[];
  /** Mapa de cada mundo a los mundos accesibles (cerrado refl+trans). */
  access: Map<number, Set<number>>;
  /** Valuación por mundo. */
  val: Map<number, Set<string>>;
}

/**
 * Forcing intuicionista en `w` para `f`.
 */
function forces(model: InternalModel, w: number, f: IntuitFormula): boolean {
  switch (f.kind) {
    case 'atom':
      return model.val.get(w)?.has(f.name) ?? false;
    case 'bottom':
      return false;
    case 'and':
      return forces(model, w, f.left) && forces(model, w, f.right);
    case 'or':
      return forces(model, w, f.left) || forces(model, w, f.right);
    case 'implies': {
      for (const v of model.access.get(w) ?? []) {
        if (forces(model, v, f.left) && !forces(model, v, f.right)) return false;
      }
      return true;
    }
    case 'not': {
      for (const v of model.access.get(w) ?? []) {
        if (forces(model, v, f.arg)) return false;
      }
      return true;
    }
  }
}

/**
 * Cierra `access` reflexiva y transitivamente in-place.
 */
function reflexiveTransitiveClosure(access: Map<number, Set<number>>, worlds: number[]): void {
  for (const w of worlds) {
    if (!access.has(w)) access.set(w, new Set());
    access.get(w)!.add(w);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const w of worlds) {
      const acc = access.get(w)!;
      const additions: number[] = [];
      for (const v of acc) {
        for (const u of access.get(v) ?? []) {
          if (!acc.has(u)) additions.push(u);
        }
      }
      for (const u of additions) {
        acc.add(u);
        changed = true;
      }
    }
  }
}

/**
 * Devuelve todos los conjuntos upward-closed (en el preorden
 * dado por `access`) sobre `worlds`. Usados para construir
 * valuaciones persistentes.
 */
function upwardClosedSets(worlds: number[], access: Map<number, Set<number>>): number[][] {
  const out: number[][] = [];
  const n = worlds.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const subset = new Set<number>();
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.add(worlds[i]);
    }
    let upward = true;
    for (const w of subset) {
      for (const v of access.get(w) ?? []) {
        if (!subset.has(v)) {
          upward = false;
          break;
        }
      }
      if (!upward) break;
    }
    if (upward) out.push([...subset]);
  }
  return out;
}

/**
 * Genera preórdenes únicos (módulo cierre transitivo) sobre
 * `size` mundos.
 */
function* generatePreorders(size: number): Generator<Map<number, Set<number>>> {
  const worlds = Array.from({ length: size }, (_, i) => i);
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i !== j) pairs.push([i, j]);
    }
  }
  const seen = new Set<string>();
  const total = 1 << pairs.length;
  for (let mask = 0; mask < total; mask++) {
    const access = new Map<number, Set<number>>();
    for (const w of worlds) access.set(w, new Set());
    for (let b = 0; b < pairs.length; b++) {
      if (mask & (1 << b)) {
        const [from, to] = pairs[b];
        access.get(from)!.add(to);
      }
    }
    reflexiveTransitiveClosure(access, worlds);
    let hash = '';
    for (const w of worlds) {
      hash += `${w}:${[...access.get(w)!].sort((a, b) => a - b).join(',')};`;
    }
    if (seen.has(hash)) continue;
    seen.add(hash);
    yield access;
  }
}

function* generateModels(atoms: string[], maxWorlds: number): Generator<InternalModel> {
  for (let size = 1; size <= maxWorlds; size++) {
    const worlds = Array.from({ length: size }, (_, i) => i);
    for (const access of generatePreorders(size)) {
      const upwards = upwardClosedSets(worlds, access);
      // Cada átomo elige uno de los upward-closed sets.
      const k = atoms.length;
      const total = Math.pow(upwards.length, k);
      for (let i = 0; i < total; i++) {
        const val = new Map<number, Set<string>>();
        for (const w of worlds) val.set(w, new Set());
        let idx = i;
        for (let a = 0; a < k; a++) {
          const setIdx = idx % upwards.length;
          idx = Math.floor(idx / upwards.length);
          for (const w of upwards[setIdx]) {
            val.get(w)!.add(atoms[a]);
          }
        }
        yield { worlds, access, val };
      }
    }
  }
}

function toPublic(model: InternalModel): KripkeIntuitModel {
  const worlds = model.worlds.map((w) => `w${w}`);
  const accessibility: Array<[string, string]> = [];
  for (const [from, tos] of model.access) {
    for (const to of tos) accessibility.push([`w${from}`, `w${to}`]);
  }
  const forcing = new Map<string, Set<string>>();
  for (const [w, atoms] of model.val) {
    forcing.set(`w${w}`, new Set(atoms));
  }
  return { worlds, accessibility, forcing };
}

/**
 * API pública: si `formula` NO es válida intuicionistamente,
 * devuelve un modelo Kripke cuya raíz (w0) la refuta. Si es
 * válida, devuelve `null`.
 *
 * El budget máximo (mundos) se ajusta a la cantidad de átomos.
 */
export function kripkeCounterModel(
  formula: IntuitFormula,
  options: { maxWorlds?: number } = {},
): KripkeIntuitModel | null {
  const atoms = [...collectAtoms(formula)];
  const cap = options.maxWorlds ?? (atoms.length <= 2 ? 3 : 2);
  for (const model of generateModels(atoms, cap)) {
    if (!forces(model, 0, formula)) {
      return toPublic(model);
    }
  }
  return null;
}

/**
 * Helper: ¿la fórmula es válida intuicionistamente bajo modelos
 * de tamaño ≤ `maxWorlds`? Útil en tests para cruzar con el prover.
 */
export function isIPCValid(formula: IntuitFormula, maxWorlds = 3): boolean {
  return kripkeCounterModel(formula, { maxWorlds }) === null;
}
