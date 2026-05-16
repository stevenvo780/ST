// ============================================================
// ST SMT — Backend basado en subprocess (z3 / cvc5 via stdio)
// ============================================================

import { spawnSync, type SpawnSyncOptions } from 'child_process';
import type {
  ConstDeclaration,
  DetectedSolver,
  DetectionResult,
  SMTBackend,
  SMTModel,
  SMTResult,
  SMTScope,
  SMTSort,
} from './types';

type WhichRunner = (bin: string) => string | undefined;

/** Resuelve el path absoluto de un binario en `PATH` usando `which` puro. */
function defaultWhich(bin: string): string | undefined {
  if (typeof process === 'undefined') return undefined;
  const pathEnv = process.env.PATH ?? '';
  if (!pathEnv) return undefined;
  const sep = process.platform === 'win32' ? ';' : ':';
  const dirs = pathEnv.split(sep);
  for (const dir of dirs) {
    if (!dir) continue;
    try {
      // Sólo intentamos `spawnSync` con `--version` para no requerir `fs.existsSync`
      // (mantiene el módulo browser-friendly excepto por child_process).
    } catch {
      continue;
    }
  }
  // Estrategia simple: pedir al shell que resuelva el binario.
  const opts: SpawnSyncOptions = { encoding: 'utf8', timeout: 1000 };
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(cmd, [bin], opts);
  if (result.status === 0 && typeof result.stdout === 'string') {
    const first = result.stdout.split('\n')[0]?.trim();
    if (first && first.length > 0) return first;
  }
  return undefined;
}

/**
 * Detecta si hay un solver SMT (z3 o cvc5) disponible en el PATH.
 * No lanza excepción: si no hay solver, devuelve 'none'.
 */
export function detectAvailableSMT(): Promise<DetectedSolver> {
  const result = detectAvailableSMTDetailed();
  return Promise.resolve(result.solver);
}

/** Variante síncrona que también devuelve el path resuelto. */
export function detectAvailableSMTDetailed(which: WhichRunner = defaultWhich): DetectionResult {
  try {
    const z3 = which('z3');
    if (z3) return { solver: 'z3', binaryPath: z3 };
  } catch {
    // ignore
  }
  try {
    const cvc5 = which('cvc5');
    if (cvc5) return { solver: 'cvc5', binaryPath: cvc5 };
  } catch {
    // ignore
  }
  return { solver: 'none' };
}

export interface SubprocessBackendOptions {
  /** Timeout en ms para cada check-sat. Default 5000. */
  timeoutMs?: number;
  /** Solver forzado (en lugar de detectar). */
  prefer?: DetectedSolver;
  /** Inyector de `which` para tests. */
  which?: WhichRunner;
  /** Si true, levanta warning a console.warn cuando cae a no-op. */
  warnOnUnavailable?: boolean;
}

/**
 * SubprocessSMTBackend invoca `z3 -in` (o cvc5 equivalente) por stdio.
 *
 * Si no encuentra solver, queda en modo no-op:
 *   - checkSat() devuelve 'unknown'
 *   - getModel() devuelve undefined
 *   - getUnsatCore() devuelve []
 *
 * El backend acumula declaraciones y asserts en memoria y los envía al solver
 * en cada checkSat. No mantiene proceso persistente para no introducir leaks
 * en tests; el costo de re-arrancar z3 es <50ms por call y es aceptable.
 */
export class SubprocessSMTBackend implements SMTBackend {
  readonly name: string;
  private scopes: SMTScope[] = [{ decls: [], assertions: [] }];
  private lastModel: SMTModel | undefined;
  private lastUnsatCore: string[] = [];
  private readonly available: boolean;
  private readonly binaryPath: string | undefined;
  private readonly solver: DetectedSolver;
  private readonly timeoutMs: number;
  private warnedUnavailable = false;
  private readonly warnOnUnavailable: boolean;

  constructor(opts: SubprocessBackendOptions = {}) {
    const which = opts.which ?? defaultWhich;
    this.timeoutMs = opts.timeoutMs ?? 5000;
    this.warnOnUnavailable = opts.warnOnUnavailable ?? true;

    const preferred = opts.prefer;
    if (preferred && preferred !== 'none') {
      const path = which(preferred);
      if (path) {
        this.solver = preferred;
        this.binaryPath = path;
        this.available = true;
        this.name = `subprocess:${preferred}`;
        return;
      }
    }

    const detected = detectAvailableSMTDetailed(which);
    this.solver = detected.solver;
    this.binaryPath = detected.binaryPath;
    this.available = detected.solver !== 'none';
    this.name = this.available ? `subprocess:${detected.solver}` : 'subprocess:noop';
  }

  reset(): void {
    this.scopes = [{ decls: [], assertions: [] }];
    this.lastModel = undefined;
    this.lastUnsatCore = [];
  }

  push(): void {
    this.scopes.push({ decls: [], assertions: [] });
  }

  pop(levels = 1): void {
    for (let i = 0; i < levels; i += 1) {
      if (this.scopes.length <= 1) break;
      this.scopes.pop();
    }
  }

  declareConst(name: string, sort: SMTSort): void {
    const top = this.currentScope();
    top.decls.push({ name, sort });
  }

  /** Versión interna para inyectar declaraciones detectadas por el serializer. */
  declareFromInference(decls: ConstDeclaration[]): void {
    const top = this.currentScope();
    for (const d of decls) {
      if (!top.decls.some((existing) => existing.name === d.name)) {
        top.decls.push(d);
      }
    }
  }

  assertFormula(smtlib: string): void {
    const top = this.currentScope();
    top.assertions.push({ body: smtlib });
  }

  isAvailable(): boolean {
    return this.available;
  }

  checkSat(): SMTResult {
    if (!this.available) {
      if (this.warnOnUnavailable && !this.warnedUnavailable) {
        this.warnedUnavailable = true;
        console.warn(
          '[smt] No se encontró z3 ni cvc5 en PATH. SubprocessSMTBackend opera en modo no-op (checkSat → unknown).',
        );
      }
      this.lastModel = undefined;
      return 'unknown';
    }

    const script = this.buildScript();
    const result = this.runSolver(script);
    if (!result) {
      this.lastModel = undefined;
      return 'unknown';
    }
    return result;
  }

  getModel(): SMTModel | undefined {
    return this.lastModel ? { ...this.lastModel } : undefined;
  }

  getUnsatCore(): string[] {
    return [...this.lastUnsatCore];
  }

  private currentScope(): SMTScope {
    const top = this.scopes[this.scopes.length - 1];
    if (!top) {
      const fresh: SMTScope = { decls: [], assertions: [] };
      this.scopes.push(fresh);
      return fresh;
    }
    return top;
  }

  private buildScript(): string {
    const lines: string[] = [];
    lines.push('(set-option :produce-models true)');
    for (const scope of this.scopes) {
      for (const d of scope.decls) {
        lines.push(this.formatDecl(d));
      }
      for (const a of scope.assertions) {
        lines.push(`(assert ${a.body})`);
      }
    }
    lines.push('(check-sat)');
    lines.push('(get-model)');
    return lines.join('\n');
  }

  private formatDecl(d: ConstDeclaration): string {
    if (d.sort === 'BitVec') {
      const width = d.bvWidth ?? 32;
      return `(declare-const ${d.name} (_ BitVec ${width}))`;
    }
    return `(declare-const ${d.name} ${d.sort})`;
  }

  private runSolver(script: string): SMTResult | undefined {
    if (!this.binaryPath) return undefined;

    const args = this.solver === 'z3' ? ['-in'] : ['--lang=smt2'];
    const result = spawnSync(this.binaryPath, args, {
      input: script,
      encoding: 'utf8',
      timeout: this.timeoutMs,
    });

    if (result.error || typeof result.stdout !== 'string') {
      return undefined;
    }

    return this.parseOutput(result.stdout);
  }

  private parseOutput(stdout: string): SMTResult | undefined {
    const lines = stdout.split('\n');
    let status: SMTResult | undefined;
    for (const line of lines) {
      const t = line.trim();
      if (t === 'sat' || t === 'unsat' || t === 'unknown') {
        status = t;
        break;
      }
    }
    if (!status) return undefined;

    if (status === 'sat') {
      this.lastModel = parseModel(stdout);
    } else {
      this.lastModel = undefined;
    }
    return status;
  }
}

/** Parser muy simple de `(model ...)` para variables atómicas. */
function parseModel(stdout: string): SMTModel | undefined {
  const model: SMTModel = {};
  const defineFn =
    /\(define-fun\s+([^\s()]+)\s+\(\)\s+(?:Bool|Int|Real|\(_\sBitVec[^)]+\))\s+([^)]+)\)/g;
  let match = defineFn.exec(stdout);
  while (match) {
    const name = match[1];
    const rawValue = match[2];
    if (name && rawValue !== undefined) {
      const trimmed = rawValue.trim();
      if (trimmed === 'true') model[name] = true;
      else if (trimmed === 'false') model[name] = false;
      else {
        const num = Number(trimmed);
        model[name] = Number.isNaN(num) ? trimmed : num;
      }
    }
    match = defineFn.exec(stdout);
  }
  return Object.keys(model).length > 0 ? model : undefined;
}
