import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  CompletionItemKind,
  InsertTextFormat,
  MarkupKind,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Hover,
  SymbolKind,
  TextDocumentChangeEvent,
  DocumentSymbolParams,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ProtocolHandler } from '../vendor/st-lang/dist/protocol/handler';
import type { Diagnostic as STDiagnostic } from '../vendor/st-lang/dist/types';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const handler = new ProtocolHandler();

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.', '[', '<', '>', '!', '+', '-', '*', '/', '%']
      },
      hoverProvider: true,
      documentSymbolProvider: true,
    },
  };
  return result;
});

documents.onDidChangeContent((change: TextDocumentChangeEvent<TextDocument>) => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const source = textDocument.getText();
  const resp = handler.handle({
    id: 1,
    method: 'check',
    params: { source, file: textDocument.uri },
  });

  const diagnostics: Diagnostic[] = (resp.diagnostics || []).map((d: STDiagnostic) => ({
    severity: mapSeverity(d.severity),
    range: {
      start: { line: (d.line || 1) - 1, character: (d.column || 1) - 1 },
      end: { line: (d.line || 1) - 1, character: 100 },
    },
    message: d.message,
    source: 'st-lang',
  }));

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function mapSeverity(s: string): DiagnosticSeverity {
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
      return DiagnosticSeverity.Error;
  }
}

connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const resp = handler.handle({
    id: 1,
    method: 'hover',
    params: {
      source: doc.getText(),
      line: params.position.line + 1,
      column: params.position.character + 1,
    },
  });

  if (resp.result) {
    const res = resp.result as any;
    return {
      contents: { kind: 'markdown', value: res.content },
      range: res.range
        ? {
            start: { line: res.range.line - 1, character: res.range.column - 1 },
            end: { line: res.range.line - 1, character: 100 },
          }
        : undefined,
    };
  }
  return null;
});

connection.onDocumentSymbol((params: DocumentSymbolParams) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];

  const resp = handler.handle({
    id: 1,
    method: 'symbols',
    params: { source: doc.getText() },
  });

  if (resp.result) {
    const symbols = resp.result as any[];
    return symbols.map((s) => ({
      name: s.description ? `${s.name} — "${s.description}"` : s.name,
      kind: mapSymbolKind(s.kind),
      detail: s.detail || undefined,
      location: {
        uri: params.textDocument.uri,
        range: {
          start: { line: s.location.line - 1, character: s.location.column - 1 },
          end: { line: s.location.line - 1, character: 100 },
        },
      },
    }));
  }
  return [];
});

function mapSymbolKind(k: string): SymbolKind {
  switch (k) {
    case 'axiom':
      return SymbolKind.Constant;
    case 'theorem':
      return SymbolKind.Class;
    case 'claim':
      return SymbolKind.Variable;
    case 'passage':
      return SymbolKind.File;
    default:
      return SymbolKind.Field;
  }
}

connection.onCompletion((params: TextDocumentPositionParams): CompletionItem[] => {
  const resp = handler.handle({ id: 1, method: 'completion', params: {} });
  const items = (resp.result as any[]) || [];
  return items.map((it) => ({
    label: it.label,
    kind: mapCompletionKind(it.kind),
    detail: it.detail,
    insertText: it.insertText,
    insertTextFormat: typeof it.insertText === 'string' && /\$\{\d+[:}]?/.test(it.insertText)
      ? InsertTextFormat.Snippet
      : InsertTextFormat.PlainText,
    documentation: {
      kind: MarkupKind.Markdown,
      value: it.documentation || it.detail || it.label,
    },
  }));
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

function mapCompletionKind(kind: string): CompletionItemKind {
  switch (kind) {
    case 'keyword':
      return CompletionItemKind.Keyword;
    case 'operator':
      return CompletionItemKind.Operator;
    case 'snippet':
      return CompletionItemKind.Snippet;
    case 'type':
    case 'value':
      return CompletionItemKind.Class;
    case 'function':
      return CompletionItemKind.Function;
    default:
      return CompletionItemKind.Variable;
  }
}

documents.listen(connection);
connection.listen();
