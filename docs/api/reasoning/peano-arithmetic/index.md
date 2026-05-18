# `reasoning/peano-arithmetic/index.ts`

Término de la aritmética de Peano: cero, sucesor, variables, suma y multiplicación.

## Contents

- [`PeanoTerm`](#peanoterm) — Type
- [`PeanoFormula`](#peanoformula) — Type
- [`zero`](#zero) — Const
- [`succ`](#succ) — Const
- [`vt`](#vt) — Const
- [`add`](#add) — Const
- [`mul`](#mul) — Const
- [`eq`](#eq) — Const
- [`lt`](#lt) — Const
- [`le`](#le) — Const
- [`notF`](#notf) — Const
- [`andF`](#andf) — Const
- [`orF`](#orf) — Const
- [`implies`](#implies) — Const
- [`forall`](#forall) — Const
- [`exists`](#exists) — Const
- [`numeral`](#numeral) — Function
- [`AXIOM_P1`](#axiom-p1) — Const
- [`AXIOM_P2`](#axiom-p2) — Const
- [`AXIOM_P3`](#axiom-p3) — Const
- [`AXIOM_P4`](#axiom-p4) — Const
- [`AXIOM_P5`](#axiom-p5) — Const
- [`AXIOM_P6`](#axiom-p6) — Const
- [`PEANO_AXIOMS`](#peano-axioms) — Const
- [`inductionSchema`](#inductionschema) — Function
- [`evalNat`](#evalnat) — Function
- [`freeVars`](#freevars) — Function
- [`evalFormula`](#evalformula) — Function
- [`theoremAddCommutative`](#theoremaddcommutative) — Function
- [`theoremAddAssociative`](#theoremaddassociative) — Function
- [`theoremMulCommutative`](#theoremmulcommutative) — Function
- [`theoremMulDistOverAdd`](#theoremmuldistoveradd) — Function
- [`VerifyResult`](#verifyresult) — Interface
- [`verifyTheoremBySampling`](#verifytheorembysampling) — Function
- [`godelNumber`](#godelnumber) — Function
- [`fromGodel`](#fromgodel) — Function

## `PeanoTerm`

> Type · `reasoning/peano-arithmetic/index.ts:30`

Término de la aritmética de Peano: cero, sucesor, variables, suma y multiplicación.

```ts
export type PeanoTerm = | { kind: 'zero' } | { kind: 'succ'; arg: PeanoTerm } | { kind: 'var'; name: string } | { kind: 'add'; left: PeanoTerm; right: PeanoTerm } | { kind: 'mul'; left: PeanoTerm; right: PeanoTerm };
```


## `PeanoFormula`

> Type · `reasoning/peano-arithmetic/index.ts:38`

Fórmula de primer orden sobre términos de Peano: ecuaciones, desigualdades y conectivas lógicas.

```ts
export type PeanoFormula = | { kind: 'eq'; left: PeanoTerm; right: PeanoTerm } | { kind: 'lt'; left: PeanoTerm; right: PeanoTerm } | { kind: 'le'; left: PeanoTerm; right: PeanoTerm } | { kind: 'not'; arg: PeanoFormula } | { kind: 'and'; args: PeanoFormula[] } | { kind: 'or'; args: PeanoFormula[] } | { kind: 'implies'; left: PeanoFormula; right: PeanoFormula } | { kind: 'forall'; bind: string; body: PeanoFormula } | { kind: 'exists'; bind: string; body: PeanoFormula };
```


## `zero`

> Const · `reasoning/peano-arithmetic/index.ts:52`

Constante 0 de la aritmética de Peano.

```ts
const zero: PeanoTerm
```


## `succ`

> Const · `reasoning/peano-arithmetic/index.ts:54`

Constructor sucesor: `succ(t)` representa t+1.

```ts
const succ
```


## `vt`

> Const · `reasoning/peano-arithmetic/index.ts:56`

Variable de término de Peano referenciada por nombre.

```ts
const vt
```


## `add`

> Const · `reasoning/peano-arithmetic/index.ts:58`

Constructor de suma de términos de Peano.

```ts
const add
```


## `mul`

> Const · `reasoning/peano-arithmetic/index.ts:64`

Constructor de multiplicación de términos de Peano.

```ts
const mul
```


## `eq`

> Const · `reasoning/peano-arithmetic/index.ts:71`

Constructor de la fórmula de igualdad: `left = right`.

```ts
const eq
```


## `lt`

> Const · `reasoning/peano-arithmetic/index.ts:77`

Constructor de la fórmula de orden estricto: `left < right`.

```ts
const lt
```


## `le`

> Const · `reasoning/peano-arithmetic/index.ts:83`

Constructor de la fórmula de orden no estricto: `left ≤ right`.

```ts
const le
```


## `notF`

> Const · `reasoning/peano-arithmetic/index.ts:89`

Constructor de la negación de una fórmula de Peano.

```ts
const notF
```


## `andF`

> Const · `reasoning/peano-arithmetic/index.ts:91`

Constructor de conjunción (n-aria) de fórmulas de Peano.

```ts
const andF
```


## `orF`

> Const · `reasoning/peano-arithmetic/index.ts:96`

Constructor de disyunción (n-aria) de fórmulas de Peano.

```ts
const orF
```


## `implies`

> Const · `reasoning/peano-arithmetic/index.ts:98`

Constructor de implicación: `left → right`.

```ts
const implies
```


## `forall`

> Const · `reasoning/peano-arithmetic/index.ts:104`

Constructor del cuantificador universal: `∀bind. body`.

```ts
const forall
```


## `exists`

> Const · `reasoning/peano-arithmetic/index.ts:110`

Constructor del cuantificador existencial: `∃bind. body`.

```ts
const exists
```


## `numeral`

> Function · `reasoning/peano-arithmetic/index.ts:117`

```ts
export function numeral(n: number): PeanoTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`PeanoTerm` — 


## `AXIOM_P1`

> Const · `reasoning/peano-arithmetic/index.ts:132`

P1: ∀x. ¬(succ(x) = 0) — el cero no es sucesor de ningún número.

```ts
const AXIOM_P1: PeanoFormula
```


## `AXIOM_P2`

> Const · `reasoning/peano-arithmetic/index.ts:136`

P2: ∀x,y. succ(x) = succ(y) → x = y — inyectividad del sucesor.

```ts
const AXIOM_P2: PeanoFormula
```


## `AXIOM_P3`

> Const · `reasoning/peano-arithmetic/index.ts:143`

P3: ∀x. x + 0 = x — neutro derecho de la suma.

```ts
const AXIOM_P3: PeanoFormula
```


## `AXIOM_P4`

> Const · `reasoning/peano-arithmetic/index.ts:147`

P4: ∀x,y. x + succ(y) = succ(x + y) — recursión de la suma.

```ts
const AXIOM_P4: PeanoFormula
```


## `AXIOM_P5`

> Const · `reasoning/peano-arithmetic/index.ts:154`

P5: ∀x. x · 0 = 0 — absorción del cero en la multiplicación.

```ts
const AXIOM_P5: PeanoFormula
```


## `AXIOM_P6`

> Const · `reasoning/peano-arithmetic/index.ts:158`

P6: ∀x,y. x · succ(y) = (x · y) + x — recursión de la multiplicación.

```ts
const AXIOM_P6: PeanoFormula
```


## `PEANO_AXIOMS`

> Const · `reasoning/peano-arithmetic/index.ts:164`

Los seis axiomas no-inductivos de la aritmética de Peano (P1–P6).

```ts
const PEANO_AXIOMS: readonly PeanoFormula[]
```


## `inductionSchema`

> Function · `reasoning/peano-arithmetic/index.ts:188`

Genera el esquema de inducción para un predicado P: (P(0) ∧ ∀x.(P(x) → P(succ(x)))) → ∀x.P(x).

```ts
export function inductionSchema(P: (n: PeanoTerm) => PeanoFormula): PeanoFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `(n: PeanoTerm) => PeanoFormula` | no |  |

### Returns

`PeanoFormula` — 


## `evalNat`

> Function · `reasoning/peano-arithmetic/index.ts:204`

Evalúa un término de Peano en el modelo estándar ℕ con el entorno dado. Devuelve `null` si hay variables libres sin valor.

```ts
export function evalNat(term: PeanoTerm, env: Record<string, number> =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `PeanoTerm` | no |  |
| `env` | `Record<string, number>` | yes |  |

### Returns

`number \| null` — 


## `freeVars`

> Function · `reasoning/peano-arithmetic/index.ts:233`

```ts
export function freeVars(formula: PeanoFormula): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `PeanoFormula` | no |  |

### Returns

`Set<string>` — 


## `evalFormula`

> Function · `reasoning/peano-arithmetic/index.ts:291`

```ts
export function evalFormula( formula: PeanoFormula, env: Record<string, number> =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `PeanoFormula` | no |  |
| `env` | `Record<string, number>` | yes |  |
| `maxN` | `any` | yes |  |

### Returns

`boolean \| null` — 


## `theoremAddCommutative`

> Function · `reasoning/peano-arithmetic/index.ts:369`

```ts
export function theoremAddCommutative(): PeanoFormula
```

### Returns

`PeanoFormula` — 


## `theoremAddAssociative`

> Function · `reasoning/peano-arithmetic/index.ts:373`

```ts
export function theoremAddAssociative(): PeanoFormula
```

### Returns

`PeanoFormula` — 


## `theoremMulCommutative`

> Function · `reasoning/peano-arithmetic/index.ts:383`

```ts
export function theoremMulCommutative(): PeanoFormula
```

### Returns

`PeanoFormula` — 


## `theoremMulDistOverAdd`

> Function · `reasoning/peano-arithmetic/index.ts:388`

```ts
export function theoremMulDistOverAdd(): PeanoFormula
```

### Returns

`PeanoFormula` — 


## `VerifyResult`

> Interface · `reasoning/peano-arithmetic/index.ts:411`

```ts
export interface VerifyResult
```


## `verifyTheoremBySampling`

> Function · `reasoning/peano-arithmetic/index.ts:416`

```ts
export function verifyTheoremBySampling(thm: PeanoFormula, maxN = 6): VerifyResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `thm` | `PeanoFormula` | no |  |
| `maxN` | `any` | yes |  |

### Returns

`VerifyResult` — 


## `godelNumber`

> Function · `reasoning/peano-arithmetic/index.ts:612`

```ts
export function godelNumber(formula: PeanoFormula): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `PeanoFormula` | no |  |

### Returns

`bigint` — 


## `fromGodel`

> Function · `reasoning/peano-arithmetic/index.ts:690`

```ts
export function fromGodel(n: bigint): PeanoFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`PeanoFormula \| null` — 

