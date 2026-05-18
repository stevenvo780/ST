# `runtime/term-rewriting/types.ts`

Término de primer orden.

- `var`:  variable de unificación (e.g., x, y, z).
- `func`: símbolo de función con aridad implícita por len(args).
          args = [] significa constante (e.g., 0, e, true).

## Contents

- [`Term`](#term) — Type
- [`RewriteRule`](#rewriterule) — Interface
- [`TRS`](#trs) — Interface
- [`Substitution`](#substitution) — Type
- [`KBResult`](#kbresult) — Interface
- [`KBOptions`](#kboptions) — Interface

## `Term`

> Type · `runtime/term-rewriting/types.ts:27`

Término de primer orden.

- `var`:  variable de unificación (e.g., x, y, z).
- `func`: símbolo de función con aridad implícita por len(args).
          args = [] significa constante (e.g., 0, e, true).

```ts
export type Term = { kind: 'var'; name: string } | { kind: 'func'; name: string; args: Term[] };
```


## `RewriteRule`

> Interface · `runtime/term-rewriting/types.ts:35`

Regla de reescritura l → r.

Invariante: vars(r) ⊆ vars(l). Si no se cumple, normalización
puede introducir variables libres y romper la lógica.

```ts
export interface RewriteRule
```


## `TRS`

> Interface · `runtime/term-rewriting/types.ts:43`

Term Rewriting System.

```ts
export interface TRS
```


## `Substitution`

> Type · `runtime/term-rewriting/types.ts:50`

Sustitución: mapa variable → término.

```ts
export type Substitution = Map<string, Term>;
```


## `KBResult`

> Interface · `runtime/term-rewriting/types.ts:60`

Resultado de Knuth-Bendix completion.

- `trs`:            sistema final (potencialmente extendido).
- `completed`:      true si convergió (sin critical pairs unjoinables).
- `criticalPairs`:  total de pares críticos examinados.
- `steps`:          iteraciones del loop principal.

```ts
export interface KBResult
```


## `KBOptions`

> Interface · `runtime/term-rewriting/types.ts:78`

Opciones para Knuth-Bendix completion.

- `ordering`:  estrategia para orientar nuevas ecuaciones.
               Por default LPO (Lexicographic Path Order).
- `maxSteps`:  cota para evitar loops infinitos cuando el sistema
               no es completable (KB es semi-decidible).
- `precedence`: orden parcial sobre símbolos de función
               (map name → priority; mayor = mayor en el orden).
               Requerido para LPO.

```ts
export interface KBOptions
```

