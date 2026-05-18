# `proof-systems/certificate/canonical.ts`

============================================================ ST Proof Certificate — Canonicalization & hashing ============================================================

## Contents

- [`normalizeFormula`](#normalizeformula) — Function
- [`canonicalize`](#canonicalize) — Function
- [`hashCertificate`](#hashcertificate) — Function

## `normalizeFormula`

> Function · `proof-systems/certificate/canonical.ts:39`

Normaliza una fórmula textual: trim + colapsar whitespace
interno a un solo espacio. Idempotente.

```ts
export function normalizeFormula(formula: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `string` | no |  |

### Returns

`string` — 


## `canonicalize`

> Function · `proof-systems/certificate/canonical.ts:49`

Serializa el certificado a su forma canónica determinística
(JSON con claves ordenadas alfabéticamente y sin whitespace).
Excluye `hash` y `signature` para permitir calcular el hash y
la firma sobre exactamente la misma representación.

```ts
export function canonicalize(cert: Omit<ProofCertificate, 'hash' | 'signature'>): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cert` | `Omit<ProofCertificate, 'hash' \| 'signature'>` | no |  |

### Returns

`string` — 


## `hashCertificate`

> Function · `proof-systems/certificate/canonical.ts:77`

SHA-256 hex del certificado canonicalizado (sin hash ni firma).

```ts
export async function hashCertificate( cert: Omit<ProofCertificate, 'hash' | 'signature'>, ): Promise<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cert` | `Omit<ProofCertificate, 'hash' \| 'signature'>` | no |  |

### Returns

`Promise<string>` — 

