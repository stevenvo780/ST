// ============================================================
// ST Proof Mining — Tipos públicos
// ============================================================
//
// Proof mining (a.k.a. lemma extraction) toma un corpus de pruebas
// ya derivadas y extrae sub-pruebas reutilizables como lemmas
// independientes. La idea: si la misma estructura aparece en 2+
// pruebas, conviene cachearla con su propia entry para que futuras
// derivaciones la reusen sin re-trabajar.
//
// Diferencia con `lemma-synthesis`:
//   - lemma-synthesis ENUMERA conjeturas a partir de una signatura
//     y un evaluador (theory exploration estilo QuickSpec).
//   - proof-mining EXTRAE lemmas de pruebas que ya existen
//     (bottom-up desde el corpus, sin enumeración).
//
// Pipeline:
//   1. extract: encontrar sub-trees comunes entre pruebas.
//   2. generalize: anti-unify para subir el nivel de abstracción.
//   3. rank: ordenar por usefulness (savings · frecuencia · generalidad).
//   4. persist: meter en TheoremCache con hash α-canónico.

/**
 * Un paso individual de una proof trace. `rule` es el nombre de la
 * regla de inferencia (MP, ∧I, cut, etc.) y `inputs` son los outputs
 * de pasos previos consumidos. `output` es la fórmula derivada.
 *
 * `depth` permite reconstruir el árbol sin tener que cargar punteros:
 * el paso 0 es la conclusión, los pasos con depth+1 son sus hijos
 * inmediatos. Esto se usa internamente para subtree matching.
 */
export interface ProofStep {
  /** Nombre de la regla de inferencia usada. */
  rule: string;
  /** Fórmulas (outputs de pasos previos) consumidas por la regla. */
  inputs: string[];
  /** Fórmula derivada por este paso. */
  output: string;
  /** Profundidad en el árbol de prueba (0 = conclusión final). */
  depth: number;
}

/**
 * Traza de una prueba ya derivada. Es la unidad de entrada del
 * miner. La conclusión es la fórmula final; las premisas son las
 * hojas (axiomas, hipótesis). `steps` está en orden top-down: el
 * primer paso es la conclusión, los siguientes profundizan.
 *
 * `cost` es heurístico: longitud de la prueba, depth × branching o
 * tiempo wall-clock. El caller decide. Si la sub-prueba extraída
 * tiene cost K y aparece N veces, el saving total es K·(N-1).
 */
export interface ProofTrace {
  /** Identificador opcional de la prueba (e.g. hash original). */
  id?: string;
  /** Fórmula conclusión. */
  conclusion: string;
  /** Hojas: axiomas / hipótesis. */
  premises: string[];
  /** Slug del perfil lógico (clásico, intuicionista, etc.). */
  profile: string;
  /** Pasos del árbol, top-down con `depth`. */
  steps: ProofStep[];
  /** Cost heurístico (longitud, depth × branching, ms, etc.). */
  cost: number;
}

/**
 * Un lemma extraído del corpus.
 *
 * - `id` es el hash α-canónico (compatible con TheoremCache).
 * - `statement` es la conclusión del sub-tree (posiblemente
 *   generalizada por anti-unification).
 * - `abstractionLevel` indica cuántas variables fresh introdujo la
 *   generalización (0 = literal, n = n-level abstraction).
 * - `usageCount` es la cantidad de proofs donde el lemma calza.
 * - `savings` es la suma de `cost` que se evita al reusar el lemma:
 *   cost_subproof × (usageCount − 1).
 * - `sourceProofs` enumera las trazas donde se encontró el match.
 */
export interface MinedLemma {
  id: string;
  statement: string;
  proof: ProofTrace;
  abstractionLevel: number;
  usageCount: number;
  savings: number;
  sourceProofs: string[];
}

/**
 * Opciones de minería.
 */
export interface MiningOptions {
  /**
   * Umbral mínimo de reutilización para extraer un sub-tree como
   * lemma. Default 2 (debe aparecer al menos en 2 proofs).
   */
  minReuseThreshold?: number;
  /**
   * Tamaño mínimo del sub-tree (cantidad de pasos) para ser candidato
   * a lemma. Sub-trees de 1 paso son triviales y se descartan.
   * Default 2.
   */
  minSubtreeSize?: number;
  /**
   * Nivel máximo de generalización. La anti-unificación se aplica
   * iterativamente; cap de seguridad. Default 3.
   */
  maxAbstractionLevel?: number;
  /**
   * Si `true`, la generalización debe preservar la propiedad de
   * que toda instancia del pattern sea una prueba válida (verificado
   * sobre el corpus original). Default `true`.
   */
  preserveSemantic?: boolean;
}

/**
 * Estadísticas agregadas del proceso de minería.
 */
export interface UsageStats {
  /** Cantidad de proofs procesadas. */
  proofsAnalyzed: number;
  /** Sub-trees candidatos encontrados (antes de filtrado). */
  candidatesFound: number;
  /** Lemmas finalmente extraídos (post-filtrado y ranking). */
  lemmasExtracted: number;
  /** Sumatoria de savings de todos los lemmas. */
  totalSavings: number;
  /** Promedio de usageCount por lemma. */
  averageUsage: number;
  /** Cantidad de lemmas que pasaron por generalization. */
  generalizedCount: number;
}

/**
 * Resultado completo de una corrida de mining.
 */
export interface MiningResult {
  lemmas: MinedLemma[];
  stats: UsageStats;
}
