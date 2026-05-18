# `proof-systems/certificate/generate.ts`

============================================================ ST Proof Certificate — Generación + firma ============================================================

## Contents

- [`generateCertificate`](#generatecertificate) — Function
- [`generateCertificateKeyPair`](#generatecertificatekeypair) — Function
- [`signCertificate`](#signcertificate) — Function
- [`verifyCertificateSignature`](#verifycertificatesignature) — Function

## `generateCertificate`

> Function · `proof-systems/certificate/generate.ts:109`

Convierte un `Proof` interno de ST en un certificado portable.

Acepta también un "input certificate" plano (sin hash ni firma)
para flujos donde los pasos ya vienen construidos manualmente.

```ts
export async function generateCertificate( proof: Proof | InputCertificate, opts: GenerateOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `Proof \| InputCertificate` | no |  |
| `opts` | `GenerateOptions` | yes |  |

### Returns

`Promise<ProofCertificate>` — 


## `generateCertificateKeyPair`

> Function · `proof-systems/certificate/generate.ts:200`

Genera un par de claves para firmar certificados. Intenta
Ed25519 vía WebCrypto y cae a HMAC-SHA256 si el runtime no lo
soporta. El `publicKey` se devuelve también como hex para
embedderlo dentro del certificado.

```ts
export async function generateCertificateKeyPair(): Promise<
```

### Returns

`Promise<{   privateKey: CryptoKey;   publicKey: CryptoKey;   publicKeyHex: string;   algorithm: 'Ed25519' \| 'HMAC-SHA256'; }>` — 


## `signCertificate`

> Function · `proof-systems/certificate/generate.ts:234`

```ts
export async function signCertificate( cert: Omit<ProofCertificate, 'signature'>, privateKey: CryptoKey, publicKeyHex: string, ): Promise<CertSignature>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cert` | `Omit<ProofCertificate, 'signature'>` | no |  |
| `privateKey` | `CryptoKey` | no |  |
| `publicKeyHex` | `string` | no |  |

### Returns

`Promise<CertSignature>` — 


## `verifyCertificateSignature`

> Function · `proof-systems/certificate/generate.ts:259`

```ts
export async function verifyCertificateSignature(cert: ProofCertificate): Promise<boolean>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cert` | `ProofCertificate` | no |  |

### Returns

`Promise<boolean>` — 

