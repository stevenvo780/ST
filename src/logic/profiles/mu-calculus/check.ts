// ============================================================
// μ-calculus model checker — algoritmo Emerson-Lei / Tarski
// ============================================================
// Semántica denotacional: ⟦φ⟧^ρ ⊆ S, donde ρ : Var → 2^S es el
// "environment" que asigna conjuntos de estados a variables.
//
//   ⟦p⟧ρ        = { s ∈ S | p ∈ L(s) }
//   ⟦X⟧ρ        = ρ(X)
//   ⟦¬φ⟧ρ       = S \ ⟦φ⟧ρ
//   ⟦φ ∧ ψ⟧ρ    = ⟦φ⟧ρ ∩ ⟦ψ⟧ρ
//   ⟦φ ∨ ψ⟧ρ    = ⟦φ⟧ρ ∪ ⟦ψ⟧ρ
//   ⟦□φ⟧ρ       = { s | ∀s'. s→s' ⇒ s' ∈ ⟦φ⟧ρ }
//   ⟦◇φ⟧ρ       = { s | ∃s'. s→s' ∧ s' ∈ ⟦φ⟧ρ }
//   ⟦μX. φ⟧ρ    = lfp T,  T(U) = ⟦φ⟧ρ[X↦U]
//   ⟦νX. φ⟧ρ    = gfp T,  idem
//
// lfp/gfp se computan iterando desde ∅ / S hasta punto fijo
// (Knaster-Tarski). Modelos finitos terminan en ≤ |S| iteraciones.
// Complejidad O(|φ| · |S|^{ad(φ)+1}) en el peor caso.
// ============================================================

import type { KripkeStructure, MuFormula } from './types';

interface CompiledModel {
  states: string[];
  universe: Set<string>;
  labels: Map<string, Set<string>>;
  succ: Map<string, Set<string>>;
}

function compile(K: KripkeStructure): CompiledModel {
  const states = [...K.states];
  const universe = new Set(states);
  const labels = new Map<string, Set<string>>();
  const succ = new Map<string, Set<string>>();
  for (const s of states) {
    labels.set(s, new Set(K.labelling[s] ?? []));
    succ.set(s, new Set());
  }
  for (const [from, to] of K.transitions) {
    if (!universe.has(from)) {
      throw new Error(`μ-calculus: transición desde estado desconocido "${from}"`);
    }
    if (!universe.has(to)) {
      throw new Error(`μ-calculus: transición hacia estado desconocido "${to}"`);
    }
    const fromSet = succ.get(from);
    if (fromSet === undefined) throw new Error(`μ-calculus: estado origen desconocido "${from}"`);
    fromSet.add(to);
  }
  return { states, universe, labels, succ };
}

type Env = Map<string, Set<string>>;

function evalFormula(model: CompiledModel, phi: MuFormula, env: Env): Set<string> {
  switch (phi.kind) {
    case 'atom': {
      const out = new Set<string>();
      for (const s of model.states) {
        if (model.labels.get(s)?.has(phi.name)) out.add(s);
      }
      return out;
    }
    case 'var': {
      const v = env.get(phi.name);
      if (!v) {
        throw new Error(`μ-calculus: variable libre "${phi.name}" en evaluación`);
      }
      return new Set(v);
    }
    case 'not': {
      const sub = evalFormula(model, phi.arg, env);
      const out = new Set<string>();
      for (const s of model.states) if (!sub.has(s)) out.add(s);
      return out;
    }
    case 'and': {
      const l = evalFormula(model, phi.left, env);
      const r = evalFormula(model, phi.right, env);
      const out = new Set<string>();
      for (const s of l) if (r.has(s)) out.add(s);
      return out;
    }
    case 'or': {
      const l = evalFormula(model, phi.left, env);
      const r = evalFormula(model, phi.right, env);
      const out = new Set<string>(l);
      for (const s of r) out.add(s);
      return out;
    }
    case 'box': {
      // □φ: todos los sucesores satisfacen φ (vacuamente true si no hay sucesores)
      const sub = evalFormula(model, phi.arg, env);
      const out = new Set<string>();
      for (const s of model.states) {
        const succs = model.succ.get(s) ?? new Set<string>();
        let allOk = true;
        for (const t of succs) {
          if (!sub.has(t)) {
            allOk = false;
            break;
          }
        }
        if (allOk) out.add(s);
      }
      return out;
    }
    case 'diamond': {
      // ◇φ: existe un sucesor que satisface φ
      const sub = evalFormula(model, phi.arg, env);
      const out = new Set<string>();
      for (const s of model.states) {
        for (const t of model.succ.get(s) ?? []) {
          if (sub.has(t)) {
            out.add(s);
            break;
          }
        }
      }
      return out;
    }
    case 'mu': {
      // lfp: empezar desde ∅, iterar hasta punto fijo
      let approx = new Set<string>();
      while (true) {
        const next = evalFormula(model, phi.body, extend(env, phi.bind, approx));
        if (setsEqual(approx, next)) return approx;
        approx = next;
      }
    }
    case 'nu': {
      // gfp: empezar desde S, iterar hasta punto fijo
      let approx = new Set<string>(model.states);
      while (true) {
        const next = evalFormula(model, phi.body, extend(env, phi.bind, approx));
        if (setsEqual(approx, next)) return approx;
        approx = next;
      }
    }
  }
}

function extend(env: Env, name: string, value: Set<string>): Env {
  const next = new Map(env);
  next.set(name, value);
  return next;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * Model checking de modal μ-calculus.
 * Devuelve el conjunto de estados que satisfacen φ.
 *
 * Lanza si φ tiene variables libres no ligadas o si la fórmula no
 * está bien formada en tiempo de ejecución (se recomienda chequear
 * `isWellFormed(φ)` antes de invocar).
 */
export function modelCheck(K: KripkeStructure, phi: MuFormula): Set<string> {
  const model = compile(K);
  return evalFormula(model, phi, new Map());
}

/**
 * `K, s ⊨ φ` para un estado puntual. Conveniencia sobre `modelCheck`.
 */
export function satisfiesAt(K: KripkeStructure, phi: MuFormula, state: string): boolean {
  return modelCheck(K, phi).has(state);
}
