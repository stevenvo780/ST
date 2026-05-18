# `reasoning/automata/pda.ts`

============================================================ ST Automata — PDA (Pushdown Automaton) ============================================================ Aceptación por estado final, con simulación no determinista. Una configuración es (state, posición de entrada, pila como string). Se exploran con BFS pero con memoización de configuraciones vistas para evitar bucles ε. Si la búsqueda explota, `maxDepth` corta. ============================================================

## Contents

- [`pdaAccepts`](#pdaaccepts) — Function
- [`pdaPalindromes`](#pdapalindromes) — Function
- [`pdaBalancedParens`](#pdabalancedparens) — Function

## `pdaAccepts`

> Function · `reasoning/automata/pda.ts:25`

¿`M` acepta `input`?
 `maxSteps` cota el número de configuraciones expandidas.

```ts
export function pdaAccepts(M: PDA, input: string, maxSteps = 100_000): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `PDA` | no |  |
| `input` | `string` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`boolean` — 


## `pdaPalindromes`

> Function · `reasoning/automata/pda.ts:82`

PDA que acepta palíndromes pares e impares sobre {a, b} usando un
 marcador no determinista (transición ε al "espejo").

```ts
export function pdaPalindromes(alphabet: ReadonlyArray<Symbol> = ['a', 'b']): PDA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `alphabet` | `ReadonlyArray<Symbol>` | yes |  |

### Returns

`PDA` — 


## `pdaBalancedParens`

> Function · `reasoning/automata/pda.ts:152`

PDA que acepta paréntesis balanceados (alfabeto '(' ')').

```ts
export function pdaBalancedParens(): PDA
```

### Returns

`PDA` — 

