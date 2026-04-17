import { describe, expect, it } from 'vitest';

import { check, createInterpreter, evaluate, parse } from '../api';

describe('ST engine compatibility', () => {
  it('accepts unicode connectives directly in the engine', () => {
    const result = evaluate('logic classical.propositional\ncheck valid ((P → Q) → (¬Q → ¬P))');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('valid');
  });

  it('accepts premise/conclusion syntax directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\npremise h1 : P -> Q\npremise h2 : P\nconclusion Q',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
    expect(result.results[0]?.reasoningType).toBe('Modus Ponens');
  });

  it('accepts sequent notation directly in the engine', () => {
    const result = evaluate('logic classical.propositional\n{P -> Q, P} ⊢ Q');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts ascii turnstile notation directly in the engine', () => {
    const result = evaluate('logic classical.propositional\nP |- P');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts empty turnstile notation as validity directly in the engine', () => {
    const result = evaluate('logic classical.propositional\n|- (P -> P)');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('valid');
  });

  it('accepts anonymous premises inside derive directly in the engine', () => {
    const result = evaluate('logic classical.propositional\nderive Q from {(P -> Q), P}');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts mixed named and bare-atom premises inside derive directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\naxiom a1 : P -> Q\nderive Q from {a1, P}',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts derive without braces directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\naxiom a1 : P -> Q\naxiom a2 : P\nderive Q from a1, a2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts anonymous premises inside prove directly in the engine', () => {
    const result = evaluate('logic classical.propositional\nprove Q from {(P -> Q), P}');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts mixed named and bare-atom premises inside prove directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\naxiom a1 : P -> Q\nprove Q from {a1, P}',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts prove without braces directly in the engine', () => {
    const result = evaluate('logic classical.propositional\nprove Q from (P -> Q), P');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts unnamed assume directly in the engine', () => {
    const result = evaluate('logic classical.propositional\nassume P\nshow P\nqed');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts top and bottom constants directly in the engine', () => {
    const result = evaluate('logic classical.propositional\ncheck valid (⊥ -> ⊤)');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('valid');
  });

  it('accepts classroom negation and implication aliases directly in the engine', () => {
    const result = evaluate('logic classical.propositional\ncheck valid ((P ⇒ Q) ⇒ (~Q ⇒ ~P))');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('valid');
  });

  it('accepts classroom biconditional aliases directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\ncheck valid ((P <=> Q) -> ((P -> Q) & (Q -> P)))',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('valid');
  });

  it('keeps parse and check green for spanish classroom syntax', () => {
    const source = 'logic classical.propositional\npremisa P ∨ Q\npremisa ¬P\npor_tanto Q';
    const parsed = parse(source);
    const checked = check(source);

    expect(parsed.ok).toBe(true);
    expect(parsed.diagnostics).toHaveLength(0);
    expect(checked.ok).toBe(true);
    expect(checked.diagnostics).toHaveLength(0);
  });

  it('reuses named axioms when therefore closes a classroom argument', () => {
    const result = evaluate(
      'logic classical.propositional\naxiom a1 : P -> Q\naxiom a2 : P\ntherefore Q',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('supports premise buffers in createInterpreter directly in the engine api', () => {
    const interpreter = createInterpreter();

    interpreter.exec('logic classical.propositional');
    interpreter.exec('premise P -> Q');
    interpreter.exec('premise P');
    const result = interpreter.exec('conclusion Q');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('reuses current theory when conclusion is executed in the stateful api', () => {
    const interpreter = createInterpreter();

    interpreter.exec('logic classical.propositional');
    interpreter.exec('axiom a1 : P -> Q');
    interpreter.exec('axiom a2 : P');
    const result = interpreter.exec('conclusion Q');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('reuses current let bindings when conclusion is executed in the stateful api', () => {
    const interpreter = createInterpreter();

    interpreter.exec('logic classical.propositional');
    interpreter.exec('let h1 = P -> Q');
    interpreter.exec('let h2 = P');
    const result = interpreter.exec('therefore Q');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('buffers raw proof blocks in createInterpreter', () => {
    const interpreter = createInterpreter();

    interpreter.exec('logic classical.propositional');
    interpreter.exec('assume h1 : P -> Q');
    interpreter.exec('assume h2 : P');
    interpreter.exec('show Q');
    const result = interpreter.exec('qed');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.stdout).toContain('QED');
  });

  it('buffers nested proof blocks in createInterpreter', () => {
    const interpreter = createInterpreter();

    interpreter.exec('logic classical.propositional');
    interpreter.exec('assume h1 : P');
    interpreter.exec('show (Q -> P)');
    interpreter.exec('assume h2 : Q');
    interpreter.exec('show P');
    interpreter.exec('derive P from {h1}');
    interpreter.exec('qed');
    const result = interpreter.exec('qed');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.stdout).toContain('QED');
  });

  it('accepts flat numbered classroom proofs directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1. P premise\n2. P -> Q premise\n3. Q MP 1,2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts bare numbered proof lists as premises plus conclusion directly in the engine', () => {
    const result = evaluate('logic classical.propositional\n1. P\n2. P -> Q\n3. Q');

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts simple numbered implication-introduction style proofs directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1. assume P\n2. P R 1\n3. P -> P I-> 1,2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
    expect(result.results.at(-1)?.formula?.kind).toBe('implies');
  });

  it('accepts numbered classroom proofs with parenthesized counters directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1) P premise\n2) P -> Q premise\n3) Q MP 1,2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts numbered proofs with reference tuples directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1. P premise\n2. P -> Q premise\n3. Q Modus Ponens (1,2)',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts numbered proofs with colon counters directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1: P premise\n2: P -> Q premise\n3: Q MP 1,2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts numbered proofs with bracket counters directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n[1] P premise\n[2] P -> Q premise\n[3] Q MP 1,2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts numbered proofs whose premise marker comes before the formula directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1. Premise P\n2. Premise P -> Q\n3. Q Modus Ponens 1,2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts numbered proofs whose rule comes before the formula directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1. Premise P\n2. Premise P -> Q\n3. MP 1,2 Q',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts numbered proofs prefixed with ascii proof bars directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n| 1. P premise\n| 2. P -> Q premise\n| 3. Q MP 1,2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts numbered proofs prefixed with unicode proof bars directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n│ 1. P premise\n│ 2. P -> Q premise\n│ 3. Q MP 1,2',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results[0]?.status).toBe('provable');
  });

  it('accepts forward references inside numbered classroom proofs directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1. Q MP 2,3\n2. P premise\n3. P -> Q premise',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results.at(-1)?.status).toBe('provable');
  });

  it('accepts chained forward references inside numbered classroom proofs directly in the engine', () => {
    const result = evaluate(
      'logic classical.propositional\n1. R HS 2,4\n2. Q MP 3,5\n3. P premise\n4. Q -> R premise\n5. P -> Q premise',
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.results.at(-1)?.status).toBe('provable');
  });
});
