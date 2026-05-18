# `reasoning/lemma-synthesis/index.ts`

Algebraic signature for lemma synthesis: declares sorts, constants,
functions (with argument and result sorts) and predicates.
The synthesizer enumerates terms and conjectures equalities based on this.

## Contents

- [`Signature`](#signature) — Interface
- [`Term`](#term) — Type
- [`Conjecture`](#conjecture) — Interface
- [`SynthesisOptions`](#synthesisoptions) — Interface
- [`termToString`](#termtostring) — Function
- [`freeVars`](#freevars) — Function
- [`enumerateTerms`](#enumerateterms) — Function
- [`Evaluator`](#evaluator) — Type
- [`synthesizeEqualities`](#synthesizeequalities) — Function
- [`pruneConsequences`](#pruneconsequences) — Function
- [`Prover`](#prover) — Type
- [`VerifiedConjecture`](#verifiedconjecture) — Interface
- [`verifyConjectures`](#verifyconjectures) — Function
- [`naturalNumbersSignature`](#naturalnumberssignature) — Function
- [`booleansSignature`](#booleanssignature) — Function
- [`listsSignature`](#listssignature) — Function
- [`naturalsEvaluator`](#naturalsevaluator) — Const
- [`booleansEvaluator`](#booleansevaluator) — Const
- [`listsEvaluator`](#listsevaluator) — Const
- [`__internals`](#internals) — Const

## `Signature`

> Interface · `reasoning/lemma-synthesis/index.ts:30`

Algebraic signature for lemma synthesis: declares sorts, constants,
functions (with argument and result sorts) and predicates.
The synthesizer enumerates terms and conjectures equalities based on this.

```ts
export interface Signature
```


## `Term`

> Type · `reasoning/lemma-synthesis/index.ts:41`

Término interno. Lo mantenemos discriminado para podarlo
y serializarlo sin ambigüedad.

```ts
export type Term = | { kind: 'var'; name: string; sort: string } | { kind: 'const'; name: string; sort: string } | { kind: 'app'; name: string; args: Term[]; sort: string };
```


## `Conjecture`

> Interface · `reasoning/lemma-synthesis/index.ts:50`

A synthesized equality conjecture `∀vars. termLeft = termRight`.
`confidence = 1` means all random tests passed; smaller values indicate partial evidence.

```ts
export interface Conjecture
```


## `SynthesisOptions`

> Interface · `reasoning/lemma-synthesis/index.ts:59`

Options controlling synthesis depth, test count, and randomness.

```ts
export interface SynthesisOptions
```


## `termToString`

> Function · `reasoning/lemma-synthesis/index.ts:77`

Serializes a term to a human-readable string, using infix notation for binary operators.

```ts
export function termToString(t: Term): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`string` — 


## `freeVars`

> Function · `reasoning/lemma-synthesis/index.ts:117`

Lista las variables que aparecen en un término, en orden de primera aparición

```ts
export function freeVars(t: Term): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`Array<{ name: string; sort: string }>` — 


## `enumerateTerms`

> Function · `reasoning/lemma-synthesis/index.ts:157`

Enumera todos los términos cerrados (sobre constantes + variables
declaradas) del sort dado, hasta `depth`. Profundidad 0 = solo
variables y constantes; cada nivel agrega aplicaciones cuyos
argumentos provienen de niveles inferiores.

```ts
export function enumerateTerms( sig: Signature, sort: string, depth: number, variables: Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sig` | `Signature` | no |  |
| `sort` | `string` | no |  |
| `depth` | `number` | no |  |
| `variables` | `Array<{ name: string; sort: string }>` | yes |  |

### Returns

`Term[]` — 


## `Evaluator`

> Type · `reasoning/lemma-synthesis/index.ts:255`

Evaluates a term under a variable environment.
Should throw when the term is ill-typed or outside the evaluator's domain;
the synthesizer will skip conjectures whose terms cannot be evaluated.

```ts
export type Evaluator = (term: Term, env: Record<string, unknown>) => unknown;
```


## `synthesizeEqualities`

> Function · `reasoning/lemma-synthesis/index.ts:280`

Sintetiza conjeturas de igualdad: para cada par de términos del
mismo sort, las evalúa sobre `numTests` valuaciones aleatorias.
Sobreviven las que pasan todas las pruebas.

```ts
export function synthesizeEqualities( sig: Signature, evaluator: Evaluator, opts: SynthesisOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sig` | `Signature` | no |  |
| `evaluator` | `Evaluator` | no |  |
| `opts` | `SynthesisOptions` | yes |  |

### Returns

`Conjecture[]` — 


## `pruneConsequences`

> Function · `reasoning/lemma-synthesis/index.ts:414`

Descarta conjeturas redundantes:
  • Reflexivas (t = t).
  • Simétricas duplicadas (t1 = t2 vs t2 = t1).
  • Instancias de otras conjeturas más generales (un lemma
    ya hallado subsume a uno con más estructura específica).

```ts
export function pruneConsequences(conjectures: Conjecture[]): Conjecture[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `conjectures` | `Conjecture[]` | no |  |

### Returns

`Conjecture[]` — 


## `Prover`

> Type · `reasoning/lemma-synthesis/index.ts:556`

An optional external prover that attempts to prove or disprove a conjecture.
Returns `{ proven: true }` on success, `{ proven: false, counter }` on refutation,
or `{ proven: false }` when the result is unknown.

```ts
export type Prover = (conjecture: Conjecture) => { proven: boolean; counter?: unknown };
```


## `VerifiedConjecture`

> Interface · `reasoning/lemma-synthesis/index.ts:559`

A conjecture annotated with its verification status after calling a {@link Prover}.

```ts
export interface VerifiedConjecture extends Conjecture
```


## `verifyConjectures`

> Function · `reasoning/lemma-synthesis/index.ts:569`

Runs each conjecture through `prover`, annotating it with
`'verified'`, `'counter'` (with a counterexample), or `'unknown'`.
Prover exceptions are silently caught and treated as `'unknown'`.

```ts
export function verifyConjectures(conjectures: Conjecture[], prover: Prover): VerifiedConjecture[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `conjectures` | `Conjecture[]` | no |  |
| `prover` | `Prover` | no |  |

### Returns

`VerifiedConjecture[]` — 


## `naturalNumbersSignature`

> Function · `reasoning/lemma-synthesis/index.ts:586`

Returns a {@link Signature} for the natural numbers (0, S, +, *).

```ts
export function naturalNumbersSignature(): Signature
```

### Returns

`Signature` — 


## `booleansSignature`

> Function · `reasoning/lemma-synthesis/index.ts:600`

Returns a {@link Signature} for booleans (T, F, ¬, ∧, ∨).

```ts
export function booleansSignature(): Signature
```

### Returns

`Signature` — 


## `listsSignature`

> Function · `reasoning/lemma-synthesis/index.ts:617`

Returns a {@link Signature} for lists over Nat (nil, cons, ++, length).

```ts
export function listsSignature(): Signature
```

### Returns

`Signature` — 


## `naturalsEvaluator`

> Const · `reasoning/lemma-synthesis/index.ts:637`

Sample {@link Evaluator} for the natural numbers signature.

```ts
const naturalsEvaluator: Evaluator
```


## `booleansEvaluator`

> Const · `reasoning/lemma-synthesis/index.ts:659`

Sample {@link Evaluator} for the booleans signature.

```ts
const booleansEvaluator: Evaluator
```


## `listsEvaluator`

> Const · `reasoning/lemma-synthesis/index.ts:681`

Sample {@link Evaluator} for the lists-over-Nat signature.

```ts
const listsEvaluator: Evaluator
```


## `__internals`

> Const · `reasoning/lemma-synthesis/index.ts:715`

```ts
const __internals
```

