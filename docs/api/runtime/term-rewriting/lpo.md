# `runtime/term-rewriting/lpo.ts`

============================================================ ST Term Rewriting — Lexicographic Path Order (LPO) ============================================================ LPO es una de las técnicas estándar para probar terminación de TRSs. Dada una precedencia >F sobre símbolos de función, extiende a un orden bien-fundado >LPO sobre términos. Definición (Dershowitz, 1982):   s = f(s₁..sₙ) >LPO t  sii  alguno de:   (LPO1) algún sᵢ ≥LPO t   (LPO2) t = g(t₁..tₘ),  f >F g,  y  s >LPO tⱼ para todo j   (LPO3) t = f(t₁..tₘ),  s >LPO tⱼ para todo j, y          (s₁..sₙ) >LPO,lex (t₁..tₘ)   Variables: x >LPO t  sii  x = t y t es variable (caso trivial).   En general, una variable no domina a nada que no sea ella misma. Devolvemos -1 / 0 / 1 estilo comparator:   -1  si t1 <LPO t2    0  si t1 ≡LPO t2 (estructuralmente iguales)   +1  si t1 >LPO t2   NaN (sentinel = 0 acá) si incomparables — convención: 0 también. Para diferenciar "iguales" de "incomparables" exponemos `lpoCompare` que devuelve `'gt' | 'lt' | 'eq' | 'inc'`. `lpo` colapsa inc→0.

## Contents

- [`LPOComparison`](#lpocomparison) — Type
- [`lpoCompare`](#lpocompare) — Function
- [`lpo`](#lpo) — Function

## `LPOComparison`

> Type · `runtime/term-rewriting/lpo.ts:33`

```ts
export type LPOComparison = 'gt' | 'lt' | 'eq' | 'inc';
```


## `lpoCompare`

> Function · `runtime/term-rewriting/lpo.ts:58`

LPO comparison "rica": incluye 'inc' (incomparable).

```ts
export function lpoCompare(t1: Term, t2: Term, precedence: Map<string, number>): LPOComparison
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `Term` | no |  |
| `t2` | `Term` | no |  |
| `precedence` | `Map<string, number>` | no |  |

### Returns

`LPOComparison` — 


## `lpo`

> Function · `runtime/term-rewriting/lpo.ts:151`

API pública compacta: devuelve -1 | 0 | 1.

 -1 si t1 <LPO t2
  0 si iguales o incomparables
 +1 si t1 >LPO t2

Para distinguir incomparable vs igual, usar `lpoCompare`.

```ts
export function lpo(t1: Term, t2: Term, precedence: Map<string, number>): -1 | 0 | 1
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `Term` | no |  |
| `t2` | `Term` | no |  |
| `precedence` | `Map<string, number>` | no |  |

### Returns

`-1 \| 0 \| 1` — 

