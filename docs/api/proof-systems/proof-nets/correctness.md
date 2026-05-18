# `proof-systems/proof-nets/correctness.ts`

============================================================ Proof Nets — Criterio de corrección de Danos-Regnier ============================================================ Un net MLL es correcto sii para toda elección de "switch" sobre los par-links (cada ⅋ elige una de sus dos premisas para conservar la arista hacia la conclusión, descartando la otra), el grafo resultante es:   - acíclico, y   - conexo. Los demás links contribuyen aristas de forma fija:   axiom  : una arista entre sus dos nodos.   cut    : una arista entre sus dos nodos.   tensor : dos aristas (premisa-izq — conclusión, premisa-der — conclusión).   par    : sólo UNA arista por switch (conclusión — premisa elegida). La validación enumera los 2^(#par) switches. Para MLL el número de par-links en una prueba típica es bajo; si fuera grande, el criterio se puede reformular en tiempo lineal (algoritmo de Guerrini), pero queda fuera del alcance educativo aquí. Además validamos consistencia local del net antes del criterio:   - ports de cada link existen.   - axiom/cut conectan fórmulas duales.   - tensor/par conectan {A, B, A⊗B} resp. {A, B, A⅋B}.   - cada nodo tiene la "valencia" correcta (los átomos terminan     en exactamente un axiom o cut; los compuestos son     premisa/conclusión de su link).

## `isCorrect`

> Function · `proof-systems/proof-nets/correctness.ts:191`

```ts
export function isCorrect(net: ProofNet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `ProofNet` | no |  |

### Returns

`boolean` — 

