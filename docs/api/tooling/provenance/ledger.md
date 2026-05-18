# `tooling/provenance/ledger.ts`

============================================================ ST Provenance Ledger — DAG de teoremas/lemas/axiomas + auditoría Determinístico, in-memory. La identidad de un nodo se deriva de (statement, dependencies, kind) — el mismo enunciado con las mismas deps recibe siempre el mismo id, lo que permite usar el ledger como tabla de contenido compartible. ============================================================

## Contents

- [`ProvenanceLedger`](#provenanceledger) — Class
- [`auditTheorem`](#audittheorem) — Function
- [`provenanceToCertificate`](#provenancetocertificate) — Function

## `ProvenanceLedger`

> Class · `tooling/provenance/ledger.ts:46`

```ts
export class ProvenanceLedger
```


## `auditTheorem`

> Function · `tooling/provenance/ledger.ts:390`

Genera un reporte humano-legible sobre la confianza en `theoremId`.

Estimación de riesgo:
- `low`: 100% verified.
- `medium`: al menos 1 admitted o external pero <30% del DAG.
- `high`: >=30% admitted+external, o un axioma fundamental marcado como external.

```ts
export function auditTheorem(theoremId: string, ledger: ProvenanceLedger): AuditReport
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theoremId` | `string` | no |  |
| `ledger` | `ProvenanceLedger` | no |  |

### Returns

`AuditReport` — 


## `provenanceToCertificate`

> Function · `tooling/provenance/ledger.ts:438`

Convierte un nodo + su cadena a una forma compatible con el
certificado de prueba existente. No reemplaza al generador real:
sirve para que el agente pueda exportar el contexto de proveniencia
cuando publica un teorema.

```ts
export function provenanceToCertificate(node: ProvenanceNode, ledger: ProvenanceLedger): unknown
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `node` | `ProvenanceNode` | no |  |
| `ledger` | `ProvenanceLedger` | no |  |

### Returns

`unknown` — 

