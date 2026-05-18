# `logic/profiles/modal-frame-axioms/systems.ts`

============================================================ Sistemas modales nombrados — composición de axiomas ============================================================ Mapa de etiquetas estándar a sus axiomas. Los sistemas se caracterizan por la relación de accesibilidad del frame:   K     ∅                  — sin restricción   T     reflexiva          — {T}   D     serial             — {D}   KB    simétrica          — {B}   K4    transitiva         — {4}   K5    euclidiana         — {5}   B     refl + sim         — {T, B}    (a veces "KTB")   S4    refl + trans       — {T, 4}   S5    equivalencia       — {T, 4, 5} (≡ {T, B, 4})   KD45  ser + trans + eucl — {D, 4, 5} (lógica doxástica)

## Contents

- [`systemAxioms`](#systemaxioms) — Function
- [`isSatisfiable`](#issatisfiable) — Function
- [`isValid`](#isvalid) — Function
- [`axiomFormula`](#axiomformula) — Function

## `systemAxioms`

> Function · `logic/profiles/modal-frame-axioms/systems.ts:29`

Devuelve los axiomas que caracterizan al sistema nombrado.

Para sistemas no listados (e.g. "K45", "KTB5") usar directamente
{@link tableauWithAxioms} con la combinación deseada.

```ts
export function systemAxioms(system: ModalSystem): FrameAxiom[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `system` | `ModalSystem` | no |  |

### Returns

`FrameAxiom[]` — 


## `isSatisfiable`

> Function · `logic/profiles/modal-frame-axioms/systems.ts:60`

¿`phi` es satisfacible en el sistema `system`?

Equivale a: ¿existe un modelo Kripke cuyo frame cumple los
axiomas y cuya raíz fuerza `phi`?

```ts
export function isSatisfiable(phi: ModalFormula, system: ModalSystem): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `ModalFormula` | no |  |
| `system` | `ModalSystem` | no |  |

### Returns

`boolean` — 


## `isValid`

> Function · `logic/profiles/modal-frame-axioms/systems.ts:70`

¿`phi` es válida en el sistema `system`?

Equivale a: ¬(¬phi satisfacible) — si el tableau de ¬φ cierra
en todas las ramas, φ es teorema del sistema.

```ts
export function isValid(phi: ModalFormula, system: ModalSystem): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `ModalFormula` | no |  |
| `system` | `ModalSystem` | no |  |

### Returns

`boolean` — 


## `axiomFormula`

> Function · `logic/profiles/modal-frame-axioms/systems.ts:83`

Esquema del axioma como fórmula concreta sobre un átomo dado.
Útil para verificar que cada axioma es válido en su sistema
mínimo.

```ts
export function axiomFormula(axiom: FrameAxiom, p: ModalFormula): ModalFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `axiom` | `FrameAxiom` | no |  |
| `p` | `ModalFormula` | no |  |

### Returns

`ModalFormula` — 

