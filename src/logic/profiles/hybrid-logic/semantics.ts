// ============================================================
// ST Hybrid Logic — Semántica relacional con asignación de nominales
// ============================================================
// `satisfies(F, w, φ, env)` decide si M, w ⊨ φ donde
//   M = (W, R, V, g)   — frame Kripke + asignación g de nominales,
//   env extiende g con los binds introducidos por ↓ y ∃.
//
// La distinción entre `nominals` (en el frame) y `env` (de evaluación)
// es estándar en la presentación de Blackburn et al.: los nominales
// libres se resuelven con la asignación global; los ligados por ↓/∃
// extienden el entorno localmente.
// ============================================================

import type { HybridFormula, HybridFrame } from './types';

/** Resuelve un nombre de nominal/variable de mundo. env tiene prioridad. */
function lookup(name: string, frame: HybridFrame, env: Record<string, string>): string | undefined {
  if (Object.prototype.hasOwnProperty.call(env, name)) return env[name];
  if (Object.prototype.hasOwnProperty.call(frame.nominals, name)) return frame.nominals[name];
  return undefined;
}

/**
 * Verdad relativa a un mundo.
 *
 * - `atom` consulta la valuación.
 * - `nominal` es verdadero en w sii la asignación combinada lo manda a w.
 * - `box`/`diamond` cuantifican sobre R-sucesores.
 * - `@i φ` saltamos al mundo nombrado por i (ignora el mundo actual).
 * - `↓i. φ` extiende env con i := w y evalúa φ en w.
 * - `∃i. φ` busca algún mundo w' tal que con i := w' la fórmula
 *   se satisfaga en el mundo actual (¡el "punto de evaluación" no
 *   cambia con ∃; sólo se introduce un nombre nuevo).
 */
export function satisfies(
  frame: HybridFrame,
  world: string,
  phi: HybridFormula,
  env: Record<string, string> = {},
): boolean {
  switch (phi.kind) {
    case 'atom': {
      const set = frame.valuation[phi.name];
      return set !== undefined && set.has(world);
    }

    case 'nominal': {
      const target = lookup(phi.name, frame, env);
      if (target === undefined) {
        throw new Error(`Nominal no asignado: ${phi.name}`);
      }
      return target === world;
    }

    case 'not':
      return !satisfies(frame, world, phi.arg, env);

    case 'and':
      return phi.args.every((sub) => satisfies(frame, world, sub, env));

    case 'or':
      return phi.args.some((sub) => satisfies(frame, world, sub, env));

    case 'implies':
      return !satisfies(frame, world, phi.left, env) || satisfies(frame, world, phi.right, env);

    case 'box': {
      for (const [u, v] of frame.accessibility) {
        if (u === world && !satisfies(frame, v, phi.arg, env)) return false;
      }
      return true;
    }

    case 'diamond': {
      for (const [u, v] of frame.accessibility) {
        if (u === world && satisfies(frame, v, phi.arg, env)) return true;
      }
      return false;
    }

    case 'at': {
      const target = lookup(phi.nominal, frame, env);
      if (target === undefined) {
        throw new Error(`@-operator sobre nominal no asignado: ${phi.nominal}`);
      }
      return satisfies(frame, target, phi.arg, env);
    }

    case 'down': {
      // ↓i. φ evaluado en w: extiende env con i := w y evalúa φ en w.
      const next = { ...env, [phi.bind]: world };
      return satisfies(frame, world, phi.arg, next);
    }

    case 'exists-world': {
      // ∃i. φ: existe un mundo w' tal que con i := w' la fórmula se
      // satisface en el punto de evaluación actual.
      for (const w2 of frame.worlds) {
        const next = { ...env, [phi.bind]: w2 };
        if (satisfies(frame, world, phi.arg, next)) return true;
      }
      return false;
    }
  }
}

/**
 * Verdad global: ∃w ∈ W. M, w ⊨ φ.
 * Útil para chequear satisfacibilidad sobre un frame concreto.
 */
export function isSatisfiableInFrame(frame: HybridFrame, phi: HybridFormula): string | undefined {
  for (const w of frame.worlds) {
    if (satisfies(frame, w, phi, {})) return w;
  }
  return undefined;
}
