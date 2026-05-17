import { describe, expect, it } from 'vitest';
import {
  and,
  atom,
  eventually,
  globally,
  implies,
  isSatisfiable,
  isValid,
  next,
  not,
  or,
  release,
  toBuchi,
  toNNF,
  until,
  weakUntil,
  closure,
  formulaToString,
} from '../../profiles/ltl-sat';

const p = atom('p');
const q = atom('q');
const r = atom('r');

describe('LTL-SAT — fórmulas básicas', () => {
  it('un átomo simple es satisfacible', () => {
    const res = isSatisfiable(p);
    expect(res.sat).toBe(true);
    expect(res.witness).toBeDefined();
    expect(res.witness!.loop.length).toBeGreaterThan(0);
  });

  it('p ∧ ¬p es insatisfacible', () => {
    const res = isSatisfiable(and(p, not(p)));
    expect(res.sat).toBe(false);
  });

  it('p ∨ ¬p es válido', () => {
    expect(isValid(or(p, not(p)))).toBe(true);
  });
});

describe('LTL-SAT — operadores temporales', () => {
  it('F p es satisfacible (eventualidad alcanzable)', () => {
    const res = isSatisfiable(eventually(p));
    expect(res.sat).toBe(true);
    // El witness debe contener p en algún estado (prefijo o lazo).
    const allStates = [...(res.witness?.prefix ?? []), ...(res.witness?.loop ?? [])];
    const hasP = allStates.some((s) => s.includes('p') && !s.includes('¬p'));
    expect(hasP).toBe(true);
  });

  it('G p ∧ ¬p es insatisfacible', () => {
    const res = isSatisfiable(and(globally(p), not(p)));
    expect(res.sat).toBe(false);
  });

  it('G(p → X p) ∧ p ∧ F ¬p es insatisfacible (p se vuelve permanente)', () => {
    const phi = and(globally(implies(p, next(p))), p, eventually(not(p)));
    expect(isSatisfiable(phi).sat).toBe(false);
  });

  it('p U q es satisfacible con witness donde q aparece eventualmente', () => {
    const res = isSatisfiable(until(p, q));
    expect(res.sat).toBe(true);
    const allStates = [...(res.witness?.prefix ?? []), ...(res.witness?.loop ?? [])];
    const hasQ = allStates.some((s) => s.split(',').includes('q'));
    expect(hasQ).toBe(true);
  });

  it('(p U q) ∧ G ¬q es insatisfacible', () => {
    const phi = and(until(p, q), globally(not(q)));
    expect(isSatisfiable(phi).sat).toBe(false);
  });

  it('G F p es satisfacible (fairness — p infinitamente a menudo)', () => {
    const res = isSatisfiable(globally(eventually(p)));
    expect(res.sat).toBe(true);
    // El lazo debe contener un estado con p positivo.
    const loopHasP = (res.witness?.loop ?? []).some((s) => s.split(',').includes('p'));
    expect(loopHasP).toBe(true);
  });

  it('F G p es satisfacible (eventualmente p se vuelve permanente)', () => {
    const res = isSatisfiable(eventually(globally(p)));
    expect(res.sat).toBe(true);
  });
});

describe('LTL-SAT — validez', () => {
  it('G p → p es válido', () => {
    expect(isValid(implies(globally(p), p))).toBe(true);
  });

  it('p → F p es válido', () => {
    expect(isValid(implies(p, eventually(p)))).toBe(true);
  });

  it('G p → G G p es válido', () => {
    expect(isValid(implies(globally(p), globally(globally(p))))).toBe(true);
  });

  it('p → X p NO es válido (en general el siguiente puede diferir)', () => {
    expect(isValid(implies(p, next(p)))).toBe(false);
  });

  it('F p ∨ G ¬p es válido (tertium)', () => {
    expect(isValid(or(eventually(p), globally(not(p))))).toBe(true);
  });
});

describe('LTL-SAT — operadores derivados y release', () => {
  it('p R q es satisfacible', () => {
    const res = isSatisfiable(release(p, q));
    expect(res.sat).toBe(true);
  });

  it('false R p ≡ G p (false R φ siempre tiene φ permanente)', () => {
    // Lo modelamos como atom that never holds: usamos ¬p ∧ p contradictorio
    // en lugar de un "false" literal. En su lugar testeamos que
    // p R q ∧ ¬q is unsat (porque φ R ψ exige ψ).
    const phi = and(release(p, q), not(q));
    expect(isSatisfiable(phi).sat).toBe(false);
  });

  it('p W q (weak until) es satisfacible', () => {
    const res = isSatisfiable(weakUntil(p, q));
    expect(res.sat).toBe(true);
  });

  it('(p W q) ∧ G ¬p ∧ G ¬q es insatisfacible', () => {
    // weak until: o φ U ψ (q llega) o G φ (p siempre). Negar ambas → unsat.
    const phi = and(weakUntil(p, q), globally(not(p)), globally(not(q)));
    expect(isSatisfiable(phi).sat).toBe(false);
  });
});

describe('LTL-SAT — utilidades estructurales', () => {
  it('toNNF empuja negaciones hasta átomos', () => {
    const phi = not(and(p, q));
    const nnf = toNNF(phi);
    expect(nnf.kind).toBe('or');
    // No debe haber un `not` directamente sobre un `and`.
    const s = formulaToString(nnf);
    expect(s).toContain('¬p');
    expect(s).toContain('¬q');
  });

  it('toNNF maneja la dualidad de Until: ¬(p U q) ≡ ¬q R ¬p', () => {
    const phi = not(until(p, q));
    const nnf = toNNF(phi);
    expect(nnf.kind).toBe('R');
  });

  it('closure es finita y contiene la fórmula original', () => {
    const phi = until(p, q);
    const cl = closure(phi);
    expect(cl.length).toBeGreaterThan(0);
    expect(cl.length).toBeLessThan(50);
    // Debe contener X(p U q).
    const hasXU = cl.some((f) => f.kind === 'X' && f.arg.kind === 'U');
    expect(hasXU).toBe(true);
  });

  it('toBuchi devuelve estadísticas razonables', () => {
    const stats = toBuchi(eventually(p));
    expect(stats.states).toBeGreaterThan(0);
    expect(stats.accepting).toBeGreaterThanOrEqual(0);
    expect(stats.accepting).toBeLessThanOrEqual(stats.states);
  });
});

describe('LTL-SAT — combinaciones realistas', () => {
  it('G(p → F q) es satisfacible (response pattern)', () => {
    expect(isSatisfiable(globally(implies(p, eventually(q)))).sat).toBe(true);
  });

  it('G(p → F q) ∧ G p ∧ G ¬q es insatisfacible', () => {
    const phi = and(globally(implies(p, eventually(q))), globally(p), globally(not(q)));
    expect(isSatisfiable(phi).sat).toBe(false);
  });

  it('X X p ∧ X X ¬p es insatisfacible', () => {
    const phi = and(next(next(p)), next(next(not(p))));
    expect(isSatisfiable(phi).sat).toBe(false);
  });

  it('alternancia (p ∧ X ¬p ∧ X X p) es satisfacible', () => {
    const phi = and(p, next(not(p)), next(next(p)));
    expect(isSatisfiable(phi).sat).toBe(true);
  });

  it('mutex G ¬(p ∧ q) es satisfacible', () => {
    expect(isSatisfiable(globally(not(and(p, q)))).sat).toBe(true);
  });

  it('G(p → X q) ∧ F p ∧ G ¬q es insatisfacible', () => {
    const phi = and(globally(implies(p, next(q))), eventually(p), globally(not(q)));
    expect(isSatisfiable(phi).sat).toBe(false);
  });

  it('formula con 3 átomos (p ∧ F q ∧ G r) es satisfacible', () => {
    expect(isSatisfiable(and(p, eventually(q), globally(r))).sat).toBe(true);
  });
});
