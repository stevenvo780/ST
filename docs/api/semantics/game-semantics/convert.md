# `semantics/game-semantics/convert.ts`

============================================================ Conversión IPCFormula ↔ IntuitFormula ============================================================ Reutilizamos el prover NJ existente (`profiles/intuitionistic-nj`) como oráculo de validez para certificar "existe estrategia ganadora". Por el teorema de Lorenzen-Felscher: P tiene estrategia ganadora en el juego dialógico sobre φ sii φ es demostrable en NJ (equivalentemente, válida en IPC).

## `toIntuit`

> Function · `semantics/game-semantics/convert.ts:21`

```ts
export function toIntuit(f: IPCFormula): IntuitFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `IPCFormula` | no |  |

### Returns

`IntuitFormula` — 

