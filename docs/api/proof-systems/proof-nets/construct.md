# `proof-systems/proof-nets/construct.ts`

============================================================ Proof Nets — Construcción a partir de un secuente ============================================================ Dado ⊢ Γ con Γ una lista de fórmulas MLL, esta construcción produce un net candidato:   1. Para cada fórmula F_i de Γ se construye recursivamente su      "árbol de descomposición": cada nodo interno se cablea con      el link correspondiente (⊗ o ⅋), terminando en hojas que      son átomos.   2. Los átomos hoja se emparejan por pares duales (A con A⊥)      vía axiom links. El pairing es greedy: para cada átomo      libre busca su primer dual libre. El net producido puede o no ser correcto: si Γ no es probable en MLL la correctitud Danos-Regnier fallará. Las conclusiones son las raíces de los árboles de descomposición.

## `constructFromSequent`

> Function · `proof-systems/proof-nets/construct.ts:62`

```ts
export function constructFromSequent(formulas: MLLFormula[]): ProofNet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formulas` | `MLLFormula[]` | no |  |

### Returns

`ProofNet` — 

