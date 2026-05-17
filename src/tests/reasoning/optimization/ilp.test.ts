import { describe, it, expect } from 'vitest';
import { solveILP, lpRelaxation } from '../../../reasoning/optimization';
import type { ILPProblem } from '../../../reasoning/optimization';

describe('ILP — Branch-and-bound sobre relajación LP', () => {
  it('ILP trivial: max x s.t. x ≤ 5.7, x entero → x = 5', () => {
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [{ coefficients: [1], operator: '<=', rhs: 5.7 }],
      integerVars: [0],
    };
    const sol = solveILP(ilp);
    expect(sol.status).toBe('optimal');
    expect(sol.variables[0]).toBe(5);
    expect(sol.objectiveValue).toBeCloseTo(5, 6);
  });

  it('ILP knapsack 0-1: 4 items, capacidad 10', () => {
    // valor:  [10, 40, 30, 50], peso: [5, 4, 6, 3]
    // capacidad 10. Óptimo conocido: item 2 (peso 4, valor 40) +
    // item 4 (peso 3, valor 50) + item 1 (peso 5? no, supera). Probemos:
    //  {2,4}: peso=7, valor=90.   {1,2,4}: 5+4+3=12>10 no.
    //  {2,3}: 4+6=10, valor=70.   {2,4,3}: 4+3+6=13 no.
    //  {4,1}: 3+5=8, valor=60.    Mejor: {2,4} con valor 90.
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [10, 40, 30, 50] },
      constraints: [{ coefficients: [5, 4, 6, 3], operator: '<=', rhs: 10 }],
      integerVars: [0, 1, 2, 3],
      binaryVars: [0, 1, 2, 3],
    };
    const sol = solveILP(ilp);
    expect(sol.status).toBe('optimal');
    expect(sol.objectiveValue).toBeCloseTo(90, 6);
    expect(sol.variables[1]).toBe(1);
    expect(sol.variables[3]).toBe(1);
  });

  it('ILP infeasible: 2x = 1, x entero', () => {
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [{ coefficients: [2], operator: '=', rhs: 1 }],
      integerVars: [0],
    };
    const sol = solveILP(ilp);
    // LP relaxation: x=0.5. ILP: ningún entero satisface 2x=1.
    expect(sol.status).toBe('infeasible');
  });

  it('ILP con relajación ya entera (B&B inmediato)', () => {
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [1, 1] },
      constraints: [
        { coefficients: [1, 0], operator: '<=', rhs: 3 },
        { coefficients: [0, 1], operator: '<=', rhs: 4 },
      ],
      integerVars: [0, 1],
    };
    const sol = solveILP(ilp);
    expect(sol.status).toBe('optimal');
    expect(sol.variables[0]).toBe(3);
    expect(sol.variables[1]).toBe(4);
    expect(sol.objectiveValue).toBeCloseTo(7, 6);
    expect(sol.nodesExplored).toBeGreaterThanOrEqual(1);
  });

  it('ILP: max 5x + 4y s.t. 6x+4y≤24, x+2y≤6, x,y enteros ≥ 0', () => {
    // Caso clásico. Relajación LP: óptimo en (3, 1.5) con val 21.
    // ILP: (3,1)=19, (2,2)=18, (4,0)=20. Óptimo: (4,0)=20.
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [5, 4] },
      constraints: [
        { coefficients: [6, 4], operator: '<=', rhs: 24 },
        { coefficients: [1, 2], operator: '<=', rhs: 6 },
      ],
      integerVars: [0, 1],
    };
    const sol = solveILP(ilp);
    expect(sol.status).toBe('optimal');
    expect(sol.objectiveValue).toBeCloseTo(20, 5);
    expect(sol.variables[0]).toBe(4);
    expect(sol.variables[1]).toBeCloseTo(0, 6);
  });

  it('Assignment problem 3x3 binario', () => {
    // 3 trabajadores, 3 tareas. Coste c[i][j]. Variables x_ij ∈ {0,1}.
    // Minimizar Σ c·x s.t. Σ_j x_ij = 1 ∀i, Σ_i x_ij = 1 ∀j.
    // Matriz coste:
    //   T1 T2 T3
    // W1 9  2  7
    // W2 6  4  3
    // W3 5  8  1
    // Asignación óptima: W1→T2 (2), W2→T1 (6), W3→T3 (1) = 9.
    // Otra: W1→T2, W2→T3, W3→T1 = 2+3+5=10. La primera es mejor.
    const c = [9, 2, 7, 6, 4, 3, 5, 8, 1]; // x11,x12,x13,x21,x22,x23,x31,x32,x33
    const ilp: ILPProblem = {
      objective: { kind: 'minimize', coefficients: c },
      constraints: [
        // sumas por trabajador = 1
        { coefficients: [1, 1, 1, 0, 0, 0, 0, 0, 0], operator: '=', rhs: 1 },
        { coefficients: [0, 0, 0, 1, 1, 1, 0, 0, 0], operator: '=', rhs: 1 },
        { coefficients: [0, 0, 0, 0, 0, 0, 1, 1, 1], operator: '=', rhs: 1 },
        // sumas por tarea = 1
        { coefficients: [1, 0, 0, 1, 0, 0, 1, 0, 0], operator: '=', rhs: 1 },
        { coefficients: [0, 1, 0, 0, 1, 0, 0, 1, 0], operator: '=', rhs: 1 },
        { coefficients: [0, 0, 1, 0, 0, 1, 0, 0, 1], operator: '=', rhs: 1 },
      ],
      integerVars: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      binaryVars: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    };
    const sol = solveILP(ilp, { maxNodes: 5000, timeoutMs: 15000 });
    expect(sol.status).toBe('optimal');
    expect(sol.objectiveValue).toBeCloseTo(9, 5);
  });

  it('ILP binario simple: max x+y s.t. x+y≤1', () => {
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [1, 1] },
      constraints: [{ coefficients: [1, 1], operator: '<=', rhs: 1 }],
      integerVars: [0, 1],
      binaryVars: [0, 1],
    };
    const sol = solveILP(ilp);
    expect(sol.status).toBe('optimal');
    expect(sol.objectiveValue).toBeCloseTo(1, 6);
    // Solución: una de las dos es 1, la otra 0.
    const [x, y] = sol.variables;
    expect((x === 1 && y === 0) || (x === 0 && y === 1)).toBe(true);
  });

  it('lpRelaxation produce LP válido (sin integerVars)', () => {
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [3, 2] },
      constraints: [{ coefficients: [1, 1], operator: '<=', rhs: 5 }],
      integerVars: [0],
    };
    const lp = lpRelaxation(ilp);
    expect(lp.objective.coefficients).toEqual([3, 2]);
    expect(lp.constraints).toHaveLength(1);
    // No deberían existir integerVars en LPProblem
    expect('integerVars' in lp).toBe(false);
  });

  it('lpRelaxation inyecta cotas [0,1] para binarios', () => {
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [10, 20] },
      constraints: [{ coefficients: [1, 1], operator: '<=', rhs: 1.5 }],
      integerVars: [0, 1],
      binaryVars: [0, 1],
    };
    const lp = lpRelaxation(ilp);
    expect(lp.variableBounds?.[0]?.upper).toBe(1);
    expect(lp.variableBounds?.[1]?.upper).toBe(1);
  });

  it('ILP reporta nodesExplored ≥ 1', () => {
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [{ coefficients: [1], operator: '<=', rhs: 3.5 }],
      integerVars: [0],
    };
    const sol = solveILP(ilp);
    expect(sol.nodesExplored).toBeGreaterThanOrEqual(1);
  });

  it('ILP reporta gap = 0 cuando relajación es entera', () => {
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [{ coefficients: [1], operator: '<=', rhs: 4 }],
      integerVars: [0],
    };
    const sol = solveILP(ilp);
    expect(sol.status).toBe('optimal');
    expect(sol.gap).toBe(0);
  });

  it('ILP set-covering pequeño (3 sets, 4 elementos)', () => {
    // Cubrir {1,2,3,4} con mínimo número de sets.
    // S1={1,2}, S2={2,3}, S3={3,4}. Variables x1,x2,x3 binarias.
    // min x1+x2+x3 s.t.
    //   x1 ≥ 1 (cubre 1)         → x1 = 1
    //   x1+x2 ≥ 1 (cubre 2)
    //   x2+x3 ≥ 1 (cubre 3)
    //   x3 ≥ 1 (cubre 4)         → x3 = 1
    // Óptimo: x1=1, x3=1, x2=0. Valor 2.
    const ilp: ILPProblem = {
      objective: { kind: 'minimize', coefficients: [1, 1, 1] },
      constraints: [
        { coefficients: [1, 0, 0], operator: '>=', rhs: 1 },
        { coefficients: [1, 1, 0], operator: '>=', rhs: 1 },
        { coefficients: [0, 1, 1], operator: '>=', rhs: 1 },
        { coefficients: [0, 0, 1], operator: '>=', rhs: 1 },
      ],
      integerVars: [0, 1, 2],
      binaryVars: [0, 1, 2],
    };
    const sol = solveILP(ilp);
    expect(sol.status).toBe('optimal');
    expect(sol.objectiveValue).toBeCloseTo(2, 5);
    expect(sol.variables[0]).toBe(1);
    expect(sol.variables[2]).toBe(1);
  });

  it('ILP rounding gap explícito: max 4x+3y s.t. 3x+2y≤8, x,y enteros', () => {
    // Relajación: max en (8/3, 0) = 32/3 ≈ 10.67 o (0, 4) = 12. → (0,4)=12 entera.
    // Pero verificamos otras esquinas: óptimo es (0,4)=12.
    const ilp: ILPProblem = {
      objective: { kind: 'maximize', coefficients: [4, 3] },
      constraints: [{ coefficients: [3, 2], operator: '<=', rhs: 8 }],
      integerVars: [0, 1],
    };
    const sol = solveILP(ilp);
    expect(sol.status).toBe('optimal');
    expect(sol.objectiveValue).toBeCloseTo(12, 5);
  });
});
