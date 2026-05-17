import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fsp } from 'fs';
import path from 'path';
import os from 'os';
import { SnapshotStore } from '../../../tooling/time-travel/store';
import { captureSnapshot } from '../../../tooling/time-travel/snapshot';
import { STSnapshotState } from '../../../tooling/time-travel/types';

function makeState(profile = 'classical'): STSnapshotState {
  return {
    declarations: [{ kind: 'axiom', name: 'A', formula: 'A → B' }],
    activeProfile: profile,
    evaluatedFormulas: [{ formula: 'A → B', profile, result: true, ts: new Date().toISOString() }],
    countermodels: [],
  };
}

describe('SnapshotStore — save/load roundtrip', () => {
  let tmpDir: string;
  let store: SnapshotStore;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'st-snapshots-test-'));
    store = new SnapshotStore({ rootDir: tmpDir });
  });

  afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  it('save → load preserva el snapshot completo', async () => {
    const snap = captureSnapshot(makeState(), { message: 'test message', tags: ['v1'] });
    await store.save(snap);
    const loaded = await store.load(snap.id);
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(snap.id);
    expect(loaded?.version).toBe('1.0');
    expect(loaded?.message).toBe('test message');
    expect(loaded?.tags).toEqual(['v1']);
    expect(loaded?.state.activeProfile).toBe('classical');
    expect(loaded?.state.declarations[0]?.formula).toBe('A → B');
  });

  it('load de id inexistente devuelve undefined', async () => {
    const result = await store.load('non-existent-id');
    expect(result).toBeUndefined();
  });

  it('sobrescribir un snapshot con el mismo id actualiza el archivo', async () => {
    const snap = captureSnapshot(makeState(), { message: 'original' });
    await store.save(snap);
    const updated = { ...snap, message: 'updated' };
    await store.save(updated);
    const loaded = await store.load(snap.id);
    expect(loaded?.message).toBe('updated');
  });
});

describe('SnapshotStore — list', () => {
  let tmpDir: string;
  let store: SnapshotStore;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'st-snapshots-list-'));
    store = new SnapshotStore({ rootDir: tmpDir });
  });

  afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  it('list devuelve lista vacía si no hay snapshots', async () => {
    const result = await store.list();
    expect(result).toEqual([]);
  });

  it('list devuelve snapshots ordenados por createdAt desc', async () => {
    const snap1 = captureSnapshot(makeState(), { message: 'first' });
    await new Promise((r) => setTimeout(r, 5));
    const snap2 = captureSnapshot(makeState(), { message: 'second' });
    await new Promise((r) => setTimeout(r, 5));
    const snap3 = captureSnapshot(makeState(), { message: 'third' });

    await store.save(snap1);
    await store.save(snap2);
    await store.save(snap3);

    const list = await store.list();
    expect(list).toHaveLength(3);
    expect(new Date(list[0]?.createdAt ?? '').getTime()).toBeGreaterThanOrEqual(
      new Date(list[1]?.createdAt ?? '').getTime(),
    );
    expect(new Date(list[1]?.createdAt ?? '').getTime()).toBeGreaterThanOrEqual(
      new Date(list[2]?.createdAt ?? '').getTime(),
    );
  });

  it('list incluye id, createdAt, message y tags', async () => {
    const snap = captureSnapshot(makeState(), { message: 'check-fields', tags: ['tag1'] });
    await store.save(snap);
    const list = await store.list();
    expect(list[0]?.id).toBe(snap.id);
    expect(list[0]?.message).toBe('check-fields');
    expect(list[0]?.tags).toEqual(['tag1']);
  });

  it('list ignora archivos que no son .json', async () => {
    await fsp.writeFile(path.join(tmpDir, 'README.txt'), 'not a snapshot');
    const snap = captureSnapshot(makeState());
    await store.save(snap);
    const list = await store.list();
    expect(list).toHaveLength(1);
  });

  it('list devuelve lista vacía si el directorio no existe', async () => {
    const emptyStore = new SnapshotStore({ rootDir: path.join(tmpDir, 'nonexistent') });
    const result = await emptyStore.list();
    expect(result).toEqual([]);
  });
});

describe('SnapshotStore — delete', () => {
  let tmpDir: string;
  let store: SnapshotStore;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'st-snapshots-del-'));
    store = new SnapshotStore({ rootDir: tmpDir });
  });

  afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  it('delete elimina el snapshot del disco', async () => {
    const snap = captureSnapshot(makeState());
    await store.save(snap);
    await store.delete(snap.id);
    const loaded = await store.load(snap.id);
    expect(loaded).toBeUndefined();
  });

  it('delete de id inexistente no lanza error', async () => {
    await expect(store.delete('ghost-id')).resolves.toBeUndefined();
  });

  it('delete no afecta otros snapshots', async () => {
    const snapA = captureSnapshot(makeState(), { message: 'A' });
    const snapB = captureSnapshot(makeState(), { message: 'B' });
    await store.save(snapA);
    await store.save(snapB);
    await store.delete(snapA.id);
    expect(await store.load(snapA.id)).toBeUndefined();
    expect(await store.load(snapB.id)).toBeDefined();
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(snapB.id);
  });
});

describe('SnapshotStore — diff', () => {
  let tmpDir: string;
  let store: SnapshotStore;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'st-snapshots-diff-'));
    store = new SnapshotStore({ rootDir: tmpDir });
  });

  afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  it('diff identifica declaraciones añadidas en B', async () => {
    const stateA: STSnapshotState = {
      declarations: [{ kind: 'axiom', name: 'P', formula: 'P' }],
      activeProfile: 'classical',
      evaluatedFormulas: [],
    };
    const stateB: STSnapshotState = {
      declarations: [
        { kind: 'axiom', name: 'P', formula: 'P' },
        { kind: 'theorem', name: 'Q', formula: 'Q' },
      ],
      activeProfile: 'classical',
      evaluatedFormulas: [],
    };
    const snapA = captureSnapshot(stateA);
    const snapB = captureSnapshot(stateB);
    await store.save(snapA);
    await store.save(snapB);

    const d = await store.diff(snapA.id, snapB.id);
    expect(d.addedDeclarations).toHaveLength(1);
    expect(d.addedDeclarations[0]?.name).toBe('Q');
    expect(d.removedDeclarations).toHaveLength(0);
  });

  it('diff identifica declaraciones removidas en B', async () => {
    const stateA: STSnapshotState = {
      declarations: [
        { kind: 'axiom', name: 'P', formula: 'P' },
        { kind: 'axiom', name: 'R', formula: 'R' },
      ],
      activeProfile: 'classical',
      evaluatedFormulas: [],
    };
    const stateB: STSnapshotState = {
      declarations: [{ kind: 'axiom', name: 'P', formula: 'P' }],
      activeProfile: 'classical',
      evaluatedFormulas: [],
    };
    const snapA = captureSnapshot(stateA);
    const snapB = captureSnapshot(stateB);
    await store.save(snapA);
    await store.save(snapB);

    const d = await store.diff(snapA.id, snapB.id);
    expect(d.removedDeclarations).toHaveLength(1);
    expect(d.removedDeclarations[0]?.name).toBe('R');
    expect(d.addedDeclarations).toHaveLength(0);
  });

  it('diff detecta cambio de perfil activo', async () => {
    const snapA = captureSnapshot(makeState('classical'));
    const snapB = captureSnapshot(makeState('modal'));
    await store.save(snapA);
    await store.save(snapB);

    const d = await store.diff(snapA.id, snapB.id);
    expect(d.profileChanged).toEqual({ from: 'classical', to: 'modal' });
  });

  it('diff sin cambios devuelve diff vacío', async () => {
    const state = makeState();
    const snapA = captureSnapshot(state);
    const snapB = captureSnapshot(state);
    await store.save(snapA);
    await store.save(snapB);

    const d = await store.diff(snapA.id, snapB.id);
    expect(d.addedDeclarations).toHaveLength(0);
    expect(d.removedDeclarations).toHaveLength(0);
    expect(d.modifiedFormulas).toHaveLength(0);
    expect(d.profileChanged).toBeUndefined();
  });

  it('diff detecta fórmulas cuyo perfil cambió', async () => {
    const ts = new Date().toISOString();
    const stateA: STSnapshotState = {
      declarations: [],
      activeProfile: 'classical',
      evaluatedFormulas: [{ formula: 'A ∧ B', profile: 'classical', result: true, ts }],
    };
    const stateB: STSnapshotState = {
      declarations: [],
      activeProfile: 'classical',
      evaluatedFormulas: [{ formula: 'A ∧ B', profile: 'modal', result: true, ts }],
    };
    const snapA = captureSnapshot(stateA);
    const snapB = captureSnapshot(stateB);
    await store.save(snapA);
    await store.save(snapB);

    const d = await store.diff(snapA.id, snapB.id);
    expect(d.modifiedFormulas).toHaveLength(1);
    expect(d.modifiedFormulas[0]?.formula).toBe('A ∧ B');
    expect(d.modifiedFormulas[0]?.before).toBe('classical');
    expect(d.modifiedFormulas[0]?.after).toBe('modal');
  });

  it('diff lanza error si alguno de los snapshots no existe', async () => {
    const snap = captureSnapshot(makeState());
    await store.save(snap);
    await expect(store.diff(snap.id, 'missing-id')).rejects.toThrow('Snapshot not found');
    await expect(store.diff('missing-id', snap.id)).rejects.toThrow('Snapshot not found');
  });
});
