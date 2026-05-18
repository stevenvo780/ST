# `logic/profiles/sequent-g3/latex.ts`

============================================================ G3 — Export de arboles de prueba a LaTeX (bussproofs) ============================================================ Genera codigo bussproofs valido para LaTeX. Cada nodo del arbol produce un bloque \AxiomC / \UnaryInfC / \BinaryInfC con la regla anotada en \RightLabel. La raiz queda envuelta en un $\DisplayProof$ para ser inmediatamente renderizable.

## `proofToLatex`

> Function · `logic/profiles/sequent-g3/latex.ts:109`

Convierte un `ProofTree` G3 en codigo LaTeX bussproofs listo para
embeberse dentro de un documento. Asume `\usepackage{bussproofs}`.

```ts
export function proofToLatex(proof: ProofTree): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `ProofTree` | no |  |

### Returns

`string` — 

