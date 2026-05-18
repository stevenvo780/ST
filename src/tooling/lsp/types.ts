// ============================================================
// ST LSP — Tipos LSP minimos (sin dependencias externas)
// ============================================================
//
// Subconjunto del spec Language Server Protocol 3.17 suficiente
// para implementar el server v1 de ST. Las posiciones del LSP son
// 0-based (linea y character), mientras que el parser de ST emite
// posiciones 1-based — la conversion se hace explicitamente en server.ts.

/** Mensaje base JSON-RPC 2.0. */
export interface JsonRpcMessage {
  jsonrpc: '2.0';
}

/** Identificador de una petición JSON-RPC: número, string o null (para notificaciones). */
export type JsonRpcId = number | string | null;

/** Petición JSON-RPC 2.0 con id, método y parámetros opcionales. */
export interface JsonRpcRequest extends JsonRpcMessage {
  id: JsonRpcId;
  method: string;
  params?: unknown;
}

/** Notificación JSON-RPC 2.0 (sin id, no requiere respuesta). */
export interface JsonRpcNotification extends JsonRpcMessage {
  method: string;
  params?: unknown;
}

/** Respuesta JSON-RPC 2.0: resultado exitoso o error. */
export interface JsonRpcResponse extends JsonRpcMessage {
  id: JsonRpcId;
  result?: unknown;
  error?: JsonRpcResponseError;
}

/** Error en una respuesta JSON-RPC 2.0: código numérico, mensaje y datos opcionales. */
export interface JsonRpcResponseError {
  code: number;
  message: string;
  data?: unknown;
}

/** Códigos de error estándar JSON-RPC 2.0 y extensiones LSP (RequestCancelled). */
export const JSON_RPC_ERROR_CODES = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ServerNotInitialized: -32002,
  RequestCancelled: -32800,
} as const;

// ── LSP basicos ──────────────────────────────────────────────

/** Posición LSP (0-based): línea y carácter dentro de un documento de texto. */
export interface Position {
  line: number;
  character: number;
}

/** Rango LSP: par de posiciones inicio/fin que delimitan una región del texto. */
export interface Range {
  start: Position;
  end: Position;
}

/** Ubicación LSP: URI del documento y rango dentro de él. */
export interface Location {
  uri: string;
  range: Range;
}

/** Identificador de documento de texto LSP: solo su URI. */
export interface TextDocumentIdentifier {
  uri: string;
}

/** Identificador de documento con número de versión para sincronización incremental. */
export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier {
  version: number;
}

/** Ítem de documento de texto LSP: URI, languageId, versión y contenido completo. */
export interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export interface TextDocumentContentChangeEvent {
  range?: Range;
  text: string;
}

export interface TextDocumentPositionParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

// ── Diagnostics ──────────────────────────────────────────────

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface LspDiagnostic {
  range: Range;
  severity?: DiagnosticSeverity;
  code?: string;
  source?: string;
  message: string;
}

export interface PublishDiagnosticsParams {
  uri: string;
  version?: number;
  diagnostics: LspDiagnostic[];
}

// ── Hover ────────────────────────────────────────────────────

export interface MarkupContent {
  kind: 'plaintext' | 'markdown';
  value: string;
}

export interface Hover {
  contents: MarkupContent;
  range?: Range;
}

// ── Completion ───────────────────────────────────────────────

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export enum InsertTextFormat {
  PlainText = 1,
  Snippet = 2,
}

export interface LspCompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string | MarkupContent;
  insertText?: string;
  insertTextFormat?: InsertTextFormat;
}

// ── Server capabilities ──────────────────────────────────────

export enum TextDocumentSyncKind {
  None = 0,
  Full = 1,
  Incremental = 2,
}

export interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo?: { name: string; version?: string };
}

export interface ServerCapabilities {
  textDocumentSync?: TextDocumentSyncKind;
  hoverProvider?: boolean;
  definitionProvider?: boolean;
  completionProvider?: { triggerCharacters?: string[]; resolveProvider?: boolean };
  documentSymbolProvider?: boolean;
}
