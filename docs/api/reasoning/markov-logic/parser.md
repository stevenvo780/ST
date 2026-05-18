# `reasoning/markov-logic/parser.ts`

============================================================ Markov Logic — Mini parser FOL (sin cuantificadores explícitos) ============================================================ Gramática soportada (las variables libres se cuantifican universalmente al groundear):   formula  := implication   implication := disjunction ('→' | '->' disjunction)*   (right-assoc)   disjunction := conjunction ('∨' | '|' | '||' conjunction)*   conjunction := unary ('∧' | '&' | '&&' unary)*   unary       := ('¬' | '!') unary | atom   atom        := '(' formula ')' | predicate   predicate   := Ident '(' arg (',' arg)* ')'   arg         := Ident Convención de variables/constantes:   - identificadores en minúscula → variables (lower-cased first char)   - identificadores en mayúscula → constantes Esta gramática alcanza para Smoking, Friends, transitividad, etc. No soporta cuantificadores explícitos `∀ ∃`; la cuantificación es implícitamente universal sobre todas las variables libres.

## Contents

- [`FOLNode`](#folnode) — Type
- [`parseFOL`](#parsefol) — Function
- [`freeVariables`](#freevariables) — Function
- [`isVariable`](#isvariable) — Function

## `FOLNode`

> Type · `reasoning/markov-logic/parser.ts:25`

```ts
export type FOLNode = | { kind: 'atom'; predicate: string; args: string[] } | { kind: 'not'; arg: FOLNode } | { kind: 'and'; left: FOLNode; right: FOLNode } | { kind: 'or'; left: FOLNode; right: FOLNode } | { kind: 'implies'; left: FOLNode; right: FOLNode };
```


## `parseFOL`

> Function · `reasoning/markov-logic/parser.ts:32`

```ts
export function parseFOL(input: string): FOLNode
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`FOLNode` — 


## `freeVariables`

> Function · `reasoning/markov-logic/parser.ts:41`

Devuelve las variables libres (lowercase) que aparecen en `node`.

```ts
export function freeVariables(node: FOLNode): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `node` | `FOLNode` | no |  |

### Returns

`string[]` — 


## `isVariable`

> Function · `reasoning/markov-logic/parser.ts:64`

```ts
export function isVariable(name: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`boolean` — 

