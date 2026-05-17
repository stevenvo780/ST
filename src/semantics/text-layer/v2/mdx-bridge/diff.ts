/**
 * MDX diff — detecta qué claims cambiaron entre dos versiones de un MDX.
 *
 * Algoritmo:
 *   1. Parsear ambas versiones a Claim[] (ignorando bloques malformados).
 *   2. Indexar por id.
 *   3. added   = ids en `after` que no estaban en `before`.
 *      removed = ids en `before` que ya no están en `after`.
 *      modified = ids en ambos cuyos campos lógicos difieren.
 */

import type { Claim } from '../types';

import { mdxToClaims, stripMDXMetadata } from './parser';
import type { MDXDelta } from './types';

const sortedDeps = (deps: readonly string[]): string[] => [...deps].sort();

/**
 * Compara dos Claim por igualdad lógica (id, formula, profile, dependencies
 * como conjunto). Ignora `source` y campos extra.
 */
const claimsEqual = (a: Claim, b: Claim): boolean => {
  if (a.id !== b.id) return false;
  if (a.formula !== b.formula) return false;
  if (a.profile !== b.profile) return false;
  const da = sortedDeps(a.dependencies);
  const db = sortedDeps(b.dependencies);
  if (da.length !== db.length) return false;
  for (let i = 0; i < da.length; i++) {
    if (da[i] !== db[i]) return false;
  }
  return true;
};

export const diffMDX = (before: string, after: string): MDXDelta => {
  const beforeClaims = mdxToClaims(before).map(stripMDXMetadata);
  const afterClaims = mdxToClaims(after).map(stripMDXMetadata);

  const beforeById = new Map<string, Claim>();
  for (const c of beforeClaims) beforeById.set(c.id, c);
  const afterById = new Map<string, Claim>();
  for (const c of afterClaims) afterById.set(c.id, c);

  const added: Claim[] = [];
  const removed: string[] = [];
  const modified: Array<{ id: string; before: Claim; after: Claim }> = [];

  for (const [id, afterC] of afterById) {
    const beforeC = beforeById.get(id);
    if (!beforeC) {
      added.push(afterC);
    } else if (!claimsEqual(beforeC, afterC)) {
      modified.push({ id, before: beforeC, after: afterC });
    }
  }

  for (const id of beforeById.keys()) {
    if (!afterById.has(id)) removed.push(id);
  }

  // Determinismo por id.
  added.sort((a, b) => a.id.localeCompare(b.id));
  removed.sort();
  modified.sort((a, b) => a.id.localeCompare(b.id));

  return { added, removed, modified };
};
