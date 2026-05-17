// ============================================================
// HoTT — Álgebra de caminos (grupoide ∞)
// ============================================================
//
// Operaciones de alto nivel para construir caminos sin tocar el AST
// directamente, con normalización inmediata de identidades (refl).

import type { HoTTTerm } from './types';
import { normalizeHoTT } from './normalize';
import { inferType, isInferErrorHoTT, type InferContextHoTT } from './infer';
import { alphaBetaEqHoTT } from './equality';

export function refl(x: HoTTTerm): HoTTTerm {
  return { kind: 'refl', term: x };
}

export function pathInverse(path: HoTTTerm): HoTTTerm {
  // Aplicar la β-rule directamente en el constructor para mantener
  // refl como punto fijo del grupo.
  if (path.kind === 'refl') return path;
  if (path.kind === 'pathSym') return path.path; // involutividad
  return { kind: 'pathSym', path };
}

export function pathCompose(p: HoTTTerm, q: HoTTTerm): HoTTTerm {
  if (p.kind === 'refl') return q;
  if (q.kind === 'refl') return p;
  return { kind: 'pathConcat', left: p, right: q };
}

/**
 * Chequeo heurístico de h-equivalencia.
 * Una equivalencia verdadera requiere isContr de las fibras, que aquí
 * NO computamos. Aceptamos pares ⟨A, B⟩ : Σ Type. Type con A αβ= B
 * (equivalencia trivial), o cualquier término marcado explícitamente
 * con la estructura ⟨f, ⟨g, ⟨α, β⟩⟩⟩ y posponemos verificación.
 */
export function isHEquivalence(f: HoTTTerm, ctx?: InferContextHoTT): boolean {
  const t = inferType(f, ctx);
  if (isInferErrorHoTT(t)) return false;
  const n = normalizeHoTT(t);
  // Caso pedagógico mínimo: equivalencia trivial id : A → A.
  if (n.kind === 'pi') {
    return alphaBetaEqHoTT(n.domain, n.codomain);
  }
  // Σ-empaquetado: aceptamos cualquier sigma como candidato.
  return n.kind === 'sigma';
}

// ── Univalence (axioma) ─────────────────────────────────────

export interface UnivalenceWitness {
  equiv: HoTTTerm;
  path: HoTTTerm;
}

/**
 * Postula un path desde una equivalencia. No es computacional:
 * normalizar `transport(P, ua(e), x)` no reduce — eso requiere
 * cubical type theory.
 */
export function univalence(equiv: HoTTTerm): HoTTTerm {
  return { kind: 'ua', equiv };
}

export function univalenceWitness(equiv: HoTTTerm): UnivalenceWitness {
  return { equiv, path: univalence(equiv) };
}
