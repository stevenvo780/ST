# `logic/profiles/hybrid-logic/sat.ts`

============================================================ ST Hybrid Logic — Decisor de satisfacibilidad (búsqueda acotada) ============================================================ La satisfacibilidad del fragmento H(@, ↓, ∃) es indecidible en general (Areces, Blackburn & Marx 1999). Aquí implementamos un búsqueda finita acotada: enumeramos frames con ≤ N mundos y probamos cada uno. Es completo para fórmulas con modelo finito pequeño y robusto para los tests del perfil. La cota se elige en función del tamaño sintáctico de φ:   bound = max(2, atoms + nominals + 2) suficiente para todas las patologías clásicas (loops, modelos con varios mundos para ∃, etc.). ============================================================

## `isSatisfiable`

> Function · `logic/profiles/hybrid-logic/sat.ts:127`

Búsqueda exhaustiva de modelo en frames de tamaño ≤ `maxWorlds`.

Para una explosión combinatoria controlada, sólo intentamos
tamaños desde 1 hasta `maxWorlds`. Es completo dentro de ese rango.

```ts
export function isSatisfiable( phi: HybridFormula, options: { maxWorlds?: number } = {}, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `HybridFormula` | no |  |
| `options` | `{ maxWorlds?: number }` | yes |  |

### Returns

`{ sat: boolean; frame?: HybridFrame; world?: string }` — 

