# `runtime/bisimulation/paige-tarjan.ts`

============================================================ Paige-Tarjan — partition refinement para bisimulación fuerte. ============================================================ Complejidad O(m log n) sobre LTS finitos, donde m = |→| y n = |S|. Idea:   - Comienza con la partición coarsest compatible con el labelling.   - Mantiene una cola de "splitters" (B, a): bloque B y acción a.   - Para cada splitter, particiona cada bloque X en        X₁ = { s ∈ X | ∃ s -a-> t, t ∈ B }        X₂ = X \ X₁     y si ambos son no vacíos, reemplaza X y agrega el bloque más pequeño     como nuevo splitter (heurística que da el factor log n).   - Termina cuando no quedan splitters útiles. La implementación usa un Map de aristas inversas por acción   inversa[a][to] = { from : ∃ from -a-> to } para que el split sea proporcional a |a-predecessors|. ============================================================

## `paigeTarjan`

> Function · `runtime/bisimulation/paige-tarjan.ts:99`

Particiona el LTS según bisimulación fuerte usando Paige-Tarjan.
Devuelve la partición canónica donde dos estados están en el mismo bloque
sii son fuertemente bisimilares.

```ts
export function paigeTarjan(lts: LTS): BisimulationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lts` | `LTS` | no |  |

### Returns

`BisimulationResult` — 

