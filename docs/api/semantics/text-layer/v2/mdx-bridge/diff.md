# `semantics/text-layer/v2/mdx-bridge/diff.ts`

MDX diff — detecta qué claims cambiaron entre dos versiones de un MDX.

Algoritmo:
  1. Parsear ambas versiones a Claim[] (ignorando bloques malformados).
  2. Indexar por id.
  3. added   = ids en `after` que no estaban en `before`.
     removed = ids en `before` que ya no están en `after`.
     modified = ids en ambos cuyos campos lógicos difieren.

## `diffMDX`

> Const · `semantics/text-layer/v2/mdx-bridge/diff.ts:36`

```ts
const diffMDX
```

