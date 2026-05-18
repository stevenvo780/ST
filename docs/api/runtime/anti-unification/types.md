# `runtime/anti-unification/types.ts`

Término de primer orden para anti-unification.

- `var`:   variable de unificación.
- `func`:  símbolo de función con aridad implícita por len(args).
- `const`: constante (sin args). Equivalente a `func` con args=[]
           pero distinguible sintácticamente.

## Contents

- [`Term`](#term) — Interface
- [`AntiUnificationResult`](#antiunificationresult) — Interface
- [`FreshSupply`](#freshsupply) — Type

## `Term`

> Interface · `runtime/anti-unification/types.ts:33`

Término de primer orden para anti-unification.

- `var`:   variable de unificación.
- `func`:  símbolo de función con aridad implícita por len(args).
- `const`: constante (sin args). Equivalente a `func` con args=[]
           pero distinguible sintácticamente.

```ts
export interface Term
```


## `AntiUnificationResult`

> Interface · `runtime/anti-unification/types.ts:53`

Resultado de anti-unification.

- `generalization`: el lgg (least general generalization) — el
  término más específico tal que ambos t1 y t2 son instancias.
- `substLeft`:  σ_L tal que σ_L(generalization) = t1.
- `substRight`: σ_R tal que σ_R(generalization) = t2.
- `variables`:  variables frescas introducidas en `generalization`
  por desacuerdos (en orden de aparición).

Invariante: para toda v ∈ variables, substLeft.get(v) y
substRight.get(v) están definidas y son distintas estructuralmente
(si fueran iguales, no habría hecho falta introducir la fresh var).

```ts
export interface AntiUnificationResult
```


## `FreshSupply`

> Type · `runtime/anti-unification/types.ts:66`

Fuente de variables frescas. Una función que cada vez que se
invoca devuelve un nombre nuevo (no usado previamente).

Default (cuando no se pasa): genera `_g0`, `_g1`, `_g2`, …

```ts
export type FreshSupply = () => string;
```

