# `runtime/fallacies.ts`

============================================================ ST Runtime — Detector de Falacias Lógicas ============================================================ Analiza un argumento (premisas + conclusión) buscando patrones conocidos de falacias formales. Diseñado para educación en humanidades. ============================================================

## Contents

- [`FallacyInfo`](#fallacyinfo) — Interface
- [`detectFallacies`](#detectfallacies) — Function

## `FallacyInfo`

> Interface · `runtime/fallacies.ts:14`

Información sobre una falacia detectada.

```ts
export interface FallacyInfo
```


## `detectFallacies`

> Function · `runtime/fallacies.ts:387`

Ejecuta todos los detectores de falacias sobre un argumento.

```ts
export function detectFallacies( premises: Formula[], conclusion: Formula, profile: LogicProfile, ): FallacyInfo[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `premises` | `Formula[]` | no | Lista de fórmulas-premisa. |
| `conclusion` | `Formula` | no | Fórmula-conclusión. |
| `profile` | `LogicProfile` | no | Perfil lógico activo (para contexto futuro). |

### Returns

`FallacyInfo[]` — Lista de falacias detectadas (vacía si el argumento parece correcto).

