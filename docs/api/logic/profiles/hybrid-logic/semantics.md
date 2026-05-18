# `logic/profiles/hybrid-logic/semantics.ts`

============================================================ ST Hybrid Logic — Semántica relacional con asignación de nominales ============================================================ `satisfies(F, w, φ, env)` decide si M, w ⊨ φ donde   M = (W, R, V, g)   — frame Kripke + asignación g de nominales,   env extiende g con los binds introducidos por ↓ y ∃. La distinción entre `nominals` (en el frame) y `env` (de evaluación) es estándar en la presentación de Blackburn et al.: los nominales libres se resuelven con la asignación global; los ligados por ↓/∃ extienden el entorno localmente. ============================================================

## Contents

- [`satisfies`](#satisfies) — Function
- [`isSatisfiableInFrame`](#issatisfiableinframe) — Function

## `satisfies`

> Function · `logic/profiles/hybrid-logic/semantics.ts:35`

Verdad relativa a un mundo.

- `atom` consulta la valuación.
- `nominal` es verdadero en w sii la asignación combinada lo manda a w.
- `box`/`diamond` cuantifican sobre R-sucesores.
- `@i φ` saltamos al mundo nombrado por i (ignora el mundo actual).
- `↓i. φ` extiende env con i := w y evalúa φ en w.
- `∃i. φ` busca algún mundo w' tal que con i := w' la fórmula
  se satisfaga en el mundo actual (¡el "punto de evaluación" no
  cambia con ∃; sólo se introduce un nombre nuevo).

```ts
export function satisfies( frame: HybridFrame, world: string, phi: HybridFormula, env: Record<string, string> =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `frame` | `HybridFrame` | no |  |
| `world` | `string` | no |  |
| `phi` | `HybridFormula` | no |  |
| `env` | `Record<string, string>` | yes |  |

### Returns

`boolean` — 


## `isSatisfiableInFrame`

> Function · `logic/profiles/hybrid-logic/semantics.ts:111`

Verdad global: ∃w ∈ W. M, w ⊨ φ.
Útil para chequear satisfacibilidad sobre un frame concreto.

```ts
export function isSatisfiableInFrame(frame: HybridFrame, phi: HybridFormula): string | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `frame` | `HybridFrame` | no |  |
| `phi` | `HybridFormula` | no |  |

### Returns

`string \| undefined` — 

