# `namespaces/type-theory.ts`

Namespace: TypeTheory

Sistemas de tipos y cálculos lambda — correspondencia Curry-Howard,
System F polimórfico, MLTT (Martin-Löf), λ-calc puro, combinadores SKI,
NBE (normalization by evaluation), refinement types.

Importa así:
  import { TypeTheory } from '@stevenvo780/st-lang';
  const t = TypeTheory.systemF.typeOf(term);
  const proof = TypeTheory.curryHoward.termToProof(lam);
