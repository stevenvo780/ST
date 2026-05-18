# `semantics/categorical/monoidal.ts`

============================================================ ST Categorical — Monoidal Category (FinSet con producto ×) ============================================================ Construcción concreta de la categoría monoidal estricta (FinSet, ×, 1) donde 1 = {*} y A×B se define elemento a elemento. Verifica unitor izquierdo / derecho y asociador por igualdad estricta sobre los carriers (suficiente porque elegimos los nombres canónicos: "*∥x" se mapea a "x", etc.). ============================================================

## `FinSetMonoidal`

> Function · `semantics/categorical/monoidal.ts:24`

Construye la categoría monoidal (FinSet, ×, 1). Recibe la lista
de objetos generadores; añade automáticamente la unidad 1.

Esta versión es estricta hasta isomorfismo canónico: los unitores
y asociador se comprueban por igualdad estructural de los
elementos serializados (`x` vs `*∥x` vs `x∥*`), siguiendo la
convención `mkProductObj`. En lugar de verificar conmutatividad
de diagramas complejos, comparamos los carriers normalizados.

```ts
export function FinSetMonoidal( objs: ReadonlyArray<FinSetObj>, generators: ReadonlyArray<FinSetMor> = [], ): MonoidalCategory<FinSetObj, FinSetMor>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `objs` | `ReadonlyArray<FinSetObj>` | no |  |
| `generators` | `ReadonlyArray<FinSetMor>` | yes |  |

### Returns

`MonoidalCategory<FinSetObj, FinSetMor>` — 

