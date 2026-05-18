# `solver/csp/types.ts`

Restricción n-aria de un CSP.

 - `vars`      variables sobre las que aplica el predicado, en orden.
 - `predicate` función que recibe los valores alineados a `vars` y
               devuelve `true` si la tupla es admisible.

Para AC-3 estricto sólo usamos restricciones binarias; para
restricciones n-arias el algoritmo cae a forward-checking equivalente:
cada restricción se evalúa cuando todas sus variables están asignadas.

## Contents

- [`Constraint`](#constraint) — Interface
- [`CSP`](#csp) — Interface
- [`CSPResult`](#cspresult) — Interface
- [`BacktrackOptions`](#backtrackoptions) — Interface

## `Constraint`

> Interface · `solver/csp/types.ts:24`

Restricción n-aria de un CSP.

 - `vars`      variables sobre las que aplica el predicado, en orden.
 - `predicate` función que recibe los valores alineados a `vars` y
               devuelve `true` si la tupla es admisible.

Para AC-3 estricto sólo usamos restricciones binarias; para
restricciones n-arias el algoritmo cae a forward-checking equivalente:
cada restricción se evalúa cuando todas sus variables están asignadas.

```ts
export interface Constraint<V, D>
```


## `CSP`

> Interface · `solver/csp/types.ts:34`

CSP genérico. `variables` define el orden canónico; `domains` mapea
cada variable a sus posibles valores. Las restricciones pueden ser
binarias (sweet spot de AC-3) o n-arias.

```ts
export interface CSP<V, D>
```


## `CSPResult`

> Interface · `solver/csp/types.ts:46`

Resultado de una corrida de backtracking.
 - `solution`   asignación completa o `null` si UNSAT.
 - `iterations` nodos del árbol de búsqueda visitados.
 - `failures`   asignaciones que dispararon backtrack.

```ts
export interface CSPResult<V, D>
```


## `BacktrackOptions`

> Interface · `solver/csp/types.ts:63`

Opciones de configuración para el solver.
 - `useAC3` aplica AC-3 antes de empezar (y opcionalmente tras cada
            asignación si `maintainAC3` está activo).
 - `mrv`    heurística "Minimum Remaining Values" para elegir la
            próxima variable: la de dominio reducido más pequeño.
 - `lcv`    heurística "Least Constraining Value" para ordenar
            valores: probar primero el que menos restringe a vecinos.
 - `maxIterations` corta la búsqueda tras N nodos (defensa contra
                   explosión combinatoria).

```ts
export interface BacktrackOptions
```

