// ============================================================
// TPTP Tests — Parser
// ============================================================

import { describe, it, expect } from 'vitest';
import { parseTptp, parseFormula, TptpParserError } from '../../../tooling/tptp/parser';
import type { TptpFormula } from '../../../tooling/tptp/ast';

describe('TPTP parser — fórmulas FOF', () => {
  it('parsea fof(a, axiom, p(X) => q(X)).', () => {
    const p = parseTptp('fof(a, axiom, p(X) => q(X)).');
    expect(p.annotated).toHaveLength(1);
    const ann = p.annotated[0];
    expect(ann.language).toBe('fof');
    expect(ann.name).toBe('a');
    expect(ann.role).toBe('axiom');
    expect(ann.formula.kind).toBe('implies');
    const impl = ann.formula as Extract<TptpFormula, { kind: 'implies' }>;
    expect((impl.left as { predicate: string }).predicate).toBe('p');
    expect((impl.right as { predicate: string }).predicate).toBe('q');
  });

  it('parsea cuantificador universal con múltiples variables', () => {
    const f = parseFormula('! [X, Y] : p(X, Y)', 'fof');
    expect(f.kind).toBe('forall');
    const q = f as Extract<TptpFormula, { kind: 'forall' }>;
    expect(q.vars).toEqual(['X', 'Y']);
    expect(q.body.kind).toBe('atom');
  });

  it('parsea cuantificador existencial', () => {
    const f = parseFormula('? [X] : p(X)', 'fof');
    expect(f.kind).toBe('exists');
  });

  it('parsea igualdad f(a) = b', () => {
    const f = parseFormula('f(a) = b', 'fof');
    expect(f.kind).toBe('eq');
    const eq = f as Extract<TptpFormula, { kind: 'eq' }>;
    expect(eq.left.kind).toBe('func');
    expect(eq.right.kind).toBe('const');
  });

  it('parsea desigualdad a != b', () => {
    const f = parseFormula('a != b', 'fof');
    expect(f.kind).toBe('neq');
  });

  it('parsea negación ~p(X)', () => {
    const f = parseFormula('~p(X)', 'fof');
    expect(f.kind).toBe('not');
  });

  it('parsea conjunción y disyunción con precedencia correcta', () => {
    // a & b | c → (a & b) | c en TPTP estándar? En realidad, & y | tienen
    // misma precedencia / no-asociativas en TPTP estricto, pero nuestro
    // parser le da & más alta precedencia (común en otros provers).
    const f = parseFormula('p & q | r', 'fof');
    expect(f.kind).toBe('or');
    const orF = f as Extract<TptpFormula, { kind: 'or' }>;
    expect(orF.args[0].kind).toBe('and');
  });

  it('parsea iff <=>', () => {
    const f = parseFormula('p <=> q', 'fof');
    expect(f.kind).toBe('iff');
  });

  it('parsea xor <~>', () => {
    const f = parseFormula('p <~> q', 'fof');
    expect(f.kind).toBe('xor');
  });

  it('parsea <= como implies invertida', () => {
    const f = parseFormula('p <= q', 'fof');
    expect(f.kind).toBe('implies');
    // p <= q  ≡  q => p
    const impl = f as Extract<TptpFormula, { kind: 'implies' }>;
    expect((impl.left as { predicate: string }).predicate).toBe('q');
    expect((impl.right as { predicate: string }).predicate).toBe('p');
  });

  it('parsea $true y $false', () => {
    expect(parseFormula('$true', 'fof').kind).toBe('true');
    expect(parseFormula('$false', 'fof').kind).toBe('false');
  });

  it('parsea problema multi-formula con axiomas y conjecture', () => {
    const src = `
      fof(modus_ponens, axiom, ![X] : (p(X) => q(X))).
      fof(p_a, axiom, p(a)).
      fof(goal, conjecture, q(a)).
    `;
    const p = parseTptp(src);
    expect(p.annotated).toHaveLength(3);
    expect(p.annotated.map((a) => a.role)).toEqual(['axiom', 'axiom', 'conjecture']);
  });

  it('parsea include y lo añade a includes[]', () => {
    const p = parseTptp(`include('tptp/SET001.ax').\nfof(a, axiom, p).`);
    expect(p.includes).toEqual(['tptp/SET001.ax']);
    expect(p.annotated).toHaveLength(1);
  });

  it('parsea include con lista de selectors y los descarta', () => {
    const p = parseTptp(`include('file.ax', [ax1, ax2]).`);
    expect(p.includes).toEqual(['file.ax']);
  });

  it('parsea CNF cnf(c1, axiom, p(a) | ~q(b)).', () => {
    const p = parseTptp('cnf(c1, axiom, p(a) | ~q(b)).');
    expect(p.annotated).toHaveLength(1);
    const f = p.annotated[0].formula;
    expect(f.kind).toBe('or');
    const orF = f as Extract<TptpFormula, { kind: 'or' }>;
    expect(orF.args[0].kind).toBe('atom');
    expect(orF.args[1].kind).toBe('not');
  });

  it('parsea CNF de un solo literal', () => {
    const p = parseTptp('cnf(c2, axiom, p(a)).');
    const f = p.annotated[0].formula;
    expect(f.kind).toBe('atom');
  });

  it('parsea CNF con literal negado solo', () => {
    const p = parseTptp('cnf(c3, axiom, ~p(X)).');
    expect(p.annotated[0].formula.kind).toBe('not');
  });

  it('parsea TFF light con type annotations en variables', () => {
    // ![X : $i] : p(X) — el tipo se descarta
    const p = parseTptp('tff(t1, axiom, ! [X : $i] : p(X)).');
    expect(p.annotated[0].language).toBe('tff');
    const f = p.annotated[0].formula;
    expect(f.kind).toBe('forall');
    const q = f as Extract<TptpFormula, { kind: 'forall' }>;
    expect(q.vars).toEqual(['X']);
  });

  it('parsea anotaciones opcionales tras la fórmula y las ignora', () => {
    const p = parseTptp('fof(a, axiom, p(X), unknown, [status(thm)]).');
    expect(p.annotated).toHaveLength(1);
    expect(p.annotated[0].formula.kind).toBe('atom');
  });

  it('parsea átomo proposicional sin args', () => {
    const f = parseFormula('p', 'fof');
    expect(f.kind).toBe('atom');
    const atom = f as Extract<TptpFormula, { kind: 'atom' }>;
    expect(atom.predicate).toBe('p');
    expect(atom.args).toEqual([]);
  });

  it('parsea funciones anidadas f(g(a), h(X, b))', () => {
    const f = parseFormula('p(f(g(a), h(X, b)))', 'fof');
    expect(f.kind).toBe('atom');
    const atom = f as Extract<TptpFormula, { kind: 'atom' }>;
    expect(atom.args).toHaveLength(1);
    const inner = atom.args[0];
    expect(inner.kind).toBe('func');
  });

  it('parsea problema TPTP real estilo "Trivial" — modus tollens', () => {
    const src = `
      fof(mt1, axiom, ![X] : (p(X) => q(X))).
      fof(mt2, axiom, ~q(a)).
      fof(mt_goal, conjecture, ~p(a)).
    `;
    const p = parseTptp(src);
    expect(p.annotated).toHaveLength(3);
  });

  it('parsea problema TPTP real — transitividad', () => {
    const src = `
      fof(trans, axiom, ![X,Y,Z] : ((r(X,Y) & r(Y,Z)) => r(X,Z))).
      fof(rab, axiom, r(a,b)).
      fof(rbc, axiom, r(b,c)).
      fof(goal, conjecture, r(a,c)).
    `;
    const p = parseTptp(src);
    expect(p.annotated).toHaveLength(4);
    expect(p.annotated[3].role).toBe('conjecture');
  });

  it('parsea problema TPTP real — pelletier 1 (basic propositional)', () => {
    const src = `fof(pel1, conjecture, (p => q) <=> (~q => ~p)).`;
    const p = parseTptp(src);
    expect(p.annotated[0].formula.kind).toBe('iff');
  });

  it('parsea problema TPTP real — pelletier 17 (FOL with quantifiers)', () => {
    const src = `
      fof(pel17_ax1, axiom, p & (q | r)).
      fof(pel17_goal, conjecture, (p & q) | (p & r)).
    `;
    const p = parseTptp(src);
    expect(p.annotated).toHaveLength(2);
  });

  it('parsea problema TPTP real — socrates es mortal', () => {
    const src = `
      fof(all_men_mortal, axiom, ![X] : (man(X) => mortal(X))).
      fof(socrates_is_man, axiom, man(socrates)).
      fof(socrates_mortal, conjecture, mortal(socrates)).
    `;
    const p = parseTptp(src);
    expect(p.annotated).toHaveLength(3);
    expect(p.annotated[2].role).toBe('conjecture');
  });

  it('lanza error en formula mal formada', () => {
    expect(() => parseFormula('p &', 'fof')).toThrow();
  });

  it('lanza error en role desconocido', () => {
    expect(() => parseTptp('fof(a, frobnicate, p).')).toThrow(TptpParserError);
  });
});
