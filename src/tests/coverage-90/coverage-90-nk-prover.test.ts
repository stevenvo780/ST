import { describe, it, expect } from 'vitest';
import {
  proveClassically,
  proveIntuitOnly,
  verifyProof,
  provedPeirce,
} from '../../logic/profiles/natural-deduction-nk/prover';
import type { NKFormula } from '../../logic/profiles/natural-deduction-nk/types';

const atom = (name: string): NKFormula => ({ kind: 'atom', name });
const not = (arg: NKFormula): NKFormula => ({ kind: 'not', arg });
const and = (left: NKFormula, right: NKFormula): NKFormula => ({ kind: 'and', left, right });
const or = (left: NKFormula, right: NKFormula): NKFormula => ({ kind: 'or', left, right });
const implies = (left: NKFormula, right: NKFormula): NKFormula => ({
  kind: 'implies',
  left,
  right,
});

describe('coverage-90 — natural deduction NK prover', () => {
  it('proves P -> P trivially', () => {
    const proof = proveClassically([], implies(atom('P'), atom('P')));
    expect(proof).not.toBeNull();
  });

  it('proves modus ponens: P, P->Q ⊢ Q', () => {
    const proof = proveClassically([atom('P'), implies(atom('P'), atom('Q'))], atom('Q'));
    expect(proof).not.toBeNull();
  });

  it('proves and-introduction: P, Q ⊢ P & Q', () => {
    const proof = proveClassically([atom('P'), atom('Q')], and(atom('P'), atom('Q')));
    expect(proof).not.toBeNull();
  });

  it('proves and-elim left: P & Q ⊢ P', () => {
    const proof = proveClassically([and(atom('P'), atom('Q'))], atom('P'));
    expect(proof).not.toBeNull();
  });

  it('proves or-introduction left: P ⊢ P | Q', () => {
    const proof = proveClassically([atom('P')], or(atom('P'), atom('Q')));
    expect(proof).not.toBeNull();
  });

  it('proves LEM classically: ⊢ P | !P', () => {
    const proof = proveClassically([], or(atom('P'), not(atom('P'))));
    expect(proof).not.toBeNull();
  });

  it('fails to prove LEM intuitionistically', () => {
    const proof = proveIntuitOnly([], or(atom('P'), not(atom('P'))), { budget: 5_000 });
    expect(proof).toBeNull();
  });

  it('proves double-neg-elim classically: !!P ⊢ P', () => {
    const proof = proveClassically([not(not(atom('P')))], atom('P'));
    expect(proof).not.toBeNull();
  });

  it('fails to prove double-neg-elim intuitionistically', () => {
    const proof = proveIntuitOnly([not(not(atom('P')))], atom('P'), { budget: 5_000 });
    expect(proof).toBeNull();
  });

  it('proves Peirce: ⊢ ((P→Q)→P)→P', () => {
    const proof = proveClassically(
      [],
      implies(implies(implies(atom('P'), atom('Q')), atom('P')), atom('P')),
    );
    expect(proof).not.toBeNull();
  });

  it('budget=0 returns null', () => {
    const proof = proveClassically([], atom('P'), { budget: 0 });
    expect(proof).toBeNull();
  });

  it('verifyProof: validates a discovered proof', () => {
    const proof = proveClassically([], implies(atom('P'), atom('P')));
    expect(proof).not.toBeNull();
    if (proof) expect(verifyProof(proof)).toBe(true);
  });

  it('verifyProof: validates assumption with context', () => {
    expect(
      verifyProof(
        {
          conclusion: atom('P'),
          rule: 'assumption',
          premises: [],
        },
        [atom('P')],
      ),
    ).toBe(true);
  });

  it('verifyProof: rejects assumption without context match', () => {
    expect(
      verifyProof(
        {
          conclusion: atom('P'),
          rule: 'assumption',
          premises: [],
        },
        [atom('Q')],
      ),
    ).toBe(false);
  });

  it('verifyProof: bad andI proof', () => {
    expect(
      verifyProof({
        conclusion: and(atom('P'), atom('Q')),
        rule: 'andI',
        premises: [{ conclusion: atom('P'), rule: 'assumption', premises: [] }],
      }),
    ).toBe(false);
  });

  it('provedPeirce returns valid proof structure', () => {
    const p = provedPeirce();
    expect(p).toBeDefined();
    expect(p.conclusion).toBeDefined();
  });

  it('proves transitivity: ⊢ (P→Q) → ((Q→R) → (P→R))', () => {
    const proof = proveClassically(
      [],
      implies(
        implies(atom('P'), atom('Q')),
        implies(implies(atom('Q'), atom('R')), implies(atom('P'), atom('R'))),
      ),
    );
    expect(proof).not.toBeNull();
  });

  it('proves De Morgan one direction', () => {
    const proof = proveClassically(
      [],
      implies(not(or(atom('P'), atom('Q'))), and(not(atom('P')), not(atom('Q')))),
    );
    expect(proof).not.toBeNull();
  });

  it('proves contrapositive classically: ⊢ (P→Q) → (!Q→!P)', () => {
    const proof = proveClassically(
      [],
      implies(implies(atom('P'), atom('Q')), implies(not(atom('Q')), not(atom('P')))),
    );
    expect(proof).not.toBeNull();
  });
});
