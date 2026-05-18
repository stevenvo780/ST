# `runtime/term-rewriting/knuth-bendix.ts`

============================================================ ST Term Rewriting — Knuth-Bendix Completion ============================================================ KB completion transforma un conjunto de ecuaciones E en un TRS terminante y confluente (cuando existe). Procedimiento clásico:   1. Orientar cada ecuación s = t en regla l → r usando una      reducción ordering > (LPO acá).   2. Inter-reducir las reglas (simplify) para mantener minimalidad.   3. Calcular critical pairs.   4. Por cada CP (a, b):        a' = normalize(a)        b' = normalize(b)        si a' ≡ b' → joinable, descartar.        si no → agregar como nueva regla orientada.   5. Volver al paso 2 hasta que no haya nuevos CPs ⇒ completed. KB es **semi-decidible**: puede no terminar (orientar nuevas ecuaciones puede no ser posible, o el espacio crecer sin cota). Por eso exigimos `maxSteps`. Implementación: estrategia simple "outer loop", no la versión optimizada de Huet con prioridades. Suficiente para teorías pequeñas de testing (grupos, conmutatividad-a-medias, etc.).

## Contents

- [`orient`](#orient) — Function
- [`knuthBendixCompletion`](#knuthbendixcompletion) — Function
- [`makeTRS`](#maketrs) — Function

## `orient`

> Function · `runtime/term-rewriting/knuth-bendix.ts:42`

Orienta una ecuación s = t a regla l → r usando LPO.

- Si s >LPO t: devuelve s → t.
- Si t >LPO s: devuelve t → s.
- Si son incomparables: null (KB falla aquí, el caller debe abortar
  o pedir al user una precedencia distinta).
- Si son iguales: ecuación trivial, devuelve null sin error.

```ts
export function orient(s: Term, t: Term, precedence: Map<string, number>): RewriteRule | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Term` | no |  |
| `t` | `Term` | no |  |
| `precedence` | `Map<string, number>` | no |  |

### Returns

`RewriteRule \| null` — 


## `knuthBendixCompletion`

> Function · `runtime/term-rewriting/knuth-bendix.ts:118`

Knuth-Bendix completion.

`initialRules` se interpretan como ecuaciones orientadas. La
orientación inicial se respeta si ya está bien dirigida según
la precedencia; si no, se re-orienta.

Devuelve un `KBResult` con:
  - `completed: true` si convergió.
  - `completed: false` si se excedió `maxSteps` o un CP no-joinable
    no pudo orientarse (LPO incomparable).

```ts
export function knuthBendixCompletion(initialRules: RewriteRule[], opts: KBOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `initialRules` | `RewriteRule[]` | no |  |
| `opts` | `KBOptions` | yes |  |

### Returns

`KBResult` — 


## `makeTRS`

> Function · `runtime/term-rewriting/knuth-bendix.ts:195`

Sugar: construye un TRS plano.

```ts
export function makeTRS(rules: RewriteRule[]): TRS
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rules` | `RewriteRule[]` | no |  |

### Returns

`TRS` — 

