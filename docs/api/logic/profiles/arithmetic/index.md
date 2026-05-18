# `logic/profiles/arithmetic/index.ts`

============================================================ ST Arithmetic Profile — Evaluación aritmética ============================================================ Perfil opcional que permite operaciones aritméticas (+, -, *, /, %) y comparaciones (<, >, <=, >=) dentro de fórmulas ST. Uso: `logic arithmetic` Sin este perfil cargado, el parser reconoce la sintaxis aritmética pero el intérprete no puede evaluar las expresiones numéricas. ============================================================

## Contents

- [`evalNumeric`](#evalnumeric) — Function
- [`ArithmeticProfile`](#arithmeticprofile) — Class

## `evalNumeric`

> Function · `logic/profiles/arithmetic/index.ts:22`

```ts
export function evalNumeric(f: Formula, vars?: Map<string, number>, trace?: string[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `vars` | `Map<string, number>` | yes |  |
| `trace` | `string[]` | yes |  |

### Returns

`number` — 


## `ArithmeticProfile`

> Class · `logic/profiles/arithmetic/index.ts:112`

```ts
export class ArithmeticProfile implements LogicProfile
```

