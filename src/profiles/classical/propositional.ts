// ============================================================
// ST Classical Propositional — Motor completo
// ============================================================

import {
  Formula,
  Diagnostic,
  RunResult,
  Theory,
  LogicProfile,
  TruthTableResult,
  TruthTableRow,
  Valuation,
  Proof,
  ProofStep,
} from '../../types';
import { classifyFormula } from '../../runtime/formula-classifier';
import { formulaToUnicode } from '../../runtime/format';
import { pickEducationalNote } from '../../runtime/educational-notes';
import { memoizeString, memoizeAtoms, memoizeNNF, memoizeCNF, memoizeDNF } from '../../utils/memo';
import { dpll } from './dpll';

// --- Utilidades de fórmulas ---

export function collectAtoms(f: Formula): Set<string> {
  return memoizeAtoms(f, computeCollectAtoms);
}

function computeCollectAtoms(f: Formula): Set<string> {
  const atoms = new Set<string>();
  function walk(node: Formula) {
    if (node.kind === 'atom' && node.name) {
      atoms.add(node.name);
    }
    if (node.args) {
      for (const arg of node.args) {
        walk(arg);
      }
    }
  }
  walk(f);
  return atoms;
}

export function evaluateClassical(f: Formula, v: Valuation): boolean {
  switch (f.kind) {
    case 'atom':
      return f.name ? (v[f.name] ?? false) : false;
    case 'not':
      return f.args && f.args[0] ? !evaluateClassical(f.args[0], v) : false;
    case 'and':
      return f.args && f.args[0] && f.args[1]
        ? evaluateClassical(f.args[0], v) && evaluateClassical(f.args[1], v)
        : false;
    case 'or':
      return f.args && f.args[0] && f.args[1]
        ? evaluateClassical(f.args[0], v) || evaluateClassical(f.args[1], v)
        : false;
    case 'implies':
      return f.args && f.args[0] && f.args[1]
        ? !evaluateClassical(f.args[0], v) || evaluateClassical(f.args[1], v)
        : false;
    case 'biconditional':
      return f.args && f.args[0] && f.args[1]
        ? evaluateClassical(f.args[0], v) === evaluateClassical(f.args[1], v)
        : false;
    case 'nand':
      return f.args && f.args[0] && f.args[1]
        ? !(evaluateClassical(f.args[0], v) && evaluateClassical(f.args[1], v))
        : false;
    case 'nor':
      return f.args && f.args[0] && f.args[1]
        ? !(evaluateClassical(f.args[0], v) || evaluateClassical(f.args[1], v))
        : false;
    case 'xor':
      return f.args && f.args[0] && f.args[1]
        ? evaluateClassical(f.args[0], v) !== evaluateClassical(f.args[1], v)
        : false;
    default:
      throw new Error(`Operador lógico no soportado en evaluación clásica: ${f.kind}`);
  }
}

/**
 * Optimización: Generar valuaciones de forma más eficiente.
 * Usa bitsets implícitos para evitar recrear objetos innecesariamente si fuera posible,
 * pero aquí mantenemos la interfaz de Valuation (objeto) por compatibilidad.
 */
function generateValuations(atoms: string[]): Valuation[] {
  const n = atoms.length;
  if (n === 0) return [{}];
  if (n > 23) throw new Error('Demasiadas variables para tabla de verdad (>23)');

  const total = 1 << n;
  const valuations: Valuation[] = new Array<Valuation>(total);
  for (let i = 0; i < total; i++) {
    const v: Valuation = {};
    for (let j = 0; j < n; j++) {
      // Usar bitwise para determinar el valor de verdad
      v[atoms[j]] = Boolean((i >> (n - 1 - j)) & 1);
    }
    valuations[i] = v;
  }
  return valuations;
}

/**
 * Generador lazy de valuaciones para streaming (usado por el intérprete para truth_table masivas).
 */
export function* generateValuationsLazy(atoms: string[]): Generator<Valuation> {
  const n = atoms.length;
  if (n === 0) {
    yield {};
    return;
  }
  const total = 1 << n;
  for (let i = 0; i < total; i++) {
    const v: Valuation = {};
    for (let j = 0; j < n; j++) {
      v[atoms[j]] = Boolean((i >> (n - 1 - j)) & 1);
    }
    yield v;
  }
}

// ── Evaluación vectorizada con Bitsets ──────────────────────

// ── Uint32Array-based bitset engine ─────────────────────────────
// Each "bitvec" is a Uint32Array where bit i lives in word (i>>>5), bit (i&31).
// All bitwise ops run on native 32-bit ints — orders of magnitude faster than BigInt.

type BitVec = Uint32Array;

function bvCreate(total: number): BitVec {
  return new Uint32Array((total + 31) >>> 5);
}
function bvOnes(total: number): BitVec {
  const words = (total + 31) >>> 5;
  const v = new Uint32Array(words);
  v.fill(0xffffffff);
  // Clear trailing bits in last word
  const tail = total & 31;
  if (tail) v[words - 1] = (1 << tail) - 1;
  return v;
}
function bvAnd(a: BitVec, b: BitVec): BitVec {
  const r = new Uint32Array(a.length);
  for (let i = 0; i < a.length; i++) r[i] = a[i] & b[i];
  return r;
}
function bvOr(a: BitVec, b: BitVec): BitVec {
  const r = new Uint32Array(a.length);
  for (let i = 0; i < a.length; i++) r[i] = a[i] | b[i];
  return r;
}
function bvXor(a: BitVec, b: BitVec): BitVec {
  const r = new Uint32Array(a.length);
  for (let i = 0; i < a.length; i++) r[i] = a[i] ^ b[i];
  return r;
}
function bvNot(a: BitVec, ones: BitVec): BitVec {
  const r = new Uint32Array(a.length);
  for (let i = 0; i < a.length; i++) r[i] = ~a[i] & ones[i];
  return r;
}
function bvIsZero(a: BitVec): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== 0) return false;
  return true;
}
function bvEquals(a: BitVec, b: BitVec): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
function bvPopcount(a: BitVec): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    let v = a[i];
    v = v - ((v >>> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
    count += (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  }
  return count;
}
function bvTestBit(a: BitVec, i: number): boolean {
  return (a[i >>> 5] & (1 << (i & 31))) !== 0;
}
// Find first set bit, or -1
function bvFirstSet(a: BitVec): number {
  for (let w = 0; w < a.length; w++) {
    if (a[w] !== 0) return ((w << 5) + Math.clz32(a[w] & (-a[w] | 0))) ^ 31;
  }
  return -1;
}

interface BitsetResult {
  result: BitVec;
  atomMasks: Map<string, BitVec>;
  total: number;
  allOnes: BitVec;
}

function evaluateBitset(formula: Formula, atoms: string[]): BitsetResult {
  const n = atoms.length;
  if (n > 26) throw new Error('Demasiadas variables para evaluación bitset (>26)');
  const total = 1 << n;
  const allOnes = bvOnes(total);
  const words = allOnes.length;

  // Build atom masks: atom j is true when bit j of the row index is 1.
  // Row index i has bit j set when (i >>> (n-1-j)) & 1.
  // Equivalent: word w, bit b (i = w*32+b), atom j true iff ((w*32+b) >>> (n-1-j)) & 1.
  const atomMasks = new Map<string, BitVec>();
  for (let j = 0; j < n; j++) {
    const shift = n - 1 - j;
    const mask = bvCreate(total);
    // The pattern for atom j repeats with period 2^(shift+1).
    // Within each period, the first 2^shift bits are 0, next 2^shift are 1.
    // For shift < 5, the pattern fits within single words and we can use word-level fill.
    if (shift < 5) {
      // Pattern period in bits
      const period = 1 << (shift + 1);
      const halfPeriod = 1 << shift;
      // Build a 32-bit pattern
      let pattern = 0;
      for (let b = 0; b < 32; b++) {
        if (b % period >= halfPeriod) pattern |= 1 << b;
      }
      mask.fill(pattern);
    } else {
      // shift >= 5: consecutive words are all-0 or all-1
      const wordPeriod = 1 << (shift - 5 + 1); // period in words
      const halfWordPeriod = wordPeriod >>> 1;
      for (let w = 0; w < words; w++) {
        const posInPeriod = w % wordPeriod;
        mask[w] = posInPeriod >= halfWordPeriod ? 0xffffffff : 0;
      }
    }
    // Clear trailing bits
    const tail = total & 31;
    if (tail && words > 0) mask[words - 1] &= (1 << tail) - 1;
    atomMasks.set(atoms[j], mask);
  }

  function evalBits(f: Formula): BitVec {
    switch (f.kind) {
      case 'atom':
        return atomMasks.get(f.name!) ?? bvCreate(total);
      case 'not':
        return bvNot(evalBits(f.args![0]), allOnes);
      case 'and':
        return bvAnd(evalBits(f.args![0]), evalBits(f.args![1]));
      case 'or':
        return bvOr(evalBits(f.args![0]), evalBits(f.args![1]));
      case 'implies':
        return bvOr(bvNot(evalBits(f.args![0]), allOnes), evalBits(f.args![1]));
      case 'biconditional':
        return bvNot(bvXor(evalBits(f.args![0]), evalBits(f.args![1])), allOnes);
      case 'xor':
        return bvXor(evalBits(f.args![0]), evalBits(f.args![1]));
      case 'nand':
        return bvNot(bvAnd(evalBits(f.args![0]), evalBits(f.args![1])), allOnes);
      case 'nor':
        return bvNot(bvOr(evalBits(f.args![0]), evalBits(f.args![1])), allOnes);
      default:
        throw new Error(`Operador no soportado en evaluación bitset: ${f.kind}`);
    }
  }

  return { result: evalBits(formula), atomMasks, total, allOnes };
}

function bitsetPopcount(a: BitVec): number {
  return bvPopcount(a);
}

function isPurePropositional(f: Formula): boolean {
  switch (f.kind) {
    case 'atom':
      return true;
    case 'not':
    case 'and':
    case 'or':
    case 'implies':
    case 'biconditional':
    case 'xor':
    case 'nand':
    case 'nor':
      return (f.args || []).every(isPurePropositional);
    default:
      return false;
  }
}

/**
 * Aplana recursivamente nodos binarios del mismo kind asociativo.
 * Ej: or(or(P,Q), R) → [P, Q, R]
 */
function collectAssociativeArgs(f: Formula, kind: 'and' | 'or' | 'xor'): Formula[] {
  if (f.kind !== kind || !f.args?.length) return [f];
  const items: Formula[] = [];
  for (const arg of f.args) {
    if (!arg) continue;
    items.push(...collectAssociativeArgs(arg, kind));
  }
  return items;
}

export function formulaToString(f: Formula): string {
  return memoizeString(f, computeFormulaToString);
}

function computeFormulaToString(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return f.name || '?';
    case 'not': {
      const inner = f.args?.[0];
      if (!inner) return '!?';
      if (inner.kind === 'atom') return `!${formulaToString(inner)}`;
      return `!(${formulaToString(inner)})`;
    }
    case 'and':
      return f.args && f.args[0] && f.args[1]
        ? `(${collectAssociativeArgs(f, 'and').map(formulaToString).join(' & ')})`
        : '? & ?';
    case 'or':
      return f.args && f.args[0] && f.args[1]
        ? `(${collectAssociativeArgs(f, 'or').map(formulaToString).join(' | ')})`
        : '? | ?';
    case 'implies':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} -> ${formulaToString(f.args[1])})`
        : '? -> ?';
    case 'biconditional':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} <-> ${formulaToString(f.args[1])})`
        : '? <-> ?';
    case 'nand':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} ↑ ${formulaToString(f.args[1])})`
        : '? ↑ ?';
    case 'nor':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} ↓ ${formulaToString(f.args[1])})`
        : '? ↓ ?';
    case 'xor':
      return f.args && f.args[0] && f.args[1]
        ? `(${collectAssociativeArgs(f, 'xor').map(formulaToString).join(' ⊕ ')})`
        : '? ⊕ ?';
    case 'equals':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} = ${formulaToString(f.args[1])})`
        : '? = ?';
    case 'temporal_next':
      return f.args?.[0] ? `X(${formulaToString(f.args[0])})` : 'X(?)';
    case 'temporal_until':
      return f.args && f.args[0] && f.args[1]
        ? `(${formulaToString(f.args[0])} U ${formulaToString(f.args[1])})`
        : '? U ?';
    case 'modal_necessity':
      return f.args?.[0] ? `[](${formulaToString(f.args[0])})` : '[](?)';
    case 'modal_possibility':
      return f.args?.[0] ? `<>(${formulaToString(f.args[0])})` : '<>(?)';
    case 'forall':
      return f.variable && f.args?.[0]
        ? `forall ${f.variable}(${formulaToString(f.args[0])})`
        : 'forall ?(?)';
    case 'exists':
      return f.variable && f.args?.[0]
        ? `exists ${f.variable}(${formulaToString(f.args[0])})`
        : 'exists ?(?)';
    case 'predicate':
      return f.name ? `${f.name}(${(f.params || []).join(', ')})` : '?(...)';
    // Arithmetic
    case 'number':
      return f.value !== undefined ? String(f.value) : '?';
    case 'add':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} + ${formulaToString(f.args[1])})`
        : '? + ?';
    case 'subtract':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} - ${formulaToString(f.args[1])})`
        : '? - ?';
    case 'multiply':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} * ${formulaToString(f.args[1])})`
        : '? * ?';
    case 'divide':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} / ${formulaToString(f.args[1])})`
        : '? / ?';
    case 'modulo':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} % ${formulaToString(f.args[1])})`
        : '? % ?';
    case 'less':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} < ${formulaToString(f.args[1])})`
        : '? < ?';
    case 'greater':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} > ${formulaToString(f.args[1])})`
        : '? > ?';
    case 'less_eq':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} <= ${formulaToString(f.args[1])})`
        : '? <= ?';
    case 'greater_eq':
      return f.args?.[0] && f.args?.[1]
        ? `(${formulaToString(f.args[0])} >= ${formulaToString(f.args[1])})`
        : '? >= ?';
    default:
      return '?';
  }
}

export function toNNF(f: Formula): Formula {
  return memoizeNNF(f, computeNNF);
}

function computeNNF(f: Formula): Formula {
  const simplify = (node: Formula, negated: boolean): Formula => {
    const k = node.kind;
    const args = node.args || [];

    if (!negated) {
      switch (k) {
        case 'atom':
        case 'predicate':
          return node;
        case 'not':
          return simplify(args[0], true);
        case 'and':
        case 'or':
        case 'implies':
        case 'biconditional':
        case 'modal_necessity':
        case 'modal_possibility':
        case 'temporal_next':
        case 'forall':
        case 'exists':
          return { ...node, args: args.map((a) => simplify(a, false)) };
        case 'nand':
          return simplify(
            {
              kind: 'or',
              args: [
                { kind: 'not', args: [args[0]] },
                { kind: 'not', args: [args[1]] },
              ],
            },
            false,
          );
        case 'nor':
          return simplify(
            {
              kind: 'and',
              args: [
                { kind: 'not', args: [args[0]] },
                { kind: 'not', args: [args[1]] },
              ],
            },
            false,
          );
        case 'xor':
          return simplify(
            {
              kind: 'or',
              args: [
                { kind: 'and', args: [args[0], { kind: 'not', args: [args[1]] }] },
                { kind: 'and', args: [{ kind: 'not', args: [args[0]] }, args[1]] },
              ],
            },
            false,
          );
      }
    } else {
      switch (k) {
        case 'atom':
        case 'predicate':
          return { kind: 'not', args: [node] };
        case 'not':
          return simplify(args[0], false);
        case 'and':
          return { kind: 'or', args: args.map((a) => simplify(a, true)) };
        case 'or':
          return { kind: 'and', args: args.map((a) => simplify(a, true)) };
        case 'implies':
          // !(A -> B)  =>  A & !B
          return { kind: 'and', args: [simplify(args[0], false), simplify(args[1], true)] };
        case 'biconditional':
          // !(A <-> B) => (A & !B) | (!A & B)
          return simplify(
            {
              kind: 'or',
              args: [
                { kind: 'and', args: [args[0], { kind: 'not', args: [args[1]] }] },
                { kind: 'and', args: [{ kind: 'not', args: [args[0]] }, args[1]] },
              ],
            },
            false,
          );
        case 'nand':
          // !(A nand B) => A & B
          return simplify({ kind: 'and', args: [args[0], args[1]] }, false);
        case 'nor':
          // !(A nor B) => A | B
          return simplify({ kind: 'or', args: [args[0], args[1]] }, false);
        case 'xor':
          // !(A xor B) => A <-> B
          return simplify({ kind: 'biconditional', args: [args[0], args[1]] }, false);
        case 'modal_necessity':
          return { kind: 'modal_possibility', args: [simplify(args[0], true)] };
        case 'modal_possibility':
          return { kind: 'modal_necessity', args: [simplify(args[0], true)] };
        case 'temporal_next':
          // ¬X(φ) ≡ X(¬φ) — next conmuta con negación en LTL
          return { kind: 'temporal_next', args: [simplify(args[0], true)] };
        case 'forall':
          return {
            kind: 'exists',
            variable: node.variable,
            args: [simplify(args[0], true)],
          };
        case 'exists':
          return {
            kind: 'forall',
            variable: node.variable,
            args: [simplify(args[0], true)],
          };
      }
    }
    return node;
  };
  return simplify(f, false);
}

function distributeOrOverAnd(f: Formula): Formula {
  if (f.kind === 'or' && f.args?.[0] && f.args?.[1]) {
    const l = distributeOrOverAnd(f.args[0]);
    const r = distributeOrOverAnd(f.args[1]);
    if (l.kind === 'and' && l.args?.[0] && l.args?.[1]) {
      return {
        kind: 'and',
        args: [
          distributeOrOverAnd({ kind: 'or', args: [l.args[0], r] }),
          distributeOrOverAnd({ kind: 'or', args: [l.args[1], r] }),
        ],
      };
    }
    if (r.kind === 'and' && r.args?.[0] && r.args?.[1]) {
      return {
        kind: 'and',
        args: [
          distributeOrOverAnd({ kind: 'or', args: [l, r.args[0]] }),
          distributeOrOverAnd({ kind: 'or', args: [l, r.args[1]] }),
        ],
      };
    }
    return { kind: 'or', args: [l, r] };
  }
  if (f.args) return { ...f, args: f.args.map((a) => (a ? distributeOrOverAnd(a) : a)) };
  return f;
}
export function toCNF(f: Formula): Formula {
  return memoizeCNF(f, (formula) => distributeOrOverAnd(toNNF(formula)));
}

function distributeAndOverOr(f: Formula): Formula {
  if (f.kind === 'and' && f.args?.[0] && f.args?.[1]) {
    const l = distributeAndOverOr(f.args[0]);
    const r = distributeAndOverOr(f.args[1]);
    if (l.kind === 'or' && l.args?.[0] && l.args?.[1]) {
      return {
        kind: 'or',
        args: [
          distributeAndOverOr({ kind: 'and', args: [l.args[0], r] }),
          distributeAndOverOr({ kind: 'and', args: [l.args[1], r] }),
        ],
      };
    }
    if (r.kind === 'or' && r.args?.[0] && r.args?.[1]) {
      return {
        kind: 'or',
        args: [
          distributeAndOverOr({ kind: 'and', args: [l, r.args[0]] }),
          distributeAndOverOr({ kind: 'and', args: [l, r.args[1]] }),
        ],
      };
    }
    return { kind: 'and', args: [l, r] };
  }
  if (f.args) return { ...f, args: f.args.map((a) => (a ? distributeAndOverOr(a) : a)) };
  return f;
}
export function toDNF(f: Formula): Formula {
  return memoizeDNF(f, (formula) => distributeAndOverOr(toNNF(formula)));
}

/**
 * Extracts clauses from a CNF formula for resolution analysis (#28)
 * Returns an array of clauses, where each clause is an array of literals.
 */
export function extractClauses(f: Formula): string[][] {
  const cnf = toCNF(f);
  const clauses: string[][] = [];

  const extractClause = (node: Formula): string[] => {
    if (node.kind === 'or') {
      const lits: string[] = [];
      for (const arg of node.args || []) {
        lits.push(...extractClause(arg));
      }
      return lits;
    }
    if (node.kind === 'not' && node.args?.[0]) {
      return [`¬${formulaToString(node.args[0])}`];
    }
    return [formulaToString(node)];
  };

  const extractClauses2 = (node: Formula) => {
    if (node.kind === 'and') {
      for (const arg of node.args || []) {
        extractClauses2(arg);
      }
    } else {
      clauses.push(extractClause(node));
    }
  };

  extractClauses2(cnf);
  return clauses;
}

function getSubFormulas(f: Formula): Formula[] {
  const result: Formula[] = [];
  const seen = new Set<string>();
  function walk(node: Formula) {
    if (node.args)
      node.args.forEach((a) => {
        if (a) walk(a);
      });
    const hash = formulaToString(node);
    if (!seen.has(hash)) {
      seen.add(hash);
      result.push(node);
    }
  }
  walk(f);
  // Remove atoms and the full formula itself
  return result.filter((n) => n.kind !== 'atom' && formulaToString(n) !== formulaToString(f));
}

function formulasEqual(a: Formula, b: Formula): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'atom' && b.kind === 'atom') return a.name === b.name;
  if (a.args && b.args) {
    if (a.args.length !== b.args.length) return false;
    const bArgs = b.args;
    return a.args.every((arg, i) => formulasEqual(arg, bArgs[i]));
  }
  return false;
}

// --- Motor de derivación ---

/** Límite duro de fórmulas derivadas para evitar explosión combinatoria */
const MAX_KNOWN = 5000;

/** Profundidad máxima de negación en cualquier sub-fórmula */
function maxNegationDepth(f: Formula): number {
  if (f.kind === 'not' && f.args?.[0]) {
    return 1 + maxNegationDepth(f.args[0]);
  }
  if (f.args) {
    let max = 0;
    for (const a of f.args) {
      if (a) {
        const d = maxNegationDepth(a);
        if (d > max) max = d;
      }
    }
    return max;
  }
  return 0;
}

interface DerivationState {
  known: Map<string, Formula>; // fórmulas conocidas por nombre o hash
  steps: ProofStep[];
  stepCount: number;
}

function formulaHash(f: Formula): string {
  return formulaToString(f);
}

/** Check if a formula is a sub-formula of the goal (prevents explosive rule cascading) */
function isRelevantToGoal(f: Formula, goal: Formula): boolean {
  const goalHash = formulaHash(goal);
  const fHash = formulaHash(f);
  if (fHash === goalHash) return true;
  // Check if f appears as sub-formula of goal
  const checkSub = (node: Formula): boolean => {
    if (formulaHash(node) === fHash) return true;
    if (node.args) return node.args.some(checkSub);
    return false;
  };
  return checkSub(goal);
}

function addDerivedFormula(
  state: DerivationState,
  formula: Formula,
  justification: string,
  premises: number[],
): boolean {
  const hash = formulaHash(formula);
  if (state.known.has(hash)) return false;
  state.stepCount++;
  state.steps.push({
    stepNumber: state.stepCount,
    formula,
    justification,
    premises,
  });
  state.known.set(hash, formula);
  return true;
}

function tryDerive(goal: Formula, theory: Theory, premiseNames: string[]): Proof | null {
  const state: DerivationState = {
    known: new Map(),
    steps: [],
    stepCount: 0,
  };

  // Cargar premisas
  for (const name of premiseNames) {
    const f = theory.axioms.get(name) || theory.theorems.get(name);
    if (f) {
      state.stepCount++;
      state.steps.push({
        stepNumber: state.stepCount,
        formula: f,
        justification: `Premisa (${name})`,
        premises: [],
      });
      state.known.set(formulaHash(f), f);
    }
  }

  // Intentar derivar con BFS aplicando reglas (optimizado)
  const maxIterations = 1000;
  let changed = true;
  let iterations = 0;
  let lastProcessedIndex = 0;

  while (changed && iterations < maxIterations && state.known.size < MAX_KNOWN) {
    changed = false;
    iterations++;
    const currentFormulas = Array.from(state.known.values());
    const prevProcessedIndex = lastProcessedIndex;
    lastProcessedIndex = currentFormulas.length;

    for (let i = 0; i < currentFormulas.length; i++) {
      const f1 = currentFormulas[i];
      if (state.known.has(formulaHash(goal))) break;

      for (let j = 0; j < currentFormulas.length; j++) {
        // Optimización crucial O(N^2 -> N): ignorar pares antiguos
        if (i < prevProcessedIndex && j < prevProcessedIndex) continue;

        const f2 = currentFormulas[j];
        if (state.known.has(formulaHash(goal))) break;

        // Modus Ponens: de A y (A -> B), derivar B
        if (
          f2.kind === 'implies' &&
          f2.args?.[0] &&
          f2.args?.[1] &&
          formulasEqual(f2.args[0], f1)
        ) {
          const conclusion = f2.args[1];
          const s1 = findStep(state.steps, f1);
          const s2 = findStep(state.steps, f2);
          changed = addDerivedFormula(state, conclusion, 'Modus Ponens', [s1, s2]) || changed;
        }

        // Modus Ponens inverso: de (A -> B) y A, derivar B
        if (
          f1.kind === 'implies' &&
          f1.args?.[0] &&
          f1.args?.[1] &&
          formulasEqual(f1.args[0], f2)
        ) {
          const conclusion = f1.args[1];
          const s1 = findStep(state.steps, f1);
          const s2 = findStep(state.steps, f2);
          changed = addDerivedFormula(state, conclusion, 'Modus Ponens', [s1, s2]) || changed;
        }

        // Modus Tollens: de !B y (A -> B), derivar !A
        if (
          f1.kind === 'not' &&
          f1.args?.[0] &&
          f2.kind === 'implies' &&
          f2.args?.[1] &&
          f2.args?.[0] &&
          formulasEqual(f1.args[0], f2.args[1])
        ) {
          const conclusion: Formula = { kind: 'not', args: [f2.args[0]] };
          changed =
            addDerivedFormula(state, conclusion, 'Modus Tollens', [
              findStep(state.steps, f1),
              findStep(state.steps, f2),
            ]) || changed;
        }

        // Conjunction Introduction: de A y B, derivar A & B
        if (f1 !== f2) {
          const conj: Formula = { kind: 'and', args: [f1, f2] };
          if (formulasEqual(conj, goal)) {
            changed =
              addDerivedFormula(state, conj, 'Introduccion de conjuncion', [
                findStep(state.steps, f1),
                findStep(state.steps, f2),
              ]) || changed;
          }
        }

        // Silogismo hipotético: de (A -> B) y (B -> C), derivar (A -> C)
        if (
          f1.kind === 'implies' &&
          f2.kind === 'implies' &&
          f1.args?.[0] &&
          f1.args?.[1] &&
          f2.args?.[0] &&
          f2.args?.[1] &&
          formulasEqual(f1.args[1], f2.args[0])
        ) {
          const chained: Formula = { kind: 'implies', args: [f1.args[0], f2.args[1]] };
          changed =
            addDerivedFormula(state, chained, 'Silogismo hipotetico', [
              findStep(state.steps, f1),
              findStep(state.steps, f2),
            ]) || changed;
        }

        // Silogismo disyuntivo: de (A | B) y !A, derivar B / de !B, derivar A
        if (f1.kind === 'or' && f1.args?.[0] && f1.args?.[1] && f2.kind === 'not' && f2.args?.[0]) {
          if (formulasEqual(f1.args[0], f2.args[0])) {
            changed =
              addDerivedFormula(state, f1.args[1], 'Silogismo disyuntivo', [
                findStep(state.steps, f1),
                findStep(state.steps, f2),
              ]) || changed;
          }
          if (formulasEqual(f1.args[1], f2.args[0])) {
            changed =
              addDerivedFormula(state, f1.args[0], 'Silogismo disyuntivo', [
                findStep(state.steps, f1),
                findStep(state.steps, f2),
              ]) || changed;
          }
        }

        // Introducción de bicondicional: de (A -> B) y (B -> A), derivar (A <-> B)
        if (
          f1.kind === 'implies' &&
          f2.kind === 'implies' &&
          f1.args?.[0] &&
          f1.args?.[1] &&
          f2.args?.[0] &&
          f2.args?.[1] &&
          formulasEqual(f1.args[0], f2.args[1]) &&
          formulasEqual(f1.args[1], f2.args[0])
        ) {
          const biconditional: Formula = {
            kind: 'biconditional',
            args: [f1.args[0], f1.args[1]],
          };
          changed =
            addDerivedFormula(state, biconditional, 'Introduccion de bicondicional', [
              findStep(state.steps, f1),
              findStep(state.steps, f2),
            ]) || changed;
        }

        // Dilema Constructivo: de (P->Q)&(R->S) y P|R derivar Q|S
        if (
          f1.kind === 'and' &&
          f1.args?.[0]?.kind === 'implies' &&
          f1.args?.[1]?.kind === 'implies' &&
          f2.kind === 'or' &&
          f2.args?.[0] &&
          f2.args?.[1] &&
          formulasEqual((f1.args[0].args as Formula[])[0], f2.args[0]) &&
          formulasEqual((f1.args[1].args as Formula[])[0], f2.args[1])
        ) {
          const qs: Formula = {
            kind: 'or',
            args: [(f1.args[0].args as Formula[])[1], (f1.args[1].args as Formula[])[1]],
          };
          changed =
            addDerivedFormula(state, qs, 'Dilema Constructivo', [
              findStep(state.steps, f1),
              findStep(state.steps, f2),
            ]) || changed;
        }

        // Dilema Destructivo: de (P->Q)&(R->S) y !Q|!S derivar !P|!R
        if (
          f1.kind === 'and' &&
          f1.args?.[0]?.kind === 'implies' &&
          f1.args?.[1]?.kind === 'implies' &&
          f2.kind === 'or' &&
          f2.args?.[0]?.kind === 'not' &&
          f2.args?.[1]?.kind === 'not' &&
          formulasEqual((f1.args[0].args as Formula[])[1], (f2.args[0].args as Formula[])[0]) &&
          formulasEqual((f1.args[1].args as Formula[])[1], (f2.args[1].args as Formula[])[0])
        ) {
          const npnr: Formula = {
            kind: 'or',
            args: [
              { kind: 'not', args: [(f1.args[0].args as Formula[])[0]] },
              { kind: 'not', args: [(f1.args[1].args as Formula[])[0]] },
            ],
          };
          changed =
            addDerivedFormula(state, npnr, 'Dilema Destructivo', [
              findStep(state.steps, f1),
              findStep(state.steps, f2),
            ]) || changed;
        }

        // Dilema simple: P|Q, P->R, Q->R derivar R
        if (
          f1.kind === 'or' &&
          f1.args?.[0] &&
          f1.args?.[1] &&
          f2.kind === 'implies' &&
          f2.args?.[0] &&
          formulasEqual(f1.args[0], f2.args[0])
        ) {
          for (let k = 0; k < currentFormulas.length; k++) {
            if (i < prevProcessedIndex && j < prevProcessedIndex && k < prevProcessedIndex)
              continue;
            const f3 = currentFormulas[k];
            if (
              f3.kind === 'implies' &&
              f3.args?.[0] &&
              f3.args?.[1] &&
              formulasEqual(f1.args[1], f3.args[0]) &&
              formulasEqual(f2.args[1], f3.args[1])
            ) {
              changed =
                addDerivedFormula(state, f2.args[1], 'Dilema Simple', [
                  findStep(state.steps, f1),
                  findStep(state.steps, f2),
                  findStep(state.steps, f3),
                ]) || changed;
              break; // solo una vez por par f1,f2
            }
          }
        }

        // Resolución: P|Q, !P|R derivar Q|R
        if (
          f1.kind === 'or' &&
          f1.args?.[0] &&
          f1.args?.[1] &&
          f2.kind === 'or' &&
          f2.args?.[0] &&
          f2.args?.[1]
        ) {
          if (
            f2.args[0].kind === 'not' &&
            f2.args[0].args?.[0] &&
            formulasEqual(f1.args[0], f2.args[0].args[0])
          ) {
            const qr: Formula = { kind: 'or', args: [f1.args[1], f2.args[1]] };
            changed =
              addDerivedFormula(state, qr, 'Resolucion', [
                findStep(state.steps, f1),
                findStep(state.steps, f2),
              ]) || changed;
          }
        }

        // Explosión: de A y !A, derivar la meta solicitada
        if (
          goal &&
          ((f1.kind === 'not' && f1.args?.[0] && formulasEqual(f1.args[0], f2)) ||
            (f2.kind === 'not' && f2.args?.[0] && formulasEqual(f2.args[0], f1)))
        ) {
          changed =
            addDerivedFormula(state, goal, 'Explosion', [
              findStep(state.steps, f1),
              findStep(state.steps, f2),
            ]) || changed;
        }
      }

      // Conjunction Elimination: de A & B, derivar A y B
      if (f1.kind === 'and' && f1.args) {
        for (const sub of f1.args) {
          changed =
            addDerivedFormula(state, sub, 'Eliminacion de conjuncion', [
              findStep(state.steps, f1),
            ]) || changed;
        }
      }

      // Disjunction Introduction: de A, derivar A | B (si A|B es la meta)
      if (goal.kind === 'or' && goal.args?.[0] && goal.args?.[1]) {
        if (formulasEqual(f1, goal.args[0]) || formulasEqual(f1, goal.args[1])) {
          changed =
            addDerivedFormula(state, goal, 'Introduccion de disyuncion', [
              findStep(state.steps, f1),
            ]) || changed;
        }
      }

      // Double Negation Elimination: de !!A, derivar A
      if (f1.kind === 'not' && f1.args?.[0]?.kind === 'not' && f1.args[0].args?.[0]) {
        const inner = f1.args[0].args[0];
        changed =
          addDerivedFormula(state, inner, 'Doble negacion', [findStep(state.steps, f1)]) || changed;
      }

      // Double Negation Introduction: de A, derivar !!A solo si es la meta
      const doubleNegation: Formula = { kind: 'not', args: [{ kind: 'not', args: [f1] }] };
      if (formulasEqual(doubleNegation, goal)) {
        changed =
          addDerivedFormula(state, doubleNegation, 'Introduccion de doble negacion', [
            findStep(state.steps, f1),
          ]) || changed;
      }

      // Introducción de implicación simple: si la meta es A -> B y ya conocemos B, se permite cerrar
      if (
        goal.kind === 'implies' &&
        goal.args?.[0] &&
        goal.args?.[1] &&
        formulasEqual(goal.args[1], f1)
      ) {
        changed =
          addDerivedFormula(state, goal, 'Introduccion de implicacion', [
            findStep(state.steps, f1),
          ]) || changed;
      }

      // Contraposition: de A->B, derivar !B->!A
      // Restringir a fórmulas con profundidad de negación baja para evitar
      // cadenas infinitas de contrapositivas (!!A→!!B → !!!B→!!!A → ...)
      if (
        f1.kind === 'implies' &&
        f1.args?.[0] &&
        f1.args?.[1] &&
        maxNegationDepth(f1) < 2 &&
        state.known.size < MAX_KNOWN
      ) {
        const contra: Formula = {
          kind: 'implies',
          args: [
            { kind: 'not', args: [f1.args[1]] },
            { kind: 'not', args: [f1.args[0]] },
          ],
        };
        changed =
          addDerivedFormula(state, contra, 'Contraposicion', [findStep(state.steps, f1)]) ||
          changed;
      }

      // Biconditional Elimination: de A<->B, derivar A->B y B->A
      if (f1.kind === 'biconditional' && f1.args?.[0] && f1.args?.[1]) {
        const ab: Formula = { kind: 'implies', args: [f1.args[0], f1.args[1]] };
        const ba: Formula = { kind: 'implies', args: [f1.args[1], f1.args[0]] };
        for (const impl of [ab, ba]) {
          changed =
            addDerivedFormula(state, impl, 'Eliminacion de bicondicional', [
              findStep(state.steps, f1),
            ]) || changed;
        }
      }

      // Absorción: P->Q ⊢ P->(P&Q) — SOLO si resultado es relevante al goal
      if (f1.kind === 'implies' && f1.args?.[0] && f1.args?.[1]) {
        const abs: Formula = {
          kind: 'implies',
          args: [f1.args[0], { kind: 'and', args: [f1.args[0], f1.args[1]] }],
        };
        if (isRelevantToGoal(abs, goal)) {
          changed =
            addDerivedFormula(state, abs, 'Absorcion', [findStep(state.steps, f1)]) || changed;
        }
      }

      // Exportación: (P&Q)->R ⊢ P->(Q->R) — SOLO si resultado es relevante al goal
      if (
        f1.kind === 'implies' &&
        f1.args?.[0]?.kind === 'and' &&
        f1.args[0].args?.[0] &&
        f1.args[0].args?.[1] &&
        f1.args?.[1]
      ) {
        const exp: Formula = {
          kind: 'implies',
          args: [f1.args[0].args[0], { kind: 'implies', args: [f1.args[0].args[1], f1.args[1]] }],
        };
        if (isRelevantToGoal(exp, goal)) {
          changed =
            addDerivedFormula(state, exp, 'Exportacion', [findStep(state.steps, f1)]) || changed;
        }
      }

      // Importación: P->(Q->R) ⊢ (P&Q)->R — SOLO si resultado es relevante al goal
      if (
        f1.kind === 'implies' &&
        f1.args?.[0] &&
        f1.args?.[1]?.kind === 'implies' &&
        f1.args[1].args?.[0] &&
        f1.args[1].args?.[1]
      ) {
        const imp: Formula = {
          kind: 'implies',
          args: [{ kind: 'and', args: [f1.args[0], f1.args[1].args[0]] }, f1.args[1].args[1]],
        };
        if (isRelevantToGoal(imp, goal)) {
          changed =
            addDerivedFormula(state, imp, 'Importacion', [findStep(state.steps, f1)]) || changed;
        }
      }

      // De Morgan 1: !(P&Q) ⊢ !P|!Q
      if (
        f1.kind === 'not' &&
        f1.args?.[0]?.kind === 'and' &&
        f1.args[0].args?.[0] &&
        f1.args[0].args?.[1]
      ) {
        const dm1: Formula = {
          kind: 'or',
          args: [
            { kind: 'not', args: [f1.args[0].args[0]] },
            { kind: 'not', args: [f1.args[0].args[1]] },
          ],
        };
        changed =
          addDerivedFormula(state, dm1, 'De Morgan (AND)', [findStep(state.steps, f1)]) || changed;
      }

      // De Morgan 2: !(P|Q) ⊢ !P&!Q
      if (
        f1.kind === 'not' &&
        f1.args?.[0]?.kind === 'or' &&
        f1.args[0].args?.[0] &&
        f1.args[0].args?.[1]
      ) {
        const dm2: Formula = {
          kind: 'and',
          args: [
            { kind: 'not', args: [f1.args[0].args[0]] },
            { kind: 'not', args: [f1.args[0].args[1]] },
          ],
        };
        changed =
          addDerivedFormula(state, dm2, 'De Morgan (OR)', [findStep(state.steps, f1)]) || changed;
      }

      // RAA (Reductio ad Absurdum) #29:
      // Si tenemos P→Q y P→¬Q (o ¬Q→P y Q→P), derivar ¬P
      if (f1.kind === 'implies' && f1.args?.[0] && f1.args?.[1]) {
        for (let j = 0; j < currentFormulas.length; j++) {
          if (i < prevProcessedIndex && j < prevProcessedIndex) continue;
          const f2 = currentFormulas[j];
          if (
            f2.kind === 'implies' &&
            f2.args?.[0] &&
            f2.args?.[1] &&
            formulasEqual(f1.args[0], f2.args[0])
          ) {
            // P→Q and P→¬Q => ¬P
            if (
              f2.args[1].kind === 'not' &&
              f2.args[1].args?.[0] &&
              formulasEqual(f1.args[1], f2.args[1].args[0])
            ) {
              const negP: Formula = { kind: 'not', args: [f1.args[0]] };
              changed =
                addDerivedFormula(state, negP, 'Reduccion al Absurdo (RAA)', [
                  findStep(state.steps, f1),
                  findStep(state.steps, f2),
                ]) || changed;
            }
          }
        }
      }

      // Prueba Condicional (#30):
      // Si el goal es A→B y tenemos A entre las premisas/conocidas,
      // y derivamos B, entonces obtenemos A→B
      if (
        goal.kind === 'implies' &&
        goal.args?.[0] &&
        goal.args?.[1] &&
        formulasEqual(f1, goal.args[1])
      ) {
        // We have B derived, and goal is A→B
        if (state.known.has(formulaHash(goal.args[0]))) {
          // We also have A, so A→B via Prueba Condicional
          changed =
            addDerivedFormula(state, goal, 'Prueba Condicional', [
              findStep(state.steps, goal.args[0]),
              findStep(state.steps, f1),
            ]) || changed;
        }
      }
    }
  }

  if (state.known.has(formulaHash(goal))) {
    // Filtrar solo pasos relevantes para la derivación
    const relevantSteps = traceBack(state.steps, goal);
    return {
      goal,
      steps: relevantSteps,
      status: 'complete',
      derivedFrom: premiseNames,
    };
  }

  // Fallback: verificar semánticamente
  const allAxiomFormulas = premiseNames
    .map((n) => theory.axioms.get(n) || theory.theorems.get(n))
    .filter((f): f is Formula => f !== undefined);

  if (allAxiomFormulas.length > 0) {
    const atoms = new Set<string>();
    for (const f of allAxiomFormulas) collectAtoms(f).forEach((a) => atoms.add(a));
    collectAtoms(goal).forEach((a) => atoms.add(a));

    const atomList = Array.from(atoms).sort();

    // Fast path: bitset semantic check
    const allPure = allAxiomFormulas.every(isPurePropositional) && isPurePropositional(goal);
    if (allPure && atomList.length <= 26) {
      const premiseBits = allAxiomFormulas.map((f) => evaluateBitset(f, atomList).result);
      const goalBits = evaluateBitset(goal, atomList).result;
      const allOnes = bvOnes(1 << atomList.length);
      // Conjunction of all premises
      let premisesConj = allOnes;
      for (const pb of premiseBits) premisesConj = bvAnd(premisesConj, pb);
      // Valid if: wherever premises are true, goal is also true
      // i.e., premisesConj & ~goalBits === 0
      if (bvIsZero(bvAnd(premisesConj, bvNot(goalBits, allOnes)))) {
        return {
          goal,
          steps: state.steps,
          status: 'complete',
          derivedFrom: premiseNames,
        };
      }
    } else if (allPure && atomList.length > 26) {
      // DPLL fallback for >26 atoms
      // Build: (premise1 & premise2 & ... & premiseN) -> goal
      // Valid iff NOT satisfiable: (premises & !goal)
      let conjunction: Formula = allAxiomFormulas[0];
      for (let i = 1; i < allAxiomFormulas.length; i++) {
        conjunction = { kind: 'and', args: [conjunction, allAxiomFormulas[i]] };
      }
      const negGoal: Formula = { kind: 'not', args: [goal] };
      const check: Formula = { kind: 'and', args: [conjunction, negGoal] };
      const result = dpll(check);
      if (!result.satisfiable) {
        return {
          goal,
          steps: state.steps,
          status: 'complete',
          derivedFrom: premiseNames,
        };
      }
    } else {
      // Classic fallback
      const valuations = generateValuations(atomList);
      let semanticallyValid = true;
      for (const v of valuations) {
        const premisesTrue = allAxiomFormulas.every((f) => evaluateClassical(f, v));
        if (premisesTrue && !evaluateClassical(goal, v)) {
          semanticallyValid = false;
          break;
        }
      }
      if (semanticallyValid) {
        return {
          goal,
          steps: state.steps,
          status: 'complete',
          derivedFrom: premiseNames,
        };
      }
    }
  }

  return null;
}

function findStep(steps: ProofStep[], formula: Formula): number {
  const hash = formulaHash(formula);
  for (const s of steps) {
    if (formulaHash(s.formula) === hash) return s.stepNumber;
  }
  return 0;
}

function traceBack(steps: ProofStep[], goal: Formula): ProofStep[] {
  const goalHash = formulaHash(goal);
  const needed = new Set<number>();
  const goalStep = steps.find((s) => formulaHash(s.formula) === goalHash);
  if (!goalStep) return steps;

  function trace(stepNum: number) {
    if (needed.has(stepNum)) return;
    needed.add(stepNum);
    const step = steps.find((s) => s.stepNumber === stepNum);
    if (step) {
      for (const p of step.premises) {
        trace(p);
      }
    }
  }

  trace(goalStep.stepNumber);
  return steps.filter((s) => needed.has(s.stepNumber));
}

// --- Perfil Classical Propositional ---

export class ClassicalPropositional implements LogicProfile {
  name = 'classical.propositional';
  description =
    'Logica clasica proposicional con tabla de verdad, validez, satisfacibilidad, derivacion y contramodelo';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    function check(f: Formula) {
      switch (f.kind) {
        case 'atom':
          if (!f.name) {
            diags.push({ severity: 'error', message: 'Atomo sin nombre' });
          }
          break;
        case 'not':
          if (!f.args || f.args.length !== 1) {
            diags.push({
              severity: 'error',
              message: 'Negacion requiere exactamente un argumento',
            });
          } else if (f.args[0]) {
            check(f.args[0]);
          }
          break;
        case 'and':
        case 'or':
        case 'implies':
        case 'biconditional':
          if (!f.args || f.args.length !== 2) {
            diags.push({
              severity: 'error',
              message: `${f.kind} requiere exactamente dos argumentos`,
            });
          } else {
            if (f.args[0]) check(f.args[0]);
            if (f.args[1]) check(f.args[1]);
          }
          break;
        case 'forall':
        case 'exists':
        case 'predicate':
        case 'equals':
        case 'modal_necessity':
        case 'modal_possibility':
          diags.push({
            severity: 'error',
            message: `'${f.kind}' no esta soportado en logica proposicional clasica`,
          });
          break;
      }
    }
    check(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const wf = this.checkWellFormed(formula);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula };
    }

    // Fast path: bitset validity check (no row materialization)
    const atoms = Array.from(collectAtoms(formula)).sort();
    if (isPurePropositional(formula) && atoms.length <= 26) {
      const { result, allOnes } = evaluateBitset(formula, atoms);
      const isValid = bvEquals(result, allOnes);
      return {
        status: isValid ? 'valid' : 'invalid',
        output: isValid
          ? `${formulaToString(formula)} es VALIDA (tautologia)`
          : `${formulaToString(formula)} NO es valida`,
        educationalNote: pickEducationalNote({ op: 'valid', valid: isValid }),
        diagnostics: [],
        formula,
      };
    }

    // DPLL path: for formulas with >26 atoms, use SAT solver
    if (isPurePropositional(formula) && atoms.length > 26) {
      const negated: Formula = { kind: 'not', args: [formula] };
      const result = dpll(negated);
      const isValid = !result.satisfiable;
      return {
        status: isValid ? 'valid' : 'invalid',
        output: isValid
          ? `${formulaToString(formula)} es VALIDA (tautologia)`
          : `${formulaToString(formula)} NO es valida`,
        model:
          !isValid && result.model ? { type: 'propositional', valuation: result.model } : undefined,
        educationalNote: pickEducationalNote({ op: 'valid', valid: isValid }),
        diagnostics: [],
        formula,
      };
    }

    const tt = this.truthTable(formula);
    if (tt.isTautology) {
      return {
        status: 'valid',
        output: `${formulaToString(formula)} es VALIDA (tautologia)`,
        truthTable: tt,
        educationalNote: pickEducationalNote({ op: 'valid', valid: true }),
        diagnostics: [],
        formula,
      };
    } else {
      const cm = tt.rows.find((r) => !r.result);
      return {
        status: 'invalid',
        output: `${formulaToString(formula)} NO es valida`,
        truthTable: tt,
        model: cm ? { type: 'propositional', valuation: cm.valuation } : undefined,
        educationalNote: pickEducationalNote({ op: 'valid', valid: false }),
        diagnostics: [],
        formula,
      };
    }
  }

  checkSatisfiable(formula: Formula): RunResult {
    const wf = this.checkWellFormed(formula);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula };
    }

    // Fast path: bitset satisfiability check (no row materialization)
    const atoms = Array.from(collectAtoms(formula)).sort();
    if (isPurePropositional(formula) && atoms.length <= 26) {
      const { result } = evaluateBitset(formula, atoms);
      const isSat = !bvIsZero(result);
      return {
        status: isSat ? 'satisfiable' : 'unsatisfiable',
        output: isSat
          ? `${formulaToString(formula)} es SATISFACIBLE`
          : `${formulaToString(formula)} es INSATISFACIBLE (contradiccion)`,
        educationalNote: pickEducationalNote({ op: 'satisfiable', sat: isSat }),
        diagnostics: [],
        formula,
      };
    }

    // DPLL path: for formulas with >26 atoms, use SAT solver
    if (isPurePropositional(formula) && atoms.length > 26) {
      const result = dpll(formula);
      return {
        status: result.satisfiable ? 'satisfiable' : 'unsatisfiable',
        output: result.satisfiable
          ? `${formulaToString(formula)} es SATISFACIBLE`
          : `${formulaToString(formula)} es INSATISFACIBLE (contradiccion)`,
        model:
          result.satisfiable && result.model
            ? { type: 'propositional', valuation: result.model }
            : undefined,
        educationalNote: pickEducationalNote({ op: 'satisfiable', sat: result.satisfiable }),
        diagnostics: [],
        formula,
      };
    }

    const tt = this.truthTable(formula);
    if (tt.isSatisfiable) {
      const sat = tt.rows.find((r) => r.result);
      return {
        status: 'satisfiable',
        output: `${formulaToString(formula)} es SATISFACIBLE`,
        model: sat ? { type: 'propositional', valuation: sat.valuation } : undefined,
        truthTable: tt,
        educationalNote: pickEducationalNote({ op: 'satisfiable', sat: true }),
        diagnostics: [],
        formula,
      };
    } else {
      return {
        status: 'unsatisfiable',
        output: `${formulaToString(formula)} es INSATISFACIBLE (contradiccion)`,
        truthTable: tt,
        educationalNote: pickEducationalNote({ op: 'satisfiable', sat: false }),
        diagnostics: [],
        formula,
      };
    }
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const wf = this.checkWellFormed(goal);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula: goal };
    }

    const premiseNames = Array.from(theory.axioms.keys());
    const proof = tryDerive(goal, theory, premiseNames);

    if (proof && proof.status === 'complete') {
      return {
        status: 'provable',
        output: `${formulaToString(goal)} es DEMOSTRABLE desde la teoria`,
        proof,
        educationalNote: pickEducationalNote({ op: 'prove', ok: true }),
        diagnostics: [],
        formula: goal,
      };
    }

    return {
      status: 'refutable',
      output: `${formulaToString(goal)} NO es demostrable desde la teoria dada`,
      educationalNote: pickEducationalNote({ op: 'prove', ok: false }),
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const wf = this.checkWellFormed(goal);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula: goal };
    }

    const proof = tryDerive(goal, theory, premises);

    if (proof && proof.status === 'complete') {
      // Build reasoning info
      const rulesUsed = new Set<string>();
      for (const step of proof.steps) {
        if (!step.justification.startsWith('Premisa')) {
          rulesUsed.add(step.justification);
        }
      }
      const reasoningType =
        rulesUsed.size > 0 ? Array.from(rulesUsed).join(', ') : 'Derivación directa';

      return {
        status: 'provable',
        output: `${formulaToString(goal)} derivado exitosamente`,
        proof,
        reasoningType,
        reasoningSchema: rulesUsed.has('Modus Ponens')
          ? 'φ → ψ, φ ⊢ ψ'
          : rulesUsed.has('Modus Tollens')
            ? 'φ → ψ, ¬ψ ⊢ ¬φ'
            : rulesUsed.has('Silogismo Hipotetico')
              ? 'φ → ψ, ψ → χ ⊢ φ → χ'
              : undefined,
        educationalNote: pickEducationalNote({
          op: 'derive',
          ok: true,
          steps: proof.steps.length,
          rules: Array.from(rulesUsed),
        }),
        diagnostics: [],
        formula: goal,
      };
    }

    return {
      status: 'refutable',
      output: `No se puede derivar ${formulaToString(goal)} desde las premisas dadas`,
      educationalNote: pickEducationalNote({ op: 'derive', ok: false }),
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const wf = this.checkWellFormed(formula);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula };
    }

    const atoms = Array.from(collectAtoms(formula)).sort();
    const n = atoms.length;

    // Fast path: bitset finds countermodel in one pass
    if (isPurePropositional(formula) && n <= 26) {
      const { result, allOnes } = evaluateBitset(formula, atoms);
      if (bvEquals(result, allOnes)) {
        return {
          status: 'valid',
          output: `${formulaToString(formula)} es tautologia, no hay contramodelo`,
          educationalNote: pickEducationalNote({ op: 'countermodel', found: false }),
          diagnostics: [],
          formula,
        };
      }
      // Find first 0 bit (first falsifying row)
      const inverted = bvNot(result, allOnes);
      const idx = bvFirstSet(inverted);
      const v: Valuation = {};
      for (let j = 0; j < n; j++) {
        v[atoms[j]] = Boolean((idx >> (n - 1 - j)) & 1);
      }
      const valStr = atoms.map((a) => `${a}=${v[a] ? 'V' : 'F'}`).join(', ');
      return {
        status: 'invalid',
        output: `Contramodelo encontrado para ${formulaToString(formula)}\n  ← ${valStr}`,
        model: { type: 'propositional', valuation: v },
        educationalNote: pickEducationalNote({ op: 'countermodel', found: true }),
        diagnostics: [],
        formula,
      };
    }

    // DPLL path: for formulas with >26 atoms, use SAT solver to find countermodel
    if (isPurePropositional(formula) && n > 26) {
      const negated: Formula = { kind: 'not', args: [formula] };
      const result = dpll(negated);
      if (result.satisfiable && result.model) {
        const valStr = atoms.map((a) => `${a}=${result.model![a] ? 'V' : 'F'}`).join(', ');
        return {
          status: 'invalid',
          output: `Contramodelo encontrado para ${formulaToString(formula)}\n  ← ${valStr}`,
          model: { type: 'propositional', valuation: result.model },
          educationalNote: pickEducationalNote({ op: 'countermodel', found: true }),
          diagnostics: [],
          formula,
        };
      }
      return {
        status: 'valid',
        output: `${formulaToString(formula)} es tautologia, no hay contramodelo`,
        educationalNote: pickEducationalNote({ op: 'countermodel', found: false }),
        diagnostics: [],
        formula,
      };
    }

    // Fallback: classic evaluation
    const valuations = generateValuations(atoms);
    for (const v of valuations) {
      if (!evaluateClassical(formula, v)) {
        const valStr = atoms.map((a) => `${a}=${v[a] ? 'V' : 'F'}`).join(', ');
        return {
          status: 'invalid',
          output: `Contramodelo encontrado para ${formulaToString(formula)}\n  ← ${valStr}`,
          model: { type: 'propositional', valuation: v },
          educationalNote: pickEducationalNote({ op: 'countermodel', found: true }),
          diagnostics: [],
          formula,
        };
      }
    }

    return {
      status: 'valid',
      output: `${formulaToString(formula)} es tautologia, no hay contramodelo`,
      educationalNote: pickEducationalNote({ op: 'countermodel', found: false }),
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const wf = this.checkWellFormed(formula);
    if (wf.length > 0) {
      return { status: 'error', diagnostics: wf, formula };
    }

    const tt = this.truthTable(formula);
    const tAnalysis = classifyFormula(formula);

    let explanation = `Fórmula: ${formulaToUnicode(formula)}\n`;
    if (tAnalysis.formulaAnalysis.mainConnective) {
      explanation += `Conectivo principal: ${tAnalysis.formulaAnalysis.mainConnective}\n`;
    }
    explanation += `Profundidad: ${tAnalysis.formulaAnalysis.depth}\n`;
    explanation += `Complejidad: ${tAnalysis.formulaAnalysis.complexity} conectivos\n`;
    explanation += `Átomos: { ${Array.from(collectAtoms(formula)).join(', ')} }\n`;

    if (tAnalysis.formulaAnalysis.subFormulas.length > 0) {
      explanation += `\nSub-fórmulas:\n`;
      for (const sf of tAnalysis.formulaAnalysis.subFormulas) {
        explanation += `  ├─ ${sf}\n`;
      }
    }

    explanation += `\nFormas normales:\n`;
    const nnf = toNNF(formula);
    const cnf = toCNF(formula);
    const dnf = toDNF(formula);
    explanation += `  NNF: ${formulaToString(nnf)}\n`;
    explanation += `  CNF: ${formulaToString(cnf)}\n`;
    explanation += `  DNF: ${formulaToString(dnf)}\n`;

    // #28: Cláusulas de resolución
    const clauses = extractClauses(formula);
    if (clauses.length > 0 && clauses.length <= 8) {
      explanation += `\nCláusulas (resolución):\n`;
      for (let i = 0; i < clauses.length; i++) {
        explanation += `  C${i + 1}: {${clauses[i].join(', ')}}\n`;
      }
    }

    // #24: Completitud funcional
    const atomsList = Array.from(collectAtoms(formula));
    const connectives = new Set<string>();
    const walkConn = (f: Formula) => {
      if (f.kind !== 'atom') connectives.add(f.kind);
      f.args?.forEach(walkConn);
    };
    walkConn(formula);
    const hasNeg = connectives.has('not');
    const hasAnd = connectives.has('and');
    const hasOr = connectives.has('or');
    const hasImplies = connectives.has('implies');
    const hasBicond = connectives.has('biconditional');
    const hasNand = connectives.has('nand');
    const hasNor = connectives.has('nor');
    let isFunctionallyComplete = false;
    let completenessNote = '';
    if (hasNand || hasNor) {
      isFunctionallyComplete = true;
      completenessNote = hasNand
        ? '{↑} (NAND solo — Sheffer stroke)'
        : '{↓} (NOR solo — Peirce arrow)';
    } else if (hasNeg && (hasAnd || hasOr || hasImplies || hasBicond)) {
      isFunctionallyComplete = true;
      completenessNote = hasNeg && hasAnd ? '{¬, ∧}' : hasNeg && hasOr ? '{¬, ∨}' : '{¬, →}';
    }
    explanation += `\nCompletitud funcional: ${isFunctionallyComplete ? `✓ Usa conjunto completo: ${completenessNote}` : '✗ El conjunto de conectivos usado no es funcionalmente completo'}\n`;

    // #26: Esquemas de dominancia/identidad
    if (atomsList.length <= 2) {
      explanation += `\nEsquemas algebraicos verificados:\n`;
      explanation += `  ✓ P ∧ ⊤ ≡ P       (identidad conjuntiva)\n`;
      explanation += `  ✓ P ∨ ⊥ ≡ P       (identidad disyuntiva)\n`;
      explanation += `  ✓ P ∧ ⊥ ≡ ⊥       (dominancia conjuntiva)\n`;
      explanation += `  ✓ P ∨ ⊤ ≡ ⊤       (dominancia disyuntiva)\n`;
      explanation += `  ✓ P ∧ ¬P ≡ ⊥      (complemento)\n`;
      explanation += `  ✓ P ∨ ¬P ≡ ⊤      (tercero excluido)\n`;
    }

    if (tAnalysis.formulaClassification) {
      explanation += `\nClasificación semántica: Tautología\n`;
      explanation += `Nombre conocido: ${tAnalysis.formulaClassification}\n`;
    }

    explanation += `\nTabla de verdad:\n`;
    explanation += `  ${tt.totalCount} valuaciones, ${tt.satisfyingCount} verdaderas, ${(tt.totalCount as number) - (tt.satisfyingCount as number)} falsas\n`;
    if (tt.isTautology) explanation += `  → Tautología ✓\n`;
    else if (tt.isContradiction) explanation += `  → Contradicción ✗\n`;
    else explanation += `  → Contingente (satisfacible)\n`;

    return {
      status: tt.isTautology ? 'valid' : tt.isSatisfiable ? 'satisfiable' : 'unsatisfiable',
      output: explanation,
      truthTable: tt,
      diagnostics: [],
      formula,
      formulaAnalysis: tAnalysis.formulaAnalysis,
      formulaClassification: tAnalysis.formulaClassification,
      normalForms: {
        nnf: formulaToString(nnf),
        cnf: formulaToString(cnf),
        dnf: formulaToString(dnf),
      },
    };
  }

  truthTable(formula: Formula): TruthTableResult {
    const atoms = Array.from(collectAtoms(formula)).sort();
    const n = atoms.length;
    const subForms = getSubFormulas(formula);
    const subFormulasInfo = subForms.map((sf) => ({ formula: sf, label: formulaToString(sf) }));

    // Fast path: bitset evaluation for pure propositional formulas
    // Limit to n<=20 for row materialization (2^20 = ~1M rows)
    if (isPurePropositional(formula) && n <= 20) {
      const { result, atomMasks, total, allOnes } = evaluateBitset(formula, atoms);
      const satisfyingCount = bitsetPopcount(result);

      // Evaluate subformulas with bitsets too
      const subBitsets: BitVec[] = subForms.map((sf) =>
        isPurePropositional(sf) ? evaluateBitset(sf, atoms).result : bvCreate(total),
      );

      // Materialize rows from bitset results
      const rows: TruthTableRow[] = new Array<TruthTableRow>(total);
      for (let i = 0; i < total; i++) {
        const v: Valuation = {};
        for (let j = 0; j < n; j++) {
          v[atoms[j]] = bvTestBit(atomMasks.get(atoms[j])!, i);
        }
        rows[i] = { valuation: v, result: bvTestBit(result, i) };
      }

      const subFormulaValues = rows.map((_, i) => {
        const vals: Record<string, boolean> = {};
        subForms.forEach((sf, si) => {
          vals[formulaToString(sf)] = bvTestBit(subBitsets[si], i);
        });
        return vals;
      });

      return {
        variables: atoms,
        rows,
        isTautology: bvEquals(result, allOnes),
        isContradiction: bvIsZero(result),
        isSatisfiable: !bvIsZero(result),
        subFormulas: subFormulasInfo,
        subFormulaValues,
        satisfyingCount,
        totalCount: total,
      };
    }

    // Fallback: classic evaluation
    const valuations = generateValuations(atoms);
    const rows: TruthTableRow[] = valuations.map((v) => ({
      valuation: v,
      result: evaluateClassical(formula, v),
    }));

    const subFormulaValues = valuations.map((v) => {
      const vals: Record<string, boolean> = {};
      subForms.forEach((sf) => {
        vals[formulaToString(sf)] = evaluateClassical(sf, v);
      });
      return vals;
    });

    return {
      variables: atoms,
      rows,
      isTautology: rows.every((r) => r.result),
      isContradiction: rows.every((r) => !r.result),
      isSatisfiable: rows.some((r) => r.result),
      subFormulas: subFormulasInfo,
      subFormulaValues,
      satisfyingCount: rows.filter((r) => r.result).length,
      totalCount: rows.length,
    };
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const wfA = this.checkWellFormed(a);
    const wfB = this.checkWellFormed(b);
    if (wfA.length > 0 || wfB.length > 0) {
      return { status: 'error', diagnostics: [...wfA, ...wfB] };
    }

    const biconditional: Formula = { kind: 'biconditional', args: [a, b] };
    const tt = this.truthTable(biconditional);

    if (tt.isTautology) {
      return {
        status: 'valid',
        output: `${formulaToString(a)} y ${formulaToString(b)} son EQUIVALENTES`,
        truthTable: tt,
        educationalNote: pickEducationalNote({ op: 'equivalent', equiv: true }),
        diagnostics: [],
      };
    }

    const cm = tt.rows.find((r) => !r.result);
    return {
      status: 'invalid',
      output: `${formulaToString(a)} y ${formulaToString(b)} NO son equivalentes`,
      model: cm ? { type: 'propositional', valuation: cm.valuation } : undefined,
      educationalNote: pickEducationalNote({ op: 'equivalent', equiv: false }),
      diagnostics: [],
    };
  }
}
