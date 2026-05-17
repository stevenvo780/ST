// ============================================================
// ST Anti-Unification — Tipos públicos
// ============================================================
//
// Anti-unification (también: lgg = least general generalization,
// most-specific generalization) es el dual de la unificación.
//
// Dados dos términos t1, t2, calcula el TERM más específico g
// tal que existen sustituciones σ1, σ2 con:
//
//   σ1(g) = t1      y      σ2(g) = t2
//
// Aplicaciones:
//   - Machine learning de patrones (Plotkin 1970, Reynolds 1970).
//   - Descubrimiento de generalizations en demostraciones.
//   - Inducción por ejemplo en programación lógica.
//   - Síntesis de lemas en sistemas de prueba.
//
// La firma del módulo usa un Term ligeramente más expresivo que
// term-rewriting/types.ts: admite `const` explícitamente además
// de `var` y `func`. En la práctica `const` es azúcar para `func`
// con `args: []`, pero se mantiene como kind separado por claridad
// pedagógica (el módulo es referenciado desde ejemplos educativos).

/**
 * Término de primer orden para anti-unification.
 *
 * - `var`:   variable de unificación.
 * - `func`:  símbolo de función con aridad implícita por len(args).
 * - `const`: constante (sin args). Equivalente a `func` con args=[]
 *            pero distinguible sintácticamente.
 */
export interface Term {
  kind: 'var' | 'func' | 'const';
  name: string;
  args?: Term[];
}

/**
 * Resultado de anti-unification.
 *
 * - `generalization`: el lgg (least general generalization) — el
 *   término más específico tal que ambos t1 y t2 son instancias.
 * - `substLeft`:  σ_L tal que σ_L(generalization) = t1.
 * - `substRight`: σ_R tal que σ_R(generalization) = t2.
 * - `variables`:  variables frescas introducidas en `generalization`
 *   por desacuerdos (en orden de aparición).
 *
 * Invariante: para toda v ∈ variables, substLeft.get(v) y
 * substRight.get(v) están definidas y son distintas estructuralmente
 * (si fueran iguales, no habría hecho falta introducir la fresh var).
 */
export interface AntiUnificationResult {
  generalization: Term;
  substLeft: Map<string, Term>;
  substRight: Map<string, Term>;
  variables: string[];
}

/**
 * Fuente de variables frescas. Una función que cada vez que se
 * invoca devuelve un nombre nuevo (no usado previamente).
 *
 * Default (cuando no se pasa): genera `_g0`, `_g1`, `_g2`, …
 */
export type FreshSupply = () => string;
