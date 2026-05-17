// ============================================================
// ST Provenance — Tipos públicos
//
// Cada nodo del DAG es un axioma, lema, definición o teorema con
// sus dependencias explícitas, metadata de proveniencia (quién /
// cuándo / con qué herramienta) y nivel de confianza.
//
// El ledger mantiene el grafo + permite auditorías recursivas:
// qué axiomas se usaron para llegar a un teorema, qué nodos son
// admitidos (sin prueba) o externos (de otra fuente).
// ============================================================

/**
 * Categoría del nodo dentro del DAG.
 *
 * - `axiom`: postulado base sin dependencias (puede tener proof=undefined).
 * - `lemma`: resultado intermedio reusable.
 * - `theorem`: resultado principal o expuesto al usuario.
 * - `definition`: introduce una notación o constante (no es proposición).
 */
export type ProvenanceKind = 'axiom' | 'lemma' | 'theorem' | 'definition';

/**
 * Nivel de confianza en el nodo:
 * - `verified`: probado mecánicamente o aceptado por la audiencia del sistema.
 * - `admitted`: declarado sin prueba (TODO, sorry, oracle). Se propaga como amarillo.
 * - `external`: aceptado por referencia a otra herramienta (Lean, Coq, hardware oracle).
 */
export type TrustLevel = 'verified' | 'admitted' | 'external';

/**
 * Metadata asociada a un nodo. Todo es serializable a JSON puro.
 * `tool` permite distinguir prueba humana, táctica DSL automática
 * o checker externo. `durationMs` y `proofSize` son opcionales y
 * sirven para análisis posterior.
 */
export interface ProvenanceMetadata {
  /** Timestamp ISO 8601 (string) de cuando se añadió el nodo. */
  provedAt: string;
  /** Identificador libre del autor (uid, "manual", "agent:claude-opus"...). */
  provedBy: string;
  /** Perfil lógico bajo el que se aceptó (p.ej. classical.propositional). */
  profile: string;
  /** Herramienta usada: 'manual', 'st-prover@4.10.0', 'lean4', 'coq', 'tactic-dsl', 'auto'. */
  tool: string;
  /** Duración opcional en milisegundos para reportes. */
  durationMs?: number;
  /** Tamaño opcional de la prueba (pasos / bytes / nodos AST). */
  proofSize?: number;
}

/**
 * Nodo del DAG de proveniencia. El `id` es derivado determinísticamente
 * del statement + dependencias (ver `ProvenanceLedger.add`) para que el
 * mismo statement con las mismas deps reciba siempre el mismo identificador.
 */
export interface ProvenanceNode {
  id: string;
  statement: string;
  kind: ProvenanceKind;
  /** IDs de prerequisitos. Para `axiom` debe estar vacío. */
  dependencies: string[];
  metadata: ProvenanceMetadata;
  /** Prueba opcional — el ledger no la inspecciona, sólo la guarda. */
  proof?: unknown;
  trust: TrustLevel;
}

/**
 * Reporte de auditoría: clasifica dependencias del teorema raíz y
 * estima riesgo en función de cuánto del DAG es admitido o externo.
 */
export interface AuditReport {
  rootTheorem: string;
  trustClassification: { verified: number; admitted: number; external: number };
  externalDependencies: ProvenanceNode[];
  admittedDependencies: ProvenanceNode[];
  axiomList: Set<string>;
  totalNodes: number;
  estimatedRisk: 'low' | 'medium' | 'high';
}
