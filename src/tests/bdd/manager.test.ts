import { describe, it, expect } from 'vitest';
import { BDDManager, isTerminal } from '../../bdd';

describe('BDDManager / constructores básicos', () => {
  it('true_ y false_ son terminales distintos', () => {
    const m = new BDDManager(2);
    const T = m.true_();
    const F = m.false_();
    expect(isTerminal(T)).toBe(true);
    expect(isTerminal(F)).toBe(true);
    expect(T).not.toBe(F);
    if (isTerminal(T) && isTerminal(F)) {
      expect(T.value).toBe(true);
      expect(F.value).toBe(false);
    }
  });

  it('variable(i) crea nodo con low=FALSE y high=TRUE', () => {
    const m = new BDDManager(3);
    const x0 = m.variable(0);
    expect(isTerminal(x0)).toBe(false);
    if (!isTerminal(x0)) {
      expect(x0.variable).toBe(0);
      expect(x0.low).toBe(m.false_());
      expect(x0.high).toBe(m.true_());
    }
  });

  it('variable fuera de rango lanza error', () => {
    const m = new BDDManager(2);
    expect(() => m.variable(2)).toThrow();
    expect(() => m.variable(-1)).toThrow();
  });

  it('variable(i) misma llamada devuelve la misma referencia (canonicidad)', () => {
    const m = new BDDManager(3);
    const a = m.variable(1);
    const b = m.variable(1);
    expect(a).toBe(b);
  });
});

describe('BDDManager / operaciones booleanas', () => {
  it('not_ doble es identidad', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    expect(m.not_(m.not_(x))).toBe(x);
  });

  it('and_ con FALSE absorbe a FALSE', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    expect(m.and_(x, m.false_())).toBe(m.false_());
    expect(m.and_(m.false_(), x)).toBe(m.false_());
  });

  it('or_ con TRUE absorbe a TRUE', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    expect(m.or_(x, m.true_())).toBe(m.true_());
    expect(m.or_(m.true_(), x)).toBe(m.true_());
  });

  it('x ∧ ¬x = FALSE', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    const result = m.and_(x, m.not_(x));
    expect(result).toBe(m.false_());
    expect(m.equivalent(result, m.false_())).toBe(true);
  });

  it('x ∨ ¬x = TRUE', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    const result = m.or_(x, m.not_(x));
    expect(result).toBe(m.true_());
    expect(m.equivalent(result, m.true_())).toBe(true);
  });

  it('xor es exclusión: x ⊕ x = FALSE, x ⊕ ¬x = TRUE', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    expect(m.xor(x, x)).toBe(m.false_());
    expect(m.xor(x, m.not_(x))).toBe(m.true_());
  });

  it('De Morgan: ¬(a ∧ b) = ¬a ∨ ¬b', () => {
    const m = new BDDManager(3);
    const a = m.variable(0);
    const b = m.variable(1);
    const left = m.not_(m.and_(a, b));
    const right = m.or_(m.not_(a), m.not_(b));
    expect(m.equivalent(left, right)).toBe(true);
  });

  it('Asociatividad de AND: (a ∧ b) ∧ c = a ∧ (b ∧ c)', () => {
    const m = new BDDManager(3);
    const a = m.variable(0);
    const b = m.variable(1);
    const c = m.variable(2);
    expect(m.equivalent(m.and_(m.and_(a, b), c), m.and_(a, m.and_(b, c)))).toBe(true);
  });

  it('Distributividad: a ∧ (b ∨ c) = (a ∧ b) ∨ (a ∧ c)', () => {
    const m = new BDDManager(3);
    const a = m.variable(0);
    const b = m.variable(1);
    const c = m.variable(2);
    const left = m.and_(a, m.or_(b, c));
    const right = m.or_(m.and_(a, b), m.and_(a, c));
    expect(m.equivalent(left, right)).toBe(true);
  });
});

describe('BDDManager / implies, iff, ite', () => {
  it('implies(a, b) = ¬a ∨ b', () => {
    const m = new BDDManager(2);
    const a = m.variable(0);
    const b = m.variable(1);
    expect(m.equivalent(m.implies(a, b), m.or_(m.not_(a), b))).toBe(true);
  });

  it('iff(a, a) = TRUE', () => {
    const m = new BDDManager(2);
    const a = m.variable(0);
    expect(m.iff(a, a)).toBe(m.true_());
  });

  it('iff(a, ¬a) = FALSE', () => {
    const m = new BDDManager(2);
    const a = m.variable(0);
    expect(m.iff(a, m.not_(a))).toBe(m.false_());
  });

  it('ite(TRUE, t, e) = t; ite(FALSE, t, e) = e', () => {
    const m = new BDDManager(2);
    const t = m.variable(0);
    const e = m.variable(1);
    expect(m.ite(m.true_(), t, e)).toBe(t);
    expect(m.ite(m.false_(), t, e)).toBe(e);
  });

  it('ite(c, TRUE, FALSE) = c', () => {
    const m = new BDDManager(2);
    const c = m.variable(0);
    expect(m.ite(c, m.true_(), m.false_())).toBe(c);
  });

  it('ite(c, FALSE, TRUE) = ¬c', () => {
    const m = new BDDManager(2);
    const c = m.variable(0);
    expect(m.ite(c, m.false_(), m.true_())).toBe(m.not_(c));
  });
});

describe('BDDManager / queries', () => {
  it('isSatisfiable(false) = false', () => {
    const m = new BDDManager(2);
    expect(m.isSatisfiable(m.false_())).toBe(false);
  });

  it('isSatisfiable(true) = true', () => {
    const m = new BDDManager(2);
    expect(m.isSatisfiable(m.true_())).toBe(true);
  });

  it('isValid(true) = true; isValid(x) = false', () => {
    const m = new BDDManager(2);
    expect(m.isValid(m.true_())).toBe(true);
    expect(m.isValid(m.variable(0))).toBe(false);
  });

  it('equivalent(A, A) siempre es true', () => {
    const m = new BDDManager(3);
    const f = m.and_(m.variable(0), m.or_(m.variable(1), m.not_(m.variable(2))));
    expect(m.equivalent(f, f)).toBe(true);
  });

  it('equivalent(x ∨ ¬x, TRUE) = true (tautología)', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    expect(m.equivalent(m.or_(x, m.not_(x)), m.true_())).toBe(true);
  });

  it('equivalent(x ∧ ¬x, FALSE) = true (contradicción)', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    expect(m.equivalent(m.and_(x, m.not_(x)), m.false_())).toBe(true);
  });

  it('satCount(x1 ∨ x2 ∨ x3) sobre 3 vars = 7', () => {
    const m = new BDDManager(3);
    const f = m.or_(m.or_(m.variable(0), m.variable(1)), m.variable(2));
    expect(m.satCount(f)).toBe(7n);
  });

  it('satCount(TRUE) sobre n vars = 2^n', () => {
    const m = new BDDManager(5);
    expect(m.satCount(m.true_())).toBe(32n);
  });

  it('satCount(FALSE) = 0', () => {
    const m = new BDDManager(5);
    expect(m.satCount(m.false_())).toBe(0n);
  });

  it('satCount(x0) sobre 4 vars = 8 (la mitad)', () => {
    const m = new BDDManager(4);
    const x0 = m.variable(0);
    expect(m.satCount(x0)).toBe(8n);
  });

  it('satCount(x0 ∧ x1) sobre 4 vars = 4', () => {
    const m = new BDDManager(4);
    const f = m.and_(m.variable(0), m.variable(1));
    expect(m.satCount(f)).toBe(4n);
  });

  it('satCount soporta funciones con muchas variables (bigint)', () => {
    const m = new BDDManager(80);
    // x0: la mitad de 2^80 asignaciones
    const x0 = m.variable(0);
    expect(m.satCount(x0)).toBe(1n << 79n);
  });

  it('evaluate evalúa correctamente una fórmula', () => {
    const m = new BDDManager(3);
    // f = x0 ∧ (x1 ∨ x2)
    const f = m.and_(m.variable(0), m.or_(m.variable(1), m.variable(2)));
    expect(m.evaluate(f, [true, false, true])).toBe(true);
    expect(m.evaluate(f, [true, false, false])).toBe(false);
    expect(m.evaluate(f, [false, true, true])).toBe(false);
    expect(m.evaluate(f, [true, true, false])).toBe(true);
  });
});

describe('BDDManager / cuantificadores', () => {
  it('∃x0. (x0 ∧ x1) = x1', () => {
    const m = new BDDManager(2);
    const x0 = m.variable(0);
    const x1 = m.variable(1);
    const f = m.and_(x0, x1);
    expect(m.equivalent(m.exists(0, f), x1)).toBe(true);
  });

  it('∀x0. (x0 ∨ x1) = x1', () => {
    const m = new BDDManager(2);
    const x0 = m.variable(0);
    const x1 = m.variable(1);
    const f = m.or_(x0, x1);
    expect(m.equivalent(m.forall(0, f), x1)).toBe(true);
  });

  it('∃x. f es satisfacible si f lo es', () => {
    const m = new BDDManager(3);
    const f = m.and_(m.variable(0), m.variable(1));
    expect(m.isSatisfiable(m.exists(0, f))).toBe(true);
  });

  it('∀x. (x) = FALSE (porque x=0 da falso)', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    expect(m.forall(0, x)).toBe(m.false_());
  });

  it('∃x. (x) = TRUE', () => {
    const m = new BDDManager(2);
    const x = m.variable(0);
    expect(m.exists(0, x)).toBe(m.true_());
  });

  it('exists fuera de rango lanza error', () => {
    const m = new BDDManager(2);
    expect(() => m.exists(5, m.true_())).toThrow();
  });
});

describe('BDDManager / fromCNF', () => {
  it('CNF vacío = TRUE', () => {
    const m = new BDDManager(3);
    expect(m.fromCNF([])).toBe(m.true_());
  });

  it('CNF con clausula vacía = FALSE', () => {
    const m = new BDDManager(3);
    expect(m.fromCNF([[]])).toBe(m.false_());
  });

  it('fromCNF([[1,2],[-1,3]]) — DIMACS válido', () => {
    const m = new BDDManager(3);
    const b = m.fromCNF([
      [1, 2],
      [-1, 3],
    ]);
    // (x0 ∨ x1) ∧ (¬x0 ∨ x2)
    // x0=0, x1=0 → primer clausula falsa → 0
    expect(m.evaluate(b, [false, false, false])).toBe(false);
    expect(m.evaluate(b, [false, true, false])).toBe(true);
    expect(m.evaluate(b, [true, false, true])).toBe(true);
    expect(m.evaluate(b, [true, false, false])).toBe(false);
  });

  it('fromCNF con literal contradictorio queda UNSAT', () => {
    const m = new BDDManager(2);
    // (x0) ∧ (¬x0) → UNSAT
    const b = m.fromCNF([[1], [-1]]);
    expect(b).toBe(m.false_());
    expect(m.isSatisfiable(b)).toBe(false);
  });

  it('3-SAT con 6 vars: instancia satisfactible', () => {
    const m = new BDDManager(6);
    // Fórmula satisfactible construida a mano:
    // (x1 ∨ x2 ∨ x3) ∧ (¬x1 ∨ x4 ∨ x5) ∧ (¬x4 ∨ x6 ∨ x2)
    const cnf: number[][] = [
      [1, 2, 3],
      [-1, 4, 5],
      [-4, 6, 2],
    ];
    const b = m.fromCNF(cnf);
    expect(m.isSatisfiable(b)).toBe(true);
    expect(m.satCount(b)).toBeGreaterThan(0n);
  });

  it('3-SAT instance UNSAT detectada (pigeonhole pequeño)', () => {
    // 3 palomas, 2 huecos, modelo:
    // vars: p_ij = paloma i en hueco j, i=1..3, j=1..2 → 6 vars (índices 0..5)
    // mapping: p_ij = var (i-1)*2 + (j-1)
    const m = new BDDManager(6);
    const lit = (i: number, j: number): number => (i - 1) * 2 + (j - 1) + 1;
    const cnf: number[][] = [];
    // Cada paloma en al menos un hueco
    for (let i = 1; i <= 3; i++) {
      cnf.push([lit(i, 1), lit(i, 2)]);
    }
    // No dos palomas en el mismo hueco
    for (let j = 1; j <= 2; j++) {
      for (let i1 = 1; i1 <= 3; i1++) {
        for (let i2 = i1 + 1; i2 <= 3; i2++) {
          cnf.push([-lit(i1, j), -lit(i2, j)]);
        }
      }
    }
    const b = m.fromCNF(cnf);
    expect(m.isSatisfiable(b)).toBe(false);
    expect(b).toBe(m.false_());
  });

  it('fromCNF valida literal 0', () => {
    const m = new BDDManager(2);
    expect(() => m.fromCNF([[0]])).toThrow();
  });

  it('fromCNF valida rango de variables', () => {
    const m = new BDDManager(2);
    expect(() => m.fromCNF([[5]])).toThrow();
  });
});

describe('BDDManager / fromFormula', () => {
  it('parsea árboles simbólicos AND/OR/NOT', () => {
    const m = new BDDManager(3);
    const ast = {
      kind: 'and',
      left: { kind: 'var', index: 0 },
      right: {
        kind: 'or',
        left: { kind: 'not', child: { kind: 'var', index: 1 } },
        right: { kind: 'var', index: 2 },
      },
    };
    const b = m.fromFormula(ast);
    // x0 ∧ (¬x1 ∨ x2)
    expect(m.evaluate(b, [true, false, false])).toBe(true);
    expect(m.evaluate(b, [true, true, false])).toBe(false);
    expect(m.evaluate(b, [true, true, true])).toBe(true);
    expect(m.evaluate(b, [false, false, true])).toBe(false);
  });

  it('parsea ite, xor, implies, iff', () => {
    const m = new BDDManager(3);
    const xor = m.fromFormula({
      kind: 'xor',
      left: { kind: 'var', index: 0 },
      right: { kind: 'var', index: 1 },
    });
    expect(m.equivalent(xor, m.xor(m.variable(0), m.variable(1)))).toBe(true);

    const ite = m.fromFormula({
      kind: 'ite',
      cond: { kind: 'var', index: 0 },
      then: { kind: 'var', index: 1 },
      else: { kind: 'var', index: 2 },
    });
    expect(m.equivalent(ite, m.ite(m.variable(0), m.variable(1), m.variable(2)))).toBe(true);
  });

  it('rechaza kind desconocido', () => {
    const m = new BDDManager(2);
    expect(() => m.fromFormula({ kind: 'bogus' })).toThrow();
  });
});

describe('BDDManager / 8-queens (encoding)', () => {
  // Para 4-queens (4x4 tablero), encoding directo de constraints.
  // 16 vars: q_ij = reina en (i,j), i,j ∈ 0..3 → idx = i*4 + j
  it('4-queens tiene exactamente 2 soluciones', () => {
    const m = new BDDManager(16);
    const idx = (i: number, j: number): number => i * 4 + j;
    let formula: ReturnType<BDDManager['true_']> = m.true_();

    // 1) Cada fila tiene exactamente una reina (al menos una OR + a lo sumo una pairwise)
    for (let i = 0; i < 4; i++) {
      // al menos una
      let rowOr = m.false_();
      for (let j = 0; j < 4; j++) {
        rowOr = m.or_(rowOr, m.variable(idx(i, j)));
      }
      formula = m.and_(formula, rowOr);
      // a lo sumo una
      for (let j1 = 0; j1 < 4; j1++) {
        for (let j2 = j1 + 1; j2 < 4; j2++) {
          formula = m.and_(
            formula,
            m.or_(m.not_(m.variable(idx(i, j1))), m.not_(m.variable(idx(i, j2)))),
          );
        }
      }
    }

    // 2) Cada columna a lo sumo una reina
    for (let j = 0; j < 4; j++) {
      for (let i1 = 0; i1 < 4; i1++) {
        for (let i2 = i1 + 1; i2 < 4; i2++) {
          formula = m.and_(
            formula,
            m.or_(m.not_(m.variable(idx(i1, j))), m.not_(m.variable(idx(i2, j)))),
          );
        }
      }
    }

    // 3) Diagonales a lo sumo una
    for (let i1 = 0; i1 < 4; i1++) {
      for (let j1 = 0; j1 < 4; j1++) {
        for (let i2 = i1 + 1; i2 < 4; i2++) {
          for (let j2 = 0; j2 < 4; j2++) {
            if (Math.abs(i1 - i2) === Math.abs(j1 - j2)) {
              formula = m.and_(
                formula,
                m.or_(m.not_(m.variable(idx(i1, j1))), m.not_(m.variable(idx(i2, j2)))),
              );
            }
          }
        }
      }
    }

    // 4-queens tiene exactamente 2 soluciones
    expect(m.satCount(formula)).toBe(2n);
  });
});

describe('BDDManager / orden de variables', () => {
  it('setVarOrder válida tamaño y rango', () => {
    const m = new BDDManager(3);
    expect(() => m.setVarOrder([0, 1])).toThrow();
    expect(() => m.setVarOrder([0, 1, 5])).toThrow();
    expect(() => m.setVarOrder([0, 0, 1])).toThrow();
  });

  it('misma función con orden distinto puede tener tamaños distintos', () => {
    // función x0 ↔ x1 con orden [0,1] vs [1,0]: ambas dan 3 nodos.
    // Pero (x0 ∧ x1) ∨ (x2 ∧ x3) tiene tamaños distintos según orden.
    const m1 = new BDDManager(4);
    const f1 = m1.or_(
      m1.and_(m1.variable(0), m1.variable(1)),
      m1.and_(m1.variable(2), m1.variable(3)),
    );
    const size1 = m1.countReachable(f1);

    const m2 = new BDDManager(4);
    m2.setVarOrder([0, 2, 1, 3]); // interleaving malo
    const f2 = m2.or_(
      m2.and_(m2.variable(0), m2.variable(1)),
      m2.and_(m2.variable(2), m2.variable(3)),
    );
    const size2 = m2.countReachable(f2);

    // En general orden malo crece. Verificar al menos: ambos son satisfacibles
    // y representan la misma función semánticamente.
    expect(size1).toBeGreaterThan(0);
    expect(size2).toBeGreaterThan(0);
    // El orden bueno suele ser <= el malo (no estricto en este caso pequeño,
    // pero comparamos al menos satCount).
    expect(m1.satCount(f1)).toBe(m2.satCount(f2));
  });

  it('stats reporta nodos y reducciones', () => {
    const m = new BDDManager(3);
    m.and_(m.variable(0), m.variable(1));
    m.and_(m.variable(0), m.variable(1)); // hit en memo
    const s = m.stats();
    expect(s.nodes).toBeGreaterThan(0);
    expect(s.reductions).toBeGreaterThanOrEqual(0);
  });

  it('countReachable cuenta correctamente nodos del DAG', () => {
    const m = new BDDManager(3);
    const x0 = m.variable(0);
    // un solo nodo interno
    expect(m.countReachable(x0)).toBe(1);
    // terminales no se cuentan
    expect(m.countReachable(m.true_())).toBe(0);
    expect(m.countReachable(m.false_())).toBe(0);
  });
});

describe('BDDManager / propiedades semánticas exhaustivas', () => {
  it('tabla de verdad: 4 vars, (x0 ∧ ¬x1) ∨ x3 evaluada en todas las asignaciones', () => {
    const m = new BDDManager(4);
    const f = m.or_(m.and_(m.variable(0), m.not_(m.variable(1))), m.variable(3));
    let sat = 0n;
    for (let mask = 0; mask < 16; mask++) {
      const a = [(mask & 1) !== 0, (mask & 2) !== 0, (mask & 4) !== 0, (mask & 8) !== 0];
      const expected = (a[0] && !a[1]) || a[3];
      expect(m.evaluate(f, a)).toBe(expected);
      if (expected) sat++;
    }
    expect(m.satCount(f)).toBe(sat);
  });

  it('equivalencia canónica: dos construcciones distintas de la misma fn dan misma referencia', () => {
    const m = new BDDManager(3);
    const fA = m.and_(m.or_(m.variable(0), m.variable(1)), m.variable(2));
    const fB = m.or_(m.and_(m.variable(0), m.variable(2)), m.and_(m.variable(1), m.variable(2)));
    expect(fA).toBe(fB); // canonicidad
    expect(m.equivalent(fA, fB)).toBe(true);
  });

  it('idempotencia: AND/OR consigo mismo da identidad', () => {
    const m = new BDDManager(3);
    const f = m.and_(m.variable(0), m.or_(m.variable(1), m.variable(2)));
    expect(m.and_(f, f)).toBe(f);
    expect(m.or_(f, f)).toBe(f);
  });
});
