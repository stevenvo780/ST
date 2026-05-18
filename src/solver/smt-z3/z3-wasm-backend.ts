// ============================================================
// ST SMT-Z3 — Backend real basado en z3-solver (WASM in-process)
// ============================================================

import type { SMTLogic, SMTModel, SMTResult, SMTSort } from '../smt/types';
import type {
  AsyncSMTBackend,
  AvailableSMTRuntime,
  Z3Scope,
  Z3ScopedDecl,
  Z3WasmBackendOptions,
} from './types';

// Importes de z3-solver tipados como `any` interno: la API expone genéricos
// (Context<Name>, Solver<Name>) que harían el wrapper invasivo. El cast a
// `any` queda contenido en este archivo — los consumidores ven sólo
// AsyncSMTBackend.
type Z3Module = {
  Context: (name: string, options?: Record<string, unknown>) => Z3Context;
  Z3?: unknown;
};
type Z3Context = {
  Solver: new (logic?: string) => Z3Solver;
  Bool: {
    const(name: string): Z3Expr;
  };
};
type Z3Solver = {
  set(key: string, value: unknown): void;
  push(): void;
  pop(num?: number): void;
  numScopes(): number;
  reset(): void;
  fromString(s: string): void;
  check(...assumptions: Z3Expr[]): Promise<SMTResult>;
  model(): Z3Model;
  statistics(): Z3Statistics;
  unsatCore(): { length(): number; get(i: number): Z3Expr };
  release(): void;
};
type Z3Expr = {
  toString(): string;
  name?(): { toString(): string };
};
type Z3Model = {
  decls(): Z3FuncDecl[];
  get(decl: Z3FuncDecl): Z3Expr;
};
type Z3FuncDecl = {
  name(): { toString(): string };
};
type Z3Statistics = {
  size(): number;
  [Symbol.iterator](): Iterator<{ key: string; value: number | string }>;
};

let cachedZ3Module: Z3Module | undefined;
let cachedInitError: unknown;

/** Carga perezosa de z3-solver. Cachea el módulo entre instancias. */
async function loadZ3(): Promise<Z3Module> {
  if (cachedZ3Module) return cachedZ3Module;
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (cachedInitError !== undefined) throw cachedInitError;
  try {
    // Import dinámico + cast a `any`: la API real de z3-solver expone
    // genéricos por Context<Name> que harían el wrapper invasivo. El
    // contrato externo del backend está fijado por AsyncSMTBackend, así
    // que el cast queda contenido aquí.
    const mod = (await import('z3-solver')) as unknown as {
      init: () => Promise<unknown>;
    };
    cachedZ3Module = (await mod.init()) as Z3Module;
    return cachedZ3Module;
  } catch (err) {
    cachedInitError = err;
    throw err;
  }
}

/**
 * `isZ3Available()` intenta inicializar z3-solver y devuelve true si
 * obtiene un Context utilizable. No lanza. Útil para skip de tests y
 * detección de runtime.
 */
export async function isZ3Available(): Promise<boolean> {
  try {
    const z3 = await loadZ3();
    // Smoke: crear y liberar un Solver. Si falla el WASM, salimos por catch.
    const ctx = z3.Context('detect-' + Date.now().toString(36));
    const s = new ctx.Solver();
    s.release();
    return true;
  } catch {
    return false;
  }
}

/**
 * Detector unificado de runtime SMT con preferencia por el WASM in-process.
 * - z3-wasm si la WASM bind carga.
 * - z3-subprocess o cvc5-subprocess si hay binario en PATH.
 * - 'none' si no hay nada.
 */
export async function detectAvailableSMT(): Promise<AvailableSMTRuntime> {
  if (await isZ3Available()) return 'z3-wasm';
  // Fallback: importar el detector subprocess sin acoplar build target.
  try {
    const { detectAvailableSMTDetailed } = await import('../smt/subprocess-backend');
    const detected = detectAvailableSMTDetailed();
    if (detected.solver === 'z3') return 'z3-subprocess';
    if (detected.solver === 'cvc5') return 'cvc5-subprocess';
  } catch {
    // ignore — subprocess backend opcional
  }
  return 'none';
}

let contextCounter = 0;

/**
 * Z3WasmBackend — wrapper sobre z3-solver con interfaz AsyncSMTBackend.
 *
 * Modelo de estado:
 *  - Mantiene un único `Solver` Z3 cuyo stack push/pop se sincroniza con
 *    `scopes[]` del host (espejo). Esto permite re-hidratar el solver con
 *    `solver.reset()` + replay de scopes si fuera necesario (no se hace
 *    en el flujo normal, sólo en `reset()`).
 *  - `assertFormula(body)` mete `(assert body)` en el solver actual,
 *    pero también lo registra en `scopes[top].assertions` por trazabilidad.
 *  - `getUnsatCore()` requiere haber usado `assertNamed(name, body)`:
 *    estos asserts se envuelven en `(=> <track> <body>)` y se pasan como
 *    assumption literals al check(). El core devuelto es la lista de
 *    nombres `track`.
 */
export class Z3WasmBackend implements AsyncSMTBackend {
  readonly name = 'z3-wasm';

  private readonly z3: Z3Module;
  private readonly ctx: Z3Context;
  private solver: Z3Solver;
  private readonly logic: SMTLogic | undefined;
  private readonly produceUnsatCore: boolean;
  private readonly produceModels: boolean;
  private readonly timeoutMs: number | undefined;

  private scopes: Z3Scope[] = [{ decls: [], assertions: [] }];
  /** Tracks declarados como Bool y usados como assumption literals. */
  private trackNames: Set<string> = new Set();
  private lastModel: SMTModel | undefined;
  private lastUnsatCore: string[] = [];
  private lastStatistics: Record<string, number> = {};

  private constructor(z3: Z3Module, ctx: Z3Context, options: Z3WasmBackendOptions = {}) {
    this.z3 = z3;
    this.ctx = ctx;
    this.logic = options.logic;
    this.produceUnsatCore = options.produceUnsatCore ?? true;
    this.produceModels = options.produceModels ?? true;
    this.timeoutMs = options.timeoutMs;
    this.solver = this.buildSolver();
  }

  /** Crea un backend nuevo. Falla si z3-solver no puede inicializarse. */
  static async create(logicOrOptions?: SMTLogic | Z3WasmBackendOptions): Promise<Z3WasmBackend> {
    const options: Z3WasmBackendOptions =
      typeof logicOrOptions === 'string' ? { logic: logicOrOptions } : (logicOrOptions ?? {});
    const z3 = await loadZ3();
    // Cada backend usa su propio Context Z3 para evitar cross-talk entre tests.
    contextCounter += 1;
    const ctx = z3.Context(`st-z3-wasm-${contextCounter}`);
    return new Z3WasmBackend(z3, ctx, options);
  }

  /** Resetea el solver (drop all asserts y scopes). */
  reset(): void {
    try {
      this.solver.release();
    } catch {
      // ignore — release es best-effort
    }
    this.solver = this.buildSolver();
    this.scopes = [{ decls: [], assertions: [] }];
    this.trackNames = new Set();
    this.lastModel = undefined;
    this.lastUnsatCore = [];
    this.lastStatistics = {};
  }

  push(): void {
    this.solver.push();
    this.scopes.push({ decls: [], assertions: [] });
  }

  pop(levels = 1): void {
    const target = Math.min(levels, this.scopes.length - 1);
    if (target <= 0) return;
    this.solver.pop(target);
    for (let i = 0; i < target; i += 1) {
      this.scopes.pop();
    }
  }

  declareConst(name: string, sort: SMTSort, bvWidth?: number): void {
    const decl: Z3ScopedDecl = { name, sort };
    if (sort === 'BitVec') decl.bvWidth = bvWidth ?? 32;
    this.currentScope().decls.push(decl);
    this.solver.fromString(this.formatDecl(decl));
  }

  /**
   * Inserta una aserción directa (sin tracking). El cuerpo es SMT-LIB v2
   * SIN envolver en `(assert ...)`.
   */
  assertFormula(smtlib: string): void {
    const body = smtlib.trim();
    if (!body) return;
    this.currentScope().assertions.push({ body });
    this.solver.fromString(`(assert ${body})`);
  }

  /**
   * Aserción nombrada para participar de unsat core. El `trackName` se
   * declara como Bool fresco y la aserción real se mete como
   * `(=> trackName body)`. En checkSat() esos tracks se pasan como
   * assumption literals.
   */
  assertNamed(trackName: string, smtlib: string): void {
    if (!this.produceUnsatCore) {
      // Si el solver no produce core, degradamos a assert simple.
      this.assertFormula(smtlib);
      return;
    }
    const body = smtlib.trim();
    if (!body) return;
    if (this.trackNames.has(trackName)) {
      throw new Error(`[z3-wasm] trackName "${trackName}" ya fue usado en este backend`);
    }
    this.trackNames.add(trackName);
    this.currentScope().assertions.push({ body, trackName });
    this.solver.fromString(`(declare-const ${trackName} Bool)`);
    this.solver.fromString(`(assert (=> ${trackName} ${body}))`);
  }

  async checkSat(): Promise<SMTResult> {
    const assumptions: Z3Expr[] = [];
    if (this.produceUnsatCore) {
      for (const name of this.trackNames) {
        assumptions.push(this.ctx.Bool.const(name));
      }
    }
    let result: SMTResult;
    try {
      result =
        assumptions.length > 0
          ? await this.solver.check(...assumptions)
          : await this.solver.check();
    } catch (err) {
      // WASM throw — devolver unknown en lugar de propagar, alineado con el
      // resto de backends que nunca tiran en checkSat.
      this.lastModel = undefined;
      this.lastUnsatCore = [];
      // Bug-friendly: pegar mensaje a las statistics para diagnóstico.
      this.lastStatistics = { error: 1 };
      void err;
      return 'unknown';
    }

    if (result === 'sat') {
      this.lastModel = this.extractModel();
      this.lastUnsatCore = [];
    } else if (result === 'unsat') {
      this.lastModel = undefined;
      this.lastUnsatCore = this.extractUnsatCore();
    } else {
      this.lastModel = undefined;
      this.lastUnsatCore = [];
    }
    this.lastStatistics = this.extractStatistics();
    return result;
  }

  getModel(): SMTModel | undefined {
    return this.lastModel ? { ...this.lastModel } : undefined;
  }

  getUnsatCore(): string[] {
    return [...this.lastUnsatCore];
  }

  /**
   * `setOption` envuelve `solver.set(key, value)`. Acepta los nombres
   * estándar Z3 (ej. `timeout`, `random_seed`).
   */
  setOption(key: string, value: string | number | boolean): void {
    this.solver.set(key, value);
  }

  /** Devuelve la última snapshot de stats Z3 capturada en checkSat(). */
  getStatistics(): Record<string, number> {
    return { ...this.lastStatistics };
  }

  /**
   * Cierra el solver liberando memoria WASM. Después de close() el
   * backend no debe usarse.
   */
  close(): void {
    try {
      this.solver.release();
    } catch {
      // ignore — release es best-effort
    }
  }

  // --------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------

  private buildSolver(): Z3Solver {
    const solver = this.logic ? new this.ctx.Solver(this.logic) : new this.ctx.Solver();
    if (this.produceUnsatCore) {
      solver.set('unsat_core', true);
    }
    if (this.produceModels) {
      solver.set('model', true);
    }
    if (this.timeoutMs !== undefined) {
      solver.set('timeout', this.timeoutMs);
    }
    return solver;
  }

  private currentScope(): Z3Scope {
    const top = this.scopes[this.scopes.length - 1];
    if (!top) {
      const fresh: Z3Scope = { decls: [], assertions: [] };
      this.scopes.push(fresh);
      return fresh;
    }
    return top;
  }

  private formatDecl(decl: Z3ScopedDecl): string {
    if (decl.sort === 'BitVec') {
      return `(declare-const ${decl.name} (_ BitVec ${decl.bvWidth ?? 32}))`;
    }
    return `(declare-const ${decl.name} ${decl.sort})`;
  }

  private extractModel(): SMTModel | undefined {
    let model: Z3Model;
    try {
      model = this.solver.model();
    } catch {
      return undefined;
    }
    const out: SMTModel = {};
    const decls = model.decls();
    for (const d of decls) {
      const nameAst = d.name();
      const name = nameAst.toString();
      // Saltamos los track names usados internamente para unsat-core.
      if (this.trackNames.has(name)) continue;
      let raw: string;
      try {
        raw = model.get(d).toString().trim();
      } catch {
        continue;
      }
      out[name] = parseZ3Value(raw);
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }

  private extractUnsatCore(): string[] {
    let core: { length(): number; get(i: number): Z3Expr };
    try {
      core = this.solver.unsatCore();
    } catch {
      return [];
    }
    const names: string[] = [];
    const len = core.length();
    for (let i = 0; i < len; i += 1) {
      try {
        const lit = core.get(i);
        names.push(lit.toString());
      } catch {
        // ignore literal corrupto
      }
    }
    return names;
  }

  private extractStatistics(): Record<string, number> {
    let stats: Z3Statistics;
    try {
      stats = this.solver.statistics();
    } catch {
      return {};
    }
    const out: Record<string, number> = {};
    try {
      const iter = stats[Symbol.iterator]();
      while (true) {
        const step = iter.next();
        if (step.done) break;
        const entry = step.value;
        if (typeof entry.value === 'number' && Number.isFinite(entry.value)) {
          out[entry.key] = entry.value;
        }
      }
    } catch {
      // Si la iteración de stats falla, mantenemos el snapshot vacío.
    }
    return out;
  }
}

/**
 * Decodifica el `toString()` de un valor Z3 a una representación JS:
 *  - "true"/"false" → boolean
 *  - "#xFF" / "#b101" → number (con guard a Number.MAX_SAFE_INTEGER)
 *  - decimales y enteros → number (cuando entran en safe range)
 *  - resto → string crudo
 */
function parseZ3Value(raw: string): string | number | boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw.startsWith('#x')) {
    const n = Number.parseInt(raw.slice(2), 16);
    return Number.isSafeInteger(n) ? n : raw;
  }
  if (raw.startsWith('#b')) {
    const n = Number.parseInt(raw.slice(2), 2);
    return Number.isSafeInteger(n) ? n : raw;
  }
  // (- 5) → -5
  const negMatch = /^\(-\s+(\d+(?:\.\d+)?)\)$/.exec(raw);
  if (negMatch && negMatch[1] !== undefined) {
    const n = Number(`-${negMatch[1]}`);
    return Number.isFinite(n) ? n : raw;
  }
  // Racional (/ a b) → a/b
  const ratMatch = /^\(\/\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\)$/.exec(raw);
  if (ratMatch && ratMatch[1] !== undefined && ratMatch[2] !== undefined) {
    const a = Number(ratMatch[1]);
    const b = Number(ratMatch[2]);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
  }
  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) return numeric;
  return raw;
}
