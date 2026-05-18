// ============================================================
// ST Description Logic — ALC types
// ============================================================
// ALC: el fragmento base de OWL/DL.
// Conceptos C, roles R (binarios), individuos a.
//   ⊤ ⊥   top / bottom
//   ¬C    complemento
//   C ⊓ D intersección
//   C ⊔ D unión
//   ∃R.C  restricción existencial
//   ∀R.C  restricción de valor
// ============================================================

/** Variantes sintácticas de un concepto ALC. */
export type DLConceptKind =
  | 'top'
  | 'bottom'
  | 'atomic'
  | 'not'
  | 'and'
  | 'or'
  | 'exists'
  | 'forall';

export interface DLConcept {
  kind: DLConceptKind;
  /** Atomic concept name (kind = 'atomic'). */
  name?: string;
  /** Single sub-concept (kind = 'not' / 'exists' / 'forall'). */
  arg?: DLConcept;
  /** n-ary children (kind = 'and' / 'or'). */
  args?: DLConcept[];
  /** Role name (kind = 'exists' / 'forall'). */
  role?: string;
}

/** Variantes de axioma ALC: subsunción, equivalencia y aserciones de instancia. */
export type DLAxiomKind = 'subsumes' | 'equivalent' | 'instance' | 'role-instance';

export interface DLAxiom {
  kind: DLAxiomKind;
  /**
   * - subsumes / equivalent: ambos lados son DLConcept (C ⊑ D, C ≡ D).
   * - instance:              left = individuo (string), right = DLConcept.
   * - role-instance:         left = individuo, right = individuo, role = nombre del rol.
   */
  left: DLConcept | string;
  right: DLConcept | string;
  /** Solo para role-instance. */
  role?: string;
}

export interface DLKnowledgeBase {
  /** Schema-level: subsumption / equivalence. */
  tbox: DLAxiom[];
  /** Instance assertions: instance + role-instance. */
  abox: DLAxiom[];
}

// ── Constructores de conveniencia ──────────────────────────

/** Concepto universal ⊤ (todo individuo lo satisface). */
export const TOP: DLConcept = { kind: 'top' };
/** Concepto vacío ⊥ (ningún individuo lo satisface). */
export const BOTTOM: DLConcept = { kind: 'bottom' };

/** Crea un concepto atómico con el nombre dado. */
export function atomic(name: string): DLConcept {
  return { kind: 'atomic', name };
}

/** Negación de un concepto: ¬C. */
export function not(c: DLConcept): DLConcept {
  return { kind: 'not', arg: c };
}

/** Intersección de conceptos: C ⊓ D. Sin argumentos devuelve ⊤. */
export function and(...args: DLConcept[]): DLConcept {
  if (args.length === 0) return TOP;
  if (args.length === 1) return args[0];
  return { kind: 'and', args };
}

/** Unión de conceptos: C ⊔ D. Sin argumentos devuelve ⊥. */
export function or(...args: DLConcept[]): DLConcept {
  if (args.length === 0) return BOTTOM;
  if (args.length === 1) return args[0];
  return { kind: 'or', args };
}

/** Restricción existencial: ∃role.C. */
export function exists(role: string, c: DLConcept): DLConcept {
  return { kind: 'exists', role, arg: c };
}

/** Restricción de valor: ∀role.C. */
export function forall(role: string, c: DLConcept): DLConcept {
  return { kind: 'forall', role, arg: c };
}

/** Axioma TBox de subsunción: left ⊑ right. */
export function subsumes(left: DLConcept, right: DLConcept): DLAxiom {
  return { kind: 'subsumes', left, right };
}

/** Axioma TBox de equivalencia: left ≡ right. */
export function equivalent(left: DLConcept, right: DLConcept): DLAxiom {
  return { kind: 'equivalent', left, right };
}

/** Aserción ABox: `individual` pertenece a `concept`. */
export function instance(individual: string, concept: DLConcept): DLAxiom {
  return { kind: 'instance', left: individual, right: concept };
}

/** Aserción de rol ABox: (from, to) ∈ role. */
export function roleInstance(from: string, role: string, to: string): DLAxiom {
  return { kind: 'role-instance', left: from, right: to, role };
}

/** Devuelve una base de conocimiento vacía (TBox y ABox vacíos). */
export function emptyKB(): DLKnowledgeBase {
  return { tbox: [], abox: [] };
}
