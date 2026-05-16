/**
 * Profile Multi-Eval Benchmarks
 * -----------------------------
 * Mide el tiempo de eval end-to-end por perfil lógico.
 * Cubre los 11 perfiles soportados por ST.
 */
import { bench, describe } from 'vitest';
import { Interpreter } from '../src/runtime/interpreter';

// ── Helpers ──────────────────────────────────────────────────

function run(source: string) {
  return new Interpreter().execute(source, '<bench>');
}

// ── Workloads por perfil ───────────────────────────────────────

describe('Profiles: classical.propositional', () => {
  bench('check valid tautology (P | !P)', () => {
    run('logic classical.propositional\ncheck valid (P | !P)');
  });

  bench('check valid modus ponens (P, P->Q ⊢ Q)', () => {
    run(`
logic classical.propositional
axiom a1 = P
axiom a2 = P -> Q
derive Q from {a1, a2}
`);
  });

  bench('countermodel P & Q', () => {
    run('logic classical.propositional\ncountermodel (P & Q)');
  });

  bench('truth table (P xor Q)', () => {
    run('logic classical.propositional\ntable (P xor Q)');
  });
});

describe('Profiles: classical.first_order', () => {
  bench('check valid FOL axiom K', () => {
    run('logic classical.first_order\ncheck valid ([](P -> Q) -> ([]P -> []Q))');
  });

  bench('derive in FOL', () => {
    run(`
logic classical.first_order
axiom a1 = P -> Q
axiom a2 = Q -> R
derive (P -> R) from {a1, a2}
`);
  });
});

describe('Profiles: modal.k', () => {
  bench('check valid axiom K (modal)', () => {
    run('logic modal.k\ncheck valid ([](P -> Q) -> ([]P -> []Q))');
  });

  bench('check valid <> P is satisfiable structure', () => {
    run('logic modal.k\ncheck satisfiable <>(P)');
  });
});

describe('Profiles: paraconsistent.belnap', () => {
  bench('check satisfiable P & !P (Belnap tolerates)', () => {
    run('logic paraconsistent.belnap\ncheck satisfiable (P & !P)');
  });

  bench('check valid (P -> P) in belnap', () => {
    run('logic paraconsistent.belnap\ncheck valid (P -> P)');
  });
});

describe('Profiles: deontic.standard', () => {
  bench('check valid axiom D: O(P) -> P(P)', () => {
    run('logic deontic.standard\ncheck valid ([](P) -> <>(P))');
  });
});

describe('Profiles: epistemic.s5', () => {
  bench('check valid axiom T: K(P) -> P', () => {
    run('logic epistemic.s5\ncheck valid ([](P) -> P)');
  });

  bench('check valid axiom 4: K(P) -> K(K(P))', () => {
    run('logic epistemic.s5\ncheck valid ([](P) -> []([](P)))');
  });
});

describe('Profiles: intuitionistic.propositional', () => {
  bench('check valid P -> P (intuitionistic)', () => {
    run('logic intuitionistic.propositional\ncheck valid (P -> P)');
  });

  bench('check valid double negation elim — expected invalid', () => {
    run('logic intuitionistic.propositional\ncheck valid (!!P -> P)');
  });
});

describe('Profiles: arithmetic', () => {
  bench('arithmetic: factorial(8)', () => {
    run(`
logic arithmetic
fn fact(N) {
  if valid N <= 1 { return 1 }
  let prev = N - 1
  let res = fact(prev)
  return N * res
}
let r = fact(8)
print r
`);
  });

  bench('arithmetic: fibonacci(12)', () => {
    run(`
logic arithmetic
fn fib(N) {
  if valid N <= 0 { return 0 }
  if valid N <= 1 { return 1 }
  let a = N - 1
  let b = N - 2
  let ra = fib(a)
  let rb = fib(b)
  return ra + rb
}
let r = fib(12)
print r
`);
  });
});

describe('Profiles: all 11 — declare + define + glossary', () => {
  const ALL_PROFILES = [
    'classical.propositional',
    'classical.first_order',
    'modal.k',
    'paraconsistent.belnap',
    'deontic.standard',
    'epistemic.s5',
    'aristotelian.syllogistic',
    'intuitionistic.propositional',
    'temporal.ltl',
    'probabilistic.basic',
    'arithmetic',
  ] as const;

  for (const profile of ALL_PROFILES) {
    const formula = profile === 'arithmetic' ? '2 + 3' : 'P -> Q';
    bench(`${profile}: define + glossary`, () => {
      run(`logic ${profile}\ndefine D := ${formula}\nglossary`);
    });
  }
});
