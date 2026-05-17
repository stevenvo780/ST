/**
 * Canonicalización de fórmulas (string-based) para el theorem cache.
 *
 * El objetivo no es parsear lógica completa, sino normalizar:
 * - whitespace
 * - mapear identificadores (átomos / metavariables) a placeholders
 *   canónicos en orden de primera aparición, preservando estructura.
 *
 * Resultado: `P -> P` y `Q -> Q` producen la misma forma canónica
 * (`?0 -> ?0`), mientras que `P -> Q` produce `?0 -> ?1`. Esto soporta
 * proof reuse via substitución.
 *
 * Símbolos lógicos reservados (palabras clave) NO se renombran:
 *   not, and, or, implies, iff, forall, exists, true, false, ->,
 *   →, ∧, ∨, ¬, ↔, ∀, ∃, ⊤, ⊥
 */

const RESERVED = new Set<string>([
  'not',
  'and',
  'or',
  'implies',
  'iff',
  'forall',
  'exists',
  'true',
  'false',
  'True',
  'False',
  'TRUE',
  'FALSE',
]);

const IDENT_RE = /[A-Za-z_][A-Za-z0-9_]*/g;

/**
 * Normaliza whitespace: colapsa runs de espacio/tabs/newlines a un solo
 * espacio, y trimea. Mantiene la separación de tokens.
 */
export function normalizeWhitespace(formula: string): string {
  return formula.replace(/\s+/g, ' ').trim();
}

/**
 * Devuelve la forma canónica de una fórmula como string.
 *
 * Cada identificador no reservado se reemplaza por `?N` donde N es el
 * orden de primera aparición. La estructura (operadores, paréntesis,
 * cuantificadores) se preserva intacta tras normalizar whitespace.
 *
 * También devuelve el mapping inverso (canonical → original) para
 * poder reconstruir substituciones.
 */
export interface CanonicalResult {
  canonical: string;
  /** Mapping de original → placeholder. Ej: `{P: "?0", Q: "?1"}` */
  forward: Map<string, string>;
  /** Mapping de placeholder → original. Ej: `{"?0": "P", "?1": "Q"}` */
  reverse: Map<string, string>;
}

export function canonicalize(formula: string): CanonicalResult {
  const normalized = normalizeWhitespace(formula);
  const forward = new Map<string, string>();
  const reverse = new Map<string, string>();
  let counter = 0;

  const canonical = normalized.replace(IDENT_RE, (match) => {
    if (RESERVED.has(match)) return match;
    let placeholder = forward.get(match);
    if (placeholder === undefined) {
      placeholder = `?${counter++}`;
      forward.set(match, placeholder);
      reverse.set(placeholder, match);
    }
    return placeholder;
  });

  return { canonical, forward, reverse };
}

/**
 * Versión simple que sólo devuelve el string canónico.
 */
export function canonicalString(formula: string): string {
  return canonicalize(formula).canonical;
}

/**
 * Intenta encontrar una substitución que mapee la fórmula cacheada
 * al target. Si las formas canónicas coinciden, calcula el mapping
 * desde los identificadores originales del teorema hacia los del
 * target.
 *
 * Retorna `undefined` si no son canónicamente equivalentes.
 */
export function computeSubstitution(
  cachedFormula: string,
  targetFormula: string,
): Record<string, string> | undefined {
  const c1 = canonicalize(cachedFormula);
  const c2 = canonicalize(targetFormula);

  if (c1.canonical !== c2.canonical) return undefined;

  const substitution: Record<string, string> = {};
  for (const [original, placeholder] of c1.forward) {
    const targetOriginal = c2.reverse.get(placeholder);
    if (targetOriginal === undefined) return undefined;
    substitution[original] = targetOriginal;
  }
  return substitution;
}

/**
 * Aplica una substitución textual (mapping original → reemplazo) a
 * una fórmula, respetando límites de identificador. Útil para
 * rehidratar pruebas reutilizadas.
 */
export function applySubstitution(formula: string, substitution: Record<string, string>): string {
  return formula.replace(IDENT_RE, (match) => {
    if (RESERVED.has(match)) return match;
    return substitution[match] ?? match;
  });
}
