# `runtime/csp-hoare/analysis.ts`

============================================================ CSP Hoare — Trazas, failures, deadlock, livelock, refinement ============================================================ Sobre la LTS definida en `semantics.ts` calculamos las semánticas observacionales clásicas de CSP:   • traces(P)   — conjunto de prefijos de eventos visibles posibles.   • failures(P) — pares (traza, refusal). El conjunto de refusal es el                   conjunto de eventos que el proceso PUEDE rehusar tras                   esa traza, bajo ALGUNA resolución del no-determinismo. Refinement (notación CSP estándar):   P ⊑_T Q   ⇔   traces(Q) ⊆ traces(P)   P ⊑_F Q   ⇔   traces(Q) ⊆ traces(P) ∧ failures(Q) ⊆ failures(P) Intuición: Q refina a P sii Q es "más predecible" / "más determinista". STOP es el refinement máximo: refina todo lo que tenga traza vacía. ============================================================

## Contents

- [`traces`](#traces) — Function
- [`failures`](#failures) — Function
- [`isDeadlocked`](#isdeadlocked) — Function
- [`isLiveLocked`](#islivelocked) — Function
- [`refinesTraces`](#refinestraces) — Function
- [`refinesFailures`](#refinesfailures) — Function

## `traces`

> Function · `runtime/csp-hoare/analysis.ts:34`

Enumera todas las trazas de `p` hasta longitud `maxLength` (inclusive).
Incluye la traza vacía (siempre presente) y los prefijos intermedios.

Las trazas se devuelven sin duplicados, ordenadas por longitud
ascendente, y como copias de arrays inmutables (las modificaciones no
afectan el motor).

```ts
export function traces(p: Process, maxLength = 6): Trace[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Process` | no |  |
| `maxLength` | `any` | yes |  |

### Returns

`Trace[]` — 


## `failures`

> Function · `runtime/csp-hoare/analysis.ts:102`

Calcula failures hasta `maxLength`. Para cada traza alcanzable, registra
los refusal sets posibles iterando todas las resoluciones internas del
estado tras la traza.

Devuelve una lista (no un set) porque los refusal sets son objetos —
agrupamos por igualdad estructural y deduplicamos manualmente.

```ts
export function failures(p: Process, maxLength = 4): FailurePair[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Process` | no |  |
| `maxLength` | `any` | yes |  |

### Returns

`FailurePair[]` — 


## `isDeadlocked`

> Function · `runtime/csp-hoare/analysis.ts:168`

Hay deadlock si el proceso no ofrece NINGÚN evento (ni siquiera ✓) en
ALGUNA resolución interna alcanzable desde el estado inicial.

En `STOP` el chequeo es trivial: `nextEvents(STOP) = ∅`.

```ts
export function isDeadlocked(p: Process): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Process` | no |  |

### Returns

`boolean` — 


## `isLiveLocked`

> Function · `runtime/csp-hoare/analysis.ts:184`

Detección heurística de livelock: el proceso recorre eventos ocultos
(τ) indefinidamente sin avanzar visiblemente. Implementación: chequea
si la profundidad de despliegues internos excede `depth` sin ofrecer
eventos visibles.

No es decisión: usamos límite acotado. Útil para advertir sobre `μX.X`
o `(a → STOP) \ {a}` con loop.

```ts
export function isLiveLocked(p: Process, depth = 32): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Process` | no |  |
| `depth` | `any` | yes |  |

### Returns

`boolean` — 


## `refinesTraces`

> Function · `runtime/csp-hoare/analysis.ts:250`

P ⊑_T Q : Q refina a P en trazas sii cada traza de Q es traza de P.
Equivalentemente: Q no puede hacer nada que P no pudiera observar.

```ts
export function refinesTraces(spec: Process, impl: Process, maxLength = 6): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `spec` | `Process` | no |  |
| `impl` | `Process` | no |  |
| `maxLength` | `any` | yes |  |

### Returns

`boolean` — 


## `refinesFailures`

> Function · `runtime/csp-hoare/analysis.ts:267`

P ⊑_F Q : refinamiento en failures. Q refina a P sii:
  (a) traces(Q) ⊆ traces(P)
  (b) failures(Q) ⊆ failures(P)

Una falla `(t, R)` de Q debe poder ser exhibida también por P. Esto
capta el principio de que Q es "menos no-determinista" que P.

```ts
export function refinesFailures(spec: Process, impl: Process, maxLength = 4): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `spec` | `Process` | no |  |
| `impl` | `Process` | no |  |
| `maxLength` | `any` | yes |  |

### Returns

`boolean` — 

