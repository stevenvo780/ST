// ============================================================
// ST Provenance — Public API
//
// DAG auditado de teoremas/lemas/axiomas: cada nodo declara sus
// dependencias y metadata (autor, herramienta, timestamp, perfil).
// El ledger ofrece queries del cierre transitivo, detección de
// ciclos, estadísticas y serialización determinística.
// ============================================================

export type {
  AuditReport,
  ProvenanceKind,
  ProvenanceMetadata,
  ProvenanceNode,
  TrustLevel,
} from './types';

export { ProvenanceLedger, auditTheorem, provenanceToCertificate } from './ledger';
