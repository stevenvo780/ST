# `reasoning/citation-reasoning/derive.ts`

============================================================ ST Citation Reasoning — deriveWithCitations + explainProof ============================================================

## Contents

- [`Evaluator`](#evaluator) — Type
- [`deriveWithCitations`](#derivewithcitations) — Function
- [`explainProof`](#explainproof) — Function

## `Evaluator`

> Type · `reasoning/citation-reasoning/derive.ts:17`

Evaluador externo que el caller provee.
Recibe premisas (en orden: citadas primero, luego locales), el goal y el
perfil lógico dominante; devuelve { valid, proof? }.

```ts
export type Evaluator = ( premises: string[], goal: string, profile: string, ) => Promise<{ valid: boolean; proof?: unknown }>;
```


## `deriveWithCitations`

> Function · `reasoning/citation-reasoning/derive.ts:53`

Ejecuta una derivación que combina premisas de documentos externos (citations)
con premisas locales para intentar demostrar `goal`.

Contrato:
- Las citas se ordenan por `weight` descendente (mayor peso = premisa más
  fuerte primero). Empates se resuelven por `id` lexicográfico.
- El evaluador recibe: [...formulas_citadas_ordenadas, ...localPremises].
- Si no hay citas, la derivación es puramente local.
- La traza incluye un paso por cada citación y uno por cada premisa local,
  más el paso de conclusión.

```ts
export async function deriveWithCitations( derivation: CitationDerivation, evaluator: Evaluator, ): Promise<CitationDerivationResult>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `derivation` | `CitationDerivation` | no |  |
| `evaluator` | `Evaluator` | no |  |

### Returns

`Promise<CitationDerivationResult>` — 


## `explainProof`

> Function · `reasoning/citation-reasoning/derive.ts:182`

Genera una explicación en lenguaje natural de una prueba formal,
referenciando las citas que participaron como premisas.

Si `proof` es null/undefined devuelve un mensaje genérico.

```ts
export function explainProof(proof: unknown, citations: CitedClaim[]): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `unknown` | no |  |
| `citations` | `CitedClaim[]` | no |  |

### Returns

`string` — 

