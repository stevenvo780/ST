// ============================================================
// Hindley-Milner — Tipos, esquemas, expresiones y entorno
// ============================================================
//
// Sistema de tipos let-polimórfico estilo Damas-Milner. La sintaxis
// está dividida en dos niveles:
//
//   τ  ::= α | C | τ → τ | C τ ...        (monotipos)
//   σ  ::= τ | ∀α. σ                       (esquemas de tipo)
//
// Sólo el `let` introduce esquemas: el cuerpo de un λ recibe siempre
// un monotipo. Esa restricción es lo que mantiene decidible la
// inferencia (rank-1).
//
// Las expresiones son STLC + literales + `let` polimórfico + `letRec`
// (puntos fijos múltiples) + condicional `if`. La regla operacional
// es estándar; aquí sólo nos interesa el tipado.
//
// Convenciones de impresión:
//   - tvar usa el nombre crudo (α, β, t1, ...).
//   - tapp se imprime `C a b c` salvo el caso n=0 (`C`).
//   - arrow asocia a la derecha; con paréntesis si el dominio es
//     a su vez arrow o tapp con args.

export type Type =
  | { kind: 'tvar'; name: string }
  | { kind: 'tconst'; name: string }
  | { kind: 'arrow'; from: Type; to: Type }
  | { kind: 'tapp'; fn: string; args: Type[] };

export interface TypeScheme {
  forall: string[];
  body: Type;
}

export type Expr =
  | { kind: 'var'; name: string }
  | { kind: 'lit'; value: number | boolean | string }
  | { kind: 'app'; fn: Expr; arg: Expr }
  | { kind: 'lam'; param: string; body: Expr }
  | { kind: 'let'; bind: string; value: Expr; body: Expr }
  | { kind: 'letRec'; defs: Array<{ name: string; body: Expr }>; body: Expr }
  | { kind: 'if'; cond: Expr; then: Expr; else: Expr };

// ---------- Constructores convenientes ----------
export const tVar = (name: string): Type => ({ kind: 'tvar', name });
export const tConst = (name: string): Type => ({ kind: 'tconst', name });
export const tArrow = (from: Type, to: Type): Type => ({ kind: 'arrow', from, to });
export const tApp = (fn: string, ...args: Type[]): Type => ({ kind: 'tapp', fn, args });

export const scheme = (forall: string[], body: Type): TypeScheme => ({ forall, body });
export const mono = (body: Type): TypeScheme => ({ forall: [], body });

export const eVar = (name: string): Expr => ({ kind: 'var', name });
export const eLit = (value: number | boolean | string): Expr => ({ kind: 'lit', value });
export const eApp = (fn: Expr, arg: Expr): Expr => ({ kind: 'app', fn, arg });
export const eLam = (param: string, body: Expr): Expr => ({ kind: 'lam', param, body });
export const eLet = (bind: string, value: Expr, body: Expr): Expr => ({
  kind: 'let',
  bind,
  value,
  body,
});
export const eLetRec = (defs: Array<{ name: string; body: Expr }>, body: Expr): Expr => ({
  kind: 'letRec',
  defs,
  body,
});
export const eIf = (cond: Expr, then_: Expr, else_: Expr): Expr => ({
  kind: 'if',
  cond,
  then: then_,
  else: else_,
});

// Azúcar: aplicaciones múltiples a izquierda.
export const eAppN = (fn: Expr, ...args: Expr[]): Expr => args.reduce(eApp, fn);

// Constantes base de los tipos primitivos.
export const TInt = tConst('Int');
export const TBool = tConst('Bool');
export const TStr = tConst('String');

// ---------- Variables libres de un Type / TypeScheme ----------
export function typeFreeVars(t: Type, acc: Set<string> = new Set()): Set<string> {
  switch (t.kind) {
    case 'tvar':
      acc.add(t.name);
      return acc;
    case 'tconst':
      return acc;
    case 'arrow':
      typeFreeVars(t.from, acc);
      typeFreeVars(t.to, acc);
      return acc;
    case 'tapp':
      for (const a of t.args) typeFreeVars(a, acc);
      return acc;
  }
}

export function schemeFreeVars(s: TypeScheme): Set<string> {
  const fv = typeFreeVars(s.body);
  for (const b of s.forall) fv.delete(b);
  return fv;
}

// ---------- Impresión legible ----------
export function typeToString(t: Type): string {
  switch (t.kind) {
    case 'tvar':
      return t.name;
    case 'tconst':
      return t.name;
    case 'arrow': {
      // type application asocia más fuerte que ->; sólo el dominio
      // siendo a su vez una flecha exige paréntesis.
      const lhs = t.from.kind === 'arrow' ? `(${typeToString(t.from)})` : typeToString(t.from);
      return `${lhs} -> ${typeToString(t.to)}`;
    }
    case 'tapp': {
      if (t.args.length === 0) return t.fn;
      // dentro de un tapp, cualquier argumento que sea arrow o tapp con args
      // necesita paréntesis para evitar ambigüedad (`List List a` vs `List (List a)`).
      const parts = t.args.map((a) =>
        a.kind === 'arrow' || (a.kind === 'tapp' && a.args.length > 0)
          ? `(${typeToString(a)})`
          : typeToString(a),
      );
      return `${t.fn} ${parts.join(' ')}`;
    }
  }
}

export function schemeToString(s: TypeScheme): string {
  if (s.forall.length === 0) return typeToString(s.body);
  return `forall ${s.forall.join(' ')}. ${typeToString(s.body)}`;
}

// ---------- Entorno de tipos ----------
// Inmutable: extend() devuelve un nuevo TypeEnv que comparte estructura
// con el anterior. El test de `freeVars()` recorre todos los schemes
// para soportar generalización correcta.
export class TypeEnv {
  readonly bindings: Map<string, TypeScheme>;

  constructor(bindings: Map<string, TypeScheme> = new Map()) {
    this.bindings = bindings;
  }

  extend(name: string, sc: TypeScheme): TypeEnv {
    const next = new Map(this.bindings);
    next.set(name, sc);
    return new TypeEnv(next);
  }

  extendMany(entries: Array<[string, TypeScheme]>): TypeEnv {
    const next = new Map(this.bindings);
    for (const [n, s] of entries) next.set(n, s);
    return new TypeEnv(next);
  }

  lookup(name: string): TypeScheme | undefined {
    return this.bindings.get(name);
  }

  freeVars(): Set<string> {
    const acc = new Set<string>();
    for (const sc of this.bindings.values()) {
      for (const v of schemeFreeVars(sc)) acc.add(v);
    }
    return acc;
  }
}
