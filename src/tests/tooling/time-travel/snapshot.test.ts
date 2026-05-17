import { describe, it, expect } from 'vitest';
import { captureSnapshot } from '../../../tooling/time-travel/snapshot';
import { STSnapshotState } from '../../../tooling/time-travel/types';

function makeState(overrides?: Partial<STSnapshotState>): STSnapshotState {
  return {
    declarations: [{ kind: 'axiom', name: 'P', formula: 'P → Q' }],
    activeProfile: 'classical',
    evaluatedFormulas: [
      { formula: 'P → Q', profile: 'classical', result: true, ts: new Date().toISOString() },
    ],
    countermodels: [],
    ...overrides,
  };
}

describe('captureSnapshot', () => {
  it('rellena id, createdAt y version', () => {
    const snap = captureSnapshot(makeState());
    expect(snap.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(snap.version).toBe('1.0');
    expect(snap.createdAt).toBeTruthy();
    expect(new Date(snap.createdAt).toISOString()).toBe(snap.createdAt);
  });

  it('preserva el estado proporcionado', () => {
    const state = makeState();
    const snap = captureSnapshot(state);
    expect(snap.state.activeProfile).toBe('classical');
    expect(snap.state.declarations).toHaveLength(1);
    const firstDecl = snap.state.declarations[0];
    expect(firstDecl?.name).toBe('P');
    expect(snap.state.evaluatedFormulas).toHaveLength(1);
  });

  it('acepta opts opcionales: parentId, tags, message', () => {
    const snap = captureSnapshot(makeState(), {
      parentId: 'parent-uuid',
      tags: ['baseline', 'test'],
      message: 'estado inicial',
    });
    expect(snap.parentId).toBe('parent-uuid');
    expect(snap.tags).toEqual(['baseline', 'test']);
    expect(snap.message).toBe('estado inicial');
  });

  it('sin opts opcionales: parentId, tags y message son undefined', () => {
    const snap = captureSnapshot(makeState());
    expect(snap.parentId).toBeUndefined();
    expect(snap.tags).toBeUndefined();
    expect(snap.message).toBeUndefined();
  });

  it('cada llamada genera un id único', () => {
    const state = makeState();
    const ids = new Set(Array.from({ length: 10 }, () => captureSnapshot(state).id));
    expect(ids.size).toBe(10);
  });

  it('el snapshot es una copia profunda: mutar el estado original no afecta el snapshot', () => {
    const state = makeState();
    const snap = captureSnapshot(state);
    const firstDecl = state.declarations[0];
    if (firstDecl) firstDecl.formula = 'MUTADO';
    state.activeProfile = 'modal';
    expect(snap.state.declarations[0]?.formula).toBe('P → Q');
    expect(snap.state.activeProfile).toBe('classical');
  });

  it('countermodels se preservan correctamente', () => {
    const state = makeState({
      countermodels: [{ formula: '¬P', assignments: { P: false } }],
    });
    const snap = captureSnapshot(state);
    expect(snap.state.countermodels).toHaveLength(1);
    const cm = snap.state.countermodels?.[0];
    expect(cm?.formula).toBe('¬P');
    expect(cm?.assignments['P']).toBe(false);
  });
});
