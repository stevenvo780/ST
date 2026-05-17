import type { Expr } from './types';

export function evaluate(expr: Expr, env: Record<string, number>): number {
  switch (expr.kind) {
    case 'const':
      return expr.value;
    case 'var': {
      const value = env[expr.name];
      if (value === undefined) {
        throw new Error(`evaluate: variable '${expr.name}' no definida en env`);
      }
      return value;
    }
    case 'add': {
      let acc = 0;
      for (const a of expr.args) acc += evaluate(a, env);
      return acc;
    }
    case 'mul': {
      let acc = 1;
      for (const a of expr.args) acc *= evaluate(a, env);
      return acc;
    }
    case 'sub':
      return evaluate(expr.left, env) - evaluate(expr.right, env);
    case 'div':
      return evaluate(expr.left, env) / evaluate(expr.right, env);
    case 'pow':
      return Math.pow(evaluate(expr.base, env), evaluate(expr.exp, env));
    case 'neg':
      return -evaluate(expr.arg, env);
    case 'sin':
      return Math.sin(evaluate(expr.arg, env));
    case 'cos':
      return Math.cos(evaluate(expr.arg, env));
    case 'tan':
      return Math.tan(evaluate(expr.arg, env));
    case 'log':
      return Math.log(evaluate(expr.arg, env));
    case 'exp':
      return Math.exp(evaluate(expr.arg, env));
  }
}
