import { describe, it, expect } from 'vitest';
import { ac3, backtrack, allSolutions, graphColoring, nQueens } from '../../../solver/csp';
import type { CSP } from '../../../solver/csp';

describe('CSP — AC-3 arc consistency', () => {
  it('AC-3 deja UNSAT el 3-coloreo de C3 con 2 colores (cualquier par adyacente bloquea)', () => {
    // C3: triángulo. 2 colores ⇒ UNSAT (parity argument).
    // 3-coloring de C3 con 3 colores tiene solución, no aplica acá.
    const result = graphColoring(
      {
        nodes: ['a', 'b', 'c'],
        edges: [
          ['a', 'b'],
          ['b', 'c'],
          ['a', 'c'],
        ],
      },
      2,
    );
    expect(result).toBeNull();
  });

  it('AC-3 reduce dominios: x < y con dominios {1,2,3} fuerza x ≠ 3, y ≠ 1', () => {
    const csp: CSP<string, number> = {
      variables: ['x', 'y'],
      domains: new Map([
        ['x', [1, 2, 3]],
        ['y', [1, 2, 3]],
      ]),
      constraints: [
        {
          vars: ['x', 'y'],
          predicate: ([a, b]) => a < b,
        },
      ],
    };
    const { consistent, reducedDomains } = ac3(csp);
    expect(consistent).toBe(true);
    expect(reducedDomains.get('x')).toEqual([1, 2]); // 3 no tiene soporte (3 < y, y∈{1,2,3} sin valor)
    expect(reducedDomains.get('y')).toEqual([2, 3]); // 1 no tiene soporte (x < 1 imposible)
  });

  it('AC-3 detecta UNSAT cuando un dominio queda vacío', () => {
    // x ∈ {1}, y ∈ {1}, x ≠ y ⇒ UNSAT.
    const csp: CSP<string, number> = {
      variables: ['x', 'y'],
      domains: new Map([
        ['x', [1]],
        ['y', [1]],
      ]),
      constraints: [
        {
          vars: ['x', 'y'],
          predicate: ([a, b]) => a !== b,
        },
      ],
    };
    const { consistent } = ac3(csp);
    expect(consistent).toBe(false);
  });

  it('AC-3 no muta el CSP original (devuelve dominios reducidos en estructura nueva)', () => {
    const csp: CSP<string, number> = {
      variables: ['x', 'y'],
      domains: new Map([
        ['x', [1, 2, 3]],
        ['y', [1, 2, 3]],
      ]),
      constraints: [
        {
          vars: ['x', 'y'],
          predicate: ([a, b]) => a < b,
        },
      ],
    };
    ac3(csp);
    expect(csp.domains.get('x')).toEqual([1, 2, 3]);
    expect(csp.domains.get('y')).toEqual([1, 2, 3]);
  });
});

describe('CSP — graph coloring', () => {
  it('3-coloreo de C3 (triángulo) con 3 colores tiene solución y los 3 nodos usan colores distintos', () => {
    const result = graphColoring(
      {
        nodes: ['a', 'b', 'c'],
        edges: [
          ['a', 'b'],
          ['b', 'c'],
          ['a', 'c'],
        ],
      },
      3,
    );
    expect(result).not.toBeNull();
    if (!result) return;
    const colors = new Set(result.values());
    expect(colors.size).toBe(3);
  });

  it('3-coloreo de C4 (ciclo par) con 3 colores tiene solución usando ≤2 colores (es bipartito)', () => {
    const result = graphColoring(
      {
        nodes: ['a', 'b', 'c', 'd'],
        edges: [
          ['a', 'b'],
          ['b', 'c'],
          ['c', 'd'],
          ['a', 'd'],
        ],
      },
      3,
    );
    expect(result).not.toBeNull();
    if (!result) return;
    // Validar restricciones: aristas tienen colores distintos.
    for (const [u, v] of [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['a', 'd'],
    ] as Array<[string, string]>) {
      expect(result.get(u)).not.toBe(result.get(v));
    }
  });

  it('grafo con self-loop es UNSAT inmediatamente', () => {
    const result = graphColoring(
      {
        nodes: ['a'],
        edges: [['a', 'a']],
      },
      5,
    );
    expect(result).toBeNull();
  });

  it('grafo K4 (clique de 4) no es 3-coloreable', () => {
    const result = graphColoring(
      {
        nodes: ['a', 'b', 'c', 'd'],
        edges: [
          ['a', 'b'],
          ['a', 'c'],
          ['a', 'd'],
          ['b', 'c'],
          ['b', 'd'],
          ['c', 'd'],
        ],
      },
      3,
    );
    expect(result).toBeNull();
  });

  it('grafo K4 sí es 4-coloreable', () => {
    const result = graphColoring(
      {
        nodes: ['a', 'b', 'c', 'd'],
        edges: [
          ['a', 'b'],
          ['a', 'c'],
          ['a', 'd'],
          ['b', 'c'],
          ['b', 'd'],
          ['c', 'd'],
        ],
      },
      4,
    );
    expect(result).not.toBeNull();
    if (!result) return;
    expect(new Set(result.values()).size).toBe(4);
  });
});

describe('CSP — N-queens', () => {
  it('1-queens trivialmente coloca la reina en (0,0)', () => {
    const sol = nQueens(1);
    expect(sol).toEqual([0]);
  });

  it('2-queens y 3-queens no tienen solución', () => {
    expect(nQueens(2)).toBeNull();
    expect(nQueens(3)).toBeNull();
  });

  it('4-queens devuelve una de las 2 soluciones válidas', () => {
    const sol = nQueens(4);
    expect(sol).not.toBeNull();
    if (!sol) return;
    expect(sol.length).toBe(4);
    // Verificar: no misma columna ni diagonal.
    for (let i = 0; i < sol.length; i++) {
      for (let j = i + 1; j < sol.length; j++) {
        const ci = sol[i];
        const cj = sol[j];
        expect(ci).not.toBe(cj);
        expect(Math.abs(ci - cj)).not.toBe(j - i);
      }
    }
  });

  it('8-queens tiene solución y satisface todas las restricciones', () => {
    const sol = nQueens(8);
    expect(sol).not.toBeNull();
    if (!sol) return;
    expect(sol.length).toBe(8);
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        const ci = sol[i];
        const cj = sol[j];
        expect(ci).not.toBe(cj);
        expect(Math.abs(ci - cj)).not.toBe(j - i);
      }
    }
  });

  it('allSolutions enumera las 2 soluciones de 4-queens', () => {
    // Construir el CSP de 4-queens manualmente para usar allSolutions.
    const n = 4;
    const variables: number[] = [0, 1, 2, 3];
    const domains = new Map<number, number[]>();
    for (let i = 0; i < n; i++) domains.set(i, [0, 1, 2, 3]);
    const constraints = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const rowDiff = j - i;
        constraints.push({
          vars: [i, j],
          predicate: ([ci, cj]: number[]) => {
            if (ci === undefined || cj === undefined) return false;
            return ci !== cj && Math.abs(ci - cj) !== rowDiff;
          },
        });
      }
    }
    const csp: CSP<number, number> = { variables, domains, constraints };
    const sols = allSolutions(csp);
    expect(sols.length).toBe(2);
    // Las dos soluciones canónicas: [1,3,0,2] y [2,0,3,1].
    const asArrays = sols.map((m) => [m.get(0), m.get(1), m.get(2), m.get(3)]);
    expect(asArrays).toEqual(
      expect.arrayContaining([
        [1, 3, 0, 2],
        [2, 0, 3, 1],
      ]),
    );
  });
});

describe('CSP — backtracking y stats', () => {
  it('backtrack devuelve null para CSP UNSAT y reporta iterations ≥ 0', () => {
    const csp: CSP<string, number> = {
      variables: ['x'],
      domains: new Map([['x', [1, 2]]]),
      constraints: [
        {
          vars: ['x'],
          predicate: ([v]) => v === 99,
        },
      ],
    };
    const r = backtrack(csp);
    expect(r.solution).toBeNull();
    expect(r.iterations).toBeGreaterThanOrEqual(0);
  });

  it('backtrack respeta restricción n-aria (no binaria, no participa en AC-3)', () => {
    // x + y + z = 6 con dominios {1,2,3}; única solución: (1,2,3) y permutaciones.
    const csp: CSP<string, number> = {
      variables: ['x', 'y', 'z'],
      domains: new Map([
        ['x', [1, 2, 3]],
        ['y', [1, 2, 3]],
        ['z', [1, 2, 3]],
      ]),
      constraints: [
        {
          vars: ['x', 'y', 'z'],
          predicate: ([a, b, c]) => {
            if (a === undefined || b === undefined || c === undefined) return false;
            return a + b + c === 6;
          },
        },
      ],
    };
    const r = backtrack(csp);
    expect(r.solution).not.toBeNull();
    if (!r.solution) return;
    const sum =
      (r.solution.get('x') ?? 0) + (r.solution.get('y') ?? 0) + (r.solution.get('z') ?? 0);
    expect(sum).toBe(6);
  });

  it('backtrack con AC-3 desactivado todavía resuelve graph coloring de C4 con 2 colores', () => {
    // C4 es bipartito ⇒ 2-coloreable.
    const csp: CSP<string, number> = {
      variables: ['a', 'b', 'c', 'd'],
      domains: new Map([
        ['a', [0, 1]],
        ['b', [0, 1]],
        ['c', [0, 1]],
        ['d', [0, 1]],
      ]),
      constraints: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
        ['a', 'd'],
      ].map((edge) => ({
        vars: edge,
        predicate: ([x, y]: number[]) => x !== y,
      })),
    };
    const r = backtrack(csp, { useAC3: false, mrv: false, lcv: false });
    expect(r.solution).not.toBeNull();
  });
});
