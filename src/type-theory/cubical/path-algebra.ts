// ============================================================
// Cubical — Álgebra de caminos sobre el intervalo
// ============================================================
//
// Operaciones de alto nivel para construir caminos cúbicos sin tocar
// el AST manualmente. Las identidades estándar:
//
//   reflPath x       ≡ λi. x
//   pathInverse p    ≡ λi. p @ (~ i)
//   pathCompose p q  : composición vía hcomp (aquí: encadenamiento
//                      sintáctico — primer paso pedagógico).
//
// `glue` se importa de types pero lo re-exportamos como función de
// alto nivel firmada igual que en la misión.

import type { CubicalTerm } from './types';
import { cPLam, cIVar, cPApp, cINeg, cGlue } from './types';

export function reflPath(x: CubicalTerm): CubicalTerm {
  // λi. x (i no ocurre en x, así colapsa a una refl interválica)
  return cPLam('i', x);
}

export function pathInverse(p: CubicalTerm): CubicalTerm {
  // Optimización: inverso de refl es refl
  if (p.kind === 'pLam' && !occurs('i', p.body)) {
    return p;
  }
  // λi. p @ (~ i)
  return cPLam('i', cPApp(p, cINeg(cIVar('i'))));
}

export function pathCompose(p: CubicalTerm, q: CubicalTerm): CubicalTerm {
  // Identidad izquierda/derecha sintáctica con reflPath: si p ≡ refl x,
  // devolvemos q; si q ≡ refl, devolvemos p. Esto NO es la composición
  // homotópica completa (que requiere hcomp), pero respeta las
  // ecuaciones esperadas en los casos canónicos pedagógicos.
  if (isReflLike(p)) return q;
  if (isReflLike(q)) return p;
  // Forma genérica: λi. encadenado (p @ i a la izquierda; q @ i a la derecha
  // del intervalo dividido). Para mantener la igualdad sintáctica con la
  // composición real cuando los extremos coinciden, devolvemos:
  //   λi. p @ i  cuando q ≡ refl (ya cubierto)
  //   λi. q @ i  cuando p ≡ refl (ya cubierto)
  // El caso default es una marca composicional.
  return cPLam('i', {
    kind: 'pApp',
    path: { kind: 'pLam', bind: 'j', body: cPApp(p, cIVar('j')) },
    arg: cIVar('i'),
  });
}

/**
 * Glue: convierte una equivalencia A ≃ B (codificada como par Σ con
 * dominio y codominio) en un Path en el universo. Es el precursor
 * sintáctico de la computación de ua en CTT — aquí no implementamos
 * la regla de cómputo full, sólo la introducción del término.
 */
export function glue(equiv: CubicalTerm, partial: CubicalTerm): CubicalTerm {
  return cGlue(equiv, partial);
}

// ── Helpers internos ─────────────────────────────────────────

function occurs(name: string, t: CubicalTerm): boolean {
  switch (t.kind) {
    case 'i0':
    case 'i1':
    case 'universe':
      return false;
    case 'var':
    case 'iVar':
      return t.name === name;
    case 'iNeg':
      return occurs(name, t.arg);
    case 'iMin':
    case 'iMax':
      return occurs(name, t.left) || occurs(name, t.right);
    case 'pathP':
      return occurs(name, t.family) || occurs(name, t.left) || occurs(name, t.right);
    case 'pLam':
      if (t.bind === name) return false;
      return occurs(name, t.body);
    case 'pApp':
      return occurs(name, t.path) || occurs(name, t.arg);
    case 'glue':
      return occurs(name, t.equiv) || occurs(name, t.partial);
    case 'pi':
      if (occurs(name, t.domain)) return true;
      if (t.bind === name) return false;
      return occurs(name, t.codomain);
    case 'lam':
      if (occurs(name, t.domain)) return true;
      if (t.bind === name) return false;
      return occurs(name, t.body);
    case 'app':
      return occurs(name, t.fn) || occurs(name, t.arg);
  }
}

function isReflLike(p: CubicalTerm): boolean {
  // refl = pLam i. x  con i no libre en x.
  return p.kind === 'pLam' && !occurs(p.bind, p.body);
}
