// ============================================================
// ST — API programática para uso como librería
// ============================================================
// Uso:
//   import { evaluate, parse, check, createInterpreter } from 'st-lang/api';
//   const result = evaluate('logic classical.propositional\ncheck valid (P -> P)');
// ============================================================

import { Parser } from './parser/parser';
import { Interpreter } from './runtime/interpreter';
import { ProtocolHandler } from './protocol/handler';
import { formulaToString } from './profiles/classical/propositional';
import type {
  ExecutionOutput,
  Diagnostic,
  RunResult,
  Formula,
  LogicStatus,
  Theory,
  TruthTableResult,
  Proof,
  Model,
  SymbolInfo,
  HoverInfo,
  CompletionItem,
  SourceLocation,
} from './types';
import type { Program } from './ast/nodes';

// ── Tipos de resultado de la API ──────────────────────────────

/** Resultado de evaluate() */
export interface STEvalResult {
  /** true si no hubo errores */
  ok: boolean;
  /** Salida formateada para humanos (lo que imprimiría el CLI) */
  stdout: string;
  /** Errores si los hubo */
  stderr: string;
  /** Código de salida (0 = ok, 1 = parse error, 3 = runtime error) */
  exitCode: number;
  /** Resultados lógicos individuales (uno por cada check/derive/prove/etc) */
  results: RunResult[];
  /** Diagnósticos (errores, warnings, hints) */
  diagnostics: Diagnostic[];
}

/** Resultado de parse() */
export interface STParseResult {
  ok: boolean;
  program: Program | null;
  diagnostics: Diagnostic[];
}

/** Resultado de check() */
export interface STCheckResult {
  ok: boolean;
  diagnostics: Diagnostic[];
}

// ── Funciones estateless (una sola invocación) ────────────────

/**
 * Ejecuta código ST completo y devuelve resultado estructurado.
 *
 * @example
 * ```ts
 * const r = evaluate(`
 *   logic classical.propositional
 *   axiom a1 : P -> Q
 *   axiom a2 : P
 *   derive Q from a1, a2
 * `);
 * console.log(r.ok);     // true
 * console.log(r.stdout); // "✓ [derive] Q es DERIVABLE..."
 * ```
 */
export function evaluate(source: string, file?: string): STEvalResult {
  const interpreter = new Interpreter();
  const output = interpreter.execute(source, file || '<api>');
  return {
    ok: output.exitCode === 0,
    stdout: output.stdout,
    stderr: output.stderr,
    exitCode: output.exitCode,
    results: output.results,
    diagnostics: output.diagnostics,
  };
}

/**
 * Parsea código ST sin ejecutarlo. Útil para validación de sintaxis.
 */
export function parse(source: string, file?: string): STParseResult {
  const parser = new Parser(file || '<api>');
  const program = parser.parse(source);
  const hasErrors = parser.diagnostics.some((d) => d.severity === 'error');
  return {
    ok: !hasErrors,
    program: hasErrors ? null : program,
    diagnostics: parser.diagnostics,
  };
}

/**
 * Verifica sintaxis y bien-formación sin ejecutar comandos lógicos.
 * Parsea el código y reporta errores.
 */
export function check(source: string, file?: string): STCheckResult {
  const parser = new Parser(file || '<api>');
  parser.parse(source);
  const hasErrors = parser.diagnostics.some((d) => d.severity === 'error');
  return {
    ok: !hasErrors,
    diagnostics: parser.diagnostics,
  };
}

/**
 * Evalúa una expresión lógica rápida (auto-prepone "logic classical.propositional").
 * Útil para validaciones inline sin necesidad de declarar perfil.
 *
 * @example
 * ```ts
 * const r = quickEval('check valid (P -> (Q -> P))');
 * console.log(r.ok);              // true
 * console.log(r.results[0].status); // 'valid'
 * ```
 */
export function quickEval(expression: string): STEvalResult {
  return evaluate(`logic classical.propositional\n${expression}`);
}

// ── Intérprete con estado (sesión persistente, REPL-like) ─────

/**
 * Intérprete con estado persistente. Permite ejecutar líneas incrementalmente
 * manteniendo axiomas, teoremas, claims y perfil entre llamadas.
 *
 * @example
 * ```ts
 * const st = createInterpreter();
 * st.exec('logic classical.propositional');
 * st.exec('axiom a1 : P -> Q');
 * st.exec('axiom a2 : P');
 * const r = st.exec('derive Q from a1, a2');
 * console.log(r.results[0].status); // 'valid'
 * console.log(st.getTheorySummary()); // { axioms: ['a1', 'a2'], ... }
 * ```
 */
export interface STInterpreter {
  /** Ejecuta uno o más statements manteniendo el estado */
  exec(source: string): STEvalResult;
  /** Reinicia todo el estado (perfil, axiomas, claims, etc.) */
  reset(): void;
  /** Obtiene el perfil lógico actual */
  getProfile(): string | null;
  /** Lista nombres de axiomas registrados */
  getAxioms(): string[];
  /** Lista nombres de teoremas registrados */
  getTheorems(): string[];
  /** Lista nombres de claims registrados */
  getClaims(): string[];
  /** Resumen completo del estado actual */
  getTheorySummary(): TheorySummary;
  /** Historial de todos los resultados ejecutados */
  getHistory(): STEvalResult[];
}

export interface TheorySummary {
  profile: string;
  axioms: string[];
  theorems: string[];
  claims: string[];
  judgmentCount: number;
}

/**
 * Crea una instancia de intérprete ST con estado persistente.
 */
export function createInterpreter(): STInterpreter {
  const inner = new Interpreter();
  const history: STEvalResult[] = [];

  return {
    exec(source: string): STEvalResult {
      const output = inner.executeSingle(source);
      const result: STEvalResult = {
        ok: output.exitCode === 0,
        stdout: output.stdout,
        stderr: output.stderr,
        exitCode: output.exitCode,
        results: output.results,
        diagnostics: output.diagnostics,
      };
      history.push(result);
      return result;
    },

    reset(): void {
      inner.reset();
      history.length = 0;
    },

    getProfile(): string | null {
      const p = inner.getProfile();
      return p ? p.name : null;
    },

    getAxioms(): string[] {
      return Array.from(inner.getTheory().axioms.keys());
    },

    getTheorems(): string[] {
      return Array.from(inner.getTheory().theorems.keys());
    },

    getClaims(): string[] {
      return Array.from(inner.getTheory().claims.keys());
    },

    getTheorySummary(): TheorySummary {
      const t = inner.getTheory();
      return {
        profile: t.profile,
        axioms: Array.from(t.axioms.keys()),
        theorems: Array.from(t.theorems.keys()),
        claims: Array.from(t.claims.keys()),
        judgmentCount: t.judgments.length,
      };
    },

    getHistory(): STEvalResult[] {
      return [...history];
    },
  };
}

// ── Utilidades expuestas ──────────────────────────────────────

/** Convierte una fórmula AST a string legible */
export { formulaToString } from './profiles/classical/propositional';

/** Lista los perfiles lógicos disponibles */
export function listProfiles(): string[] {
  // Los perfiles se registran al crear un Interpreter
  const temp = new Interpreter();
  void temp; // asegura registro de perfiles
  const { registry } = require('./profiles/interface');
  return registry.list();
}

// ── Editor Protocol — funciones de alto nivel ─────────────────

/** Resultado de hover() */
export interface STHoverResult {
  content: string;
  range?: SourceLocation;
}

/** Resultado de render() */
export interface STRenderResult {
  rendered: string;
  format: string;
  diagnostics: Diagnostic[];
}

/**
 * Obtiene información de hover para una posición en el código ST.
 * Útil para tooltips en editores.
 *
 * @returns HoverInfo o null si no hay info en esa posición
 */
export function hover(
  source: string,
  line: number,
  column: number,
  file?: string,
): HoverInfo | null {
  const handler = new ProtocolHandler();
  const resp = handler.handle({
    id: 0,
    method: 'hover',
    params: { source, line, column, file: file || '<api>' },
  });
  return (resp.result as HoverInfo | null) ?? null;
}

/**
 * Lista todos los símbolos definidos en el código ST (axiomas, teoremas, claims, passages, etc.).
 * Útil para panel de símbolos en editores.
 */
export function symbols(source: string, file?: string): SymbolInfo[] {
  const handler = new ProtocolHandler();
  const resp = handler.handle({
    id: 0,
    method: 'symbols',
    params: { source, file: file || '<api>' },
  });
  return (resp.result as SymbolInfo[]) ?? [];
}

/**
 * Busca la definición de un símbolo por nombre en el código ST.
 * Útil para "Go to Definition" en editores.
 *
 * @returns SourceLocation de la definición o null si no se encuentra
 */
export function gotoDefinition(source: string, name: string, file?: string): SourceLocation | null {
  const handler = new ProtocolHandler();
  const resp = handler.handle({
    id: 0,
    method: 'goto_definition',
    params: { source, name, file: file || '<api>' },
  });
  return (resp.result as SourceLocation | null) ?? null;
}

/**
 * Obtiene sugerencias de completado para el lenguaje ST.
 * Devuelve keywords y snippets disponibles.
 */
export function completion(): CompletionItem[] {
  const handler = new ProtocolHandler();
  const resp = handler.handle({
    id: 0,
    method: 'completion',
    params: {},
  });
  return (resp.result as CompletionItem[]) ?? [];
}

/**
 * Ejecuta y renderiza el código ST en el formato especificado.
 *
 * @param format 'markdown' | 'json' (default: 'markdown')
 */
export function render(source: string, format?: string, file?: string): STRenderResult {
  const handler = new ProtocolHandler();
  const resp = handler.handle({
    id: 0,
    method: 'render',
    params: { source, format: format || 'markdown', file: file || '<api>' },
  });
  const result = resp.result as { rendered: string; format: string } | undefined;
  return {
    rendered: result?.rendered ?? '',
    format: result?.format ?? format ?? 'markdown',
    diagnostics: resp.diagnostics ?? [],
  };
}

// ── Re-exports de tipos útiles ────────────────────────────────

export type {
  ExecutionOutput,
  Diagnostic,
  RunResult,
  Formula,
  LogicStatus,
  Theory,
  TruthTableResult,
  Proof,
  Model,
  Valuation,
  Severity,
  FormulaKind,
  Claim,
  Passage,
  Anchor,
  SymbolInfo,
  HoverInfo,
  CompletionItem,
  SourceLocation,
} from './types';

export type { Program, Statement } from './ast/nodes';
