import type { Expr, UnaryFn } from './types';

export function cst(value: number): Expr {
  return { kind: 'const', value };
}

export function v(name: string): Expr {
  return { kind: 'var', name };
}

export function add(...args: Expr[]): Expr {
  if (args.length === 0) return cst(0);
  if (args.length === 1) {
    const only = args[0];
    if (only === undefined) return cst(0);
    return only;
  }
  return { kind: 'add', args };
}

export function mul(...args: Expr[]): Expr {
  if (args.length === 0) return cst(1);
  if (args.length === 1) {
    const only = args[0];
    if (only === undefined) return cst(1);
    return only;
  }
  return { kind: 'mul', args };
}

export function sub(left: Expr, right: Expr): Expr {
  return { kind: 'sub', left, right };
}

export function div(left: Expr, right: Expr): Expr {
  return { kind: 'div', left, right };
}

export function pow(base: Expr, exp: Expr): Expr {
  return { kind: 'pow', base, exp };
}

export function neg(arg: Expr): Expr {
  return { kind: 'neg', arg };
}

export function fn(name: UnaryFn, arg: Expr): Expr {
  return { kind: name, arg };
}

export function sin(arg: Expr): Expr {
  return { kind: 'sin', arg };
}

export function cos(arg: Expr): Expr {
  return { kind: 'cos', arg };
}

export function tan(arg: Expr): Expr {
  return { kind: 'tan', arg };
}

export function log(arg: Expr): Expr {
  return { kind: 'log', arg };
}

export function exp(arg: Expr): Expr {
  return { kind: 'exp', arg };
}
