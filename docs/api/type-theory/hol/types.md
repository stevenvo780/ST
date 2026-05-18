# `type-theory/hol/types.ts`

Tipos en HOL: variables de tipo, constantes (`bool`, `ind`,
...) y aplicaciones de constructores de tipo (`fun(α, β)`,
`prod(α, β)`, ...).

## Contents

- [`HOLType`](#holtype) — Type
- [`HOLTerm`](#holterm) — Type
- [`HOLSequent`](#holsequent) — Interface
- [`HOLTheorem`](#holtheorem) — Interface

## `HOLType`

> Type · `type-theory/hol/types.ts:30`

Tipos en HOL: variables de tipo, constantes (`bool`, `ind`,
...) y aplicaciones de constructores de tipo (`fun(α, β)`,
`prod(α, β)`, ...).

```ts
export type HOLType = | { kind: 'tvar'; name: string } | { kind: 'tconst'; name: string } | { kind: 'tapp'; fn: string; args: HOLType[] };
```


## `HOLTerm`

> Type · `type-theory/hol/types.ts:40`

Términos HOL. Polimorfismo via `tvar` en los tipos de
variables/constantes. `comb` es aplicación; `abs` es
λ-abstracción con el tipo del parámetro registrado.

```ts
export type HOLTerm = | { kind: 'var'; name: string; type: HOLType } | { kind: 'const'; name: string; type: HOLType } | { kind: 'comb'; fn: HOLTerm; arg: HOLTerm } | { kind: 'abs'; param: string; paramType: HOLType; body: HOLTerm };
```


## `HOLSequent`

> Interface · `type-theory/hol/types.ts:50`

Secuente abstracto. Las hipótesis son una multiset modelada
como array; la igualdad se chequea por α-equivalencia.

```ts
export interface HOLSequent
```


## `HOLTheorem`

> Interface · `type-theory/hol/types.ts:60`

Teorema HOL: hipótesis + conclusión + huella de la regla
usada y los teoremas-premisa. Solo se obtiene aplicando una
regla primitiva — no hay constructor público.

```ts
export interface HOLTheorem
```

