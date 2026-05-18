# `logic/profile-bridge/index.ts`

============================================================ ST Profile Bridge — traducciones cross-profile ============================================================ Implementa las traducciones clásicas entre perfiles lógicos:   intuitionistic → classical  (Glivenko ¬¬-translation)   classical      → S4         (Gödel-McKinsey-Tarski □-embedding)   LTL            → CTL        (embedding conservativo uno-a-uno)   CTL            → LTL        (aproximación parcial, paths existenciales)   fuzzy          → classical  (aproximación por umbral 0.5) Grafo de traducciones:   intuitionistic ──(Glivenko)──→ classical ──(Gödel)──→ S4                                                             ↑   LTL ──(ltlToCTL)──→ CTL ─────────────────────────────────┘   CTL ──(ctlToLTL)──→ LTL  (partial, one-way) ============================================================

## Contents

- [`Profile`](#profile) — Type
- [`GenericFormula`](#genericformula) — Interface
- [`Validity`](#validity) — Type
- [`Translation`](#translation) — Interface
- [`glivenkoTranslation`](#glivenkotranslation) — Function
- [`godelTranslation`](#godeltranslation) — Function
- [`ltlToCTL`](#ltltoctl) — Function
- [`ctlToLTL`](#ctltoltl) — Function
- [`TRANSLATIONS`](#translations) — Const
- [`findTranslationPath`](#findtranslationpath) — Function
- [`translateFormula`](#translateformula) — Function

## `Profile`

> Type · `logic/profile-bridge/index.ts:26`

```ts
export type Profile = 'classical' | 'intuitionistic' | 'S4' | 'LTL' | 'CTL' | 'fuzzy';
```


## `GenericFormula`

> Interface · `logic/profile-bridge/index.ts:28`

```ts
export interface GenericFormula
```


## `Validity`

> Type · `logic/profile-bridge/index.ts:33`

```ts
export type Validity = 'preserved' | 'one-way' | 'partial';
```


## `Translation`

> Interface · `logic/profile-bridge/index.ts:35`

```ts
export interface Translation
```


## `glivenkoTranslation`

> Function · `logic/profile-bridge/index.ts:63`

Aplica la traducción ¬¬ de Glivenko recursivamente.

Reglas (Glivenko 1929):
  atom p         → ¬¬p
  ¬φ             → ¬¬(¬φ')        = ¬φ'     (¬¬¬ ≡ ¬)
  φ ∧ ψ          → ¬¬(φ' ∧ ψ')
  φ ∨ ψ          → ¬¬(φ' ∨ ψ')
  φ → ψ          → ¬¬(φ' → ψ')
  φ ↔ ψ          → ¬¬(φ' ↔ ψ')
  ⊤              → ⊤
  ⊥              → ⊥

Resultado: clásicamente válido si y solo si el original lo es en IPC.

```ts
export function glivenkoTranslation(intuitFormula: unknown): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `intuitFormula` | `unknown` | no |  |

### Returns

`Formula` — 


## `godelTranslation`

> Function · `logic/profile-bridge/index.ts:112`

Aplica la traducción de Gödel-McKinsey-Tarski: clasical → S4.

Reglas (Gödel 1933):
  atom p         → □p
  ¬φ             → □¬φ'
  φ ∧ ψ          → φ' ∧ ψ'
  φ ∨ ψ          → φ' ∨ ψ'
  φ → ψ          → □(φ' → ψ')
  φ ↔ ψ          → □(φ' ↔ ψ')
  ⊤              → ⊤
  ⊥              → ⊥

Corrección: φ es tautología clásica sii godelTranslation(φ) es
tautología S4 (Gödel 1933, McKinsey-Tarski 1948).

```ts
export function godelTranslation(classicalFormula: unknown): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `classicalFormula` | `unknown` | no |  |

### Returns

`Formula` — 


## `ltlToCTL`

> Function · `logic/profile-bridge/index.ts:166`

```ts
export function ltlToCTL(ltlFormula: unknown): CTLFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ltlFormula` | `unknown` | no |  |

### Returns

`CTLFormula` — 


## `ctlToLTL`

> Function · `logic/profile-bridge/index.ts:229`

```ts
export function ctlToLTL(ctlFormula: unknown): LTLFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctlFormula` | `unknown` | no |  |

### Returns

`LTLFormula` — 


## `TRANSLATIONS`

> Const · `logic/profile-bridge/index.ts:306`

```ts
const TRANSLATIONS: Translation[]
```


## `findTranslationPath`

> Function · `logic/profile-bridge/index.ts:358`

Encuentra la ruta más corta desde `from` hasta `to` en el grafo
de traducciones disponibles (BFS).

Devuelve la secuencia de perfiles [from, ..., to] o null si no hay ruta.

```ts
export function findTranslationPath(from: Profile, to: Profile): Profile[] | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `from` | `Profile` | no |  |
| `to` | `Profile` | no |  |

### Returns

`Profile[] \| null` — 


## `translateFormula`

> Function · `logic/profile-bridge/index.ts:386`

Traduce una fórmula genérica al perfil `target` siguiendo el camino
de traducciones más corto disponible.

Devuelve null si no existe ruta desde `formula.profile` hasta `target`.

```ts
export function translateFormula(formula: GenericFormula, target: Profile): GenericFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `GenericFormula` | no |  |
| `target` | `Profile` | no |  |

### Returns

`GenericFormula \| null` — 

