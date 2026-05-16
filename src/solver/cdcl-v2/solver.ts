// CDCL v2 — Orquestador principal.
// Combina: 2-watched literals, BCP, 1UIP clause learning, VSIDS, Luby restarts,
// phase saving, LBD scoring + reducción periódica de aprendidas.

import { analyzeConflict1UIP } from './clause-learning';
import { computeLBD, selectClausesToRemove, type LearnedMeta } from './lbd';
import { LubyRestartPolicy } from './luby';
import { PhaseSaver } from './phase-saving';
import {
  litToIdx,
  NO_ANTECEDENT,
  NO_CONFLICT,
  type Clause,
  type SatResult,
  type SolverOptions,
  type SolverStatsV2,
  type SolveResult,
  type UnsatResult,
} from './state';
import { VSIDS } from './vsids';

const DEFAULTS = {
  timeoutMs: 30_000,
  lubyBase: 100,
  vsidsDecay: 0.95,
  clauseDecay: 0.999,
  lbdReduceThreshold: 2,
  initialPhase: 0 as 0 | 1,
};

interface InternalOpts {
  timeoutMs: number;
  lubyBase: number;
  vsidsDecay: number;
  clauseDecay: number;
  lbdReduceThreshold: number;
  atomNames: ReadonlyArray<string> | undefined;
  initialPhase: 0 | 1;
}

function normalizeOpts(opts: SolverOptions | undefined): InternalOpts {
  return {
    timeoutMs: opts?.timeoutMs ?? DEFAULTS.timeoutMs,
    lubyBase: opts?.lubyBase ?? DEFAULTS.lubyBase,
    vsidsDecay: opts?.vsidsDecay ?? DEFAULTS.vsidsDecay,
    clauseDecay: opts?.clauseDecay ?? DEFAULTS.clauseDecay,
    lbdReduceThreshold: opts?.lbdReduceThreshold ?? DEFAULTS.lbdReduceThreshold,
    atomNames: opts?.atomNames,
    initialPhase: opts?.initialPhase ?? DEFAULTS.initialPhase,
  };
}

function emptyStats(): SolverStatsV2 {
  return {
    decisions: 0,
    propagations: 0,
    conflicts: 0,
    learnedClauses: 0,
    reducedClauses: 0,
    restarts: 0,
    maxDecisionLevel: 0,
    solveTimeMs: 0,
  };
}

function buildModel(
  varVal: Int8Array,
  numVars: number,
  atomNames: ReadonlyArray<string> | undefined,
): Record<string, boolean> {
  const model: Record<string, boolean> = {};
  if (!atomNames) {
    for (let v = 1; v <= numVars; v++) {
      model[`x${v}`] = varVal[v] === 1 || varVal[v] === 0;
    }
    return model;
  }
  for (let i = 0; i < atomNames.length && i < numVars; i++) {
    const name = atomNames[i];
    if (!name) continue;
    model[name] = varVal[i + 1] === 1 || varVal[i + 1] === 0;
  }
  return model;
}

/**
 * Resuelve un conjunto de cláusulas CNF y retorna SAT (con modelo) o UNSAT
 * (con core de variables involucradas en cláusulas vacías derivadas).
 *
 * Convención DIMACS: variables 1..numVars, literal positivo = variable
 * asignada a true, negativo = false. Cláusula vacía ⇒ UNSAT inmediato.
 */
export function solveCDCLv2(
  inputClauses: ReadonlyArray<Int32Array>,
  numVars: number,
  opts?: SolverOptions,
): SolveResult {
  const o = normalizeOpts(opts);
  const startTime = Date.now();
  const stats = emptyStats();

  // Caso degenerado: 0 variables.
  if (numVars === 0) {
    // Cláusula vacía explícita ⇒ UNSAT; sino SAT trivial.
    for (const c of inputClauses)
      if (c.length === 0) {
        stats.solveTimeMs = Date.now() - startTime;
        return makeUnsat([], stats);
      }
    stats.solveTimeMs = Date.now() - startTime;
    return makeSat({}, stats);
  }

  // Copia mutable de cláusulas — las watched literals se reordenan in-place.
  const allClauses: Clause[] = inputClauses.map((c) => new Int32Array(c));

  // UNSAT trivial: cláusula vacía directa.
  for (const c of allClauses) {
    if (c.length === 0) {
      stats.solveTimeMs = Date.now() - startTime;
      return makeUnsat([], stats);
    }
  }

  const originalCount = allClauses.length;

  // Estado de variables (1-indexado).
  const varVal = new Int8Array(numVars + 1);
  const varLevel = new Int32Array(numVars + 1).fill(-1);
  const varAnte = new Int32Array(numVars + 1).fill(NO_ANTECEDENT);

  // Trail: literales asignados en orden cronológico. trailLim guarda el
  // offset del trail al inicio de cada nivel de decisión > 0.
  const trail: number[] = [];
  const trailLim: number[] = [];
  let qHead = 0;

  // Watch lists: 2-watched literals (MiniSat).
  const watchSize = 2 * numVars;
  const watches: number[][] = new Array<number[]>(watchSize);
  for (let i = 0; i < watchSize; i++) watches[i] = [];

  const rebuildWatches = (): void => {
    for (let i = 0; i < watchSize; i++) watches[i] = [];
    for (let ci = 0; ci < allClauses.length; ci++) {
      const c = allClauses[ci];
      if (c.length >= 2) {
        const w0 = watches[litToIdx(c[0], numVars)];
        const w1 = watches[litToIdx(c[1], numVars)];
        if (w0) w0.push(ci);
        if (w1) w1.push(ci);
      }
    }
  };
  rebuildWatches();

  // Heurísticas.
  const vsids = new VSIDS(numVars, o.vsidsDecay);
  vsids.initFromClauses(allClauses);
  const phases = new PhaseSaver(numVars, o.initialPhase);
  const restarter = new LubyRestartPolicy(o.lubyBase);

  // Metadatos de cláusulas aprendidas (sólo learned, índice >= originalCount).
  const learnedMeta = new Map<number, LearnedMeta>();
  let clauseInc = 1.0;
  const seenLevelsBuf = new Uint8Array(numVars + 2);

  const ensureSeenLevels = (lvl: number): Uint8Array => {
    if (lvl + 2 > seenLevelsBuf.length) {
      // El tamaño máximo de un nivel está acotado por numVars, así que esto
      // no debería disparar; pero por seguridad reasignamos sin tirar el
      // buffer existente.
      const grown = new Uint8Array(lvl + 2);
      grown.set(seenLevelsBuf);
      return grown;
    }
    return seenLevelsBuf;
  };

  // --- API interna ---

  const currentLevel = (): number => trailLim.length;

  const litIsTrue = (lit: number): boolean => (lit > 0 ? varVal[lit] === 1 : varVal[-lit] === -1);

  const litIsFalse = (lit: number): boolean => (lit > 0 ? varVal[lit] === -1 : varVal[-lit] === 1);

  const enqueue = (lit: number, lev: number, reason: number): boolean => {
    const v = Math.abs(lit);
    if (varVal[v] !== 0) return litIsTrue(lit);
    varVal[v] = lit > 0 ? 1 : -1;
    varLevel[v] = lev;
    varAnte[v] = reason;
    trail.push(lit);
    phases.save(lit);
    stats.propagations++;
    return true;
  };

  // BCP — propagación booleana con watched literals.
  const propagate = (): number => {
    while (qHead < trail.length) {
      const p = trail[qHead++];
      const falseLit = -p;
      const wIdx = litToIdx(falseLit, numVars);
      const wl = watches[wIdx];
      let j = 0;

      for (let i = 0; i < wl.length; i++) {
        const ci = wl[i];
        const c = allClauses[ci];
        if (!c || c.length < 2) {
          wl[j++] = ci;
          continue;
        }

        // Aseguramos que falseLit esté en c[1] para tener c[0] como "otro watch".
        if (c[0] === falseLit) {
          const tmp = c[0];
          c[0] = c[1];
          c[1] = tmp;
        }

        if (litIsTrue(c[0])) {
          wl[j++] = ci;
          continue;
        }

        // Buscar reemplazo para el watch en c[1].
        let found = false;
        for (let k = 2; k < c.length; k++) {
          if (!litIsFalse(c[k])) {
            const tmp = c[1];
            c[1] = c[k];
            c[k] = tmp;
            const newWatch = watches[litToIdx(c[1], numVars)];
            if (newWatch) newWatch.push(ci);
            found = true;
            break;
          }
        }
        if (found) continue;

        // No hay reemplazo: c[0] queda como única esperanza.
        wl[j++] = ci;

        if (litIsFalse(c[0])) {
          // CONFLICTO: copiamos el resto de la watch list intacta y salimos.
          for (let r = i + 1; r < wl.length; r++) wl[j++] = wl[r];
          wl.length = j;
          qHead = trail.length;
          return ci;
        }

        // Unit propagation sobre c[0].
        if (!enqueue(c[0], currentLevel(), ci)) {
          for (let r = i + 1; r < wl.length; r++) wl[j++] = wl[r];
          wl.length = j;
          qHead = trail.length;
          return ci;
        }
      }
      wl.length = j;
    }
    return NO_CONFLICT;
  };

  const backtrack = (target: number): void => {
    if (currentLevel() <= target) return;
    const btPoint = target < trailLim.length ? trailLim[target] : trail.length;
    for (let i = trail.length - 1; i >= btPoint; i--) {
      const v = Math.abs(trail[i]);
      varVal[v] = 0;
      varLevel[v] = -1;
      varAnte[v] = NO_ANTECEDENT;
    }
    trail.length = btPoint;
    trailLim.length = target;
    qHead = btPoint;
  };

  const bumpClauseAct = (ci: number): void => {
    const meta = learnedMeta.get(ci);
    if (!meta) return;
    meta.activity += clauseInc;
    if (meta.activity > 1e20) {
      for (const m of learnedMeta.values()) m.activity *= 1e-20;
      clauseInc *= 1e-20;
    }
  };

  const decayClauseAct = (): void => {
    clauseInc /= o.clauseDecay;
  };

  const addLearnedClause = (learned: Int32Array, lbd: number): number => {
    const ci = allClauses.length;
    allClauses.push(learned);
    stats.learnedClauses++;
    if (learned.length >= 2) {
      const w0 = watches[litToIdx(learned[0], numVars)];
      const w1 = watches[litToIdx(learned[1], numVars)];
      if (w0) w0.push(ci);
      if (w1) w1.push(ci);
    }
    learnedMeta.set(ci, {
      index: ci,
      lbd,
      activity: clauseInc,
      locked: false,
      length: learned.length,
    });
    return ci;
  };

  // Reducción de cláusulas aprendidas: marca locked las que actualmente
  // sirven como antecedente, calcula candidatas y reescribe arrays + watches.
  const reduceLearnedDB = (): void => {
    if (learnedMeta.size < 100) return;
    // Marcar locked.
    for (const m of learnedMeta.values()) m.locked = false;
    for (let v = 1; v <= numVars; v++) {
      const ante = varAnte[v];
      if (ante !== NO_ANTECEDENT && ante >= originalCount) {
        const m = learnedMeta.get(ante);
        if (m) m.locked = true;
      }
    }
    const toRemove = new Set(
      selectClausesToRemove(Array.from(learnedMeta.values()), o.lbdReduceThreshold),
    );
    if (toRemove.size === 0) return;

    const oldToNew = new Map<number, number>();
    const newClauses: Clause[] = [];
    for (let ci = 0; ci < allClauses.length; ci++) {
      if (toRemove.has(ci)) continue;
      oldToNew.set(ci, newClauses.length);
      newClauses.push(allClauses[ci]);
    }

    // Reindexar antecedentes.
    for (let v = 1; v <= numVars; v++) {
      const ante = varAnte[v];
      if (ante !== NO_ANTECEDENT) {
        const mapped = oldToNew.get(ante);
        varAnte[v] = mapped !== undefined ? mapped : NO_ANTECEDENT;
      }
    }

    // Reindexar learnedMeta.
    const newMeta = new Map<number, LearnedMeta>();
    for (const [oldIdx, meta] of learnedMeta) {
      const newIdx = oldToNew.get(oldIdx);
      if (newIdx === undefined) continue;
      meta.index = newIdx;
      newMeta.set(newIdx, meta);
    }
    learnedMeta.clear();
    for (const [k, v] of newMeta) learnedMeta.set(k, v);

    stats.reducedClauses += toRemove.size;
    allClauses.length = 0;
    for (const c of newClauses) allClauses.push(c);
    rebuildWatches();
  };

  // --- Setup: cláusulas unitarias iniciales como propagaciones de nivel 0. ---

  for (let ci = 0; ci < allClauses.length; ci++) {
    const c = allClauses[ci];
    if (c.length === 1) {
      const lit = c[0];
      const v = Math.abs(lit);
      if (varVal[v] !== 0) {
        if (!litIsTrue(lit)) {
          stats.solveTimeMs = Date.now() - startTime;
          return makeUnsat([v], stats);
        }
        continue;
      }
      if (!enqueue(lit, 0, ci)) {
        stats.solveTimeMs = Date.now() - startTime;
        return makeUnsat([v], stats);
      }
    }
  }

  let conflict = propagate();
  if (conflict !== NO_CONFLICT) {
    stats.solveTimeMs = Date.now() - startTime;
    return makeUnsat(extractCoreFromClause(allClauses[conflict]), stats);
  }

  let conflictsUntilRestart = restarter.next();
  let conflictsSinceRestart = 0;
  // Trigger inicial: reducir cuando el #learned excede una cuota.
  let learnedQuota = Math.max(100, Math.floor(originalCount / 3));

  while (true) {
    if (Date.now() - startTime > o.timeoutMs) {
      stats.solveTimeMs = Date.now() - startTime;
      // Timeout — devolvemos UNSAT con core vacío como señal pesimista.
      return makeUnsat([], stats);
    }

    const v = vsids.pick(varVal);
    if (v === 0) {
      // No quedan variables libres ⇒ SAT.
      const model = buildModel(varVal, numVars, o.atomNames);
      stats.solveTimeMs = Date.now() - startTime;
      return makeSat(model, stats);
    }

    stats.decisions++;
    trailLim.push(trail.length);
    if (trailLim.length > stats.maxDecisionLevel) stats.maxDecisionLevel = trailLim.length;
    enqueue(phases.pickLit(v), currentLevel(), NO_ANTECEDENT);
    conflict = propagate();

    while (conflict !== NO_CONFLICT) {
      stats.conflicts++;
      conflictsSinceRestart++;

      if (currentLevel() === 0) {
        stats.solveTimeMs = Date.now() - startTime;
        const conflictClause = allClauses[conflict];
        return makeUnsat(conflictClause ? extractCoreFromClause(conflictClause) : [], stats);
      }

      const result = analyzeConflict1UIP(conflict, {
        clauses: allClauses,
        trail,
        currentLevel: currentLevel(),
        varLevel,
        varAnte,
      });

      // Bump activities de variables tocadas, luego decay.
      for (const bv of result.bumped) vsids.bump(bv);
      vsids.decayStep();

      // Si la "cláusula" aprendida es vacía con btLevel = -1, UNSAT.
      if (result.learned.length === 0 || result.btLevel < 0) {
        stats.solveTimeMs = Date.now() - startTime;
        return makeUnsat(result.bumped, stats);
      }

      // Si la cláusula aprendida bumpeó cláusula raíz, también bumpeamos su act.
      bumpClauseAct(conflict);
      decayClauseAct();

      backtrack(result.btLevel);

      if (result.learned.length === 1) {
        // Asignación forzada a nivel 0.
        if (!enqueue(result.learned[0], 0, NO_ANTECEDENT)) {
          stats.solveTimeMs = Date.now() - startTime;
          return makeUnsat(result.bumped, stats);
        }
      } else {
        const lbdBuf = ensureSeenLevels(stats.maxDecisionLevel);
        const lbd = computeLBD(result.learned, varLevel, lbdBuf);
        const newCi = addLearnedClause(result.learned, lbd);
        if (!enqueue(result.learned[0], result.btLevel, newCi)) {
          stats.solveTimeMs = Date.now() - startTime;
          return makeUnsat(result.bumped, stats);
        }
      }

      conflict = propagate();
    }

    if (conflictsSinceRestart >= conflictsUntilRestart) {
      stats.restarts++;
      backtrack(0);
      conflictsSinceRestart = 0;
      conflictsUntilRestart = restarter.next();
    }

    if (learnedMeta.size > learnedQuota) {
      reduceLearnedDB();
      learnedQuota = Math.max(100, learnedMeta.size + Math.floor(originalCount / 2));
    }
  }
}

function makeSat(model: Record<string, boolean>, stats: SolverStatsV2): SatResult {
  return { sat: true, model, stats };
}

function makeUnsat(core: number[], stats: SolverStatsV2): UnsatResult {
  return { unsat: true, core, stats };
}

/** Extrae las variables de una cláusula como "core" pesimista. */
function extractCoreFromClause(c: Int32Array): number[] {
  const out: number[] = [];
  for (let i = 0; i < c.length; i++) out.push(Math.abs(c[i] ?? 0));
  return out;
}
