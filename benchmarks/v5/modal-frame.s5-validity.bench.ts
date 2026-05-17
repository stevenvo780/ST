/**
 * Modal frame axioms — S5 validity benchmarks.
 * --------------------------------------------------------------
 * Tableau modal con axiomas T/4/5 para validar fórmulas S5
 * conocidas + comparar contra K (sin axiomas).
 */
import { bench, describe } from 'vitest';
import {
  atom,
  box,
  diamond,
  implies,
  not,
  isValid,
  isSatisfiable,
} from '../../src/profiles/modal-frame-axioms';

const p = atom('p');
const q = atom('q');
const r = atom('r');

// S5 axioms / theorems
const F_T = implies(box(p), p); // T: □p → p
const F_4 = implies(box(p), box(box(p))); // 4: □p → □□p
const F_5 = implies(diamond(p), box(diamond(p))); // 5: ◇p → □◇p
const F_B = implies(p, box(diamond(p))); // B: p → □◇p
const F_NEST = implies(box(box(p)), box(box(box(p)))); // S4 theorem
const F_DEEP_S5 = implies(diamond(diamond(p)), diamond(p)); // S5 collapse

// SAT instance (non-trivial)
const F_SAT = implies(diamond(p), diamond(implies(p, q)));

describe('Modal frame: S5 validity', () => {
  bench('validity of T axiom in S5', () => {
    isValid(F_T, 'S5');
  });

  bench('validity of 4 axiom in S5', () => {
    isValid(F_4, 'S5');
  });

  bench('validity of 5 axiom in S5', () => {
    isValid(F_5, 'S5');
  });

  bench('validity of B in S5', () => {
    isValid(F_B, 'S5');
  });

  bench('validity of nested S4 theorem', () => {
    isValid(F_NEST, 'S4');
  });

  bench('S5 modal collapse ◇◇p→◇p', () => {
    isValid(F_DEEP_S5, 'S5');
  });

  bench('satisfiability in K', () => {
    isSatisfiable(F_SAT, 'K');
  });
});
