# `reasoning/tactic-dsl/combinators.ts`

============================================================ Tactic DSL — combinators ============================================================ seq / orElse / repeat_ / tryAlt: combinadores estándar al estilo Coq/Ltac. Operan sobre Tactic = (state) => state, lanzando TacticError para señalizar falla. Nota sobre el nombre `seq`: la API conceptual de Lean/Coq usa el nombre `then` o `;`. NO podemos exportar un símbolo top-level llamado `then` desde un módulo ESM porque el bundler de vitest trata al namespace del módulo como un thenable y cuelga el import. Por compatibilidad con la documentación del DSL, el index re-expone `seq` también bajo el alias `then` vía objeto namespace (ver `tactics` exportado desde index.ts).

## Contents

- [`seq`](#seq) — Function
- [`orElse`](#orelse) — Function
- [`repeat_`](#repeat) — Function
- [`tryAlt`](#tryalt) — Function

## `seq`

> Function · `reasoning/tactic-dsl/combinators.ts:24`

```ts
export function seq(...tactics: Tactic[]): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `tactics` | `Tactic[]` | no |  |

### Returns

`Tactic` — 


## `orElse`

> Function · `reasoning/tactic-dsl/combinators.ts:38`

```ts
export function orElse(...tactics: Tactic[]): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `tactics` | `Tactic[]` | no |  |

### Returns

`Tactic` — 


## `repeat_`

> Function · `reasoning/tactic-dsl/combinators.ts:64`

```ts
export function repeat_(t: Tactic, max = 100): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Tactic` | no |  |
| `max` | `any` | yes |  |

### Returns

`Tactic` — 


## `tryAlt`

> Function · `reasoning/tactic-dsl/combinators.ts:91`

```ts
export function tryAlt(t: Tactic): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Tactic` | no |  |

### Returns

`Tactic` — 

