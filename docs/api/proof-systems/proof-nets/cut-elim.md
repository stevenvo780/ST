# `proof-systems/proof-nets/cut-elim.ts`

============================================================ Proof Nets — Eliminación de cortes ============================================================ Para MLL la cut-elimination es local y confluente. Dos pasos fundamentales:   (axiom-cut)   axiom(a, a') + cut(a', b)                 ─────────────────────────                 las apariciones de a' se "atajan" hacia b:                 los links que tocaban a' tocan ahora a, y                 axiom + cut desaparecen.   (mult-cut)    tensor(l₁,r₁,c₁=A⊗B) + par(l₂,r₂,c₂=A⊥⅋B⊥) + cut(c₁,c₂)                 ──────────────────────────────────────────────────────                 dos cortes más pequeños: cut(l₁,l₂) y cut(r₁,r₂),                 desaparecen los links ⊗, ⅋ y el cut original.                 Los nodos c₁ y c₂ desaparecen. `reduceCut` aplica un paso (si existe alguno). `normalizeCuts` itera hasta normal form (sin cortes). Para MLL la terminación es trivial: cada paso reduce el número de conectivos en el borde del cut.

## Contents

- [`reduceCutStep`](#reducecutstep) — Function
- [`reduceCut`](#reducecut) — Function
- [`isCutFree`](#iscutfree) — Function
- [`normalizeCuts`](#normalizecuts) — Function

## `reduceCutStep`

> Function · `proof-systems/proof-nets/cut-elim.ts:64`

```ts
export function reduceCutStep(net: ProofNet):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `ProofNet` | no |  |

### Returns

`{ net: ProofNet; reduced: boolean }` — 


## `reduceCut`

> Function · `proof-systems/proof-nets/cut-elim.ts:147`

```ts
export function reduceCut(net: ProofNet): ProofNet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `ProofNet` | no |  |

### Returns

`ProofNet` — 


## `isCutFree`

> Function · `proof-systems/proof-nets/cut-elim.ts:151`

```ts
export function isCutFree(net: ProofNet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `ProofNet` | no |  |

### Returns

`boolean` — 


## `normalizeCuts`

> Function · `proof-systems/proof-nets/cut-elim.ts:155`

```ts
export function normalizeCuts(net: ProofNet, maxSteps = 1000): ProofNet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `ProofNet` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`ProofNet` — 

