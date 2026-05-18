# `runtime/pi-calculus/congruence.ts`

============================================================ π-calculus — congruencia estructural ≡. ============================================================ Axiomas estándar:   P | 0 ≡ P                    (nil unitario de |)   P | Q ≡ Q | P                (conmutatividad de |)   (P | Q) | R ≡ P | (Q | R)    (asociatividad de |)   P + 0 ≡ P   P + Q ≡ Q + P   (P + Q) + R ≡ P + (Q + R)   (νc)(νd) P ≡ (νd)(νc) P      (intercambio de scopes)   (νc) 0 ≡ 0                   (canal vacío sin uso)   (νc) (P | Q) ≡ P | (νc) Q    si c ∉ fn(P)   (scope extrusion)   !P ≡ P | !P                  (unfold de replicación, lo dejamos como opcional)   α-conversion sobre binders Implementación: normalizamos ambos procesos a una "forma canónica" (flatten de paralelas y sumas + ordenamiento estructural + drop de `0` unitarios) y luego comparamos por igualdad sintáctica módulo α-renaming sobre binders. No es decisión completa de ≡ (la equivalencia es indecidible en general en presencia de replicación), pero cubre los axiomas básicos suficientes para los tests y propiedades esperadas. ============================================================

## `structuralCongruence`

> Function · `runtime/pi-calculus/congruence.ts:190`

Decide si dos procesos son estructuralmente congruentes (módulo los
axiomas listados arriba + α-equivalencia).

Cobertura intencional:
  - Conmutatividad/asociatividad/nil de | y +.
  - Renaming de binders.
  - `(νc) 0 ≡ 0`.
Cobertura intencionalmente limitada (excede el scope mínimo del runtime):
  - Scope extrusion `(νc)(P|Q) ≡ P | (νc) Q`.
  - Unfold de replicación.

```ts
export function structuralCongruence(a: PiProcess, b: PiProcess): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `PiProcess` | no |  |
| `b` | `PiProcess` | no |  |

### Returns

`boolean` — 

