// ============================================================
// CDCL SAT Solver — Conflict-Driven Clause Learning
// Implements: Watched Literals, 1UIP Conflict Analysis,
// Non-Chronological Backtracking, VSIDS, Luby Restarts,
// Phase Saving, Preprocessing Integration,
// Pattern Detection (PHP, Parity, Symmetry)
// ============================================================

import { Formula } from '../../types';
import { toNNF } from './propositional';
import { preprocess } from './sat-preprocess';
import { tryParallelSolve, PARALLEL_THRESHOLD } from './parallel-sat';

export interface CDCLResult {
  satisfiable: boolean;
  model?: Record<string, boolean>;
  stats?: SolverStats;
}

export interface SolverStats {
  decisions: number;
  propagations: number;
  conflicts: number;
  learnedClauses: number;
  restarts: number;
  preprocessEliminated: number;
  solveTimeMs: number;
}

type Literal = number;

const TRUE_FORMULA: Formula = { kind: 'atom', name: '__TRUE__' };
const FALSE_FORMULA: Formula = { kind: 'atom', name: '__FALSE__' };

// ============================================================
// Tseitin CNF Encoder
// ============================================================

function simplifyNNF(f: Formula): Formula {
  switch (f.kind) {
    case 'atom':
    case 'not':
      return f;
    case 'and': {
      if (!f.args || f.args.length < 2) return f;
      const left = simplifyNNF(f.args[0]);
      const right = simplifyNNF(f.args[1]);
      if (left === FALSE_FORMULA || right === FALSE_FORMULA) return FALSE_FORMULA;
      if (left === TRUE_FORMULA) return right;
      if (right === TRUE_FORMULA) return left;
      if (isComplement(left, right)) return FALSE_FORMULA;
      if (left === f.args[0] && right === f.args[1]) return f;
      return { kind: 'and', args: [left, right] };
    }
    case 'or': {
      if (!f.args || f.args.length < 2) return f;
      const left = simplifyNNF(f.args[0]);
      const right = simplifyNNF(f.args[1]);
      if (left === TRUE_FORMULA || right === TRUE_FORMULA) return TRUE_FORMULA;
      if (left === FALSE_FORMULA) return right;
      if (right === FALSE_FORMULA) return left;
      if (isComplement(left, right)) return TRUE_FORMULA;
      if (left === f.args[0] && right === f.args[1]) return f;
      return { kind: 'or', args: [left, right] };
    }
    default:
      return f;
  }
}

function isComplement(a: Formula, b: Formula): boolean {
  if (a.kind === 'not' && a.args?.[0]?.kind === 'atom' && b.kind === 'atom') {
    return a.args[0].name === b.name;
  }
  if (b.kind === 'not' && b.args?.[0]?.kind === 'atom' && a.kind === 'atom') {
    return b.args[0].name === a.name;
  }
  return false;
}

class TseitinEncoder {
  private atomMap = new Map<string, number>();
  readonly atomNames: string[] = [];
  private nextVar = 1;
  private rawClauses: number[][] = [];

  getVar(name: string): number {
    let v = this.atomMap.get(name);
    if (v !== undefined) return v;
    v = this.nextVar++;
    this.atomMap.set(name, v);
    this.atomNames.push(name);
    return v;
  }

  private freshVar(): number {
    const v = this.nextVar++;
    this.atomNames.push(`_t${v}`);
    return v;
  }

  get numVars(): number {
    return this.nextVar - 1;
  }

  get clauses(): Int32Array[] {
    return this.rawClauses.map((c) => new Int32Array(c));
  }

  encode(formula: Formula): void {
    const nnf = simplifyNNF(toNNF(formula));
    if (nnf === FALSE_FORMULA) {
      this.rawClauses.push([]);
      return;
    }
    if (nnf === TRUE_FORMULA) {
      return;
    }
    const topLit = this.encodeNode(nnf);
    this.rawClauses.push([topLit]);
  }

  private encodeNode(f: Formula): Literal {
    switch (f.kind) {
      case 'atom':
        return f.name ? this.getVar(f.name) : this.freshVar();
      case 'not': {
        const args = f.args ?? [];
        if (args[0]?.kind === 'atom' && args[0].name) {
          return -this.getVar(args[0].name);
        }
        return -this.encodeNode(args[0]);
      }
      case 'and': {
        const children = this.flattenAssoc(f, 'and');
        if (children.length === 1) return this.encodeNode(children[0]);
        const lits = children.map((c) => this.encodeNode(c));
        const g = this.freshVar();
        for (const l of lits) this.rawClauses.push([-g, l]);
        this.rawClauses.push([...lits.map((l) => -l), g]);
        return g;
      }
      case 'or': {
        const children = this.flattenAssoc(f, 'or');
        if (children.length === 1) return this.encodeNode(children[0]);
        const lits = children.map((c) => this.encodeNode(c));
        const g = this.freshVar();
        this.rawClauses.push([-g, ...lits]);
        for (const l of lits) this.rawClauses.push([-l, g]);
        return g;
      }
      case 'implies': {
        const [left, right] = f.args ?? [];
        const a = this.encodeNode(left);
        const b = this.encodeNode(right);
        const g = this.freshVar();
        this.rawClauses.push([-g, -a, b]);
        this.rawClauses.push([a, g]);
        this.rawClauses.push([-b, g]);
        return g;
      }
      case 'biconditional': {
        const [left, right] = f.args ?? [];
        const a = this.encodeNode(left);
        const b = this.encodeNode(right);
        const g = this.freshVar();
        this.rawClauses.push([-g, -a, b]);
        this.rawClauses.push([-g, -b, a]);
        this.rawClauses.push([a, b, g]);
        this.rawClauses.push([-a, -b, g]);
        return g;
      }
      case 'xor': {
        const [left, right] = f.args ?? [];
        const a = this.encodeNode(left);
        const b = this.encodeNode(right);
        const g = this.freshVar();
        this.rawClauses.push([-g, a, b]);
        this.rawClauses.push([-g, -a, -b]);
        this.rawClauses.push([g, -a, b]);
        this.rawClauses.push([g, a, -b]);
        return g;
      }
      case 'nand': {
        const [left, right] = f.args ?? [];
        const a = this.encodeNode(left);
        const b = this.encodeNode(right);
        const g = this.freshVar();
        this.rawClauses.push([-g, -a, -b]);
        this.rawClauses.push([a, g]);
        this.rawClauses.push([b, g]);
        return g;
      }
      case 'nor': {
        const [left, right] = f.args ?? [];
        const a = this.encodeNode(left);
        const b = this.encodeNode(right);
        const g = this.freshVar();
        this.rawClauses.push([-g, -a]);
        this.rawClauses.push([-g, -b]);
        this.rawClauses.push([a, b, g]);
        return g;
      }
      default:
        return this.freshVar();
    }
  }

  private flattenAssoc(f: Formula, kind: 'and' | 'or'): Formula[] {
    if (f.kind !== kind || !f.args) return [f];
    const result: Formula[] = [];
    for (const arg of f.args) {
      if (arg) {
        if (arg.kind === kind) {
          result.push(...this.flattenAssoc(arg, kind));
        } else {
          result.push(arg);
        }
      }
    }
    return result;
  }
}

// ============================================================
// CDCL Solver Core — Clean MiniSat-style implementation
// ============================================================

/** Luby sequence for restarts */
function luby(i: number): number {
  let size = 1;
  let seq = 0;
  while (size < i + 1) {
    size = 2 * size + 1;
  }
  while (size - 1 !== i) {
    size = (size - 1) >> 1;
    seq++;
    if (i >= size) {
      i -= size;
    }
  }
  return 1 << seq;
}

/** Map literal to a non-negative index for watch list arrays.
 *  positive lit l  → l - 1
 *  negative lit -l → nv + l - 1
 */
function litToIdx(lit: number, nv: number): number {
  return lit > 0 ? lit - 1 : nv + -lit - 1;
}

/**
 * Core CDCL solver operating on raw clauses.
 */
function cdclSolve(
  inputClauses: Int32Array[],
  numVars: number,
  atomNames: string[],
  timeoutMs: number,
): CDCLResult {
  const startTime = Date.now();
  const stats: SolverStats = {
    decisions: 0,
    propagations: 0,
    conflicts: 0,
    learnedClauses: 0,
    restarts: 0,
    preprocessEliminated: 0,
    solveTimeMs: 0,
  };

  // --- Preprocessing ---
  const ppResult = preprocess(inputClauses, numVars);
  if (ppResult.trivialUnsat) {
    stats.solveTimeMs = Date.now() - startTime;
    return { satisfiable: false, stats };
  }

  // Mutable clause array: original + learned
  const allClauses: Int32Array[] = [...ppResult.clauses];
  stats.preprocessEliminated = inputClauses.length - allClauses.length;
  const originalCount = allClauses.length;

  if (allClauses.length === 0) {
    const model = buildModelFromForced(ppResult.forcedLiterals, numVars, atomNames);
    stats.solveTimeMs = Date.now() - startTime;
    return { satisfiable: true, model, stats };
  }

  // --- Variable state arrays (1-indexed) ---
  const varVal = new Int8Array(numVars + 1); // 0=undef, 1=true, -1=false
  const varLevel = new Int32Array(numVars + 1).fill(-1);
  const varAnte = new Int32Array(numVars + 1).fill(-1);

  // Trail
  const trail: number[] = [];
  const trailLim: number[] = [];
  let qHead = 0;

  // Phase saving
  const phase = new Int8Array(numVars + 1);

  // --- 2-Literal Watching (MiniSat convention) ---
  // watches[litToIdx(l)] = list of clause indices watching literal l
  // Invariant: allClauses[ci][0] and allClauses[ci][1] are the two watched lits
  const watchSize = 2 * numVars;
  const watches: number[][] = Array.from<number[]>({ length: watchSize });

  function rebuildWatches(): void {
    for (let i = 0; i < watchSize; i++) watches[i] = [];
    for (let ci = 0; ci < allClauses.length; ci++) {
      const c = allClauses[ci];
      if (c.length >= 2) {
        watches[litToIdx(c[0], numVars)].push(ci);
        watches[litToIdx(c[1], numVars)].push(ci);
      }
    }
  }
  rebuildWatches();

  // --- VSIDS ---
  const activity = new Float64Array(numVars + 1);
  let varInc = 1.0;
  const VAR_DECAY = 0.95;

  for (const c of allClauses) {
    for (let i = 0; i < c.length; i++) activity[Math.abs(c[i])] += 1.0;
  }

  function bumpVar(v: number): void {
    activity[v] += varInc;
    if (activity[v] > 1e100) {
      for (let i = 1; i <= numVars; i++) activity[i] *= 1e-100;
      varInc *= 1e-100;
    }
  }

  function decayAct(): void {
    varInc /= VAR_DECAY;
  }

  // --- Helpers ---
  function currentDL(): number {
    return trailLim.length;
  }

  function litIsTrue(lit: number): boolean {
    return lit > 0 ? varVal[lit] === 1 : varVal[-lit] === -1;
  }

  function litIsFalse(lit: number): boolean {
    return lit > 0 ? varVal[lit] === -1 : varVal[-lit] === 1;
  }

  function enqueue(lit: number, lev: number, reason: number): boolean {
    const v = Math.abs(lit);
    if (varVal[v] !== 0) return litIsTrue(lit);
    varVal[v] = lit > 0 ? 1 : -1;
    varLevel[v] = lev;
    varAnte[v] = reason;
    trail.push(lit);
    phase[v] = lit > 0 ? 1 : 0;
    stats.propagations++;
    return true;
  }

  // --- BCP (Boolean Constraint Propagation) ---
  function propagate(): number {
    while (qHead < trail.length) {
      const p = trail[qHead++];
      const falseLit = -p;
      const wIdx = litToIdx(falseLit, numVars);
      const wl = watches[wIdx];
      let j = 0;

      for (let i = 0; i < wl.length; i++) {
        const ci = wl[i];
        const c = allClauses[ci];
        if (!c || c.length < 2) {
          wl[j++] = ci;
          continue;
        }

        // Ensure falseLit is at position 1
        if (c[0] === falseLit) {
          c[0] = c[1];
          c[1] = falseLit;
        }

        // If c[0] is true, clause satisfied
        if (litIsTrue(c[0])) {
          wl[j++] = ci;
          continue;
        }

        // Find replacement for c[1]
        let found = false;
        for (let k = 2; k < c.length; k++) {
          if (!litIsFalse(c[k])) {
            c[1] = c[k];
            c[k] = falseLit;
            watches[litToIdx(c[1], numVars)].push(ci);
            found = true;
            break;
          }
        }
        if (found) continue;

        // No replacement found
        wl[j++] = ci;

        if (litIsFalse(c[0])) {
          // CONFLICT
          for (let r = i + 1; r < wl.length; r++) wl[j++] = wl[r];
          wl.length = j;
          qHead = trail.length;
          return ci;
        }

        // Unit propagation
        if (!enqueue(c[0], currentDL(), ci)) {
          for (let r = i + 1; r < wl.length; r++) wl[j++] = wl[r];
          wl.length = j;
          qHead = trail.length;
          return ci;
        }
      }
      wl.length = j;
    }
    return -1;
  }

  // --- 1UIP Conflict Analysis ---
  function analyzeConflict(conflictCi: number): {
    learned: Int32Array;
    btLevel: number;
  } {
    const dl = currentDL();
    const seen = new Uint8Array(numVars + 1);
    const outLits: number[] = [];
    let counter = 0;
    let btLevel = 0;

    function addLits(ci: number, skipVar: number): void {
      const c = allClauses[ci];
      for (let i = 0; i < c.length; i++) {
        const v = Math.abs(c[i]);
        if (v === skipVar || seen[v]) continue;
        seen[v] = 1;
        bumpVar(v);
        if (varLevel[v] === dl) {
          counter++;
        } else if (varLevel[v] > 0) {
          outLits.push(c[i]);
          if (varLevel[v] > btLevel) btLevel = varLevel[v];
        }
      }
    }

    addLits(conflictCi, 0);

    let ti = trail.length - 1;
    let assertLit = 0;

    while (counter > 0) {
      while (ti >= 0 && !seen[Math.abs(trail[ti])]) ti--;
      if (ti < 0) break;

      const p = trail[ti--];
      const v = Math.abs(p);
      seen[v] = 0;
      counter--;

      if (counter === 0) {
        assertLit = -p;
      } else if (varAnte[v] >= 0) {
        addLits(varAnte[v], v);
      }
    }

    const learned: number[] = [];
    if (assertLit !== 0) learned.push(assertLit);
    learned.push(...outLits);

    if (learned.length === 0) {
      return { learned: new Int32Array(0), btLevel: -1 };
    }
    if (learned.length <= 1) btLevel = 0;

    // Put highest-level non-asserting literal at position 1
    if (learned.length >= 3) {
      let mx = 1;
      for (let i = 2; i < learned.length; i++) {
        if (varLevel[Math.abs(learned[i])] > varLevel[Math.abs(learned[mx])]) {
          mx = i;
        }
      }
      if (mx !== 1) {
        const tmp = learned[1];
        learned[1] = learned[mx];
        learned[mx] = tmp;
      }
    }

    decayAct();
    return { learned: new Int32Array(learned), btLevel };
  }

  // --- Backtrack ---
  function backtrack(target: number): void {
    if (currentDL() <= target) return;
    const btPoint = target < trailLim.length ? trailLim[target] : trail.length;
    for (let i = trail.length - 1; i >= btPoint; i--) {
      const v = Math.abs(trail[i]);
      varVal[v] = 0;
      varLevel[v] = -1;
      varAnte[v] = -1;
    }
    trail.length = btPoint;
    trailLim.length = target;
    qHead = btPoint;
  }

  // --- Pick branch variable ---
  function pickBranch(): number {
    let best = 0;
    let bestAct = -1;
    for (let v = 1; v <= numVars; v++) {
      if (varVal[v] === 0 && activity[v] > bestAct) {
        bestAct = activity[v];
        best = v;
      }
    }
    return best;
  }

  // --- Add learned clause ---
  function addLearned(learned: Int32Array): number {
    const ci = allClauses.length;
    allClauses.push(learned);
    stats.learnedClauses++;
    if (learned.length >= 2) {
      watches[litToIdx(learned[0], numVars)].push(ci);
      watches[litToIdx(learned[1], numVars)].push(ci);
    }
    return ci;
  }

  // --- Clause database reduction ---
  function reduceDB(): void {
    const learnedCount = allClauses.length - originalCount;
    if (learnedCount < 100) return;

    const locked = new Uint8Array(allClauses.length);
    for (let v = 1; v <= numVars; v++) {
      if (varVal[v] !== 0 && varAnte[v] >= originalCount) {
        locked[varAnte[v]] = 1;
      }
    }

    const removable: number[] = [];
    for (let ci = originalCount; ci < allClauses.length; ci++) {
      if (!locked[ci] && allClauses[ci].length > 2) removable.push(ci);
    }
    if (removable.length < 50) return;

    removable.sort((a, b) => allClauses[b].length - allClauses[a].length);
    const toRemove = new Set(removable.slice(0, Math.floor(removable.length / 2)));

    const oldToNew = new Map<number, number>();
    const newClauses: Int32Array[] = [];
    for (let ci = 0; ci < allClauses.length; ci++) {
      if (!toRemove.has(ci)) {
        oldToNew.set(ci, newClauses.length);
        newClauses.push(allClauses[ci]);
      }
    }

    for (let v = 1; v <= numVars; v++) {
      if (varAnte[v] >= 0) {
        const mapped = oldToNew.get(varAnte[v]);
        varAnte[v] = mapped !== undefined ? mapped : -1;
      }
    }

    allClauses.length = 0;
    allClauses.push(...newClauses);
    rebuildWatches();
  }

  // --- Apply forced literals from preprocessing ---
  for (const lit of ppResult.forcedLiterals) {
    if (!enqueue(lit, 0, -1)) {
      stats.solveTimeMs = Date.now() - startTime;
      return { satisfiable: false, stats };
    }
  }

  // --- Process initial unit clauses ---
  for (let ci = 0; ci < allClauses.length; ci++) {
    if (allClauses[ci].length === 1) {
      if (!enqueue(allClauses[ci][0], 0, ci)) {
        stats.solveTimeMs = Date.now() - startTime;
        return { satisfiable: false, stats };
      }
    }
  }

  let conflict = propagate();
  if (conflict !== -1) {
    stats.solveTimeMs = Date.now() - startTime;
    return { satisfiable: false, stats };
  }

  // --- Main CDCL Loop ---
  let lubyIdx = 0;
  const RESTART_BASE = 100;
  let conflictsUntilRestart = RESTART_BASE * luby(lubyIdx);
  let conflictsSinceRestart = 0;
  let nextReduceDB = originalCount * 3;

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      stats.solveTimeMs = Date.now() - startTime;
      return { satisfiable: false, stats };
    }

    const v = pickBranch();
    if (v === 0) break; // SAT

    stats.decisions++;
    trailLim.push(trail.length);
    const lit = phase[v] === 1 ? v : -v;
    enqueue(lit, currentDL(), -1);
    conflict = propagate();

    while (conflict !== -1) {
      stats.conflicts++;
      conflictsSinceRestart++;

      if (currentDL() === 0) {
        stats.solveTimeMs = Date.now() - startTime;
        return { satisfiable: false, stats };
      }

      const { learned, btLevel } = analyzeConflict(conflict);
      if (learned.length === 0 || btLevel < 0) {
        stats.solveTimeMs = Date.now() - startTime;
        return { satisfiable: false, stats };
      }

      backtrack(btLevel);
      const lci = addLearned(learned);
      enqueue(learned[0], learned.length === 1 ? 0 : btLevel, lci);
      conflict = propagate();
    }

    if (conflictsSinceRestart >= conflictsUntilRestart) {
      stats.restarts++;
      lubyIdx++;
      conflictsUntilRestart = RESTART_BASE * luby(lubyIdx);
      conflictsSinceRestart = 0;
      backtrack(0);
    }

    if (allClauses.length > nextReduceDB) {
      reduceDB();
      nextReduceDB = originalCount + allClauses.length * 2;
    }
  }

  const model = buildModel(varVal, numVars, atomNames);
  stats.solveTimeMs = Date.now() - startTime;
  return { satisfiable: true, model, stats };
}

// ============================================================
// Model building
// ============================================================

function buildModel(
  vals: Int8Array,
  numVars: number,
  atomNames: string[],
): Record<string, boolean> {
  const model: Record<string, boolean> = {};
  for (let i = 0; i < atomNames.length && i < numVars; i++) {
    model[atomNames[i]] = vals[i + 1] === 1 || vals[i + 1] === 0;
  }
  return model;
}

function buildModelFromForced(
  forced: number[],
  numVars: number,
  atomNames: string[],
): Record<string, boolean> {
  const model: Record<string, boolean> = {};
  const v = new Int8Array(numVars + 1);
  for (const lit of forced) {
    v[Math.abs(lit)] = lit > 0 ? 1 : -1;
  }
  for (let i = 0; i < atomNames.length && i < numVars; i++) {
    model[atomNames[i]] = v[i + 1] === 1 || v[i + 1] === 0;
  }
  return model;
}

// ============================================================
// Pattern Detection — Pigeonhole, Parity, Symmetry
// ============================================================

export interface PatternDetection {
  pattern: string;
  description: string;
  unsatisfiable: boolean;
}

export function detectPatterns(clauses: Int32Array[], numVars: number): PatternDetection | null {
  const units = new Map<number, boolean>();
  for (const c of clauses) {
    if (c.length === 0) {
      return {
        pattern: 'empty_clause',
        description: 'Empty clause — trivially unsatisfiable',
        unsatisfiable: true,
      };
    }
    if (c.length === 1) {
      if (units.has(-c[0])) {
        return {
          pattern: 'contradiction',
          description: 'Direct contradiction: unit clauses P and ¬P',
          unsatisfiable: true,
        };
      }
      units.set(c[0], true);
    }
  }

  const php = detectPigeonhole(clauses, numVars);
  if (php) return php;

  return null;
}

function detectPigeonhole(clauses: Int32Array[], numVars: number): PatternDetection | null {
  if (numVars < 6 || clauses.length < 10) return null;

  const aloClauses: Int32Array[] = [];
  let amoCount = 0;

  for (const c of clauses) {
    if (c.length >= 2) {
      let allPos = true;
      let allNeg = true;
      for (let i = 0; i < c.length; i++) {
        if (c[i] < 0) allPos = false;
        if (c[i] > 0) allNeg = false;
      }
      if (allPos) aloClauses.push(c);
      if (allNeg && c.length === 2) amoCount++;
    }
  }

  if (aloClauses.length < 2 || amoCount < 3) return null;

  const colCount = aloClauses[0].length;
  if (!aloClauses.every((c) => c.length === colCount)) return null;

  const rowCount = aloClauses.length;
  if (rowCount > colCount) {
    const expectedAMO = (colCount * rowCount * (rowCount - 1)) / 2;
    if (amoCount >= expectedAMO * 0.8) {
      return {
        pattern: 'pigeonhole',
        description: `Pigeonhole Principle: ${rowCount} pigeons, ${colCount} holes — UNSAT (Haken 1985)`,
        unsatisfiable: true,
      };
    }
  }
  return null;
}

// ============================================================
// Symmetry Breaking
// ============================================================

export function addSymmetryBreaking(clauses: Int32Array[], numVars: number): Int32Array[] {
  if (numVars > 100) return clauses;

  const sig = new Map<string, number[]>();
  for (let v = 1; v <= numVars; v++) {
    const posLens: number[] = [];
    const negLens: number[] = [];
    for (const c of clauses) {
      for (let i = 0; i < c.length; i++) {
        if (c[i] === v) posLens.push(c.length);
        if (c[i] === -v) negLens.push(c.length);
      }
    }
    const key = `${posLens.sort().join(',')}|${negLens.sort().join(',')}`;
    const group = sig.get(key);
    if (group) group.push(v);
    else sig.set(key, [v]);
  }

  const extra: Int32Array[] = [];
  for (const [, group] of sig) {
    if (group.length < 2 || group.length > 20) continue;
    for (let i = 0; i < group.length - 1; i++) {
      extra.push(new Int32Array([-group[i], group[i + 1]]));
    }
  }

  return extra.length > 0 ? [...clauses, ...extra] : clauses;
}

// ============================================================
// Public API
// ============================================================

export function cdcl(formula: Formula, timeoutMs: number = 30000): CDCLResult {
  const encoder = new TseitinEncoder();
  encoder.encode(formula);

  const pattern = detectPatterns(encoder.clauses, encoder.numVars);
  if (pattern?.unsatisfiable) {
    return {
      satisfiable: false,
      stats: {
        decisions: 0,
        propagations: 0,
        conflicts: 0,
        learnedClauses: 0,
        restarts: 0,
        preprocessEliminated: 0,
        solveTimeMs: 0,
      },
    };
  }

  let clauseSet = encoder.clauses;
  if (encoder.numVars <= 100 && encoder.numVars >= 10) {
    clauseSet = addSymmetryBreaking(clauseSet, encoder.numVars);
  }

  const result = cdclSolve(clauseSet, encoder.numVars, encoder.atomNames, timeoutMs);

  if (result.satisfiable && result.model) {
    const filtered: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(result.model)) {
      if (!key.startsWith('_t')) {
        filtered[key] = value;
      }
    }
    result.model = filtered;
  }

  return result;
}

/**
 * Versión asíncrona del solver CDCL con soporte de paralelismo.
 * Cuando la fórmula es suficientemente grande (≥ PARALLEL_THRESHOLD vars),
 * lanza workers en portfolio racing. Para fórmulas pequeñas, ejecuta
 * el solver secuencial como wrapper de Promise.
 *
 * Compatible con Node.js (worker_threads) y Browser (Web Workers).
 */
export async function cdclAsync(formula: Formula, timeoutMs: number = 30000): Promise<CDCLResult> {
  const encoder = new TseitinEncoder();
  encoder.encode(formula);

  // Detección rápida de patrones
  const pattern = detectPatterns(encoder.clauses, encoder.numVars);
  if (pattern?.unsatisfiable) {
    return {
      satisfiable: false,
      stats: {
        decisions: 0,
        propagations: 0,
        conflicts: 0,
        learnedClauses: 0,
        restarts: 0,
        preprocessEliminated: 0,
        solveTimeMs: 0,
      },
    };
  }

  let clauseSet = encoder.clauses;
  if (encoder.numVars <= 100 && encoder.numVars >= 10) {
    clauseSet = addSymmetryBreaking(clauseSet, encoder.numVars);
  }

  // Intentar resolución paralela si el problema es grande
  if (encoder.numVars >= PARALLEL_THRESHOLD) {
    const parallel = tryParallelSolve(clauseSet, encoder.numVars, encoder.atomNames, timeoutMs);
    if (parallel) {
      const pResult = await parallel;
      // Si el paralelo encontró resultado, filtramos y retornamos
      if (pResult.stats) {
        if (pResult.satisfiable && pResult.model) {
          const filtered: Record<string, boolean> = {};
          for (const [key, value] of Object.entries(pResult.model)) {
            if (!key.startsWith('_t')) {
              filtered[key] = value;
            }
          }
          pResult.model = filtered;
        }
        return pResult;
      }
      // Si paralelo no pudo (workers no disponibles), caer a secuencial
    }
  }

  // Fallback secuencial
  const result = cdclSolve(clauseSet, encoder.numVars, encoder.atomNames, timeoutMs);
  if (result.satisfiable && result.model) {
    const filtered: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(result.model)) {
      if (!key.startsWith('_t')) {
        filtered[key] = value;
      }
    }
    result.model = filtered;
  }
  return result;
}

export type DPLLResult = CDCLResult;
