// ============================================================
// Modal Frame Axioms — Tipos
// ============================================================
//
// Lógicas modales normales caracterizadas por axiomas de frame:
//
//   T : □φ → φ            reflexividad     ∀w. R(w,w)
//   B : φ → □◇φ           simetría         ∀w,v. R(w,v) → R(v,w)
//   4 : □φ → □□φ          transitividad    ∀w,v,u. R(w,v)∧R(v,u) → R(w,u)
//   5 : ◇φ → □◇φ          euclidianidad    ∀w,v,u. R(w,v)∧R(w,u) → R(v,u)
//   D : □φ → ◇φ           serialidad       ∀w. ∃v. R(w,v)
//
// Sistemas estándar como composiciones:
//
//   K     = ∅          (sin axiomas, sólo K y N)
//   T     = {T}        reflexivo
//   D     = {D}        serial
//   B     = {T, B}     reflexivo + simétrico  (a veces KB = {B} sin T)
//   K4    = {4}        transitivo
//   K5    = {5}        euclidiano
//   KB    = {B}        sólo simétrico
//   S4    = {T, 4}     reflexivo + transitivo
//   S5    = {T, 4, 5}  equivalencia (≡ T+B+4 ≡ T+5)
//   KD45  = {D, 4, 5}  serial + trans + eucl  (modelo doxástico)

/**
 * Axiomas de frame disponibles. Cualquier subconjunto define una
 * lógica modal normal.
 */
export type FrameAxiom = 'T' | 'B' | '4' | '5' | 'D';

/**
 * Sistemas modales nombrados que reconoce {@link systemAxioms}.
 * Cualquier otra combinación puede construirse pasando los axiomas
 * directamente a {@link tableauWithAxioms}.
 */
export type ModalSystem = 'K' | 'T' | 'D' | 'B' | 'S4' | 'S5' | 'KD45' | 'KB' | 'K4' | 'K5';

/**
 * Fórmula modal proposicional. Estructura discriminada por `kind`.
 *
 * Convenciones:
 *   - 'atom'     usa `name`.
 *   - 'not'      usa `arg`.
 *   - 'box'      usa `arg`  (□φ — necesidad).
 *   - 'diamond'  usa `arg`  (◇φ — posibilidad).
 *   - 'and' / 'or' / 'implies' usan `left` y `right`.
 *
 * Se mantiene también `args` como alternativa lista para
 * compatibilidad con consumidores que prefieren n-arios.
 */
export interface ModalFormula {
  kind: 'atom' | 'not' | 'and' | 'or' | 'implies' | 'box' | 'diamond';
  name?: string;
  arg?: ModalFormula;
  args?: ModalFormula[];
  left?: ModalFormula;
  right?: ModalFormula;
}

/**
 * Modelo de Kripke devuelto cuando una fórmula es satisfacible.
 *
 *   - `worlds`        : nombres simbólicos de mundos (e.g. "w0", "w1").
 *   - `accessibility` : aristas dirigidas `[from, to]` del frame.
 *   - `valuation`     : por mundo, los átomos verdaderos en ese mundo.
 *   - `actual`        : mundo "real" donde se evalúa la fórmula
 *                       (típicamente "w0").
 */
export interface KripkeModel {
  worlds: string[];
  accessibility: Array<[string, string]>;
  valuation: Map<string, Set<string>>;
  actual: string;
}

/**
 * Resultado del tableau / búsqueda de modelo.
 *
 *   - `sat`    : ¿existe modelo en el frame indicado?
 *   - `model`  : si `sat`, modelo concreto (raíz = actual world).
 *   - `closed` : ¿el tableau cerró todas las ramas? (= ¬sat).
 *                Para una búsqueda saturada: closed ⇔ ¬sat.
 */
export interface TableauResult {
  sat: boolean;
  model?: KripkeModel;
  closed: boolean;
}
