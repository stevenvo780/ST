# `reasoning/group-presentation/todd-coxeter.ts`

============================================================ Todd-Coxeter coset enumeration. ============================================================ Enumera las clases laterales (cosets) de un subgrupo H ≤ G en un grupo finitamente presentado G = ⟨S | R⟩. Si H es trivial, enumera el grupo entero (los cosets son los elementos de G). Idea: representamos los cosets como enteros 1, 2, 3, ... El coset 1 es el subgrupo H. Mantenemos una tabla `τ(c, x) = c'` que significa "el coset `c` multiplicado por la letra `x` es el coset `c'`". A medida que aplicamos las relaciones de R en cada coset y los generadores subgrupales en el coset 1, descubrimos igualdades (coset c ≡ coset c') que se procesan por union-find (coincidence handling). Implementación: HLT (Haselgrove–Leech–Trotter) básico. Para los tamaños de tests que necesitamos (Z/n, D_n, S_3) basta de sobra y termina rápido. `maxCosets` actúa de poda: el algoritmo es indecidible en general (problema de la palabra), así que si se alcanza el límite devolvemos 'incomplete'. Referencias: Holt–Eick–O'Brien, "Handbook of Computational Group Theory", cap. 5 — versión escolar. ============================================================

## Contents

- [`CosetTable`](#cosettable) — Interface
- [`toddCoxeter`](#toddcoxeter) — Function
- [`groupOrder`](#grouporder) — Function
- [`isInSubgroup`](#isinsubgroup) — Function

## `CosetTable`

> Interface · `reasoning/group-presentation/todd-coxeter.ts:30`

```ts
export interface CosetTable
```


## `toddCoxeter`

> Function · `reasoning/group-presentation/todd-coxeter.ts:245`

```ts
export function toddCoxeter( presentation: GroupPresentation, subgroupGens: Word[] = [], maxCosets = 4096, ): CosetTable | 'incomplete'
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `presentation` | `GroupPresentation` | no |  |
| `subgroupGens` | `Word[]` | yes |  |
| `maxCosets` | `any` | yes |  |

### Returns

`CosetTable \| 'incomplete'` — 


## `groupOrder`

> Function · `reasoning/group-presentation/todd-coxeter.ts:344`

```ts
export function groupOrder( presentation: GroupPresentation, maxCosets = 4096, ): number | 'infinite' | 'unknown'
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `presentation` | `GroupPresentation` | no |  |
| `maxCosets` | `any` | yes |  |

### Returns

`number \| 'infinite' \| 'unknown'` — 


## `isInSubgroup`

> Function · `reasoning/group-presentation/todd-coxeter.ts:365`

```ts
export function isInSubgroup(word: Word, table: CosetTable): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `word` | `Word` | no |  |
| `table` | `CosetTable` | no |  |

### Returns

`boolean` — 

