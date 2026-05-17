/**
 * MDX → Claim[] parser.
 *
 * Reconoce dos formatos en cualquier orden y en cualquier posición del
 * documento (dentro de prosa, dentro de listas, etc):
 *
 *   - HTML comment style:
 *       <!-- st:claim id="c1" profile="p" formula="A->B" deps="c0,c2" -->
 *
 *   - Fenced code block style:
 *       ```st-claim id=c1 profile=p deps=c0
 *       A->B
 *       ```
 *
 * Bloques malformados (sin id, sin profile, sin formula, etc.) se ignoran
 * acumulando un warning. NUNCA lanza.
 */

import type { Claim } from '../types';

import type { MDXClaim, MDXParseResult, MDXParseWarning } from './types';

const COMMENT_RE = /<!--\s*st:claim\s+([^]*?)-->/g;
// Fence: ```st-claim [opts]\n...body...\n```
// Tolerante con espacios y con el cierre exacto de 3 backticks.
const FENCE_RE = /```st-claim([^\n]*)\n([\s\S]*?)\n```/g;

const truncate = (s: string, max = 80): string =>
  s.length > max ? s.slice(0, max - 3) + '...' : s;

/**
 * Parsea una lista de atributos clave=valor. Soporta:
 *   - id="c1" o id='c1' (con comillas)
 *   - id=c1 (sin comillas, hasta whitespace)
 *   - claves repetidas: la última gana
 *
 * Devuelve un mapa case-sensitive.
 */
const parseAttrs = (raw: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  // Pattern por iteración: key=value-con-o-sin-quotes
  const re = /([a-zA-Z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`<>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const key = m[1];
    if (key === undefined) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[key] = value;
  }
  return attrs;
};

const parseDeps = (raw: string | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const buildClaim = (
  attrs: Record<string, string>,
  formula: string,
  rawBlock: string,
  offset: number,
): { ok: true; claim: MDXClaim } | { ok: false; warning: MDXParseWarning } => {
  const id = attrs.id?.trim();
  const profile = attrs.profile?.trim();
  const trimmedFormula = formula.trim();

  if (!id) {
    return {
      ok: false,
      warning: {
        offset,
        message: 'st:claim sin id',
        snippet: truncate(rawBlock),
      },
    };
  }
  if (!profile) {
    return {
      ok: false,
      warning: {
        offset,
        message: `st:claim '${id}' sin profile`,
        snippet: truncate(rawBlock),
      },
    };
  }
  if (!trimmedFormula) {
    return {
      ok: false,
      warning: {
        offset,
        message: `st:claim '${id}' sin formula`,
        snippet: truncate(rawBlock),
      },
    };
  }

  const dependencies = parseDeps(attrs.deps ?? attrs.dependencies);

  const claim: MDXClaim = {
    id,
    formula: trimmedFormula,
    profile,
    dependencies,
    rawBlock,
  };

  // Source location (offset en el MDX original). docId queda vacío — el
  // caller puede inyectarlo si necesita persistir.
  claim.source = { docId: '', offset };

  return { ok: true, claim };
};

/**
 * Versión "rica" — devuelve también warnings. La API pública delega aquí.
 */
export const mdxToClaimsDetailed = (mdx: string): MDXParseResult => {
  const claims: MDXClaim[] = [];
  const warnings: MDXParseWarning[] = [];
  const seenIds = new Set<string>();

  // Reset stateful regex flags per call (defensa porque /g mantiene lastIndex).
  COMMENT_RE.lastIndex = 0;
  FENCE_RE.lastIndex = 0;

  // 1) Comentarios HTML
  let cm: RegExpExecArray | null;
  while ((cm = COMMENT_RE.exec(mdx)) !== null) {
    const rawBlock = cm[0];
    const attrRaw = cm[1] ?? '';
    const offset = cm.index;
    const attrs = parseAttrs(attrRaw);
    // En comment-style, la fórmula viene en el atributo `formula`.
    const formula = attrs.formula ?? '';
    const built = buildClaim(attrs, formula, rawBlock, offset);
    if (!built.ok) {
      warnings.push(built.warning);
      continue;
    }
    if (seenIds.has(built.claim.id)) {
      warnings.push({
        offset,
        message: `st:claim id duplicado: '${built.claim.id}'`,
        snippet: truncate(rawBlock),
      });
      continue;
    }
    seenIds.add(built.claim.id);
    claims.push(built.claim);
  }

  // 2) Code fences ```st-claim
  let fm: RegExpExecArray | null;
  while ((fm = FENCE_RE.exec(mdx)) !== null) {
    const rawBlock = fm[0];
    const attrRaw = fm[1] ?? '';
    const body = fm[2] ?? '';
    const offset = fm.index;
    const attrs = parseAttrs(attrRaw);
    const built = buildClaim(attrs, body, rawBlock, offset);
    if (!built.ok) {
      warnings.push(built.warning);
      continue;
    }
    if (seenIds.has(built.claim.id)) {
      warnings.push({
        offset,
        message: `st:claim id duplicado: '${built.claim.id}'`,
        snippet: truncate(rawBlock),
      });
      continue;
    }
    seenIds.add(built.claim.id);
    claims.push(built.claim);
  }

  // Orden estable por offset (mezcla comments + fences en orden de aparición).
  claims.sort((a, b) => {
    const ao = a.source?.offset ?? 0;
    const bo = b.source?.offset ?? 0;
    return ao - bo;
  });

  return { claims, warnings };
};

/**
 * MDX → Claim[]. Tolera bloques malformados ignorándolos.
 */
export const mdxToClaims = (mdx: string): MDXClaim[] => {
  return mdxToClaimsDetailed(mdx).claims;
};

/**
 * Helper interno: convierte MDXClaim a Claim "pelado" (sin rawBlock/source).
 * Útil para diff que sólo compara campos lógicos.
 */
export const stripMDXMetadata = (claim: MDXClaim): Claim => {
  const { id, formula, profile, dependencies } = claim;
  return {
    id,
    formula,
    profile,
    dependencies: [...dependencies],
  };
};
