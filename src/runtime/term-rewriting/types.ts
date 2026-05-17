// ============================================================
// ST Term Rewriting — Tipos públicos
// ============================================================
//
// Un Term Rewriting System (TRS) es un conjunto de reglas
//   l → r
// donde l y r son términos de primer orden y vars(r) ⊆ vars(l).
//
// La reescritura aplica una regla buscando un subtérmino que
// unifique (match) con el LHS y lo reemplaza por la sustitución
// del RHS. Se itera hasta llegar a forma normal (sin redex
// aplicables) o hasta saturar maxSteps.
//
// Aplicaciones:
//   - Normalización en pruebas con igualdad (decision procedures).
//   - Simplificación simbólica.
//   - Modelado de teorías ecuacionales (grupos, anillos, listas).
//   - Confluencia + terminación ⇒ decisión de equivalencia.

/**
 * Término de primer orden.
 *
 * - `var`:  variable de unificación (e.g., x, y, z).
 * - `func`: símbolo de función con aridad implícita por len(args).
 *           args = [] significa constante (e.g., 0, e, true).
 */
export type Term = { kind: 'var'; name: string } | { kind: 'func'; name: string; args: Term[] };

/**
 * Regla de reescritura l → r.
 *
 * Invariante: vars(r) ⊆ vars(l). Si no se cumple, normalización
 * puede introducir variables libres y romper la lógica.
 */
export interface RewriteRule {
  lhs: Term;
  rhs: Term;
}

/**
 * Term Rewriting System.
 */
export interface TRS {
  rules: RewriteRule[];
}

/**
 * Sustitución: mapa variable → término.
 */
export type Substitution = Map<string, Term>;

/**
 * Resultado de Knuth-Bendix completion.
 *
 * - `trs`:            sistema final (potencialmente extendido).
 * - `completed`:      true si convergió (sin critical pairs unjoinables).
 * - `criticalPairs`:  total de pares críticos examinados.
 * - `steps`:          iteraciones del loop principal.
 */
export interface KBResult {
  trs: TRS;
  completed: boolean;
  criticalPairs: number;
  steps: number;
}

/**
 * Opciones para Knuth-Bendix completion.
 *
 * - `ordering`:  estrategia para orientar nuevas ecuaciones.
 *                Por default LPO (Lexicographic Path Order).
 * - `maxSteps`:  cota para evitar loops infinitos cuando el sistema
 *                no es completable (KB es semi-decidible).
 * - `precedence`: orden parcial sobre símbolos de función
 *                (map name → priority; mayor = mayor en el orden).
 *                Requerido para LPO.
 */
export interface KBOptions {
  ordering?: 'lpo' | 'kbo';
  maxSteps?: number;
  precedence?: Map<string, number>;
}
