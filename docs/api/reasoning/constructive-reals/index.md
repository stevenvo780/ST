# `reasoning/constructive-reals/index.ts`

============================================================ ST Constructive Reals — Números reales computables ============================================================ Cada real x se representa como una función `approxBig(n)` que devuelve un entero `b` tal que     | x - b / 2^n |  <  2^{-n} (es decir, una aproximación dyádica con cota de error explícita). La función `approx(p)` expuesta como API pública devuelve el par `{ numerator, denominator }` con `denominator = 2^p`, garantizando la misma cota de error |x - numerator/denominator| < 2^{-p}. Esto es esencialmente la formulación de Bishop/Bridges para los reales constructivos: secuencias de Cauchy con módulo explícito de convergencia. No usamos `number` (IEEE-754) excepto como entrada; internamente todo es `bigint`. Operaciones implementadas (todas devuelven CReal):   fromInt, fromRational, neg, abs   add, sub, mul, div   (div: requiere b ≠ 0)   sqrt                  (requiere x ≥ 0)   PI, E, SQRT2          (constantes)   compareWithEpsilon, toString Decisiones de implementación:   • Internamente usamos cache memoizado por precisión: una vez     calculada una aproximación a precisión n, queda guardada.     Esto evita recomputar series largas para PI/E al imprimirlas.   • Las operaciones binarias piden a sus operandos precisiones     mayores (precisión de trabajo) tal que el error acumulado     siga acotado por 2^{-p} en el resultado.   • Para mul/div necesitamos cotas superiores/inferiores sobre     |a| y |b|; las obtenemos consultando una aproximación gruesa     primero, ajustando el tamaño en bits. Nota sobre redondeo: usamos "round half away from zero" para convertir un entero escalado de precisión `n+k` a `n`. La cota de error de redondeo es entonces ≤ 1/2 en la unidad de precisión `n`, equivalente a 2^{-(n+1)}. ============================================================ ── Tipo público ────────────────────────────────────────────

## Contents

- [`CReal`](#creal) — Interface
- [`fromInt`](#fromint) — Function
- [`fromRational`](#fromrational) — Function
- [`neg`](#neg) — Function
- [`abs`](#abs) — Function
- [`add`](#add) — Function
- [`sub`](#sub) — Function
- [`mul`](#mul) — Function
- [`div`](#div) — Function
- [`sqrt`](#sqrt) — Function
- [`compareWithEpsilon`](#comparewithepsilon) — Function
- [`toString`](#tostring) — Function
- [`exp`](#exp) — Function
- [`log`](#log) — Function
- [`sin`](#sin) — Function
- [`cos`](#cos) — Function
- [`pow`](#pow) — Function
- [`PI`](#pi) — Const
- [`E`](#e) — Const
- [`SQRT2`](#sqrt2) — Const
- [`fromFloat`](#fromfloat) — Function
- [`toNumber`](#tonumber) — Function
- [`approxLT`](#approxlt) — Function
- [`approxEq`](#approxeq) — Function
- [`zero`](#zero) — Const
- [`one`](#one) — Const

## `CReal`

> Interface · `reasoning/constructive-reals/index.ts:46`

```ts
export interface CReal
```


## `fromInt`

> Function · `reasoning/constructive-reals/index.ts:143`

```ts
export function fromInt(n: number | bigint): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number \| bigint` | no |  |

### Returns

`CReal` — 


## `fromRational`

> Function · `reasoning/constructive-reals/index.ts:154`

```ts
export function fromRational(p: number | bigint, q: number | bigint): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `number \| bigint` | no |  |
| `q` | `number \| bigint` | no |  |

### Returns

`CReal` — 


## `neg`

> Function · `reasoning/constructive-reals/index.ts:179`

```ts
export function neg(a: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |

### Returns

`CReal` — 


## `abs`

> Function · `reasoning/constructive-reals/index.ts:184`

```ts
export function abs(a: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |

### Returns

`CReal` — 


## `add`

> Function · `reasoning/constructive-reals/index.ts:200`

add(a,b) a precisión p:
  pedimos a y b a precisión p+2.
  error de cada uno < 2^{-(p+2)} → error en a+b < 2·2^{-(p+2)} = 2^{-(p+1)}.
  Al pasar de escala p+2 a p (shift de 2), introducimos error
  de redondeo ≤ 1/2 en la unidad p, = 2^{-(p+1)}.
  Total: < 2^{-(p+1)} + 2^{-(p+1)} = 2^{-p}.  ✓

```ts
export function add(a: CReal, b: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |
| `b` | `CReal` | no |  |

### Returns

`CReal` — 


## `sub`

> Function · `reasoning/constructive-reals/index.ts:210`

```ts
export function sub(a: CReal, b: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |
| `b` | `CReal` | no |  |

### Returns

`CReal` — 


## `mul`

> Function · `reasoning/constructive-reals/index.ts:236`

mul(a,b) a precisión p:
  Necesitamos cotas sobre |a| y |b|. Tomamos una aproximación gruesa
  a precisión 0 para estimar el tamaño en bits.
  Sean |a| ≤ 2^A, |b| ≤ 2^B (con A,B no-negativos).
  Trabajamos a precisión p + A + B + 3.
  En esa escala el producto cabe y la cota de error queda < 2^{-p}.

  Detalle del error: si â = a + ε_a con |ε_a| < 2^{-w} y análogamente
  para b̂ (w = work precision en los operandos), entonces
     â·b̂ - a·b = a·ε_b + b·ε_a + ε_a·ε_b.
  |a·ε_b| ≤ 2^A · 2^{-w}, idem para b.
  Eligiendo w = p + A + B + 3 ese error queda < 2·2^{-(p+B+3)}
  acotado holgadamente por 2^{-(p+1)}, y el shift final añade otro
  2^{-(p+1)}, dando < 2^{-p}.

```ts
export function mul(a: CReal, b: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |
| `b` | `CReal` | no |  |

### Returns

`CReal` — 


## `div`

> Function · `reasoning/constructive-reals/index.ts:291`

div(a,b) a precisión p (b ≠ 0).
  Encontramos k tal que |b| ≥ 2^{-k}.
  Necesitamos también cota superior A_bits sobre |a|.
  Trabajamos a precisión w = p + 2k + A_bits + 4.

  Si â = a + ε_a, b̂ = b + ε_b, entonces
    â/b̂ - a/b = (ε_a · b - a · ε_b) / (b · b̂).
  |b · b̂| ≥ (2^{-k}) · (2^{-k} - 2^{-w}) ≥ 2^{-2k-1}.
  |ε_a · b| ≤ 2^{-w} · (|b̂|+2^{-w}).
  |a · ε_b| ≤ |â+2^{-w}| · 2^{-w}.
  Tomando w = p + 2k + A_bits + 4 acotamos por < 2^{-p}.

```ts
export function div(a: CReal, b: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |
| `b` | `CReal` | no |  |

### Returns

`CReal` — 


## `sqrt`

> Function · `reasoning/constructive-reals/index.ts:326`

sqrt(a) para a ≥ 0. Si a < 0 (detectado con cota), lanza.
Implementación: Newton-Raphson en bigint sobre x² = N donde
N = aprox(a) a precisión 2·prec + buffer. La raíz cuadrada entera
de N da nuestra aproximación a √a a precisión prec.

```ts
export function sqrt(a: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |

### Returns

`CReal` — 


## `compareWithEpsilon`

> Function · `reasoning/constructive-reals/index.ts:381`

compareWithEpsilon(a, b, epsPrec):
  Si |a - b| < 2^{-epsPrec}, devuelve 0 (indistinguibles).
  Si a > b + 2^{-epsPrec}, devuelve 1.
  Si a < b - 2^{-epsPrec}, devuelve -1.

  Implementación: comparamos aproximaciones a precisión epsPrec + 3.
  |aw/2^w - a| < 2^{-w}, idem b. Entonces
    (aw - bw)/2^w  está dentro de  (a - b) ± 2·2^{-w}.
  Eligiendo w = epsPrec + 3:
    • Si (aw - bw) > 2^{w - epsPrec} + 2 = 8 + 2 = 10 (en escala w),
      entonces a - b > 2^{-epsPrec}, devolvemos 1.
    • Análogo para -10.
    • En otro caso, devolvemos 0.

```ts
export function compareWithEpsilon(a: CReal, b: CReal, epsilonPrecision: number): -1 | 0 | 1
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |
| `b` | `CReal` | no |  |
| `epsilonPrecision` | `number` | no |  |

### Returns

`-1 \| 0 \| 1` — 


## `toString`

> Function · `reasoning/constructive-reals/index.ts:402`

toString(r, digits): representación decimal con `digits` dígitos
después del punto. Usa precisión binaria suficiente:
  2^p > 10^digits  ⇔  p > digits · log2(10) ≈ digits · 3.322.
Tomamos p = ceil(digits · 4) + 8 para holgura.

```ts
export function toString(r: CReal, digits: number): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `CReal` | no |  |
| `digits` | `number` | no |  |

### Returns

`string` — 


## `exp`

> Function · `reasoning/constructive-reals/index.ts:439`

exp(x) = Σ x^k / k!. Para que la serie converja rápido reducimos
primero el argumento: escribimos x = q · ln(2) + r con |r| ≤ ln(2)/2
usando q = round(x / ln(2)). Luego exp(x) = 2^q · exp(r).

Para esta versión inicial hacemos una reducción más simple: si
|x| > 1, dividimos por 2^k hasta que |x/2^k| < 1, calculamos
exp(x/2^k) por serie, y elevamos al cuadrado k veces (exp(y)² = exp(2y)).
Esto mantiene la convergencia de la serie acotada a ~prec términos.

```ts
export function exp(x: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `CReal` | no |  |

### Returns

`CReal` — 


## `log`

> Function · `reasoning/constructive-reals/index.ts:500`

```ts
export function log(x: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `CReal` | no |  |

### Returns

`CReal` — 


## `sin`

> Function · `reasoning/constructive-reals/index.ts:585`

```ts
export function sin(x: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `CReal` | no |  |

### Returns

`CReal` — 


## `cos`

> Function · `reasoning/constructive-reals/index.ts:604`

```ts
export function cos(x: CReal): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `CReal` | no |  |

### Returns

`CReal` — 


## `pow`

> Function · `reasoning/constructive-reals/index.ts:626`

pow(a, b) = exp(b · log(a)) para a > 0.
Caso especial: si b es un entero, hacemos exponenciación rápida
sobre CReal para evitar log de a (lo que permite a ≤ 0 si b es entero).

```ts
export function pow(a: CReal, b: CReal | number): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CReal` | no |  |
| `b` | `CReal \| number` | no |  |

### Returns

`CReal` — 


## `PI`

> Const · `reasoning/constructive-reals/index.ts:688`

```ts
const PI: CReal
```


## `E`

> Const · `reasoning/constructive-reals/index.ts:707`

```ts
const E: CReal
```


## `SQRT2`

> Const · `reasoning/constructive-reals/index.ts:719`

```ts
const SQRT2: CReal
```


## `fromFloat`

> Function · `reasoning/constructive-reals/index.ts:737`

Crea un CReal desde un número racional (float). Usa fromInt para enteros.

```ts
export function fromFloat(q: number): CReal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `q` | `number` | no |  |

### Returns

`CReal` — 


## `toNumber`

> Function · `reasoning/constructive-reals/index.ts:751`

Extrae el valor numérico de un CReal.
`precision` es el número de bits fraccionarios solicitados (como pasa `x.approx(p)`).
Para evitar desbordamiento al convertir bigint → number, se acota internamente a 63 bits.
Valores por encima de 63 sólo añaden cómputo sin mejorar la representación en float64.

```ts
export function toNumber(x: CReal, precision = 53): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `CReal` | no |  |
| `precision` | `any` | yes |  |

### Returns

`number` — 


## `approxLT`

> Function · `reasoning/constructive-reals/index.ts:761`

Retorna true si podemos demostrar constructivamente que x < y
a la precisión dada (bits fraccionarios).

```ts
export function approxLT(x: CReal, y: CReal, precision: number): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `CReal` | no |  |
| `y` | `CReal` | no |  |
| `precision` | `number` | no |  |

### Returns

`boolean` — 


## `approxEq`

> Function · `reasoning/constructive-reals/index.ts:772`

Retorna true si |x - y| < 2^{-precision+1} (aproximadamente iguales
a la precisión dada).

```ts
export function approxEq(x: CReal, y: CReal, precision: number): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `CReal` | no |  |
| `y` | `CReal` | no |  |
| `precision` | `number` | no |  |

### Returns

`boolean` — 


## `zero`

> Const · `reasoning/constructive-reals/index.ts:778`

El real constructivo cero.

```ts
const zero: CReal
```


## `one`

> Const · `reasoning/constructive-reals/index.ts:781`

El real constructivo uno.

```ts
const one: CReal
```

