// ============================================================
// ST LSP — Tipos LSP minimos (sin dependencias externas)
// ============================================================
//
// Subconjunto del spec Language Server Protocol 3.17 suficiente
// para implementar el server v1 de ST. Las posiciones del LSP son
// 0-based (linea y character), mientras que el parser de ST emite
// posiciones 1-based — la conversion se hace explicitamente en server.ts.

export interface JsonRpcMessage {
  jsonrpc: '2.0';
}

export type JsonRpcId = number | string | null;

export interface JsonRpcRequest extends JsonRpcMessage {
  id: JsonRpcId;
  method: string;
  params?: unknown;
}

export interface JsonRpcNotification extends JsonRpcMessage {
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse extends JsonRpcMessage {
  id: JsonRpcId;
  result?: unknown;
  error?: JsonRpcResponseError;
}

export interface JsonRpcResponseError {
  code: number;
  message: string;
  data?: unknown;
}

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

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Location {
  uri: string;
  range: Range;
}

export interface TextDocumentIdentifier {
  uri: string;
}

export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier {
  version: number;
}

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
