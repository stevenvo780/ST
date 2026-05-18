# `reasoning/computability/index.ts`

============================================================ ST Computability theory — Turing machines + undecidability ============================================================ Cuatro piezas que aterrizan los resultados clásicos de Turing, Kleene y Rice:   1. Máquina de Turing determinista de una cinta (TM): estados,      alfabeto de cinta, transición parcial, cabeza con movimientos      L/R/S (stay), aceptación/rechazo por estado. Trazas y pasos      explícitos. `run` y `trace` son simulación pura — sin efectos.   2. Halting acotado: dado un budget `maxSteps`, devolvemos      `boolean | 'unknown'`. Esto refleja el hecho de que el problema      de la parada es semi-decidible: si la máquina para dentro del      budget sabemos sí/no; si no, no podemos concluir (no es lo      mismo que "no para").   3. Funciones primitivas recursivas (PRF): cero, sucesor,      proyección, composición y recursión primitiva. `evalPR` corre      la semántica estándar. Constructores PR_ADD, PR_MUL, PR_POW,      PR_FACT, PR_PREDECESSOR para chequear que la maquinaria      compila funciones de aritmética básica. Ackermann queda fuera      (es μ-recursiva, no PR), incluida como tope de potencia.   4. Witness de Rice: cualquier propiedad no trivial sobre el      lenguaje aceptado por una TM es indecidible. Aquí no hay      decisión real (ningún algoritmo puede tener éxito); damos un      explicador que sólo verifica el predicado "es no trivial" sobre      una muestra y devuelve la justificación clásica. Convenciones:   • Cinta = array de símbolos; expansión perezosa con `blank`     hacia ambos lados (se inserta blank cuando la cabeza pasa el     borde). Para no mutar configuraciones previas devolvemos una     copia (`step` y `trace` no comparten estructura).   • Strings de entrada/salida son la concatenación de símbolos.     Para `tmReverseString`, `tmCopy`, etc. el resultado se lee de     la cinta en el rango no-blank al final.   • PRF: usamos `number` con guardas (negativos → error; NaN →     error). No intentamos manejar BigInt aquí — los tests caben en     `number` cómodamente. ============================================================ ── Turing machines ─────────────────────────────────────────

## Contents

- [`TMState`](#tmstate) — Type
- [`TMSymbol`](#tmsymbol) — Type
- [`Direction`](#direction) — Type
- [`TMTransition`](#tmtransition) — Interface
- [`TuringMachine`](#turingmachine) — Interface
- [`TMConfig`](#tmconfig) — Interface
- [`StepResult`](#stepresult) — Type
- [`initialConfig`](#initialconfig) — Function
- [`step`](#step) — Function
- [`RunResult`](#runresult) — Interface
- [`run`](#run) — Function
- [`trace`](#trace) — Function
- [`readTape`](#readtape) — Function
- [`boundedHalts`](#boundedhalts) — Function
- [`tmBinaryIncrement`](#tmbinaryincrement) — Function
- [`tmUnaryParity`](#tmunaryparity) — Function
- [`tmReverseString`](#tmreversestring) — Function
- [`tmCopy`](#tmcopy) — Function
- [`tmAddBinary`](#tmaddbinary) — Function
- [`PRFn`](#prfn) — Type
- [`evalPR`](#evalpr) — Function
- [`PR_ADD`](#pr-add) — Const
- [`PR_MUL`](#pr-mul) — Const
- [`PR_POW`](#pr-pow) — Const
- [`PR_PREDECESSOR`](#pr-predecessor) — Const
- [`PR_FACT`](#pr-fact) — Const
- [`ackermann`](#ackermann) — Function
- [`isInPR`](#isinpr) — Function
- [`riceWitness`](#ricewitness) — Function

## `TMState`

> Type · `reasoning/computability/index.ts:46`

```ts
export type TMState = string;
```


## `TMSymbol`

> Type · `reasoning/computability/index.ts:47`

```ts
export type TMSymbol = string;
```


## `Direction`

> Type · `reasoning/computability/index.ts:48`

```ts
export type Direction = 'L' | 'R' | 'S';
```


## `TMTransition`

> Interface · `reasoning/computability/index.ts:50`

```ts
export interface TMTransition
```


## `TuringMachine`

> Interface · `reasoning/computability/index.ts:58`

```ts
export interface TuringMachine
```


## `TMConfig`

> Interface · `reasoning/computability/index.ts:69`

```ts
export interface TMConfig
```


## `StepResult`

> Type · `reasoning/computability/index.ts:76`

```ts
export type StepResult = TMConfig | 'halted-accept' | 'halted-reject' | 'no-transition';
```


## `initialConfig`

> Function · `reasoning/computability/index.ts:83`

Inicializa una configuración a partir de la entrada. La cinta arranca
con los símbolos de `input`, cabeza en 0. Si la entrada es vacía la
cinta arranca con un blank.

```ts
export function initialConfig(M: TuringMachine, input: string): TMConfig
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `TuringMachine` | no |  |
| `input` | `string` | no |  |

### Returns

`TMConfig` — 


## `step`

> Function · `reasoning/computability/index.ts:102`

Un paso de la TM. Devuelve la próxima configuración o un terminal.
  • Si el estado actual ya es de aceptación → 'halted-accept'.
  • Si es de rechazo → 'halted-reject'.
  • Si no hay transición desde (state, leído) → 'no-transition'.

```ts
export function step(M: TuringMachine, config: TMConfig): StepResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `TuringMachine` | no |  |
| `config` | `TMConfig` | no |  |

### Returns

`StepResult` — 


## `RunResult`

> Interface · `reasoning/computability/index.ts:138`

```ts
export interface RunResult
```


## `run`

> Function · `reasoning/computability/index.ts:148`

Corre la TM hasta aceptar, rechazar, agotarse o quedar sin transición.
`maxSteps` defaultea a 10_000.

```ts
export function run(M: TuringMachine, input: string, maxSteps = 10_000): RunResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `TuringMachine` | no |  |
| `input` | `string` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`RunResult` — 


## `trace`

> Function · `reasoning/computability/index.ts:165`

Lista todas las configuraciones generadas, hasta `maxSteps`.
Incluye la configuración inicial. No incluye un sentinel para terminal.

```ts
export function trace(M: TuringMachine, input: string, maxSteps: number): TMConfig[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `TuringMachine` | no |  |
| `input` | `string` | no |  |
| `maxSteps` | `number` | no |  |

### Returns

`TMConfig[]` — 


## `readTape`

> Function · `reasoning/computability/index.ts:183`

Lectura útil de la cinta: la subcadena no-blank más larga centrada en
la región explorada. Sirve para validar máquinas que escriben output
en la cinta (binary increment, reverse, copy, etc.).

```ts
export function readTape(M: TuringMachine, config: TMConfig): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `TuringMachine` | no |  |
| `config` | `TMConfig` | no |  |

### Returns

`string` — 


## `boundedHalts`

> Function · `reasoning/computability/index.ts:200`

Halting acotado: ¿la TM para en ≤ `maxSteps` pasos?
  • `true` si para por aceptación, rechazo o falta de transición.
  • `false` técnicamente nunca se devuelve aquí — para devolver
    `false` con certeza haría falta resolver el halting problem, que
    es indecidible. Cuando agotamos el budget devolvemos `'unknown'`.
Esta función es semi-decidible: reconoce las máquinas que paran,
pero no decide el lenguaje complemento (las que no paran).

```ts
export function boundedHalts( M: TuringMachine, input: string, maxSteps: number, ): boolean | 'unknown'
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `TuringMachine` | no |  |
| `input` | `string` | no |  |
| `maxSteps` | `number` | no |  |

### Returns

`boolean \| 'unknown'` — 


## `tmBinaryIncrement`

> Function · `reasoning/computability/index.ts:218`

Incrementa un número binario (MSB first) en la cinta.
Algoritmo: ir al final, retroceder convirtiendo 1→0 mientras haya
acarreo; al primer 0 escribir 1 y aceptar. Si todo era 1, escribir
1 al borde izquierdo y aceptar.

```ts
export function tmBinaryIncrement(): TuringMachine
```

### Returns

`TuringMachine` — 


## `tmUnaryParity`

> Function · `reasoning/computability/index.ts:247`

Acepta sii la cantidad de 1s en la entrada (sobre alfabeto {1}) es par.
Estados q0 = par hasta ahora, q1 = impar.

```ts
export function tmUnaryParity(): TuringMachine
```

### Returns

`TuringMachine` — 


## `tmReverseString`

> Function · `reasoning/computability/index.ts:282`

Revierte una cadena sobre {a, b}. Algoritmo:
  1. Marcar inicio (Sa, Sb) con un símbolo distintivo.
  2. Encontrar el final y desplazar el símbolo del frente al fondo.
  3. Repetir hasta agotar.
Output: la cinta termina con el reverso de la entrada original.

Implementación con cinta auxiliar a la derecha (más simple):
  Caminar a la derecha mientras se copian símbolos en orden inverso
  tras un separador. Al terminar borrar la entrada original.

Para evitar complicaciones, esta versión usa una técnica de
"shift left after marking": tras leer un símbolo, lo borra y lo
reescribe al final del bloque restante.

Nota: este algoritmo es O(n²) en pasos pero correcto.

```ts
export function tmReverseString(): TuringMachine
```

### Returns

`TuringMachine` — 


## `tmCopy`

> Function · `reasoning/computability/index.ts:498`

Copia w → w#w sobre {a, b}. El '#' se inserta automáticamente y la
copia queda a la derecha. Algoritmo análogo a reverse pero copiando
en orden directo (marcamos cada símbolo procesado con mayúscula).

```ts
export function tmCopy(): TuringMachine
```

### Returns

`TuringMachine` — 


## `tmAddBinary`

> Function · `reasoning/computability/index.ts:606`

Suma con `a` en binario y `b` en unario, formato "<a>+<b>" donde
  a ∈ {0,1}* (MSB-first), b ∈ {1}*.

Mantener `b` unario evita la coreografía de decremento binario (que
agrega ~10 estados sin enseñar nada nuevo) y muestra claramente la
técnica de "incrementar `a` una vez por cada token de `b`".

Algoritmo:
  1. Ir al final.
  2. Si la última posición es '1' (un token de b), borrarlo y entrar
     en `incA`: incrementar `a` y luego volver al final.
  3. Si la última posición es '+' (b vacío), borrarlo: la cinta queda
     con sólo `a` (el resultado).

```ts
export function tmAddBinary(): TuringMachine
```

### Returns

`TuringMachine` — 


## `PRFn`

> Type · `reasoning/computability/index.ts:693`

```ts
export type PRFn = | { kind: 'zero' } | { kind: 'succ' } | { kind: 'proj'; n: number; i: number } // U^n_i(x1,...,xn) = x_i (1-indexed) | { kind: 'comp'; outer: PRFn; inner: PRFn[] } | { kind: 'rec'; base: PRFn; step: PRFn };
```


## `evalPR`

> Function · `reasoning/computability/index.ts:713`

Semántica de PRF:
  • zero()           = 0
  • succ(x)          = x + 1
  • U^n_i(x1..xn)    = x_i
  • comp(h, g1..gk)(x1..xn) = h(g1(x1..xn), ..., gk(x1..xn))
  • rec(base, step):
      f(0, x1..xn)     = base(x1..xn)
      f(y+1, x1..xn)   = step(y, f(y, x1..xn), x1..xn)

El argumento "iterado" es el primero (convención común). `args[0]` es
el contador en `rec`.

```ts
export function evalPR(f: PRFn, args: number[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `PRFn` | no |  |
| `args` | `number[]` | no |  |

### Returns

`number` — 


## `PR_ADD`

> Const · `reasoning/computability/index.ts:765`

Suma: add(0, y) = y, add(x+1, y) = succ(add(x, y))
  base = U^1_1 (identidad en y)
  step = succ ∘ U^3_2 (toma f(x,y) y le aplica succ)

En nuestra convención args[0] es el contador → add(x, y).

```ts
const PR_ADD: PRFn
```


## `PR_MUL`

> Const · `reasoning/computability/index.ts:776`

Multiplicación: mul(0, y) = 0, mul(x+1, y) = add(mul(x,y), y)
  base = zero (después de proyectar y fuera)
  step = add(f(x,y), y)

base: el caso 0 → 0. Es la función constante 0 sobre 1 argumento:
  const0(y) = zero ∘ U^1_1, pero zero ignora sus argumentos.
  En este eval, zero retorna 0 sin importar args.

```ts
const PR_MUL: PRFn
```


## `PR_POW`

> Const · `reasoning/computability/index.ts:784`

```ts
const PR_POW: PRFn
```


## `PR_PREDECESSOR`

> Const · `reasoning/computability/index.ts:790`

Predecesor: pred(0) = 0, pred(x+1) = x.
  rec con base = zero, step = U^2_1 (devuelve y, el contador previo).

```ts
const PR_PREDECESSOR: PRFn
```


## `PR_FACT`

> Const · `reasoning/computability/index.ts:801`

Factorial: fact(0) = 1, fact(x+1) = mul(succ(x), fact(x)).

En recursión: contador y, acumulador f(y), sin args extra. Step recibe
(y, f(y)) y debe devolver mul(succ(y), f(y)).

Cuidado: aquí args[0]=y es el "k" del bucle (0-indexed), por lo que
succ(y) = y+1 = el siguiente número a multiplicar.

```ts
const PR_FACT: PRFn
```


## `ackermann`

> Function · `reasoning/computability/index.ts:819`

Función de Ackermann (Peter):
  A(0, n) = n + 1
  A(m+1, 0) = A(m, 1)
  A(m+1, n+1) = A(m, A(m+1, n))

Crece más rápido que toda PRF: A(m, n) es la prueba canónica de que
existen funciones recursivas totales no primitivas recursivas.

Implementación iterativa por stack para esquivar el call-stack JS.

```ts
export function ackermann(m: number, n: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `m` | `number` | no |  |
| `n` | `number` | no |  |

### Returns

`number` — 


## `isInPR`

> Function · `reasoning/computability/index.ts:852`

Test heurístico de "esta función podría ser PR": evalúa la función
sobre `samples` puntos pequeños y la compara con el patrón de
crecimiento de Ackermann (que escapa a PR). Es estrictamente una
heurística — no es un decisor.

  • Si la función supera a A(samples, samples) en algún punto pequeño
    → likely = false (probablemente no es PR).
  • Si nunca crece más rápido que cuadrático/exponencial moderado →
    likely = true.

```ts
export function isInPR( f: (n: number) => number, samples = 4, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `(n: number) => number` | no |  |
| `samples` | `any` | yes |  |

### Returns

`{ likely: boolean; estimate?: number }` — 


## `riceWitness`

> Function · `reasoning/computability/index.ts:893`

Rice (1953): toda propiedad **no trivial** sobre el lenguaje aceptado
por una TM (es decir, sobre el comportamiento input/output observable)
es **indecidible**.

No podemos *decidir* la propiedad — eso es justo lo que el teorema
niega. Lo que sí podemos es **verificar el predicado de Rice**: la
propiedad debe ser

  1. extensional (depende sólo del lenguaje, no del código),
  2. no vacía (alguna TM la satisface),
  3. no total (alguna TM no la satisface).

Esta función toma el predicado, lo evalúa sobre un muestreo finito de
TMs conocidas y, si encuentra una `M0` que la satisface y una `M1`
que no, devuelve `undecidable = true` con explicación. Si todas las
TMs de la muestra dan la misma respuesta no podemos concluir nada
(la propiedad podría ser trivial, o la muestra puede ser muy chica).

```ts
export function riceWitness( property: (m: TuringMachine) => boolean, sampleSize = 5, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `property` | `(m: TuringMachine) => boolean` | no |  |
| `sampleSize` | `any` | yes |  |

### Returns

`{ undecidable: boolean; explanation: string }` — 

