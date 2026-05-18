# `logic/profiles/ctl/witness.ts`

============================================================ Witness paths para fórmulas CTL existenciales. ============================================================ Solo los operadores existenciales (EX, EF, EG, EU) admiten witness: para AX/AF/AG/AU el "testigo" sería el modelo entero (no hay un único camino que justifique la propiedad). Si el caller pide witness para una fórmula universal devolvemos `null`. ============================================================

## `generateWitness`

> Function · `logic/profiles/ctl/witness.ts:83`

Encuentra un camino testigo finito (`stateId[]`) que justifique
que `phi` se cumple en `state`. Devuelve `null` si:
 - `phi` no se cumple en `state`, o
 - `phi` es universal (AX/AF/AG/AU) — no admite un único witness path, o
 - `state` no existe en el modelo.

Convenciones del path devuelto:
 - EX φ        → `[state, next]` con `next ⊨ φ`.
 - EF φ        → camino más corto desde `state` hasta un estado con `φ`.
 - EG φ        → camino que entra en un ciclo de estados con `φ`;
                 el último elemento del camino aparece dos veces para
                 marcar el lazo (lasso witness).
 - E[A U B]    → camino donde todos los intermedios cumplen A y el
                 último cumple B.
 - cualquier otro operador no existencial → `null`.

```ts
export function generateWitness( M: KripkeStructure, phi: CTLFormula, state: string, ): string[] | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `KripkeStructure` | no |  |
| `phi` | `CTLFormula` | no |  |
| `state` | `string` | no |  |

### Returns

`string[] \| null` — 

