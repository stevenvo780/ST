// ============================================================
// DPLL SAT Solver with Unit Propagation & Pure Literal Elimination
// Uses Tseitin transformation for linear-size CNF encoding.
// ============================================================

import { Formula } from '../../types';
import { toNNF } from './propositional';

export interface DPLLResult {
  satisfiable: boolean;
  model?: Record<string, boolean>;
}

type Literal = number;
type Clause = Int32Array;

const TRUE_FORMULA: Formula = { kind: 'atom', name: '__TRUE__' };
const FALSE_FORMULA: Formula = { kind: 'atom', name: '__FALSE__' };

/**
 * Simplify NNF formula, detecting trivial contradictions and tautologies.
 */
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
      // Detect (A & !A) pattern
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
      // Detect (A | !A) pattern
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

/**
 * Tseitin CNF encoder: converts an arbitrary propositional formula to CNF
 * in linear time/space by introducing auxiliary variables for each gate.
 */
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

  get clauses(): Clause[] {
    return this.rawClauses.map((c) => new Int32Array(c));
  }

  encode(formula: Formula): void {
    const nnf = simplifyNNF(toNNF(formula));
    // After simplification, check for trivially true/false
    if (nnf === FALSE_FORMULA) {
      this.rawClauses.push([]); // empty clause = unsatisfiable
      return;
    }
    if (nnf === TRUE_FORMULA) {
      return; // no clauses = satisfiable
    }
    const topLit = this.encodeNode(nnf);
    this.rawClauses.push([topLit]);
  }

  private encodeNode(f: Formula): Literal {
    switch (f.kind) {
      case 'atom':
        return f.name ? this.getVar(f.name) : this.freshVar();

      case 'not':
        if (f.args?.[0]?.kind === 'atom' && f.args[0].name) {
          return -this.getVar(f.args[0].name);
        }
        return -this.encodeNode(f.args![0]);

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
        const a = this.encodeNode(f.args![0]);
        const b = this.encodeNode(f.args![1]);
        const g = this.freshVar();
        this.rawClauses.push([-g, -a, b]);
        this.rawClauses.push([a, g]);
        this.rawClauses.push([-b, g]);
        return g;
      }

      case 'biconditional': {
        const a = this.encodeNode(f.args![0]);
        const b = this.encodeNode(f.args![1]);
        const g = this.freshVar();
        this.rawClauses.push([-g, -a, b]);
        this.rawClauses.push([-g, -b, a]);
        this.rawClauses.push([a, b, g]);
        this.rawClauses.push([-a, -b, g]);
        return g;
      }

      case 'xor': {
        const a = this.encodeNode(f.args![0]);
        const b = this.encodeNode(f.args![1]);
        const g = this.freshVar();
        this.rawClauses.push([-g, a, b]);
        this.rawClauses.push([-g, -a, -b]);
        this.rawClauses.push([g, -a, b]);
        this.rawClauses.push([g, a, -b]);
        return g;
      }

      case 'nand': {
        const a = this.encodeNode(f.args![0]);
        const b = this.encodeNode(f.args![1]);
        const g = this.freshVar();
        this.rawClauses.push([-g, -a, -b]);
        this.rawClauses.push([a, g]);
        this.rawClauses.push([b, g]);
        return g;
      }

      case 'nor': {
        const a = this.encodeNode(f.args![0]);
        const b = this.encodeNode(f.args![1]);
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

/**
 * DPLL SAT Solver with unit propagation and pure literal elimination.
 */
export function dpll(formula: Formula, timeoutMs: number = 30000): DPLLResult {
  const encoder = new TseitinEncoder();
  encoder.encode(formula);

  const result = dpllSolve(encoder.clauses, encoder.numVars, encoder.atomNames, timeoutMs);

  if (result.satisfiable && result.model) {
    const filtered: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(result.model)) {
      if (!key.startsWith('_t')) {
        filtered[key] = val;
      }
    }
    result.model = filtered;
  }

  return result;
}

// Status per clause: 0 = active, 1 = satisfied
// Status per variable: 0 = unassigned, 1 = true, -1 = false

function dpllSolve(
  clauses: Clause[],
  numVars: number,
  atomNames: string[],
  timeoutMs: number,
): DPLLResult {
  const startTime = Date.now();
  const numClauses = clauses.length;

  if (numClauses === 0) {
    return { satisfiable: true, model: buildModel(new Int8Array(numVars + 1), atomNames) };
  }

  // Check for empty clauses
  for (const c of clauses) {
    if (c.length === 0) return { satisfiable: false };
  }

  // For each literal, track which clauses contain it
  const litClauses = new Map<number, number[]>();
  for (let ci = 0; ci < numClauses; ci++) {
    for (let li = 0; li < clauses[ci].length; li++) {
      const lit = clauses[ci][li];
      let list = litClauses.get(lit);
      if (!list) {
        list = [];
        litClauses.set(lit, list);
      }
      list.push(ci);
    }
  }

  // Track satisfied clauses and remaining literal counts per clause
  const satisfied = new Uint8Array(numClauses);
  const remaining = new Int32Array(numClauses); // count of non-falsified literals
  const assignment = new Int8Array(numVars + 1); // 0=unset, 1=true, -1=false

  for (let ci = 0; ci < numClauses; ci++) {
    remaining[ci] = clauses[ci].length;
  }

  // Trail for backtracking
  interface TrailEntry {
    variable: number;
    satisfiedClauses: number[]; // clauses that became satisfied
    decrementedClauses: number[]; // clauses where remaining was decremented
  }

  const trail: TrailEntry[] = [];

  function assignLiteral(lit: number): boolean {
    const v = lit > 0 ? lit : -lit;
    const val: 1 | -1 = lit > 0 ? 1 : -1;
    assignment[v] = val;

    const entry: TrailEntry = { variable: v, satisfiedClauses: [], decrementedClauses: [] };
    trail.push(entry);

    // Clauses containing this literal become satisfied
    const posLitClauses = litClauses.get(lit);
    if (posLitClauses) {
      for (const ci of posLitClauses) {
        if (!satisfied[ci]) {
          satisfied[ci] = 1;
          entry.satisfiedClauses.push(ci);
        }
      }
    }

    // Clauses containing -lit lose one literal
    const negLitClauses = litClauses.get(-lit);
    if (negLitClauses) {
      for (const ci of negLitClauses) {
        if (!satisfied[ci]) {
          remaining[ci]--;
          entry.decrementedClauses.push(ci);
          if (remaining[ci] === 0) return false; // conflict: clause falsified
        }
      }
    }

    return true;
  }

  function unassignTrail(count: number): void {
    while (trail.length > count) {
      const entry = trail.pop()!;
      assignment[entry.variable] = 0;
      for (const ci of entry.satisfiedClauses) {
        satisfied[ci] = 0;
      }
      for (const ci of entry.decrementedClauses) {
        remaining[ci]++;
      }
    }
  }

  // Unit propagation: find clauses with remaining === 1 and not satisfied
  function unitPropagation(): boolean {
    let changed = true;
    while (changed) {
      changed = false;
      for (let ci = 0; ci < numClauses; ci++) {
        if (satisfied[ci]) continue;
        if (remaining[ci] === 0) return false;
        if (remaining[ci] === 1) {
          // Find the unassigned literal
          const clause = clauses[ci];
          let unitLit = 0;
          for (let li = 0; li < clause.length; li++) {
            const lit = clause[li];
            const v = lit > 0 ? lit : -lit;
            if (assignment[v] === 0) {
              unitLit = lit;
              break;
            }
          }
          if (unitLit !== 0) {
            if (!assignLiteral(unitLit)) return false;
            changed = true;
          }
        }
      }
    }
    return true;
  }

  // Pure literal elimination
  function pureLiteralElimination(): void {
    for (let v = 1; v <= numVars; v++) {
      if (assignment[v] !== 0) continue;
      let posActive = false;
      let negActive = false;
      const posC = litClauses.get(v);
      if (posC) {
        for (const ci of posC) {
          if (!satisfied[ci]) {
            posActive = true;
            break;
          }
        }
      }
      const negC = litClauses.get(-v);
      if (negC) {
        for (const ci of negC) {
          if (!satisfied[ci]) {
            negActive = true;
            break;
          }
        }
      }
      if (posActive && !negActive) assignLiteral(v);
      else if (!posActive && negActive) assignLiteral(-v);
    }
  }

  function chooseVariable(): number {
    let bestVar = 0;
    let bestScore = -1;
    for (let v = 1; v <= numVars; v++) {
      if (assignment[v] !== 0) continue;
      let score = 0;
      const posC = litClauses.get(v);
      if (posC) {
        for (const ci of posC) {
          if (!satisfied[ci]) score++;
        }
      }
      const negC = litClauses.get(-v);
      if (negC) {
        for (const ci of negC) {
          if (!satisfied[ci]) score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestVar = v;
      }
    }
    return bestVar;
  }

  function solve(): boolean {
    if (Date.now() - startTime > timeoutMs) return false;

    const savePoint = trail.length;

    if (!unitPropagation()) {
      unassignTrail(savePoint);
      return false;
    }

    pureLiteralElimination();

    // Check if all clauses are satisfied
    let allSat = true;
    for (let ci = 0; ci < numClauses; ci++) {
      if (!satisfied[ci]) {
        if (remaining[ci] === 0) {
          unassignTrail(savePoint);
          return false;
        }
        allSat = false;
      }
    }
    if (allSat) return true;

    const v = chooseVariable();
    if (v === 0) {
      unassignTrail(savePoint);
      return false;
    }

    // Try true
    const beforeBranch = trail.length;
    if (assignLiteral(v) && solve()) return true;
    unassignTrail(beforeBranch);

    // Try false
    if (assignLiteral(-v) && solve()) return true;
    unassignTrail(beforeBranch);

    unassignTrail(savePoint);
    return false;
  }

  const sat = solve();

  if (sat) {
    return { satisfiable: true, model: buildModel(assignment, atomNames) };
  }

  return { satisfiable: false };
}

function buildModel(assignment: Int8Array, atomNames: string[]): Record<string, boolean> {
  const model: Record<string, boolean> = {};
  for (let i = 0; i < atomNames.length; i++) {
    model[atomNames[i]] = assignment[i + 1] === 1 || assignment[i + 1] === 0;
  }
  return model;
}
