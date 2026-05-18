# `proof-systems/proof-minify/types.ts`

Nodo genérico de un árbol de pruebas.

- `conclusion`: representación textual de la fórmula derivada en el
  nodo. La comparación entre conclusiones se hace por igualdad de
  strings normalizados (trim + colapsar whitespace interno).
- `rule`: nombre de la regla que justifica la conclusión a partir
  de las premises. Convenciones reconocidas:
    * `axiom`, `hypothesis`, `assumption`, `premise`: hoja sin
      premises (o se ignoran las que tenga).
    * `→E`, `->E`, `MP`, `modus-ponens`, `impl-elim`: eliminación
      de implicación (modus ponens). Espera 2 premises: la
      implicación y el antecedente.
    * `→I`, `->I`, `impl-intro`: introducción de implicación.
    * `∧I`, `&I`, `and-intro`, `conj-intro`: conjunción intro.
    * `∧E1`, `∧E2`, `and-elim`, `conj-elim`: conjunción elim.
    * `cut`: corte en sequent calculus (elimina-able localmente
      cuando ambas ramas tienen el mismo cut-formula como hoja).
  El resto se trata como reglas opacas (no se reducen pero sí se
  detectan como redundantes/no usadas).
- `premises`: subárboles. Para hojas, lista vacía.
- `metadata`: opcional, free-form. Si el minificador encuentra dos
  nodos idénticos por conclusión+rule, prefiere el que tenga menos
  metadata (estable por orden de aparición).

## Contents

- [`GenericProofNode`](#genericproofnode) — Interface
- [`MinifyRule`](#minifyrule) — Type
- [`MinifyOptions`](#minifyoptions) — Interface
- [`MinifyResult`](#minifyresult) — Interface

## `GenericProofNode`

> Interface · `proof-systems/proof-minify/types.ts:40`

Nodo genérico de un árbol de pruebas.

- `conclusion`: representación textual de la fórmula derivada en el
  nodo. La comparación entre conclusiones se hace por igualdad de
  strings normalizados (trim + colapsar whitespace interno).
- `rule`: nombre de la regla que justifica la conclusión a partir
  de las premises. Convenciones reconocidas:
    * `axiom`, `hypothesis`, `assumption`, `premise`: hoja sin
      premises (o se ignoran las que tenga).
    * `→E`, `->E`, `MP`, `modus-ponens`, `impl-elim`: eliminación
      de implicación (modus ponens). Espera 2 premises: la
      implicación y el antecedente.
    * `→I`, `->I`, `impl-intro`: introducción de implicación.
    * `∧I`, `&I`, `and-intro`, `conj-intro`: conjunción intro.
    * `∧E1`, `∧E2`, `and-elim`, `conj-elim`: conjunción elim.
    * `cut`: corte en sequent calculus (elimina-able localmente
      cuando ambas ramas tienen el mismo cut-formula como hoja).
  El resto se trata como reglas opacas (no se reducen pero sí se
  detectan como redundantes/no usadas).
- `premises`: subárboles. Para hojas, lista vacía.
- `metadata`: opcional, free-form. Si el minificador encuentra dos
  nodos idénticos por conclusión+rule, prefiere el que tenga menos
  metadata (estable por orden de aparición).

```ts
export interface GenericProofNode
```


## `MinifyRule`

> Type · `proof-systems/proof-minify/types.ts:68`

Reglas de reducción soportadas. El minificador las aplica en orden
fijo dentro de cada iteración:

  1. `detrivialize`        — quita pares intro/elim adyacentes y
                             quita usos redundantes de la misma
                             premisa (dedup por conclusión).
  2. `compact-mp`          — colapsa cadenas A→B, A ⊢ B, B→C ⊢ C,
                             C→D ⊢ D... cuando el árbol intermedio
                             sólo se usa para alimentar el siguiente
                             MP. La cadena queda en `metadata.chain`.
  3. `cut-elimination-local` — caso simple de eliminación de cut
                             cuando una rama del cut es una
                             hipótesis idéntica a la otra rama.
  4. `remove-unused`       — recorre el árbol y descarta sub-pruebas
                             cuyo resultado nunca aparece como
                             conclusion en el camino hacia la raíz
                             (sólo aplica a nodos del tipo
                             `weakening`/`exchange` o sub-árboles
                             huérfanos en una lista de premises).

```ts
export type MinifyRule = 'detrivialize' | 'compact-mp' | 'cut-elimination-local' | 'remove-unused';
```


## `MinifyOptions`

> Interface · `proof-systems/proof-minify/types.ts:70`

```ts
export interface MinifyOptions
```


## `MinifyResult`

> Interface · `proof-systems/proof-minify/types.ts:84`

```ts
export interface MinifyResult
```

