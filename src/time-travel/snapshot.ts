import { randomUUID } from 'crypto';
import { STSnapshot, STSnapshotState } from './types';

interface CaptureOptions {
  parentId?: string;
  tags?: string[];
  message?: string;
}

export function captureSnapshot(state: STSnapshotState, opts?: CaptureOptions): STSnapshot {
  return {
    id: randomUUID(),
    version: '1.0',
    createdAt: new Date().toISOString(),
    parentId: opts?.parentId,
    state: {
      declarations: state.declarations.map((d) => ({ ...d })),
      activeProfile: state.activeProfile,
      evaluatedFormulas: state.evaluatedFormulas.map((e) => ({ ...e })),
      countermodels: state.countermodels?.map((c) => ({
        formula: c.formula,
        assignments: { ...c.assignments },
      })),
    },
    tags: opts?.tags,
    message: opts?.message,
  };
}
