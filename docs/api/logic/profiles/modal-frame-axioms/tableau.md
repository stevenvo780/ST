# `logic/profiles/modal-frame-axioms/tableau.ts`

============================================================ Tableau extendido con axiomas de frame (T, B, 4, 5, D) ============================================================ Estrategia: enumeración acotada de modelos Kripke finitos que satisfacen las condiciones de frame impuestas por los axiomas elegidos. Toda lógica modal normal definida por un subconjunto de {T, B, 4, 5, D} tiene la propiedad del modelo finito (FMP), así que la búsqueda bounded es completa para tamaños suficientes. El nombre "tableau" se mantiene por la interfaz pública: el procedimiento es equivalente a saturar un tableau prefijado y extraer un Kripke model de la rama abierta, sólo que aquí se hace por enumeración directa de frames + valuaciones — más simple de auditar y más rápido para |sub(φ)| pequeño. Para evitar explosión combinatoria:   - El tamaño del frame se elige según |sub(φ)| y los axiomas.   - Se aplica clausura del frame antes de evaluar para     enforce de las condiciones (transitivo, simétrico, etc.).   - Las valuaciones se enumeran sólo sobre átomos que aparecen.

## Contents

- [`TableauOptions`](#tableauoptions) — Interface
- [`tableauWithAxioms`](#tableauwithaxioms) — Function

## `TableauOptions`

> Interface · `logic/profiles/modal-frame-axioms/tableau.ts:307`

```ts
export interface TableauOptions
```


## `tableauWithAxioms`

> Function · `logic/profiles/modal-frame-axioms/tableau.ts:317`

Construye un tableau extendido para `phi` bajo los axiomas
de frame `axioms`. Devuelve `sat` con un modelo si existe; en
caso contrario `closed=true`.

```ts
export function tableauWithAxioms( phi: ModalFormula, axioms: FrameAxiom[], options: TableauOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `ModalFormula` | no |  |
| `axioms` | `FrameAxiom[]` | no |  |
| `options` | `TableauOptions` | yes |  |

### Returns

`TableauResult` — 

