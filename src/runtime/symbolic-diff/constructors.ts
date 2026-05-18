import type { Expr, UnaryFn } from './types';

/** Creates a numeric constant expression node. */
export function cst(value: number): Expr {
  return { kind: 'const', value };
}

/** Creates a variable expression node with the given name. */
export function v(name: string): Expr {
  return { kind: 'var', name };
}

/**
 * Creates an addition expression. With zero args returns `cst(0)`;
 * with one arg returns it directly (no wrapper node).
 */
export function add(...args: Expr[]): Expr {
  if (args.length === 0) return cst(0);
  if (args.length === 1) {
    const only = args[0];
    if (only === undefined) return cst(0);
    return only;
  }
  return { kind: 'add', args };
}

/**
 * Creates a multiplication expression. With zero args returns `cst(1)`;
 * with one arg returns it directly (no wrapper node).
 */
export function mul(...args: Expr[]): Expr {
  if (args.length === 0) return cst(1);
  if (args.length === 1) {
    const only = args[0];
    if (only === undefined) return cst(1);
    return only;
  }
  return { kind: 'mul', args };
}

/** Creates a subtraction expression `left - right`. */
export function sub(left: Expr, right: Expr): Expr {
  return { kind: 'sub', left, right };
}

/** Creates a division expression `left / right`. */
export function div(left: Expr, right: Expr): Expr {
  return { kind: 'div', left, right };
}

/** Creates a power expression `base ^ exp`. */
export function pow(base: Expr, exp: Expr): Expr {
  return { kind: 'pow', base, exp };
}

/** Creates a unary negation expression `-arg`. */
export function neg(arg: Expr): Expr {
  return { kind: 'neg', arg };
}

/** Creates a unary function expression for any supported `UnaryFn` name. */
export function fn(name: UnaryFn, arg: Expr): Expr {
  return { kind: name, arg };
}

/** Creates a `sin(arg)` expression node. */
export function sin(arg: Expr): Expr {
  return { kind: 'sin', arg };
}

/** Creates a `cos(arg)` expression node. */
export function cos(arg: Expr): Expr {
  return { kind: 'cos', arg };
}

/** Creates a `tan(arg)` expression node. */
export function tan(arg: Expr): Expr {
  return { kind: 'tan', arg };
}

/** Creates a natural `log(arg)` expression node. */
export function log(arg: Expr): Expr {
  return { kind: 'log', arg };
}

/** Creates an `exp(arg)` (i.e. e^arg) expression node. */
export function exp(arg: Expr): Expr {
  return { kind: 'exp', arg };
}
