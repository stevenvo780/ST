// ============================================================
// SAT Preprocessing — Simplification before solving
// Implements: Subsumption Elimination, Self-Subsuming Resolution,
// Bounded Variable Elimination, Failed Literal Probing
// ============================================================

type Clause = Int32Array;

/**
 * Result of preprocessing: simplified clauses and any forced assignments.
 */
export interface PreprocessResult {
  clauses: Clause[];
  forcedLiterals: number[];  // literals that must be true
  eliminated: boolean;       // true if clauses were reduced
  trivialUnsat: boolean;     // true if empty clause found
}

/**
 * Check if clause A subsumes clause B (A ⊂ B as sets).
 * If A subsumes B, B is redundant and can be removed.
 */
function subsumes(a: Clause, b: Clause): boolean {
  if (a.length >= b.length) return false;
  let ai = 0;
  for (let bi = 0; bi < b.length && ai < a.length; bi++) {
    if (a[ai] === b[bi]) ai++;
  }
  return ai === a.length;
}

/**
 * Subsumption Elimination:
 * If clause A ⊂ clause B, remove B (it's redundant).
 */
function subsumptionElimination(clauses: Clause[]): Clause[] {
  // Sort clauses by length for efficient checking
  const sorted = clauses.slice().sort((a, b) => a.length - b.length);
  const removed = new Uint8Array(sorted.length);

  for (let i = 0; i < sorted.length; i++) {
    if (removed[i]) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      if (removed[j]) continue;
      if (subsumes(sorted[i], sorted[j])) {
        removed[j] = 1;
      }
    }
  }

  const result: Clause[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (!removed[i]) result.push(sorted[i]);
  }
  return result;
}

/**
 * Remove duplicate literals within each clause and sort them.
 * Also removes tautological clauses (containing both x and -x).
 */
function normalizeClauses(clauses: Clause[]): Clause[] {
  const result: Clause[] = [];
  for (const clause of clauses) {
    const sorted = Array.from(clause).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
    // Remove duplicates and check for tautology
    const deduped: number[] = [];
    let tautology = false;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] === sorted[i - 1]) continue;
      // Check for complementary literals
      if (i > 0 && sorted[i] === -sorted[i - 1]) {
        tautology = true;
        break;
      }
      deduped.push(sorted[i]);
    }
    if (!tautology) {
      result.push(new Int32Array(deduped));
    }
  }
  return result;
}

/**
 * Remove duplicate clauses using signature hashing.
 */
function removeDuplicateClauses(clauses: Clause[]): Clause[] {
  const seen = new Set<string>();
  const result: Clause[] = [];
  for (const c of clauses) {
    const key = c.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

/**
 * Self-Subsuming Resolution:
 * If resolving A with B produces a clause that subsumes A, replace A with the resolvent.
 * Example: {P, Q, R} resolved with {¬P, Q} → {Q, R} which subsumes {P, Q, R}
 */
function selfSubsumingResolution(clauses: Clause[]): Clause[] {
  const result = clauses.slice();
  let changed = true;
  let iterations = 0;
  const maxIterations = 3; // Limit passes to prevent excessive computation

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    for (let i = 0; i < result.length; i++) {
      const ci = result[i];
      if (ci.length === 0) continue;
      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const cj = result[j];
        if (cj.length === 0 || cj.length > ci.length) continue;
        // Try to resolve cj against ci on some literal
        for (let li = 0; li < ci.length; li++) {
          const lit = ci[li];
          // Check if cj contains -lit and all other literals of cj are in ci
          let hasNegLit = false;
          let allOthersInCi = true;
          for (let lj = 0; lj < cj.length; lj++) {
            if (cj[lj] === -lit) {
              hasNegLit = true;
            } else {
              // Check if this literal is also in ci
              let found = false;
              for (let lk = 0; lk < ci.length; lk++) {
                if (ci[lk] === cj[lj]) { found = true; break; }
              }
              if (!found) { allOthersInCi = false; break; }
            }
          }
          if (hasNegLit && allOthersInCi) {
            // Self-subsumption: remove lit from ci
            const newClause: number[] = [];
            for (let lk = 0; lk < ci.length; lk++) {
              if (ci[lk] !== lit) newClause.push(ci[lk]);
            }
            result[i] = new Int32Array(newClause);
            changed = true;
            break;
          }
        }
      }
    }
  }
  return result;
}

/**
 * Bounded Variable Elimination (BVE):
 * If a variable appears few times, resolve all its positive clauses against
 * negative clauses and check if the result is smaller.
 */
function boundedVariableElimination(clauses: Clause[], numVars: number): { clauses: Clause[]; eliminated: Set<number> } {
  const eliminated = new Set<number>();
  let current = clauses.slice();
  const MAX_GROWTH = 0; // Only eliminate if it doesn't increase clause count

  for (let v = 1; v <= numVars; v++) {
    const posClauses: number[] = [];
    const negClauses: number[] = [];
    for (let ci = 0; ci < current.length; ci++) {
      for (let li = 0; li < current[ci].length; li++) {
        if (current[ci][li] === v) { posClauses.push(ci); break; }
        if (current[ci][li] === -v) { negClauses.push(ci); break; }
      }
    }

    // Skip if too many resolvents would be created
    if (posClauses.length * negClauses.length > posClauses.length + negClauses.length + MAX_GROWTH) {
      continue;
    }

    // Generate all resolvents
    const resolvents: Clause[] = [];
    let tooLarge = false;
    for (const pi of posClauses) {
      for (const ni of negClauses) {
        const resolvent = resolve(current[pi], current[ni], v);
        if (resolvent === null) continue; // tautology
        resolvents.push(resolvent);
      }
    }
    if (tooLarge) continue;

    // Only eliminate if result has fewer or equal clauses
    if (resolvents.length <= posClauses.length + negClauses.length) {
      // Remove old clauses and add resolvents
      const toRemove = new Set([...posClauses, ...negClauses]);
      const newClauses: Clause[] = [];
      for (let ci = 0; ci < current.length; ci++) {
        if (!toRemove.has(ci)) newClauses.push(current[ci]);
      }
      newClauses.push(...resolvents);
      current = newClauses;
      eliminated.add(v);
    }
  }

  return { clauses: current, eliminated };
}

/**
 * Resolve two clauses on variable v.
 * Returns null if the resolvent is a tautology.
 */
function resolve(a: Clause, b: Clause, v: number): Clause | null {
  const lits = new Set<number>();
  for (let i = 0; i < a.length; i++) {
    const l = a[i];
    if (l !== v && l !== -v) lits.add(l);
  }
  for (let i = 0; i < b.length; i++) {
    const l = b[i];
    if (l !== v && l !== -v) {
      if (lits.has(-l)) return null; // tautology
      lits.add(l);
    }
  }
  return new Int32Array(Array.from(lits).sort((a, b) => a - b));
}

/**
 * Failed Literal Probing:
 * For each unassigned variable, assume it's true and propagate.
 * If conflict → the variable must be false (and vice versa).
 */
function failedLiteralProbing(
  clauses: Clause[],
  numVars: number
): { forcedLiterals: number[]; clauses: Clause[] } {
  const forced: number[] = [];

  for (let v = 1; v <= numVars; v++) {
    // Try v = true
    const trueResult = probeAssignment(clauses, numVars, v);
    // Try v = false
    const falseResult = probeAssignment(clauses, numVars, -v);

    if (trueResult === 'conflict' && falseResult === 'conflict') {
      // Both conflict → UNSAT, but we handle this later
      return { forcedLiterals: forced, clauses };
    }
    if (trueResult === 'conflict') {
      forced.push(-v);
    } else if (falseResult === 'conflict') {
      forced.push(v);
    }
  }

  // Apply forced literals
  let current = clauses;
  for (const lit of forced) {
    current = applyLiteral(current, lit);
  }

  return { forcedLiterals: forced, clauses: current };
}

/**
 * Probe: assign a literal and run unit propagation.
 * Returns 'conflict' if a conflict is found, 'ok' otherwise.
 */
function probeAssignment(clauses: Clause[], numVars: number, lit: number): 'conflict' | 'ok' {
  let current = applyLiteral(clauses, lit);
  // Run simple unit propagation
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of current) {
      if (c.length === 0) return 'conflict';
      if (c.length === 1) {
        current = applyLiteral(current, c[0]);
        changed = true;
        break;
      }
    }
  }
  return 'ok';
}

/**
 * Apply a literal assignment to a clause set.
 * Removes satisfied clauses and shrinks clauses containing -lit.
 */
function applyLiteral(clauses: Clause[], lit: number): Clause[] {
  const result: Clause[] = [];
  for (const c of clauses) {
    let satisfied = false;
    const remaining: number[] = [];
    for (let i = 0; i < c.length; i++) {
      if (c[i] === lit) { satisfied = true; break; }
      if (c[i] !== -lit) remaining.push(c[i]);
    }
    if (!satisfied) {
      result.push(new Int32Array(remaining));
    }
  }
  return result;
}

/**
 * Main preprocessing pipeline.
 * Applies simplifications in order of effectiveness.
 */
export function preprocess(clauses: Clause[], numVars: number): PreprocessResult {
  // Step 0: normalize and deduplicate
  let current = normalizeClauses(clauses);
  current = removeDuplicateClauses(current);

  // Check trivial cases
  for (const c of current) {
    if (c.length === 0) {
      return { clauses: current, forcedLiterals: [], eliminated: false, trivialUnsat: true };
    }
  }

  const initialCount = current.length;
  const allForced: number[] = [];

  // Step 1: extract unit clauses
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < current.length; i++) {
      if (current[i].length === 1) {
        const lit = current[i][0];
        allForced.push(lit);
        current = applyLiteral(current, lit);
        changed = true;
        break;
      }
    }
  }

  // Step 2: subsumption elimination
  current = subsumptionElimination(current);

  // Step 3: self-subsuming resolution
  current = selfSubsumingResolution(current);

  // Step 4: Bounded Variable Elimination (only for small formulas to avoid blowup)
  if (numVars <= 500) {
    const bve = boundedVariableElimination(current, numVars);
    current = bve.clauses;
  }

  // Step 5: Failed Literal Probing (only for moderate sizes)
  if (numVars <= 200) {
    const flp = failedLiteralProbing(current, numVars);
    allForced.push(...flp.forcedLiterals);
    current = flp.clauses;
  }

  // Final normalization
  current = normalizeClauses(current);
  current = removeDuplicateClauses(current);
  current = subsumptionElimination(current);

  // Check for empty clause after all preprocessing
  for (const c of current) {
    if (c.length === 0) {
      return { clauses: current, forcedLiterals: allForced, eliminated: true, trivialUnsat: true };
    }
  }

  return {
    clauses: current,
    forcedLiterals: allForced,
    eliminated: current.length < initialCount,
    trivialUnsat: false,
  };
}
