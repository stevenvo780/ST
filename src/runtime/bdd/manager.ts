// ============================================================
// ROBDD — Manager con unique table + apply algorithm
// ============================================================
//
// Implementación clásica de Bryant (1986):
//   - Unique table: garantiza canonicidad estructural
//   - Apply: combinador genérico para AND/OR/XOR/... con memoización
//   - ITE (If-Then-Else): operador universal, reduce las binarias
//   - Quantificadores ∃/∀ implementados sobre apply
//   - Sat counting con bigint para evitar overflow en >53 vars
//
// Convención: el orden de variables se respeta en todo el DAG.
// Si en una rama la variable de un hijo tiene índice de orden <=
// que el padre, hay un bug — el invariante de "ordered" se mantiene
// porque apply siempre desciende por la variable de menor orden.

import type { BDDNode, BDDStats } from './types';
import { isTerminal } from './types';

type InternalNode = BDDNode & { kind: 'internal' };

// Clave para unique table: variable + ids de hijos.
// Para terminales usamos 'T'/'F' como id especial.
function keyOf(variable: number, low: BDDNode, high: BDDNode): string {
  const lid = low.kind === 'terminal' ? (low.value ? 'T' : 'F') : `N${low.id}`;
  const hid = high.kind === 'terminal' ? (high.value ? 'T' : 'F') : `N${high.id}`;
  return `${variable}|${lid}|${hid}`;
}

function applyKey(op: string, a: BDDNode, b: BDDNode): string {
  const aid = a.kind === 'terminal' ? (a.value ? 'T' : 'F') : `N${a.id}`;
  const bid = b.kind === 'terminal' ? (b.value ? 'T' : 'F') : `N${b.id}`;
  return `${op}|${aid}|${bid}`;
}

function iteKey(c: BDDNode, t: BDDNode, e: BDDNode): string {
  const cid = c.kind === 'terminal' ? (c.value ? 'T' : 'F') : `N${c.id}`;
  const tid = t.kind === 'terminal' ? (t.value ? 'T' : 'F') : `N${t.id}`;
  const eid = e.kind === 'terminal' ? (e.value ? 'T' : 'F') : `N${e.id}`;
  return `${cid}|${tid}|${eid}`;
}

export class BDDManager {
  private readonly TRUE: BDDNode = { kind: 'terminal', value: true };
  private readonly FALSE: BDDNode = { kind: 'terminal', value: false };

  private uniqueTable = new Map<string, InternalNode>();
  private nextId = 1;
  private reductions = 0;

  // memo caches per binary op + ite
  private memoAnd = new Map<string, BDDNode>();
  private memoOr = new Map<string, BDDNode>();
  private memoXor = new Map<string, BDDNode>();
  private memoIte = new Map<string, BDDNode>();
  private memoNot = new Map<string, BDDNode>();

  varOrder: number[];

  constructor(public numVars: number) {
    if (numVars < 0) throw new Error('BDDManager: numVars must be >= 0');
    this.varOrder = Array.from({ length: numVars }, (_, i) => i);
  }

  // ----------------------------------------------------------
  // Orden de variables
  // ----------------------------------------------------------

  /**
   * Cambia el orden global de variables. Invalida memo caches porque
   * el orden afecta la estructura de los nodos. NO reordena nodos ya
   * construidos — si los reutilizas tras setVarOrder pueden quedar
   * inconsistentes; recomendado para sesiones nuevas.
   */
  setVarOrder(order: number[]): void {
    if (order.length !== this.numVars) {
      throw new Error(`setVarOrder: expected ${this.numVars} vars, got ${order.length}`);
    }
    const seen = new Set<number>();
    for (const v of order) {
      if (v < 0 || v >= this.numVars) {
        throw new Error(`setVarOrder: variable ${v} out of range`);
      }
      if (seen.has(v)) throw new Error(`setVarOrder: variable ${v} repeated`);
      seen.add(v);
    }
    this.varOrder = [...order];
    this.uniqueTable.clear();
    this.memoAnd.clear();
    this.memoOr.clear();
    this.memoXor.clear();
    this.memoIte.clear();
    this.memoNot.clear();
    this.nextId = 1;
  }

  /** Posición de la variable v dentro del orden actual (0 = top). */
  private orderPos(v: number): number {
    return this.varOrder.indexOf(v);
  }

  /** Devuelve la variable "top" de un nodo o +∞ si es terminal. */
  private topVarPos(b: BDDNode): number {
    if (isTerminal(b)) return Number.POSITIVE_INFINITY;
    return this.orderPos(b.variable);
  }

  // ----------------------------------------------------------
  // Constructores básicos
  // ----------------------------------------------------------

  true_(): BDDNode {
    return this.TRUE;
  }

  false_(): BDDNode {
    return this.FALSE;
  }

  /**
   * Crea/recupera un nodo interno con reducción (R1) + (R2).
   */
  private makeNode(variable: number, low: BDDNode, high: BDDNode): BDDNode {
    if (low === high) {
      // R1: eliminación
      this.reductions++;
      return low;
    }
    const key = keyOf(variable, low, high);
    const existing = this.uniqueTable.get(key);
    if (existing) {
      this.reductions++;
      return existing;
    }
    const node: InternalNode = {
      kind: 'internal',
      variable,
      low,
      high,
      id: this.nextId++,
    };
    this.uniqueTable.set(key, node);
    return node;
  }

  /** BDD de la variable i: nodo (i, FALSE, TRUE). */
  variable(i: number): BDDNode {
    if (i < 0 || i >= this.numVars) {
      throw new Error(`variable(${i}): out of range 0..${this.numVars - 1}`);
    }
    return this.makeNode(i, this.FALSE, this.TRUE);
  }

  // ----------------------------------------------------------
  // Operaciones
  // ----------------------------------------------------------

  /**
   * Negación: implementada como ITE(b, FALSE, TRUE).
   * Con memo dedicado para evitar recomputación.
   */
  not_(b: BDDNode): BDDNode {
    if (isTerminal(b)) {
      return b.value ? this.FALSE : this.TRUE;
    }
    const key = `N${b.id}`;
    const cached = this.memoNot.get(key);
    if (cached) return cached;
    const result = this.makeNode(b.variable, this.not_(b.low), this.not_(b.high));
    this.memoNot.set(key, result);
    return result;
  }

  and_(a: BDDNode, b: BDDNode): BDDNode {
    return this.applyOp('and', a, b);
  }

  or_(a: BDDNode, b: BDDNode): BDDNode {
    return this.applyOp('or', a, b);
  }

  xor(a: BDDNode, b: BDDNode): BDDNode {
    return this.applyOp('xor', a, b);
  }

  /** A → B ≡ ¬A ∨ B */
  implies(a: BDDNode, b: BDDNode): BDDNode {
    return this.or_(this.not_(a), b);
  }

  /** A ↔ B ≡ ¬(A ⊕ B) */
  iff(a: BDDNode, b: BDDNode): BDDNode {
    return this.not_(this.xor(a, b));
  }

  /**
   * If-Then-Else canónico: ite(c, t, e).
   * Equivale a (c ∧ t) ∨ (¬c ∧ e). Implementado con descomposición
   * Shannon directa para mejor caché.
   */
  ite(cond: BDDNode, thenB: BDDNode, elseB: BDDNode): BDDNode {
    // Casos base por terminales
    if (isTerminal(cond)) return cond.value ? thenB : elseB;
    if (thenB === elseB) return thenB;
    if (isTerminal(thenB) && isTerminal(elseB)) {
      if (thenB.value && !elseB.value) return cond;
      if (!thenB.value && elseB.value) return this.not_(cond);
    }

    const key = iteKey(cond, thenB, elseB);
    const cached = this.memoIte.get(key);
    if (cached) return cached;

    // Variable top: la de menor posición entre las tres
    const pc = this.topVarPos(cond);
    const pt = this.topVarPos(thenB);
    const pe = this.topVarPos(elseB);
    const top = Math.min(pc, pt, pe);
    const v = this.varOrder[top];

    const condLow = this.cofactor(cond, v, false);
    const condHigh = this.cofactor(cond, v, true);
    const thenLow = this.cofactor(thenB, v, false);
    const thenHigh = this.cofactor(thenB, v, true);
    const elseLow = this.cofactor(elseB, v, false);
    const elseHigh = this.cofactor(elseB, v, true);

    const low = this.ite(condLow, thenLow, elseLow);
    const high = this.ite(condHigh, thenHigh, elseHigh);
    const result = this.makeNode(v, low, high);

    this.memoIte.set(key, result);
    return result;
  }

  /**
   * Cofactor de b respecto a (variable v = val).
   * Si v no aparece o aparece más profundo, retorna b sin cambios.
   */
  private cofactor(b: BDDNode, v: number, val: boolean): BDDNode {
    if (isTerminal(b)) return b;
    const pb = this.orderPos(b.variable);
    const pv = this.orderPos(v);
    if (pb > pv) return b; // v viene antes que b.variable en el orden → b no depende
    if (b.variable === v) {
      return val ? b.high : b.low;
    }
    // pb < pv: b depende de algo más alto; descender
    const low = this.cofactor(b.low, v, val);
    const high = this.cofactor(b.high, v, val);
    return this.makeNode(b.variable, low, high);
  }

  /**
   * Apply algorithm de Bryant — combinador binario con memoization.
   * Maneja AND, OR, XOR (los más usados); el resto se deriva.
   */
  private applyOp(op: 'and' | 'or' | 'xor', a: BDDNode, b: BDDNode): BDDNode {
    // Terminales
    const term = this.applyTerminal(op, a, b);
    if (term) return term;

    const memo = this.memoFor(op);
    const key = applyKey(op, a, b);
    const cached = memo.get(key);
    if (cached) return cached;

    // Variable top
    const pa = this.topVarPos(a);
    const pb = this.topVarPos(b);
    const top = Math.min(pa, pb);
    const v = this.varOrder[top];

    const aLow = this.cofactor(a, v, false);
    const aHigh = this.cofactor(a, v, true);
    const bLow = this.cofactor(b, v, false);
    const bHigh = this.cofactor(b, v, true);

    const low = this.applyOp(op, aLow, bLow);
    const high = this.applyOp(op, aHigh, bHigh);
    const result = this.makeNode(v, low, high);

    memo.set(key, result);
    return result;
  }

  private memoFor(op: 'and' | 'or' | 'xor'): Map<string, BDDNode> {
    if (op === 'and') return this.memoAnd;
    if (op === 'or') return this.memoOr;
    return this.memoXor;
  }

  private applyTerminal(op: 'and' | 'or' | 'xor', a: BDDNode, b: BDDNode): BDDNode | undefined {
    // Cortocircuitos
    if (op === 'and') {
      if (a === this.FALSE || b === this.FALSE) return this.FALSE;
      if (a === this.TRUE) return b;
      if (b === this.TRUE) return a;
      if (a === b) return a;
    } else if (op === 'or') {
      if (a === this.TRUE || b === this.TRUE) return this.TRUE;
      if (a === this.FALSE) return b;
      if (b === this.FALSE) return a;
      if (a === b) return a;
    } else {
      // xor
      if (a === this.FALSE) return b;
      if (b === this.FALSE) return a;
      if (a === this.TRUE) return this.not_(b);
      if (b === this.TRUE) return this.not_(a);
      if (a === b) return this.FALSE;
    }

    if (isTerminal(a) && isTerminal(b)) {
      const av = a.value;
      const bv = b.value;
      let r: boolean;
      if (op === 'and') r = av && bv;
      else if (op === 'or') r = av || bv;
      else r = av !== bv;
      return r ? this.TRUE : this.FALSE;
    }
    return undefined;
  }

  // ----------------------------------------------------------
  // Cuantificadores
  // ----------------------------------------------------------

  /** ∃v. b ≡ b[v:=0] ∨ b[v:=1] */
  exists(v: number, b: BDDNode): BDDNode {
    if (v < 0 || v >= this.numVars) throw new Error(`exists: var ${v} out of range`);
    const c0 = this.cofactor(b, v, false);
    const c1 = this.cofactor(b, v, true);
    return this.or_(c0, c1);
  }

  /** ∀v. b ≡ b[v:=0] ∧ b[v:=1] */
  forall(v: number, b: BDDNode): BDDNode {
    if (v < 0 || v >= this.numVars) throw new Error(`forall: var ${v} out of range`);
    const c0 = this.cofactor(b, v, false);
    const c1 = this.cofactor(b, v, true);
    return this.and_(c0, c1);
  }

  // ----------------------------------------------------------
  // Queries
  // ----------------------------------------------------------

  /**
   * Cuenta el número de asignaciones satisfactorias sobre `numVars`.
   * Usa bigint para soportar funciones con muchas variables.
   */
  satCount(b: BDDNode): bigint {
    return this.satCountAt(b, 0);
  }

  /**
   * Conteo con "skip" de variables ausentes en la rama:
   * cada variable saltada multiplica por 2.
   */
  private satCountAt(b: BDDNode, depth: number): bigint {
    if (isTerminal(b)) {
      if (!b.value) return 0n;
      // Todas las variables restantes son libres: 2^(numVars - depth)
      const skipped = BigInt(this.numVars - depth);
      return 1n << skipped;
    }
    const pos = this.orderPos(b.variable);
    // Variables entre depth y pos están skipped → 2^(pos - depth)
    const skipped = BigInt(pos - depth);
    const factor = 1n << skipped;
    const low = this.satCountAt(b.low, pos + 1);
    const high = this.satCountAt(b.high, pos + 1);
    return factor * (low + high);
  }

  isSatisfiable(b: BDDNode): boolean {
    return b !== this.FALSE;
  }

  isValid(b: BDDNode): boolean {
    return b === this.TRUE;
  }

  /**
   * Equivalencia estructural. Como el manager canonicaliza, basta con
   * comparar identidad de referencias.
   */
  equivalent(a: BDDNode, b: BDDNode): boolean {
    return a === b;
  }

  /**
   * Evalúa b sobre una asignación `assignment[i] = valor de la var i`.
   */
  evaluate(b: BDDNode, assignment: boolean[]): boolean {
    if (assignment.length < this.numVars) {
      throw new Error(`evaluate: assignment length ${assignment.length} < numVars ${this.numVars}`);
    }
    let cur = b;
    while (!isTerminal(cur)) {
      const v = cur.variable;
      const val = assignment[v];
      if (val === undefined) {
        throw new Error(`evaluate: missing assignment for var ${v}`);
      }
      cur = val ? cur.high : cur.low;
    }
    return cur.value;
  }

  // ----------------------------------------------------------
  // Conversión desde CNF / fórmulas
  // ----------------------------------------------------------

  /**
   * Construye un BDD desde CNF. Cada clausula es un array de literales
   * en la convención DIMACS:
   *   - literal i > 0  →  variable (i-1) positiva
   *   - literal i < 0  →  variable (-i-1) negada
   * El resultado es el AND de las disyunciones de cada clausula.
   *
   * Optimización: ordena clausulas por longitud creciente para que la
   * unidad de propagación temprana mantenga el BDD pequeño.
   */
  fromCNF(clauses: number[][]): BDDNode {
    if (clauses.length === 0) return this.TRUE;
    // Validación de literales
    for (const cl of clauses) {
      for (const lit of cl) {
        if (lit === 0) throw new Error('fromCNF: literal 0 not allowed (DIMACS)');
        const v = Math.abs(lit) - 1;
        if (v >= this.numVars) {
          throw new Error(`fromCNF: literal ${lit} exceeds numVars ${this.numVars}`);
        }
      }
    }
    // Ordenar clausulas: cortas primero (más restrictivas)
    const ordered = [...clauses].sort((a, b) => a.length - b.length);
    let acc: BDDNode = this.TRUE;
    for (const clause of ordered) {
      let disj: BDDNode = this.FALSE;
      for (const lit of clause) {
        const v = Math.abs(lit) - 1;
        const x = this.variable(v);
        const litBdd = lit > 0 ? x : this.not_(x);
        disj = this.or_(disj, litBdd);
      }
      acc = this.and_(acc, disj);
      if (acc === this.FALSE) return acc; // cortocircuito UNSAT
    }
    return acc;
  }

  /**
   * Construye un BDD desde una fórmula simbólica con sintaxis libre.
   * Soporta: `{ kind: 'var', index: number }`, `{ kind: 'true' }`,
   * `{ kind: 'false' }`, `{ kind: 'not', child }`,
   * `{ kind: 'and'|'or'|'xor'|'implies'|'iff', left, right }`,
   * `{ kind: 'ite', cond, then, else }`.
   *
   * Si llega algo no reconocido lanza error — el formato es estricto
   * para evitar `any` silenciosos.
   */
  fromFormula(formula: { kind: string; [k: string]: unknown }): BDDNode {
    const k = formula.kind;
    if (k === 'true') return this.TRUE;
    if (k === 'false') return this.FALSE;
    if (k === 'var') {
      const idx = formula.index;
      if (typeof idx !== 'number') throw new Error('fromFormula: var.index must be number');
      return this.variable(idx);
    }
    if (k === 'not') {
      const child = formula.child as { kind: string; [k: string]: unknown };
      return this.not_(this.fromFormula(child));
    }
    if (k === 'and' || k === 'or' || k === 'xor' || k === 'implies' || k === 'iff') {
      const left = formula.left as { kind: string; [k: string]: unknown };
      const right = formula.right as { kind: string; [k: string]: unknown };
      const L = this.fromFormula(left);
      const R = this.fromFormula(right);
      if (k === 'and') return this.and_(L, R);
      if (k === 'or') return this.or_(L, R);
      if (k === 'xor') return this.xor(L, R);
      if (k === 'implies') return this.implies(L, R);
      return this.iff(L, R);
    }
    if (k === 'ite') {
      const c = formula.cond as { kind: string; [k: string]: unknown };
      const t = formula.then as { kind: string; [k: string]: unknown };
      const e = formula.else as { kind: string; [k: string]: unknown };
      return this.ite(this.fromFormula(c), this.fromFormula(t), this.fromFormula(e));
    }
    throw new Error(`fromFormula: unknown kind "${k}"`);
  }

  // ----------------------------------------------------------
  // Stats / introspección
  // ----------------------------------------------------------

  stats(): BDDStats {
    return {
      nodes: this.uniqueTable.size,
      reductions: this.reductions,
    };
  }

  /**
   * Cuenta los nodos alcanzables desde `b` (sin contar terminales).
   * Útil para comparar tamaños bajo distintos órdenes de variables.
   */
  countReachable(b: BDDNode): number {
    const seen = new Set<number>();
    const stack: BDDNode[] = [b];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (cur === undefined) break;
      if (isTerminal(cur)) continue;
      if (seen.has(cur.id)) continue;
      seen.add(cur.id);
      stack.push(cur.low);
      stack.push(cur.high);
    }
    return seen.size;
  }
}
