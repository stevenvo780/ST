# `reasoning/optimization/standard-form.ts`

============================================================ Conversión a forma estándar para simplex. ============================================================ El simplex de dos fases que implementamos opera sobre forma estándar de maximización con restricciones ≤ y variables ≥ 0 (más slacks que se añaden internamente en el tableau). Reglas de conversión:   - 'minimize c·x'  →  'maximize (-c)·x', se invierte el valor al     final.   - Restricción 'a·x ≥ b'  →  '(-a)·x ≤ -b'.   - Restricción 'a·x = b' se expande a dos restricciones (≤ b y     ≥ b convertida a ≤ -b). La igualdad podría implementarse con     una sola variable artificial en Fase I, pero la duplicación     es estable y suficiente para nuestros tamaños de problema.   - Cotas inferiores l ≠ 0 se trasladan: x = x' + l, con x' ≥ 0.   - Cotas superiores u se vuelven restricciones ≤ u (sobre la     variable trasladada). Esta función devuelve un LPProblem equivalente con SOLO ≤ y objetivo de maximización, sin cotas (todas pasadas a constraints). ============================================================

## `standardForm`

> Function · `reasoning/optimization/standard-form.ts:34`

Convierte un LPProblem arbitrario a forma estándar:
maximizar c·x sujeto a Ax ≤ b con x ≥ 0 (sin cotas explícitas).
Preserva el sentido original mediante `objective.kind`:
si el original era 'minimize', el resultado lo refleja con
coeficientes negados (el caller debe negar el valor objetivo
al interpretarlo).

```ts
export function standardForm(lp: LPProblem): LPProblem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lp` | `LPProblem` | no |  |

### Returns

`LPProblem` — 

