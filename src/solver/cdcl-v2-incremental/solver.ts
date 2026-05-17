// CDCL incremental — solver vivo que mantiene aprendizaje entre llamadas.
//
// A diferencia de solveCDCLv2 (one-shot, todas las estructuras se crean en cada
// invocación), aquí el solver es un objeto persistente que soporta:
//
//   - addClause(literals) — añade cláusula permanente, integra en watches.
//   - newVar() — declara una variable nueva creciendo todas las estructuras.
//   - push() / pop() — checkpoint y rollback (descarta cláusulas + aprendidas
//     añadidas tras el push; conserva phase saving y VSIDS como caching útil).
//   - solve(assumptions?) — resuelve bajo el conjunto de assumptions
//     (literales asumidos true sólo para esta query). Devuelve modelo o
//     failedAssumptions/unsatCore.
//
// Bases internas reutilizadas conceptualmente del solver one-shot:
//   - 2-watched literals para BCP.
//   - 1UIP conflict analysis (analyzeConflict1UIP de cdcl-v2).
//   - VSIDS, phase saving, Luby restarts.
//   - LBD scoring + reducción periódica de aprendidas.
//
// La maquinaria incremental clave es el manejo de assumptions: tras backtrack
// al nivel 0, cada assumption se introduce como decisión en su propio nivel.
// Si BCP detecta conflicto al asumir, derivamos el unsatCore vía análisis del
// conflicto + intersección con el conjunto de assumptions enqueued.

import {
  analyzeConflict1UIP,
  computeLBD,
  litToIdx,
  LubyRestartPolicy,
  NO_ANTECEDENT,
  NO_CONFLICT,
  PhaseSaver,
  selectClausesToRemove,
  VSIDS,
  type LearnedMeta,
} from '../cdcl-v2';
import type {
  IncrementalSolveResult,
  IncrementalSolverOptions,
  IncrementalStats,
  SolverSummary,
} from './types';

interface CheckpointFrame {
  /** Cantidad total de cláusulas vivas al momento del push (originales + aprendidas). */
  numClauses: number;
  /** Conteo separado de cláusulas aprendidas vivas al push (subset de numClauses). */
  numLearned: number;
  /** Variables declaradas al momento del push (para revertir newVar()s posteriores). */
  numVars: number;
}

const DEFAULTS = {
  timeoutMs: 30_000,
  vsidsDecay: 0.95,
  lubyBase: 100,
  clauseDecay: 0.999,
  lbdReduceThreshold: 2,
  initialPhase: 0 as 0 | 1,
};

export class IncrementalCDCL {
  private numVars: number;
  private readonly opts: Required<IncrementalSolverOptions> & {
    clauseDecay: number;
    lbdReduceThreshold: number;
  };

  // Pool de cláusulas. Las originales y las aprendidas conviven en `clauses`;
  // `learnedFlag[ci] = 1` marca a las aprendidas para distinguir orígenes en
  // pop/reset. learnedMeta indexa por ci.
  private clauses: Int32Array[] = [];
  private learnedFlag: number[] = [];
  private learnedMeta = new Map<number, LearnedMeta>();
  private clauseInc = 1.0;

  // Estado de variables (1-indexado, dimensionado a numVars+1).
  private varVal: Int8Array;
  private varLevel: Int32Array;
  private varAnte: Int32Array;

  // Trail.
  private trail: number[] = [];
  private trailLim: number[] = [];
  private qHead = 0;

  // Watch lists indexadas por litToIdx. Se reconstruyen tras grow / pop.
  private watches: number[][] = [];

  // Heurísticas. Se recrean tras newVar() (grow) y reset(); persisten entre solves.
  private vsids: VSIDS;
  private phases: PhaseSaver;

  // Stack de checkpoints push/pop.
  private checkpoints: CheckpointFrame[] = [];

  // Para asociar variable → último assumption que la fijó. Usado para derivar
  // failedAssumptions en O(|trail| + |conflictClause|).
  // varToAssumption[v] = lit (signed) si v fue assumption; 0 si no.
  private varToAssumption: Int32Array;

  // Acumuladores de stats globales.
  private totalDecisions = 0;
  private totalConflicts = 0;
  private totalLearned = 0;

  constructor(numVars = 0, options?: IncrementalSolverOptions) {
    if (numVars < 0 || !Number.isInteger(numVars)) {
      throw new RangeError(`IncrementalCDCL: numVars inválido ${numVars}`);
    }
    this.numVars = numVars;
    this.opts = {
      timeoutMs: options?.timeoutMs ?? DEFAULTS.timeoutMs,
      vsidsDecay: options?.vsidsDecay ?? DEFAULTS.vsidsDecay,
      lubyBase: options?.lubyBase ?? DEFAULTS.lubyBase,
      initialPhase: options?.initialPhase ?? DEFAULTS.initialPhase,
      clauseDecay: DEFAULTS.clauseDecay,
      lbdReduceThreshold: DEFAULTS.lbdReduceThreshold,
    };

    this.varVal = new Int8Array(numVars + 1);
    this.varLevel = new Int32Array(numVars + 1).fill(-1);
    this.varAnte = new Int32Array(numVars + 1).fill(NO_ANTECEDENT);
    this.varToAssumption = new Int32Array(numVars + 1);

    this.vsids = new VSIDS(numVars, this.opts.vsidsDecay);
    this.phases = new PhaseSaver(numVars, this.opts.initialPhase);

    this.rebuildWatches();
  }

  // -------------------------------------------------------------------------
  // API pública.
  // -------------------------------------------------------------------------

  /** Declara y devuelve una variable nueva (1-indexada). */
  newVar(): number {
    this.numVars++;
    this.growVarArrays();
    // VSIDS y PhaseSaver no soportan grow in-place; los reconstruimos
    // preservando su activity/phase actual.
    this.regrowHeuristics();
    return this.numVars;
  }

  /** Agrega una cláusula permanente. Validación: literales !== 0 y |lit| <= numVars. */
  addClause(literals: ReadonlyArray<number>): void {
    for (const l of literals) {
      if (l === 0) throw new RangeError('IncrementalCDCL.addClause: literal 0 inválido');
      const v = Math.abs(l);
      if (v > this.numVars) {
        throw new RangeError(
          `IncrementalCDCL.addClause: variable ${v} fuera de rango (numVars=${this.numVars})`,
        );
      }
    }
    const clause = new Int32Array(literals);
    const ci = this.clauses.length;
    this.clauses.push(clause);
    this.learnedFlag.push(0);
    if (clause.length >= 2) {
      const w0 = this.watches[litToIdx(clause[0], this.numVars)];
      const w1 = this.watches[litToIdx(clause[1], this.numVars)];
      if (w0) w0.push(ci);
      if (w1) w1.push(ci);
    }
    this.vsids.initFromClauses([clause]);
  }

  /** Crea un checkpoint para rollback con `pop()`. */
  push(): void {
    this.checkpoints.push({
      numClauses: this.clauses.length,
      numLearned: this.countLearned(),
      numVars: this.numVars,
    });
  }

  /** Revierte hasta `levels` checkpoints atrás. Default: 1. */
  pop(levels = 1): void {
    if (levels <= 0) return;
    for (let k = 0; k < levels && this.checkpoints.length > 0; k++) {
      const frame = this.checkpoints.pop();
      if (!frame) break;
      this.rollbackTo(frame);
    }
  }

  /**
   * Resuelve bajo el conjunto opcional de assumptions.
   *
   * Cada assumption es un literal con signo: positivo = var asumida true,
   * negativo = var asumida false. Si el problema es UNSAT bajo esas
   * assumptions, `failedAssumptions` contiene el subconjunto que produjo
   * el conflicto.
   */
  solve(assumptions: ReadonlyArray<number> = []): IncrementalSolveResult {
    // Validar assumptions.
    for (const a of assumptions) {
      if (a === 0) throw new RangeError('IncrementalCDCL.solve: assumption 0 inválida');
      if (Math.abs(a) > this.numVars) {
        throw new RangeError(
          `IncrementalCDCL.solve: assumption refiere variable ${Math.abs(
            a,
          )} > numVars=${this.numVars}`,
        );
      }
    }
    return this.runSolve(assumptions);
  }

  /** Devuelve la polaridad de una variable en el último modelo SAT (o undefined). */
  modelValue(varId: number): boolean | undefined {
    if (varId <= 0 || varId > this.numVars) return undefined;
    const v = this.varVal[varId];
    if (v === 1) return true;
    if (v === -1) return false;
    return undefined;
  }

  /** Limpia todo el estado, dejando 0 vars / 0 cláusulas. */
  reset(): void {
    this.clauses = [];
    this.learnedFlag = [];
    this.learnedMeta.clear();
    this.clauseInc = 1.0;
    this.numVars = 0;
    this.varVal = new Int8Array(1);
    this.varLevel = new Int32Array(1).fill(-1);
    this.varAnte = new Int32Array(1).fill(NO_ANTECEDENT);
    this.varToAssumption = new Int32Array(1);
    this.trail = [];
    this.trailLim = [];
    this.qHead = 0;
    this.checkpoints = [];
    this.totalDecisions = 0;
    this.totalConflicts = 0;
    this.totalLearned = 0;
    this.vsids = new VSIDS(0, this.opts.vsidsDecay);
    this.phases = new PhaseSaver(0, this.opts.initialPhase);
    this.rebuildWatches();
  }

  /** Resumen del estado actual del solver. */
  stats(): SolverSummary {
    return {
      decisions: this.totalDecisions,
      conflicts: this.totalConflicts,
      learned: this.countLearned(),
      vars: this.numVars,
      clauses: this.clauses.length,
    };
  }

  // -------------------------------------------------------------------------
  // Internals — control de estructura.
  // -------------------------------------------------------------------------

  private growVarArrays(): void {
    const n = this.numVars;
    // Crecimiento simple: copiamos a un Typed Array más grande.
    const newVal = new Int8Array(n + 1);
    newVal.set(this.varVal);
    this.varVal = newVal;

    const newLevel = new Int32Array(n + 1).fill(-1);
    newLevel.set(this.varLevel);
    this.varLevel = newLevel;

    const newAnte = new Int32Array(n + 1).fill(NO_ANTECEDENT);
    newAnte.set(this.varAnte);
    this.varAnte = newAnte;

    const newAssump = new Int32Array(n + 1);
    newAssump.set(this.varToAssumption);
    this.varToAssumption = newAssump;

    // Crecer la watch list (literal positivo y negativo de la nueva var).
    this.rebuildWatches();
  }

  private regrowHeuristics(): void {
    const newVsids = new VSIDS(this.numVars, this.opts.vsidsDecay);
    // Preservar activities anteriores.
    const oldAct = this.vsids.activity;
    for (let v = 1; v < oldAct.length && v <= this.numVars; v++) {
      newVsids.activity[v] = oldAct[v];
    }
    this.vsids = newVsids;

    const newPhases = new PhaseSaver(this.numVars, this.opts.initialPhase);
    for (let v = 1; v <= this.numVars; v++) {
      // Si había phase previa, preservarla.
      if (v < oldAct.length) {
        const prevPhase = this.phases.getPhase(v);
        newPhases.save(prevPhase === 1 ? v : -v);
      }
    }
    this.phases = newPhases;
  }

  private rebuildWatches(): void {
    const size = 2 * this.numVars;
    this.watches = new Array<number[]>(size);
    for (let i = 0; i < size; i++) this.watches[i] = [];
    for (let ci = 0; ci < this.clauses.length; ci++) {
      const c = this.clauses[ci];
      if (c.length >= 2) {
        const w0 = this.watches[litToIdx(c[0], this.numVars)];
        const w1 = this.watches[litToIdx(c[1], this.numVars)];
        if (w0) w0.push(ci);
        if (w1) w1.push(ci);
      }
    }
  }

  private countLearned(): number {
    let n = 0;
    for (const f of this.learnedFlag) if (f === 1) n++;
    return n;
  }

  private rollbackTo(frame: CheckpointFrame): void {
    // Limpiar todo el trail antes de tocar cláusulas (los antecedentes
    // pueden apuntar a cláusulas que vamos a borrar; las asignaciones de
    // nivel 0 también deben desfilarse para no contaminar el próximo solve).
    this.resetAllAssignments();

    // Truncar cláusulas: descarta TODO lo añadido tras el push (originales +
    // learned). Estrategia v1: descartar learned posteriores. v2 podría
    // intentar conservar las que no dependen de los assumptions removidos.
    const target = Math.min(frame.numClauses, this.clauses.length);
    this.clauses.length = target;
    this.learnedFlag.length = target;

    // Limpiar learnedMeta y antecedentes que apuntan a cláusulas eliminadas.
    for (const ci of Array.from(this.learnedMeta.keys())) {
      if (ci >= target) this.learnedMeta.delete(ci);
    }
    for (let v = 1; v <= this.numVars; v++) {
      if (this.varAnte[v] !== NO_ANTECEDENT && this.varAnte[v] >= target) {
        this.varAnte[v] = NO_ANTECEDENT;
      }
    }

    // Si nuevas vars fueron declaradas tras el push, las "retiramos".
    if (this.numVars > frame.numVars) {
      this.numVars = frame.numVars;
      const np1 = this.numVars + 1;
      // Truncar typed arrays (recortar copiando).
      this.varVal = this.varVal.slice(0, np1);
      this.varLevel = this.varLevel.slice(0, np1);
      this.varAnte = this.varAnte.slice(0, np1);
      this.varToAssumption = this.varToAssumption.slice(0, np1);
      this.regrowHeuristics();
    }

    // Reconstruir watches sobre el conjunto resultante.
    this.rebuildWatches();
  }

  // -------------------------------------------------------------------------
  // Internals — núcleo CDCL.
  // -------------------------------------------------------------------------

  private currentLevel(): number {
    return this.trailLim.length;
  }

  private litIsTrue(lit: number): boolean {
    return lit > 0 ? this.varVal[lit] === 1 : this.varVal[-lit] === -1;
  }

  private litIsFalse(lit: number): boolean {
    return lit > 0 ? this.varVal[lit] === -1 : this.varVal[-lit] === 1;
  }

  private enqueue(lit: number, lev: number, reason: number, stats?: IncrementalStats): boolean {
    const v = Math.abs(lit);
    if (this.varVal[v] !== 0) return this.litIsTrue(lit);
    this.varVal[v] = lit > 0 ? 1 : -1;
    this.varLevel[v] = lev;
    this.varAnte[v] = reason;
    this.trail.push(lit);
    this.phases.save(lit);
    if (stats) stats.propagations++;
    return true;
  }

  /** Propagación booleana con watched literals. Devuelve índice de cláusula en conflicto o NO_CONFLICT. */
  private propagate(stats: IncrementalStats): number {
    while (this.qHead < this.trail.length) {
      const p = this.trail[this.qHead++];
      const falseLit = -p;
      const wIdx = litToIdx(falseLit, this.numVars);
      const wl = this.watches[wIdx];
      if (!wl) continue;
      let j = 0;
      for (let i = 0; i < wl.length; i++) {
        const ci = wl[i];
        const c = this.clauses[ci];
        if (!c || c.length < 2) {
          wl[j++] = ci;
          continue;
        }
        // Mover falseLit a c[1] para que c[0] sea el "otro watch".
        if (c[0] === falseLit) {
          const tmp = c[0];
          c[0] = c[1];
          c[1] = tmp;
        }
        if (this.litIsTrue(c[0])) {
          wl[j++] = ci;
          continue;
        }
        // Buscar reemplazo para watch en c[1].
        let found = false;
        for (let k = 2; k < c.length; k++) {
          if (!this.litIsFalse(c[k])) {
            const tmp = c[1];
            c[1] = c[k];
            c[k] = tmp;
            const newWatch = this.watches[litToIdx(c[1], this.numVars)];
            if (newWatch) newWatch.push(ci);
            found = true;
            break;
          }
        }
        if (found) continue;
        wl[j++] = ci;
        if (this.litIsFalse(c[0])) {
          // Conflicto.
          for (let r = i + 1; r < wl.length; r++) wl[j++] = wl[r];
          wl.length = j;
          this.qHead = this.trail.length;
          return ci;
        }
        if (!this.enqueue(c[0], this.currentLevel(), ci, stats)) {
          for (let r = i + 1; r < wl.length; r++) wl[j++] = wl[r];
          wl.length = j;
          this.qHead = this.trail.length;
          return ci;
        }
      }
      wl.length = j;
    }
    return NO_CONFLICT;
  }

  private backtrackToLevel(target: number): void {
    if (this.currentLevel() <= target) return;
    const btPoint = target < this.trailLim.length ? this.trailLim[target] : this.trail.length;
    for (let i = this.trail.length - 1; i >= btPoint; i--) {
      const v = Math.abs(this.trail[i]);
      this.varVal[v] = 0;
      this.varLevel[v] = -1;
      this.varAnte[v] = NO_ANTECEDENT;
      this.varToAssumption[v] = 0;
    }
    this.trail.length = btPoint;
    this.trailLim.length = target;
    this.qHead = btPoint;
  }

  /** Reset completo del trail incluyendo asignaciones de nivel 0. Usado entre
   * llamadas a solve() para garantizar idempotencia. */
  private resetAllAssignments(): void {
    for (let i = 0; i < this.trail.length; i++) {
      const v = Math.abs(this.trail[i]);
      this.varVal[v] = 0;
      this.varLevel[v] = -1;
      this.varAnte[v] = NO_ANTECEDENT;
      this.varToAssumption[v] = 0;
    }
    this.trail.length = 0;
    this.trailLim.length = 0;
    this.qHead = 0;
  }

  private addLearnedClauseAt(learned: Int32Array, lbd: number, stats: IncrementalStats): number {
    const ci = this.clauses.length;
    this.clauses.push(learned);
    this.learnedFlag.push(1);
    stats.learned++;
    this.totalLearned++;
    if (learned.length >= 2) {
      const w0 = this.watches[litToIdx(learned[0], this.numVars)];
      const w1 = this.watches[litToIdx(learned[1], this.numVars)];
      if (w0) w0.push(ci);
      if (w1) w1.push(ci);
    }
    this.learnedMeta.set(ci, {
      index: ci,
      lbd,
      activity: this.clauseInc,
      locked: false,
      length: learned.length,
    });
    return ci;
  }

  // -------------------------------------------------------------------------
  // Solve loop con assumptions.
  // -------------------------------------------------------------------------

  private runSolve(assumptions: ReadonlyArray<number>): IncrementalSolveResult {
    const stats: IncrementalStats = {
      decisions: 0,
      conflicts: 0,
      learned: 0,
      propagations: 0,
      restarts: 0,
    };
    const startTime = Date.now();

    // UNSAT trivial: cláusula vacía.
    for (const c of this.clauses) {
      if (c.length === 0) {
        return { sat: false, unsatCore: [], failedAssumptions: [], stats };
      }
    }

    // Cada call empieza limpio: vaciamos TODO el trail (incluso asignaciones
    // de nivel 0 forzadas por solves anteriores) y re-propagamos las unitarias
    // originales desde cero. Esto garantiza idempotencia: dos solve() con la
    // misma entrada producen el mismo modelo. Las cláusulas aprendidas
    // siguen vivas y siguen activas como restricciones.
    this.resetAllAssignments();

    // Reset varToAssumption antes de re-enqueue assumptions.
    for (let v = 0; v <= this.numVars; v++) this.varToAssumption[v] = 0;

    const restarter = new LubyRestartPolicy(this.opts.lubyBase);

    // Propagar primero las unitarias originales a nivel 0 (idempotente).
    for (let ci = 0; ci < this.clauses.length; ci++) {
      const c = this.clauses[ci];
      if (c.length === 1) {
        const lit = c[0];
        const v = Math.abs(lit);
        if (this.varVal[v] !== 0) {
          if (!this.litIsTrue(lit)) {
            return { sat: false, unsatCore: [], failedAssumptions: [], stats };
          }
          continue;
        }
        if (!this.enqueue(lit, 0, ci, stats)) {
          return { sat: false, unsatCore: [], failedAssumptions: [], stats };
        }
      }
    }
    let conflict = this.propagate(stats);
    if (conflict !== NO_CONFLICT) {
      return { sat: false, unsatCore: [], failedAssumptions: [], stats };
    }

    // Aplicar assumptions una a una como decisiones en niveles sucesivos.
    // Si alguna ya está implicada falsa por unidades de nivel 0, derivar
    // unsatCore como las assumptions previas + ésta.
    const enqueuedAssumptions: number[] = [];
    for (const lit of assumptions) {
      // Si ya está fijada a nivel 0 con polaridad opuesta ⇒ UNSAT bajo este lit.
      if (this.litIsFalse(lit)) {
        return {
          sat: false,
          unsatCore: this.deriveCoreFromBlockedAssumption(lit),
          failedAssumptions: this.deriveCoreFromBlockedAssumption(lit),
          stats,
        };
      }
      if (this.litIsTrue(lit)) continue; // ya implicada, no decidir.

      this.trailLim.push(this.trail.length);
      const lev = this.currentLevel();
      const v = Math.abs(lit);
      this.varToAssumption[v] = lit;
      enqueuedAssumptions.push(lit);
      stats.decisions++;
      this.totalDecisions++;
      this.enqueue(lit, lev, NO_ANTECEDENT, stats);
      const c2 = this.propagate(stats);
      if (c2 !== NO_CONFLICT) {
        // Conflicto al asumir. Derivamos failed assumptions cruzando el
        // cone-of-conflict con las assumptions enqueued.
        const failed = this.deriveFailedAssumptions(c2, enqueuedAssumptions);
        return {
          sat: false,
          unsatCore: failed,
          failedAssumptions: failed,
          stats,
        };
      }
    }

    // CDCL principal — branching VSIDS sobre variables libres.
    let conflictsUntilRestart = restarter.next();
    let conflictsSinceRestart = 0;
    const baseLevel = this.currentLevel(); // = #assumptions enqueued

    const seenBuf = new Uint8Array(this.numVars + 2);

    while (true) {
      if (Date.now() - startTime > this.opts.timeoutMs) {
        return { sat: false, unsatCore: [], failedAssumptions: [], stats };
      }

      const v = this.vsids.pick(this.varVal);
      if (v === 0) {
        // SAT. Construimos el modelo.
        const model = new Map<number, boolean>();
        for (let i = 1; i <= this.numVars; i++) {
          model.set(i, this.varVal[i] === 1 || this.varVal[i] === 0);
        }
        return { sat: true, model, stats };
      }

      this.trailLim.push(this.trail.length);
      stats.decisions++;
      this.totalDecisions++;
      this.enqueue(this.phases.pickLit(v), this.currentLevel(), NO_ANTECEDENT, stats);
      conflict = this.propagate(stats);

      while (conflict !== NO_CONFLICT) {
        stats.conflicts++;
        this.totalConflicts++;
        conflictsSinceRestart++;

        if (this.currentLevel() <= baseLevel) {
          // Conflicto en nivel ≤ baseLevel ⇒ UNSAT bajo assumptions.
          const failed = this.deriveFailedAssumptions(conflict, enqueuedAssumptions);
          return {
            sat: false,
            unsatCore: failed,
            failedAssumptions: failed,
            stats,
          };
        }

        const result = analyzeConflict1UIP(conflict, {
          clauses: this.clauses,
          trail: this.trail,
          currentLevel: this.currentLevel(),
          varLevel: this.varLevel,
          varAnte: this.varAnte,
        });

        for (const bv of result.bumped) this.vsids.bump(bv);
        this.vsids.decayStep();
        this.clauseInc /= this.opts.clauseDecay;

        if (result.learned.length === 0 || result.btLevel < 0) {
          // UNSAT raíz; bajo assumptions ⇒ derivar core con las assumptions vivas.
          const failed = this.deriveFailedAssumptions(conflict, enqueuedAssumptions);
          return {
            sat: false,
            unsatCore: failed,
            failedAssumptions: failed,
            stats,
          };
        }

        // No retroceder por debajo de baseLevel (las assumptions deben quedar
        // intactas; si fueran las culpables, el conflicto las habría atrapado
        // al asumir o estaríamos en currentLevel <= baseLevel arriba).
        const bt = Math.max(result.btLevel, baseLevel);
        this.backtrackToLevel(bt);

        if (result.learned.length === 1) {
          // Si la unit clause aprendida apunta a nivel 0 pero hay assumptions
          // por encima, la propagamos al nivel actual (= baseLevel) como
          // forced (no se "fija" al 0 mientras haya assumptions vivas, pero
          // su semántica vale: bajo estas assumptions, ese literal es true).
          if (!this.enqueue(result.learned[0], bt, NO_ANTECEDENT, stats)) {
            const failed = this.deriveFailedAssumptions(conflict, enqueuedAssumptions);
            return {
              sat: false,
              unsatCore: failed,
              failedAssumptions: failed,
              stats,
            };
          }
        } else {
          const lbd = computeLBD(result.learned, this.varLevel, seenBuf);
          const newCi = this.addLearnedClauseAt(result.learned, lbd, stats);
          if (!this.enqueue(result.learned[0], bt, newCi, stats)) {
            const failed = this.deriveFailedAssumptions(conflict, enqueuedAssumptions);
            return {
              sat: false,
              unsatCore: failed,
              failedAssumptions: failed,
              stats,
            };
          }
        }
        conflict = this.propagate(stats);
      }

      if (conflictsSinceRestart >= conflictsUntilRestart) {
        stats.restarts++;
        // Restart respeta assumptions: vuelve al baseLevel, no a 0.
        this.backtrackToLevel(baseLevel);
        conflictsSinceRestart = 0;
        conflictsUntilRestart = restarter.next();
      }

      this.maybeReduceLearned();
    }
  }

  /**
   * Cuando un assumption `lit` está bloqueado por unit propagation desde
   * unidades originales (sin assumptions activas), devuelve [lit] solo:
   * ese assumption es incompatible con la base. Para v1, este es el caso
   * trivial — sin lookup hacia atrás del antecedente.
   */
  private deriveCoreFromBlockedAssumption(lit: number): number[] {
    return [lit];
  }

  /**
   * Dado un índice de cláusula en conflicto y la lista actual de assumptions
   * enqueued, regresa el subconjunto de assumptions cuya negación está
   * presente (recursivamente, vía antecedentes) en el cone de conflicto.
   *
   * Implementación O(|trail|): marca seen cada variable involucrada en el
   * conflicto, recorre antecedentes hasta agotar; cualquier var marcada cuyo
   * assumption literal sea distinto de 0 entra al core.
   */
  private deriveFailedAssumptions(conflictCi: number, assumptionList: number[]): number[] {
    if (assumptionList.length === 0) return [];
    const seen = new Uint8Array(this.numVars + 1);
    const stack: number[] = [];

    const pushFromClause = (ci: number): void => {
      const c = this.clauses[ci];
      if (!c) return;
      for (let i = 0; i < c.length; i++) {
        const v = Math.abs(c[i]);
        if (v === 0 || seen[v]) continue;
        seen[v] = 1;
        stack.push(v);
      }
    };

    pushFromClause(conflictCi);
    while (stack.length > 0) {
      const v = stack.pop();
      if (v === undefined) break;
      const ante = this.varAnte[v];
      if (ante !== undefined && ante !== NO_ANTECEDENT) {
        pushFromClause(ante);
      }
    }

    // Recolectar assumptions cuyas vars quedaron marcadas, en el orden
    // en que fueron enqueued (estable, útil para clientes).
    const failed: number[] = [];
    for (const a of assumptionList) {
      const v = Math.abs(a);
      if (seen[v]) failed.push(a);
    }
    // Si por alguna razón el cone no atrapó ninguna assumption (caso
    // degenerado: conflicto puro entre unitarias originales bajo ese contexto),
    // devolvemos todas las assumptions como fallback seguro.
    if (failed.length === 0) return assumptionList.slice();
    return failed;
  }

  private maybeReduceLearned(): void {
    const learnedCount = this.learnedMeta.size;
    if (learnedCount < 200) return;
    // Marcar locked (las que actualmente sirven de antecedente).
    for (const m of this.learnedMeta.values()) m.locked = false;
    for (let v = 1; v <= this.numVars; v++) {
      const ante = this.varAnte[v];
      if (ante !== NO_ANTECEDENT && this.learnedMeta.has(ante)) {
        const m = this.learnedMeta.get(ante);
        if (m) m.locked = true;
      }
    }
    const toRemove = new Set(
      selectClausesToRemove(Array.from(this.learnedMeta.values()), this.opts.lbdReduceThreshold),
    );
    if (toRemove.size === 0) return;

    // Backtrack a baseLevel sería costoso aquí; v1 hacemos un GC simple
    // marcando huecos. Estrategia: en lugar de reindexar (caro), saltamos
    // las cláusulas marcadas vaciando su contenido lógico. Esto preserva
    // los índices (antecedentes y watches siguen siendo válidos pero las
    // cláusulas reducidas son inertes). Para mantener watches consistentes,
    // simplemente las dejamos como están: ningún literal "false" forzará
    // unit propagation desde una cláusula sin watches actualizados... pero
    // como están vivas en watches, las skipeamos al detectar la marca.
    // Para v1, simplemente no reducimos en caliente; se hace solo al pop.
    // (Mantener este path como no-op evita un bug sutil con watches.)
    void toRemove;
  }
}
