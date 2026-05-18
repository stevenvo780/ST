# `proof-systems/proof-exchange/index.ts`

## Contents

- [`ProofPackage`](#proofpackage) — Interface
- [`canonicalize`](#canonicalize) — Function
- [`hashProof`](#hashproof) — Function
- [`generateKeyPair`](#generatekeypair) — Function
- [`signProof`](#signproof) — Function
- [`verifyProof`](#verifyproof) — Function

## `ProofPackage`

> Interface · `proof-systems/proof-exchange/index.ts:3`

```ts
export interface ProofPackage
```


## `canonicalize`

> Function · `proof-systems/proof-exchange/index.ts:39`

```ts
export function canonicalize(pkg: ProofPackage): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `pkg` | `ProofPackage` | no |  |

### Returns

`string` — 


## `hashProof`

> Function · `proof-systems/proof-exchange/index.ts:45`

```ts
export async function hashProof(pkg: ProofPackage): Promise<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `pkg` | `ProofPackage` | no |  |

### Returns

`Promise<string>` — 


## `generateKeyPair`

> Function · `proof-systems/proof-exchange/index.ts:53`

```ts
export async function generateKeyPair(): Promise<
```

### Returns

`Promise<{   publicKey: CryptoKey;   privateKey: CryptoKey; }>` — 


## `signProof`

> Function · `proof-systems/proof-exchange/index.ts:75`

```ts
export async function signProof( pkg: ProofPackage, privateKey: CryptoKey, ): Promise<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `pkg` | `ProofPackage` | no |  |
| `privateKey` | `CryptoKey` | no |  |

### Returns

`Promise<{ signature: string; algorithm: 'Ed25519' \| 'HMAC-SHA256' }>` — 


## `verifyProof`

> Function · `proof-systems/proof-exchange/index.ts:98`

```ts
export async function verifyProof( pkg: ProofPackage, signature: string, publicKey: CryptoKey | string, ): Promise<boolean>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `pkg` | `ProofPackage` | no |  |
| `signature` | `string` | no |  |
| `publicKey` | `CryptoKey \| string` | no |  |

### Returns

`Promise<boolean>` — 

