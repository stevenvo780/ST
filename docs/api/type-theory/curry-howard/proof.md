# `type-theory/curry-howard/proof.ts`

============================================================ Curry-Howard — Conversión bidireccional term ↔ ProofTree ============================================================ term → proof: caminamos el λ-term anotado y emitimos el árbol de deducción natural correspondiente. El contexto de tipado se duplica como conjunto de supuestos disponibles. proof → term: por inducción sobre las reglas usadas, fabricamos el λ-término. Cada `axiom` produce una variable libre cuyo nombre lo trae el árbol (`assumption`). Las reglas que descargan supuestos (→I, ∨E) los reflejan en `discharged`, lo que nos da el binder del λ. Round-trip: term → proof → term preserva el tipo inferido. (No necesariamente preserva el término sintácticamente — bajo β- equivalencia tampoco se pretende: `proofToTerm(termToProof(t))` devuelve t en los casos directos cubiertos por los tests.)

## Contents

- [`ProofConversionError`](#proofconversionerror) — Class
- [`termToProof`](#termtoproof) — Function
- [`proofToTerm`](#prooftoterm) — Function
- [`proofIsConsistent`](#proofisconsistent) — Function

## `ProofConversionError`

> Class · `type-theory/curry-howard/proof.ts:24`

```ts
export class ProofConversionError extends Error
```


## `termToProof`

> Function · `type-theory/curry-howard/proof.ts:27`

```ts
export function termToProof(term: LambdaTerm, ctx: Context =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `LambdaTerm` | no |  |
| `ctx` | `Context` | yes |  |

### Returns

`ProofTree` — 


## `proofToTerm`

> Function · `type-theory/curry-howard/proof.ts:149`

```ts
export function proofToTerm(proof: ProofTree): LambdaTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `ProofTree` | no |  |

### Returns

`LambdaTerm` — 


## `proofIsConsistent`

> Function · `type-theory/curry-howard/proof.ts:235`

```ts
export function proofIsConsistent(proof: ProofTree): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `ProofTree` | no |  |

### Returns

`boolean` — 

