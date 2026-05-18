# `runtime/countermodel-min/minimize.ts`

============================================================ ST Countermodel Minimization — Núcleo ============================================================ Dada una fórmula F y un contramodelo C (asignación total que la falsifica), encontrar el subconjunto MÁS PEQUEÑO de C que todavía sigue siendo testigo de invalidez. Semántica (sound, set-based):   El subconjunto S ⊆ C es contramodelo sii para TODA completación   total que coincida con S en sus variables, el evaluator devuelve   `false` (la fórmula no es válida). Verificación:   - Si #removidas ≤ ENUM_THRESHOLD (16): enumeración exhaustiva,     2^#removidas llamadas al evaluator. Sound y completo.   - Si #removidas > ENUM_THRESHOLD: heurística (dos completaciones     extremas). Captura el caso común de variables completamente     irrelevantes a la fórmula. Los algoritmos top-down sólo llegan     aquí cuando hay grandes bloques de irrelevancias. Algoritmos:   - one-at-a-time: O(n) candidatos × O(1) check (más enumeración).     Greedy con orden alfabético, iterado hasta punto fijo.   - binary-search: O(n log n). Intenta descartar mitades enteras.   - delta-debug (Zeller 1999, ddmin): granularidad creciente, mejor     en práctica cuando hay grupos contiguos de irrelevancias. Determinismo: ordenamiento alfabético en todos los recorridos. Mismo input ⇒ mismo output. ============================================================

## `minimizeCountermodel`

> Function · `runtime/countermodel-min/minimize.ts:62`

Minimiza un contramodelo: devuelve el subconjunto más pequeño de
asignaciones que aún hace `evaluator(asg) === false` para toda
completación de las variables removidas.

```ts
export function minimizeCountermodel( _formula: Formula, fullCounter: Record<string, boolean>, evaluator: (asg: Record<string, boolean>) => boolean, opts: CountermodelMinOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `_formula` | `Formula` | no | AST de la fórmula (queda en la firma para                  compatibilidad y futura especialización; el motor                  trata el evaluator como caja negra). |
| `fullCounter` | `Record<string, boolean>` | no | Contramodelo total: asignación que falsifica F. |
| `evaluator` | `(asg: Record<string, boolean>) => boolean` | no | Función que devuelve `true` si la fórmula es válida                  bajo la asignación total dada. |
| `opts` | `CountermodelMinOptions` | yes | Algoritmo y maxSteps. |

### Returns

`MinimalCountermodel` — 

