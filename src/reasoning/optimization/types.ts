// ============================================================
// Linear / Integer Programming — tipos de borde.
// ============================================================
// Un LPProblem describe el problema en forma "natural": objetivo
// (minimizar o maximizar) + lista de restricciones lineales con
// operador ≤, ≥ o = y RHS escalar. Las cotas por variable son
// opcionales (default: x ≥ 0, sin cota superior).
//
// Las soluciones reportan estado simbólico ('optimal' | 'unbounded'
// | 'infeasible' | 'iteration_limit') más el vector de variables en
// el orden original del problema y el valor objetivo evaluado.
// ============================================================

export type ObjectiveKind = 'minimize' | 'maximize';
export type ConstraintOperator = '<=' | '>=' | '=';

export interface LPConstraint {
  coefficients: number[];
  operator: ConstraintOperator;
  rhs: number;
}

export interface LPProblem {
  objective: {
    kind: ObjectiveKind;
    coefficients: number[];
  };
  constraints: LPConstraint[];
  variableBounds?: Array<{ lower?: number; upper?: number }>;
  variableNames?: string[];
}

export type LPStatus = 'optimal' | 'unbounded' | 'infeasible' | 'iteration_limit';

export interface LPSolution {
  status: LPStatus;
  variables: number[];
  objectiveValue: number;
  iterations: number;
}

export interface ILPProblem extends LPProblem {
  integerVars: number[];
  binaryVars?: number[];
}

export interface ILPSolution extends LPSolution {
  nodesExplored: number;
  gap?: number;
}

export interface LPOptions {
  maxIterations?: number;
  eps?: number;
}

export interface ILPOptions {
  maxNodes?: number;
  timeoutMs?: number;
  lpOptions?: LPOptions;
}
