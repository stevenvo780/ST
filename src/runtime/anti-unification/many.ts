// ============================================================
// ST Anti-Unification — n-way lgg
// ============================================================
//
// La anti-unification se generaliza a n términos plegando con la
// versión binaria:
//
//   lgg(t1, t2, ..., tn) = lgg(lgg(...lgg(t1, t2)..., tn-1), tn)
//
// Plotkin demostró que lgg es asociativo y conmutativo módulo
// renombre de variables: el orden del pliegue no cambia la
// generalización resultante (salvo nombres de variables).
//
// Sin embargo, las substLeft/substRight intermedias acumulan
// información, así que para el resultado n-ario devolvemos:
//
//   - generalization: el lgg de los n términos.
//   - variables:      las fresh vars introducidas.
//   - substLeft, substRight: aquí pierden sentido binario; en el
//     resultado n-ario los reusamos para el PRIMER y ÚLTIMO término
//     respectivamente. Para acceso completo, los clientes deberían
//     re-derivar `match(generalization, ti)` para cada i.
//
// Para conservar acceso completo a las n sustituciones, exponemos
// también `antiUnifyManyDetailed` que devuelve un array de mapas.

import type { AntiUnificationResult, FreshSupply, Term } from './types';
import { antiUnify, defaultFreshSupply } from './anti-unify';
import { applySubst, termEquals, varsOf } from './term-utils';

/**
 * Variante "detailed" del n-way lgg.
 *
 * Devuelve la generalización y un array `substs` de longitud n tal
 * que substs[i] aplicada al generalization reproduce el término i.
 */
export interface AntiUnificationManyResult {
  generalization: Term;
  substs: Map<string, Term>[];
  variables: string[];
}

/**
 * Anti-unification n-aria. Reduce con la versión binaria.
 *
 * Para n=0 lanza error (no hay generalización sensata).
 * Para n=1 devuelve el término sin variables nuevas.
 */
export function antiUnifyMany(terms: Term[], freshSupply?: FreshSupply): AntiUnificationResult {
  if (terms.length === 0) {
    throw new Error('antiUnifyMany: array vacío, no hay lgg');
  }
  const supply = freshSupply ?? defaultFreshSupply();

  const first = terms[0];
  if (first === undefined) {
    throw new Error('antiUnifyMany: índice 0 indefinido');
  }
  if (terms.length === 1) {
    return {
      generalization: first,
      substLeft: new Map(),
      substRight: new Map(),
      variables: [],
    };
  }

  // Pliegue izquierdo binario. Reusamos el mismo supply para que
  // las fresh vars tengan numeración monótona.
  let acc = antiUnify(first, terms[1], supply);
  for (let i = 2; i < terms.length; i++) {
    const ti = terms[i];
    if (ti === undefined) {
      throw new Error(`antiUnifyMany: índice ${i} indefinido`);
    }
    const next = antiUnify(acc.generalization, ti, supply);
    acc = {
      generalization: next.generalization,
      substLeft: acc.substLeft, // del primer término — se preserva semántica original.
      substRight: next.substRight, // del último término.
      variables: next.variables,
    };
  }

  // `variables` de acc puede no incluir las vars de pasos anteriores
  // que sobrevivieron en la generalización final. Re-derivamos desde
  // las vars que aparecen en `acc.generalization`.
  const vars = Array.from(varsOf(acc.generalization));
  return { ...acc, variables: vars };
}

/**
 * Versión "detailed" — devuelve las n sustituciones independientes.
 *
 * Esta es la forma más útil para clientes que quieren ver cómo se
 * instancia cada uno de los n términos desde la generalización.
 */
export function antiUnifyManyDetailed(
  terms: Term[],
  freshSupply?: FreshSupply,
): AntiUnificationManyResult {
  const lgg = antiUnifyMany(terms, freshSupply);
  const substs: Map<string, Term>[] = [];
  // Para cada término ti, hacemos matching de la generalización
  // contra ti. La generalización siempre matchea (es el lgg) y la
  // sustitución es única.
  for (const ti of terms) {
    const m = matchGeneralization(lgg.generalization, ti);
    if (m === null) {
      // Inconsistencia: no debería ocurrir si antiUnifyMany es
      // correcto. Lanzamos para no esconder bugs.
      throw new Error('antiUnifyManyDetailed: matching de la generalización falló (bug interno)');
    }
    substs.push(m);
  }
  return {
    generalization: lgg.generalization,
    substs,
    variables: lgg.variables,
  };
}

/**
 * Matching unidireccional: σ(pattern) = target. Variables del
 * pattern se ligan; el target se trata como término concreto.
 *
 * Es una versión local porque term-utils del módulo no exporta
 * matching (lo evitamos para no duplicar el módulo de unify).
 */
function matchGeneralization(pattern: Term, target: Term): Map<string, Term> | null {
  const subst = new Map<string, Term>();
  const stack: [Term, Term][] = [[pattern, target]];
  while (stack.length > 0) {
    const pair = stack.pop();
    if (pair === undefined) break;
    const [p, q] = pair;
    if (p.kind === 'var') {
      const existing = subst.get(p.name);
      if (existing !== undefined) {
        if (!termEquals(existing, q)) return null;
        continue;
      }
      subst.set(p.name, q);
      continue;
    }
    // p es func o const; q debe ser del mismo "head".
    if (q.kind === 'var') return null;
    if (p.name !== q.name) return null;
    const pa = p.args ?? [];
    const qa = q.args ?? [];
    if (pa.length !== qa.length) return null;
    for (let i = 0; i < pa.length; i++) {
      const pi = pa[i];
      const qi = qa[i];
      if (pi === undefined || qi === undefined) return null;
      stack.push([pi, qi]);
    }
  }
  return subst;
}

/**
 * Orden de generalidad entre dos términos.
 *
 * Definición: g1 ≤ g2 ⇔ existe sustitución σ con σ(g1) = g2.
 * Es decir, g1 es MÁS GENERAL que g2 (g2 es una instancia de g1).
 *
 * Resultados:
 *   - -1  si g1 es ESTRICTAMENTE más general que g2 (g1 < g2 en
 *         generalidad inversa — equivalente: σ(g1)=g2 pero no
 *         σ'(g2)=g1).
 *   -  0  si son equivalentes módulo renombre (cada uno instancia
 *         del otro vía sustitución de variables).
 *   - +1  si g2 es estrictamente más general que g1.
 *   - null si son INCOMPARABLES (no hay σ en ningún sentido).
 *
 * Nota: la convención del usuario en la spec es
 *   generalizationOrder(X, f(X)) → -1 (X más general).
 * Esto es coherente: X es más general que f(X), y devolvemos -1.
 */
export function generalizationOrder(g1: Term, g2: Term): -1 | 0 | 1 | null {
  const sigma12 = matchGeneralization(g1, g2); // g1 → g2 ?
  const sigma21 = matchGeneralization(g2, g1); // g2 → g1 ?

  if (sigma12 !== null && sigma21 !== null) return 0;
  if (sigma12 !== null) {
    // σ(g1) = g2; ahora distingue si es un renombre puro (igualdad
    // módulo nombres) o una instanciación estricta. Como sigma21 es
    // null, no es renombre — es estricta.
    return -1;
  }
  if (sigma21 !== null) return 1;
  return null;
}

// applySubst re-exportado para uso de tests que quieran verificar
// σ(generalization) = ti sin importar term-utils manualmente.
export { applySubst };
