# `runtime/csp-hoare/semantics.ts`

============================================================ CSP Hoare — Semántica operacional (LTS) + alfabetos ============================================================ Implementa un sistema de transición etiquetado (LTS) sobre `Process`:   • `nextEvents(P)` — eventos visibles ofrecidos inmediatamente (sin     resolver elección interna). Para `P ⊓ Q` devolvemos la unión: ambos     son alcanzables vía un paso interno (τ).   • `step(P, a)` — derivada tras un evento visible. Si `a` no está en     `initials(P)`, devuelve `null`. Para los operadores no-deterministas     elegimos cualquier rama que ofrezca `a`. Para las semánticas más finas (failures) exponemos `internalResolutions`, que enumera todos los estados estables (sin τ pendientes) alcanzables mediante choices internos. Esto evita explorar la rama "muerta" de un `P ⊓ Q` cuando solo nos interesa qué puede ofrecer una resolución dada. ============================================================

## Contents

- [`STOP`](#stop) — Const
- [`SKIP`](#skip) — Const
- [`prefix`](#prefix) — Function
- [`choice`](#choice) — Function
- [`internal`](#internal) — Function
- [`parallel`](#parallel) — Function
- [`interleave`](#interleave) — Function
- [`sequence`](#sequence) — Function
- [`hide`](#hide) — Function
- [`rename`](#rename) — Function
- [`recursion`](#recursion) — Function
- [`processVar`](#processvar) — Function
- [`alphabet`](#alphabet) — Function
- [`nextEvents`](#nextevents) — Function
- [`step`](#step) — Function
- [`internalResolutions`](#internalresolutions) — Function

## `STOP`

> Const · `runtime/csp-hoare/semantics.ts:25`

The deadlocked process: offers no events and never terminates.

```ts
const STOP: Process
```


## `SKIP`

> Const · `runtime/csp-hoare/semantics.ts:27`

The successfully terminated process: offers only the tick event `✓`.

```ts
const SKIP: Process
```


## `prefix`

> Function · `runtime/csp-hoare/semantics.ts:30`

Creates a prefixed process `event → cont`.

```ts
export function prefix(event: Event, cont: Process): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `event` | `Event` | no |  |
| `cont` | `Process` | no |  |

### Returns

`Process` — 


## `choice`

> Function · `runtime/csp-hoare/semantics.ts:34`

Creates an external (deterministic) choice `left □ right`.

```ts
export function choice(left: Process, right: Process): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `Process` | no |  |
| `right` | `Process` | no |  |

### Returns

`Process` — 


## `internal`

> Function · `runtime/csp-hoare/semantics.ts:38`

Creates an internal (non-deterministic) choice `left ⊓ right`.

```ts
export function internal(left: Process, right: Process): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `Process` | no |  |
| `right` | `Process` | no |  |

### Returns

`Process` — 


## `parallel`

> Function · `runtime/csp-hoare/semantics.ts:42`

Creates a parallel composition synchronized on the given `alphabet`.

```ts
export function parallel(left: Process, right: Process, alphabet: Event[]): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `Process` | no |  |
| `right` | `Process` | no |  |
| `alphabet` | `Event[]` | no |  |

### Returns

`Process` — 


## `interleave`

> Function · `runtime/csp-hoare/semantics.ts:46`

Creates an interleaving composition (synchronized only on `✓`).

```ts
export function interleave(left: Process, right: Process): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `Process` | no |  |
| `right` | `Process` | no |  |

### Returns

`Process` — 


## `sequence`

> Function · `runtime/csp-hoare/semantics.ts:50`

Creates a sequential composition: `right` starts after `left` terminates.

```ts
export function sequence(left: Process, right: Process): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `Process` | no |  |
| `right` | `Process` | no |  |

### Returns

`Process` — 


## `hide`

> Function · `runtime/csp-hoare/semantics.ts:54`

Creates a hiding operator that conceals `events` from the environment.

```ts
export function hide(process: Process, events: Event[]): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `process` | `Process` | no |  |
| `events` | `Event[]` | no |  |

### Returns

`Process` — 


## `rename`

> Function · `runtime/csp-hoare/semantics.ts:58`

Creates a renaming operator that maps events according to `mapping`.

```ts
export function rename(process: Process, mapping: Map<Event, Event>): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `process` | `Process` | no |  |
| `mapping` | `Map<Event, Event>` | no |  |

### Returns

`Process` — 


## `recursion`

> Function · `runtime/csp-hoare/semantics.ts:62`

Creates a recursive process `μname.body`.

```ts
export function recursion(name: string, body: Process): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `body` | `Process` | no |  |

### Returns

`Process` — 


## `processVar`

> Function · `runtime/csp-hoare/semantics.ts:66`

Creates a process variable reference (for use inside `recursion` bodies).

```ts
export function processVar(name: string): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Process` — 


## `alphabet`

> Function · `runtime/csp-hoare/semantics.ts:78`

Conjunto de eventos visibles mencionados sintácticamente en `p`.
Los eventos renombrados aportan tanto la fuente como el destino
(la fuente puede aparecer en una rama no recorrida, y el destino
es lo que el entorno observa).

```ts
export function alphabet(p: Process): Set<Event>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Process` | no |  |

### Returns

`Set<Event>` — 


## `nextEvents`

> Function · `runtime/csp-hoare/semantics.ts:202`

Eventos visibles que `p` puede ofrecer inmediatamente como su primer
evento (tomando todas las resoluciones internas). No incluye τ (los
eventos ocultos son silenciosos por construcción).

Para `SKIP` reportamos el tick `✓` — termina exitosamente.

```ts
export function nextEvents(p: Process): Set<Event>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Process` | no |  |

### Returns

`Set<Event>` — 


## `step`

> Function · `runtime/csp-hoare/semantics.ts:323`

`step(P, a)` aplica una transición visible etiquetada con `a` y devuelve
el continuante, o `null` si `a` no está habilitado. Para procesos no-
deterministas elegimos arbitrariamente cualquier rama que habilite `a`
(eso es válido para análisis de trazas; para failures inspeccionamos
todas las resoluciones aparte).

```ts
export function step(p: Process, event: Event): Process | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Process` | no |  |
| `event` | `Event` | no |  |

### Returns

`Process \| null` — 


## `internalResolutions`

> Function · `runtime/csp-hoare/semantics.ts:458`

Enumera todos los estados "estables" alcanzables desde `p` resolviendo
elecciones internas (`⊓`) y desplegando recursiones inmediatas, sin
consumir eventos visibles. Útil para la semántica de failures, donde
el conjunto de refusal depende de QUÉ rama interna se eligió.

Devuelve procesos sin un `internal` en la raíz (después de empujarlo
hacia adentro de operadores asociativos cuando aplica). El número de
resoluciones es 2^(# de internals encadenados), así que limitamos a un
número razonable para no explotar.

```ts
export function internalResolutions(p: Process, limit = 64): Process[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Process` | no |  |
| `limit` | `any` | yes |  |

### Returns

`Process[]` — 

