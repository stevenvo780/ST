/**
 * Parser Benchmarks
 * -----------------
 * Mide throughput del parser ST en programas cortos, medios y largos.
 * Todos los inputs son deterministas (sin random).
 */
import { bench, describe } from 'vitest';
import { Parser } from '../src/parser/parser';
import { Lexer } from '../src/lexer/lexer';

// ── Helpers ──────────────────────────────────────────────────

function lex(source: string) {
  return new Lexer(source).tokenize();
}

function parse(source: string) {
  const tokens = lex(source);
  return new Parser(tokens, source).parse();
}

// ── Workloads ─────────────────────────────────────────────────

const SHORT_PROGRAM = `
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = Q -> R
check valid (P -> R)
`;

// 20 axioms + implications
const MEDIUM_PROGRAM = (() => {
  const lines = ['logic classical.propositional'];
  for (let i = 0; i < 20; i++) {
    lines.push(`axiom a${i} = A${i} -> A${i + 1}`);
  }
  lines.push('axiom base = A0');
  lines.push(`derive A20 from {${Array.from({ length: 21 }, (_, i) => `a${i}`).join(', ')}, base}`);
  return lines.join('\n');
})();

// 50 axioms + check + theory block
const LARGE_PROGRAM = (() => {
  const lines = ['logic classical.propositional'];
  for (let i = 0; i < 50; i++) {
    lines.push(`axiom ax${i} = (X${i} | Y${i}) -> Z${i}`);
  }
  for (let i = 0; i < 10; i++) {
    lines.push(`check valid (X${i} -> X${i})`);
  }
  lines.push('glossary');
  return lines.join('\n');
})();

// Modal program with nested operators
const MODAL_PROGRAM = (() => {
  const lines = ['logic modal.k'];
  for (let i = 0; i < 15; i++) {
    lines.push(`axiom m${i} = [](P${i} -> Q${i})`);
    lines.push(`check valid ([](P${i}) -> <>(Q${i}))`);
  }
  return lines.join('\n');
})();

// Arithmetic-heavy program
const ARITHMETIC_PROGRAM = `
logic arithmetic
fn fact(N) {
  if valid N <= 1 { return 1 }
  let prev = N - 1
  let res = fact(prev)
  return N * res
}
fn fib(N) {
  if valid N <= 0 { return 0 }
  if valid N <= 1 { return 1 }
  let a = N - 1
  let b = N - 2
  let ra = fib(a)
  let rb = fib(b)
  return ra + rb
}
let r1 = fact(10)
let r2 = fib(12)
print r1
print r2
`;

// ── Benchmarks ────────────────────────────────────────────────

describe('Parser: throughput by program size', () => {
  bench('parse short program (~5 statements)', () => {
    parse(SHORT_PROGRAM);
  });

  bench('parse medium program (20 axioms + derive)', () => {
    parse(MEDIUM_PROGRAM);
  });

  bench('parse large program (50 axioms + 10 checks)', () => {
    parse(LARGE_PROGRAM);
  });

  bench('parse modal program (15 modal axioms + checks)', () => {
    parse(MODAL_PROGRAM);
  });

  bench('parse arithmetic program (2 fns + loops)', () => {
    parse(ARITHMETIC_PROGRAM);
  });
});

describe('Parser: lex throughput', () => {
  bench('lex short program', () => {
    lex(SHORT_PROGRAM);
  });

  bench('lex large program', () => {
    lex(LARGE_PROGRAM);
  });
});
