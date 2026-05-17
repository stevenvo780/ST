import type { Expr } from './types';
import { cst, v as makeVar, add, mul, sub, div, pow, neg, sin, cos, log, exp } from './constructors';
import { simplify } from './simplify';

/**
 * Diferenciación simbólica respecto a `varName`.
 *
 * Reglas:
 * - Linealidad: d/dx(f+g) = f' + g'
 * - Producto: d/dx(f*g) = f'*g + f*g'  (generalizado a N factores)
 * - Cociente: d/dx(f/g) = (f'*g - f*g') / g^2
 * - Cadena: d/dx(f(g(x))) = f'(g(x)) * g'(x)
 * - Potencia general: d/dx(f^g) = f^g * (g'*ln(f) + g*f'/f)
 *   (caso especial: exponente constante → g*f^(g-1)*f')
 *
 * El resultado se simplifica antes de devolverse.
 */
export function differentiate(expr: Expr, varName: string): Expr {
  return simplify(diffRaw(expr, varName));
}

function diffRaw(expr: Expr, x: string): Expr {
  switch (expr.kind) {
    case 'const':
      return cst(0);
    case 'var':
      return cst(expr.name === x ? 1 : 0);

    case 'add':
      return add(...expr.args.map((a) => diffRaw(a, x)));

    case 'mul': {
      // d/dx(f1*f2*...*fn) = Σ_i (f1*...*fi'*...*fn)
      const terms: Expr[] = [];
      for (let i = 0; i < expr.args.length; i++) {
        const factors: Expr[] = [];
        for (let j = 0; j < expr.args.length; j++) {
          const factor = expr.args[j];
          if (factor === undefined) continue;
          if (i === j) factors.push(diffRaw(factor, x));
          else factors.push(factor);
        }
        terms.push(mul(...factors));
      }
      return add(...terms);
    }

    case 'sub':
      return sub(diffRaw(expr.left, x), diffRaw(expr.right, x));

    case 'div': {
      // (f/g)' = (f'g - fg') / g^2
      const f = expr.left;
      const g = expr.right;
      const num = sub(mul(diffRaw(f, x), g), mul(f, diffRaw(g, x)));
      const den = pow(g, cst(2));
      return div(num, den);
    }

    case 'pow': {
      const base = expr.base;
      const exponent = expr.exp;

      // Caso 1: exponente constante → g*f^(g-1)*f'
      if (exponent.kind === 'const') {
        const n = exponent.value;
        if (n === 0) return cst(0);
        return mul(cst(n), pow(base, cst(n - 1)), diffRaw(base, x));
      }

      // Caso 2: base constante positiva → a^g * ln(a) * g'
      if (base.kind === 'const' && base.value > 0) {
        return mul(pow(base, exponent), cst(Math.log(base.value)), diffRaw(exponent, x));
      }

      // Caso general: f^g * (g'*ln(f) + g*f'/f)
      const fPrime = diffRaw(base, x);
      const gPrime = diffRaw(exponent, x);
      const innerSum = add(mul(gPrime, log(base)), div(mul(exponent, fPrime), base));
      return mul(pow(base, exponent), innerSum);
    }

    case 'neg':
      return neg(diffRaw(expr.arg, x));

    case 'sin':
      // d/dx sin(u) = cos(u) * u'
      return mul(cos(expr.arg), diffRaw(expr.arg, x));

    case 'cos':
      // d/dx cos(u) = -sin(u) * u'
      return mul(neg(sin(expr.arg)), diffRaw(expr.arg, x));

    case 'tan':
      // d/dx tan(u) = u' / cos(u)^2
      return div(diffRaw(expr.arg, x), pow(cos(expr.arg), cst(2)));

    case 'log':
      // d/dx log(u) = u' / u
      return div(diffRaw(expr.arg, x), expr.arg);

    case 'exp':
      // d/dx exp(u) = exp(u) * u'
      return mul(exp(expr.arg), diffRaw(expr.arg, x));
  }
}

/**
 * Gradiente: lista de derivadas parciales por variable.
 */
export function gradient(expr: Expr, vars: string[]): Expr[] {
  return vars.map((name) => differentiate(expr, name));
}

// Re-export para que el caller pueda armar vars sin importar 'v' por separado.
export const variable = makeVar;
