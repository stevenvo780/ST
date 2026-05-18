# `reasoning/ban-logic/analyze.ts`

============================================================ BAN Logic — Saturación de estado + análisis de protocolos ============================================================ `saturate(state)` aplica las reglas R1-R10 en forward-chaining hasta punto fijo (o cota de iteraciones). Devuelve la lista de fórmulas inferidas en orden de derivación (trace). `analyzeProtocol(p)` toma un Protocol con assumptions, steps y goals; idealiza los mensajes (cada step produce `P ◁ msg` para el receptor), satura, y reporta cuáles goals quedaron satisfechos.

## Contents

- [`SaturateOptions`](#saturateoptions) — Interface
- [`saturate`](#saturate) — Function
- [`idealize`](#idealize) — Function
- [`analyzeProtocol`](#analyzeprotocol) — Function

## `SaturateOptions`

> Interface · `reasoning/ban-logic/analyze.ts:29`

```ts
export interface SaturateOptions
```


## `saturate`

> Function · `reasoning/ban-logic/analyze.ts:62`

Aplica las reglas BAN al estado hasta punto fijo. Devuelve el estado
saturado y la lista de derivaciones nuevas (no incluye las iniciales).

```ts
export function saturate( initial: ReadonlyArray<BANFormula>, opts?: SaturateOptions, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `initial` | `ReadonlyArray<BANFormula>` | no |  |
| `opts` | `SaturateOptions` | yes |  |

### Returns

`{ state: BANFormula[]; trace: BANFormula[] }` — 


## `idealize`

> Function · `reasoning/ban-logic/analyze.ts:120`

Idealización mínima: cada step `from → to: msg` produce la
fórmula `to ◁ msg`. Asumimos que el receptor literalmente ve el
mensaje que se le envía.

(BAN tradicional pide idealización manual para descartar texto
inseguro como nombres en claro; aquí preservamos todos los
subtérminos, que es la lectura conservadora.)

```ts
export function idealize(p: Protocol): BANFormula[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Protocol` | no |  |

### Returns

`BANFormula[]` — 


## `analyzeProtocol`

> Function · `reasoning/ban-logic/analyze.ts:128`

Analiza un protocolo: parte de las assumptions + idealización,
satura, y verifica goals.

```ts
export function analyzeProtocol(p: Protocol, opts?: SaturateOptions): ProtocolAnalysis
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Protocol` | no |  |
| `opts` | `SaturateOptions` | yes |  |

### Returns

`ProtocolAnalysis` — 

