// ============================================================
// Bayesian Inference — Types
// ============================================================
//
// Tipos para representar redes bayesianas discretas y consultas
// de inferencia probabilística.

export interface DiscreteVariable {
  name: string;
  values: string[]; // dominio de la variable (categorías discretas)
}

export interface CPT {
  variable: string; // nombre del hijo
  parents: string[]; // nombres de los padres (orden importa para indexar entries)
  // entries: key = "parent1=v1|parent2=v2" (vacío "" si no hay padres),
  // value = Record<childValue, probability>. Cada columna debe sumar 1.
  entries: Record<string, Record<string, number>>;
}

export interface BayesianNetwork {
  variables: DiscreteVariable[];
  cpts: CPT[]; // exactamente uno por variable
}

export type Evidence = Record<string, string>;

export interface PosteriorDistribution {
  variable: string;
  distribution: Record<string, number>; // suma 1 (salvo evidencia inconsistente)
}
