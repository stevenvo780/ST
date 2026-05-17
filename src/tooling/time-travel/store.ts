import { promises as fsp } from 'fs';
import path from 'path';
import os from 'os';
import { STSnapshot, SnapshotSummary, SnapshotDiff, Declaration } from './types';

function defaultRootDir(): string {
  return path.join(os.homedir(), '.st-snapshots');
}

export class SnapshotStore {
  private readonly rootDir: string;

  constructor(opts?: { rootDir?: string }) {
    this.rootDir = opts?.rootDir ?? defaultRootDir();
  }

  private filePath(id: string): string {
    return path.join(this.rootDir, `${id}.json`);
  }

  async save(snapshot: STSnapshot): Promise<void> {
    await fsp.mkdir(this.rootDir, { recursive: true });
    await fsp.writeFile(this.filePath(snapshot.id), JSON.stringify(snapshot, null, 2), 'utf8');
  }

  async load(id: string): Promise<STSnapshot | undefined> {
    try {
      const raw = await fsp.readFile(this.filePath(id), 'utf8');
      return JSON.parse(raw) as STSnapshot;
    } catch {
      return undefined;
    }
  }

  async list(): Promise<SnapshotSummary[]> {
    let entries: string[];
    try {
      entries = await fsp.readdir(this.rootDir);
    } catch {
      return [];
    }

    const summaries: SnapshotSummary[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      try {
        const raw = await fsp.readFile(path.join(this.rootDir, entry), 'utf8');
        const snap = JSON.parse(raw) as STSnapshot;
        summaries.push({
          id: snap.id,
          createdAt: snap.createdAt,
          message: snap.message,
          tags: snap.tags,
        });
      } catch {
        // skip malformed files
      }
    }

    summaries.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });

    return summaries;
  }

  async delete(id: string): Promise<void> {
    try {
      await fsp.unlink(this.filePath(id));
    } catch {
      // no-op if file doesn't exist
    }
  }

  async diff(idA: string, idB: string): Promise<SnapshotDiff> {
    const [snapA, snapB] = await Promise.all([this.load(idA), this.load(idB)]);

    if (snapA === undefined) throw new Error(`Snapshot not found: ${idA}`);
    if (snapB === undefined) throw new Error(`Snapshot not found: ${idB}`);

    const declsA = snapA.state.declarations;
    const declsB = snapB.state.declarations;

    const keyOf = (d: Declaration): string => `${d.kind}::${d.name}`;
    const mapA = new Map<string, Declaration>(declsA.map((d) => [keyOf(d), d]));
    const mapB = new Map<string, Declaration>(declsB.map((d) => [keyOf(d), d]));

    const addedDeclarations: Declaration[] = [];
    const removedDeclarations: Declaration[] = [];

    for (const [k, d] of mapB) {
      if (!mapA.has(k)) addedDeclarations.push(d);
    }
    for (const [k, d] of mapA) {
      if (!mapB.has(k)) removedDeclarations.push(d);
    }

    const formsByProfile = (snap: STSnapshot): Map<string, string> => {
      const m = new Map<string, string>();
      for (const ef of snap.state.evaluatedFormulas) {
        m.set(ef.formula, ef.profile);
      }
      return m;
    };

    const formsA = formsByProfile(snapA);
    const formsB = formsByProfile(snapB);

    const modifiedFormulas: SnapshotDiff['modifiedFormulas'] = [];
    for (const [formula, profileB] of formsB) {
      const profileA = formsA.get(formula);
      if (profileA !== undefined && profileA !== profileB) {
        modifiedFormulas.push({ formula, before: profileA, after: profileB });
      }
    }

    const profileChanged =
      snapA.state.activeProfile !== snapB.state.activeProfile
        ? { from: snapA.state.activeProfile, to: snapB.state.activeProfile }
        : undefined;

    return { addedDeclarations, removedDeclarations, modifiedFormulas, profileChanged };
  }
}
