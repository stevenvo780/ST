// ============================================================
// ST LSP — Server v1
// ============================================================
//
// Soporta JSON-RPC sobre stdin/stdout con framing Content-Length.
// Implementa textDocument/didOpen,didChange,didSave,didClose,
// hover, definition, completion y publishDiagnostics.

import { Readable, Writable } from 'stream';
import {
  parse as apiParse,
  hover as apiHover,
  gotoDefinition as apiGotoDefinition,
  completion as apiCompletion,
  symbols as apiSymbols,
} from '../api';
import type { Diagnostic, CompletionItem as STCompletionItem, SymbolInfo } from '../types';
import { typeCheck } from '../runtime/typecheck';
import type { Program } from '../ast/nodes';
import {
  encodeMessage,
  parseFrames,
  isNotification,
  isRequest,
  type IncomingMessage,
} from './protocol';
import {
  CompletionItemKind,
  DiagnosticSeverity,
  InsertTextFormat,
  JSON_RPC_ERROR_CODES,
  TextDocumentSyncKind,
  type Hover,
  type InitializeResult,
  type JsonRpcId,
  type JsonRpcNotification,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type Location,
  type LspCompletionItem,
  type LspDiagnostic,
  type Position,
  type PublishDiagnosticsParams,
  type Range,
  type ServerCapabilities,
  type TextDocumentContentChangeEvent,
  type TextDocumentItem,
  type VersionedTextDocumentIdentifier,
} from './types';

interface OpenDocument {
  uri: string;
  version: number;
  text: string;
}

export type OutgoingMessage = JsonRpcResponse | JsonRpcNotification;

const SERVER_NAME = 'st-lsp';
const SERVER_VERSION = '1.0.0';
const DIAGNOSTICS_SOURCE = 'st';

/**
 * Implementa el Language Server Protocol mínimo para archivos `.st`.
 *
 * Diseñado para que la lógica de dispatch sea testeable sin streams: usa
 * `dispatch()` directamente o llama `listen(stdin, stdout)` para correrlo
 * conectado a procesos.
 */
export class STLanguageServer {
  private readonly documents = new Map<string, OpenDocument>();
  private initialized = false;
  private shutdownRequested = false;
  private emit: (message: OutgoingMessage) => void;

  constructor(emit?: (message: OutgoingMessage) => void) {
    this.emit = emit ?? ((): void => undefined);
  }

  /** Conecta el server a streams (típicamente process.stdin / process.stdout). */
  listen(stdin: Readable, stdout: Writable): void {
    const sendToStream = (message: OutgoingMessage): void => {
      stdout.write(encodeMessage(message));
    };

    // Re-cableamos el sink: tanto las respuestas directas como las
    // notificaciones que el server emite (p.ej. publishDiagnostics) deben
    // salir por el mismo stdout.
    this.emit = sendToStream;

    let buffer: Buffer = Buffer.alloc(0);
    stdin.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]) as Buffer;
      const { messages, remainder } = parseFrames(buffer);
      buffer = remainder;
      for (const message of messages) {
        const response = this.dispatch(message);
        if (response) sendToStream(response);
      }
    });
  }

  /**
   * Procesa un mensaje entrante. Devuelve la respuesta (para requests) o
   * `null` (para notificaciones o cuando el método no produce respuesta).
   * Las notificaciones emitidas como efecto (publishDiagnostics) salen
   * por el callback `emit` configurado en el constructor o por `listen()`.
   */
  dispatch(message: IncomingMessage): JsonRpcResponse | null {
    if (isRequest(message)) {
      return this.handleRequest(message);
    }
    if (isNotification(message)) {
      this.handleNotification(message);
      return null;
    }
    return null;
  }

  // ── Request handlers ─────────────────────────────────────

  private handleRequest(request: JsonRpcRequest): JsonRpcResponse {
    try {
      switch (request.method) {
        case 'initialize':
          return this.respond(request.id, this.handleInitialize());
        case 'initialized':
          // Es una notificación en spec, pero algunos clientes la mandan como
          // request; aceptamos ambos.
          return this.respond(request.id, null);
        case 'shutdown':
          this.shutdownRequested = true;
          return this.respond(request.id, null);
        case 'exit':
          return this.respond(request.id, null);
        case 'textDocument/hover':
          return this.respond(request.id, this.handleHover(request.params));
        case 'textDocument/definition':
          return this.respond(request.id, this.handleDefinition(request.params));
        case 'textDocument/completion':
          return this.respond(request.id, this.handleCompletion(request.params));
        case 'textDocument/documentSymbol':
          return this.respond(request.id, this.handleDocumentSymbol(request.params));
        default:
          return this.error(
            request.id,
            JSON_RPC_ERROR_CODES.MethodNotFound,
            `Método no soportado: ${request.method}`,
          );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.error(request.id, JSON_RPC_ERROR_CODES.InternalError, message);
    }
  }

  private handleInitialize(): InitializeResult {
    this.initialized = true;
    const capabilities: ServerCapabilities = {
      textDocumentSync: TextDocumentSyncKind.Full,
      hoverProvider: true,
      definitionProvider: true,
      completionProvider: {
        triggerCharacters: [' ', '.', '(', '{', ':'],
        resolveProvider: false,
      },
      documentSymbolProvider: true,
    };
    return { capabilities, serverInfo: { name: SERVER_NAME, version: SERVER_VERSION } };
  }

  private handleHover(params: unknown): Hover | null {
    const tp = parseTextDocumentPosition(params);
    if (!tp) return null;
    const doc = this.documents.get(tp.uri);
    if (!doc) return null;

    // Convertimos LSP (0-based) → ST (1-based).
    const info = apiHover(doc.text, tp.position.line + 1, tp.position.character + 1, tp.uri);
    if (!info) return null;

    const range: Range | undefined = info.range
      ? toLspRange({
          line: info.range.line,
          column: info.range.column,
          endLine: info.range.endLine,
          endColumn: info.range.endColumn,
        })
      : undefined;

    return {
      contents: { kind: 'markdown', value: info.content },
      range,
    };
  }

  private handleDefinition(params: unknown): Location | Location[] | null {
    const tp = parseTextDocumentPosition(params);
    if (!tp) return null;
    const doc = this.documents.get(tp.uri);
    if (!doc) return null;

    const word = getWordAtPosition(doc.text, tp.position);
    if (!word) return null;

    const loc = apiGotoDefinition(doc.text, word, tp.uri);
    if (!loc) return null;

    const range = toLspRange({
      line: loc.line,
      column: loc.column,
      endLine: loc.endLine,
      endColumn: loc.endColumn,
    });

    return { uri: tp.uri, range };
  }

  private handleCompletion(params: unknown): { items: LspCompletionItem[]; isIncomplete: boolean } {
    // Por ahora no usamos la posición para filtrar — devolvemos todas las
    // keywords/snippets de ST y dejamos que el cliente filtre por prefijo.
    void params;
    const items = apiCompletion().map(toLspCompletionItem);
    // Añadimos los operadores Unicode comunes que el agente puede querer
    // insertar y que no vienen en la lista del handler (handleCompletion del
    // ProtocolHandler ya cubre keywords y snippets; sumamos operadores).
    for (const op of UNICODE_OPERATORS) {
      items.push({
        label: op.label,
        kind: CompletionItemKind.Operator,
        detail: op.detail,
        insertText: op.label,
        insertTextFormat: InsertTextFormat.PlainText,
      });
    }
    return { items, isIncomplete: false };
  }

  private handleDocumentSymbol(params: unknown): unknown[] {
    if (!isObject(params)) return [];
    const td = (params as { textDocument?: unknown }).textDocument;
    if (!isObject(td) || typeof (td as { uri?: unknown }).uri !== 'string') return [];
    const uri = (td as { uri: string }).uri;
    const doc = this.documents.get(uri);
    if (!doc) return [];
    return apiSymbols(doc.text, uri).map((s: SymbolInfo) => ({
      name: s.name,
      kind: mapSymbolKind(s.kind),
      detail: s.detail,
      location: {
        uri,
        range: toLspRange({
          line: s.location.line,
          column: s.location.column,
          endLine: s.location.endLine,
          endColumn: s.location.endColumn,
        }),
      },
    }));
  }

  // ── Notification handlers ────────────────────────────────

  private handleNotification(notification: JsonRpcNotification): void {
    switch (notification.method) {
      case 'initialized':
        // No-op: confirmación del cliente tras initialize.
        break;
      case 'textDocument/didOpen':
        this.onDidOpen(notification.params);
        break;
      case 'textDocument/didChange':
        this.onDidChange(notification.params);
        break;
      case 'textDocument/didSave':
        this.onDidSave(notification.params);
        break;
      case 'textDocument/didClose':
        this.onDidClose(notification.params);
        break;
      case 'exit':
        // Liberamos estado: en proceso real esto cierra el daemon.
        this.documents.clear();
        break;
      default:
        // Ignoramos otras notificaciones (workspace/didChangeConfiguration, etc).
        break;
    }
  }

  private onDidOpen(params: unknown): void {
    if (!isObject(params)) return;
    const td = (params as { textDocument?: unknown }).textDocument;
    if (!isTextDocumentItem(td)) return;
    this.documents.set(td.uri, { uri: td.uri, version: td.version, text: td.text });
    this.publishDiagnostics(td.uri, td.version, td.text);
  }

  private onDidChange(params: unknown): void {
    if (!isObject(params)) return;
    const td = (params as { textDocument?: unknown }).textDocument;
    const changes = (params as { contentChanges?: unknown }).contentChanges;
    if (!isVersionedTextDocumentIdentifier(td)) return;
    if (!Array.isArray(changes) || changes.length === 0) return;
    const existing = this.documents.get(td.uri);
    if (!existing) return;
    // v1: solo Full sync. Tomamos el último cambio con `text` completo.
    const last = changes[changes.length - 1] as TextDocumentContentChangeEvent;
    if (typeof last.text !== 'string') return;
    existing.text = last.text;
    existing.version = td.version;
    this.publishDiagnostics(td.uri, td.version, last.text);
  }

  private onDidSave(params: unknown): void {
    if (!isObject(params)) return;
    const td = (params as { textDocument?: unknown }).textDocument;
    if (!isObject(td) || typeof (td as { uri?: unknown }).uri !== 'string') return;
    const uri = (td as { uri: string }).uri;
    const doc = this.documents.get(uri);
    if (!doc) return;
    this.publishDiagnostics(uri, doc.version, doc.text);
  }

  private onDidClose(params: unknown): void {
    if (!isObject(params)) return;
    const td = (params as { textDocument?: unknown }).textDocument;
    if (!isObject(td) || typeof (td as { uri?: unknown }).uri !== 'string') return;
    const uri = (td as { uri: string }).uri;
    this.documents.delete(uri);
    // Limpiamos diagnostics del cliente.
    this.publish({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: { uri, diagnostics: [] } satisfies PublishDiagnosticsParams,
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  private publishDiagnostics(uri: string, version: number, text: string): void {
    const diagnostics: LspDiagnostic[] = [];

    // 1) Parse diagnostics (errores de sintaxis + warnings/info del parser).
    const parsed = apiParse(text, uri);
    for (const d of parsed.diagnostics) {
      if (d.severity === 'error' || d.severity === 'warning') {
        diagnostics.push(toLspDiagnostic(d));
      }
    }

    // 2) Type-check diagnostics si el parse fue exitoso. Usamos el perfil
    //    declarado en el script (statement `logic X.Y`) o cadena vacía.
    if (parsed.ok && parsed.program) {
      const profile = inferProfile(parsed.program);
      try {
        const typeErrors = typeCheck(parsed.program, profile, uri);
        for (const te of typeErrors) {
          diagnostics.push(typeErrorToLspDiagnostic(te));
        }
      } catch {
        // Si el typeCheck falla en algún statement exótico, no bloqueamos
        // el flujo de diagnostics — sólo perdemos esa ronda.
      }
    }

    this.publish({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: { uri, version, diagnostics } satisfies PublishDiagnosticsParams,
    });
  }

  private publish(notification: JsonRpcNotification): void {
    this.emit(notification);
  }

  private respond(id: JsonRpcId, result: unknown): JsonRpcResponse {
    return { jsonrpc: '2.0', id, result };
  }

  private error(id: JsonRpcId, code: number, message: string): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }

  /** True si el cliente ya envió `initialize`. Útil para tests. */
  isInitialized(): boolean {
    return this.initialized;
  }

  /** True si el cliente pidió shutdown. */
  isShutdownRequested(): boolean {
    return this.shutdownRequested;
  }
}

// ── Validadores de params ───────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTextDocumentItem(value: unknown): value is TextDocumentItem {
  if (!isObject(value)) return false;
  return (
    typeof value.uri === 'string' &&
    typeof value.languageId === 'string' &&
    typeof value.version === 'number' &&
    typeof value.text === 'string'
  );
}

function isVersionedTextDocumentIdentifier(
  value: unknown,
): value is VersionedTextDocumentIdentifier {
  if (!isObject(value)) return false;
  return typeof value.uri === 'string' && typeof value.version === 'number';
}

interface ParsedTextDocPosition {
  uri: string;
  position: Position;
}

function parseTextDocumentPosition(params: unknown): ParsedTextDocPosition | null {
  if (!isObject(params)) return null;
  const td = params.textDocument;
  const pos = params.position;
  if (!isObject(td) || typeof (td as { uri?: unknown }).uri !== 'string') return null;
  if (!isObject(pos)) return null;
  const line = (pos as { line?: unknown }).line;
  const character = (pos as { character?: unknown }).character;
  if (typeof line !== 'number' || typeof character !== 'number') return null;
  return { uri: (td as { uri: string }).uri, position: { line, character } };
}

// ── Conversiones ST → LSP ───────────────────────────────────

interface STLikeRange {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

function toLspRange(loc: STLikeRange): Range {
  const startLine = Math.max(0, loc.line - 1);
  const startCol = Math.max(0, loc.column - 1);
  const endLine = loc.endLine !== undefined ? Math.max(0, loc.endLine - 1) : startLine;
  const endCol = loc.endColumn !== undefined ? Math.max(0, loc.endColumn - 1) : startCol + 1;
  return {
    start: { line: startLine, character: startCol },
    end: { line: endLine, character: endCol },
  };
}

function toLspDiagnostic(d: Diagnostic): LspDiagnostic {
  const start: Position = {
    line: Math.max(0, (d.line ?? 1) - 1),
    character: Math.max(0, (d.column ?? 1) - 1),
  };
  const end: Position = {
    line: Math.max(0, (d.endLine ?? d.line ?? 1) - 1),
    character: Math.max(start.character + 1, (d.endColumn ?? (d.column ?? 1) + 1) - 1),
  };
  const messageWithSuggestion = d.suggestion
    ? `${d.message}\n\nSugerencia: ${d.suggestion}`
    : d.message;
  return {
    range: { start, end },
    severity: mapDiagnosticSeverity(d.severity),
    code: d.code,
    source: DIAGNOSTICS_SOURCE,
    message: messageWithSuggestion,
  };
}

function mapDiagnosticSeverity(s: Diagnostic['severity']): DiagnosticSeverity {
  switch (s) {
    case 'error':
      return DiagnosticSeverity.Error;
    case 'warning':
      return DiagnosticSeverity.Warning;
    case 'info':
      return DiagnosticSeverity.Information;
    case 'hint':
      return DiagnosticSeverity.Hint;
    default:
      return DiagnosticSeverity.Information;
  }
}

function toLspCompletionItem(item: STCompletionItem): LspCompletionItem {
  const isSnippet = /\$\{[^}]+\}/.test(item.insertText);
  return {
    label: item.label,
    kind: mapCompletionKind(item.kind),
    detail: item.detail,
    documentation: item.documentation ? { kind: 'markdown', value: item.documentation } : undefined,
    insertText: item.insertText,
    insertTextFormat: isSnippet ? InsertTextFormat.Snippet : InsertTextFormat.PlainText,
  };
}

function mapCompletionKind(kind: string): CompletionItemKind {
  switch (kind) {
    case 'keyword':
      return CompletionItemKind.Keyword;
    case 'snippet':
      return CompletionItemKind.Snippet;
    case 'value':
      return CompletionItemKind.Value;
    case 'function':
      return CompletionItemKind.Function;
    case 'variable':
      return CompletionItemKind.Variable;
    case 'operator':
      return CompletionItemKind.Operator;
    default:
      return CompletionItemKind.Text;
  }
}

function mapSymbolKind(kind: SymbolInfo['kind']): number {
  // SymbolKind LSP: 1=File, 5=Class, 6=Method, 7=Property, 11=Interface,
  // 12=Function, 13=Variable, 14=Constant, ...
  switch (kind) {
    case 'axiom':
      return 14; // Constant
    case 'theorem':
      return 11; // Interface
    case 'claim':
      return 13; // Variable
    case 'definition':
      return 6; // Method
    case 'function':
      return 12; // Function
    case 'passage':
      return 7; // Property
    case 'source':
      return 1; // File
    case 'interpretation':
      return 13; // Variable
    case 'formula':
      return 13;
    case 'variable':
      return 13;
    default:
      return 13;
  }
}

// ── Helpers de palabras ─────────────────────────────────────

const WORD_CHAR = /[a-zA-Z0-9_.]/;

function getWordAtPosition(text: string, position: Position): string | null {
  const lines = text.split('\n');
  if (position.line < 0 || position.line >= lines.length) return null;
  const line = lines[position.line];
  const col = position.character;
  if (col < 0 || col > line.length) return null;
  let start = col;
  while (start > 0 && WORD_CHAR.test(line[start - 1])) start--;
  let end = col;
  while (end < line.length && WORD_CHAR.test(line[end])) end++;
  const word = line.substring(start, end).replace(/^\.+|\.+$/g, '');
  return word.length > 0 ? word : null;
}

// ── Inferencia de perfil y conversión de TypeError ────────

function inferProfile(program: Program): string {
  for (const stmt of program.statements) {
    if (stmt.kind === 'logic_decl') {
      return stmt.profile;
    }
  }
  return '';
}

interface STTypeErrorLike {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
  location: { line: number; column: number; endLine?: number; endColumn?: number };
}

function typeErrorToLspDiagnostic(te: STTypeErrorLike): LspDiagnostic {
  const start: Position = {
    line: Math.max(0, te.location.line - 1),
    character: Math.max(0, te.location.column - 1),
  };
  const endLine =
    te.location.endLine !== undefined ? Math.max(0, te.location.endLine - 1) : start.line;
  const endCol =
    te.location.endColumn !== undefined
      ? Math.max(0, te.location.endColumn - 1)
      : start.character + 1;
  const msg = te.suggestion ? `${te.message}\n\nSugerencia: ${te.suggestion}` : te.message;
  return {
    range: { start, end: { line: endLine, character: endCol } },
    severity: te.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    code: te.code,
    source: DIAGNOSTICS_SOURCE,
    message: msg,
  };
}

// ── Operadores Unicode adicionales para completion ─────────

const UNICODE_OPERATORS: { label: string; detail: string }[] = [
  { label: '∧', detail: 'Conjunción (and)' },
  { label: '∨', detail: 'Disyunción (or)' },
  { label: '→', detail: 'Implicación' },
  { label: '¬', detail: 'Negación' },
  { label: '↔', detail: 'Bicondicional' },
  { label: '∀', detail: 'Cuantificador universal' },
  { label: '∃', detail: 'Cuantificador existencial' },
  { label: '□', detail: 'Necesidad modal' },
  { label: '◇', detail: 'Posibilidad modal' },
];
