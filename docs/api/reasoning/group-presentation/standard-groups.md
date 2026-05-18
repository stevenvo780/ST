# `reasoning/group-presentation/standard-groups.ts`

============================================================ Presentaciones canónicas de familias clásicas de grupos. ============================================================ • Z_n  = ⟨a | a^n⟩ • D_n  = ⟨r, s | r^n, s², (rs)²⟩    (dihedral de orden 2n) • F_n  grupo libre de rango n (sin relaciones) • S_n  presentación de Coxeter:     generadores t_1,...,t_{n-1} (transposiciones adyacentes)     relaciones t_i² = 1, (t_i t_{i+1})³ = 1, (t_i t_j)² = 1 si |i-j|≥2.   En nuestro alfabeto las letras se mapean a 'a', 'b', 'c', ...   con su inverso en mayúscula (aunque por ser involuciones cada   inverso coincide consigo mismo módulo la relación t² = 1). ============================================================

## Contents

- [`cyclicGroupZn`](#cyclicgroupzn) — Function
- [`dihedralGroupDn`](#dihedralgroupdn) — Function
- [`freeGroupFn`](#freegroupfn) — Function
- [`symmetricGroupSn`](#symmetricgroupsn) — Function

## `cyclicGroupZn`

> Function · `reasoning/group-presentation/standard-groups.ts:25`

```ts
export function cyclicGroupZn(n: number): GroupPresentation
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`GroupPresentation` — 


## `dihedralGroupDn`

> Function · `reasoning/group-presentation/standard-groups.ts:33`

```ts
export function dihedralGroupDn(n: number): GroupPresentation
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`GroupPresentation` — 


## `freeGroupFn`

> Function · `reasoning/group-presentation/standard-groups.ts:47`

```ts
export function freeGroupFn(n: number): GroupPresentation
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`GroupPresentation` — 


## `symmetricGroupSn`

> Function · `reasoning/group-presentation/standard-groups.ts:59`

```ts
export function symmetricGroupSn(n: number): GroupPresentation
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`GroupPresentation` — 

