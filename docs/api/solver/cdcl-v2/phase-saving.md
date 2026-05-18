# `solver/cdcl-v2/phase-saving.ts`

Phase saving — Pipatsrisawat & Darwiche (2007). Guarda la última polaridad asignada a cada variable. Al decidir, el solver la reutiliza, lo que explota localidad: el espacio "cerca" de soluciones parciales válidas suele tener phases similares.

## `PhaseSaver`

> Class · `solver/cdcl-v2/phase-saving.ts:6`

```ts
export class PhaseSaver
```

