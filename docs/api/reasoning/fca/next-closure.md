# `reasoning/fca/next-closure.ts`

============================================================ FCA — Next Closure algorithm (Ganter, 1984). ============================================================ Enumera todos los conjuntos cerrados de un operador de clausura (aquí, la clausura de intents B → B'') en orden lexicográfico respecto a un orden total fijado sobre M. Idea clave:   1. Fijamos M = {m_0, m_1, ..., m_{n-1}} con un orden total.   2. Para un conjunto cerrado B, calculamos el "siguiente" cerrado:      para i desde n-1 hasta 0:        - si m_i ∈ B, sáltalo;        - sea C = closure( (B ∩ {m_0,...,m_{i-1}}) ∪ {m_i} ).        - si C \ B no contiene ningún m_j con j < i, devolver C.      Si ninguno funciona, terminamos.   3. Empezamos por closure(∅) (que es M', el intent del Top concept      en su forma de atributos comunes a todos los objetos) y      enumeramos sucesores hasta agotar. La complejidad es O(|B(K)| · |M|² · |G|) en peor caso, pero amortizado es excelente para contextos densos pequeños y medianos. La salida está libre de duplicados por construcción (cada cerrado se visita una sola vez gracias al test "C \ B no contiene m_j para j < i"). ============================================================

## `allConcepts`

> Function · `reasoning/fca/next-closure.ts:88`

Enumera todos los conceptos formales de `ctx` mediante Next Closure.

Garantías:
 - Cada concepto aparece exactamente una vez.
 - El orden de salida es lectic sobre intents (creciente).
 - Incluye el Top concept (G, G') y el Bottom concept (M', M) cuando
   existen como cerrados (siempre existen).

```ts
export function allConcepts(ctx: FormalContext): FormalConcept[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FormalContext` | no |  |

### Returns

`FormalConcept[]` — 

