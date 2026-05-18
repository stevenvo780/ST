# `type-theory/lambda-cube/examples.ts`

============================================================ Lambda Cube — Términos canónicos ============================================================ Construcciones clásicas de cada vértice del cubo. Cada función devuelve un `CubeTerm` directamente; el tipo correspondiente es inferible con `inferType` en el sistema apropiado.

## Contents

- [`polymorphicIdentity`](#polymorphicidentity) — Function
- [`polymorphicIdentityType`](#polymorphicidentitytype) — Function
- [`churchNumeral`](#churchnumeral) — Function
- [`churchNumeralType`](#churchnumeraltype) — Function
- [`churchPairType`](#churchpairtype) — Function
- [`dependentList`](#dependentlist) — Function
- [`predicateOverNat`](#predicateovernat) — Function
- [`typeLevelIdentity`](#typelevelidentity) — Function
- [`typeLevelIdentityKind`](#typelevelidentitykind) — Function
- [`cocPolyIdentityType`](#cocpolyidentitytype) — Function

## `polymorphicIdentity`

> Function · `type-theory/lambda-cube/examples.ts:15`

Identidad polimórfica: λ X:*. λ x:X. x  ∈ λ2.
Tipo: Π X:*. X → X.

```ts
export function polymorphicIdentity(): CubeTerm
```

### Returns

`CubeTerm` — 


## `polymorphicIdentityType`

> Function · `type-theory/lambda-cube/examples.ts:20`

Tipo de la identidad polimórfica: Π X:*. X → X.

```ts
export function polymorphicIdentityType(): CubeTerm
```

### Returns

`CubeTerm` — 


## `churchNumeral`

> Function · `type-theory/lambda-cube/examples.ts:30`

Encoding Church de un natural `n` en System F:
    n = λ X:*. λ s:X→X. λ z:X. s (s (... (s z) ...))   con n aplicaciones

Tipo: Π X:*. (X → X) → X → X.

```ts
export function churchNumeral(n: number): CubeTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`CubeTerm` — 


## `churchNumeralType`

> Function · `type-theory/lambda-cube/examples.ts:43`

Tipo de un natural Church: Π X:*. (X → X) → X → X.

```ts
export function churchNumeralType(): CubeTerm
```

### Returns

`CubeTerm` — 


## `churchPairType`

> Function · `type-theory/lambda-cube/examples.ts:54`

Tipo polimórfico de pares: Π A:*. Π B:*. (Π C:*. (A → B → C) → C) → ...
En la versión sencilla devolvemos solo el tipo de "Pair A B":

  Π A:*. Π B:*. Π C:*. (A → B → C) → C

```ts
export function churchPairType(): CubeTerm
```

### Returns

`CubeTerm` — 


## `dependentList`

> Function · `type-theory/lambda-cube/examples.ts:73`

Esquema de "lista dependiente": dado un tipo de vectores indexado
por `Nat`, devolvemos el Π típico

  Π n : Nat. Vector n

Requiere que el contexto declare `Nat : *` y `Vector : Nat → *`.
Atención: ambos extremos son `*`, así que esta Π usa la regla
(*,*) y queda legal incluso en λ→ una vez que `Vector` está en el
contexto. El sabor "dependiente" viene del hecho de que el
codominio menciona el binder `n`.

```ts
export function dependentList(): CubeTerm
```

### Returns

`CubeTerm` — 


## `predicateOverNat`

> Function · `type-theory/lambda-cube/examples.ts:84`

Predicado sobre `Nat`: `Π n:Nat. *`. Domino `Nat : *` y codominio
`*` (cuyo sort es `◻`). Esa es justo la formación (*,◻) — exclusiva
de los vértices con tipos dependientes (λP, λP2, λPω, λC).

Requiere `Nat : *` en el contexto.

```ts
export function predicateOverNat(): CubeTerm
```

### Returns

`CubeTerm` — 


## `typeLevelIdentity`

> Function · `type-theory/lambda-cube/examples.ts:92`

Operador de tipo `id-type`: λ A:*. A → A  en λω.
Tipo: * → *.

```ts
export function typeLevelIdentity(): CubeTerm
```

### Returns

`CubeTerm` — 


## `typeLevelIdentityKind`

> Function · `type-theory/lambda-cube/examples.ts:97`

Tipo del operador `typeLevelIdentity`: * → *.

```ts
export function typeLevelIdentityKind(): CubeTerm
```

### Returns

`CubeTerm` — 


## `cocPolyIdentityType`

> Function · `type-theory/lambda-cube/examples.ts:106`

En el Calculus of Constructions, el tipo polimórfico
  Π A:*. A → A
vive en el universo `*`.

```ts
export function cocPolyIdentityType(): CubeTerm
```

### Returns

`CubeTerm` — 

