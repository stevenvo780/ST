export interface Declaration {
  kind: 'axiom' | 'theorem' | 'define';
  name: string;
  formula: string;
}

export interface EvaluatedFormula {
  formula: string;
  profile: string;
  result: unknown;
  ts: string;
}

export interface Countermodel {
  formula: string;
  assignments: Record<string, boolean | string>;
}

export interface STSnapshotState {
  declarations: Declaration[];
  activeProfile: string;
  evaluatedFormulas: EvaluatedFormula[];
  countermodels?: Countermodel[];
}

export interface STSnapshot {
  id: string;
  version: '1.0';
  createdAt: string;
  parentId?: string;
  state: STSnapshotState;
  tags?: string[];
  message?: string;
}

export interface SnapshotSummary {
  id: string;
  createdAt: string;
  message?: string;
  tags?: string[];
}

export interface SnapshotDiff {
  addedDeclarations: Declaration[];
  removedDeclarations: Declaration[];
  modifiedFormulas: Array<{ formula: string; before: string; after: string }>;
  profileChanged?: { from: string; to: string };
}
