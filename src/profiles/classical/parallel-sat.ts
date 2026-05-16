// ============================================================
// Parallel SAT Solver — Portfolio Racing con Workers
// Compatible con Node.js (worker_threads) y Browser (Web Workers)
// ============================================================
//
// Estrategia: lanza N workers con el mismo problema pero diferentes
// heurísticas (semillas VSIDS, políticas de restart, etc).
// El primero que resuelva gana; los demás se terminan.
//
// Fallback: si workers no están disponibles, ejecuta secuencialmente.
// ============================================================

import type { CDCLResult, SolverStats } from './cdcl';

// ── Tipos internos ──────────────────────────────────────────

/** Mensaje del orquestador al worker */
export interface WorkerTask {
  /** Cláusulas flat-packed: [len1, lit1, lit2, ..., len2, lit1, lit2, ...] */
  clauseData: Int32Array;
  numVars: number;
  atomNames: string[];
  timeoutMs: number;
  /** Semilla para variar heurísticas entre workers */
  heuristicSeed: number;
  /** Variante de restart: 0=luby, 1=geometric, 2=fixed */
  restartPolicy: number;
}

/** Mensaje del worker al orquestador */
export interface WorkerResult {
  satisfiable: boolean;
  model?: Record<string, boolean>;
  stats?: SolverStats;
  workerId: number;
}

// ── Serialización de cláusulas ──────────────────────────────

/**
 * Empaqueta un array de Int32Array clauses en un solo buffer plano.
 * Formato: [clauseLen, lit1, lit2, ..., clauseLen, lit1, ...]
 * Esto permite pasar por SharedArrayBuffer o structured clone sin overhead.
 */
export function packClauses(clauses: Int32Array[]): Int32Array {
  let totalLen = 0;
  for (const c of clauses) totalLen += 1 + c.length;
  const packed = new Int32Array(totalLen);
  let offset = 0;
  for (const c of clauses) {
    packed[offset++] = c.length;
    for (let i = 0; i < c.length; i++) packed[offset++] = c[i];
  }
  return packed;
}

/**
 * Desempaqueta un buffer plano de vuelta a Int32Array[].
 */
export function unpackClauses(packed: Int32Array): Int32Array[] {
  const clauses: Int32Array[] = [];
  let offset = 0;
  while (offset < packed.length) {
    const len = packed[offset++];
    clauses.push(packed.slice(offset, offset + len));
    offset += len;
  }
  return clauses;
}

// ── Detección de entorno ────────────────────────────────────

interface WorkerLike {
  postMessage(msg: unknown): void;
  terminate(): void;
  onMessage(cb: (data: unknown) => void): void;
  onError(cb: (err: Error) => void): void;
}

let _workersAvailable: boolean | null = null;

/**
 * Comprueba si el entorno soporta workers.
 */
export function workersAvailable(): boolean {
  if (_workersAvailable !== null) return _workersAvailable;
  try {
    // Node.js — verificar worker_threads sin require()
    if (typeof process !== 'undefined' && process.versions?.node) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('worker_threads');
      _workersAvailable = true;
      return true;
    }
    // Browser
    if (typeof globalThis !== 'undefined' && 'Worker' in globalThis) {
      _workersAvailable = true;
      return true;
    }
  } catch {
    // worker_threads no disponible (browser bundle sin polyfill, etc.)
  }
  _workersAvailable = false;
  return false;
}

// ── Código inline del Worker ────────────────────────────────
// Este string contiene el solver completo self-contained.
// Se evalúa dentro del worker sin necesidad de importar módulos.
// ─────────────────────────────────────────────────────────────

function getWorkerCode(): string {
  return `
'use strict';

// ── Worker SAT Solver (self-contained) ──

function litToIdx(lit, nv) {
  return lit > 0 ? lit - 1 : nv + (-lit) - 1;
}

function luby(i) {
  let size = 1, seq = 0;
  while (size < i + 1) size = 2 * size + 1;
  while (size - 1 !== i) { size = (size - 1) >> 1; seq++; if (i >= size) i -= size; }
  return 1 << seq;
}

function unpackClauses(packed) {
  const clauses = [];
  let offset = 0;
  while (offset < packed.length) {
    const len = packed[offset++];
    clauses.push(packed.slice(offset, offset + len));
    offset += len;
  }
  return clauses;
}

function workerSolve(task) {
  const { clauseData, numVars, atomNames, timeoutMs, heuristicSeed, restartPolicy } = task;
  const startTime = Date.now();

  const allClauses = unpackClauses(new Int32Array(clauseData));
  const originalCount = allClauses.length;

  const stats = {
    decisions: 0, propagations: 0, conflicts: 0,
    learnedClauses: 0, restarts: 0, preprocessEliminated: 0, solveTimeMs: 0,
  };

  if (allClauses.length === 0) {
    const model = {};
    for (let i = 0; i < atomNames.length && i < numVars; i++) model[atomNames[i]] = true;
    stats.solveTimeMs = Date.now() - startTime;
    return { satisfiable: true, model, stats };
  }

  // Detect empty clause
  for (const c of allClauses) {
    if (c.length === 0) {
      stats.solveTimeMs = Date.now() - startTime;
      return { satisfiable: false, stats };
    }
  }

  const varVal = new Int8Array(numVars + 1);
  const varLevel = new Int32Array(numVars + 1).fill(-1);
  const varAnte = new Int32Array(numVars + 1).fill(-1);
  const trail = [];
  const trailLim = [];
  let qHead = 0;
  const phase = new Int8Array(numVars + 1);

  // Watched literals
  const watchSize = 2 * numVars;
  const watches = new Array(watchSize);

  function rebuildWatches() {
    for (let i = 0; i < watchSize; i++) watches[i] = [];
    for (let ci = 0; ci < allClauses.length; ci++) {
      const c = allClauses[ci];
      if (c.length >= 2) {
        watches[litToIdx(c[0], numVars)].push(ci);
        watches[litToIdx(c[1], numVars)].push(ci);
      }
    }
  }
  rebuildWatches();

  // VSIDS with seeded initial activity
  const activity = new Float64Array(numVars + 1);
  let varInc = 1.0;
  const VAR_DECAY = 0.95;

  for (const c of allClauses) {
    for (let i = 0; i < c.length; i++) activity[Math.abs(c[i])] += 1.0;
  }
  // Apply heuristic seed: perturb activities slightly
  if (heuristicSeed > 0) {
    let s = heuristicSeed;
    for (let v = 1; v <= numVars; v++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      activity[v] += (s % 1000) / 10000.0;
    }
  }

  function bumpVar(v) { activity[v] += varInc; if (activity[v] > 1e100) { for (let i = 1; i <= numVars; i++) activity[i] *= 1e-100; varInc *= 1e-100; } }
  function decayAct() { varInc /= VAR_DECAY; }
  function currentDL() { return trailLim.length; }
  function litIsTrue(lit) { return lit > 0 ? varVal[lit] === 1 : varVal[-lit] === -1; }
  function litIsFalse(lit) { return lit > 0 ? varVal[lit] === -1 : varVal[-lit] === 1; }

  function enqueue(lit, lev, reason) {
    const v = Math.abs(lit);
    if (varVal[v] !== 0) return litIsTrue(lit);
    varVal[v] = lit > 0 ? 1 : -1;
    varLevel[v] = lev;
    varAnte[v] = reason;
    trail.push(lit);
    phase[v] = lit > 0 ? 1 : 0;
    stats.propagations++;
    return true;
  }

  function propagate() {
    while (qHead < trail.length) {
      const p = trail[qHead++];
      const falseLit = -p;
      const wIdx = litToIdx(falseLit, numVars);
      const wl = watches[wIdx];
      let j = 0;
      for (let i = 0; i < wl.length; i++) {
        const ci = wl[i];
        const c = allClauses[ci];
        if (!c || c.length < 2) { wl[j++] = ci; continue; }
        if (c[0] === falseLit) { c[0] = c[1]; c[1] = falseLit; }
        if (litIsTrue(c[0])) { wl[j++] = ci; continue; }
        let found = false;
        for (let k = 2; k < c.length; k++) {
          if (!litIsFalse(c[k])) {
            c[1] = c[k]; c[k] = falseLit;
            watches[litToIdx(c[1], numVars)].push(ci);
            found = true; break;
          }
        }
        if (found) continue;
        wl[j++] = ci;
        if (litIsFalse(c[0])) {
          for (let r = i + 1; r < wl.length; r++) wl[j++] = wl[r];
          wl.length = j; qHead = trail.length; return ci;
        }
        if (!enqueue(c[0], currentDL(), ci)) {
          for (let r = i + 1; r < wl.length; r++) wl[j++] = wl[r];
          wl.length = j; qHead = trail.length; return ci;
        }
      }
      wl.length = j;
    }
    return -1;
  }

  function analyzeConflict(conflictCi) {
    const dl = currentDL();
    const seen = new Uint8Array(numVars + 1);
    const outLits = [];
    let counter = 0, btLevel = 0;
    function addLits(ci, skipVar) {
      const c = allClauses[ci];
      for (let i = 0; i < c.length; i++) {
        const v = Math.abs(c[i]);
        if (v === skipVar || seen[v]) continue;
        seen[v] = 1; bumpVar(v);
        if (varLevel[v] === dl) counter++;
        else if (varLevel[v] > 0) { outLits.push(c[i]); if (varLevel[v] > btLevel) btLevel = varLevel[v]; }
      }
    }
    addLits(conflictCi, 0);
    let ti = trail.length - 1, assertLit = 0;
    while (counter > 0) {
      while (ti >= 0 && !seen[Math.abs(trail[ti])]) ti--;
      if (ti < 0) break;
      const p = trail[ti--], v = Math.abs(p);
      seen[v] = 0; counter--;
      if (counter === 0) assertLit = -p;
      else if (varAnte[v] >= 0) addLits(varAnte[v], v);
    }
    const learned = [];
    if (assertLit !== 0) learned.push(assertLit);
    learned.push(...outLits);
    if (learned.length === 0) return { learned: new Int32Array(0), btLevel: -1 };
    if (learned.length <= 1) btLevel = 0;
    if (learned.length >= 3) {
      let mx = 1;
      for (let i = 2; i < learned.length; i++) if (varLevel[Math.abs(learned[i])] > varLevel[Math.abs(learned[mx])]) mx = i;
      if (mx !== 1) { const tmp = learned[1]; learned[1] = learned[mx]; learned[mx] = tmp; }
    }
    decayAct();
    return { learned: new Int32Array(learned), btLevel };
  }

  function backtrack(target) {
    if (currentDL() <= target) return;
    const btPoint = target < trailLim.length ? trailLim[target] : trail.length;
    for (let i = trail.length - 1; i >= btPoint; i--) {
      const v = Math.abs(trail[i]);
      varVal[v] = 0; varLevel[v] = -1; varAnte[v] = -1;
    }
    trail.length = btPoint; trailLim.length = target; qHead = btPoint;
  }

  function pickBranch() {
    let best = 0, bestAct = -1;
    for (let v = 1; v <= numVars; v++) {
      if (varVal[v] === 0 && activity[v] > bestAct) { bestAct = activity[v]; best = v; }
    }
    return best;
  }

  function addLearned(learned) {
    const ci = allClauses.length;
    allClauses.push(learned);
    stats.learnedClauses++;
    if (learned.length >= 2) {
      watches[litToIdx(learned[0], numVars)].push(ci);
      watches[litToIdx(learned[1], numVars)].push(ci);
    }
    return ci;
  }

  function reduceDB() {
    const learnedCount = allClauses.length - originalCount;
    if (learnedCount < 100) return;
    const locked = new Uint8Array(allClauses.length);
    for (let v = 1; v <= numVars; v++) {
      if (varVal[v] !== 0 && varAnte[v] >= originalCount) locked[varAnte[v]] = 1;
    }
    const removable = [];
    for (let ci = originalCount; ci < allClauses.length; ci++) {
      if (!locked[ci] && allClauses[ci].length > 2) removable.push(ci);
    }
    if (removable.length < 50) return;
    removable.sort((a, b) => allClauses[b].length - allClauses[a].length);
    const toRemove = new Set(removable.slice(0, Math.floor(removable.length / 2)));
    const oldToNew = new Map();
    const newClauses = [];
    for (let ci = 0; ci < allClauses.length; ci++) {
      if (!toRemove.has(ci)) { oldToNew.set(ci, newClauses.length); newClauses.push(allClauses[ci]); }
    }
    for (let v = 1; v <= numVars; v++) {
      if (varAnte[v] >= 0) { const m = oldToNew.get(varAnte[v]); varAnte[v] = m !== undefined ? m : -1; }
    }
    allClauses.length = 0; allClauses.push(...newClauses);
    rebuildWatches();
  }

  // Process initial unit clauses
  for (let ci = 0; ci < allClauses.length; ci++) {
    if (allClauses[ci].length === 1) {
      if (!enqueue(allClauses[ci][0], 0, ci)) {
        stats.solveTimeMs = Date.now() - startTime;
        return { satisfiable: false, stats };
      }
    }
  }

  let conflict = propagate();
  if (conflict !== -1) {
    stats.solveTimeMs = Date.now() - startTime;
    return { satisfiable: false, stats };
  }

  // Main CDCL loop with configurable restart policy
  let lubyIdx = 0;
  const RESTART_BASE = restartPolicy === 2 ? 200 : 100;
  let conflictsUntilRestart = restartPolicy === 1
    ? RESTART_BASE
    : RESTART_BASE * luby(lubyIdx);
  let conflictsSinceRestart = 0;
  let nextReduceDB = originalCount * 3;
  const GEOMETRIC_FACTOR = 1.5;

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      stats.solveTimeMs = Date.now() - startTime;
      return { satisfiable: false, stats };
    }

    const v = pickBranch();
    if (v === 0) break;

    stats.decisions++;
    trailLim.push(trail.length);
    // Diversify: use seed to sometimes flip polarity
    let lit;
    if (heuristicSeed > 0 && stats.decisions % (3 + heuristicSeed % 5) === 0) {
      lit = phase[v] === 1 ? -v : v; // flip
    } else {
      lit = phase[v] === 1 ? v : -v;
    }
    enqueue(lit, currentDL(), -1);
    conflict = propagate();

    while (conflict !== -1) {
      stats.conflicts++;
      conflictsSinceRestart++;
      if (currentDL() === 0) {
        stats.solveTimeMs = Date.now() - startTime;
        return { satisfiable: false, stats };
      }
      const { learned, btLevel } = analyzeConflict(conflict);
      if (learned.length === 0 || btLevel < 0) {
        stats.solveTimeMs = Date.now() - startTime;
        return { satisfiable: false, stats };
      }
      backtrack(btLevel);
      const lci = addLearned(learned);
      enqueue(learned[0], learned.length === 1 ? 0 : btLevel, lci);
      conflict = propagate();
    }

    if (conflictsSinceRestart >= conflictsUntilRestart) {
      stats.restarts++;
      if (restartPolicy === 1) {
        conflictsUntilRestart = Math.floor(conflictsUntilRestart * GEOMETRIC_FACTOR);
      } else {
        lubyIdx++;
        conflictsUntilRestart = RESTART_BASE * luby(lubyIdx);
      }
      conflictsSinceRestart = 0;
      backtrack(0);
    }

    if (allClauses.length > nextReduceDB) {
      reduceDB();
      nextReduceDB = originalCount + allClauses.length * 2;
    }
  }

  // SAT — build model
  const model = {};
  for (let i = 0; i < atomNames.length && i < numVars; i++) {
    model[atomNames[i]] = varVal[i + 1] === 1 || varVal[i + 1] === 0;
  }
  stats.solveTimeMs = Date.now() - startTime;
  return { satisfiable: true, model, stats };
}

// ── Worker message handler ──

if (typeof require !== 'undefined') {
  // Node.js worker_threads
  try {
    const { parentPort } = require('worker_threads');
    if (parentPort) {
      parentPort.on('message', function(msg) {
        try {
          const result = workerSolve(msg);
          result.workerId = msg.workerId || 0;
          parentPort.postMessage(result);
        } catch (e) {
          parentPort.postMessage({ satisfiable: false, error: e.message, workerId: msg.workerId || 0 });
        }
      });
    }
  } catch(e) {}
} else if (typeof self !== 'undefined') {
  // Browser Web Worker
  self.onmessage = function(ev) {
    try {
      const result = workerSolve(ev.data);
      result.workerId = ev.data.workerId || 0;
      self.postMessage(result);
    } catch (e) {
      self.postMessage({ satisfiable: false, error: e.message, workerId: ev.data.workerId || 0 });
    }
  };
}
`;
}

// ── Creación de Workers ─────────────────────────────────────

function createNodeWorker(code: string): WorkerLike {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const wt = require('worker_threads') as typeof import('worker_threads');
  const w = new wt.Worker(code, { eval: true });
  return {
    postMessage: (msg: unknown) => w.postMessage(msg),
    terminate: () => void w.terminate(),
    onMessage: (cb: (data: unknown) => void) => {
      w.on('message', cb);
    },
    onError: (cb: (err: Error) => void) => {
      w.on('error', cb);
    },
  };
}

function createBrowserWorker(code: string): WorkerLike {
  const blob = new Blob([code], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  // Browser Worker — globalThis.Worker no existe en lib:node; cast inevitable sin lib:dom
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const W = (globalThis as any).Worker as { new (url: string): any }; // allow-any
  const w = new W(url) as {
    postMessage: (msg: unknown) => void;
    terminate: () => void;
    onmessage: ((ev: { data: unknown }) => void) | null;
    onerror: ((ev: { message: string }) => void) | null;
  };
  return {
    postMessage: (msg: unknown) => w.postMessage(msg),
    terminate: () => {
      w.terminate();
      URL.revokeObjectURL(url);
    },
    onMessage: (cb: (data: unknown) => void) => {
      w.onmessage = (ev: { data: unknown }) => cb(ev.data);
    },
    onError: (cb: (err: Error) => void) => {
      w.onerror = (ev: { message: string }) => cb(new Error(ev.message));
    },
  };
}

function spawnWorker(): WorkerLike | null {
  const code = getWorkerCode();
  try {
    if (typeof process !== 'undefined' && process.versions?.node) {
      return createNodeWorker(code);
    }
    if (typeof globalThis !== 'undefined' && 'Worker' in globalThis) {
      return createBrowserWorker(code);
    }
  } catch {
    // Workers no disponibles
  }
  return null;
}

// ── Portfolio: Configuraciones de heurísticas ───────────────

interface PortfolioConfig {
  heuristicSeed: number;
  restartPolicy: number; // 0=luby, 1=geometric, 2=fixed
}

const PORTFOLIO_CONFIGS: PortfolioConfig[] = [
  { heuristicSeed: 0, restartPolicy: 0 }, // Default (Luby)
  { heuristicSeed: 42, restartPolicy: 1 }, // Geometric restarts
  { heuristicSeed: 137, restartPolicy: 0 }, // Luby + seed perturbation
  { heuristicSeed: 7919, restartPolicy: 2 }, // Fixed restarts + big seed
];

// ── Solver Paralelo Principal ───────────────────────────────

/**
 * Umbral mínimo de variables para activar paralelismo.
 * Por debajo de este umbral, el overhead de workers no compensa.
 */
export const PARALLEL_THRESHOLD = 80;

/**
 * Número máximo de workers a lanzar (limitado por configs de portfolio).
 */
export const MAX_WORKERS = 4;

/**
 * Resuelve SAT en paralelo con portfolio racing.
 *
 * @param clauses Cláusulas ya codificadas (post-preprocessing)
 * @param numVars Número de variables
 * @param atomNames Nombres de los átomos originales
 * @param timeoutMs Timeout global
 * @returns Promise con el resultado
 */
export function parallelSolve(
  clauses: Int32Array[],
  numVars: number,
  atomNames: string[],
  timeoutMs: number,
): Promise<CDCLResult> {
  return new Promise<CDCLResult>((resolve) => {
    if (!workersAvailable()) {
      // Fallback: no se resuelve aquí, el caller usará cdclSolve secuencial
      resolve({ satisfiable: false, stats: undefined });
      return;
    }

    const packed = packClauses(clauses);
    const numWorkers = Math.min(MAX_WORKERS, PORTFOLIO_CONFIGS.length);
    const workers: WorkerLike[] = [];
    let resolved = false;
    let completedCount = 0;

    // Timeout global
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        terminateAll();
        resolve({ satisfiable: false });
      }
    }, timeoutMs);

    function terminateAll(): void {
      for (const w of workers) {
        try {
          w.terminate();
        } catch {
          // ignore
        }
      }
      clearTimeout(timer);
    }

    for (let i = 0; i < numWorkers; i++) {
      const w = spawnWorker();
      if (!w) continue;
      workers.push(w);

      const config = PORTFOLIO_CONFIGS[i];

      w.onMessage((data: unknown) => {
        const result = data as WorkerResult;
        completedCount++;

        if (!resolved) {
          // Estrategia: el primero que encuentre SAT gana inmediatamente.
          // Si es UNSAT, esperar a que TODOS confirmen UNSAT.
          if (result.satisfiable) {
            resolved = true;
            terminateAll();
            resolve({
              satisfiable: true,
              model: result.model,
              stats: result.stats,
            });
          } else if (completedCount >= workers.length) {
            // Todos dijeron UNSAT
            resolved = true;
            terminateAll();
            resolve({
              satisfiable: false,
              stats: result.stats,
            });
          }
        }
      });

      w.onError(() => {
        completedCount++;
        if (!resolved && completedCount >= workers.length) {
          resolved = true;
          terminateAll();
          resolve({ satisfiable: false });
        }
      });

      w.postMessage({
        clauseData: Array.from(packed), // Structured clone friendly
        numVars,
        atomNames,
        timeoutMs: timeoutMs - 10, // Worker timeout ligeramente menor
        heuristicSeed: config.heuristicSeed,
        restartPolicy: config.restartPolicy,
        workerId: i,
      });
    }

    // Si no se pudieron crear workers, fallback inmediato
    if (workers.length === 0) {
      clearTimeout(timer);
      resolve({ satisfiable: false, stats: undefined });
    }
  });
}

/**
 * Versión síncrona que intenta paralelismo y cae a secuencial.
 * Para integración transparente con el flujo actual de cdcl().
 *
 * NOTA: Esta función solo es útil si el caller puede manejar
 * la Promise. Si no, usar cdclSolve directamente.
 */
export function tryParallelSolve(
  clauses: Int32Array[],
  numVars: number,
  atomNames: string[],
  timeoutMs: number,
): Promise<CDCLResult> | null {
  if (!workersAvailable() || numVars < PARALLEL_THRESHOLD) {
    return null; // Caller debe usar solver secuencial
  }
  return parallelSolve(clauses, numVars, atomNames, timeoutMs);
}
