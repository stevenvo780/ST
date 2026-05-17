// ============================================================
// CTL model checker — algoritmo clásico de labelling por punto fijo.
// ============================================================
// Complejidad O(|φ| · (|S| + |R|)) sobre modelos finitos.
//
// EX/AX: paso local sobre la relación R.
// EF/AF: punto fijo mínimo (lfp).
// EG/AG: punto fijo máximo (gfp).
// EU:    punto fijo mínimo de E[A U B].
// AU:    punto fijo mínimo de A[A U B]  (fórmula con sucesores universales).
//
// Reducciones equivalentes (no usadas en el camino principal por eficiencia
// y claridad de witness):
//   AX φ  ≡ ¬EX ¬φ
//   AF φ  ≡ ¬EG ¬φ
//   AG φ  ≡ ¬EF ¬φ
// ============================================================

import type { CTLFormula, KripkeStructure } from './types';

type SatMap = Map<string, boolean>;

interface CompiledModel {
  stateIds: string[];
  labelsByState: Map<string, Set<string>>;
  succ: Map<string, Set<string>>;
  pred: Map<string, Set<string>>;
  initial: string[];
}

function compile(M: KripkeStructure): CompiledModel {
  const stateIds = M.states.map((s) => s.id);
  const labelsByState = new Map<string, Set<string>>();
  const succ = new Map<string, Set<string>>();
  const pred = new Map<string, Set<string>>();
  for (const s of M.states) {
    labelsByState.set(s.id, new Set(s.labels));
    succ.set(s.id, new Set());
    pred.set(s.id, new Set());
  }
  for (const [from, to] of M.transitions) {
    if (!succ.has(from)) {
      throw new Error(`CTL: transición desde estado desconocido "${from}"`);
    }
    if (!succ.has(to)) {
      throw new Error(`CTL: transición hacia estado desconocido "${to}"`);
    }
    succ.get(from)!.add(to);
    pred.get(to)!.add(from);
  }
  for (const init of M.initial) {
    if (!labelsByState.has(init)) {
      throw new Error(`CTL: estado inicial desconocido "${init}"`);
    }
  }
  return { stateIds, labelsByState, succ, pred, initial: [...M.initial] };
}

function emptySat(model: CompiledModel): SatMap {
  const m = new Map<string, boolean>();
  for (const id of model.stateIds) m.set(id, false);
  return m;
}

function fullSat(model: CompiledModel): SatMap {
  const m = new Map<string, boolean>();
  for (const id of model.stateIds) m.set(id, true);
  return m;
}

function labelAtom(model: CompiledModel, name: string): SatMap {
  const sat = emptySat(model);
  for (const id of model.stateIds) {
    if (model.labelsByState.get(id)!.has(name)) sat.set(id, true);
  }
  return sat;
}

function labelNot(model: CompiledModel, sub: SatMap): SatMap {
  const out = emptySat(model);
  for (const id of model.stateIds) out.set(id, !sub.get(id));
  return out;
}

function labelAnd(model: CompiledModel, subs: SatMap[]): SatMap {
  const out = fullSat(model);
  for (const id of model.stateIds) {
    let ok = true;
    for (const s of subs) {
      if (!s.get(id)) {
        ok = false;
        break;
      }
    }
    out.set(id, ok);
  }
  return out;
}

function labelOr(model: CompiledModel, subs: SatMap[]): SatMap {
  const out = emptySat(model);
  for (const id of model.stateIds) {
    let ok = false;
    for (const s of subs) {
      if (s.get(id)) {
        ok = true;
        break;
      }
    }
    out.set(id, ok);
  }
  return out;
}

function labelEX(model: CompiledModel, sub: SatMap): SatMap {
  const out = emptySat(model);
  for (const id of model.stateIds) {
    for (const s of model.succ.get(id)!) {
      if (sub.get(s)) {
        out.set(id, true);
        break;
      }
    }
  }
  return out;
}

function labelAX(model: CompiledModel, sub: SatMap): SatMap {
  const out = emptySat(model);
  for (const id of model.stateIds) {
    const succs = model.succ.get(id)!;
    let ok = true;
    for (const s of succs) {
      if (!sub.get(s)) {
        ok = false;
        break;
      }
    }
    // Estado sin sucesores: AX φ trivialmente true.
    out.set(id, ok);
  }
  return out;
}

/** EF φ = μZ. φ ∨ EX Z  (lfp). */
function labelEF(model: CompiledModel, sub: SatMap): SatMap {
  const z = emptySat(model);
  for (const id of model.stateIds) if (sub.get(id)) z.set(id, true);
  const queue: string[] = [];
  for (const id of model.stateIds) if (z.get(id)) queue.push(id);
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const p of model.pred.get(cur)!) {
      if (!z.get(p)) {
        z.set(p, true);
        queue.push(p);
      }
    }
  }
  return z;
}

/** AF φ = μZ. φ ∨ AX Z  (lfp). */
function labelAF(model: CompiledModel, sub: SatMap): SatMap {
  const z = emptySat(model);
  for (const id of model.stateIds) if (sub.get(id)) z.set(id, true);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of model.stateIds) {
      if (z.get(id)) continue;
      const succs = model.succ.get(id)!;
      if (succs.size === 0) continue; // deadlock sin φ: nunca llegará a φ
      let all = true;
      for (const s of succs) {
        if (!z.get(s)) {
          all = false;
          break;
        }
      }
      if (all) {
        z.set(id, true);
        changed = true;
      }
    }
  }
  return z;
}

/** EG φ = νZ. φ ∧ EX Z  (gfp). */
function labelEG(model: CompiledModel, sub: SatMap): SatMap {
  const z = emptySat(model);
  for (const id of model.stateIds) if (sub.get(id)) z.set(id, true);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of model.stateIds) {
      if (!z.get(id)) continue;
      const succs = model.succ.get(id)!;
      let hasSucc = false;
      for (const s of succs) {
        if (z.get(s)) {
          hasSucc = true;
          break;
        }
      }
      if (!hasSucc) {
        z.set(id, false);
        changed = true;
      }
    }
  }
  return z;
}

/** AG φ = νZ. φ ∧ AX Z  (gfp). */
function labelAG(model: CompiledModel, sub: SatMap): SatMap {
  const z = emptySat(model);
  for (const id of model.stateIds) if (sub.get(id)) z.set(id, true);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of model.stateIds) {
      if (!z.get(id)) continue;
      const succs = model.succ.get(id)!;
      let allOk = true;
      for (const s of succs) {
        if (!z.get(s)) {
          allOk = false;
          break;
        }
      }
      // Estado sin sucesores: AX trivialmente true, mantiene Z.
      if (!allOk) {
        z.set(id, false);
        changed = true;
      }
    }
  }
  return z;
}

/** E[A U B] = μZ. B ∨ (A ∧ EX Z)  (lfp). */
function labelEU(model: CompiledModel, subA: SatMap, subB: SatMap): SatMap {
  const z = emptySat(model);
  for (const id of model.stateIds) if (subB.get(id)) z.set(id, true);
  const queue: string[] = [];
  for (const id of model.stateIds) if (z.get(id)) queue.push(id);
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const p of model.pred.get(cur)!) {
      if (z.get(p)) continue;
      if (subA.get(p)) {
        z.set(p, true);
        queue.push(p);
      }
    }
  }
  return z;
}

/** A[A U B] = μZ. B ∨ (A ∧ AX Z ∧ EX Z)  (lfp).
 *  El EX Z extra evita que estados sin sucesores satisfagan A[A U B]
 *  cuando aún no hemos visto B — un deadlock no garantiza llegar a B.
 */
function labelAU(model: CompiledModel, subA: SatMap, subB: SatMap): SatMap {
  const z = emptySat(model);
  for (const id of model.stateIds) if (subB.get(id)) z.set(id, true);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of model.stateIds) {
      if (z.get(id)) continue;
      if (!subA.get(id)) continue;
      const succs = model.succ.get(id)!;
      if (succs.size === 0) continue;
      let allOk = true;
      for (const s of succs) {
        if (!z.get(s)) {
          allOk = false;
          break;
        }
      }
      if (allOk) {
        z.set(id, true);
        changed = true;
      }
    }
  }
  return z;
}

function label(model: CompiledModel, phi: CTLFormula): SatMap {
  switch (phi.kind) {
    case 'true':
      return fullSat(model);
    case 'false':
      return emptySat(model);
    case 'atom':
      return labelAtom(model, phi.name);
    case 'not':
      return labelNot(model, label(model, phi.arg));
    case 'and':
      return labelAnd(
        model,
        phi.args.map((a) => label(model, a)),
      );
    case 'or':
      return labelOr(
        model,
        phi.args.map((a) => label(model, a)),
      );
    case 'implies': {
      const l = label(model, phi.left);
      const r = label(model, phi.right);
      const out = emptySat(model);
      for (const id of model.stateIds) {
        out.set(id, !l.get(id) || !!r.get(id));
      }
      return out;
    }
    case 'EX':
      return labelEX(model, label(model, phi.arg));
    case 'AX':
      return labelAX(model, label(model, phi.arg));
    case 'EF':
      return labelEF(model, label(model, phi.arg));
    case 'AF':
      return labelAF(model, label(model, phi.arg));
    case 'EG':
      return labelEG(model, label(model, phi.arg));
    case 'AG':
      return labelAG(model, label(model, phi.arg));
    case 'EU':
      return labelEU(model, label(model, phi.left), label(model, phi.right));
    case 'AU':
      return labelAU(model, label(model, phi.left), label(model, phi.right));
  }
}

/**
 * Model checking de Computation Tree Logic.
 * Devuelve un mapa `stateId → φ se cumple en ese estado`.
 */
export function modelCheckCTL(M: KripkeStructure, phi: CTLFormula): Map<string, boolean> {
  const model = compile(M);
  return label(model, phi);
}

/**
 * `M ⊨ φ` cuando φ se cumple en todos los estados iniciales.
 * Si `initial` está vacío, devuelve `true` por vacuidad (consistente con
 * la lectura "no hay contraejemplo en S0").
 */
export function satisfiesCTL(M: KripkeStructure, phi: CTLFormula): boolean {
  const sat = modelCheckCTL(M, phi);
  for (const id of M.initial) {
    if (!sat.get(id)) return false;
  }
  return true;
}
