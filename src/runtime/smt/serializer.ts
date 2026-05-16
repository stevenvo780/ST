// ============================================================
// ST SMT — Serializador AST de fórmulas → SMT-LIB v2
// ============================================================

import type { Formula, FormulaKind } from '../../types';
import type { SMTLogic, SMTSort, ToSMTLIBOptions, ConstDeclaration } from './types';

const ARITHMETIC_KINDS: ReadonlySet<FormulaKind> = new Set<FormulaKind>([
  'number',
  'add',
  'subtract',
  'multiply',
  'divide',
  'modulo',
  'less',
  'greater',
  'less_eq',
  'greater_eq',
]);

const BOOLEAN_KINDS: ReadonlySet<FormulaKind> = new Set<FormulaKind>([
  'not',
  'and',
  'or',
  'implies',
  'biconditional',
  'nand',
  'nor',
  'xor',
  'true',
  'false',
]);

/** Mapeo kind → operador SMT-LIB v2. */
const SMT_OP: Partial<Record<FormulaKind, string>> = {
  not: 'not',
  and: 'and',
  or: 'or',
  implies: '=>',
  biconditional: '=',
  xor: 'xor',
  add: '+',
  subtract: '-',
  multiply: '*',
  divide: '/',
  modulo: 'mod',
  less: '<',
  greater: '>',
  less_eq: '<=',
  greater_eq: '>=',
  equals: '=',
};

/** Identificadores SMT-LIB seguros (letra/_ inicial; resto alfanumérico o `_`). */
const SAFE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

function quoteIdent(name: string): string {
  if (SAFE_IDENT.test(name)) return name;
  // Identificadores con caracteres no estándar usan la sintaxis pipe-quoted
  // (válida en SMT-LIB v2.6).
  return `|${name.replace(/\|/g, '')}|`;
}

/** Selecciona el sort por defecto para una constante a partir de la lógica. */
export function defaultSortFor(logic: SMTLogic): SMTSort {
  switch (logic) {
    case 'QF_LIA':
    case 'AUFLIA':
      return 'Int';
    case 'QF_LRA':
      return 'Real';
    case 'QF_BV':
      return 'BitVec';
  }
}

/** Detecta si la fórmula contiene aritmética. */
function hasArithmetic(f: Formula): boolean {
  if (ARITHMETIC_KINDS.has(f.kind)) return true;
  if (!f.args) return false;
  for (const a of f.args) {
    if (hasArithmetic(a)) return true;
  }
  return false;
}

/**
 * Camina el AST y marca el sort esperado de cada átomo.
 * Si un átomo aparece como argumento aritmético, queda marcado como Int/Real;
 * si aparece como argumento booleano, queda como Bool.
 */
function collectAtomSorts(
  f: Formula,
  logic: SMTLogic,
  used: Map<string, SMTSort>,
  expected: 'bool' | 'num',
): void {
  const numericSort: SMTSort = defaultSortFor(logic);

  switch (f.kind) {
    case 'atom': {
      const name = f.name ?? '_unnamed';
      if (expected === 'num') {
        // Sólo override si no estaba marcado como Bool ya o si actualizamos a numérico
        used.set(name, used.get(name) === 'Bool' ? 'Bool' : numericSort);
        if (!used.has(name)) used.set(name, numericSort);
      } else {
        if (!used.has(name)) used.set(name, 'Bool');
      }
      return;
    }
    case 'predicate': {
      const name = f.name ?? '_pred';
      if (!used.has(name)) used.set(name, 'Bool');
      return;
    }
    case 'number':
    case 'true':
    case 'false':
      return;
    case 'not':
    case 'and':
    case 'or':
    case 'implies':
    case 'biconditional':
    case 'nand':
    case 'nor':
    case 'xor': {
      for (const a of f.args ?? []) {
        collectAtomSorts(a, logic, used, 'bool');
      }
      return;
    }
    case 'less':
    case 'greater':
    case 'less_eq':
    case 'greater_eq':
    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
    case 'modulo': {
      for (const a of f.args ?? []) {
        collectAtomSorts(a, logic, used, 'num');
      }
      return;
    }
    case 'equals': {
      // (= a b) — los hijos deben ser del mismo sort.
      // Si alguno parece numérico (number/aritmético), tratar ambos como num.
      const args = f.args ?? [];
      const anyNum = args.some((a) => ARITHMETIC_KINDS.has(a.kind) || a.kind === 'number');
      const sortHint: 'bool' | 'num' = anyNum ? 'num' : 'bool';
      for (const a of args) {
        collectAtomSorts(a, logic, used, sortHint);
      }
      return;
    }
    case 'forall':
    case 'exists': {
      for (const a of f.args ?? []) {
        collectAtomSorts(a, logic, used, 'bool');
      }
      return;
    }
    default: {
      for (const a of f.args ?? []) {
        collectAtomSorts(a, logic, used, expected);
      }
    }
  }
}

function serializeFormula(f: Formula, logic: SMTLogic, sorts: Map<string, SMTSort>): string {
  switch (f.kind) {
    case 'true':
      return 'true';
    case 'false':
      return 'false';
    case 'atom':
      return quoteIdent(f.name ?? '_unnamed');
    case 'number': {
      const v = f.value ?? 0;
      if (defaultSortFor(logic) === 'Real') {
        return Number.isInteger(v) ? `${v}.0` : `${v}`;
      }
      if (v < 0) return `(- ${Math.abs(v)})`;
      return `${v}`;
    }
    case 'predicate': {
      const name = quoteIdent(f.name ?? '_pred');
      const args = (f.args ?? []).map((a) => serializeFormula(a, logic, sorts));
      if (args.length === 0) return name;
      return `(${name} ${args.join(' ')})`;
    }
    case 'not': {
      const inner = (f.args ?? [])[0];
      if (!inner) return 'true';
      return `(not ${serializeFormula(inner, logic, sorts)})`;
    }
    case 'and':
    case 'or':
    case 'implies':
    case 'biconditional':
    case 'xor':
    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
    case 'modulo':
    case 'less':
    case 'greater':
    case 'less_eq':
    case 'greater_eq':
    case 'equals': {
      const op = SMT_OP[f.kind];
      if (!op) throw new Error(`SMT: operador no soportado para kind ${f.kind}`);
      const args = (f.args ?? []).map((a) => serializeFormula(a, logic, sorts));
      if (args.length === 0) {
        if (f.kind === 'and') return 'true';
        if (f.kind === 'or') return 'false';
        throw new Error(`SMT: operador ${f.kind} sin argumentos`);
      }
      if (args.length === 1 && (f.kind === 'and' || f.kind === 'or')) {
        const first = args[0];
        if (first !== undefined) return first;
      }
      return `(${op} ${args.join(' ')})`;
    }
    case 'nand': {
      const args = (f.args ?? []).map((a) => serializeFormula(a, logic, sorts));
      return `(not (and ${args.join(' ')}))`;
    }
    case 'nor': {
      const args = (f.args ?? []).map((a) => serializeFormula(a, logic, sorts));
      return `(not (or ${args.join(' ')}))`;
    }
    case 'forall':
    case 'exists': {
      const op = f.kind === 'forall' ? 'forall' : 'exists';
      const variable = quoteIdent(f.variable ?? 'x');
      const inner = (f.args ?? [])[0];
      const body = inner ? serializeFormula(inner, logic, sorts) : 'true';
      return `(${op} ((${variable} ${defaultSortFor(logic)})) ${body})`;
    }
    case 'modal_necessity':
    case 'modal_possibility':
    case 'temporal_next':
    case 'temporal_until':
    case 'list':
    case 'fn_call':
      throw new Error(`SMT: kind ${f.kind} no es traducible a SMT-LIB v2 puro`);
  }
}

/**
 * Traduce una fórmula ST a su representación SMT-LIB v2.
 *
 * Por defecto devuelve sólo el cuerpo (sin set-logic ni check-sat) para que el
 * caller decida cómo ensamblarlo. Con `full: true` produce un script SMT-LIB
 * autocontenido (declaraciones de constantes + assert + check-sat).
 */
export function toSMTLIB(formula: Formula, opts: ToSMTLIBOptions = {}): string {
  const logic: SMTLogic = opts.logic ?? (hasArithmetic(formula) ? 'QF_LRA' : 'AUFLIA');
  const sorts = new Map<string, SMTSort>();

  // Si la fórmula es íntegramente booleana, no hace falta inferir nada.
  collectAtomSorts(formula, logic, sorts, 'bool');

  const body = serializeFormula(formula, logic, sorts);

  if (!opts.full) return body;

  const lines: string[] = [];
  lines.push(`(set-logic ${logic})`);
  for (const [name, sort] of sorts) {
    if (BOOLEAN_KINDS.has(formula.kind) && sort === 'Bool') {
      lines.push(`(declare-const ${quoteIdent(name)} Bool)`);
    } else if (sort === 'BitVec') {
      const width = opts.bvWidth ?? 32;
      lines.push(`(declare-const ${quoteIdent(name)} (_ BitVec ${width}))`);
    } else {
      lines.push(`(declare-const ${quoteIdent(name)} ${sort})`);
    }
  }
  lines.push(`(assert ${body})`);
  lines.push('(check-sat)');
  return lines.join('\n');
}

/** Extrae las declaraciones inferidas para una fórmula. Útil para el backend. */
export function inferDeclarations(formula: Formula, logic?: SMTLogic): ConstDeclaration[] {
  const chosen: SMTLogic = logic ?? (hasArithmetic(formula) ? 'QF_LRA' : 'AUFLIA');
  const sorts = new Map<string, SMTSort>();
  collectAtomSorts(formula, chosen, sorts, 'bool');
  const decls: ConstDeclaration[] = [];
  for (const [name, sort] of sorts) {
    decls.push({ name, sort });
  }
  return decls;
}

/** Helper público para emitir una declaración SMT-LIB. */
export function emitDeclareConst(name: string, sort: SMTSort, bvWidth?: number): string {
  const safe = quoteIdent(name);
  if (sort === 'BitVec') {
    const width = bvWidth ?? 32;
    return `(declare-const ${safe} (_ BitVec ${width}))`;
  }
  return `(declare-const ${safe} ${sort})`;
}

/** Re-exporta el set de kinds booleanos para uso interno de backends. */
export { BOOLEAN_KINDS, ARITHMETIC_KINDS };
