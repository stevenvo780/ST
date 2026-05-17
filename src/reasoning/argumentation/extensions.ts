// ============================================================
// ST Argumentation — Computación de extensiones (Dung 1995)
// ============================================================

import type { ArgumentationFramework, ComputeOptions, Semantics } from './types';
import { DEFAULT_EXHAUSTIVE_LIMIT } from './types';
import {
  attackedBySet,
  characteristicFunction,
  isAdmissible,
  isConflictFree,
  isSubset,
  setsEqual,
} from './framework';

function emptySet(): Set<string> {
  return new Set<string>();
}

export function groundedExtension(af: ArgumentationFramework): Set<string> {
  let current = emptySet();
  while (true) {
    const next = characteristicFunction(af, current);
    if (setsEqual(current, next)) return current;
    current = next;
  }
}

export function isComplete(af: ArgumentationFramework, set: Set<string>): boolean {
  if (!isAdmissible(af, set)) return false;
  const defended = characteristicFunction(af, set);
  return setsEqual(defended, set);
}

export function isStable(af: ArgumentationFramework, set: Set<string>): boolean {
  if (!isConflictFree(af, set)) return false;
  const attacked = attackedBySet(af, set);
  for (const arg of af.arguments) {
    if (set.has(arg)) continue;
    if (!attacked.has(arg)) return false;
  }
  return true;
}

function enumerateAdmissibleSets(
  af: ArgumentationFramework,
  options: Required<ComputeOptions>,
): Set<string>[] {
  const args = Array.from(af.arguments).sort();
  const n = args.length;
  if (n > options.exhaustiveLimit) {
    if (options.warnOnLarge) {
      console.warn(
        `[argumentation] AF con ${String(n)} argumentos excede límite exhaustivo ${String(options.exhaustiveLimit)} — usar iterador lazy`,
      );
    }
  }
  const result: Set<string>[] = [];
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    const subset = new Set<string>();
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        const arg = args[i];
        if (arg !== undefined) subset.add(arg);
      }
    }
    if (isAdmissible(af, subset)) result.push(subset);
  }
  return result;
}

export function* lazyAdmissibleSets(af: ArgumentationFramework): Generator<Set<string>> {
  const args = Array.from(af.arguments).sort();
  const n = args.length;
  if (n > 30) {
    throw new Error(
      `[argumentation] AF con ${String(n)} argumentos: el iterador lazy también es exponencial. Considera otra técnica.`,
    );
  }
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    const subset = new Set<string>();
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        const arg = args[i];
        if (arg !== undefined) subset.add(arg);
      }
    }
    if (isAdmissible(af, subset)) yield subset;
  }
}

function maximalSets(sets: Set<string>[]): Set<string>[] {
  const result: Set<string>[] = [];
  for (let i = 0; i < sets.length; i++) {
    const candidate = sets[i];
    if (candidate === undefined) continue;
    let dominated = false;
    for (let j = 0; j < sets.length; j++) {
      if (i === j) continue;
      const other = sets[j];
      if (other === undefined) continue;
      if (other.size > candidate.size && isSubset(candidate, other)) {
        dominated = true;
        break;
      }
    }
    if (!dominated) result.push(candidate);
  }
  return result;
}

export function preferredExtensions(
  af: ArgumentationFramework,
  options: Required<ComputeOptions>,
): Set<string>[] {
  const admissible = enumerateAdmissibleSets(af, options);
  return maximalSets(admissible);
}

export function completeExtensions(
  af: ArgumentationFramework,
  options: Required<ComputeOptions>,
): Set<string>[] {
  const admissible = enumerateAdmissibleSets(af, options);
  const result: Set<string>[] = [];
  for (const set of admissible) {
    const defended = characteristicFunction(af, set);
    if (setsEqual(defended, set)) result.push(set);
  }
  return result;
}

export function stableExtensions(
  af: ArgumentationFramework,
  options: Required<ComputeOptions>,
): Set<string>[] {
  const admissible = enumerateAdmissibleSets(af, options);
  const result: Set<string>[] = [];
  for (const set of admissible) {
    if (isStable(af, set)) result.push(set);
  }
  return result;
}

export function semiStableExtensions(
  af: ArgumentationFramework,
  options: Required<ComputeOptions>,
): Set<string>[] {
  const completes = completeExtensions(af, options);
  if (completes.length === 0) return [];
  let bestRange = -1;
  let candidates: Set<string>[] = [];
  for (const set of completes) {
    const range = set.size + attackedBySet(af, set).size;
    if (range > bestRange) {
      bestRange = range;
      candidates = [set];
    } else if (range === bestRange) {
      candidates.push(set);
    }
  }
  return maximalSets(candidates);
}

export function computeExtensions(
  af: ArgumentationFramework,
  semantics: Semantics,
  options: ComputeOptions = {},
): Set<string>[] {
  const opts: Required<ComputeOptions> = {
    exhaustiveLimit: options.exhaustiveLimit ?? DEFAULT_EXHAUSTIVE_LIMIT,
    warnOnLarge: options.warnOnLarge ?? true,
  };
  switch (semantics) {
    case 'grounded':
      return [groundedExtension(af)];
    case 'preferred':
      return preferredExtensions(af, opts);
    case 'stable':
      return stableExtensions(af, opts);
    case 'complete':
      return completeExtensions(af, opts);
    case 'semi-stable':
      return semiStableExtensions(af, opts);
  }
}
