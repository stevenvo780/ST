# `semantics/categorical/limits.ts`

============================================================ ST Categorical — Límites y colímites ============================================================ Construcciones universales en FinSet (las más usadas):   • product(a, b)    — producto binario A×B   • coproduct(a, b)  — coproducto binario A⊔B   • equalizer(f, g)  — igualador de un par paralelo Para casos generales también exponemos `isLimit` que recibe un diagrama y un cono y verifica la propiedad universal por muestreo sobre los conos candidatos del diagrama. ============================================================

## Contents

- [`isCone`](#iscone) — Function
- [`isLimit`](#islimit) — Function
- [`product`](#product) — Function
- [`coproduct`](#coproduct) — Function
- [`equalizer`](#equalizer) — Function
- [`coequalizer`](#coequalizer) — Function

## `isCone`

> Function · `semantics/categorical/limits.ts:21`

Verifica que `cone` sea un cono sobre `diagram` en `cat`:
para cada arista `e: i→j` del diagrama, `e ∘ leg(i) = leg(j)`.

```ts
export function isCone<O, M>( cat: Category<O, M>, diagram: Diagram<O, M>, cone: Cone<O, M>, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cat` | `Category<O, M>` | no |  |
| `diagram` | `Diagram<O, M>` | no |  |
| `cone` | `Cone<O, M>` | no |  |

### Returns

`boolean` — 


## `isLimit`

> Function · `semantics/categorical/limits.ts:46`

Comprueba si `cone` es límite del diagrama: para cada otro cono
candidato sobre el diagrama, existe un único morfismo `u : apex' → apex`
que conmuta con las patas. La búsqueda es por enumeración sobre
los morfismos registrados en `cat`; sirve bien para categorías finitas
pequeñas (FinSet con objetos chicos).

```ts
export function isLimit<O, M>( cat: Category<O, M>, diagram: Diagram<O, M>, cone: Cone<O, M>, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cat` | `Category<O, M>` | no |  |
| `diagram` | `Diagram<O, M>` | no |  |
| `cone` | `Cone<O, M>` | no |  |

### Returns

`boolean` — 


## `product`

> Function · `semantics/categorical/limits.ts:122`

Producto binario en FinSet: A×B con proyecciones π1, π2.
Construye el objeto producto como un nuevo `FinSetObj` con
elementos `(a,b)` codificados como `"a∥b"` y lo registra en `cat`.

Devuelve `null` si los objetos no pertenecen a la categoría.

Nota: la categoría `cat` debe poder admitir nuevos objetos. Para
nuestro uso pedimos que sea una `FinSet`-categoría construida con
los carriers explícitos. En lugar de mutar `cat`, esta función
regresa el producto + las proyecciones y deja al cliente
reconstruir una categoría extendida si lo necesita.

```ts
export function product( cat: Category<FinSetObj, FinSetMor>, a: FinSetObj, b: FinSetObj, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cat` | `Category<FinSetObj, FinSetMor>` | no |  |
| `a` | `FinSetObj` | no |  |
| `b` | `FinSetObj` | no |  |

### Returns

`{ obj: FinSetObj; pi1: FinSetMor; pi2: FinSetMor; cat: Category<FinSetObj, FinSetMor> } \| null` — 


## `coproduct`

> Function · `semantics/categorical/limits.ts:156`

Coproducto binario en FinSet: unión disjunta A⊔B. Usa prefijos
`L:` y `R:` para tag-ear los elementos y produce las inyecciones
canónicas in1, in2.

```ts
export function coproduct( cat: Category<FinSetObj, FinSetMor>, a: FinSetObj, b: FinSetObj, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cat` | `Category<FinSetObj, FinSetMor>` | no |  |
| `a` | `FinSetObj` | no |  |
| `b` | `FinSetObj` | no |  |

### Returns

`{ obj: FinSetObj; in1: FinSetMor; in2: FinSetMor; cat: Category<FinSetObj, FinSetMor> } \| null` — 


## `equalizer`

> Function · `semantics/categorical/limits.ts:188`

Igualador en FinSet de un par paralelo `f, g : A → B`. El igualador
es el subconjunto `E = { x ∈ A | f(x) = g(x) }` con inclusión `eq : E ↪ A`.

```ts
export function equalizer( cat: Category<FinSetObj, FinSetMor>, f: FinSetMor, g: FinSetMor, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cat` | `Category<FinSetObj, FinSetMor>` | no |  |
| `f` | `FinSetMor` | no |  |
| `g` | `FinSetMor` | no |  |

### Returns

`{ obj: FinSetObj; eq: FinSetMor; cat: Category<FinSetObj, FinSetMor> } \| null` — 


## `coequalizer`

> Function · `semantics/categorical/limits.ts:216`

Coigualador (colimite dual): cociente A/~ donde x ~ y si existe
z ∈ S con f(z)=x ∧ g(z)=y (cierre transitivo-simétrico).

```ts
export function coequalizer( cat: Category<FinSetObj, FinSetMor>, f: FinSetMor, g: FinSetMor, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cat` | `Category<FinSetObj, FinSetMor>` | no |  |
| `f` | `FinSetMor` | no |  |
| `g` | `FinSetMor` | no |  |

### Returns

`{ obj: FinSetObj; q: FinSetMor; cat: Category<FinSetObj, FinSetMor> } \| null` — 

