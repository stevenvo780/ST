// ============================================================
// Refinement types — AST, tipos refinados y términos
// ============================================================
//
// Un tipo refinado expresa { x : B | P(x) } donde:
//   - B es un tipo base (Int / Bool / String / arrow)
//   - x es la variable de binding
//   - P(x) es un predicado escrito como expresión sintáctica
//     (cadenas de la forma "x > 0 && x < 100").
//
// El módulo es minimalista (al estilo Liquid Haskell didáctico):
// el solver de VCs no es Z3 — es un evaluador/SAT-search sobre
// enteros y booleanos suficiente para los predicados que se
// construyen en los tests y para casos pequeños de subtipado.

export type BaseType = 'Int' | 'Bool' | 'String' | { kind: 'arrow'; from: RefType; to: RefType };

export interface RefType {
  base: BaseType;
  /** Nombre de la variable de binding usada por el predicado (e.g. "x"). */
  binding: string;
  /** Predicado P(binding); cadena vacía o "true" significa "sin refinamiento". */
  predicate: string;
}

export type RTerm =
  | { kind: 'lit'; value: number | boolean | string }
  | { kind: 'var'; name: string }
  | {
      kind: 'binop';
      op: '+' | '-' | '*' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||';
      left: RTerm;
      right: RTerm;
    }
  | { kind: 'if'; cond: RTerm; then: RTerm; else: RTerm }
  | { kind: 'lam'; param: string; paramType: RefType; body: RTerm }
  | { kind: 'app'; fn: RTerm; arg: RTerm }
  | { kind: 'let'; bind: string; bindType?: RefType; value: RTerm; body: RTerm };

// ---------- Constructores convenientes ----------

export const tInt = (binding = '_v', predicate = 'true'): RefType => ({
  base: 'Int',
  binding,
  predicate,
});

export const tBool = (binding = '_v', predicate = 'true'): RefType => ({
  base: 'Bool',
  binding,
  predicate,
});

export const tString = (binding = '_v', predicate = 'true'): RefType => ({
  base: 'String',
  binding,
  predicate,
});

export const tArrow = (
  from: RefType,
  to: RefType,
  binding = '_v',
  predicate = 'true',
): RefType => ({
  base: { kind: 'arrow', from, to },
  binding,
  predicate,
});

export const refine = (base: BaseType, binding: string, predicate: string): RefType => ({
  base,
  binding,
  predicate,
});

// ---------- Constructores de términos ----------

export const rLit = (value: number | boolean | string): RTerm => ({ kind: 'lit', value });
export const rVar = (name: string): RTerm => ({ kind: 'var', name });
export const rBinop = (
  op: Extract<RTerm, { kind: 'binop' }>['op'],
  left: RTerm,
  right: RTerm,
): RTerm => ({ kind: 'binop', op, left, right });
export const rIf = (cond: RTerm, t: RTerm, e: RTerm): RTerm => ({
  kind: 'if',
  cond,
  then: t,
  else: e,
});
export const rLam = (param: string, paramType: RefType, body: RTerm): RTerm => ({
  kind: 'lam',
  param,
  paramType,
  body,
});
export const rApp = (fn: RTerm, arg: RTerm): RTerm => ({ kind: 'app', fn, arg });
export const rLet = (bind: string, value: RTerm, body: RTerm, bindType?: RefType): RTerm => ({
  kind: 'let',
  bind,
  bindType,
  value,
  body,
});

// ---------- Igualdad estructural de tipos base ----------

export function eqBase(a: BaseType, b: BaseType): boolean {
  if (typeof a === 'string' || typeof b === 'string') return a === b;
  // both arrows
  return eqRefType(a.from, b.from) && eqRefType(a.to, b.to);
}

export function eqRefType(a: RefType, b: RefType): boolean {
  if (!eqBase(a.base, b.base)) return false;
  // No exigimos la igualdad textual del predicado a este nivel; el chequeo de
  // subtipado se ocupa de la equivalencia semántica (P ↔ Q).
  return true;
}

// ---------- Serialización legible ----------

export function baseToString(b: BaseType): string {
  if (typeof b === 'string') return b;
  return `(${refTypeToString(b.from)}) -> (${refTypeToString(b.to)})`;
}

export function refTypeToString(t: RefType): string {
  const pred = t.predicate.trim();
  if (pred === '' || pred === 'true') {
    return `{ ${t.binding} : ${baseToString(t.base)} }`;
  }
  return `{ ${t.binding} : ${baseToString(t.base)} | ${pred} }`;
}

export function termToString(t: RTerm): string {
  switch (t.kind) {
    case 'lit':
      return typeof t.value === 'string' ? JSON.stringify(t.value) : String(t.value);
    case 'var':
      return t.name;
    case 'binop':
      return `(${termToString(t.left)} ${t.op} ${termToString(t.right)})`;
    case 'if':
      return `if ${termToString(t.cond)} then ${termToString(t.then)} else ${termToString(t.else)}`;
    case 'lam':
      return `(λ ${t.param} : ${refTypeToString(t.paramType)} . ${termToString(t.body)})`;
    case 'app':
      return `(${termToString(t.fn)} ${termToString(t.arg)})`;
    case 'let':
      return `let ${t.bind}${t.bindType ? ` : ${refTypeToString(t.bindType)}` : ''} = ${termToString(t.value)} in ${termToString(t.body)}`;
  }
}
