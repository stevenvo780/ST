// ============================================================
// ST Proof Minification — Tipos públicos
// ============================================================
//
// Representación genérica de un árbol de prueba que sirve tanto para
// natural deduction (intro/elim), cálculo de secuentes (G3, cut),
// resolución, paso modus-ponens encadenado, etc. La idea es que el
// reductor sea agnóstico al perfil lógico y opere sobre la estructura
// `(conclusion, rule, premises)` con strings textuales.
//
// El minificador NO valida que la prueba sea correcta — asume que el
// input ya es válido y se limita a aplicar transformaciones que
// preservan la conclusión y la corrección del árbol.

/**
 * Nodo genérico de un árbol de pruebas.
 *
 * - `conclusion`: representación textual de la fórmula derivada en el
 *   nodo. La comparación entre conclusiones se hace por igualdad de
 *   strings normalizados (trim + colapsar whitespace interno).
 * - `rule`: nombre de la regla que justifica la conclusión a partir
 *   de las premises. Convenciones reconocidas:
 *     * `axiom`, `hypothesis`, `assumption`, `premise`: hoja sin
 *       premises (o se ignoran las que tenga).
 *     * `→E`, `->E`, `MP`, `modus-ponens`, `impl-elim`: eliminación
 *       de implicación (modus ponens). Espera 2 premises: la
 *       implicación y el antecedente.
 *     * `→I`, `->I`, `impl-intro`: introducción de implicación.
 *     * `∧I`, `&I`, `and-intro`, `conj-intro`: conjunción intro.
 *     * `∧E1`, `∧E2`, `and-elim`, `conj-elim`: conjunción elim.
 *     * `cut`: corte en sequent calculus (elimina-able localmente
 *       cuando ambas ramas tienen el mismo cut-formula como hoja).
 *   El resto se trata como reglas opacas (no se reducen pero sí se
 *   detectan como redundantes/no usadas).
 * - `premises`: subárboles. Para hojas, lista vacía.
 * - `metadata`: opcional, free-form. Si el minificador encuentra dos
 *   nodos idénticos por conclusión+rule, prefiere el que tenga menos
 *   metadata (estable por orden de aparición).
 */
export interface GenericProofNode {
  conclusion: string;
  rule: string;
  premises: GenericProofNode[];
  metadata?: Record<string, unknown>;
}

/**
 * Reglas de reducción soportadas. El minificador las aplica en orden
 * fijo dentro de cada iteración:
 *
 *   1. `detrivialize`        — quita pares intro/elim adyacentes y
 *                              quita usos redundantes de la misma
 *                              premisa (dedup por conclusión).
 *   2. `compact-mp`          — colapsa cadenas A→B, A ⊢ B, B→C ⊢ C,
 *                              C→D ⊢ D... cuando el árbol intermedio
 *                              sólo se usa para alimentar el siguiente
 *                              MP. La cadena queda en `metadata.chain`.
 *   3. `cut-elimination-local` — caso simple de eliminación de cut
 *                              cuando una rama del cut es una
 *                              hipótesis idéntica a la otra rama.
 *   4. `remove-unused`       — recorre el árbol y descarta sub-pruebas
 *                              cuyo resultado nunca aparece como
 *                              conclusion en el camino hacia la raíz
 *                              (sólo aplica a nodos del tipo
 *                              `weakening`/`exchange` o sub-árboles
 *                              huérfanos en una lista de premises).
 */
export type MinifyRule = 'detrivialize' | 'compact-mp' | 'cut-elimination-local' | 'remove-unused';

export interface MinifyOptions {
  /**
   * Tope superior de pasadas globales. Default: 16. El bucle se corta
   * antes si una iteración entera no cambia el árbol (punto fijo).
   */
  maxIterations?: number;
  /**
   * Subconjunto de reglas a aplicar. Default: todas. El orden de
   * aplicación dentro de una iteración es fijo independientemente del
   * orden en este array — se respeta el orden documentado.
   */
  rules?: MinifyRule[];
}

export interface MinifyResult {
  /** Estadísticas del árbol original. */
  original: {
    /** Número de nodos (incluida la raíz). */
    nodes: number;
    /** Profundidad máxima (raíz = 0). */
    depth: number;
  };
  /** Árbol minificado. La raíz preserva la conclusion original. */
  minified: GenericProofNode;
  /** Métricas de reducción. */
  reduction: {
    /** Nodos eliminados (original.nodes - minified.nodes). */
    nodesRemoved: number;
    /** Diferencia de profundidad (puede ser 0 si no compactó MP). */
    depthDelta: number;
    /** Porcentaje de reducción de nodos, redondeado a 2 decimales. */
    percentage: number;
  };
  /** Iteraciones consumidas antes del punto fijo (1-indexed). */
  iterations: number;
}
