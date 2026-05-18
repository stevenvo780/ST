# `reasoning/automata/nfa.ts`

============================================================ ST Automata — NFA + subset construction ============================================================   · epsilonClosure(M, S)   — cierre-ε de un set de estados.   · nfaAccepts(M, w)       — simulación BFS sobre el frontier.   · nfaToDfa(M)            — subset construction. ============================================================

## Contents

- [`epsilonClosure`](#epsilonclosure) — Function
- [`nfaAccepts`](#nfaaccepts) — Function
- [`nfaToDfa`](#nfatodfa) — Function

## `epsilonClosure`

> Function · `reasoning/automata/nfa.ts:16`

Cierre-ε: el menor conjunto T ⊇ S cerrado bajo transiciones ε.

```ts
export function epsilonClosure(M: NFA, states: ReadonlySet<string>): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `NFA` | no |  |
| `states` | `ReadonlySet<string>` | no |  |

### Returns

`Set<string>` — 


## `nfaAccepts`

> Function · `reasoning/automata/nfa.ts:51`

```ts
export function nfaAccepts(M: NFA, input: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `NFA` | no |  |
| `input` | `string` | no |  |

### Returns

`boolean` — 


## `nfaToDfa`

> Function · `reasoning/automata/nfa.ts:63`

Subset construction: cada estado del DFA = subconjunto cerrado por ε
 de estados del NFA. Sólo se generan estados alcanzables.

```ts
export function nfaToDfa(M: NFA): DFA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `NFA` | no |  |

### Returns

`DFA` — 

