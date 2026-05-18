# `reasoning/mechanism-design/vcg.ts`

============================================================ VCG mechanism (Vickrey-Clarke-Groves) ============================================================ El VCG mechanism elige la allocation que maximiza social welfare (suma de valuations reportadas). Cobra a cada agente la "externalidad" que impone sobre el resto: la diferencia entre el welfare máximo de los OTROS agentes cuando él NO participa y el welfare de los OTROS en la allocation elegida. Esta implementación cubre dos regímenes: 1. Single-item per agent (caso default): cada agente puede recibir    a lo sumo 1 item, cada item se asigna a lo sumo 1 agente.    Resolvemos el problema de asignación máxima por enumeración    (Hungarian sería más eficiente pero alcanza para los tamaños    de test, n ≤ ~8). 2. Combinatorial (bundles): si las valuations incluyen claves que    representan combinaciones — convención: outcomes "*" significa    "todos los items" — el algoritmo enumera particiones de items    en agentes y elige la de mayor welfare. Por simplicidad y para    los tests, asumimos que las claves del Map son subconjuntos de    items separados por "+" o son items individuales. Para el caso combinatorial usamos enumeración exhaustiva de asignaciones agente→bundle (cada item al primer agente que lo quiera con mayor valor o sin asignar). Esto es exponencial en items pero claro y suficiente para tests pequeños. Strategy-proof: VCG es DSIC (dominant-strategy incentive-compatible). Verificamos esta propiedad empíricamente vía `isStrategyProof`.

## Contents

- [`vcgMechanism`](#vcgmechanism) — Function
- [`socialWelfare`](#socialwelfare) — Function
- [`isStrategyProof`](#isstrategyproof) — Function

## `vcgMechanism`

> Function · `reasoning/mechanism-design/vcg.ts:214`

VCG mechanism: allocation maximiza welfare; pago de cada agente =
externalidad = (welfare óptimo de los demás cuando él NO participa)
               - (welfare de los demás en la allocation elegida).

Devuelve allocation y payments. Payments son ≥ 0 si valuations son
monotónicas (las nuestras lo son).

```ts
export function vcgMechanism(agents: Agent[], items: string[]): MechanismOutcome
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `agents` | `Agent[]` | no |  |
| `items` | `string[]` | no |  |

### Returns

`MechanismOutcome` — 


## `socialWelfare`

> Function · `reasoning/mechanism-design/vcg.ts:247`

Welfare social bajo una allocation: suma de valuations de los agentes
por lo que recibieron.

```ts
export function socialWelfare(outcome: MechanismOutcome, agents: Agent[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `outcome` | `MechanismOutcome` | no |  |
| `agents` | `Agent[]` | no |  |

### Returns

`number` — 


## `isStrategyProof`

> Function · `reasoning/mechanism-design/vcg.ts:268`

Strategy-proofness empírica: tomamos `samples` reportes aleatorios de
un agente (manteniendo a los demás truthful), corremos el mechanism,
y verificamos que la utilidad del agente que miente no supere la
utilidad reportando truthfully. Si para alguna sample el misreport
mejora estrictamente, retornamos false.

Utilidad cuasi-lineal: v(allocation_i) - payment_i.

Esto es probabilístico: con `samples=0` no chequeamos nada y devolvemos
true. Útil sobretodo para testing.

```ts
export function isStrategyProof( mechanism: (agents: Agent[]) => MechanismOutcome, samples: number = 50, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `mechanism` | `(agents: Agent[]) => MechanismOutcome` | no |  |
| `samples` | `number` | yes |  |

### Returns

`boolean` — 

