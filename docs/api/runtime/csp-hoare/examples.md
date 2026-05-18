# `runtime/csp-hoare/examples.ts`

============================================================ CSP Hoare — Ejemplos estándar del libro de Hoare (1985) ============================================================ Construcciones canónicas que también sirven como tests integradores de la semántica. ============================================================

## Contents

- [`vendingMachine`](#vendingmachine) — Function
- [`vendingMachineLoop`](#vendingmachineloop) — Function
- [`philosopher`](#philosopher) — Function
- [`diningPhilosophers`](#diningphilosophers) — Function

## `vendingMachine`

> Function · `runtime/csp-hoare/examples.ts:19`

Máquina expendedora simple: acepta una moneda y luego ofrece al
entorno elegir entre té y café.

  VM = coin → ((tea → STOP) □ (coffee → STOP))

Para uso en bucle infinito, ver `vendingMachineLoop`.

```ts
export function vendingMachine(): Process
```

### Returns

`Process` — 


## `vendingMachineLoop`

> Function · `runtime/csp-hoare/examples.ts:24`

Versión recursiva: tras servir, vuelve al estado inicial.

```ts
export function vendingMachineLoop(): Process
```

### Returns

`Process` — 


## `philosopher`

> Function · `runtime/csp-hoare/examples.ts:41`

Filósofo `i` (dining philosophers a la Hoare): toma su tenedor
izquierdo (`L`), luego el derecho (`R`), come, los suelta y repite.

  PHIL_i = picks_up.L → picks_up.R → eats → puts_down.R → puts_down.L → STOP

El bloqueo clásico aparece cuando todos los filósofos toman primero
el izquierdo y luego intentan tomar el derecho: ya nadie lo tendrá
libre. Lo detectamos con `isDeadlocked` sobre la composición paralela.

```ts
export function philosopher(name: string): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Process` — 


## `diningPhilosophers`

> Function · `runtime/csp-hoare/examples.ts:82`

Composición paralela de `n` filósofos circulares con sus tenedores
compartidos. El alfabeto de sincronización es exactamente el conjunto
de eventos `pick.*` y `put.*` que comparten filósofo y fork.

Con `n ≥ 2` y la estrategia ingenua (todos toman primero el izquierdo)
llegamos a deadlock estructural una vez todos hicieron `pick.L`.

```ts
export function diningPhilosophers(n: number): Process
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`Process` — 

