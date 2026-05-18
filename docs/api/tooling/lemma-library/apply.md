# `tooling/lemma-library/apply.ts`

============================================================ tryApplyLemma — pattern matching simple goal ↔ lema Heurística: tokeniza el goal y cada lema, busca aquellos cuyo "esqueleto" estructural (símbolos lógicos) sea subsequence del goal, y propone sustituciones de las metavariables (P, Q, R, …, φ, ψ, x, y, z, a, b, c, n, m) al primer no-variable encontrado en posición correspondiente. ============================================================

## `tryApplyLemma`

> Function · `tooling/lemma-library/apply.ts:63`

Devuelve los lemas de `library` cuyo esqueleto estructural es
subsequence del goal. Si se encuentra el más específico (mayor
cantidad de tokens estructurales), añade las sustituciones.

```ts
export function tryApplyLemma(goal: string, library: LemmaLibrary): LemmaApplicationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `goal` | `string` | no |  |
| `library` | `LemmaLibrary` | no |  |

### Returns

`LemmaApplicationResult` — 

