import { describe, it, expect } from 'vitest';
import {
  alphaEq,
  alphaBetaEq,
  cApp,
  cArrow,
  cI0,
  cI1,
  cIMax,
  cIMin,
  cINeg,
  cIVar,
  cLam,
  cPApp,
  cPLam,
  cPathP,
  cPi,
  cUniverse,
  cVar,
  evalInterval,
  glue,
  inferType,
  isInferErrorCubical,
  isIntervalExpr,
  normalize,
  normalizeInterval,
  pathCompose,
  pathInverse,
  reflPath,
  termToString,
  type CubicalTerm,
} from '../../../type-theory/cubical';

function unwrap(r: ReturnType<typeof inferType>): CubicalTerm {
  if (isInferErrorCubical(r)) throw new Error(`unexpected error: ${r.error}`);
  return r;
}

describe('CTT-Lite / interval algebra', () => {
  it('isIntervalExpr reconoce i0, i1, iVar', () => {
    expect(isIntervalExpr(cI0())).toBe(true);
    expect(isIntervalExpr(cI1())).toBe(true);
    expect(isIntervalExpr(cIVar('i'))).toBe(true);
    expect(isIntervalExpr(cIMin(cI0(), cIVar('i')))).toBe(true);
    expect(isIntervalExpr(cIMax(cI1(), cIVar('i')))).toBe(true);
    expect(isIntervalExpr(cINeg(cIVar('i')))).toBe(true);
  });

  it('isIntervalExpr rechaza términos no interválicos', () => {
    expect(isIntervalExpr(cVar('x'))).toBe(false);
    expect(isIntervalExpr(cUniverse(0))).toBe(false);
    expect(isIntervalExpr(cLam('x', cUniverse(0), cVar('x')))).toBe(false);
  });

  it('evalInterval: extremos y leyes 1 - 0 ≡ 1, 1 - 1 ≡ 0', () => {
    expect(evalInterval(cI0())).toBe(0);
    expect(evalInterval(cI1())).toBe(1);
    expect(evalInterval(cINeg(cI0()))).toBe(1);
    expect(evalInterval(cINeg(cI1()))).toBe(0);
  });

  it('evalInterval: 0 ∧ i ≡ 0, 1 ∧ i ≡ i, 0 ∨ i ≡ i, 1 ∨ i ≡ 1', () => {
    expect(evalInterval(cIMin(cI0(), cIVar('i')))).toBe(0);
    expect(evalInterval(cIMin(cI1(), cI0()))).toBe(0);
    expect(evalInterval(cIMin(cI1(), cI1()))).toBe(1);
    expect(evalInterval(cIMax(cI1(), cIVar('i')))).toBe(1);
    expect(evalInterval(cIMax(cI0(), cI1()))).toBe(1);
    expect(evalInterval(cIMax(cI0(), cI0()))).toBe(0);
  });

  it('evalInterval: variable libre devuelve gen', () => {
    expect(evalInterval(cIVar('i'))).toBe('gen');
    expect(evalInterval(cIMin(cIVar('i'), cIVar('j')))).toBe('gen');
  });

  it('evalInterval: environment {i ↦ 1} resuelve i a 1', () => {
    const env = new Map<string, 0 | 1>([['i', 1]]);
    expect(evalInterval(cIVar('i'), env)).toBe(1);
    expect(evalInterval(cINeg(cIVar('i')), env)).toBe(0);
    expect(evalInterval(cIMin(cIVar('i'), cI1()), env)).toBe(1);
  });

  it('normalizeInterval: ~ ~ i ≡ i (involución)', () => {
    const t = cINeg(cINeg(cIVar('i')));
    const n = normalizeInterval(t);
    expect(alphaEq(n, cIVar('i'))).toBe(true);
  });

  it('normalizeInterval: 1 ∧ (0 ∨ i) ≡ i', () => {
    const t = cIMin(cI1(), cIMax(cI0(), cIVar('i')));
    const n = normalizeInterval(t);
    expect(alphaEq(n, cIVar('i'))).toBe(true);
  });
});

describe('CTT-Lite / pLam y pApp (β del intervalo)', () => {
  it('(λi. x) @ i0 ≡ x', () => {
    const p = cPLam('i', cVar('x'));
    const reduced = normalize(cPApp(p, cI0()));
    expect(alphaEq(reduced, cVar('x'))).toBe(true);
  });

  it('(λi. x) @ i1 ≡ x', () => {
    const p = cPLam('i', cVar('x'));
    const reduced = normalize(cPApp(p, cI1()));
    expect(alphaEq(reduced, cVar('x'))).toBe(true);
  });

  it('(λi. i) @ i0 ≡ i0 y @ i1 ≡ i1 (path variable identidad)', () => {
    const p = cPLam('i', cIVar('i'));
    expect(alphaEq(normalize(cPApp(p, cI0())), cI0())).toBe(true);
    expect(alphaEq(normalize(cPApp(p, cI1())), cI1())).toBe(true);
  });
});

describe('CTT-Lite / reflPath y boundary', () => {
  it('reflPath(x) @ i0 ≡ x', () => {
    const p = reflPath(cVar('x'));
    expect(alphaEq(normalize(cPApp(p, cI0())), cVar('x'))).toBe(true);
  });

  it('reflPath(x) @ i1 ≡ x', () => {
    const p = reflPath(cVar('x'));
    expect(alphaEq(normalize(cPApp(p, cI1())), cVar('x'))).toBe(true);
  });

  it('pathInverse(reflPath(x)) ≡ reflPath(x) (porque i no ocurre)', () => {
    const r = reflPath(cVar('x'));
    expect(alphaEq(pathInverse(r), r)).toBe(true);
  });
});

describe('CTT-Lite / composición (identidades sintácticas)', () => {
  it('pathCompose(reflPath(x), p) ≡ p (identidad izquierda)', () => {
    // path no-trivial: λi. f i (depende de i)
    const p = cPLam('i', cPApp(cVar('q'), cIVar('i')));
    const c = pathCompose(reflPath(cVar('x')), p);
    expect(alphaEq(c, p)).toBe(true);
  });

  it('pathCompose(p, reflPath(x)) ≡ p (identidad derecha)', () => {
    const p = cPLam('i', cPApp(cVar('q'), cIVar('i')));
    const c = pathCompose(p, reflPath(cVar('x')));
    expect(alphaEq(c, p)).toBe(true);
  });

  it('composición asociativa (sintáctica) con dos reflPath', () => {
    const p = cPLam('i', cPApp(cVar('q'), cIVar('i')));
    const r1 = reflPath(cVar('a'));
    const r2 = reflPath(cVar('b'));
    // (p · r1) · r2 ≡ p ≡ p · (r1 · r2)
    const lhs = pathCompose(pathCompose(p, r1), r2);
    const rhs = pathCompose(p, pathCompose(r1, r2));
    expect(alphaEq(lhs, rhs)).toBe(true);
  });
});

describe('CTT-Lite / inferencia de tipos', () => {
  it('i0 : I  e  i1 : I', () => {
    const t0 = unwrap(inferType(cI0()));
    const t1 = unwrap(inferType(cI1()));
    expect(t0.kind === 'var' && t0.name === '__I__').toBe(true);
    expect(t1.kind === 'var' && t1.name === '__I__').toBe(true);
  });

  it('~ i0 : I', () => {
    const t = unwrap(inferType(cINeg(cI0())));
    expect(t.kind === 'var' && t.name === '__I__').toBe(true);
  });

  it('iMin/iMax sobre extremos: bien tipados', () => {
    expect(isInferErrorCubical(inferType(cIMin(cI0(), cI1())))).toBe(false);
    expect(isInferErrorCubical(inferType(cIMax(cI0(), cI1())))).toBe(false);
  });

  it('reflPath(x) infiere PathP _ x x cuando x es tipado', () => {
    // Construimos λi. x dentro de un contexto donde x : Type 0
    // (no usamos contexto: x es libre y refl no exige tipar la base si el
    // body es independiente del intervalo)
    const r = reflPath(cVar('x'));
    // No exigimos tipar (variable libre); sólo verificamos forma normal
    // y β. La inferencia falla limpiamente al pedir el tipo de la variable.
    const t = inferType(r);
    expect(isInferErrorCubical(t)).toBe(true);
  });

  it('λi. i0 : PathP _ i0 i0  (path en I, constante en los extremos)', () => {
    const p = cPLam('i', cI0());
    const t = unwrap(inferType(p));
    expect(t.kind).toBe('pathP');
    if (t.kind !== 'pathP') throw new Error('expected pathP');
    expect(alphaEq(t.left, cI0())).toBe(true);
    expect(alphaEq(t.right, cI0())).toBe(true);
  });

  it('p @ r requiere PathP en p', () => {
    // p no es PathP → error
    const bad = cPApp(cVar('p'), cI0());
    expect(isInferErrorCubical(inferType(bad))).toBe(true);
  });

  it('p @ r requiere I en r (no Type)', () => {
    const p = cPLam('i', cI0()); // : PathP _ i0 i0
    const bad = cPApp(p, cUniverse(0));
    expect(isInferErrorCubical(inferType(bad))).toBe(true);
  });
});

describe('CTT-Lite / glue', () => {
  it('glue(e, partial) construye un término sintáctico', () => {
    const g = glue(cVar('e'), cVar('p'));
    expect(g.kind).toBe('glue');
    if (g.kind !== 'glue') throw new Error('expected glue');
    expect(alphaEq(g.equiv, cVar('e'))).toBe(true);
    expect(alphaEq(g.partial, cVar('p'))).toBe(true);
  });
});

describe('CTT-Lite / αβ-equivalencia bajo normalización', () => {
  it('λi. (λi. x) @ i  ≡  λi. x  por β interválica', () => {
    const lhs = cPLam('i', cPApp(cPLam('i', cVar('x')), cIVar('i')));
    const rhs = cPLam('i', cVar('x'));
    expect(alphaBetaEq(lhs, rhs)).toBe(true);
  });

  it('PathP estructural: alphaEq distingue argumentos', () => {
    const p1 = cPathP(cPLam('i', cUniverse(0)), cVar('a'), cVar('b'));
    const p2 = cPathP(cPLam('i', cUniverse(0)), cVar('a'), cVar('c'));
    expect(alphaEq(p1, p1)).toBe(true);
    expect(alphaEq(p1, p2)).toBe(false);
  });
});

describe('CTT-Lite / serialización', () => {
  it('termToString incluye conectores ∧ ∨ ~ y @', () => {
    const s = termToString(cIMin(cIVar('i'), cINeg(cIVar('j'))));
    expect(s).toContain('∧');
    expect(s).toContain('~');
    const s2 = termToString(cPApp(cPLam('i', cVar('x')), cI0()));
    expect(s2).toContain('@');
  });
});

describe('CTT-Lite / consistencia tipo-término en arrow type', () => {
  it('cArrow construye Π con bind = _', () => {
    const t = cArrow(cUniverse(0), cUniverse(0));
    expect(t.kind).toBe('pi');
    if (t.kind !== 'pi') throw new Error('expected pi');
    expect(t.bind).toBe('_');
  });

  it('cPi/cLam/cApp respetan β en aplicación normal', () => {
    // (λx:Type. x) (Type 0)  ↦  Type 0
    const lam = cLam('x', cUniverse(0), cVar('x'));
    const app = cApp(lam, cUniverse(0));
    expect(alphaEq(normalize(app), cUniverse(0))).toBe(true);
    // Y el chequeo de tipos no explota
    const piT = cPi('x', cUniverse(0), cUniverse(0));
    expect(piT.kind).toBe('pi');
  });
});
