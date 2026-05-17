/**
 * Finite lattice theory.
 *
 * A lattice is a poset (P, ≤) in which every pair of elements has both
 * a least upper bound (join, ∨) and a greatest lower bound (meet, ∧).
 *
 * This module focuses on **finite** lattices: given the carrier set and
 * a `leq` predicate, we derive join/meet exhaustively (O(n^3) per pair
 * via direct search). That is enough for the structural checks
 * downstream — distributivity, modularity, complementation, Heyting
 * implication — which are themselves O(n^3) or O(n^4) and not meant
 * for n ≫ 100.
 *
 * Notable theorems used:
 *   - Dedekind: a lattice is **modular** iff it has no sublattice
 *     isomorphic to the pentagon N5.
 *   - Birkhoff: a lattice is **distributive** iff it has no sublattice
 *     isomorphic to N5 *or* to the diamond M3.
 *
 * Equality of carrier elements is decided by *antisymmetry of leq*:
 * `a === b` whenever `leq(a,b) && leq(b,a)`. This lets callers use
 * structural elements like `Set<string>` without supplying their own
 * equality predicate.
 */

export interface FiniteLattice<T> {
  readonly elements: ReadonlyArray<T>;
  readonly leq: (a: T, b: T) => boolean;
  readonly join: (a: T, b: T) => T;
  readonly meet: (a: T, b: T) => T;
  readonly top: T;
  readonly bottom: T;
}

const eq = <T>(leq: (a: T, b: T) => boolean, a: T, b: T): boolean => leq(a, b) && leq(b, a);

const indexOf = <T>(L: FiniteLattice<T>, x: T): number => {
  for (let i = 0; i < L.elements.length; i++) {
    if (eq(L.leq, L.elements[i], x)) return i;
  }
  return -1;
};

/**
 * Compute least upper bound of a,b within `elements` under `leq`,
 * or null if it does not exist or is not unique.
 */
function computeJoin<T>(
  elements: ReadonlyArray<T>,
  leq: (a: T, b: T) => boolean,
  a: T,
  b: T,
): T | null {
  const upper: T[] = [];
  for (const x of elements) {
    if (leq(a, x) && leq(b, x)) upper.push(x);
  }
  if (upper.length === 0) return null;
  // Find unique minimum of `upper` under leq.
  let candidate: T | null = null;
  for (const u of upper) {
    if (upper.every((v) => leq(u, v))) {
      if (candidate !== null && !eq(leq, candidate, u)) return null;
      candidate = u;
    }
  }
  return candidate;
}

function computeMeet<T>(
  elements: ReadonlyArray<T>,
  leq: (a: T, b: T) => boolean,
  a: T,
  b: T,
): T | null {
  const lower: T[] = [];
  for (const x of elements) {
    if (leq(x, a) && leq(x, b)) lower.push(x);
  }
  if (lower.length === 0) return null;
  let candidate: T | null = null;
  for (const u of lower) {
    if (lower.every((v) => leq(v, u))) {
      if (candidate !== null && !eq(leq, candidate, u)) return null;
      candidate = u;
    }
  }
  return candidate;
}

/**
 * Check that (elements, leq) forms a lattice: poset axioms plus
 * existence of join/meet for every pair.
 */
export function isLattice<T>(elements: ReadonlyArray<T>, leq: (a: T, b: T) => boolean): boolean {
  // Reflexivity
  for (const a of elements) if (!leq(a, a)) return false;
  // Antisymmetry (assuming elements are pairwise distinct under === or
  // under structural identity provided by the caller).
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];
      if (leq(a, b) && leq(b, a)) return false;
    }
  }
  // Transitivity
  for (const a of elements) {
    for (const b of elements) {
      for (const c of elements) {
        if (leq(a, b) && leq(b, c) && !leq(a, c)) return false;
      }
    }
  }
  // Join + meet existence
  for (const a of elements) {
    for (const b of elements) {
      if (computeJoin(elements, leq, a, b) === null) return false;
      if (computeMeet(elements, leq, a, b) === null) return false;
    }
  }
  return true;
}

/**
 * Build a FiniteLattice from carrier + order. Returns null if the
 * structure is not a lattice (missing/non-unique join or meet, or
 * the order itself is malformed).
 */
export function makeLattice<T>(
  elements: ReadonlyArray<T>,
  leq: (a: T, b: T) => boolean,
): FiniteLattice<T> | null {
  if (elements.length === 0) return null;
  if (!isLattice(elements, leq)) return null;
  const els = elements.slice();
  const joinTable = new Map<string, T>();
  const meetTable = new Map<string, T>();
  for (let i = 0; i < els.length; i++) {
    for (let j = 0; j < els.length; j++) {
      const a = els[i];
      const b = els[j];
      const j2 = computeJoin(els, leq, a, b);
      const m2 = computeMeet(els, leq, a, b);
      if (j2 === null || m2 === null) return null;
      joinTable.set(`${i}|${j}`, j2);
      meetTable.set(`${i}|${j}`, m2);
    }
  }
  const lookup = (x: T): number => {
    for (let i = 0; i < els.length; i++) {
      if (eq(leq, els[i], x)) return i;
    }
    return -1;
  };
  const join = (a: T, b: T): T => {
    const i = lookup(a);
    const j = lookup(b);
    if (i < 0 || j < 0) throw new Error('join: element not in lattice');
    return joinTable.get(`${i}|${j}`) as T;
  };
  const meet = (a: T, b: T): T => {
    const i = lookup(a);
    const j = lookup(b);
    if (i < 0 || j < 0) throw new Error('meet: element not in lattice');
    return meetTable.get(`${i}|${j}`) as T;
  };
  // Top: an element ≥ every element.
  let top: T | null = null;
  for (const t of els) {
    if (els.every((x) => leq(x, t))) {
      top = t;
      break;
    }
  }
  let bottom: T | null = null;
  for (const t of els) {
    if (els.every((x) => leq(t, x))) {
      bottom = t;
      break;
    }
  }
  if (top === null || bottom === null) return null;
  return {
    elements: els,
    leq,
    join,
    meet,
    top,
    bottom,
  };
}

/**
 * Distributive: a ∧ (b ∨ c) = (a ∧ b) ∨ (a ∧ c) for all a,b,c.
 */
export function isDistributive<T>(L: FiniteLattice<T>): boolean {
  for (const a of L.elements) {
    for (const b of L.elements) {
      for (const c of L.elements) {
        const lhs = L.meet(a, L.join(b, c));
        const rhs = L.join(L.meet(a, b), L.meet(a, c));
        if (!eq(L.leq, lhs, rhs)) return false;
      }
    }
  }
  return true;
}

/**
 * Modular: a ≤ c ⇒ a ∨ (b ∧ c) = (a ∨ b) ∧ c.
 */
export function isModular<T>(L: FiniteLattice<T>): boolean {
  for (const a of L.elements) {
    for (const b of L.elements) {
      for (const c of L.elements) {
        if (!L.leq(a, c)) continue;
        const lhs = L.join(a, L.meet(b, c));
        const rhs = L.meet(L.join(a, b), c);
        if (!eq(L.leq, lhs, rhs)) return false;
      }
    }
  }
  return true;
}

/**
 * Find a complement of `a`: some x with a ∨ x = ⊤ and a ∧ x = ⊥.
 * Returns the first match (lattice may have multiple), or null.
 */
export function complement<T>(L: FiniteLattice<T>, a: T): T | null {
  for (const x of L.elements) {
    if (eq(L.leq, L.join(a, x), L.top) && eq(L.leq, L.meet(a, x), L.bottom)) {
      return x;
    }
  }
  return null;
}

/**
 * Complemented: every element has at least one complement.
 */
export function isComplemented<T>(L: FiniteLattice<T>): boolean {
  for (const a of L.elements) {
    if (complement(L, a) === null) return false;
  }
  return true;
}

/**
 * Boolean lattice: distributive + complemented.
 * In finite Boolean lattices, complements are automatically unique.
 */
export function isBoolean<T>(L: FiniteLattice<T>): boolean {
  return isDistributive(L) && isComplemented(L);
}

/**
 * Relative pseudo-complement of `a` with respect to `b`: the largest
 * x such that a ∧ x ≤ b. Equivalently the Heyting implication a ⇒ b.
 * Returns null if no largest x exists.
 */
export function relativeComplement<T>(L: FiniteLattice<T>, a: T, b: T): T | null {
  const candidates: T[] = [];
  for (const x of L.elements) {
    if (L.leq(L.meet(a, x), b)) candidates.push(x);
  }
  if (candidates.length === 0) return null;
  let max: T | null = null;
  for (const u of candidates) {
    if (candidates.every((v) => L.leq(v, u))) {
      if (max !== null && !eq(L.leq, max, u)) return null;
      max = u;
    }
  }
  return max;
}

/**
 * Heyting algebra: distributive lattice in which every pair (a,b)
 * has a relative pseudo-complement a ⇒ b.
 *
 * In finite lattices, distributivity is equivalent to existence of
 * relative pseudo-complements, so any finite distributive lattice is
 * automatically Heyting. We still check both for clarity.
 */
export function isHeyting<T>(L: FiniteLattice<T>): boolean {
  if (!isDistributive(L)) return false;
  for (const a of L.elements) {
    for (const b of L.elements) {
      if (relativeComplement(L, a, b) === null) return false;
    }
  }
  return true;
}

/**
 * Atoms: elements that cover ⊥ (i.e. ⊥ < a with no element strictly
 * between).
 */
export function atoms<T>(L: FiniteLattice<T>): T[] {
  const res: T[] = [];
  for (const a of L.elements) {
    if (eq(L.leq, a, L.bottom)) continue;
    let covers = true;
    for (const x of L.elements) {
      if (eq(L.leq, x, L.bottom) || eq(L.leq, x, a)) continue;
      if (L.leq(L.bottom, x) && L.leq(x, a)) {
        covers = false;
        break;
      }
    }
    if (covers) res.push(a);
  }
  return res;
}

/**
 * Coatoms: elements covered by ⊤.
 */
export function coatoms<T>(L: FiniteLattice<T>): T[] {
  const res: T[] = [];
  for (const a of L.elements) {
    if (eq(L.leq, a, L.top)) continue;
    let covers = true;
    for (const x of L.elements) {
      if (eq(L.leq, x, L.top) || eq(L.leq, x, a)) continue;
      if (L.leq(a, x) && L.leq(x, L.top)) {
        covers = false;
        break;
      }
    }
    if (covers) res.push(a);
  }
  return res;
}

/**
 * Detect a sublattice isomorphic to the pentagon N5.
 *
 * N5 is the 5-element lattice on {⊥, a, b, c, ⊤} with:
 *   - ⊥ < a < c < ⊤ (a chain of length 3)
 *   - ⊥ < b < ⊤ (b incomparable to both a and c)
 *   - a ∧ b = ⊥, a ∨ b = ⊤, c ∧ b = ⊥, c ∨ b = ⊤.
 *
 * Equivalent to: there exist 5 distinct elements x0 < x1 < x2 and y,
 * with y incomparable to x1 and to x2 minus x0, top = x2 ∨ y,
 * bottom = x0 ∧ y, and y ∨ x1 = y ∨ x2, y ∧ x1 = y ∧ x2.
 */
export function containsPentagon<T>(L: FiniteLattice<T>): boolean {
  const els = L.elements;
  for (const x0 of els) {
    for (const x1 of els) {
      // Strict x0 < x1.
      if (eq(L.leq, x0, x1) || !L.leq(x0, x1)) continue;
      for (const x2 of els) {
        // Strict x1 < x2.
        if (eq(L.leq, x1, x2) || !L.leq(x1, x2)) continue;
        for (const y of els) {
          // y distinct from x0, x1, x2 and incomparable to x1 and x2.
          if (
            eq(L.leq, y, x0) ||
            eq(L.leq, y, x1) ||
            eq(L.leq, y, x2) ||
            L.leq(y, x1) ||
            L.leq(x1, y) ||
            L.leq(y, x2) ||
            L.leq(x2, y)
          ) {
            continue;
          }
          // Check N5 closure:
          //   y ∧ x1 = y ∧ x2 = x0
          //   y ∨ x1 = y ∨ x2  (this is the pentagon's top)
          const m1 = L.meet(y, x1);
          const m2 = L.meet(y, x2);
          const j1 = L.join(y, x1);
          const j2 = L.join(y, x2);
          if (eq(L.leq, m1, x0) && eq(L.leq, m2, x0) && eq(L.leq, j1, j2)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * Detect a sublattice isomorphic to the diamond M3.
 *
 * M3 is the 5-element lattice with one bottom, one top, and three
 * mutually incomparable elements between, each pair joining to ⊤
 * and meeting to ⊥.
 */
export function containsDiamond<T>(L: FiniteLattice<T>): boolean {
  const els = L.elements;
  for (let i = 0; i < els.length; i++) {
    for (let j = i + 1; j < els.length; j++) {
      for (let k = j + 1; k < els.length; k++) {
        const a = els[i];
        const b = els[j];
        const c = els[k];
        // pairwise incomparable
        if (L.leq(a, b) || L.leq(b, a)) continue;
        if (L.leq(a, c) || L.leq(c, a)) continue;
        if (L.leq(b, c) || L.leq(c, b)) continue;
        const jab = L.join(a, b);
        const jac = L.join(a, c);
        const jbc = L.join(b, c);
        const mab = L.meet(a, b);
        const mac = L.meet(a, c);
        const mbc = L.meet(b, c);
        if (!eq(L.leq, jab, jac) || !eq(L.leq, jac, jbc)) continue;
        if (!eq(L.leq, mab, mac) || !eq(L.leq, mac, mbc)) continue;
        // join must be strictly above each, meet strictly below.
        if (eq(L.leq, jab, a) || eq(L.leq, jab, b) || eq(L.leq, jab, c)) continue;
        if (eq(L.leq, mab, a) || eq(L.leq, mab, b) || eq(L.leq, mab, c)) continue;
        return true;
      }
    }
  }
  return false;
}

export interface DedekindAnalysis {
  readonly distributive: boolean;
  readonly modular: boolean;
  readonly pentagonFree: boolean;
  readonly diamondFree: boolean;
}

/**
 * Dedekind / Birkhoff structural analysis. By the two classical
 * theorems:
 *   modular   ⇔ pentagon-free
 *   distributive ⇔ pentagon-free AND diamond-free
 * We compute both algebraically and by sublattice search; the result
 * agrees on well-formed finite lattices.
 */
export function dedekindAnalysis<T>(L: FiniteLattice<T>): DedekindAnalysis {
  const pentagonFree = !containsPentagon(L);
  const diamondFree = !containsDiamond(L);
  // We rely on the algebraic checks as the source of truth; the
  // sublattice flags are reported alongside for diagnostic use.
  return {
    distributive: isDistributive(L),
    modular: isModular(L),
    pentagonFree,
    diamondFree,
  };
}

// ---------------------------------------------------------------------------
// Pre-built lattices
// ---------------------------------------------------------------------------

/**
 * Power set lattice 2^S ordered by inclusion. For |S|=n this has
 * 2^n elements; keep n small (≤ 6).
 */
export function powerSetLattice(baseElements: ReadonlyArray<string>): FiniteLattice<Set<string>> {
  const base = Array.from(new Set(baseElements));
  const n = base.length;
  const subsets: Set<string>[] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    const s = new Set<string>();
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) s.add(base[i]);
    }
    subsets.push(s);
  }
  const leq = (a: Set<string>, b: Set<string>): boolean => {
    for (const x of a) if (!b.has(x)) return false;
    return true;
  };
  const L = makeLattice(subsets, leq);
  if (L === null) throw new Error('powerSetLattice: failed to build');
  return L;
}

/**
 * Divisors of n ordered by divisibility. (Lattice for any positive n.)
 */
export function divisibilityLattice(n: number): FiniteLattice<number> {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('divisibilityLattice: n must be a positive integer');
  }
  const divs: number[] = [];
  for (let d = 1; d <= n; d++) {
    if (n % d === 0) divs.push(d);
  }
  const leq = (a: number, b: number): boolean => b % a === 0;
  const L = makeLattice(divs, leq);
  if (L === null) throw new Error('divisibilityLattice: failed to build');
  return L;
}

/**
 * Chain of n elements 0 < 1 < ... < n-1.
 */
export function chain(n: number): FiniteLattice<number> {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('chain: n must be ≥ 1');
  }
  const els: number[] = [];
  for (let i = 0; i < n; i++) els.push(i);
  const leq = (a: number, b: number): boolean => a <= b;
  const L = makeLattice(els, leq);
  if (L === null) throw new Error('chain: failed to build');
  return L;
}

/**
 * Pentagon N5: the classical non-modular 5-element lattice.
 *
 * Hasse diagram:
 *        T
 *       / \
 *      c   b
 *      |   |
 *      a   |
 *       \ /
 *        B
 */
export function pentagonN5(): FiniteLattice<string> {
  const els = ['B', 'a', 'c', 'b', 'T'];
  const order: Record<string, ReadonlyArray<string>> = {
    B: ['B', 'a', 'c', 'b', 'T'],
    a: ['a', 'c', 'T'],
    c: ['c', 'T'],
    b: ['b', 'T'],
    T: ['T'],
  };
  const leq = (x: string, y: string): boolean => (order[x] ?? []).includes(y);
  const L = makeLattice(els, leq);
  if (L === null) throw new Error('pentagonN5: failed to build');
  return L;
}

/**
 * Diamond M3: modular but not distributive 5-element lattice.
 *
 * Hasse diagram:
 *        T
 *      / | \
 *     a  b  c
 *      \ | /
 *        B
 */
export function diamondM3(): FiniteLattice<string> {
  const els = ['B', 'a', 'b', 'c', 'T'];
  const order: Record<string, ReadonlyArray<string>> = {
    B: ['B', 'a', 'b', 'c', 'T'],
    a: ['a', 'T'],
    b: ['b', 'T'],
    c: ['c', 'T'],
    T: ['T'],
  };
  const leq = (x: string, y: string): boolean => (order[x] ?? []).includes(y);
  const L = makeLattice(els, leq);
  if (L === null) throw new Error('diamondM3: failed to build');
  return L;
}

// Internal helper, exported for tests that want to look up by index.
export { indexOf as _indexOfElement };
