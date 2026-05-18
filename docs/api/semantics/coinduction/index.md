# `semantics/coinduction/index.ts`

============================================================ ST Coinduction — Streams + corecursion + bisimulación up-to ============================================================ Streams coinductivos definidos por destructores (head, tail). Construcción corecursiva via thunks perezosos (la cola es una función `() => Stream<T>` para evitar evaluación infinita). Bisimulación: la noción natural de igualdad para streams. Dos streams `s, t` son bisimilares si existe una relación R tal que   • R(s, t) ⇒ head(s) = head(t)   • R(s, t) ⇒ R(tail(s), tail(t)) La igualdad sintáctica falla (dos streams pueden generar la misma secuencia con thunks distintos); la bisimulación es la clausura coinductiva apropiada. Como las secuencias son infinitas no podemos verificar bisimilaridad en general (semi-decidible). Por eso ofrecemos:   • isBisimilar(a, b, depth): chequeo "hasta profundidad", suficiente     para refutación (encontrar el primer prefijo divergente) y para     evidencia computacional positiva acotada.   • prove(claim, depth): técnica "bisimulación up-to". El usuario     provee una relación R; chequeamos por `depth` pasos que       R(a,b) ⇒ head(a)=head(b) ∧ R(tail a, tail b).     Si la relación es realmente una bisimulación, ningún paso falla;     si depth pasos pasaron sin fallar, tenemos alta confianza     (en el caso límite, todos los pasos válidos = bisimulación). ============================================================ ── Tipo público ────────────────────────────────────────────

## Contents

- [`Stream`](#stream) — Interface
- [`cons`](#cons) — Function
- [`repeat`](#repeat) — Function
- [`iterate`](#iterate) — Function
- [`unfold`](#unfold) — Function
- [`take`](#take) — Function
- [`drop`](#drop) — Function
- [`nth`](#nth) — Function
- [`map`](#map) — Function
- [`zipWith`](#zipwith) — Function
- [`zip`](#zip) — Function
- [`filter`](#filter) — Function
- [`naturals`](#naturals) — Const
- [`fibonacci`](#fibonacci) — Const
- [`BisimulationProof`](#bisimulationproof) — Interface
- [`isBisimilar`](#isbisimilar) — Function
- [`prove`](#prove) — Function
- [`interleave`](#interleave) — Function
- [`scan`](#scan) — Function
- [`__internals`](#internals) — Const

## `Stream`

> Interface · `semantics/coinduction/index.ts:31`

```ts
export interface Stream<T>
```


## `cons`

> Function · `semantics/coinduction/index.ts:42`

Cons explícito: crea un stream con cabeza `h` y cola perezosa
`t` (una función que produce el resto cuando se evalúa).

```ts
export function cons<T>(h: T, t: () => Stream<T>): Stream<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `h` | `T` | no |  |
| `t` | `() => Stream<T>` | no |  |

### Returns

`Stream<T>` — 


## `repeat`

> Function · `semantics/coinduction/index.ts:52`

`repeat(x)` = x, x, x, ...  (stream constante)

Definición corecursiva clásica: repeat(x) = cons(x, () => repeat(x)).
El thunk evita la recursión infinita en tiempo de construcción.

```ts
export function repeat<T>(x: T): Stream<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `T` | no |  |

### Returns

`Stream<T>` — 


## `iterate`

> Function · `semantics/coinduction/index.ts:65`

`iterate(f, x)` = x, f(x), f(f(x)), ...

Definición corecursiva: iterate(f, x) = cons(x, () => iterate(f, f(x))).

```ts
export function iterate<T>(f: (x: T) => T, x: T): Stream<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `(x: T) => T` | no |  |
| `x` | `T` | no |  |

### Returns

`Stream<T>` — 


## `unfold`

> Function · `semantics/coinduction/index.ts:76`

`unfold(seed, step)`: anamorfismo genérico. `step(s)` devuelve
el siguiente par `[valor, próximaSemilla]` o `null` para terminar.
Para streams infinitos, `step` nunca debe devolver `null`. Si
devuelve `null` durante una iteración, devolvemos un stream que
cicla la última cabeza producida (decisión: streams totales).

```ts
export function unfold<S, T>(seed: S, step: (s: S) => readonly [T, S] | null): Stream<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seed` | `S` | no |  |
| `step` | `(s: S) => readonly [T, S] \| null` | no |  |

### Returns

`Stream<T>` — 


## `take`

> Function · `semantics/coinduction/index.ts:95`

`take(s, n)`: extrae los primeros n elementos de un stream.
Observación finita; es la única forma de "ver" un stream.

```ts
export function take<T>(s: Stream<T>, n: number): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Stream<T>` | no |  |
| `n` | `number` | no |  |

### Returns

`T[]` — 


## `drop`

> Function · `semantics/coinduction/index.ts:111`

`drop(s, n)`: descarta los primeros n elementos.

```ts
export function drop<T>(s: Stream<T>, n: number): Stream<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Stream<T>` | no |  |
| `n` | `number` | no |  |

### Returns

`Stream<T>` — 


## `nth`

> Function · `semantics/coinduction/index.ts:123`

`nth(s, i)`: i-ésimo elemento (0-indexed).

```ts
export function nth<T>(s: Stream<T>, i: number): T
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Stream<T>` | no |  |
| `i` | `number` | no |  |

### Returns

`T` — 


## `map`

> Function · `semantics/coinduction/index.ts:134`

`map(f, s)`: aplica `f` a cada elemento.

Definición corecursiva: map(f, s) = cons(f(head s), () => map(f, tail s)).

```ts
export function map<T, U>(f: (x: T) => U, s: Stream<T>): Stream<U>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `(x: T) => U` | no |  |
| `s` | `Stream<T>` | no |  |

### Returns

`Stream<U>` — 


## `zipWith`

> Function · `semantics/coinduction/index.ts:143`

`zipWith(f, a, b)`: combina dos streams elemento a elemento.

zipWith(f, a, b) = cons(f(head a, head b), () => zipWith(f, tail a, tail b))

```ts
export function zipWith<A, B, C>(f: (a: A, b: B) => C, a: Stream<A>, b: Stream<B>): Stream<C>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `(a: A, b: B) => C` | no |  |
| `a` | `Stream<A>` | no |  |
| `b` | `Stream<B>` | no |  |

### Returns

`Stream<C>` — 


## `zip`

> Function · `semantics/coinduction/index.ts:153`

`zip(a, b)`: par-zip estándar.

```ts
export function zip<A, B>(a: Stream<A>, b: Stream<B>): Stream<[A, B]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Stream<A>` | no |  |
| `b` | `Stream<B>` | no |  |

### Returns

`Stream<[A, B]>` — 


## `filter`

> Function · `semantics/coinduction/index.ts:162`

`filter(pred, s)`: PRECONDICIÓN — el predicado debe ser satisfecho
infinitas veces, de lo contrario el stream resultante se "atasca".
No protegemos contra eso porque coinductivamente no es decidible.

```ts
export function filter<T>(pred: (x: T) => boolean, s: Stream<T>): Stream<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `pred` | `(x: T) => boolean` | no |  |
| `s` | `Stream<T>` | no |  |

### Returns

`Stream<T>` — 


## `naturals`

> Const · `semantics/coinduction/index.ts:179`

naturals = 0, 1, 2, 3, ...

```ts
const naturals: Stream<number>
```


## `fibonacci`

> Const · `semantics/coinduction/index.ts:204`

```ts
const fibonacci: Stream<number>
```


## `BisimulationProof`

> Interface · `semantics/coinduction/index.ts:208`

```ts
export interface BisimulationProof<T>
```


## `isBisimilar`

> Function · `semantics/coinduction/index.ts:232`

`isBisimilar(a, b, depth)`: chequeo de bisimilaridad acotado.
Compara cabezas hasta profundidad `depth`. Retorna `false` apenas
encuentra una divergencia (refutación constructiva); retorna `true`
si los primeros `depth` elementos coinciden (evidencia positiva
acotada — para una prueba real de bisimilaridad, usar `prove`).

Usa `Object.is` para comparar primitivos. Para tipos compuestos
el caller debería envolver con un equality explícito (no hacemos
deep-equals porque tendría costo no obvio y semántica ambigua).

```ts
export function isBisimilar<T>(a: Stream<T>, b: Stream<T>, depth: number = DEFAULT_DEPTH): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Stream<T>` | no |  |
| `b` | `Stream<T>` | no |  |
| `depth` | `number` | yes |  |

### Returns

`boolean` — 


## `prove`

> Function · `semantics/coinduction/index.ts:294`

`prove(claim, depth)`: aplica la técnica de bisimulación up-to.

Algoritmo: empieza con el par inicial, y para cada paso i ∈ [0, depth):
  1. Verifica que la relación R sostenga el par actual (a_i, b_i).
  2. Verifica que las cabezas sean iguales: head(a_i) = head(b_i).
  3. Avanza: a_{i+1} = tail(a_i), b_{i+1} = tail(b_i).

Si la relación R es genuinamente una bisimulación (clausurada bajo
tail), todos los pasos pasarán para cualquier `depth`. El método
es completo "en el límite": probar para `depth = ∞` ≡ probar bisim.
En la práctica devolvemos true si depth pasos pasaron sin error.

Si la relación falla en algún paso, retornamos false (evidencia de
que R no es una bisimulación, o de que (a, b) no es bisimilar).

```ts
export function prove<T>(claim: BisimulationProof<T>, depth: number = DEFAULT_DEPTH): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `claim` | `BisimulationProof<T>` | no |  |
| `depth` | `number` | yes |  |

### Returns

`boolean` — 


## `interleave`

> Function · `semantics/coinduction/index.ts:318`

`interleave(a, b)`: intercala a, b, a, b, ... toma 1 de a luego 1 de b.

interleave(a, b) = cons(head a, () => interleave(b, tail a))

Nota: el "switch" entre a y b se hace por el truco clásico:
llamar recursivamente con los argumentos invertidos.

```ts
export function interleave<T>(a: Stream<T>, b: Stream<T>): Stream<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Stream<T>` | no |  |
| `b` | `Stream<T>` | no |  |

### Returns

`Stream<T>` — 


## `scan`

> Function · `semantics/coinduction/index.ts:329`

`scan(f, init, s)`: prefijos acumulados; análogo a Array.prototype.reduce
pero coinductivo. scan(+, 0, naturals) = 0, 0, 1, 3, 6, 10, ...

```ts
export function scan<T, U>(f: (acc: U, x: T) => U, init: U, s: Stream<T>): Stream<U>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `(acc: U, x: T) => U` | no |  |
| `init` | `U` | no |  |
| `s` | `Stream<T>` | no |  |

### Returns

`Stream<U>` — 


## `__internals`

> Const · `semantics/coinduction/index.ts:338`

```ts
const __internals
```

