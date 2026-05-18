// ============================================================
// Curry-Howard — Tipos y términos
// ============================================================
//
// Correspondencia Curry-Howard:
//   tipo            ↔  proposición
//   programa        ↔  prueba
//   β-reducción     ↔  normalización de pruebas
//
// Constructores soportados:
//   →   (arrow)    →  implicación
//   ∧   (product)  →  conjunción
//   ∨   (sum)      →  disyunción
//   ⊥   (bottom)   →  falso
//   atom           →  variable proposicional

/** Tipo proposicional / tipo simple en la correspondencia Curry-Howard: átomo, flecha →, producto ∧, suma ∨ y ⊥. */
export type PropType =
  | { kind: 'atom'; name: string }
  | { kind: 'arrow'; from: PropType; to: PropType }
  | { kind: 'product'; left: PropType; right: PropType }
  | { kind: 'sum'; left: PropType; right: PropType }
  | { kind: 'bottom' };

/** Término del λ-cálculo con tipos simples (Curry-Howard): variable, aplicación, abstracción, pares, sumas y absurdo. */
export type LambdaTerm =
  | { kind: 'var'; name: string }
  | { kind: 'app'; fn: LambdaTerm; arg: LambdaTerm }
  | { kind: 'abs'; param: string; paramType: PropType; body: LambdaTerm }
  | { kind: 'pair'; fst: LambdaTerm; snd: LambdaTerm }
  | { kind: 'fst'; pair: LambdaTerm }
  | { kind: 'snd'; pair: LambdaTerm }
  | { kind: 'inl'; left: LambdaTerm; rightType: PropType }
  | { kind: 'inr'; right: LambdaTerm; leftType: PropType }
  | {
      kind: 'case';
      scrutinee: LambdaTerm;
      leftBind: string;
      leftBody: LambdaTerm;
      rightBind: string;
      rightBody: LambdaTerm;
    }
  | { kind: 'absurd'; proofOfFalse: LambdaTerm; resultType: PropType };

/**
 * Reglas de deducción natural del sistema proposicional (Curry-Howard).
 * `'axiom'` = hipótesis del contexto; `'→I'`/`'→E'` = implicación; `'∧I'`/`'∧E-*'` = conjunción;
 * `'∨I-*'`/`'∨E'` = disyunción; `'⊥E'` = ex falso quodlibet.
 */
export type ProofRule =
  | 'axiom' // hipótesis disponible en contexto (asunción no descargada aquí)
  | '→I' // implicación-intro (descarga A, deriva A→B desde B)
  | '→E' // modus ponens
  | '∧I' // conjunción-intro
  | '∧E-L' // proyección izquierda
  | '∧E-R' // proyección derecha
  | '∨I-L' // disyunción-intro por izquierda
  | '∨I-R' // disyunción-intro por derecha
  | '∨E' // eliminación de disyunción (case)
  | '⊥E'; // ex falso

/** Árbol de prueba en deducción natural: cada nodo lleva la regla, la conclusión y sub-árboles (premisas). */
export interface ProofTree {
  rule: ProofRule;
  conclusion: PropType;
  premises: ProofTree[];
  // Para → I y ∨ E, los supuestos descargados (nombre + tipo).
  // Sólo informativo / para term-roundtrip; un nombre por sub-rama.
  discharged?: { name: string; type: PropType }[];
  // Para `axiom`: nombre de la hipótesis del contexto.
  assumption?: string;
}

/** Contexto de tipado: mapa de nombres de variables a tipos proposicionales. */
export type Context = Record<string, PropType>;

// ---------- Constructores convenientes ----------
/** Tipo atómico (variable proposicional). */
export const atom = (name: string): PropType => ({ kind: 'atom', name });
/** Tipo flecha `from → to` (implicación). */
export const arrow = (from: PropType, to: PropType): PropType => ({ kind: 'arrow', from, to });
/** Tipo producto `left ∧ right` (conjunción). */
export const product = (left: PropType, right: PropType): PropType => ({
  kind: 'product',
  left,
  right,
});
/** Tipo suma `left ∨ right` (disyunción). */
export const sum = (left: PropType, right: PropType): PropType => ({ kind: 'sum', left, right });
/** Tipo bottom `⊥` (falsedad / tipo vacío). */
export const bottom = (): PropType => ({ kind: 'bottom' });

/** Variable λ. */
export const vr = (name: string): LambdaTerm => ({ kind: 'var', name });
/** Aplicación de función (modus ponens). */
export const app = (fn: LambdaTerm, arg: LambdaTerm): LambdaTerm => ({ kind: 'app', fn, arg });
/** Abstracción λ (implicación-intro): `λparam:paramType. body`. */
export const abs = (param: string, paramType: PropType, body: LambdaTerm): LambdaTerm => ({
  kind: 'abs',
  param,
  paramType,
  body,
});
/** Par `⟨f, s⟩` (conjunción-intro). */
export const pair = (f: LambdaTerm, s: LambdaTerm): LambdaTerm => ({
  kind: 'pair',
  fst: f,
  snd: s,
});
/** Proyección izquierda `fst(p)` (∧E-L). */
export const fst = (p: LambdaTerm): LambdaTerm => ({ kind: 'fst', pair: p });
/** Proyección derecha `snd(p)` (∧E-R). */
export const snd = (p: LambdaTerm): LambdaTerm => ({ kind: 'snd', pair: p });
/** Inyección izquierda `inl(left)` (∨I-L); requiere el tipo del lado derecho. */
export const inl = (left: LambdaTerm, rightType: PropType): LambdaTerm => ({
  kind: 'inl',
  left,
  rightType,
});
/** Inyección derecha `inr(right)` (∨I-R); requiere el tipo del lado izquierdo. */
export const inr = (right: LambdaTerm, leftType: PropType): LambdaTerm => ({
  kind: 'inr',
  right,
  leftType,
});
/** Eliminación de disyunción `case scrutinee of inl(lb)→leftBody | inr(rb)→rightBody` (∨E). */
export const cse = (
  scrutinee: LambdaTerm,
  leftBind: string,
  leftBody: LambdaTerm,
  rightBind: string,
  rightBody: LambdaTerm,
): LambdaTerm => ({
  kind: 'case',
  scrutinee,
  leftBind,
  leftBody,
  rightBind,
  rightBody,
});
/** Ex falso: dado `proofOfFalse : ⊥`, produce cualquier tipo `resultType` (⊥E). */
export const absurd = (proofOfFalse: LambdaTerm, resultType: PropType): LambdaTerm => ({
  kind: 'absurd',
  proofOfFalse,
  resultType,
});

// ---------- Igualdad estructural de tipos ----------
/** Igualdad estructural entre dos tipos proposicionales. */
export function eqType(a: PropType, b: PropType): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'atom':
      return a.name === (b as typeof a).name;
    case 'arrow': {
      const bb = b as typeof a;
      return eqType(a.from, bb.from) && eqType(a.to, bb.to);
    }
    case 'product': {
      const bb = b as typeof a;
      return eqType(a.left, bb.left) && eqType(a.right, bb.right);
    }
    case 'sum': {
      const bb = b as typeof a;
      return eqType(a.left, bb.left) && eqType(a.right, bb.right);
    }
    case 'bottom':
      return true;
  }
}

// ---------- Serialización legible ----------
/** Serializa un tipo proposicional a texto con notación estándar (→, ∧, ∨, ⊥). */
export function typeToString(t: PropType): string {
  switch (t.kind) {
    case 'atom':
      return t.name;
    case 'bottom':
      return '⊥';
    case 'arrow': {
      const lhs = t.from.kind === 'arrow' ? `(${typeToString(t.from)})` : typeToString(t.from);
      return `${lhs} → ${typeToString(t.to)}`;
    }
    case 'product':
      return `(${typeToString(t.left)} ∧ ${typeToString(t.right)})`;
    case 'sum':
      return `(${typeToString(t.left)} ∨ ${typeToString(t.right)})`;
  }
}

/** Serializa un término λ a texto con notación estándar (λ, fst, snd, inl, inr, case, absurd). */
export function termToString(t: LambdaTerm): string {
  switch (t.kind) {
    case 'var':
      return t.name;
    case 'app':
      return `(${termToString(t.fn)} ${termToString(t.arg)})`;
    case 'abs':
      return `(λ${t.param}:${typeToString(t.paramType)}. ${termToString(t.body)})`;
    case 'pair':
      return `⟨${termToString(t.fst)}, ${termToString(t.snd)}⟩`;
    case 'fst':
      return `fst(${termToString(t.pair)})`;
    case 'snd':
      return `snd(${termToString(t.pair)})`;
    case 'inl':
      return `inl(${termToString(t.left)})`;
    case 'inr':
      return `inr(${termToString(t.right)})`;
    case 'case':
      return `case ${termToString(t.scrutinee)} of inl(${t.leftBind})→${termToString(
        t.leftBody,
      )} | inr(${t.rightBind})→${termToString(t.rightBody)}`;
    case 'absurd':
      return `absurd(${termToString(t.proofOfFalse)} : ${typeToString(t.resultType)})`;
  }
}
