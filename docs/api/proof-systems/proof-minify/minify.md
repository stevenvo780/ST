# `proof-systems/proof-minify/minify.ts`

============================================================ ST Proof Minification — Núcleo ============================================================ Transformaciones puras sobre árboles de pruebas. Ninguna operación muta el input — siempre se clonan los nodos al construir el output. Soundness: cada regla preserva la conclusión raíz y la conformidad estructural (premises siempre válidas, sin referencias colgantes). El minificador NO re-checkea la prueba — asume que el input ya es válido. Determinismo: las pasadas se aplican en orden fijo (detrivialize → compact-mp → cut-elimination-local → remove-unused). El bucle global termina cuando una iteración no cambia el árbol o se alcanza `maxIterations`.

## Contents

- [`countNodes`](#countnodes) — Function
- [`depthOf`](#depthof) — Function
- [`compactModusPonensChain`](#compactmodusponenschain) — Function
- [`removeUnusedSubproofs`](#removeunusedsubproofs) — Function
- [`minifyProof`](#minifyproof) — Function

## `countNodes`

> Function · `proof-systems/proof-minify/minify.ts:126`

Cuenta los nodos de un árbol (raíz incluida).

```ts
export function countNodes(n: GenericProofNode): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `GenericProofNode` | no |  |

### Returns

`number` — 


## `depthOf`

> Function · `proof-systems/proof-minify/minify.ts:133`

Profundidad máxima (raíz = 0).

```ts
export function depthOf(n: GenericProofNode): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `GenericProofNode` | no |  |

### Returns

`number` — 


## `compactModusPonensChain`

> Function · `proof-systems/proof-minify/minify.ts:242`

```ts
export function compactModusPonensChain(proof: GenericProofNode): GenericProofNode
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `GenericProofNode` | no |  |

### Returns

`GenericProofNode` — 


## `removeUnusedSubproofs`

> Function · `proof-systems/proof-minify/minify.ts:410`

```ts
export function removeUnusedSubproofs(proof: GenericProofNode): GenericProofNode
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `GenericProofNode` | no |  |

### Returns

`GenericProofNode` — 


## `minifyProof`

> Function · `proof-systems/proof-minify/minify.ts:527`

Minifica un árbol de pruebas iterando las reglas hasta punto fijo
o agotar `maxIterations`.

```ts
export function minifyProof(proof: GenericProofNode, opts: MinifyOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `GenericProofNode` | no |  |
| `opts` | `MinifyOptions` | yes |  |

### Returns

`MinifyResult` — 

