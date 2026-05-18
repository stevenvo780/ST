# `logic/profiles/substructural/prover.ts`

============================================================ Substructural Prover — Linear & Affine (backward search) ============================================================ Calculo de secuentes intuicionistico bi-zonal para ILL (Intuitionistic Linear Logic) + variante afin:   Σ ; Γ ⊢ A donde:   - Σ es la "zona unrestricted": contiene los argumentos de `!`     ya derelictados. Sobre Σ, contraction y weakening son libres     (de modo implicito: Σ se duplica/descarta sin coste).   - Γ es la "zona lineal": cada formula debe usarse exactamente     una vez (afin: a lo sumo una vez, weakening libre sobre Γ). Esto evita los loops infinitos del enfoque con regla explicita de contraction sobre `!A`, manteniendo expresividad equivalente. Reglas (clave):   axiom              Σ ; A ⊢ A          (linear)   axiom (afin)       Σ ; Γ, A ⊢ A       (descartando Γ por weakening)   axiom (unrestr.)   Σ, A ; · ⊢ A       (afin) o Σ, A ; · ⊢ A en linear                        — copia A desde Σ   oneR               Σ ; · ⊢ 1          (Γ vacio en linear; en afin                                          tambien con Γ no vacio)   oneL               Σ ; Γ, 1 ⊢ C  ↪  Σ ; Γ ⊢ C   tensorR            Σ ; Γ1, Γ2 ⊢ A⊗B  ↪  Σ;Γ1 ⊢ A  ∧  Σ;Γ2 ⊢ B   tensorL            Σ ; Γ, A⊗B ⊢ C    ↪  Σ ; Γ, A, B ⊢ C   lollipopR          Σ ; Γ ⊢ A⊸B       ↪  Σ ; Γ, A ⊢ B   lollipopL          Σ;Γ1,Γ2,A⊸B ⊢ C   ↪  Σ;Γ1 ⊢ A  ∧  Σ;Γ2, B ⊢ C   withR              Σ ; Γ ⊢ A & B     ↪  Σ;Γ ⊢ A  ∧  Σ;Γ ⊢ B   withL1 / withL2    Σ ; Γ, A&B ⊢ C    ↪  Σ ; Γ, A ⊢ C  (o B)   plusR1 / plusR2    Σ ; Γ ⊢ A⊕B       ↪  Σ;Γ ⊢ A  (o B)   plusL              Σ ; Γ, A⊕B ⊢ C    ↪  Σ;Γ,A ⊢ C  ∧  Σ;Γ,B ⊢ C   bangR              Σ ; · ⊢ !A        ↪  Σ ; · ⊢ A                       (en linear Γ debe estar vacio; en afin se                        permite Γ ⊆ formulas no-bang descartables)   bangL (promote)    Σ ; Γ, !A ⊢ C     ↪  Σ, A ; Γ ⊢ C                       (mueve A a la zona unrestricted, "abriendo"                        contraction y weakening implicitos)

## Contents

- [`formulaKey`](#formulakey) — Function
- [`ProveOptions`](#proveoptions) — Interface
- [`ProveResult`](#proveresult) — Interface
- [`proveLinear`](#provelinear) — Function
- [`proveAffine`](#proveaffine) — Function
- [`proofToString`](#prooftostring) — Function

## `formulaKey`

> Function · `logic/profiles/substructural/prover.ts:47`

```ts
export function formulaKey(f: LinearFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LinearFormula` | no |  |

### Returns

`string` — 


## `ProveOptions`

> Interface · `logic/profiles/substructural/prover.ts:495`

```ts
export interface ProveOptions
```


## `ProveResult`

> Interface · `logic/profiles/substructural/prover.ts:499`

```ts
export interface ProveResult
```


## `proveLinear`

> Function · `logic/profiles/substructural/prover.ts:523`

```ts
export function proveLinear(seqInput: LinearSequent, options?: ProveOptions): LinearProof | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seqInput` | `LinearSequent` | no |  |
| `options` | `ProveOptions` | yes |  |

### Returns

`LinearProof \| null` — 


## `proveAffine`

> Function · `logic/profiles/substructural/prover.ts:528`

```ts
export function proveAffine(seqInput: LinearSequent, options?: ProveOptions): LinearProof | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seqInput` | `LinearSequent` | no |  |
| `options` | `ProveOptions` | yes |  |

### Returns

`LinearProof \| null` — 


## `proofToString`

> Function · `logic/profiles/substructural/prover.ts:533`

```ts
export function proofToString(p: LinearProof, indent = 0): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `LinearProof` | no |  |
| `indent` | `any` | yes |  |

### Returns

`string` — 

