# `runtime/pi-calculus/reduction.ts`

============================================================ π-calculus — semántica de reducción (operacional). ============================================================ Reglas básicas (relación →):   COMM     c̄⟨v⟩.P | c(x).Q   →   P | Q[x := v]   PAR      P → P'   ⇒   P|Q → P'|Q   RES      P → P'   ⇒   (νc) P → (νc) P'   STRUCT   P ≡ P' → Q' ≡ Q   ⇒   P → Q     (congruencia estructural)   SUM      P → P'   ⇒   P + Q → P'         (elige rama y descarta otra)   REPL     !P → P | !P                      (unfold de replicación)   MATCH    [x = x].P  →  P                  (match exitoso) La función `reduce(p)` devuelve el conjunto de todos los procesos inmediatamente sucesores; un proceso sin sucesores está deadlocked. ============================================================

## Contents

- [`reduce`](#reduce) — Function
- [`isDeadlocked`](#isdeadlocked) — Function
- [`trace`](#trace) — Function

## `reduce`

> Function · `runtime/pi-calculus/reduction.ts:152`

Devuelve todos los procesos sucesores tras un paso de reducción.

Implementa la regla COMM atravesando new (canales restringidos pueden
comunicar internamente: scope extrusion básica intra-scope) y desplegando
replicaciones lazy. Match se evalúa al pasar.

Si el resultado es vacío, no hay comunicación posible (deadlock o
proceso terminal).

```ts
export function reduce(p: PiProcess): PiProcess[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `PiProcess` | no |  |

### Returns

`PiProcess[]` — 


## `isDeadlocked`

> Function · `runtime/pi-calculus/reduction.ts:378`

`isDeadlocked(p)`: `true` si no hay ninguna reducción posible.
Incluye procesos terminales (`0`, `0 | 0`, etc.) y procesos con
prefijos que no pueden sincronizar por incompatibilidad de canales.

```ts
export function isDeadlocked(p: PiProcess): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `PiProcess` | no |  |

### Returns

`boolean` — 


## `trace`

> Function · `runtime/pi-calculus/reduction.ts:387`

`trace(p, maxSteps)`: explora una traza determinista (elige el
primer sucesor en cada paso). Útil para inspección, no pretende ser
una semántica completa. Se detiene en deadlock o tras `maxSteps`.

```ts
export function trace(p: PiProcess, maxSteps: number = 100): PiProcess[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `PiProcess` | no |  |
| `maxSteps` | `number` | yes |  |

### Returns

`PiProcess[]` — 

