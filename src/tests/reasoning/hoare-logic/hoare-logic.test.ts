// ============================================================
// ST Hoare Logic — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  and,
  assign,
  binop,
  bool,
  eq,
  evalExpr,
  execStmt,
  factorial,
  freeVars,
  gcd,
  generateVCs,
  ifS,
  le,
  not,
  num,
  or,
  programFactorial,
  programGCD,
  programLinearSearch,
  programSwap,
  seq,
  skip,
  spExtension,
  substitute,
  v,
  verifyTriple,
  whileS,
  wp,
  type HoareTriple,
  type State,
} from '../../../reasoning/hoare-logic';

describe('hoare-logic — sustitución sintáctica', () => {
  it('substitute reemplaza la variable libre objetivo', () => {
    // (x + 1)[5/x] = 5 + 1
    const expr = binop('+', v('x'), num(1));
    const result = substitute(expr, 'x', num(5));
    expect(result).toEqual(binop('+', num(5), num(1)));
  });

  it('substitute no toca constantes ni variables distintas', () => {
    const expr = binop('+', v('y'), num(7));
    const result = substitute(expr, 'x', num(99));
    expect(result).toEqual(expr);
  });

  it('substitute recorre operadores unarios y anidados', () => {
    // expr: ¬(x < x*2). Sustituyendo x=3 → ¬(3 < 6) = ¬true = false.
    const expr = not(binop('<', v('x'), binop('*', v('x'), num(2))));
    const result = substitute(expr, 'x', num(3));
    expect(evalExpr(result, {})).toBe(false);
    // Y con x=-1: -1 < -2 es false → ¬false = true.
    expect(evalExpr(expr, { x: -1 })).toBe(true);
  });
});

describe('hoare-logic — wp para statements básicos', () => {
  it('wp(skip, Q) = Q', () => {
    const post = eq(v('x'), num(5));
    expect(wp(skip(), post)).toEqual(post);
  });

  it('wp(x := 5, x == 5) = (5 == 5)', () => {
    const post = eq(v('x'), num(5));
    const result = wp(assign('x', num(5)), post);
    // post[5/x] = (5 == 5)
    expect(result).toEqual(eq(num(5), num(5)));
    // Y semánticamente: 5 == 5 es true
    expect(evalExpr(result, {})).toBe(true);
  });

  it('wp(x := y + 1, x > 0) = (y + 1 > 0)', () => {
    const post = binop('>', v('x'), num(0));
    const result = wp(assign('x', binop('+', v('y'), num(1))), post);
    expect(result).toEqual(binop('>', binop('+', v('y'), num(1)), num(0)));
    expect(evalExpr(result, { y: 5 })).toBe(true);
    expect(evalExpr(result, { y: -5 })).toBe(false);
  });

  it('wp seq decompone derecha → izquierda', () => {
    // {x := 1; y := x + 1} {y == 2}
    // wp(y := x+1, y == 2) = (x+1 == 2)
    // wp(x := 1, x+1 == 2) = (1+1 == 2) → true
    const stmt = seq(assign('x', num(1)), assign('y', binop('+', v('x'), num(1))));
    const post = eq(v('y'), num(2));
    const result = wp(stmt, post);
    expect(evalExpr(result, {})).toBe(true);
  });

  it('wp(if B then c1 else c2) combina ambas ramas', () => {
    // if x > 0 then y := 1 else y := -1
    // post: y > -2 (siempre cierto)
    const stmt = ifS(binop('>', v('x'), num(0)), assign('y', num(1)), assign('y', num(-1)));
    const post = binop('>', v('y'), num(-2));
    const result = wp(stmt, post);
    // Vale para cualquier estado.
    for (const xVal of [-5, -1, 0, 1, 5]) {
      expect(evalExpr(result, { x: xVal })).toBe(true);
    }
  });

  it('wp(while sin invariant) = false', () => {
    const stmt = whileS(binop('<', v('x'), num(10)), assign('x', binop('+', v('x'), num(1))));
    expect(wp(stmt, bool(true))).toEqual(bool(false));
  });

  it('wp(while con invariant) = invariant', () => {
    const I = le(v('x'), num(10));
    const stmt = whileS(binop('<', v('x'), num(10)), assign('x', binop('+', v('x'), num(1))), I);
    expect(wp(stmt, bool(true))).toEqual(I);
  });
});

describe('hoare-logic — strongest postcondition (sp)', () => {
  it('sp(skip, P) = P', () => {
    const pre = eq(v('x'), num(0));
    expect(spExtension(skip(), pre)).toEqual(pre);
  });

  it('sp(x := 5, true) implica x == 5', () => {
    const stmt = assign('x', num(5));
    const result = spExtension(stmt, bool(true));
    // Debería implicar x == 5 al menos para muestreo concreto.
    const state: State = { x: 5 };
    expect(evalExpr(result, state)).toBe(true);
  });
});

describe('hoare-logic — execStmt concreto', () => {
  it('ejecuta swap correctamente', () => {
    const swap = programSwap();
    const initial: State = { x: 7, y: 13 };
    const final = execStmt(swap, initial);
    expect('error' in final).toBe(false);
    if (!('error' in final)) {
      expect(final.x).toBe(13);
      expect(final.y).toBe(7);
    }
  });

  it('ejecuta factorial concretamente para n pequeños', () => {
    const fact = programFactorial();
    for (const n of [0, 1, 2, 3, 5, 6]) {
      const final = execStmt(fact, { n });
      expect('error' in final).toBe(false);
      if (!('error' in final)) {
        expect(final.r).toBe(factorial(n));
      }
    }
  });

  it('ejecuta GCD por restas correctamente', () => {
    const gcdProg = programGCD();
    const cases: Array<[number, number, number]> = [
      [12, 18, 6],
      [21, 14, 7],
      [9, 9, 9],
      [100, 75, 25],
      [13, 7, 1],
    ];
    for (const [x, y, expected] of cases) {
      const final = execStmt(gcdProg, { x, y });
      expect('error' in final).toBe(false);
      if (!('error' in final)) {
        expect(final.x).toBe(expected);
        expect(final.y).toBe(expected);
        expect(final.x).toBe(gcd(x, y));
      }
    }
  });

  it('respeta el límite de pasos en loops divergentes', () => {
    // while true do skip
    const infinite = whileS(num(1), skip());
    const final = execStmt(infinite, {}, 50);
    expect('error' in final).toBe(true);
  });

  it('if elige rama correcta según condición', () => {
    const stmt = ifS(binop('>', v('x'), num(0)), assign('y', num(1)), assign('y', num(-1)));
    const a = execStmt(stmt, { x: 5 });
    const b = execStmt(stmt, { x: -3 });
    expect(!('error' in a) && a.y === 1).toBe(true);
    expect(!('error' in b) && b.y === -1).toBe(true);
  });
});

describe('hoare-logic — verifyTriple', () => {
  it('verifica {x = 5} skip {x = 5}', () => {
    const triple: HoareTriple = {
      pre: eq(v('x'), num(5)),
      stmt: skip(),
      post: eq(v('x'), num(5)),
    };
    const result = verifyTriple(triple, { samples: 50 });
    expect(result.valid).toBe(true);
  });

  it('verifica {true} x := 5 {x = 5}', () => {
    const triple: HoareTriple = {
      pre: bool(true),
      stmt: assign('x', num(5)),
      post: eq(v('x'), num(5)),
    };
    const result = verifyTriple(triple, { samples: 50 });
    expect(result.valid).toBe(true);
  });

  it('verifica {x = a ∧ y = b} swap {x = b ∧ y = a}', () => {
    // El swap usa la variable temporal `t`, por lo que la pre y post
    // se expresan sobre x e y; introducimos a y b como variables
    // matemáticas (ghost vars) que se preservan.
    const triple: HoareTriple = {
      pre: and(eq(v('x'), v('a')), eq(v('y'), v('b'))),
      stmt: programSwap(),
      post: and(eq(v('x'), v('b')), eq(v('y'), v('a'))),
    };
    const result = verifyTriple(triple, { samples: 100, range: [-3, 3] });
    expect(result.valid).toBe(true);
  });

  it('detecta contraejemplo en tripleta incorrecta', () => {
    // {x = 0} x := x + 1 {x = 0}  → falso
    const triple: HoareTriple = {
      pre: eq(v('x'), num(0)),
      stmt: assign('x', binop('+', v('x'), num(1))),
      post: eq(v('x'), num(0)),
    };
    const result = verifyTriple(triple, { samples: 30, seed: 42 });
    expect(result.valid).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });

  it('rechaza while sin invariant', () => {
    const triple: HoareTriple = {
      pre: bool(true),
      stmt: whileS(binop('<', v('x'), num(10)), assign('x', binop('+', v('x'), num(1)))),
      post: bool(true),
    };
    const result = verifyTriple(triple, { samples: 10 });
    expect(result.valid).toBe(false);
  });

  it('verifica {n ≥ 0} factorial(n) {r = n!} para n pequeños via execStmt', () => {
    // Verificación semántica concreta (complementa los VCs sintácticos).
    const fact = programFactorial();
    for (const n of [0, 1, 2, 4, 6]) {
      const final = execStmt(fact, { n });
      expect('error' in final).toBe(false);
      if (!('error' in final)) {
        expect(final.r).toBe(factorial(n));
      }
    }
  });

  it('verifica invariant válido del while incrementor', () => {
    // {x ≤ 5} while x < 5 do x := x + 1 {x = 5}
    // invariant: x ≤ 5
    const triple: HoareTriple = {
      pre: le(v('x'), num(5)),
      stmt: whileS(
        binop('<', v('x'), num(5)),
        assign('x', binop('+', v('x'), num(1))),
        le(v('x'), num(5)),
      ),
      post: eq(v('x'), num(5)),
    };
    const result = verifyTriple(triple, { samples: 100, range: [0, 5], seed: 7 });
    expect(result.valid).toBe(true);
  });
});

describe('hoare-logic — generación de VCs', () => {
  it('generateVCs incluye 1 VC global para asignación simple', () => {
    const triple: HoareTriple = {
      pre: bool(true),
      stmt: assign('x', num(5)),
      post: eq(v('x'), num(5)),
    };
    const vcs = generateVCs(triple);
    expect(vcs.length).toBe(1);
  });

  it('generateVCs añade 2 VCs por cada while (mantenimiento + salida)', () => {
    const triple: HoareTriple = {
      pre: bool(true),
      stmt: whileS(binop('<', v('x'), num(5)), assign('x', binop('+', v('x'), num(1))), bool(true)),
      post: bool(true),
    };
    const vcs = generateVCs(triple);
    // VC global + mantenimiento + salida = 3
    expect(vcs.length).toBe(3);
  });

  it('un while sin invariant produce VC bool(false)', () => {
    const triple: HoareTriple = {
      pre: bool(true),
      stmt: whileS(binop('<', v('x'), num(5)), assign('x', binop('+', v('x'), num(1)))),
      post: bool(true),
    };
    const vcs = generateVCs(triple);
    // Al menos uno es bool(false).
    expect(vcs.some((v) => v.kind === 'bool' && v.value === false)).toBe(true);
  });
});

describe('hoare-logic — variables libres y stmtVars', () => {
  it('freeVars colecta variables de una expresión', () => {
    const expr = and(eq(v('x'), v('a')), eq(v('y'), v('b')));
    const vars = freeVars(expr);
    expect(vars.has('x')).toBe(true);
    expect(vars.has('a')).toBe(true);
    expect(vars.has('y')).toBe(true);
    expect(vars.has('b')).toBe(true);
    expect(vars.size).toBe(4);
  });
});

describe('hoare-logic — linear search programa', () => {
  it('linear search ejecuta sin error y respeta el invariant i ≤ n', () => {
    const prog = programLinearSearch();
    const final = execStmt(prog, { a: 3, target: 3, n: 5 });
    expect('error' in final).toBe(false);
    if (!('error' in final)) {
      // a == target ⇒ found = 1 desde la primera iteración.
      expect(final.found).toBe(1);
      expect(final.i).toBeLessThanOrEqual(5);
    }
  });

  it('linear search sale sin encontrar cuando a != target', () => {
    const prog = programLinearSearch();
    const final = execStmt(prog, { a: 1, target: 99, n: 3 });
    expect('error' in final).toBe(false);
    if (!('error' in final)) {
      expect(final.found).toBe(0);
      expect(final.i).toBe(3);
    }
  });
});

describe('hoare-logic — evaluación de expresiones primitivas', () => {
  it('evalExpr maneja operadores aritméticos', () => {
    expect(evalExpr(binop('+', num(2), num(3)), {})).toBe(5);
    expect(evalExpr(binop('-', num(10), num(4)), {})).toBe(6);
    expect(evalExpr(binop('*', num(3), num(4)), {})).toBe(12);
    expect(evalExpr(binop('/', num(20), num(4)), {})).toBe(5);
    expect(evalExpr(binop('/', num(1), num(0)), {})).toBe(0); // div por cero → 0
    expect(evalExpr(binop('%', num(10), num(3)), {})).toBe(1);
  });

  it('evalExpr maneja relacionales', () => {
    expect(evalExpr(binop('<', num(1), num(2)), {})).toBe(true);
    expect(evalExpr(binop('<=', num(2), num(2)), {})).toBe(true);
    expect(evalExpr(binop('>=', num(2), num(2)), {})).toBe(true);
    expect(evalExpr(binop('!=', num(1), num(2)), {})).toBe(true);
    expect(evalExpr(binop('==', num(1), num(2)), {})).toBe(false);
  });

  it('evalExpr maneja booleanos y not', () => {
    expect(evalExpr(and(bool(true), bool(false)), {})).toBe(false);
    expect(evalExpr(or(bool(true), bool(false)), {})).toBe(true);
    expect(evalExpr(not(bool(false)), {})).toBe(true);
  });

  it('evalExpr trata variables no definidas como 0', () => {
    expect(evalExpr(v('zzz'), {})).toBe(0);
    expect(evalExpr(binop('+', v('a'), num(5)), {})).toBe(5);
  });
});

describe('hoare-logic — invariants documentados', () => {
  it('GCD: gcd(x, y) se mantiene tras una iteración del body', () => {
    // Verifico el invariant SEMÁNTICAMENTE (no via VC sintáctica)
    // ejecutando una iteración del body sobre estados varios.
    for (let x = 2; x <= 8; x++) {
      for (let y = 2; y <= 8; y++) {
        if (x === y) continue;
        const before = gcd(x, y);
        const body = ifS(
          binop('>', v('x'), v('y')),
          assign('x', binop('-', v('x'), v('y'))),
          assign('y', binop('-', v('y'), v('x'))),
        );
        const final = execStmt(body, { x, y });
        expect('error' in final).toBe(false);
        if (!('error' in final)) {
          const after = gcd(final.x ?? 0, final.y ?? 0);
          expect(after).toBe(before);
        }
      }
    }
  });

  it('Factorial invariant r·(k! relativo a n) mantiene r = k! tras body', () => {
    // Tras j-ésima iteración debe valer r = j! (j = k al fin del body).
    for (let n = 1; n <= 6; n++) {
      const final = execStmt(programFactorial(), { n });
      expect('error' in final).toBe(false);
      if (!('error' in final)) {
        expect(final.r).toBe(factorial(n));
        expect(final.k).toBe(n);
      }
    }
  });
});
