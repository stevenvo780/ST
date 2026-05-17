import { beforeEach, describe, expect, it } from 'vitest';
import {
  _resetCounters,
  apply,
  assumption,
  case_,
  destruct,
  exact,
  formulaEq,
  induction,
  intro,
  isProven,
  left,
  normalizeFormula,
  orElse,
  parseFormula,
  repeat_,
  rewrite,
  rfl,
  right,
  runTactic,
  seq,
  simp,
  split,
  startProof,
  summary,
  T,
  TacticError,
  trivial,
  tryAlt,
  unfold,
} from '../../tactic-dsl';

describe('Tactic DSL — parser y normalización', () => {
  it('parseFormula reconoce implicación, conjunción, disyunción', () => {
    const f = parseFormula('P -> Q /\\ R');
    expect(f.kind).toBe('imp');
  });

  it('normalizeFormula colapsa unicode y paréntesis', () => {
    expect(normalizeFormula('P → Q')).toBe('(P -> Q)');
    expect(normalizeFormula('(((P)))')).toBe('P');
    expect(formulaEq('P ∧ Q', 'P /\\ Q')).toBe(true);
  });
});

describe('Tactic DSL — tactics básicas', () => {
  beforeEach(() => _resetCounters());

  it('intro sobre P -> P produce goal P |- P', () => {
    const s = startProof('P -> P');
    const after = runTactic(s, intro('h'));
    expect(after.goals).toHaveLength(1);
    const g = after.goals[0];
    expect(g).toBeDefined();
    if (!g) throw new Error('goal missing');
    expect(g.hyps.h).toBe('P');
    expect(g.concl).toBe('P');
    expect(after.done).toBe(false);
  });

  it('assumption cierra P |- P', () => {
    const s = startProof('P', { h: 'P' });
    const after = runTactic(s, assumption());
    expect(isProven(after)).toBe(true);
  });

  it('seq(intro, assumption) cierra ⊢ P -> P', () => {
    const s = startProof('P -> P');
    const after = runTactic(s, seq(intro('h'), assumption()));
    expect(isProven(after)).toBe(true);
    // history debe contener ambos pasos
    expect(after.history.map((h) => h.tactic)).toEqual(['intro', 'assumption']);
  });

  it('T.then es alias de seq (namespace Coq-style)', () => {
    const s = startProof('P -> P');
    const after = runTactic(s, T.then(intro('h'), assumption()));
    expect(isProven(after)).toBe(true);
  });

  it('split con ⊢ P /\\ Q produce 2 goals: ⊢P y ⊢Q', () => {
    const s = startProof('P /\\ Q');
    const after = runTactic(s, split());
    expect(after.goals).toHaveLength(2);
    expect(after.goals[0]?.concl).toBe('P');
    expect(after.goals[1]?.concl).toBe('Q');
  });

  it('left con ⊢ P \\/ Q produce 1 goal ⊢P', () => {
    const s = startProof('P \\/ Q');
    const after = runTactic(s, left());
    expect(after.goals).toHaveLength(1);
    expect(after.goals[0]?.concl).toBe('P');
  });

  it('right con ⊢ P \\/ Q produce 1 goal ⊢Q', () => {
    const s = startProof('P \\/ Q');
    const after = runTactic(s, right());
    expect(after.goals).toHaveLength(1);
    expect(after.goals[0]?.concl).toBe('Q');
  });

  it('exact cierra goal cuando hipótesis empata literalmente', () => {
    const s = startProof('P -> Q', { hpq: 'P -> Q' });
    const after = runTactic(s, exact('hpq'));
    expect(isProven(after)).toBe(true);
  });

  it('apply con thm A -> B y goal B deja goal A', () => {
    const s = startProof('Q', { thm: 'P -> Q', hp: 'P' });
    const after = runTactic(s, apply('thm'));
    expect(after.goals).toHaveLength(1);
    expect(after.goals[0]?.concl).toBe('P');
  });

  it('apply con thm A -> B -> C y arg hp cierra primera premisa', () => {
    const s = startProof('C', { thm: 'A -> B -> C', ha: 'A' });
    const after = runTactic(s, apply('thm', ['ha']));
    // queda goal de B
    expect(after.goals).toHaveLength(1);
    expect(after.goals[0]?.concl).toBe('B');
  });

  it('rewrite usando eq h:a=b sustituye en goal', () => {
    const s = startProof('f(a) = c', { heq: 'a = b' });
    const after = runTactic(s, rewrite('heq'));
    expect(after.goals[0]?.concl).toBe('f(b) = c');
  });

  it('rewrite right-to-left usa rhs → lhs', () => {
    const s = startProof('f(b) = c', { heq: 'a = b' });
    const after = runTactic(s, rewrite('heq', 'right-to-left'));
    expect(after.goals[0]?.concl).toBe('f(a) = c');
  });

  it('rfl cierra goal a = a', () => {
    const s = startProof('foo = foo');
    const after = runTactic(s, rfl());
    expect(isProven(after)).toBe(true);
  });

  it('trivial cierra goal True', () => {
    const s = startProof('True');
    const after = runTactic(s, trivial());
    expect(isProven(after)).toBe(true);
  });

  it('trivial cierra goal arbitrario cuando hay False en hyps (ex falso)', () => {
    const s = startProof('P', { hfalse: 'False' });
    const after = runTactic(s, trivial());
    expect(isProven(after)).toBe(true);
  });

  it('destruct sobre H: P /\\ Q produce H_L:P y H_R:Q', () => {
    const s = startProof('R', { H: 'P /\\ Q' });
    const after = runTactic(s, destruct('H'));
    const g = after.goals[0];
    expect(g).toBeDefined();
    if (!g) throw new Error('goal missing');
    expect(g.hyps.H_L).toBe('P');
    expect(g.hyps.H_R).toBe('Q');
    expect(g.hyps.H).toBeUndefined();
  });

  it('destruct sobre H: P \\/ Q produce 2 goals con la hipótesis correspondiente', () => {
    const s = startProof('R', { H: 'P \\/ Q' });
    const after = runTactic(s, destruct('H'));
    expect(after.goals).toHaveLength(2);
    expect(after.goals[0]?.hyps.H_L).toBe('P');
    expect(after.goals[1]?.hyps.H_R).toBe('Q');
  });

  it('case_ es alias de destruct', () => {
    const s = startProof('R', { H: 'P /\\ Q' });
    const after = runTactic(s, case_('H'));
    expect(after.goals[0]?.hyps.H_L).toBe('P');
    expect(after.goals[0]?.hyps.H_R).toBe('Q');
  });

  it('induction sobre n:Nat genera 2 goals (zero y succ con IH)', () => {
    const s = startProof('P(n)', { n: 'Nat' });
    const after = runTactic(s, induction('n'));
    expect(after.goals).toHaveLength(2);
    expect(after.goals[0]?.concl).toBe('P(zero)');
    const succ = after.goals[1];
    expect(succ).toBeDefined();
    if (!succ) throw new Error('succ missing');
    expect(succ.concl).toBe('P(succ(n))');
    expect(succ.hyps.IH).toBe('P(n)');
    expect(succ.hyps.n).toBe('Nat');
  });

  it('unfold reemplaza definición por su body', () => {
    const dict = { foo: 'P /\\ Q' };
    const s = startProof('foo -> P');
    const after = runTactic(s, unfold('foo', dict));
    expect(after.goals[0]?.concl).toBe('((P /\\ Q) -> P)');
  });

  it('simp reduce True /\\ P → P y ~~P → P', () => {
    const s1 = startProof('True /\\ P');
    expect(runTactic(s1, simp()).goals[0]?.concl).toBe('P');
    const s2 = startProof('~~P');
    expect(runTactic(s2, simp()).goals[0]?.concl).toBe('P');
  });
});

describe('Tactic DSL — combinators', () => {
  beforeEach(() => _resetCounters());

  it('orElse(exact, assumption) prueba alternativas y usa la que funciona', () => {
    const s = startProof('P', { h: 'P' });
    const after = runTactic(s, orElse(exact('nope_does_not_exist'), assumption()));
    expect(isProven(after)).toBe(true);
    expect(after.history[0]?.tactic).toBe('assumption');
  });

  it('orElse falla si TODAS las alternativas fallan', () => {
    const s = startProof('Q', { h: 'P' });
    expect(() => runTactic(s, orElse(exact('h'), assumption()))).toThrow(TacticError);
  });

  it('repeat_(intro) introduce todas las hipótesis posibles', () => {
    const s = startProof('A -> B -> C -> D');
    const after = runTactic(s, repeat_(intro()));
    const g = after.goals[0];
    expect(g).toBeDefined();
    if (!g) throw new Error('goal missing');
    expect(g.concl).toBe('D');
    expect(Object.keys(g.hyps)).toHaveLength(3);
  });

  it('tryAlt(intro) sobre goal no implicativo deja state intacto', () => {
    const s = startProof('P', { h: 'P' });
    const after = runTactic(s, tryAlt(intro()));
    expect(after.goals[0]?.concl).toBe('P');
    expect(after.history).toHaveLength(0);
  });

  it('seq(repeat_(intro), assumption) cierra ⊢ A -> B -> A', () => {
    const s = startProof('A -> B -> A');
    const after = runTactic(s, seq(repeat_(intro()), assumption()));
    expect(isProven(after)).toBe(true);
  });

  it('seq propaga el error si un sub-tactic falla', () => {
    const s = startProof('P');
    // intro sobre goal sin implicación falla
    expect(() => runTactic(s, seq(intro(), assumption()))).toThrow(TacticError);
  });

  it('prueba de ⊢ P /\\ Q -> Q /\\ P combinando intro/destruct/split/assumption', () => {
    const s = startProof('P /\\ Q -> Q /\\ P');
    const proof = seq(
      intro('h'),
      destruct('h'),
      split(),
      assumption(), // cierra Q
      assumption(), // cierra P
    );
    const after = runTactic(s, proof);
    expect(isProven(after)).toBe(true);
  });

  it('summary devuelve "Proof complete." para pruebas cerradas', () => {
    const s = startProof('P -> P');
    const after = runTactic(s, seq(intro(), assumption()));
    expect(summary(after)).toContain('Proof complete.');
  });

  it('summary muestra goals abiertos cuando no está probado', () => {
    const s = startProof('P /\\ Q');
    const after = runTactic(s, split());
    const summ = summary(after);
    expect(summ).toContain('Goal 1');
    expect(summ).toContain('Goal 2');
    expect(summ).toContain('⊢ P');
    expect(summ).toContain('⊢ Q');
  });

  it('induction + simp + rfl prueba P(zero) cuando P(n) := n = n', () => {
    // Goal: forall n:Nat. n = n  (representado dejando n libre en hyps).
    const s = startProof('n = n', { n: 'Nat' });
    const after = runTactic(s, induction('n'));
    // zero case: zero = zero, succ case: succ(n) = succ(n) con IH n=n.
    const zero = runTactic(after, rfl());
    expect(zero.goals).toHaveLength(1); // queda succ
    const finished = runTactic(zero, rfl());
    expect(isProven(finished)).toBe(true);
  });

  it('history del proof contiene todas las invocaciones en orden', () => {
    const s = startProof('P /\\ Q -> P');
    const after = runTactic(s, seq(intro('h'), destruct('h'), assumption()));
    const tactics = after.history.map((h) => h.tactic);
    expect(tactics).toEqual(['intro', 'destruct', 'assumption']);
    expect(isProven(after)).toBe(true);
  });
});

describe('Tactic DSL — errores y borde', () => {
  beforeEach(() => _resetCounters());

  it('intro sobre goal no implicativo lanza TacticError', () => {
    const s = startProof('P');
    expect(() => runTactic(s, intro())).toThrow(TacticError);
  });

  it('apply sobre hipótesis cuya conclusión no encaja con goal lanza error', () => {
    const s = startProof('Q', { h: 'A -> B' });
    expect(() => runTactic(s, apply('h'))).toThrow(/no unifica/);
  });

  it('rewrite con hipótesis no-igualdad lanza error', () => {
    const s = startProof('P', { h: 'P -> Q' });
    expect(() => runTactic(s, rewrite('h'))).toThrow(/no es una igualdad/);
  });

  it('induction sobre hipótesis no-Nat lanza error', () => {
    const s = startProof('P(x)', { x: 'String' });
    expect(() => runTactic(s, induction('x'))).toThrow(/Nat/);
  });

  it('exact con term que no encaja lanza error', () => {
    const s = startProof('Q', { h: 'P' });
    expect(() => runTactic(s, exact('h'))).toThrow(/no coincide/);
  });
});
