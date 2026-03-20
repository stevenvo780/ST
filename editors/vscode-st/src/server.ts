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
  DefinitionParams,
  Location,
  FoldingRange,
  FoldingRangeKind,
  FoldingRangeParams,
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  SignatureHelp,
  SignatureHelpParams,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ProtocolHandler } from '../vendor/st-lang/dist/protocol/handler';
import type { Diagnostic as STDiagnostic } from '../vendor/st-lang/dist/types';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const handler = new ProtocolHandler();

// Cache de símbolos por documento para completions context-aware
const documentSymbolsCache = new Map<string, any[]>();

// ─── Initialize ──────────────────────────────────────────────
connection.onInitialize((_params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.', '[', '<', '>', '!', '+', '-', '*', '/', '%', ' '],
      },
      hoverProvider: true,
      documentSymbolProvider: true,
      definitionProvider: true,
      foldingRangeProvider: true,
      codeActionProvider: {
        codeActionKinds: [CodeActionKind.QuickFix, CodeActionKind.Source],
      },
      signatureHelpProvider: {
        triggerCharacters: ['(', ','],
      },
    },
  };
  return result;
});

// ─── Diagnostics ─────────────────────────────────────────────
documents.onDidChangeContent((change: TextDocumentChangeEvent<TextDocument>) => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const source = textDocument.getText();
  const lines = source.split('\n');

  // 1) Parse check — errores de sintaxis
  const parseResp = handler.handle({
    id: 1,
    method: 'check',
    params: { source, file: textDocument.uri },
  });

  const diagnostics: Diagnostic[] = [];

  for (const d of parseResp.diagnostics || []) {
    if (d.severity === 'info') continue; // no enviar "parseado correctamente"

    const line = Math.max(0, (d.line || 1) - 1);
    const col = Math.max(0, (d.column || 1) - 1);
    const lineText = lines[line] || '';
    const endChar = (d as any).endColumn ? (d as any).endColumn - 1 : lineText.length;

    diagnostics.push({
      severity: mapSeverity(d.severity),
      range: {
        start: { line, character: col },
        end: { line, character: endChar },
      },
      message: d.message,
      source: 'st-lang',
    });
  }

  // 2) Runtime check — errores de ejecución (solo si no hay errores de parse)
  if (diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error).length === 0) {
    try {
      const runResp = handler.handle({
        id: 2,
        method: 'run',
        params: { source, file: textDocument.uri },
      });

      for (const d of runResp.diagnostics || []) {
        if (d.severity === 'info') continue;

        const line = Math.max(0, (d.line || 1) - 1);
        const col = Math.max(0, (d.column || 1) - 1);
        const lineText = lines[line] || '';
        const endChar = (d as any).endColumn ? (d as any).endColumn - 1 : lineText.length;

        diagnostics.push({
          severity: mapSeverity(d.severity),
          range: {
            start: { line, character: col },
            end: { line, character: endChar },
          },
          message: d.message,
          source: 'st-lang (runtime)',
        });
      }
    } catch (_e) {
      // Runtime errors no deben romper el linting
    }
  }

  // 3) Actualizar cache de símbolos para completions
  updateSymbolsCache(textDocument);

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function updateSymbolsCache(textDocument: TextDocument): void {
  const source = textDocument.getText();
  const resp = handler.handle({
    id: 99,
    method: 'symbols',
    params: { source },
  });
  if (resp.result) {
    documentSymbolsCache.set(textDocument.uri, resp.result as any[]);
  }
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

// ─── Hover ───────────────────────────────────────────────────
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const source = doc.getText();
  const lines = source.split('\n');
  const lineText = lines[params.position.line] || '';

  const resp = handler.handle({
    id: 1,
    method: 'hover',
    params: {
      source,
      line: params.position.line + 1,
      column: params.position.character + 1,
    },
  });

  if (resp.result) {
    const res = resp.result as any;
    const wordRange = getWordRangeAtPosition(lineText, params.position.character);
    return {
      contents: { kind: 'markdown', value: res.content },
      range: wordRange
        ? {
            start: { line: params.position.line, character: wordRange.start },
            end: { line: params.position.line, character: wordRange.end },
          }
        : undefined,
    };
  }
  return null;
});

function getWordRangeAtPosition(
  lineText: string,
  col: number,
): { start: number; end: number } | null {
  if (col < 0 || col >= lineText.length) return null;
  let start = col;
  while (start > 0 && /[a-zA-Z0-9_.\u00C0-\u024F]/.test(lineText[start - 1])) start--;
  let end = col;
  while (end < lineText.length && /[a-zA-Z0-9_.\u00C0-\u024F]/.test(lineText[end])) end++;
  if (start === end) return null;
  return { start, end };
}

// ─── Document Symbols ────────────────────────────────────────
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
    const lines = doc.getText().split('\n');
    return symbols.map((s) => {
      const line = Math.max(0, (s.location?.line || 1) - 1);
      const lineText = lines[line] || '';
      return {
        name: s.description ? `${s.name} — "${s.description}"` : s.name,
        kind: mapSymbolKind(s.kind),
        detail: s.detail || undefined,
        location: {
          uri: params.textDocument.uri,
          range: {
            start: { line, character: Math.max(0, (s.location?.column || 1) - 1) },
            end: { line, character: lineText.length },
          },
        },
      };
    });
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
    case 'formula':
      return SymbolKind.Function;
    case 'variable':
      return SymbolKind.String;
    default:
      return SymbolKind.Field;
  }
}

// ─── Go to Definition ────────────────────────────────────────
connection.onDefinition((params: DefinitionParams): Location | null => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const source = doc.getText();
  const lines = source.split('\n');
  const lineText = lines[params.position.line] || '';
  const wordRange = getWordRangeAtPosition(lineText, params.position.character);
  if (!wordRange) return null;

  const word = lineText.substring(wordRange.start, wordRange.end);

  const resp = handler.handle({
    id: 1,
    method: 'goto_definition',
    params: { source, name: word, file: doc.uri },
  });

  if (resp.result) {
    const loc = resp.result as { line: number; column: number; file?: string };
    const targetLine = Math.max(0, (loc.line || 1) - 1);
    const targetCol = Math.max(0, (loc.column || 1) - 1);
    const targetLineText = lines[targetLine] || '';
    return {
      uri: loc.file || params.textDocument.uri,
      range: {
        start: { line: targetLine, character: targetCol },
        end: { line: targetLine, character: targetLineText.length },
      },
    };
  }
  return null;
});

// ─── Completions ─────────────────────────────────────────────
connection.onCompletion((params: TextDocumentPositionParams): CompletionItem[] => {
  const doc = documents.get(params.textDocument.uri);
  const items: CompletionItem[] = [];

  // 1) Static completions del handler
  const resp = handler.handle({ id: 1, method: 'completion', params: {} });
  const staticItems = (resp.result as any[]) || [];
  for (const it of staticItems) {
    items.push({
      label: it.label,
      kind: mapCompletionKind(it.kind),
      detail: it.detail,
      insertText: it.insertText,
      insertTextFormat:
        typeof it.insertText === 'string' && /\$\{\d+[:}]?/.test(it.insertText)
          ? InsertTextFormat.Snippet
          : InsertTextFormat.PlainText,
      documentation: {
        kind: MarkupKind.Markdown,
        value: it.documentation || it.detail || it.label,
      },
      sortText: '1_' + it.label,
    });
  }

  // 2) Context-aware: símbolos del documento actual
  if (doc) {
    const cached = documentSymbolsCache.get(doc.uri);
    if (cached) {
      for (const sym of cached) {
        const existing = items.find((i) => i.label === sym.name);
        if (existing) continue;

        items.push({
          label: sym.name,
          kind:
            sym.kind === 'axiom'
              ? CompletionItemKind.Constant
              : sym.kind === 'theorem'
                ? CompletionItemKind.Class
                : sym.kind === 'formula'
                  ? CompletionItemKind.Function
                  : CompletionItemKind.Variable,
          detail: sym.detail || `(${sym.kind})`,
          documentation: {
            kind: MarkupKind.Markdown,
            value: sym.description
              ? `**${sym.kind}** \`${sym.name}\`\n\n${sym.description}`
              : `**${sym.kind}** \`${sym.name}\`${sym.detail ? '\n\n`' + sym.detail + '`' : ''}`,
          },
          sortText: '0_' + sym.name, // priorizar símbolos locales
        });
      }
    }

    // 3) Completions contextuales según la línea actual
    const lineText = doc.getText().split('\n')[params.position.line] || '';
    const prefix = lineText.substring(0, params.position.character).trimStart();

    // Si la línea empieza con "logic " → solo perfiles
    if (/^(logic|logica)\s+$/i.test(prefix)) {
      return items.filter(
        (i) =>
          typeof i.label === 'string' &&
          (i.label.startsWith('logic ') || i.label.startsWith('logica ')),
      );
    }

    // Si estamos dentro de "derive ... from {" → solo nombres de axiomas/lets
    if (/from\s*\{\s*[^}]*$/i.test(prefix)) {
      const symItems = items.filter((i) => i.sortText?.startsWith('0_'));
      return symItems.length > 0 ? symItems : items;
    }
  }

  return items;
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
      return CompletionItemKind.TypeParameter;
    case 'value':
      return CompletionItemKind.Value;
    case 'function':
      return CompletionItemKind.Function;
    default:
      return CompletionItemKind.Variable;
  }
}

// ─── Folding Ranges ──────────────────────────────────────────
connection.onFoldingRanges((params: FoldingRangeParams): FoldingRange[] => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];

  const ranges: FoldingRange[] = [];
  const lines = doc.getText().split('\n');
  const braceStack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Block comments /* ... */
    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].includes('*/')) {
          ranges.push({ startLine: i, endLine: j, kind: FoldingRangeKind.Comment });
          break;
        }
      }
    }

    // Consecutive line comments
    if (trimmed.startsWith('//')) {
      let end = i;
      while (end + 1 < lines.length && lines[end + 1].trim().startsWith('//')) end++;
      if (end > i) {
        ranges.push({ startLine: i, endLine: end, kind: FoldingRangeKind.Comment });
      }
    }

    // Brace-based folding: { ... }
    for (const ch of line) {
      if (ch === '{') braceStack.push(i);
      if (ch === '}' && braceStack.length > 0) {
        const start = braceStack.pop()!;
        if (i > start) {
          ranges.push({ startLine: start, endLine: i, kind: FoldingRangeKind.Region });
        }
      }
    }
  }

  return ranges;
});

// ─── Code Actions ────────────────────────────────────────────
connection.onCodeAction((params: CodeActionParams): CodeAction[] => {
  const actions: CodeAction[] = [];
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return actions;

  for (const diag of params.context.diagnostics) {
    // Quick fix: sugerir "logic" si falta perfil
    if (
      diag.message.includes('perfil') ||
      diag.message.includes('profile') ||
      diag.message.includes('logic')
    ) {
      actions.push({
        title: 'Añadir "logic classical.propositional" al inicio',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        edit: {
          changes: {
            [params.textDocument.uri]: [
              {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                newText: 'logic classical.propositional\n\n',
              },
            ],
          },
        },
      });
      actions.push({
        title: 'Añadir "logic arithmetic" al inicio',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diag],
        edit: {
          changes: {
            [params.textDocument.uri]: [
              {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                newText: 'logic arithmetic\n\n',
              },
            ],
          },
        },
      });
    }

    // Quick fix: sugerir traducciones español ↔ inglés
    if (
      diag.message.toLowerCase().includes('unexpected') ||
      diag.message.toLowerCase().includes('inesperado')
    ) {
      const line = doc.getText().split('\n')[diag.range.start.line] || '';
      const trimmed = line.trim();

      const translations: [RegExp, string, string][] = [
        [/^axioma\b/, 'axiom', 'Cambiar "axioma" → "axiom"'],
        [/^axiom\b/, 'axioma', 'Cambiar "axiom" → "axioma"'],
        [/^teorema\b/, 'theorem', 'Cambiar "teorema" → "theorem"'],
        [/^theorem\b/, 'teorema', 'Cambiar "theorem" → "teorema"'],
        [/^derivar\b/, 'derive', 'Cambiar "derivar" → "derive"'],
        [/^derive\b/, 'derivar', 'Cambiar "derive" → "derivar"'],
        [/^logica\b/, 'logic', 'Cambiar "logica" → "logic"'],
        [/^logic\b/, 'logica', 'Cambiar "logic" → "logica"'],
      ];

      for (const [pattern, replacement, title] of translations) {
        if (pattern.test(trimmed)) {
          const match = trimmed.match(pattern);
          if (match) {
            const startChar = line.indexOf(match[0]);
            actions.push({
              title,
              kind: CodeActionKind.QuickFix,
              diagnostics: [diag],
              edit: {
                changes: {
                  [params.textDocument.uri]: [
                    {
                      range: {
                        start: { line: diag.range.start.line, character: startChar },
                        end: {
                          line: diag.range.start.line,
                          character: startChar + match[0].length,
                        },
                      },
                      newText: replacement,
                    },
                  ],
                },
              },
            });
          }
        }
      }
    }
  }

  return actions;
});

// ─── Signature Help ──────────────────────────────────────────
connection.onSignatureHelp((_params: SignatureHelpParams): SignatureHelp | null => {
  const doc = documents.get(_params.textDocument.uri);
  if (!doc) return null;

  const lineText = doc.getText().split('\n')[_params.position.line] || '';
  const prefix = lineText.substring(0, _params.position.character);

  const fnMatch = prefix.match(/(\w+)\s*\(([^)]*)?$/);
  if (!fnMatch) return null;

  const fnName = fnMatch[1];
  const paramText = fnMatch[2] || '';
  const activeParam = (paramText.match(/,/g) || []).length;

  // Buscar función en símbolos del documento
  const symbols = documentSymbolsCache.get(doc.uri) || [];
  const fnSym = symbols.find((s: any) => s.name === fnName);

  if (fnSym) {
    return {
      signatures: [
        {
          label: `${fnName}(${fnSym.detail || '...'})`,
          documentation: fnSym.description || `Función ${fnName}`,
          parameters: [],
        },
      ],
      activeSignature: 0,
      activeParameter: activeParam,
    };
  }

  return null;
});

// ─── Custom requests: Execute ST ─────────────────────────────
connection.onRequest('st/run', (params: { source: string; file?: string }) => {
  return handler.handle({
    id: 1,
    method: 'run',
    params: { source: params.source, file: params.file || '<editor>' },
  });
});

connection.onRequest('st/render', (params: { source: string; file?: string; format?: string }) => {
  return handler.handle({
    id: 1,
    method: 'render',
    params: {
      source: params.source,
      file: params.file || '<editor>',
      format: params.format || 'markdown',
    },
  });
});

documents.listen(connection);
connection.listen();
