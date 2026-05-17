// ============================================================
// ST Categorical — Functor y NaturalTransformation
// ============================================================
// Wrappers genéricos para construir functores entre categorías
// arbitrarias y verificar sus leyes vía muestreo sobre los
// morfismos del dominio.
// ============================================================

import type { Category, Functor, NaturalTransformation } from './types';

/**
 * Crea un functor verificable. El cliente pasa los mapeos a
 * objetos/morfismos; las verificaciones de leyes se derivan
 * recorriendo los `morphisms` de la categoría fuente.
 */
export function mkFunctor<O1, M1, O2, M2>(opts: {
  name: string;
  source: Category<O1, M1>;
  target: Category<O2, M2>;
  onObjects: (o: O1) => O2;
  onMorphisms: (m: M1) => M2;
}): Functor<O1, M1, O2, M2> {
  const { name, source, target, onObjects, onMorphisms } = opts;

  function verifyIdentityPreservation(): boolean {
    for (const o of source.objects) {
      const idC = source.identity(o);
      const Fid = onMorphisms(idC);
      const idDFo = target.identity(onObjects(o));
      if (!target.eqMor(Fid, idDFo)) return false;
    }
    return true;
  }

  function verifyComposition(sample = 50): boolean {
    const ms = Array.from(source.morphisms.values());
    let checked = 0;
    for (const f of ms) {
      for (const g of ms) {
        if (!source.eqObj(source.target(f), source.source(g))) continue;
        const gf = source.compose(g, f);
        const Fgf = onMorphisms(gf);
        const Fg = onMorphisms(g);
        const Ff = onMorphisms(f);
        const FgFf = target.compose(Fg, Ff);
        if (!target.eqMor(Fgf, FgFf)) return false;
        if (++checked >= sample) return true;
      }
    }
    return true;
  }

  return {
    name,
    source,
    target,
    onObjects,
    onMorphisms,
    verifyIdentityPreservation,
    verifyComposition,
  };
}

/**
 * Functor identidad `Id_C : C → C`. Útil para tests y como elemento
 * neutro de la composición de functores.
 */
export function identityFunctor<O, M>(cat: Category<O, M>): Functor<O, M, O, M> {
  return mkFunctor({
    name: `Id_${cat.name}`,
    source: cat,
    target: cat,
    onObjects: (o) => o,
    onMorphisms: (m) => m,
  });
}

/**
 * Composición de functores F ; G = G ∘ F. La firma respeta la
 * categoría source/target original sin perder información de tipos.
 */
export function composeFunctors<O1, M1, O2, M2, O3, M3>(
  G: Functor<O2, M2, O3, M3>,
  F: Functor<O1, M1, O2, M2>,
): Functor<O1, M1, O3, M3> {
  if (F.target !== G.source) {
    // Permitido si son la misma categoría por valor; pero como las
    // categorías son objetos, exigimos identidad referencial.
    throw new Error(`composeFunctors: F.target (${F.target.name}) !== G.source (${G.source.name})`);
  }
  return mkFunctor({
    name: `${G.name}∘${F.name}`,
    source: F.source,
    target: G.target,
    onObjects: (o) => G.onObjects(F.onObjects(o)),
    onMorphisms: (m) => G.onMorphisms(F.onMorphisms(m)),
  });
}

/**
 * Crea una transformación natural η : F ⇒ G verificando su
 * naturalidad por muestreo. El cliente pasa la familia de
 * componentes `component(a) : F(a) → G(a)`.
 */
export function mkNaturalTransformation<O1, M1, O2, M2>(opts: {
  name: string;
  source: Functor<O1, M1, O2, M2>;
  target: Functor<O1, M1, O2, M2>;
  component: (o: O1) => M2;
}): NaturalTransformation<O1, M1, O2, M2> {
  const { name, source: F, target: G, component } = opts;
  if (F.source !== G.source || F.target !== G.target) {
    throw new Error('mkNaturalTransformation: F and G must be parallel functors');
  }
  const C = F.source;
  const D = F.target;

  function verifyNaturality(sample = 50): boolean {
    const ms = Array.from(C.morphisms.values());
    let checked = 0;
    for (const f of ms) {
      const a = C.source(f);
      const b = C.target(f);
      const etaA = component(a);
      const etaB = component(b);
      const Gf = G.onMorphisms(f);
      const Ff = F.onMorphisms(f);
      // G(f) ∘ η_a vs η_b ∘ F(f)
      const left = D.compose(Gf, etaA);
      const right = D.compose(etaB, Ff);
      if (!D.eqMor(left, right)) return false;
      if (++checked >= sample) return true;
    }
    return true;
  }

  return { name, source: F, target: G, component, verifyNaturality };
}

/**
 * Transformación natural identidad `id_F : F ⇒ F` con componentes
 * `id_{F(a)}`. Sirve como elemento neutro de composición vertical.
 */
export function identityNT<O1, M1, O2, M2>(
  F: Functor<O1, M1, O2, M2>,
): NaturalTransformation<O1, M1, O2, M2> {
  return mkNaturalTransformation({
    name: `id_${F.name}`,
    source: F,
    target: F,
    component: (a) => F.target.identity(F.onObjects(a)),
  });
}
