# `type-theory/curry-howard/index.ts`

============================================================ ST Curry-Howard — Punto de entrada público ============================================================ Correspondencia Curry-Howard sobre λ-cálculo simplemente tipado:   - λ-terms anotados con tipos = pruebas en deducción natural   - inferType: λ-term → proposición probada   - termToProof / proofToTerm: conversión bidireccional   - reduceBeta / normalize: normalización (β + proyecciones + case)
