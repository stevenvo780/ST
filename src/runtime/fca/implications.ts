// ============================================================
// FCA — implicaciones de atributos.
// ============================================================
// Una implicación P → C entre subconjuntos de atributos es válida en el
// contexto K sii todo objeto que tiene todos los atributos de P tiene
// también todos los atributos de C. Equivale a:
//   P → C válida en K  ⇔  C ⊆ P''   (P'' = closeIntent(P))
// que en términos de extents es: P' ⊆ C'.
//
// Esto es la base del cálculo Armstrong/Duquenne-Guigues para bases de
// implicaciones. Aquí exponemos solo el test de validez puntual; la
// extracción de la base canónica se deja a un sprint posterior.
// ============================================================

import { closeIntent } from './context';
import type { FormalContext } from './types';

/**
 * Devuelve `true` si en `ctx` la implicación `premise → conclusion` es
 * válida: todo objeto que satisface todos los atributos de `premise`
 * satisface también todos los de `conclusion`.
 *
 * Equivalencia formal:  premise → conclusion  ⇔  conclusion ⊆ premise''.
 */
export function impliesAll(
  ctx: FormalContext,
  premise: Set<string>,
  conclusion: Set<string>,
): boolean {
  const closure = closeIntent(ctx, premise);
  for (const m of conclusion) {
    if (!closure.has(m)) return false;
  }
  return true;
}
