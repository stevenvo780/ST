/**
 * Parser v5 — Large-scale throughput benchmarks.
 * --------------------------------------------------------------
 * Stress test del parser ST sobre programas con 1k, 5k y 10k
 * axiomas + checks combinados. Inputs deterministas (sin random).
 */
import { bench, describe } from 'vitest';
import { Parser } from '../../src/parser/parser';
import { Lexer } from '../../src/lexer/lexer';

function buildProgram(numAxioms: number, numChecks: number): string {
  const lines: string[] = ['logic classical.propositional'];
  for (let i = 0; i < numAxioms; i++) {
    lines.push(`axiom a${i} = (P${i} | Q${i}) -> R${i}`);
  }
  for (let i = 0; i < numChecks; i++) {
    lines.push(`check valid (X${i} -> X${i})`);
  }
  return lines.join('\n');
}

const PROG_1K = buildProgram(1000, 100);
const PROG_5K = buildProgram(5000, 500);
const PROG_10K = buildProgram(10000, 1000);

function parse(src: string) {
  return new Parser().parse(src);
}

describe('Parser v5: large programs', () => {
  bench('parse 1k axioms + 100 checks', () => {
    parse(PROG_1K);
  });

  bench('parse 5k axioms + 500 checks', () => {
    parse(PROG_5K);
  });

  bench('parse 10k axioms + 1k checks', () => {
    parse(PROG_10K);
  });
});

describe('Parser v5: lex throughput at scale', () => {
  bench('lex 1k axioms', () => {
    new Lexer(PROG_1K, '<bench>').tokenize();
  });

  bench('lex 10k axioms', () => {
    new Lexer(PROG_10K, '<bench>').tokenize();
  });
});
