# `reasoning/abduction/entails.ts`

============================================================ ST Abduction — Oráculo de entailment por defecto ============================================================ Implementación de entailment por forward-chaining sobre un fragmento Horn con unificación simple:   Sintaxis soportada:     - Átomos:   `p`, `bird(tweety)`, `parent(alice, bob)`     - Reglas:   `A → B`  (también acepta `->`)     - Reglas conjuntivas: `A ∧ B → C` (también `&&`, `and`, `,`)     - Negación de conclusión: `A → ¬B` (también `~B`, `!B`)   Variables: identificadores que empiezan con letra minúscula y   están dentro de argumentos de un predicado son variables   universalmente cuantificadas (estilo Prolog implícito).   Constantes: empiezan con mayúscula o son nombres entre comillas;   los demás identificadores se tratan como variables si están   dentro de un predicado.   Por convención de los tests del usuario, `bird(x)` tiene `x` como   variable y `bird(tweety)` tiene `tweety` como constante: usamos   un set de "variable names" configurable, default = nombres de   una sola letra ASCII minúscula (`x`, `y`, `z`, `u`, `v`, `w`). Limitaciones consciente: no es un demostrador FOL completo. Es suficiente para los casos de abducción típicos (diagnóstico, Horn-like). Para fragmentos más ricos, pasar un `EntailmentOracle` custom.

## Contents

- [`DefaultEntailsOptions`](#defaultentailsoptions) — Interface
- [`defaultEntails`](#defaultentails) — Function
- [`defaultConsistent`](#defaultconsistent) — Function

## `DefaultEntailsOptions`

> Interface · `reasoning/abduction/entails.ts:295`

```ts
export interface DefaultEntailsOptions
```


## `defaultEntails`

> Function · `reasoning/abduction/entails.ts:309`

Oráculo de entailment por defecto. Forward-chaining sobre Horn-like.

Devuelve `true` sii `target` (ground) es derivable de `premises`.
Si `target` contiene variables se reporta `false` (no soportamos
∃-targets aquí; usar custom oracle).

```ts
export function defaultEntails(opts: DefaultEntailsOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `opts` | `DefaultEntailsOptions` | yes |  |

### Returns

`EntailmentOracle` — 


## `defaultConsistent`

> Function · `reasoning/abduction/entails.ts:324`

Oráculo de consistencia por defecto. Considera inconsistente sii
el forward-chaining deriva un par {p, ¬p}.

```ts
export function defaultConsistent( opts: DefaultEntailsOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `opts` | `DefaultEntailsOptions` | yes |  |

### Returns

`(premises: ReadonlyArray<Formula>) => boolean` — 

