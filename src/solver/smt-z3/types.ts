// ============================================================
// ST SMT-Z3 — Tipos del backend WASM real
// ============================================================

import type { SMTLogic, SMTModel, SMTResult, SMTSort } from '../smt/types';

/**
 * AsyncSMTBackend es la versión async del SMTBackend de `../smt/types`.
 *
 * Z3 corre como WASM via Emscripten y su `check()` es inherentemente async
 * (event loop interno + workers). Por eso no podemos implementar el
 * `SMTBackend` síncrono del bridge histórico — exponemos en su lugar
 * `Promise<SMTResult>` para `checkSat()`.
 */
export interface AsyncSMTBackend {
  readonly name: string;
  reset(): void;
  push(): void;
  pop(levels?: number): void;
  declareConst(name: string, sort: SMTSort, bvWidth?: number): void;
  assertFormula(smtlib: string): void;
  checkSat(): Promise<SMTResult>;
  getModel(): SMTModel | undefined;
  getUnsatCore(): string[];
}

/** Solver detectado disponible para uso real (no mock). */
export type AvailableSMTRuntime = 'z3-wasm' | 'z3-subprocess' | 'cvc5-subprocess' | 'none';

/** Opciones de creación del backend Z3 WASM. */
export interface Z3WasmBackendOptions {
  /** Lógica SMT-LIB a aplicar con `(set-logic ...)`. Default: omitida. */
  logic?: SMTLogic;
  /** Timeout por checkSat en ms (Z3 param `timeout`). Default: omitida. */
  timeoutMs?: number;
  /** Si true, activa `unsat_core` en el solver. Default: true. */
  produceUnsatCore?: boolean;
  /** Si true, activa `produce-models` en el solver. Default: true. */
  produceModels?: boolean;
}

/** Una aserción registrada para reproducir scopes al rehidratar. */
export interface Z3ScopedAssertion {
  /** Cuerpo SMT-LIB sin envolver en `(assert ...)`. */
  body: string;
  /** Nombre del literal asumido si la aserción participa de unsat-core. */
  trackName?: string;
}

/** Declaración registrada por nivel del stack. */
export interface Z3ScopedDecl {
  name: string;
  sort: SMTSort;
  bvWidth?: number;
}

/** Un nivel del stack push/pop reflejado en el host. */
export interface Z3Scope {
  decls: Z3ScopedDecl[];
  assertions: Z3ScopedAssertion[];
}
