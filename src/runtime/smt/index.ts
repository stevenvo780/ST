// ============================================================
// ST SMT — Barrel de exportaciones del bridge SMT-LIB v2
// ============================================================

export type {
  SMTBackend,
  SMTLogic,
  SMTModel,
  SMTResult,
  SMTSort,
  ToSMTLIBOptions,
  DetectedSolver,
  DetectionResult,
  ConstDeclaration,
  ScopedAssertion,
  SMTScope,
} from './types';

export { toSMTLIB, inferDeclarations, emitDeclareConst, defaultSortFor } from './serializer';

export { MockSMTBackend } from './mock-backend';

export {
  SubprocessSMTBackend,
  detectAvailableSMT,
  detectAvailableSMTDetailed,
} from './subprocess-backend';
export type { SubprocessBackendOptions } from './subprocess-backend';
