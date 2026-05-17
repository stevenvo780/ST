// ============================================================
// Markov Logic Networks — Types
// ============================================================
//
// Una Markov Logic Network (MLN) combina lógica de primer orden
// con redes de Markov. Cada fórmula `F` lleva un peso real `w`.
// La distribución sobre mundos posibles `W` es:
//
//   P(W) = (1/Z) · exp( Σ_i  w_i · n_i(W) )
//
// donde `n_i(W)` cuenta las grounding instances de `F_i` SATISFECHAS
// en `W`. Pesos +∞ equivalen a restricciones duras (hard constraints).
//
// Referencia: Richardson & Domingos, "Markov Logic Networks" (2006).

/**
 * Fórmula de la teoría MLN.
 *
 * `formula` es una cadena FOL con literales `Pred(args)` y
 * conectores `∧`, `∨`, `→`, `¬` (o sus variantes ASCII `&`, `|`, `->`,
 * `!`). Las variables se infieren por convención: identificadores que
 * empiezan en minúscula son variables; los que empiezan en mayúscula
 * son constantes (cerradas).
 *
 * `weight` es un peso real. `Infinity` significa hard constraint: la
 * fórmula DEBE satisfacerse en todo mundo con probabilidad no nula.
 */
export interface MLNFormula {
  formula: string;
  weight: number;
}

/**
 * Teoría MLN completa: fórmulas + dominios tipados de constantes +
 * declaración de predicados.
 *
 * `constants[t]` es el conjunto de constantes del tipo `t`.
 * `predicates[i].types` declara el tipo de cada argumento del
 * predicado `predicates[i].name`.
 *
 * Para teorías untyped, basta usar un único tipo (por ejemplo
 * `"Person"`) y declarar todos los predicados sobre él.
 */
export interface MLNTheory {
  formulas: MLNFormula[];
  constants: Record<string, string[]>;
  predicates: Array<{ name: string; types: string[] }>;
}

/**
 * Mundo posible: asignación booleana sobre ground atoms.
 *
 * Las claves son strings canónicos `"Pred(arg1,arg2,...)"` (sin
 * espacios). Atoms ausentes se interpretan como `false` (closed-world
 * assumption opcional, usualmente activada en MLN).
 */
export interface MLNWorld {
  groundAtoms: Record<string, boolean>;
}

/**
 * Resultado de groundear una fórmula sobre el universo de constantes.
 *
 * Cada `GroundedFormula` representa una instancia concreta (sin
 * variables libres) de la fórmula original. `violations(world)`
 * devuelve `0` si el mundo SATISFACE la instancia, `1` si la viola.
 * Esto facilita componer el peso del mundo: cada `violations > 0`
 * resta `w · violations` del log-score.
 */
export interface GroundedFormula {
  groundFormula: string;
  weight: number;
  violations: (world: MLNWorld) => number;
  /** Atoms que aparecen en esta ground formula (útil para Gibbs). */
  atoms: string[];
  /** Predicado: ¿la fórmula se satisface en `world`? */
  satisfied: (world: MLNWorld) => boolean;
}
