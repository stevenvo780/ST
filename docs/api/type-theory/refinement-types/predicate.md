# `type-theory/refinement-types/predicate.ts`

============================================================ Refinement types — Parser y evaluador de predicados ============================================================ Los predicados se escriben como cadenas: "x > 0 && x < 100". Aquí va un parser recursivo-descendente minimalista y un evaluador sobre un entorno de variables. La gramática soportada:   expr   := or   or     := and ('||' and)*   and    := cmp ('&&' cmp)*   cmp    := add (op add)?      op ∈ { <, <=, >, >=, ==, != }   add    := mul (('+'|'-') mul)*   mul    := unary (('*'|'/') unary)*   unary  := '!' unary | '-' unary | atom   atom   := number | bool | ident | '(' expr ')' El módulo no pretende cubrir aritmética completa: alcanza para los predicados típicos de un sistema didáctico (rangos, igualdades).

## Contents

- [`PExpr`](#pexpr) — Type
- [`parsePredicate`](#parsepredicate) — Function
- [`freeVars`](#freevars) — Function
- [`substVar`](#substvar) — Function
- [`renameVar`](#renamevar) — Function
- [`predicateToString`](#predicatetostring) — Function
- [`PValue`](#pvalue) — Type
- [`PEnv`](#penv) — Type
- [`evalPredicate`](#evalpredicate) — Function

## `PExpr`

> Type · `type-theory/refinement-types/predicate.ts:21`

```ts
export type PExpr = | { kind: 'num'; value: number } | { kind: 'bool'; value: boolean } | { kind: 'str'; value: string } | { kind: 'var'; name: string } | { kind: 'unop'; op: '!' | '-'; arg: PExpr } | { kind: 'binop'; op: '+' | '-' | '*' | '/' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||'; left: PExpr; right: PExpr; };
```


## `parsePredicate`

> Function · `type-theory/refinement-types/predicate.ts:244`

```ts
export function parsePredicate(src: string): PExpr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `src` | `string` | no |  |

### Returns

`PExpr` — 


## `freeVars`

> Function · `type-theory/refinement-types/predicate.ts:257`

```ts
export function freeVars(e: PExpr, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `e` | `PExpr` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `substVar`

> Function · `type-theory/refinement-types/predicate.ts:277`

```ts
export function substVar(e: PExpr, name: string, replacement: PExpr): PExpr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `e` | `PExpr` | no |  |
| `name` | `string` | no |  |
| `replacement` | `PExpr` | no |  |

### Returns

`PExpr` — 


## `renameVar`

> Function · `type-theory/refinement-types/predicate.ts:297`

```ts
export function renameVar(predicate: string, fromName: string, toName: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `predicate` | `string` | no |  |
| `fromName` | `string` | no |  |
| `toName` | `string` | no |  |

### Returns

`string` — 


## `predicateToString`

> Function · `type-theory/refinement-types/predicate.ts:306`

```ts
export function predicateToString(e: PExpr): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `e` | `PExpr` | no |  |

### Returns

`string` — 


## `PValue`

> Type · `type-theory/refinement-types/predicate.ts:325`

```ts
export type PValue = number | boolean | string;
```


## `PEnv`

> Type · `type-theory/refinement-types/predicate.ts:326`

```ts
export type PEnv = Record<string, PValue>;
```


## `evalPredicate`

> Function · `type-theory/refinement-types/predicate.ts:328`

```ts
export function evalPredicate(e: PExpr, env: PEnv): PValue
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `e` | `PExpr` | no |  |
| `env` | `PEnv` | no |  |

### Returns

`PValue` — 

