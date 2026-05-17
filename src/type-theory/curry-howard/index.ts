// ============================================================
// ST Curry-Howard — Punto de entrada público
// ============================================================
//
// Correspondencia Curry-Howard sobre λ-cálculo simplemente tipado:
//   - λ-terms anotados con tipos = pruebas en deducción natural
//   - inferType: λ-term → proposición probada
//   - termToProof / proofToTerm: conversión bidireccional
//   - reduceBeta / normalize: normalización (β + proyecciones + case)

export type { PropType, LambdaTerm, ProofTree, ProofRule, Context } from './types';
export {
  atom,
  arrow,
  product,
  sum,
  bottom,
  vr,
  app,
  abs,
  pair,
  fst,
  snd,
  inl,
  inr,
  cse,
  absurd,
  eqType,
  typeToString,
  termToString,
} from './types';

export { inferType, isInferError } from './infer';
export type { InferResult } from './infer';

export { reduceBeta, normalize, isNormal, freeVars, substituteTerm } from './reduce';

export { termToProof, proofToTerm, proofIsConsistent, ProofConversionError } from './proof';
