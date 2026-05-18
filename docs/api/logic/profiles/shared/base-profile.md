# `logic/profiles/shared/base-profile.ts`

============================================================ ST Base Tableau Profile — Clase base para perfiles modales ============================================================ Todos los perfiles basados en tableau (modal, deontic, epistemic, intuitionistic, temporal) extienden esta clase y solo definen:   - name, description   - frameRules (tipo de relación de accesibilidad)   - formatFormula() (notación específica del dominio)   - explainSystem() (descripción de axiomas del sistema) ============================================================

## `BaseTableauProfile`

> Class · `logic/profiles/shared/base-profile.ts:17`

```ts
export abstract class BaseTableauProfile implements LogicProfile
```

