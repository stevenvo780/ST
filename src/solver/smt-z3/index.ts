// ============================================================
// ST SMT-Z3 — Barrel del backend WASM real (z3-solver)
// ============================================================

export { Z3WasmBackend, isZ3Available, detectAvailableSMT } from './z3-wasm-backend';
export type {
  AsyncSMTBackend,
  AvailableSMTRuntime,
  Z3WasmBackendOptions,
  Z3Scope,
  Z3ScopedAssertion,
  Z3ScopedDecl,
} from './types';
