// ============================================================
// ST Default Logic (Reiter) — Tipos
// ============================================================
//
// Lógica default de Reiter (1980). Una default rule:
//
//     α : β1, ..., βn / γ
//
// significa "si α se cree y cada βi es consistente con las creencias
// actuales, entonces concluye γ". Una extensión es un punto fijo del
// operador inducido por la teoría: el conjunto de creencias estable
// donde todos los defaults aplicables ya fueron aplicados y ninguno
// más aplica sin generar inconsistencia.
//
// Limitación v1: prerequisites, justifications y consequents son
// literales (ground): "P" o "¬P". La consistencia se verifica buscando
// pares L/¬L en el conjunto de creencias. Esto cubre todos los
// ejemplos clásicos (Tweety, Nixon-diamond, etc.) sin SAT completo.
// ============================================================

export interface DefaultRule {
  id: string;
  /** Literal que debe estar en las creencias para que el default sea aplicable. */
  prerequisite: string;
  /** Cada literal debe ser consistente con las creencias (¬β no debe estar). */
  justifications: string[];
  /** Literal que se añade a las creencias cuando el default se aplica. */
  consequent: string;
}

export interface DefaultTheory {
  /** Hard facts: siempre creídos, base de toda extensión. */
  facts: string[];
  defaults: DefaultRule[];
}

export interface Extension {
  /** Cierre de creencias (facts + consequents aplicados). */
  formulas: Set<string>;
  /** IDs de los defaults aplicados en orden de aplicación. */
  appliedDefaults: string[];
}

export interface ComputeOptions {
  /** Tope de extensiones a enumerar (evita explosión combinatoria). */
  maxExtensions?: number;
  /** Tope de defaults considerados (evita teorías malformadas). */
  maxDefaults?: number;
}

export const DEFAULT_MAX_EXTENSIONS = 64;
export const DEFAULT_MAX_DEFAULTS = 64;
