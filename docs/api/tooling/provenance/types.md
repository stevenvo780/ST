# `tooling/provenance/types.ts`

Categoría del nodo dentro del DAG.

- `axiom`: postulado base sin dependencias (puede tener proof=undefined).
- `lemma`: resultado intermedio reusable.
- `theorem`: resultado principal o expuesto al usuario.
- `definition`: introduce una notación o constante (no es proposición).

## Contents

- [`ProvenanceKind`](#provenancekind) — Type
- [`TrustLevel`](#trustlevel) — Type
- [`ProvenanceMetadata`](#provenancemetadata) — Interface
- [`ProvenanceNode`](#provenancenode) — Interface
- [`AuditReport`](#auditreport) — Interface

## `ProvenanceKind`

> Type · `tooling/provenance/types.ts:21`

Categoría del nodo dentro del DAG.

- `axiom`: postulado base sin dependencias (puede tener proof=undefined).
- `lemma`: resultado intermedio reusable.
- `theorem`: resultado principal o expuesto al usuario.
- `definition`: introduce una notación o constante (no es proposición).

```ts
export type ProvenanceKind = 'axiom' | 'lemma' | 'theorem' | 'definition';
```


## `TrustLevel`

> Type · `tooling/provenance/types.ts:29`

Nivel de confianza en el nodo:
- `verified`: probado mecánicamente o aceptado por la audiencia del sistema.
- `admitted`: declarado sin prueba (TODO, sorry, oracle). Se propaga como amarillo.
- `external`: aceptado por referencia a otra herramienta (Lean, Coq, hardware oracle).

```ts
export type TrustLevel = 'verified' | 'admitted' | 'external';
```


## `ProvenanceMetadata`

> Interface · `tooling/provenance/types.ts:37`

Metadata asociada a un nodo. Todo es serializable a JSON puro.
`tool` permite distinguir prueba humana, táctica DSL automática
o checker externo. `durationMs` y `proofSize` son opcionales y
sirven para análisis posterior.

```ts
export interface ProvenanceMetadata
```


## `ProvenanceNode`

> Interface · `tooling/provenance/types.ts:57`

Nodo del DAG de proveniencia. El `id` es derivado determinísticamente
del statement + dependencias (ver `ProvenanceLedger.add`) para que el
mismo statement con las mismas deps reciba siempre el mismo identificador.

```ts
export interface ProvenanceNode
```


## `AuditReport`

> Interface · `tooling/provenance/types.ts:73`

Reporte de auditoría: clasifica dependencias del teorema raíz y
estima riesgo en función de cuánto del DAG es admitido o externo.

```ts
export interface AuditReport
```

