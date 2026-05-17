// ============================================================
// FCA — Next Closure algorithm (Ganter, 1984).
// ============================================================
// Enumera todos los conjuntos cerrados de un operador de clausura
// (aquí, la clausura de intents B → B'') en orden lexicográfico
// respecto a un orden total fijado sobre M.
//
// Idea clave:
//   1. Fijamos M = {m_0, m_1, ..., m_{n-1}} con un orden total.
//   2. Para un conjunto cerrado B, calculamos el "siguiente" cerrado:
//      para i desde n-1 hasta 0:
//        - si m_i ∈ B, sáltalo;
//        - sea C = closure( (B ∩ {m_0,...,m_{i-1}}) ∪ {m_i} ).
//        - si C \ B no contiene ningún m_j con j < i, devolver C.
//      Si ninguno funciona, terminamos.
//   3. Empezamos por closure(∅) (que es M', el intent del Top concept
//      en su forma de atributos comunes a todos los objetos) y
//      enumeramos sucesores hasta agotar.
//
// La complejidad es O(|B(K)| · |M|² · |G|) en peor caso, pero amortizado
// es excelente para contextos densos pequeños y medianos. La salida está
// libre de duplicados por construcción (cada cerrado se visita una sola
// vez gracias al test "C \ B no contiene m_j para j < i").
// ============================================================

import { closeIntent, derivativeObjects } from './context';
import type { FormalConcept, FormalContext } from './types';

/**
 * Compara dos subconjuntos de M en el orden "lectic" de Ganter, definido
 * sobre la indexación posicional de `order`. NO usado externamente pero
 * documentado: A <_i B ⇔ m_i ∈ B \ A y A ∩ {m_0,..,m_{i-1}} = B ∩ {m_0,..,m_{i-1}}.
 *
 * La función de sucesión usa una variante eficiente que no necesita
 * comparar pares: solo verifica la condición de "no hay m_j más pequeño
 * en la diferencia".
 */

/**
 * Devuelve el siguiente cerrado en orden lectic, o `null` si `current` ya
 * es el último (closure(M) = M).
 */
function nextClosure(
  ctx: FormalContext,
  order: string[],
  current: Set<string>,
): Set<string> | null {
  for (let i = order.length - 1; i >= 0; i--) {
    const mi = order[i];
    if (mi === undefined) continue;
    if (current.has(mi)) continue;

    // B^+ = (B ∩ {m_0,..,m_{i-1}}) ∪ {m_i}
    const seed = new Set<string>();
    for (let j = 0; j < i; j++) {
      const mj = order[j];
      if (mj !== undefined && current.has(mj)) seed.add(mj);
    }
    seed.add(mi);

    const closed = closeIntent(ctx, seed);

    // Test lectic: el cerrado no debe contener m_j con j < i que no estuviera
    // ya en current. Equivale a: (closed \ current) ∩ {m_0,...,m_{i-1}} = ∅.
    let valid = true;
    for (let j = 0; j < i; j++) {
      const mj = order[j];
      if (mj === undefined) continue;
      if (closed.has(mj) && !current.has(mj)) {
        valid = false;
        break;
      }
    }
    if (valid) return closed;
  }
  return null;
}

/**
 * Enumera todos los conceptos formales de `ctx` mediante Next Closure.
 *
 * Garantías:
 *  - Cada concepto aparece exactamente una vez.
 *  - El orden de salida es lectic sobre intents (creciente).
 *  - Incluye el Top concept (G, G') y el Bottom concept (M', M) cuando
 *    existen como cerrados (siempre existen).
 */
export function allConcepts(ctx: FormalContext): FormalConcept[] {
  const order = [...ctx.attributes];
  const concepts: FormalConcept[] = [];

  // Punto de arranque: clausura del conjunto vacío.
  // ∅' = G (todos los objetos satisfacen trivialmente "ningún atributo"),
  // luego (∅')' = G' = atributos comunes a todos los objetos.
  let current: Set<string> | null = closeIntent(ctx, new Set<string>());

  while (current !== null) {
    const intent = current;
    const extent = derivativeObjects(ctx, intent);
    concepts.push({ extent, intent });
    current = nextClosure(ctx, order, current);
  }

  return concepts;
}
