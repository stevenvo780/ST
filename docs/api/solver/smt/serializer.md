# `solver/smt/serializer.ts`

============================================================ ST SMT — Serializador AST de fórmulas → SMT-LIB v2 ============================================================

## Contents

- [`defaultSortFor`](#defaultsortfor) — Function
- [`toSMTLIB`](#tosmtlib) — Function
- [`inferDeclarations`](#inferdeclarations) — Function
- [`emitDeclareConst`](#emitdeclareconst) — Function

## `defaultSortFor`

> Function · `solver/smt/serializer.ts:65`

Selecciona el sort por defecto para una constante a partir de la lógica.

```ts
export function defaultSortFor(logic: SMTLogic): SMTSort
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `logic` | `SMTLogic` | no |  |

### Returns

`SMTSort` — 


## `toSMTLIB`

> Function · `solver/smt/serializer.ts:263`

Traduce una fórmula ST a su representación SMT-LIB v2.

Por defecto devuelve sólo el cuerpo (sin set-logic ni check-sat) para que el
caller decida cómo ensamblarlo. Con `full: true` produce un script SMT-LIB
autocontenido (declaraciones de constantes + assert + check-sat).

```ts
export function toSMTLIB(formula: Formula, opts: ToSMTLIBOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `opts` | `ToSMTLIBOptions` | yes |  |

### Returns

`string` — 


## `inferDeclarations`

> Function · `solver/smt/serializer.ts:292`

Extrae las declaraciones inferidas para una fórmula. Útil para el backend.

```ts
export function inferDeclarations(formula: Formula, logic?: SMTLogic): ConstDeclaration[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `logic` | `SMTLogic` | yes |  |

### Returns

`ConstDeclaration[]` — 


## `emitDeclareConst`

> Function · `solver/smt/serializer.ts:304`

Helper público para emitir una declaración SMT-LIB.

```ts
export function emitDeclareConst(name: string, sort: SMTSort, bvWidth?: number): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `sort` | `SMTSort` | no |  |
| `bvWidth` | `number` | yes |  |

### Returns

`string` — 

