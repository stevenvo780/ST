# `reasoning/model-checking/index.ts`

============================================================ ST Model Checking — Explicit-state model checker ============================================================ Verificación de propiedades sobre sistemas de transiciones finitos (Kripke structures) mediante exploración explícita del espacio de estados:   - Reachability: BFS desde estados iniciales con cota opcional.   - Safety (G p / invariant p): DFS que falla en el primer     estado donde p no se cumple y devuelve traza desde inicial.   - Liveness (GF p, FG p): exploración con detección de ciclos     accesibles (lasso = stem + loop) para encontrar contraejemplos     o testigos.   - Bounded model checking: BFS truncado a profundidad k.   - Detección de deadlock: estado alcanzable sin sucesores. El espacio de estados es genérico: el usuario provee una función `successors`, una función `hash` (clave canónica para detección de visitados) y `labels` (proposiciones atómicas que hold en el estado, opcional para uso futuro con LTL completo). Diseño:   - Cada estado se canoniza por `hash(s)` (string). El usuario     debe garantizar que estados equivalentes produzcan el mismo     hash, y estados distintos hashes distintos.   - Trazas y lassos se devuelven como arrays de S (no de hashes)     para que el caller pueda inspeccionar los estados.   - Las funciones nunca lanzan: cap `maxStates` para evitar     explosión combinatoria sobre sistemas no acotados. Convención: las propiedades reciben un estado y devuelven boolean; se asume que son puras y deterministas sobre el estado. ── Tipos básicos ───────────────────────────────────────────

## Contents

- [`StateSpace`](#statespace) — Interface
- [`ReachabilityResult`](#reachabilityresult) — Interface
- [`SafetyResult`](#safetyresult) — Interface
- [`LivenessResult`](#livenessresult) — Interface
- [`DeadlockResult`](#deadlockresult) — Interface
- [`reachableStates`](#reachablestates) — Function
- [`checkSafety`](#checksafety) — Function
- [`checkInvariant`](#checkinvariant) — Function
- [`bmc`](#bmc) — Function
- [`hasDeadlock`](#hasdeadlock) — Function
- [`checkAlwaysEventually`](#checkalwayseventually) — Function
- [`checkEventuallyAlways`](#checkeventuallyalways) — Function
- [`MutexProcState`](#mutexprocstate) — Type
- [`MutexState`](#mutexstate) — Interface
- [`mutualExclusionSpace`](#mutualexclusionspace) — Function
- [`PhilState`](#philstate) — Type
- [`DiningState`](#diningstate) — Interface
- [`diningPhilosophersSpace`](#diningphilosophersspace) — Function
- [`RWState`](#rwstate) — Interface
- [`readerWriterSpace`](#readerwriterspace) — Function

## `StateSpace`

> Interface · `reasoning/model-checking/index.ts:37`

```ts
export interface StateSpace<S>
```


## `ReachabilityResult`

> Interface · `reasoning/model-checking/index.ts:50`

```ts
export interface ReachabilityResult<S>
```


## `SafetyResult`

> Interface · `reasoning/model-checking/index.ts:59`

```ts
export interface SafetyResult<S>
```


## `LivenessResult`

> Interface · `reasoning/model-checking/index.ts:67`

```ts
export interface LivenessResult<S>
```


## `DeadlockResult`

> Interface · `reasoning/model-checking/index.ts:73`

```ts
export interface DeadlockResult<S>
```


## `reachableStates`

> Function · `reasoning/model-checking/index.ts:94`

Calcula el conjunto de estados alcanzables desde los estados
iniciales del espacio. BFS por nivel; se detiene al agotar la
frontera o al alcanzar `maxStates`.

```ts
export function reachableStates<S>( space: StateSpace<S>, opts: ReachabilityOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `space` | `StateSpace<S>` | no |  |
| `opts` | `ReachabilityOpts` | yes |  |

### Returns

`ReachabilityResult<S>` — 


## `checkSafety`

> Function · `reasoning/model-checking/index.ts:173`

Verifica que `predicate` se cumple en *todos* los estados
alcanzables. Si encuentra un estado violador, devuelve una
traza mínima desde algún initial hasta él. Equivale a G p.

```ts
export function checkSafety<S>( space: StateSpace<S>, predicate: (s: S) => boolean, opts: ReachabilityOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `space` | `StateSpace<S>` | no |  |
| `predicate` | `(s: S) => boolean` | no |  |
| `opts` | `ReachabilityOpts` | yes |  |

### Returns

`SafetyResult<S>` — 


## `checkInvariant`

> Function · `reasoning/model-checking/index.ts:220`

Alias semántico: invariante = safety check con el mismo predicado.

```ts
export function checkInvariant<S>( space: StateSpace<S>, invariant: (s: S) => boolean, opts: ReachabilityOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `space` | `StateSpace<S>` | no |  |
| `invariant` | `(s: S) => boolean` | no |  |
| `opts` | `ReachabilityOpts` | yes |  |

### Returns

`SafetyResult<S>` — 


## `bmc`

> Function · `reasoning/model-checking/index.ts:237`

BMC: busca un estado donde `predicate` falla dentro de los
primeros `depth` pasos desde initial. No certifica safety
global; sirve para encontrar contraejemplos cortos.

`depth=0` solo evalúa estados iniciales.

```ts
export function bmc<S>( space: StateSpace<S>, predicate: (s: S) => boolean, depth: number, ): SafetyResult<S>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `space` | `StateSpace<S>` | no |  |
| `predicate` | `(s: S) => boolean` | no |  |
| `depth` | `number` | no |  |

### Returns

`SafetyResult<S>` — 


## `hasDeadlock`

> Function · `reasoning/model-checking/index.ts:295`

Detecta el primer estado alcanzable sin sucesores. Devuelve la
traza desde initial hasta ese estado para diagnóstico.

```ts
export function hasDeadlock<S>( space: StateSpace<S>, opts: ReachabilityOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `space` | `StateSpace<S>` | no |  |
| `opts` | `ReachabilityOpts` | yes |  |

### Returns

`DeadlockResult<S>` — 


## `checkAlwaysEventually`

> Function · `reasoning/model-checking/index.ts:622`

GF p: en todo camino infinito, p ocurre infinitas veces.
Contraejemplo: lasso accesible (stem + loop) tal que NINGÚN
estado del loop satisface p (porque entonces existe un camino
infinito que evita p eventualmente).

Algoritmo: SCCs no-triviales accesibles desde initial; si alguna
NO contiene estado p=true → contraejemplo. Si todas las SCCs
no-triviales accesibles contienen al menos un estado p=true,
holds.

```ts
export function checkAlwaysEventually<S>( space: StateSpace<S>, p: (s: S) => boolean, opts: ReachabilityOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `space` | `StateSpace<S>` | no |  |
| `p` | `(s: S) => boolean` | no |  |
| `opts` | `ReachabilityOpts` | yes |  |

### Returns

`LivenessResult<S>` — 


## `checkEventuallyAlways`

> Function · `reasoning/model-checking/index.ts:668`

FG p: existe un punto a partir del cual p siempre holds.

Holds sii: existe un lasso accesible cuyo loop está contenido
íntegramente en {s | p(s)}. Es decir, SCC no-trivial accesible
dentro del sub-grafo inducido por p=true.

```ts
export function checkEventuallyAlways<S>( space: StateSpace<S>, p: (s: S) => boolean, opts: ReachabilityOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `space` | `StateSpace<S>` | no |  |
| `p` | `(s: S) => boolean` | no |  |
| `opts` | `ReachabilityOpts` | yes |  |

### Returns

`LivenessResult<S>` — 


## `MutexProcState`

> Type · `reasoning/model-checking/index.ts:709`

```ts
export type MutexProcState = 'idle' | 'waiting' | 'critical';
```


## `MutexState`

> Interface · `reasoning/model-checking/index.ts:710`

```ts
export interface MutexState
```


## `mutualExclusionSpace`

> Function · `reasoning/model-checking/index.ts:716`

```ts
export function mutualExclusionSpace(): StateSpace<MutexState>
```

### Returns

`StateSpace<MutexState>` — 


## `PhilState`

> Type · `reasoning/model-checking/index.ts:766`

```ts
export type PhilState = 'thinking' | 'has_left' | 'eating';
```


## `DiningState`

> Interface · `reasoning/model-checking/index.ts:767`

```ts
export interface DiningState
```


## `diningPhilosophersSpace`

> Function · `reasoning/model-checking/index.ts:772`

```ts
export function diningPhilosophersSpace(n: number): StateSpace<DiningState>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`StateSpace<DiningState>` — 


## `RWState`

> Interface · `reasoning/model-checking/index.ts:858`

```ts
export interface RWState
```


## `readerWriterSpace`

> Function · `reasoning/model-checking/index.ts:864`

```ts
export function readerWriterSpace(numReaders: number): StateSpace<RWState>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `numReaders` | `number` | no |  |

### Returns

`StateSpace<RWState>` — 

