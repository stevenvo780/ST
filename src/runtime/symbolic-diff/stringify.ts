import type { Expr } from './types';

// Precedencias para decidir paréntesis.
const PREC = {
  add: 1,
  sub: 1,
  mul: 2,
  div: 2,
  neg: 3,
  pow: 4,
  atom: 5,
} as const;

function precedence(expr: Expr): number {
  switch (expr.kind) {
    case 'const':
    case 'var':
    case 'sin':
    case 'cos':
    case 'tan':
    case 'log':
    case 'exp':
      return PREC.atom;
    case 'add':
      return PREC.add;
    case 'sub':
      return PREC.sub;
    case 'mul':
      return PREC.mul;
    case 'div':
      return PREC.div;
    case 'neg':
      return PREC.neg;
    case 'pow':
      return PREC.pow;
  }
}

function wrap(s: string, inner: number, outer: number): string {
  return inner < outer ? `(${s})` : s;
}

export function toString(expr: Expr): string {
  const myPrec = precedence(expr);
  switch (expr.kind) {
    case 'const':
      return String(expr.value);
    case 'var':
      return expr.name;
    case 'add':
      return expr.args.map((a) => wrap(toString(a), precedence(a), myPrec)).join(' + ');
    case 'mul':
      return expr.args.map((a) => wrap(toString(a), precedence(a), myPrec)).join('*');
    case 'sub':
      return `${wrap(toString(expr.left), precedence(expr.left), myPrec)} - ${wrap(toString(expr.right), precedence(expr.right), myPrec + 1)}`;
    case 'div':
      return `${wrap(toString(expr.left), precedence(expr.left), myPrec)}/${wrap(toString(expr.right), precedence(expr.right), myPrec + 1)}`;
    case 'pow':
      // pow es right-assoc; el lado izquierdo necesita más prioridad para no envolver de más.
      return `${wrap(toString(expr.base), precedence(expr.base), myPrec + 1)}^${wrap(toString(expr.exp), precedence(expr.exp), myPrec)}`;
    case 'neg':
      return `-${wrap(toString(expr.arg), precedence(expr.arg), myPrec)}`;
    case 'sin':
    case 'cos':
    case 'tan':
    case 'log':
    case 'exp':
      return `${expr.kind}(${toString(expr.arg)})`;
  }
}
