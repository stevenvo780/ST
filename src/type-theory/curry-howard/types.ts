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

export type PropType =
  | { kind: 'atom'; name: string }
  | { kind: 'arrow'; from: PropType; to: PropType }
  | { kind: 'product'; left: PropType; right: PropType }
  | { kind: 'sum'; left: PropType; right: PropType }
  | { kind: 'bottom' };

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

// Árbol de prueba en deducción natural.
// Cada nodo lleva la fórmula que prueba (conclusion) y, según la regla,
// uno o más sub-arboles (premises) y posibles supuestos descargados
// (discharged) que ligan hipótesis a sub-arboles.
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

export type Context = Record<string, PropType>;

// ---------- Constructores convenientes ----------
export const atom = (name: string): PropType => ({ kind: 'atom', name });
export const arrow = (from: PropType, to: PropType): PropType => ({ kind: 'arrow', from, to });
export const product = (left: PropType, right: PropType): PropType => ({
  kind: 'product',
  left,
  right,
});
export const sum = (left: PropType, right: PropType): PropType => ({ kind: 'sum', left, right });
export const bottom = (): PropType => ({ kind: 'bottom' });

export const vr = (name: string): LambdaTerm => ({ kind: 'var', name });
export const app = (fn: LambdaTerm, arg: LambdaTerm): LambdaTerm => ({ kind: 'app', fn, arg });
export const abs = (param: string, paramType: PropType, body: LambdaTerm): LambdaTerm => ({
  kind: 'abs',
  param,
  paramType,
  body,
});
export const pair = (f: LambdaTerm, s: LambdaTerm): LambdaTerm => ({
  kind: 'pair',
  fst: f,
  snd: s,
});
export const fst = (p: LambdaTerm): LambdaTerm => ({ kind: 'fst', pair: p });
export const snd = (p: LambdaTerm): LambdaTerm => ({ kind: 'snd', pair: p });
export const inl = (left: LambdaTerm, rightType: PropType): LambdaTerm => ({
  kind: 'inl',
  left,
  rightType,
});
export const inr = (right: LambdaTerm, leftType: PropType): LambdaTerm => ({
  kind: 'inr',
  right,
  leftType,
});
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
export const absurd = (proofOfFalse: LambdaTerm, resultType: PropType): LambdaTerm => ({
  kind: 'absurd',
  proofOfFalse,
  resultType,
});

// ---------- Igualdad estructural de tipos ----------
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
