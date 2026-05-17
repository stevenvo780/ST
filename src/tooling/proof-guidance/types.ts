// ============================================================
// ST Proof Guidance — Tipos públicos
// Sistema de ranking de tácticas/lemas con feature extraction
// simple + aprendizaje supervisado (logistic regression / weighted KNN).
// ============================================================

/**
 * Estado de prueba: goal a demostrar + hipótesis disponibles.
 * `context` opcional para metadatos arbitrarios (nombre del teorema,
 * profile lógico activo, etc.) — el extractor lo ignora hoy pero
 * deja la puerta abierta para features ricas en el futuro.
 */
export interface ProofState {
  goal: string;
  hypotheses: string[];
  context?: Record<string, string>;
}

/**
 * Registro histórico: una aplicación de táctica con el resultado.
 * `proofDepthRemaining` permite ponderar éxito por proximidad al QED:
 * tácticas que cierran la prueba pesan más que tácticas medias.
 */
export interface TacticRecord {
  tactic: string;
  args?: unknown[];
  beforeState: ProofState;
  afterState: ProofState;
  successful: boolean;
  proofDepthRemaining?: number;
}

/**
 * Feature extraída de un estado. `value` es numérico (los booleanos
 * se codifican como 0/1) para que el ranker haga producto interno
 * sin tratos especiales.
 */
export interface Feature {
  name: string;
  value: number;
}

/**
 * Modelo entrenado. Por cada par (tactic, feature) hay un peso
 * — los lemas también caben aquí porque se tratan como tácticas
 * con nombre `lemma:<id>`.
 */
export interface RankingModel {
  features: string[];
  /** key: `${tactic}::${featureName}` → peso aprendido. */
  weights: Map<string, number>;
  /** bias por táctica — base rate cuando todas las features son 0. */
  bias: Map<string, number>;
}

/**
 * Resultado de ranking: score sin normalizar, mayor = mejor candidata.
 * No es probabilidad estricta — usar `Math.exp(score) / sum` si se
 * necesita softmax.
 */
export interface RankedTactic {
  tactic: string;
  score: number;
}

export interface SearchOptions {
  /** Profundidad máxima de la prueba. Default: 16. */
  maxDepth?: number;
  /** Estados a expandir por nivel. Default: 4. */
  beamWidth?: number;
  /** Presupuesto de tiempo en milisegundos. Default: 5000. */
  timeoutMs?: number;
  /** Cap total de estados explorados (defensa contra explosiones). Default: 10000. */
  maxExploredStates?: number;
}

export interface SearchResult {
  /** Secuencia de tácticas si encontró prueba; undefined si falló. */
  proof?: TacticRecord[];
  /** Estados expandidos durante la búsqueda (métrica de costo). */
  exploredStates: number;
  /** true si llegó a un goal vacío o reconocido como cerrado. */
  success: boolean;
  /** Razón si no encontró: 'timeout' | 'depth' | 'exhausted'. */
  reason?: 'timeout' | 'depth' | 'exhausted' | 'cap';
}

/** Función que aplica una táctica a un estado. null = táctica no aplicable. */
export type ApplyTactic = (
  state: ProofState,
  tactic: string,
  args?: unknown[],
) => ProofState | null;
