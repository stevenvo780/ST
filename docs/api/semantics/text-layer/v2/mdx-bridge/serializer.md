# `semantics/text-layer/v2/mdx-bridge/serializer.ts`

Claim[] → MDX serializer.

Produce MDX con bloques sincronizables en formato 'comment' o 'fence'.
El round-trip `mdxToClaims(claimsToMDX(claims))` reproduce los campos
lógicos (id, formula, profile, dependencies) sin pérdida.

## `claimsToMDX`

> Const · `semantics/text-layer/v2/mdx-bridge/serializer.ts:69`

Claim[] → MDX string.

Separa cada bloque con doble newline. El orden de salida respeta el
orden del array de entrada.

```ts
const claimsToMDX
```

