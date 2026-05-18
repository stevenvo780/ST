# `reasoning/belief-revision/parser.ts`

============================================================ ST Belief Revision — Parser propositional minimalista ============================================================ Gramática (precedencia menor a mayor):   biconditional : implication ('<->' implication)*   implication   : disjunction ('->' implication)?       (asoc. derecha)   disjunction   : conjunction ('|' conjunction)*   conjunction   : negation    ('&' negation)*   negation      : '!' negation | primary   primary       : atom | 'true' | 'false' | '(' biconditional ')' Aliases tolerados:   ¬ ~ !            → not   ∧ /\ &           → and   ∨ \/ |           → or   → => ->          → implies   ↔ <-> <=>        → iff   ⊤ T              → true (cuando aparece como token único o palabra)   ⊥ F              → false

## Contents

- [`parsePropFormula`](#parsepropformula) — Function
- [`collectAtoms`](#collectatoms) — Function
- [`formulaToString`](#formulatostring) — Function

## `parsePropFormula`

> Function · `reasoning/belief-revision/parser.ts:156`

Parsea una fórmula propositional a su AST interno.
Lanza Error con mensaje legible si el input no es válido.

```ts
export function parsePropFormula(input: string): PropFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`PropFormula` — 


## `collectAtoms`

> Function · `reasoning/belief-revision/parser.ts:169`

Recolecta los nombres de átomos que aparecen en una fórmula.

```ts
export function collectAtoms(f: PropFormula, into: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `PropFormula` | no |  |
| `into` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `formulaToString`

> Function · `reasoning/belief-revision/parser.ts:194`

Serializa una fórmula a su forma canónica (con paréntesis explícitos).
Útil para hashing y comparaciones estructurales.

```ts
export function formulaToString(f: PropFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `PropFormula` | no |  |

### Returns

`string` — 

