# `runtime/term-rewriting/critical-pairs.ts`

============================================================ ST Term Rewriting — Critical pairs ============================================================ Un critical pair (CP) entre dos reglas l₁ → r₁ y l₂ → r₂ surge cuando un subtérmino no-variable de l₁ unifica con l₂. Esto representa dos formas distintas de reducir el mismo término, y si ambas convergen a la misma forma normal, las reglas son "join-able" en ese punto. Algoritmo (Knuth-Bendix Critical Pair Lemma):   Para cada posición p no-variable de l₁:     subterm = l₁ |_p     si unify(subterm, l₂) = σ existe:       cp₁ = σ(r₁)       cp₂ = σ(l₁[p ← r₂])       => (cp₁, cp₂) es un critical pair. El sistema es **localmente confluente** sii todos sus CPs son joinables (Newman's Lemma + decidible para sistemas terminantes).

## Contents

- [`CriticalPair`](#criticalpair) — Interface
- [`criticalPairsBetween`](#criticalpairsbetween) — Function
- [`allCriticalPairs`](#allcriticalpairs) — Function
- [`isConfluent`](#isconfluent) — Function
- [`freeVarsOf`](#freevarsof) — Function

## `CriticalPair`

> Interface · `runtime/term-rewriting/critical-pairs.ts:26`

```ts
export interface CriticalPair
```


## `criticalPairsBetween`

> Function · `runtime/term-rewriting/critical-pairs.ts:40`

Calcula todos los critical pairs entre dos reglas.

Las variables se renombran para evitar colisiones espurias
(la regla "outer" recibe sufijo `_o`, la inner sufijo `_i`).

```ts
export function criticalPairsBetween( outer: RewriteRule, inner: RewriteRule, outerIdx: number, innerIdx: number, ): CriticalPair[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `outer` | `RewriteRule` | no |  |
| `inner` | `RewriteRule` | no |  |
| `outerIdx` | `number` | no |  |
| `innerIdx` | `number` | no |  |

### Returns

`CriticalPair[]` — 


## `allCriticalPairs`

> Function · `runtime/term-rewriting/critical-pairs.ts:84`

Critical pairs de un TRS completo: para cada par de reglas
(incluyendo (i, i) con i = i), calcula sus CPs.

```ts
export function allCriticalPairs(rules: RewriteRule[]): CriticalPair[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rules` | `RewriteRule[]` | no |  |

### Returns

`CriticalPair[]` — 


## `isConfluent`

> Function · `runtime/term-rewriting/critical-pairs.ts:105`

Confluencia local: todos los CPs son joinables.

Un CP (a, b) es joinable si normalize(a) = normalize(b).

Por Newman's Lemma: terminating + locally confluent ⇒ confluent.
No verificamos terminación acá (eso requiere LPO/KBO/etc.).

```ts
export function isConfluent(trs:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `trs` | `{ rules: RewriteRule[] }` | no |  |

### Returns

`boolean` — 


## `freeVarsOf`

> Function · `runtime/term-rewriting/critical-pairs.ts:120`

Helper: ¿la variable v aparece libre en t?

Re-export para facilidad de imports.

```ts
export function freeVarsOf(t: Term): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`Set<string>` — 

