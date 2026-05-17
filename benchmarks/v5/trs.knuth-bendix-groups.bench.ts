/**
 * TRS — Knuth-Bendix completion on group theories.
 * --------------------------------------------------------------
 * Mide la performance de KB-completion en TRS pequeños:
 * monoide, grupo parcial, asociatividad.
 */
import { bench, describe } from 'vitest';
import {
  knuthBendixCompletion,
  normalize,
  v,
  f,
  c,
} from '../../src/runtime/term-rewriting';

const PREC_MULT = new Map<string, number>([
  ['mult', 4],
  ['inv', 3],
  ['e', 1],
]);

// Identidad por izq + derecha
const MONOID_RULES = [
  { lhs: f('mult', c('e'), v('x')), rhs: v('x') },
  { lhs: f('mult', v('x'), c('e')), rhs: v('x') },
];

// Grupo light: identidad + inversa por izq + asociatividad
const GROUP_RULES = [
  { lhs: f('mult', c('e'), v('x')), rhs: v('x') },
  { lhs: f('mult', f('inv', v('x')), v('x')), rhs: c('e') },
  {
    lhs: f('mult', f('mult', v('x'), v('y')), v('z')),
    rhs: f('mult', v('x'), f('mult', v('y'), v('z'))),
  },
];

// Asociatividad sola (no completa pero KB la mantiene)
const ASSOC_RULES = [
  {
    lhs: f('mult', f('mult', v('x'), v('y')), v('z')),
    rhs: f('mult', v('x'), f('mult', v('y'), v('z'))),
  },
];

describe('TRS: Knuth-Bendix completion', () => {
  bench('KB on monoid (2 rules)', () => {
    knuthBendixCompletion(MONOID_RULES, { precedence: PREC_MULT, maxSteps: 30 });
  });

  bench('KB on group light (3 eqs, maxSteps=80)', () => {
    knuthBendixCompletion(GROUP_RULES, { precedence: PREC_MULT, maxSteps: 80 });
  });

  bench('KB on associativity alone', () => {
    knuthBendixCompletion(ASSOC_RULES, { precedence: PREC_MULT, maxSteps: 20 });
  });
});

describe('TRS: normalize', () => {
  // mult(e, mult(e, mult(e, a)))
  const NESTED_E = f('mult', c('e'), f('mult', c('e'), f('mult', c('e'), c('a'))));
  // mult(inv(a), mult(a, b))
  const INV_NORMAL = f('mult', f('inv', c('a')), f('mult', c('a'), c('b')));

  bench('normalize nested identities', () => {
    normalize(NESTED_E, GROUP_RULES, 50);
  });

  bench('normalize inv-cancellation', () => {
    normalize(INV_NORMAL, GROUP_RULES, 50);
  });
});
