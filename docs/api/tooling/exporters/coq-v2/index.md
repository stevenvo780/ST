# `tooling/exporters/coq-v2/index.ts`

============================================================ ST Exporters — Coq code generator V2 ============================================================ Mejoras sobre v1:   - Tactics derivadas: auto / tauto / firstorder / intuition / lia / omega.   - Dependent types: forall x : nat / forall x : Type, ...   - Generación de hints: Hint Resolve, Hint Rewrite.   - Proof terms (lambda) además de tactics, o "both". Mantiene coq/index.ts (v1) intacto: ambos coexisten. ============================================================

## Contents

- [`CoqEmitMode`](#coqemitmode) — Type
- [`CoqV2ExportOptions`](#coqv2exportoptions) — Interface
- [`inferDependentSorts`](#inferdependentsorts) — Function
- [`formulaToCoqType`](#formulatocoqtype) — Function
- [`TacticStrategy`](#tacticstrategy) — Type
- [`chooseStrategy`](#choosestrategy) — Function
- [`ndProofToProofTerm`](#ndprooftoproofterm) — Function
- [`generateHints`](#generatehints) — Function
- [`exportToCoqV2`](#exporttocoqv2) — Function
- [`exportProofToCoqV2`](#exportprooftocoqv2) — Function
- [`exportTheoryToCoqV2`](#exporttheorytocoqv2) — Function

## `CoqEmitMode`

> Type · `tooling/exporters/coq-v2/index.ts:18`

```ts
export type CoqEmitMode = 'tactic' | 'proofterm' | 'both';
```


## `CoqV2ExportOptions`

> Interface · `tooling/exporters/coq-v2/index.ts:20`

```ts
export interface CoqV2ExportOptions
```


## `inferDependentSorts`

> Function · `tooling/exporters/coq-v2/index.ts:47`

Heurística simple: si una variable aparece como argumento de un predicado
aritmético (`<`, `>`, `+`, `=`, etc.) la consideramos `nat`. Si aparece
en un predicado simbólico, la consideramos `Prop`. Default: `Type`.

```ts
export function inferDependentSorts(formula: unknown): Map<string, string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `unknown` | no |  |

### Returns

`Map<string, string>` — 


## `formulaToCoqType`

> Function · `tooling/exporters/coq-v2/index.ts:138`

Convierte una fórmula ST en un tipo Coq, con cuantificadores tipados según
la inferencia dependiente. Caso por defecto: Prop.

```ts
export function formulaToCoqType(formula: unknown): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `unknown` | no |  |

### Returns

`string` — 


## `TacticStrategy`

> Type · `tooling/exporters/coq-v2/index.ts:264`

```ts
export type TacticStrategy = | 'auto' | 'tauto' | 'firstorder' | 'intuition' | 'lia' | 'omega' | 'reflexivity' | 'admit' | 'custom';
```


## `chooseStrategy`

> Function · `tooling/exporters/coq-v2/index.ts:285`

Elige la mejor tactic automática según las features de la fórmula.
Reglas (ordenadas):
  1. equality syntactically idéntica (a = a) → reflexivity.
  2. aritmética puramente lineal (<, >, +, -, =, lia) → lia.
  3. cuantificadores de primer orden con predicados → firstorder.
  4. propositional clásico con ∨ + ¬ → tauto.
  5. propositional con implicaciones encadenadas → intuition.
  6. fallback → auto.

```ts
export function chooseStrategy(formula: unknown): TacticStrategy
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `unknown` | no |  |

### Returns

`TacticStrategy` — 


## `ndProofToProofTerm`

> Function · `tooling/exporters/coq-v2/index.ts:448`

Genera un proof term (lambda) directo desde un Proof object.
Soporta patrones básicos: identidad, MP, conjunción/disyunción intro-elim.
Para casos no manejados devuelve un placeholder con TODO.

```ts
export function ndProofToProofTerm(proof: unknown): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `unknown` | no |  |

### Returns

`string` — 


## `generateHints`

> Function · `tooling/exporters/coq-v2/index.ts:537`

Genera líneas `Hint Resolve` / `Hint Rewrite` para una base `stdb`.
- Axiomas con head implicación → `Hint Resolve`.
- Igualdades universales → `Hint Rewrite`.
- Theorems "obvios" (identidad, P→P) también van como Hint Resolve.

```ts
export function generateHints(axioms: unknown[], theorems: unknown[]): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `axioms` | `unknown[]` | no |  |
| `theorems` | `unknown[]` | no |  |

### Returns

`string[]` — 


## `exportToCoqV2`

> Function · `tooling/exporters/coq-v2/index.ts:598`

Exporta una fórmula ST a Coq como módulo V2 con tactic strategy automática.

```ts
export function exportToCoqV2(formula: unknown, opts?: CoqV2ExportOptions): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `unknown` | no |  |
| `opts` | `CoqV2ExportOptions` | yes |  |

### Returns

`string` — 


## `exportProofToCoqV2`

> Function · `tooling/exporters/coq-v2/index.ts:648`

Exporta un Proof ST a Coq como módulo V2, derivando tactics desde steps
y, opcionalmente, un proof term reconstruido.

```ts
export function exportProofToCoqV2(proof: unknown, opts?: CoqV2ExportOptions): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `unknown` | no |  |
| `opts` | `CoqV2ExportOptions` | yes |  |

### Returns

`string` — 


## `exportTheoryToCoqV2`

> Function · `tooling/exporters/coq-v2/index.ts:688`

Exporta una teoría completa: axiomas + theorems con hints derivados.

```ts
export function exportTheoryToCoqV2( axioms: unknown[], theorems: unknown[], opts?: CoqV2ExportOptions, ): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `axioms` | `unknown[]` | no |  |
| `theorems` | `unknown[]` | no |  |
| `opts` | `CoqV2ExportOptions` | yes |  |

### Returns

`string` — 

