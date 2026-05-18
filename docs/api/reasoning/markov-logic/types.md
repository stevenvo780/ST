# `reasoning/markov-logic/types.ts`

Fórmula de la teoría MLN.

`formula` es una cadena FOL con literales `Pred(args)` y
conectores `∧`, `∨`, `→`, `¬` (o sus variantes ASCII `&`, `|`, `->`,
`!`). Las variables se infieren por convención: identificadores que
empiezan en minúscula son variables; los que empiezan en mayúscula
son constantes (cerradas).

`weight` es un peso real. `Infinity` significa hard constraint: la
fórmula DEBE satisfacerse en todo mundo con probabilidad no nula.

## Contents

- [`MLNFormula`](#mlnformula) — Interface
- [`MLNTheory`](#mlntheory) — Interface
- [`MLNWorld`](#mlnworld) — Interface
- [`GroundedFormula`](#groundedformula) — Interface

## `MLNFormula`

> Interface · `reasoning/markov-logic/types.ts:28`

Fórmula de la teoría MLN.

`formula` es una cadena FOL con literales `Pred(args)` y
conectores `∧`, `∨`, `→`, `¬` (o sus variantes ASCII `&`, `|`, `->`,
`!`). Las variables se infieren por convención: identificadores que
empiezan en minúscula son variables; los que empiezan en mayúscula
son constantes (cerradas).

`weight` es un peso real. `Infinity` significa hard constraint: la
fórmula DEBE satisfacerse en todo mundo con probabilidad no nula.

```ts
export interface MLNFormula
```


## `MLNTheory`

> Interface · `reasoning/markov-logic/types.ts:44`

Teoría MLN completa: fórmulas + dominios tipados de constantes +
declaración de predicados.

`constants[t]` es el conjunto de constantes del tipo `t`.
`predicates[i].types` declara el tipo de cada argumento del
predicado `predicates[i].name`.

Para teorías untyped, basta usar un único tipo (por ejemplo
`"Person"`) y declarar todos los predicados sobre él.

```ts
export interface MLNTheory
```


## `MLNWorld`

> Interface · `reasoning/markov-logic/types.ts:57`

Mundo posible: asignación booleana sobre ground atoms.

Las claves son strings canónicos `"Pred(arg1,arg2,...)"` (sin
espacios). Atoms ausentes se interpretan como `false` (closed-world
assumption opcional, usualmente activada en MLN).

```ts
export interface MLNWorld
```


## `GroundedFormula`

> Interface · `reasoning/markov-logic/types.ts:70`

Resultado de groundear una fórmula sobre el universo de constantes.

Cada `GroundedFormula` representa una instancia concreta (sin
variables libres) de la fórmula original. `violations(world)`
devuelve `0` si el mundo SATISFACE la instancia, `1` si la viola.
Esto facilita componer el peso del mundo: cada `violations > 0`
resta `w · violations` del log-score.

```ts
export interface GroundedFormula
```

