# `reasoning/number-theory/crt.ts`

============================================================ Chinese Remainder Theorem generalizado. ============================================================ Resuelve un sistema de congruencias { x ≡ r_i (mod m_i) }. No exige módulos coprimos: si hay módulos compartidos, fusiona usando Bézout y devuelve null si el sistema es inconsistente. Resultado: solución mínima no-negativa y módulo combinado lcm(m_i).

## Contents

- [`Congruence`](#congruence) — Interface
- [`crt`](#crt) — Function

## `Congruence`

> Interface · `reasoning/number-theory/crt.ts:12`

```ts
export interface Congruence
```


## `crt`

> Function · `reasoning/number-theory/crt.ts:17`

```ts
export function crt(congruences: Congruence[]):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `congruences` | `Congruence[]` | no |  |

### Returns

`{ solution: bigint; modulus: bigint } \| null` — 

