// ============================================================
// ST Countermodel Minimization — Tipos públicos
// ============================================================

/**
 * Algoritmo de minimización a usar.
 *
 * - `one-at-a-time`: O(n) pruebas. Por cada variable intenta removerla;
 *   si la fórmula sigue siendo falsada (para ambas completaciones de la
 *   variable removida), la elimina permanentemente.
 * - `binary-search`: O(n log n). Divide el conjunto de assignments en
 *   mitades y trata de descartar la mitad completa de una vez.
 * - `delta-debug`: O(n log n) en el peor caso, mucho más rápido en la
 *   práctica. Granularidad creciente al estilo Zeller 1999. Empieza
 *   removiendo bloques grandes y se reduce a granularidad 1.
 */
export type CountermodelMinAlgorithm = 'delta-debug' | 'binary-search' | 'one-at-a-time';

export interface CountermodelMinOptions {
  /** Algoritmo a utilizar. Default: `delta-debug`. */
  algorithm?: CountermodelMinAlgorithm;
  /** Tope superior de iteraciones (llamadas a evaluator). Default: 10_000. */
  maxSteps?: number;
}

/**
 * Asignación final: para cada variable que queda en el contramodelo
 * mínimo, guardamos su valor.
 *
 * Para perfiles clásicos los valores son `boolean`. Se permite también
 * `'T'`, `'F'`, `'both'`, `'neither'` para perfiles paraconsistentes
 * (Belnap) — la API queda abierta a futuro aunque el algoritmo actual
 * sólo opera sobre `boolean`.
 */
export type CountermodelAssignment = Record<string, boolean | 'T' | 'F' | 'both' | 'neither'>;

export interface MinimalCountermodel {
  /** Asignación mínima (solo variables relevantes). */
  assignments: CountermodelAssignment;
  /** Cantidad de variables en `assignments`. */
  size: number;
  /** Variables que el algoritmo eliminó (ordenadas alfabéticamente). */
  removed: string[];
  /** Iteraciones (llamadas a `evaluator`) consumidas. */
  iterations: number;
}
