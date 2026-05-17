/**
 * Matching de patrones contra fórmulas cacheadas.
 *
 * Un patrón usa `?x`, `?y`, … como metavariables. Para que un patrón
 * matchee una fórmula, debe existir una asignación consistente
 * (cada metavariable mapea a un único identificador en la fórmula).
 *
 * Ejemplos:
 *   patrón `?x -> ?x`  matchea  `P -> P`         (con x=P)
 *   patrón `?x -> ?x`  NO matchea  `P -> Q`
 *   patrón `?x -> ?y`  matchea  `P -> Q`         (con x=P, y=Q)
 *   patrón `?x -> ?y`  matchea  `P -> P`         (con x=P, y=P)
 */

import { normalizeWhitespace } from './canonical';

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

// Token: meta-variable (?name), identificador, número, símbolo.
const TOKEN_RE = /\?[A-Za-z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*|\d+|[^\sA-Za-z0-9_]/g;

function tokenize(s: string): string[] {
  const normalized = normalizeWhitespace(s);
  return normalized.match(TOKEN_RE) ?? [];
}

/**
 * Intenta matchear un patrón contra una fórmula. Retorna la
 * asignación de metavariables si matchea, o `undefined` si no.
 */
export function matchPattern(pattern: string, formula: string): Record<string, string> | undefined {
  const patternTokens = tokenize(pattern);
  const formulaTokens = tokenize(formula);

  if (patternTokens.length !== formulaTokens.length) return undefined;

  const bindings: Record<string, string> = {};

  for (let i = 0; i < patternTokens.length; i++) {
    const pt = patternTokens[i];
    const ft = formulaTokens[i];

    if (pt.startsWith('?')) {
      const metaName = pt.slice(1);
      const existing = bindings[metaName];
      if (existing === undefined) {
        // ft debe ser un identificador (no operador / paréntesis).
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ft) || RESERVED.has(ft)) {
          return undefined;
        }
        bindings[metaName] = ft;
      } else if (existing !== ft) {
        return undefined;
      }
    } else if (pt !== ft) {
      return undefined;
    }
  }

  return bindings;
}

/**
 * Comprueba si un patrón matchea (al menos una vez) sobre la fórmula
 * completa, sin extraer las bindings.
 */
export function patternMatches(pattern: string, formula: string): boolean {
  return matchPattern(pattern, formula) !== undefined;
}
