// ============================================================
// ST SMT — Tipos públicos del bridge a solvers SMT externos
// ============================================================

import type { Formula } from '../../types';

/** Sorts SMT-LIB v2 soportados por el bridge. */
export type SMTSort = 'Bool' | 'Int' | 'Real' | 'BitVec';

/** Lógicas SMT-LIB v2 reconocidas por el serializador. */
export type SMTLogic = 'QF_LRA' | 'QF_LIA' | 'QF_BV' | 'AUFLIA';

/** Resultado de checkSat según SMT-LIB v2. */
export type SMTResult = 'sat' | 'unsat' | 'unknown';

/** Modelo devuelto por getModel: mapa de constante → valor decodificado. */
export type SMTModel = Record<string, string | number | boolean>;

/** Opciones para el serializador SMT-LIB v2. */
export interface ToSMTLIBOptions {
  /** Lógica para emitir `(set-logic ...)`. Default: QF_LRA. */
  logic?: SMTLogic;
  /** Si true emite (set-logic ...) y `(check-sat)`. Default: false (solo formula). */
  full?: boolean;
  /** Tamaño en bits para sort BitVec (default 32). */
  bvWidth?: number;
}

/** Backend SMT — abstracción común para mock e implementaciones reales. */
export interface SMTBackend {
  readonly name: string;
  reset(): void;
  push(): void;
  pop(levels?: number): void;
  declareConst(name: string, sort: SMTSort): void;
  assertFormula(smtlib: string): void;
  checkSat(): SMTResult;
  getModel(): SMTModel | undefined;
  getUnsatCore(): string[];
}

/** Solver externo detectado en el PATH. */
export type DetectedSolver = 'z3' | 'cvc5' | 'none';

/** Resultado interno de una operación de detección. */
export interface DetectionResult {
  solver: DetectedSolver;
  /** Path absoluto si está disponible (resuelto por `which`). */
  binaryPath?: string;
}

/** Declaración de constante registrada en un scope. */
export interface ConstDeclaration {
  name: string;
  sort: SMTSort;
  bvWidth?: number;
}

/** Aserción registrada en un scope. */
export interface ScopedAssertion {
  /** SMT-LIB v2 raw del cuerpo (sin `(assert ...)`). */
  body: string;
  /** Fórmula original si fue inyectada vía toSMTLIB, para razonamiento del mock. */
  formula?: Formula;
}

/** Estado de un nivel del stack push/pop. */
export interface SMTScope {
  decls: ConstDeclaration[];
  assertions: ScopedAssertion[];
}
