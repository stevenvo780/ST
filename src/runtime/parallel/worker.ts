/**
 * ST Parallel Profile Worker — ejecutado en un hilo separado (worker_threads).
 *
 * Recibe un WorkerTask con la fórmula serializada y el nombre del perfil,
 * evalúa checkValid() y devuelve WorkerResponse al hilo principal.
 */

// Importar en el contexto del worker (Node.js worker_threads)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parentPort } = require('worker_threads') as typeof import('worker_threads');

import type { Formula, RunResult } from '../../types';

// Registrar perfiles en el contexto del worker
import '../../logic/profiles';
import { registry } from '../../logic/profiles/interface';

export interface WorkerTask {
  profileName: string;
  formula: Formula;
  timeoutMs: number;
  workerId: number;
}

export interface WorkerResponse {
  workerId: number;
  profileName: string;
  result: RunResult | { error: string };
}

if (parentPort) {
  parentPort.on('message', (task: WorkerTask) => {
    const response: WorkerResponse = {
      workerId: task.workerId,
      profileName: task.profileName,
      result: runProfile(task),
    };
    parentPort.postMessage(response);
  });
}

function runProfile(task: WorkerTask): RunResult | { error: string } {
  try {
    const profile = registry.get(task.profileName);
    if (!profile) {
      return { error: `Perfil desconocido: "${task.profileName}"` };
    }

    const deadline = Date.now() + task.timeoutMs;
    const result = profile.checkValid(task.formula);

    if (Date.now() > deadline) {
      return { error: `Timeout: evaluación superó ${task.timeoutMs}ms` };
    }

    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}
