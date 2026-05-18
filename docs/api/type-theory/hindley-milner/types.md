# `type-theory/hindley-milner/types.ts`

Monotipo del sistema Hindley-Milner: variable, constante, función o constructor aplicado.

## Contents

- [`Type`](#type) — Type
- [`TypeScheme`](#typescheme) — Interface
- [`Expr`](#expr) — Type
- [`tVar`](#tvar) — Const
- [`tConst`](#tconst) — Const
- [`tArrow`](#tarrow) — Const
- [`tApp`](#tapp) — Const
- [`scheme`](#scheme) — Const
- [`mono`](#mono) — Const
- [`eVar`](#evar) — Const
- [`eLit`](#elit) — Const
- [`eApp`](#eapp) — Const
- [`eLam`](#elam) — Const
- [`eLet`](#elet) — Const
- [`eLetRec`](#eletrec) — Const
- [`eIf`](#eif) — Const
- [`eAppN`](#eappn) — Const
- [`TInt`](#tint) — Const
- [`TBool`](#tbool) — Const
- [`TStr`](#tstr) — Const
- [`typeFreeVars`](#typefreevars) — Function
- [`schemeFreeVars`](#schemefreevars) — Function
- [`typeToString`](#typetostring) — Function
- [`schemeToString`](#schemetostring) — Function
- [`TypeEnv`](#typeenv) — Class

## `Type`

> Type · `type-theory/hindley-milner/types.ts:26`

Monotipo del sistema Hindley-Milner: variable, constante, función o constructor aplicado.

```ts
export type Type = | { kind: 'tvar'; name: string } | { kind: 'tconst'; name: string } | { kind: 'arrow'; from: Type; to: Type } | { kind: 'tapp'; fn: string; args: Type[] };
```


## `TypeScheme`

> Interface · `type-theory/hindley-milner/types.ts:33`

Esquema de tipo polimórfico: cuantificación universal sobre variables de tipo (rank-1).

```ts
export interface TypeScheme
```


## `Expr`

> Type · `type-theory/hindley-milner/types.ts:39`

Expresión del cálculo λ let-polimórfico: variable, literal, aplicación, lambda, let, letRec e if.

```ts
export type Expr = | { kind: 'var'; name: string } | { kind: 'lit'; value: number | boolean | string } | { kind: 'app'; fn: Expr; arg: Expr } | { kind: 'lam'; param: string; body: Expr } | { kind: 'let'; bind: string; value: Expr; body: Expr } | { kind: 'letRec'; defs: Array<{ name: string; body: Expr }>; body: Expr } | { kind: 'if'; cond: Expr; then: Expr; else: Expr };
```


## `tVar`

> Const · `type-theory/hindley-milner/types.ts:50`

Constructor de variable de tipo (e.g. `α`).

```ts
const tVar
```


## `tConst`

> Const · `type-theory/hindley-milner/types.ts:52`

Constructor de constante de tipo (e.g. `Int`, `Bool`).

```ts
const tConst
```


## `tArrow`

> Const · `type-theory/hindley-milner/types.ts:54`

Constructor de tipo flecha: `from → to`.

```ts
const tArrow
```


## `tApp`

> Const · `type-theory/hindley-milner/types.ts:56`

Constructor de aplicación de constructor de tipo: `fn args...` (e.g. `List Int`).

```ts
const tApp
```


## `scheme`

> Const · `type-theory/hindley-milner/types.ts:59`

Crea un esquema polimórfico cuantificando las variables de `forall` sobre `body`.

```ts
const scheme
```


## `mono`

> Const · `type-theory/hindley-milner/types.ts:61`

Envuelve un monotipo como esquema sin variables cuantificadas.

```ts
const mono
```


## `eVar`

> Const · `type-theory/hindley-milner/types.ts:64`

Constructor de variable de expresión.

```ts
const eVar
```


## `eLit`

> Const · `type-theory/hindley-milner/types.ts:66`

Constructor de literal (número, booleano o string).

```ts
const eLit
```


## `eApp`

> Const · `type-theory/hindley-milner/types.ts:68`

Constructor de aplicación de función: `fn arg`.

```ts
const eApp
```


## `eLam`

> Const · `type-theory/hindley-milner/types.ts:70`

Constructor de lambda: `λparam. body`.

```ts
const eLam
```


## `eLet`

> Const · `type-theory/hindley-milner/types.ts:72`

Constructor de `let bind = value in body` (introduce polimorfismo).

```ts
const eLet
```


## `eLetRec`

> Const · `type-theory/hindley-milner/types.ts:79`

Constructor de `let rec { defs } in body`: definiciones mutuamente recursivas.

```ts
const eLetRec
```


## `eIf`

> Const · `type-theory/hindley-milner/types.ts:85`

Constructor de `if cond then then_ else else_`.

```ts
const eIf
```


## `eAppN`

> Const · `type-theory/hindley-milner/types.ts:93`

Aplica `fn` a múltiples argumentos de izquierda a derecha: `fn a b c` ≡ `eApp(eApp(fn,a),b,c)`.

```ts
const eAppN
```


## `TInt`

> Const · `type-theory/hindley-milner/types.ts:96`

Tipo primitivo `Int`.

```ts
const TInt
```


## `TBool`

> Const · `type-theory/hindley-milner/types.ts:98`

Tipo primitivo `Bool`.

```ts
const TBool
```


## `TStr`

> Const · `type-theory/hindley-milner/types.ts:100`

Tipo primitivo `String`.

```ts
const TStr
```


## `typeFreeVars`

> Function · `type-theory/hindley-milner/types.ts:104`

Recolecta las variables de tipo libres (no vinculadas) en `t`.

```ts
export function typeFreeVars(t: Type, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Type` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `schemeFreeVars`

> Function · `type-theory/hindley-milner/types.ts:122`

Recolecta las variables de tipo libres en el cuerpo del esquema excluyendo las cuantificadas.

```ts
export function schemeFreeVars(s: TypeScheme): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `TypeScheme` | no |  |

### Returns

`Set<string>` — 


## `typeToString`

> Function · `type-theory/hindley-milner/types.ts:130`

Serializa un tipo a una cadena legible con precedencias correctas para flechas y constructores.

```ts
export function typeToString(t: Type): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Type` | no |  |

### Returns

`string` — 


## `schemeToString`

> Function · `type-theory/hindley-milner/types.ts:157`

Serializa un esquema de tipo a su representación `forall α. T` o simplemente `T` si es mono.

```ts
export function schemeToString(s: TypeScheme): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `TypeScheme` | no |  |

### Returns

`string` — 


## `TypeEnv`

> Class · `type-theory/hindley-milner/types.ts:167`

Entorno de tipos inmutable. Mapea nombres de variables a sus esquemas polimórficos.

```ts
export class TypeEnv
```

