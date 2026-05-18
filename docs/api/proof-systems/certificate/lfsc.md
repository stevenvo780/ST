# `proof-systems/certificate/lfsc.ts`

============================================================ ST Proof Certificate — LFSC-style import/export ============================================================ LFSC (Logical Framework with Side Conditions) usa sintaxis S-expression. Aquí hacemos un subset adaptado al certificado:   (proof :version "1.0"     :goal "<formula>"     :profile "<profile>"     :axioms ( "<axiom1>" "<axiom2>" )     :steps (       (step :id s1 :rule axiom :args ( "p" ) :conclusion "p" :depends ( ))       ...     )     :hash "<hex>"     [:signature (sig :algorithm Ed25519 :public-key "<hex>" :signature "<hex>")]   ) El round-trip (export → import) preserva la estructura literal; no se re-hashea ni se reordena.

## Contents

- [`exportLFSC`](#exportlfsc) — Function
- [`importLFSC`](#importlfsc) — Function

## `exportLFSC`

> Function · `proof-systems/certificate/lfsc.ts:70`

Exporta un certificado al subset LFSC. La salida es texto
S-expression con keywords `:foo` para los campos.

```ts
export function exportLFSC(cert: ProofCertificate): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cert` | `ProofCertificate` | no |  |

### Returns

`string` — 


## `importLFSC`

> Function · `proof-systems/certificate/lfsc.ts:309`

Importa un certificado desde su forma LFSC. Devuelve `{ error }`
en caso de fallo de parseo en lugar de lanzar — para que el
caller decida.

```ts
export function importLFSC(input: string): ProofCertificate |
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`ProofCertificate \| { error: string }` — 

