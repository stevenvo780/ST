# `reasoning/lemma-synthesis/index.ts`

============================================================ ST Lemma synthesis — Theory exploration tipo QuickSpec ============================================================ Dada una signatura (sorts, constantes, funciones, predicados) y un evaluador semántico, sintetizamos conjeturas/lemmas automáticamente:   1. Enumeramos términos hasta cierta profundidad por sort.   2. Para cada par de términos de igual sort generamos una      conjetura `t1 = t2`.   3. Evaluamos sobre N valuaciones aleatorias. Si todas pasan,      la conjetura sobrevive (confidence ≈ 1 − falsificability).   4. Pruning: eliminamos trivialidades (t = t), conmutativas      duplicadas (t1 = t2 vs t2 = t1) y consecuencias triviales      (renombrado de variables, substitución de instancias).   5. Verificación opcional via prover externo. Esta es la idea original de QuickSpec / Hipster aplicada a términos cualesquiera, sin asumir un dominio fijo. El usuario provee el evaluador. ============================================================ ── Signatura y términos ────────────────────────────────────

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

> Interface · `reasoning/lemma-synthesis/index.ts:25`

```ts
export interface Signature
```


## `Term`

> Type · `reasoning/lemma-synthesis/index.ts:36`

Término interno. Lo mantenemos discriminado para podarlo
y serializarlo sin ambigüedad.

```ts
export type Term = | { kind: 'var'; name: string; sort: string } | { kind: 'const'; name: string; sort: string } | { kind: 'app'; name: string; args: Term[]; sort: string };
```


## `Conjecture`

> Interface · `reasoning/lemma-synthesis/index.ts:41`

```ts
export interface Conjecture
```


## `SynthesisOptions`

> Interface · `reasoning/lemma-synthesis/index.ts:49`

```ts
export interface SynthesisOptions
```


## `termToString`

> Function · `reasoning/lemma-synthesis/index.ts:63`

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

> Function · `reasoning/lemma-synthesis/index.ts:103`

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

> Function · `reasoning/lemma-synthesis/index.ts:143`

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

> Type · `reasoning/lemma-synthesis/index.ts:236`

```ts
export type Evaluator = (term: Term, env: Record<string, unknown>) => unknown;
```


## `synthesizeEqualities`

> Function · `reasoning/lemma-synthesis/index.ts:261`

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

> Function · `reasoning/lemma-synthesis/index.ts:395`

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

> Type · `reasoning/lemma-synthesis/index.ts:532`

```ts
export type Prover = (conjecture: Conjecture) => { proven: boolean; counter?: unknown };
```


## `VerifiedConjecture`

> Interface · `reasoning/lemma-synthesis/index.ts:534`

```ts
export interface VerifiedConjecture extends Conjecture
```


## `verifyConjectures`

> Function · `reasoning/lemma-synthesis/index.ts:539`

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

> Function · `reasoning/lemma-synthesis/index.ts:555`

```ts
export function naturalNumbersSignature(): Signature
```

### Returns

`Signature` — 


## `booleansSignature`

> Function · `reasoning/lemma-synthesis/index.ts:568`

```ts
export function booleansSignature(): Signature
```

### Returns

`Signature` — 


## `listsSignature`

> Function · `reasoning/lemma-synthesis/index.ts:584`

```ts
export function listsSignature(): Signature
```

### Returns

`Signature` — 


## `naturalsEvaluator`

> Const · `reasoning/lemma-synthesis/index.ts:603`

```ts
const naturalsEvaluator: Evaluator
```


## `booleansEvaluator`

> Const · `reasoning/lemma-synthesis/index.ts:624`

```ts
const booleansEvaluator: Evaluator
```


## `listsEvaluator`

> Const · `reasoning/lemma-synthesis/index.ts:645`

```ts
const listsEvaluator: Evaluator
```


## `__internals`

> Const · `reasoning/lemma-synthesis/index.ts:679`

```ts
const __internals
```

