# `logic/profiles/modal-frame-axioms/types.ts`

Axiomas de frame disponibles. Cualquier subconjunto define una
lógica modal normal.

## Contents

- [`FrameAxiom`](#frameaxiom) — Type
- [`ModalSystem`](#modalsystem) — Type
- [`ModalFormula`](#modalformula) — Interface
- [`KripkeModel`](#kripkemodel) — Interface
- [`TableauResult`](#tableauresult) — Interface

## `FrameAxiom`

> Type · `logic/profiles/modal-frame-axioms/types.ts:30`

Axiomas de frame disponibles. Cualquier subconjunto define una
lógica modal normal.

```ts
export type FrameAxiom = 'T' | 'B' | '4' | '5' | 'D';
```


## `ModalSystem`

> Type · `logic/profiles/modal-frame-axioms/types.ts:37`

Sistemas modales nombrados que reconoce {@link systemAxioms}.
Cualquier otra combinación puede construirse pasando los axiomas
directamente a {@link tableauWithAxioms}.

```ts
export type ModalSystem = 'K' | 'T' | 'D' | 'B' | 'S4' | 'S5' | 'KD45' | 'KB' | 'K4' | 'K5';
```


## `ModalFormula`

> Interface · `logic/profiles/modal-frame-axioms/types.ts:52`

Fórmula modal proposicional. Estructura discriminada por `kind`.

Convenciones:
  - 'atom'     usa `name`.
  - 'not'      usa `arg`.
  - 'box'      usa `arg`  (□φ — necesidad).
  - 'diamond'  usa `arg`  (◇φ — posibilidad).
  - 'and' / 'or' / 'implies' usan `left` y `right`.

Se mantiene también `args` como alternativa lista para
compatibilidad con consumidores que prefieren n-arios.

```ts
export interface ModalFormula
```


## `KripkeModel`

> Interface · `logic/profiles/modal-frame-axioms/types.ts:70`

Modelo de Kripke devuelto cuando una fórmula es satisfacible.

  - `worlds`        : nombres simbólicos de mundos (e.g. "w0", "w1").
  - `accessibility` : aristas dirigidas `[from, to]` del frame.
  - `valuation`     : por mundo, los átomos verdaderos en ese mundo.
  - `actual`        : mundo "real" donde se evalúa la fórmula
                      (típicamente "w0").

```ts
export interface KripkeModel
```


## `TableauResult`

> Interface · `logic/profiles/modal-frame-axioms/types.ts:85`

Resultado del tableau / búsqueda de modelo.

  - `sat`    : ¿existe modelo en el frame indicado?
  - `model`  : si `sat`, modelo concreto (raíz = actual world).
  - `closed` : ¿el tableau cerró todas las ramas? (= ¬sat).
               Para una búsqueda saturada: closed ⇔ ¬sat.

```ts
export interface TableauResult
```

