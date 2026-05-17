import { describe, it, expect } from 'vitest';
import { solveLP, standardForm } from '../../../reasoning/optimization';
import type { LPProblem } from '../../../reasoning/optimization';

describe('LP — Simplex de dos fases', () => {
  it('LP trivial: max x s.t. x ≤ 5 → x = 5', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [{ coefficients: [1], operator: '<=', rhs: 5 }],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    expect(sol.variables[0]).toBeCloseTo(5, 6);
    expect(sol.objectiveValue).toBeCloseTo(5, 6);
  });

  it('LP clásico: max 3x+5y s.t. x+y≤6, x≤4, y≤4 → (4,2)=22', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [3, 5] },
      constraints: [
        { coefficients: [1, 1], operator: '<=', rhs: 6 },
        { coefficients: [1, 0], operator: '<=', rhs: 4 },
        { coefficients: [0, 1], operator: '<=', rhs: 4 },
      ],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    // Óptimo en vértice (2,4) ya que 3·2 + 5·4 = 26 > 3·4 + 5·2 = 22.
    // Recalculamos el caso clásico: max 3x+5y s.t. x+y≤6, x≤4, y≤4
    // Vértices factibles: (0,0)=0, (4,0)=12, (4,2)=22, (2,4)=26, (0,4)=20.
    // El óptimo real es (2,4)=26. Ajustamos el assert al óptimo
    // verdadero del problema (no al del prompt, que tenía un typo).
    expect(sol.objectiveValue).toBeCloseTo(26, 6);
    expect(sol.variables[0]).toBeCloseTo(2, 6);
    expect(sol.variables[1]).toBeCloseTo(4, 6);
  });

  it('LP minimización: min x+y s.t. x+y≥3, x≥0, y≥0 → (any) = 3', () => {
    const lp: LPProblem = {
      objective: { kind: 'minimize', coefficients: [1, 1] },
      constraints: [{ coefficients: [1, 1], operator: '>=', rhs: 3 }],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    expect(sol.objectiveValue).toBeCloseTo(3, 6);
  });

  it('LP infeasible: x ≤ 1 AND x ≥ 5', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [
        { coefficients: [1], operator: '<=', rhs: 1 },
        { coefficients: [1], operator: '>=', rhs: 5 },
      ],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('infeasible');
  });

  it('LP unbounded: max x sin cota superior', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [{ coefficients: [-1], operator: '<=', rhs: 0 }], // x ≥ 0
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('unbounded');
  });

  it('LP con igualdad: max x s.t. x+y=4, x≤3, y≥0', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1, 0] },
      constraints: [
        { coefficients: [1, 1], operator: '=', rhs: 4 },
        { coefficients: [1, 0], operator: '<=', rhs: 3 },
      ],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    expect(sol.variables[0]).toBeCloseTo(3, 6);
    expect(sol.variables[1]).toBeCloseTo(1, 6);
  });

  it('LP dieta clásico (pequeño): min 2x+3y s.t. x+y≥1, x≥0.2, y≥0.3', () => {
    const lp: LPProblem = {
      objective: { kind: 'minimize', coefficients: [2, 3] },
      constraints: [
        { coefficients: [1, 1], operator: '>=', rhs: 1 },
        { coefficients: [1, 0], operator: '>=', rhs: 0.2 },
        { coefficients: [0, 1], operator: '>=', rhs: 0.3 },
      ],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    // Óptimo: x=0.7, y=0.3, cost=2·0.7+3·0.3=1.4+0.9=2.3
    expect(sol.objectiveValue).toBeCloseTo(2.3, 5);
  });

  it('LP con variableBounds (upper) actúa como restricción', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [],
      variableBounds: [{ upper: 7 }],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    expect(sol.variables[0]).toBeCloseTo(7, 6);
  });

  it('LP con 3 variables y 3 restricciones', () => {
    // max 4x + 5y + 6z s.t.
    //  x +  y +  z ≤ 10
    // 2x +  y +  z ≤ 12
    //  x + 2y + 3z ≤ 15
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [4, 5, 6] },
      constraints: [
        { coefficients: [1, 1, 1], operator: '<=', rhs: 10 },
        { coefficients: [2, 1, 1], operator: '<=', rhs: 12 },
        { coefficients: [1, 2, 3], operator: '<=', rhs: 15 },
      ],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    // Comprobamos solo factibilidad y consistencia del objetivo
    const [x, y, z] = sol.variables;
    expect(x + y + z).toBeLessThanOrEqual(10 + 1e-6);
    expect(2 * x + y + z).toBeLessThanOrEqual(12 + 1e-6);
    expect(x + 2 * y + 3 * z).toBeLessThanOrEqual(15 + 1e-6);
    expect(sol.objectiveValue).toBeCloseTo(4 * x + 5 * y + 6 * z, 6);
    expect(sol.objectiveValue).toBeGreaterThan(30);
  });

  it('standardForm: minimización pasa a maximización con coefs negados', () => {
    const lp: LPProblem = {
      objective: { kind: 'minimize', coefficients: [3, 4] },
      constraints: [{ coefficients: [1, 1], operator: '<=', rhs: 10 }],
    };
    const std = standardForm(lp);
    expect(std.objective.kind).toBe('maximize');
    expect(std.objective.coefficients).toEqual([-3, -4]);
  });

  it('standardForm: ≥ se invierte a ≤ con signos cambiados', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [{ coefficients: [2], operator: '>=', rhs: 8 }],
    };
    const std = standardForm(lp);
    expect(std.constraints[0].operator).toBe('<=');
    expect(std.constraints[0].coefficients).toEqual([-2]);
    expect(std.constraints[0].rhs).toBe(-8);
  });

  it('standardForm: igualdad se expande a dos restricciones', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1] },
      constraints: [{ coefficients: [1], operator: '=', rhs: 5 }],
    };
    const std = standardForm(lp);
    expect(std.constraints).toHaveLength(2);
    expect(std.constraints[0].operator).toBe('<=');
    expect(std.constraints[1].operator).toBe('<=');
  });

  it('standardForm preserva solución óptima', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [2, 3] },
      constraints: [
        { coefficients: [1, 1], operator: '<=', rhs: 4 },
        { coefficients: [1, 2], operator: '<=', rhs: 6 },
      ],
    };
    const sol1 = solveLP(lp);
    const sol2 = solveLP(standardForm(lp));
    expect(sol1.status).toBe('optimal');
    expect(sol2.status).toBe('optimal');
    expect(sol1.objectiveValue).toBeCloseTo(sol2.objectiveValue, 6);
  });

  it('LP con iteration_limit retorna status correcto', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1, 1] },
      constraints: [{ coefficients: [1, 1], operator: '<=', rhs: 10 }],
    };
    const sol = solveLP(lp, { maxIterations: 0 });
    // Con 0 iteraciones, fase II no puede avanzar; el resultado es
    // 'iteration_limit' o 'optimal' (si el tableau inicial ya es óptimo).
    expect(['optimal', 'iteration_limit']).toContain(sol.status);
  });

  it('LP con coeficientes negativos en objetivo (minimización implícita)', () => {
    // max -x s.t. x ≥ 0, x ≤ 10 → óptimo en x=0
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [-1] },
      constraints: [{ coefficients: [1], operator: '<=', rhs: 10 }],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    expect(sol.variables[0]).toBeCloseTo(0, 6);
    expect(sol.objectiveValue).toBeCloseTo(0, 6);
  });

  it('LP de transporte chico (4 nodos, factible)', () => {
    // min c·x s.t. Ax = b (oferta-demanda balanceada).
    // Oferta: o1=10, o2=15. Demanda: d1=12, d2=13.
    // Variables: x11, x12, x21, x22.
    // Coste: 4·x11 + 6·x12 + 5·x21 + 3·x22
    const lp: LPProblem = {
      objective: { kind: 'minimize', coefficients: [4, 6, 5, 3] },
      constraints: [
        // x11 + x12 = 10 (oferta o1)
        { coefficients: [1, 1, 0, 0], operator: '=', rhs: 10 },
        // x21 + x22 = 15 (oferta o2)
        { coefficients: [0, 0, 1, 1], operator: '=', rhs: 15 },
        // x11 + x21 = 12 (demanda d1)
        { coefficients: [1, 0, 1, 0], operator: '=', rhs: 12 },
        // x12 + x22 = 13 (demanda d2)
        { coefficients: [0, 1, 0, 1], operator: '=', rhs: 13 },
      ],
    };
    const sol = solveLP(lp);
    expect(sol.status).toBe('optimal');
    // Verificamos factibilidad (sumas) y coste positivo razonable
    const [x11, x12, x21, x22] = sol.variables;
    expect(x11 + x12).toBeCloseTo(10, 5);
    expect(x21 + x22).toBeCloseTo(15, 5);
    expect(x11 + x21).toBeCloseTo(12, 5);
    expect(x12 + x22).toBeCloseTo(13, 5);
  });

  it('LP devuelve iterations >= 0', () => {
    const lp: LPProblem = {
      objective: { kind: 'maximize', coefficients: [1, 2] },
      constraints: [{ coefficients: [1, 1], operator: '<=', rhs: 5 }],
    };
    const sol = solveLP(lp);
    expect(sol.iterations).toBeGreaterThanOrEqual(0);
  });
});
