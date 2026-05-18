# `reasoning/universal-algebra/index.ts`

============================================================ ST Universal Algebra — álgebras, homomorfismos, congruencias, álgebras libres (term algebras), teorías ecuacionales y variedades (Birkhoff). ============================================================ Una *signatura* Σ es un conjunto de símbolos de operación con aridad. Un Σ-álgebra A = (A, (f^A)_{f∈Σ}) interpreta cada símbolo como una operación total sobre el carrier finito A. Construcciones implementadas:   - Verificación estructural: signatura bien formada, álgebra     cerrada bajo sus operaciones.   - Homomorfismos h : A → B preservan todas las operaciones     (h(f^A(a₁,…,aₙ)) = f^B(h(a₁),…,h(aₙ))). Cómputo de imagen y     kernel (relación de equivalencia inducida).   - Congruencias θ ⊆ A×A: equivalencia + compatibilidad con cada     operación. Álgebra cociente A/θ.   - Álgebra de términos T_Σ(X): álgebra libre sobre generadores X.     Substitución y reducción módulo un conjunto de ecuaciones     (term rewriting confluente para casos sencillos).   - Ecuaciones t₁ = t₂. Comprobación finita de si A ⊨ eq por     muestreo o enumeración exhaustiva (carrier pequeño).   - Variedades: A ∈ V(E) sii A satisface todas las ecuaciones     de E. Birkhoff caracteriza variedades como clases cerradas     bajo H, S, P (homomorphic image, subalgebras, products) —     no implementamos el checker completo, sí el test ecuacional.   - Signaturas y ecuaciones estándar: grupos, anillos, retículos,     abelianos. Igualdad de elementos del carrier: por defecto se usa Object.is. Las álgebras pueden definir su propio `eq` para soportar elementos estructurales (tuplas, conjuntos, términos). ============================================================

## Contents

- [`OperationSymbol`](#operationsymbol) — Interface
- [`Signature`](#signature) — Interface
- [`Algebra`](#algebra) — Interface
- [`isValidSignature`](#isvalidsignature) — Function
- [`isAlgebra`](#isalgebra) — Function
- [`Homomorphism`](#homomorphism) — Interface
- [`isHomomorphism`](#ishomomorphism) — Function
- [`image`](#image) — Function
- [`kernel`](#kernel) — Function
- [`Congruence`](#congruence) — Interface
- [`isCongruence`](#iscongruence) — Function
- [`equivalenceClasses`](#equivalenceclasses) — Function
- [`quotientAlgebra`](#quotientalgebra) — Function
- [`Term`](#term) — Type
- [`isVarTerm`](#isvarterm) — Function
- [`isOpTerm`](#isopterm) — Function
- [`termToString`](#termtostring) — Function
- [`termEquals`](#termequals) — Function
- [`termSubstitute`](#termsubstitute) — Function
- [`termAlgebra`](#termalgebra) — Function
- [`termEqualsModulo`](#termequalsmodulo) — Function
- [`Equation`](#equation) — Interface
- [`freeVars`](#freevars) — Function
- [`evalTerm`](#evalterm) — Function
- [`modelsEquation`](#modelsequation) — Function
- [`variety`](#variety) — Function
- [`groupSignature`](#groupsignature) — Function
- [`ringSignature`](#ringsignature) — Function
- [`latticeSignature`](#latticesignature) — Function
- [`groupEquations`](#groupequations) — Function
- [`abelianEquations`](#abelianequations) — Function
- [`ringEquations`](#ringequations) — Function
- [`latticeEquations`](#latticeequations) — Function
- [`cyclicGroupAlgebra`](#cyclicgroupalgebra) — Function
- [`cyclicRingAlgebra`](#cyclicringalgebra) — Function
- [`carrierIndex`](#carrierindex) — Function

## `OperationSymbol`

> Interface · `reasoning/universal-algebra/index.ts:37`

```ts
export interface OperationSymbol
```


## `Signature`

> Interface · `reasoning/universal-algebra/index.ts:42`

```ts
export interface Signature
```


## `Algebra`

> Interface · `reasoning/universal-algebra/index.ts:46`

```ts
export interface Algebra<T>
```


## `isValidSignature`

> Function · `reasoning/universal-algebra/index.ts:71`

Verifica que la signatura no tenga símbolos duplicados ni aridades
negativas.

```ts
export function isValidSignature(sig: Signature): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sig` | `Signature` | no |  |

### Returns

`boolean` — 


## `isAlgebra`

> Function · `reasoning/universal-algebra/index.ts:88`

Verifica que `A` interpreta cada símbolo de su signatura y que
las operaciones son totales y cerradas sobre el carrier.

Para aridad n, se enumeran |A|^n tuplas — usar sólo con carriers
finitos pequeños (n·|A|^aridad <= ~10⁶).

```ts
export function isAlgebra<T>(A: Algebra<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `A` | `Algebra<T>` | no |  |

### Returns

`boolean` — 


## `Homomorphism`

> Interface · `reasoning/universal-algebra/index.ts:139`

```ts
export interface Homomorphism<T1, T2>
```


## `isHomomorphism`

> Function · `reasoning/universal-algebra/index.ts:152`

Verifica que `h` preserva todas las operaciones:
  h(f^A(a₁,…,aₙ)) = f^B(h(a₁),…,h(aₙ)) para toda tupla y operación f.

Requiere signaturas idénticas en source y target (mismos nombres y
aridades).

```ts
export function isHomomorphism<T1, T2>(h: Homomorphism<T1, T2>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `h` | `Homomorphism<T1, T2>` | no |  |

### Returns

`boolean` — 


## `image`

> Function · `reasoning/universal-algebra/index.ts:185`

Imagen de un homomorfismo: { h(a) : a ∈ A }, deduplicada por igualdad
del target.

```ts
export function image<T1, T2>(h: Homomorphism<T1, T2>): T2[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `h` | `Homomorphism<T1, T2>` | no |  |

### Returns

`T2[]` — 


## `kernel`

> Function · `reasoning/universal-algebra/index.ts:200`

Kernel: relación de equivalencia ker h = { (a,b) : h(a) = h(b) }.
Devuelve sólo pares (a,b) con a ≠ b (incluyendo (b,a)); los reflexivos
son implícitos.

```ts
export function kernel<T1, T2>(h: Homomorphism<T1, T2>): Array<[T1, T1]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `h` | `Homomorphism<T1, T2>` | no |  |

### Returns

`Array<[T1, T1]>` — 


## `Congruence`

> Interface · `reasoning/universal-algebra/index.ts:221`

```ts
export interface Congruence<T>
```


## `isCongruence`

> Function · `reasoning/universal-algebra/index.ts:236`

θ es congruencia sii es:
  1) reflexiva   : (a,a) ∈ θ para todo a ∈ A
  2) simétrica   : (a,b) ∈ θ ⇒ (b,a) ∈ θ
  3) transitiva  : (a,b),(b,c) ∈ θ ⇒ (a,c) ∈ θ
  4) compatible  : (aᵢ,bᵢ) ∈ θ ⇒ (f(a₁,…,aₙ), f(b₁,…,bₙ)) ∈ θ

La relación puede entregarse minimamente (sólo pares relevantes); aquí
se verifica el cierre completo asumiendo la relación dada.

```ts
export function isCongruence<T>(c: Congruence<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `Congruence<T>` | no |  |

### Returns

`boolean` — 


## `equivalenceClasses`

> Function · `reasoning/universal-algebra/index.ts:283`

Calcula las clases de equivalencia inducidas por una relación
(asumida ya transitiva-y-simétrica; el módulo `isCongruence` valida
el caso). Cada clase es un T[] (en el orden del carrier).

```ts
export function equivalenceClasses<T>(c: Congruence<T>): T[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `Congruence<T>` | no |  |

### Returns

`T[][]` — 


## `quotientAlgebra`

> Function · `reasoning/universal-algebra/index.ts:325`

Álgebra cociente A/θ. El carrier son las clases de equivalencia; cada
operación se eleva representando la clase por su primer elemento.

No verifica que la relación sea congruencia; usar `isCongruence` antes.

```ts
export function quotientAlgebra<T>(c: Congruence<T>): Algebra<T[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `Congruence<T>` | no |  |

### Returns

`Algebra<T[]>` — 


## `Term`

> Type · `reasoning/universal-algebra/index.ts:362`

```ts
export type Term = | { readonly op: string; readonly args: ReadonlyArray<Term> } | { readonly var: string };
```


## `isVarTerm`

> Function · `reasoning/universal-algebra/index.ts:366`

```ts
export function isVarTerm(t: Term): t is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`t is { readonly var: string }` — 


## `isOpTerm`

> Function · `reasoning/universal-algebra/index.ts:370`

```ts
export function isOpTerm( t: Term, ): t is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`t is { readonly op: string; readonly args: ReadonlyArray<Term> }` — 


## `termToString`

> Function · `reasoning/universal-algebra/index.ts:376`

```ts
export function termToString(t: Term): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`string` — 


## `termEquals`

> Function · `reasoning/universal-algebra/index.ts:382`

```ts
export function termEquals(t1: Term, t2: Term): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `Term` | no |  |
| `t2` | `Term` | no |  |

### Returns

`boolean` — 


## `termSubstitute`

> Function · `reasoning/universal-algebra/index.ts:399`

Substitución t[x ↦ σ(x)]: reemplaza cada variable por su término.
Variables fuera de `sub` quedan intactas.

```ts
export function termSubstitute(t: Term, sub: Record<string, Term>): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `sub` | `Record<string, Term>` | no |  |

### Returns

`Term` — 


## `termAlgebra`

> Function · `reasoning/universal-algebra/index.ts:414`

Álgebra de términos T_Σ(X) hasta profundidad `maxDepth`. Útil para
generar muestras del álgebra libre — el carrier completo es infinito
cuando hay operaciones de aridad ≥ 1.

Por defecto `maxDepth=2`: incluye constantes, variables y un nivel
de aplicación.

```ts
export function termAlgebra( signature: Signature, generators: ReadonlyArray<string>, maxDepth = 2, ): Algebra<Term>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `signature` | `Signature` | no |  |
| `generators` | `ReadonlyArray<string>` | no |  |
| `maxDepth` | `any` | yes |  |

### Returns

`Algebra<Term>` — 


## `termEqualsModulo`

> Function · `reasoning/universal-algebra/index.ts:465`

Comprueba si t1 y t2 son iguales módulo el conjunto de ecuaciones
`eqs`, aplicando reescritura ingenua hasta profundidad limitada.

NO es decidible en general; este checker es una heurística para
casos pequeños: aplica cada ecuación en ambas direcciones desde t1
y t2 hasta `maxSteps` pasos buscando una forma común.

```ts
export function termEqualsModulo( t1: Term, t2: Term, eqs: ReadonlyArray<[Term, Term]>, maxSteps = 50, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `Term` | no |  |
| `t2` | `Term` | no |  |
| `eqs` | `ReadonlyArray<[Term, Term]>` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`boolean` — 


## `Equation`

> Interface · `reasoning/universal-algebra/index.ts:563`

```ts
export interface Equation
```


## `freeVars`

> Function · `reasoning/universal-algebra/index.ts:571`

Variables libres de un término (orden de aparición, deduplicadas).

```ts
export function freeVars(t: Term): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`string[]` — 


## `evalTerm`

> Function · `reasoning/universal-algebra/index.ts:587`

Evalúa un término en un álgebra dado un assignment de variables.

```ts
export function evalTerm<T>(A: Algebra<T>, t: Term, env: Record<string, T>): T
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `A` | `Algebra<T>` | no |  |
| `t` | `Term` | no |  |
| `env` | `Record<string, T>` | no |  |

### Returns

`T` — 


## `modelsEquation`

> Function · `reasoning/universal-algebra/index.ts:605`

A ⊨ (t₁ = t₂): para todo assignment de variables libres, evalTerm
coincide. Si `samples` es positivo, sólo se prueban `samples` tuplas
aleatorias; si es 0 o undefined, se enumeran todas (|A|^k).

```ts
export function modelsEquation<T>(A: Algebra<T>, eq: Equation, samples = 0): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `A` | `Algebra<T>` | no |  |
| `eq` | `Equation` | no |  |
| `samples` | `any` | yes |  |

### Returns

`boolean` — 


## `variety`

> Function · `reasoning/universal-algebra/index.ts:653`

A pertenece a la variedad V(E) sii A satisface toda ecuación de E.

Es la dirección "fácil" de Birkhoff: una variedad puede definirse
por ecuaciones, y la pertenencia se verifica ecuación-por-ecuación.
El recíproco (clases HSP son ecuacionalmente definibles) es el
contenido fuerte del teorema y no se chequea aquí.

```ts
export function variety<T>(equations: ReadonlyArray<Equation>, A: Algebra<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `equations` | `ReadonlyArray<Equation>` | no |  |
| `A` | `Algebra<T>` | no |  |

### Returns

`boolean` — 


## `groupSignature`

> Function · `reasoning/universal-algebra/index.ts:668`

Signatura de grupos en notación multiplicativa: e (constante),
inv (unaria), mul (binaria).

```ts
export function groupSignature(): Signature
```

### Returns

`Signature` — 


## `ringSignature`

> Function · `reasoning/universal-algebra/index.ts:681`

Signatura de anillos: 0, 1 (constantes), neg (unaria), add y mul (binarias).

```ts
export function ringSignature(): Signature
```

### Returns

`Signature` — 


## `latticeSignature`

> Function · `reasoning/universal-algebra/index.ts:696`

Signatura de retículos: join y meet (binarias).

```ts
export function latticeSignature(): Signature
```

### Returns

`Signature` — 


## `groupEquations`

> Function · `reasoning/universal-algebra/index.ts:714`

Ecuaciones de grupo (notación multiplicativa, signatura `groupSignature`):
  - asociatividad de mul
  - identidad por izquierda y derecha
  - inverso por izquierda y derecha

```ts
export function groupEquations(): Equation[]
```

### Returns

`Equation[]` — 


## `abelianEquations`

> Function · `reasoning/universal-algebra/index.ts:736`

Ecuaciones adicionales para grupos abelianos: conmutatividad de mul.

```ts
export function abelianEquations(): Equation[]
```

### Returns

`Equation[]` — 


## `ringEquations`

> Function · `reasoning/universal-algebra/index.ts:747`

Ecuaciones de anillo conmutativo con unidad sobre `ringSignature`:
grupo abeliano por +, monoide conmutativo por ·, distributividad
bilateral.

```ts
export function ringEquations(): Equation[]
```

### Returns

`Equation[]` — 


## `latticeEquations`

> Function · `reasoning/universal-algebra/index.ts:789`

Ecuaciones de retículo sobre `latticeSignature`: idempotencia,
conmutatividad, asociatividad y absorción para join y meet.

```ts
export function latticeEquations(): Equation[]
```

### Returns

`Equation[]` — 


## `cyclicGroupAlgebra`

> Function · `reasoning/universal-algebra/index.ts:817`

Construye el álgebra cíclica Z/nZ en la signatura de grupo
(`groupSignature`), con `mul` interpretado como suma módulo n.

```ts
export function cyclicGroupAlgebra(n: number): Algebra<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`Algebra<number>` — 


## `cyclicRingAlgebra`

> Function · `reasoning/universal-algebra/index.ts:838`

Construye Z/nZ como anillo conmutativo con unidad. Para n=1 colapsa
al anillo trivial (0=1).

```ts
export function cyclicRingAlgebra(n: number): Algebra<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`Algebra<number>` — 


## `carrierIndex`

> Function · `reasoning/universal-algebra/index.ts:867`

Calcula el `index` de un elemento en el carrier por la igualdad del
álgebra (Object.is o `eq` provisto). Devuelve -1 si no aparece.

```ts
export function carrierIndex<T>(A: Algebra<T>, x: T): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `A` | `Algebra<T>` | no |  |
| `x` | `T` | no |  |

### Returns

`number` — 

