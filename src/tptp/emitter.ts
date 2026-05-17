// ============================================================
// TPTP — Emitter
// ============================================================

import { TptpFormula, TptpProblem, TptpTerm } from './ast';

export function emitTerm(term: TptpTerm): string {
  if (term.kind === 'var' || term.kind === 'const') return term.name;
  if (term.args.length === 0) return term.name;
  return `${term.name}(${term.args.map(emitTerm).join(',')})`;
}

// Precedencias para parentizar al emitir.
const PREC = {
  iff: 1,
  xor: 1,
  implies: 2,
  or: 3,
  and: 4,
  not: 5,
  quant: 5,
  atomic: 9,
} as const;

function formulaPrec(f: TptpFormula): number {
  switch (f.kind) {
    case 'iff':
    case 'xor':
      return PREC.iff;
    case 'implies':
      return PREC.implies;
    case 'or':
      return PREC.or;
    case 'and':
      return PREC.and;
    case 'not':
    case 'forall':
    case 'exists':
      return PREC.not;
    default:
      return PREC.atomic;
  }
}

function parenIfBelow(child: TptpFormula, parent: number): string {
  const childPrec = formulaPrec(child);
  const s = emitFormula(child);
  if (childPrec < parent) return `(${s})`;
  return s;
}

export function emitFormula(f: TptpFormula): string {
  switch (f.kind) {
    case 'true':
      return '$true';
    case 'false':
      return '$false';
    case 'atom': {
      if (f.args.length === 0) return f.predicate;
      return `${f.predicate}(${f.args.map(emitTerm).join(',')})`;
    }
    case 'eq':
      return `${emitTerm(f.left)} = ${emitTerm(f.right)}`;
    case 'neq':
      return `${emitTerm(f.left)} != ${emitTerm(f.right)}`;
    case 'not':
      return `~${parenIfBelow(f.arg, PREC.not)}`;
    case 'and':
      return f.args.map((a) => parenIfBelow(a, PREC.and)).join(' & ');
    case 'or':
      return f.args.map((a) => parenIfBelow(a, PREC.or)).join(' | ');
    case 'implies':
      // implies asocia derecha; el lado izquierdo necesita paren si su
      // precedencia ≤ implies (excepto a sí mismo? por claridad, sí).
      return `${parenIfBelow(f.left, PREC.implies + 1)} => ${parenIfBelow(f.right, PREC.implies)}`;
    case 'iff':
      return `${parenIfBelow(f.left, PREC.iff + 1)} <=> ${parenIfBelow(f.right, PREC.iff + 1)}`;
    case 'xor':
      return `${parenIfBelow(f.left, PREC.iff + 1)} <~> ${parenIfBelow(f.right, PREC.iff + 1)}`;
    case 'forall':
      return `! [${f.vars.join(',')}] : ${parenIfBelow(f.body, PREC.not)}`;
    case 'exists':
      return `? [${f.vars.join(',')}] : ${parenIfBelow(f.body, PREC.not)}`;
  }
}

export function emitTptp(problem: TptpProblem): string {
  const out: string[] = [];
  for (const inc of problem.includes) {
    out.push(`include('${inc}').`);
  }
  for (const a of problem.annotated) {
    if (a.comment) {
      for (const line of a.comment.split('\n')) {
        out.push(`% ${line}`);
      }
    }
    out.push(`${a.language}(${a.name}, ${a.role}, ${emitFormula(a.formula)}).`);
  }
  return out.join('\n');
}
