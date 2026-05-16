/**
 * ST Parallel Profile Pool — ejecuta múltiples perfiles lógicos en paralelo.
 *
 * Usa Node.js worker_threads cuando está disponible; si no (browser o
 * entorno sin soporte), cae a evaluación secuencial con Promise.resolve().
 */

import { cpus } from 'os';
import type { Formula, RunResult } from '../../types';
import { registry } from '../../profiles/interface';
import '../../profiles';
import type { WorkerTask, WorkerResponse } from './worker';

// ── Tipos públicos ──────────────────────────────────────────────

export type ProfileName = string;

export interface ParallelEvalOptions {
  profiles: ProfileName[];
  poolSize?: number;
  timeoutMs?: number;
  shareWorkPool?: boolean;
}

export interface ParallelEvalResult {
  perProfile: Record<ProfileName, RunResult | { error: string }>;
  totalMs: number;
  speedup: number;
}

// ── Detección de entorno ────────────────────────────────────────

function nodeWorkersAvailable(): boolean {
  try {
    if (typeof process !== 'undefined' && process.versions?.node) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('worker_threads');
      return true;
    }
  } catch {
    // worker_threads no disponible
  }
  return false;
}

// ── Worker Node.js con cola de callbacks pendientes ─────────────
// Cada worker tiene un único listener permanente que enruta
// respuestas a la Promise pendiente por profileName.

interface PendingCallback {
  resolve: (result: RunResult | { error: string }) => void;
}

interface ManagedWorker {
  post: (task: WorkerTask) => void;
  terminate: () => void;
  busy: boolean;
  pending: Map<string, PendingCallback>;
}

function createManagedWorker(): ManagedWorker | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wt = require('worker_threads') as typeof import('worker_threads');
    const workerPath = require.resolve('./worker');
    const w = new wt.Worker(workerPath);

    const mw: ManagedWorker = {
      busy: false,
      pending: new Map(),
      post: (task: WorkerTask) => w.postMessage(task),
      terminate: () => void w.terminate(),
    };

    w.on('message', (data: WorkerResponse) => {
      const cb = mw.pending.get(data.profileName);
      if (cb) {
        mw.pending.delete(data.profileName);
        mw.busy = false;
        cb.resolve(data.result);
      }
    });

    w.on('error', (err: Error) => {
      for (const [, cb] of mw.pending) {
        cb.resolve({ error: err.message });
      }
      mw.pending.clear();
      mw.busy = false;
    });

    return mw;
  } catch {
    return null;
  }
}

// ── Evaluación secuencial (fallback) ────────────────────────────

function evalSequential(
  formula: Formula,
  profiles: ProfileName[],
): Record<ProfileName, RunResult | { error: string }> {
  const perProfile: Record<ProfileName, RunResult | { error: string }> = {};
  for (const name of profiles) {
    const profile = registry.get(name);
    if (!profile) {
      perProfile[name] = { error: `Perfil desconocido: "${name}"` };
      continue;
    }
    try {
      perProfile[name] = profile.checkValid(formula);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      perProfile[name] = { error: msg };
    }
  }
  return perProfile;
}

// ── Pool compartido (shareWorkPool=true) ────────────────────────

let sharedPool: ManagedWorker[] | null = null;
let sharedPoolSize = 0;

function ensureSharedPool(size: number): void {
  if (sharedPool !== null && sharedPoolSize === size) return;

  if (sharedPool) {
    for (const mw of sharedPool) {
      try {
        mw.terminate();
      } catch {
        // ignore
      }
    }
  }

  sharedPool = [];
  sharedPoolSize = size;

  for (let i = 0; i < size; i++) {
    const mw = createManagedWorker();
    if (mw) sharedPool.push(mw);
  }
}

// ── Evaluación de un perfil en un ManagedWorker ─────────────────

function runProfileOnWorker(
  mw: ManagedWorker,
  formula: Formula,
  profileName: string,
  timeoutMs: number,
  workerId: number,
): Promise<RunResult | { error: string }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (mw.pending.has(profileName)) {
        mw.pending.delete(profileName);
        mw.busy = false;
        resolve({ error: `Timeout: evaluación de "${profileName}" superó ${timeoutMs}ms` });
      }
    }, timeoutMs);

    mw.pending.set(profileName, {
      resolve: (result) => {
        clearTimeout(timer);
        resolve(result);
      },
    });

    mw.busy = true;
    mw.post({ profileName, formula, timeoutMs, workerId });
  });
}

// ── Evaluación paralela ──────────────────────────────────────────

async function evalWithWorkers(
  formula: Formula,
  profiles: ProfileName[],
  poolSize: number,
  timeoutMs: number,
  shareWorkPool: boolean,
): Promise<Record<ProfileName, RunResult | { error: string }>> {
  if (shareWorkPool) {
    ensureSharedPool(poolSize);
    const pool = sharedPool ?? [];

    if (pool.length === 0) {
      return evalSequential(formula, profiles);
    }

    const promises = profiles.map((profileName, idx) => {
      const mw = pool[idx % pool.length];
      if (!mw) {
        return Promise.resolve([profileName, { error: 'Worker no disponible' }] as const);
      }
      return runProfileOnWorker(mw, formula, profileName, timeoutMs, idx).then(
        (result) => [profileName, result] as const,
      );
    });

    const entries = await Promise.all(promises);
    return Object.fromEntries(entries);
  }

  // Pool efímero: crear un worker por slot y repartir perfiles
  const actualPoolSize = Math.min(poolSize, profiles.length);
  const workers: ManagedWorker[] = [];

  for (let i = 0; i < actualPoolSize; i++) {
    const mw = createManagedWorker();
    if (mw) workers.push(mw);
  }

  if (workers.length === 0) {
    return evalSequential(formula, profiles);
  }

  try {
    const promises = profiles.map((profileName, idx) => {
      const mw = workers[idx % workers.length];
      if (!mw) {
        return Promise.resolve([profileName, { error: 'Worker no disponible' }] as const);
      }
      return runProfileOnWorker(mw, formula, profileName, timeoutMs, idx).then(
        (result) => [profileName, result] as const,
      );
    });

    const entries = await Promise.all(promises);
    return Object.fromEntries(entries);
  } finally {
    for (const mw of workers) {
      try {
        mw.terminate();
      } catch {
        // ignore
      }
    }
  }
}

// ── API pública ─────────────────────────────────────────────────

/**
 * Evalúa una fórmula lógica con múltiples perfiles en paralelo.
 *
 * Si worker_threads no está disponible (browser), ejecuta secuencialmente.
 */
export async function evalParallel(
  formula: Formula,
  opts: ParallelEvalOptions,
): Promise<ParallelEvalResult> {
  const profiles = opts.profiles;
  const poolSize = opts.poolSize ?? cpus().length;
  const timeoutMs = opts.timeoutMs ?? 5000;
  const shareWorkPool = opts.shareWorkPool ?? false;

  const startMs = Date.now();
  let perProfile: Record<ProfileName, RunResult | { error: string }>;

  if (!nodeWorkersAvailable() || profiles.length === 0) {
    perProfile = evalSequential(formula, profiles);
  } else {
    perProfile = await evalWithWorkers(formula, profiles, poolSize, timeoutMs, shareWorkPool);
  }

  const totalMs = Date.now() - startMs;
  const speedup =
    profiles.length > 1 && totalMs > 0
      ? profiles.length / (totalMs / (totalMs / profiles.length))
      : 1;

  return { perProfile, totalMs, speedup };
}

/**
 * Cierra todos los workers del pool compartido.
 * Llamar al final del proceso si shareWorkPool=true.
 */
export async function shutdownPool(): Promise<void> {
  if (!sharedPool) return;

  const pool = sharedPool;
  sharedPool = null;
  sharedPoolSize = 0;

  await Promise.all(
    pool.map(
      (mw) =>
        new Promise<void>((resolve) => {
          try {
            mw.terminate();
          } catch {
            // ignore
          }
          resolve();
        }),
    ),
  );
}
