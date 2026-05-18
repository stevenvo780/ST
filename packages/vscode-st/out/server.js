"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const protocol_1 = require("@stevenvo780/st-lang/protocol");
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
const handler = new protocol_1.ProtocolHandler();
const documentSymbolsCache = new Map();
// ─── Initialize ──────────────────────────────────────────────
connection.onInitialize((_params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '[', '<', '>', '!', '+', '-', '*', '/', '%', ' '],
            },
            hoverProvider: true,
            documentSymbolProvider: true,
            definitionProvider: true,
            foldingRangeProvider: true,
            codeActionProvider: {
                codeActionKinds: [node_1.CodeActionKind.QuickFix, node_1.CodeActionKind.Source],
            },
            signatureHelpProvider: {
                triggerCharacters: ['(', ','],
            },
        },
    };
});
// ─── Diagnostics ─────────────────────────────────────────────
documents.onDidChangeContent((change) => {
    void validateTextDocument(change.document);
});
async function validateTextDocument(textDocument) {
    const source = textDocument.getText();
    const lines = source.split('\n');
    const parseResp = handler.handle({
        id: 1,
        method: 'check',
        params: { source, file: textDocument.uri },
    });
    const diagnostics = [];
    for (const d of (parseResp.diagnostics ?? [])) {
        if (d.severity === 'info')
            continue;
        const line = Math.max(0, (d.line ?? 1) - 1);
        const col = Math.max(0, (d.column ?? 1) - 1);
        const lineText = lines[line] ?? '';
        const endChar = d.endColumn
            ? (d.endColumn ?? 1) - 1
            : lineText.length;
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
    // Runtime check only when no parse errors
    if (diagnostics.filter((d) => d.severity === node_1.DiagnosticSeverity.Error).length === 0) {
        try {
            const runResp = handler.handle({
                id: 2,
                method: 'run',
                params: { source, file: textDocument.uri },
            });
            for (const d of (runResp.diagnostics ?? [])) {
                if (d.severity === 'info')
                    continue;
                const line = Math.max(0, (d.line ?? 1) - 1);
                const col = Math.max(0, (d.column ?? 1) - 1);
                const lineText = lines[line] ?? '';
                const endChar = d.endColumn
                    ? (d.endColumn ?? 1) - 1
                    : lineText.length;
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
        }
        catch {
            // Runtime errors must not break linting
        }
    }
    updateSymbolsCache(textDocument);
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
function updateSymbolsCache(textDocument) {
    const resp = handler.handle({
        id: 99,
        method: 'symbols',
        params: { source: textDocument.getText() },
    });
    if (resp.result) {
        documentSymbolsCache.set(textDocument.uri, resp.result);
    }
}
function mapSeverity(s) {
    switch (s) {
        case 'error': return node_1.DiagnosticSeverity.Error;
        case 'warning': return node_1.DiagnosticSeverity.Warning;
        case 'info': return node_1.DiagnosticSeverity.Information;
        case 'hint': return node_1.DiagnosticSeverity.Hint;
        default: return node_1.DiagnosticSeverity.Error;
    }
}
// ─── Hover ───────────────────────────────────────────────────
connection.onHover((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc)
        return null;
    const lines = doc.getText().split('\n');
    const lineText = lines[params.position.line] ?? '';
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
        const res = resp.result;
        const wordRange = getWordRangeAtPosition(lineText, params.position.character);
        return {
            contents: { kind: node_1.MarkupKind.Markdown, value: res.content },
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
function getWordRangeAtPosition(lineText, col) {
    if (col < 0 || col >= lineText.length)
        return null;
    let start = col;
    while (start > 0 && /[a-zA-Z0-9_.À-ɏ]/.test(lineText[start - 1] ?? ''))
        start--;
    let end = col;
    while (end < lineText.length && /[a-zA-Z0-9_.À-ɏ]/.test(lineText[end] ?? ''))
        end++;
    if (start === end)
        return null;
    return { start, end };
}
// ─── Document Symbols ────────────────────────────────────────
connection.onDocumentSymbol((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc)
        return [];
    const resp = handler.handle({ id: 1, method: 'symbols', params: { source: doc.getText() } });
    if (!resp.result)
        return [];
    const symbols = resp.result;
    const lines = doc.getText().split('\n');
    return symbols.map((s) => {
        const line = Math.max(0, (s.location?.line ?? 1) - 1);
        const lineText = lines[line] ?? '';
        return {
            name: s.description ? `${s.name} — "${s.description}"` : s.name,
            kind: mapSymbolKind(s.kind),
            detail: s.detail,
            location: {
                uri: params.textDocument.uri,
                range: {
                    start: { line, character: Math.max(0, (s.location?.column ?? 1) - 1) },
                    end: { line, character: lineText.length },
                },
            },
        };
    });
});
function mapSymbolKind(k) {
    switch (k) {
        case 'axiom': return node_1.SymbolKind.Constant;
        case 'theorem': return node_1.SymbolKind.Class;
        case 'claim': return node_1.SymbolKind.Variable;
        case 'passage': return node_1.SymbolKind.File;
        case 'formula': return node_1.SymbolKind.Function;
        case 'variable': return node_1.SymbolKind.String;
        default: return node_1.SymbolKind.Field;
    }
}
// ─── Go to Definition ────────────────────────────────────────
connection.onDefinition((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc)
        return null;
    const source = doc.getText();
    const lines = source.split('\n');
    const lineText = lines[params.position.line] ?? '';
    const wordRange = getWordRangeAtPosition(lineText, params.position.character);
    if (!wordRange)
        return null;
    const word = lineText.substring(wordRange.start, wordRange.end);
    const resp = handler.handle({
        id: 1,
        method: 'goto_definition',
        params: { source, name: word, file: doc.uri },
    });
    if (resp.result) {
        const loc = resp.result;
        const targetLine = Math.max(0, (loc.line ?? 1) - 1);
        const targetCol = Math.max(0, (loc.column ?? 1) - 1);
        const targetLineText = lines[targetLine] ?? '';
        return {
            uri: loc.file ?? params.textDocument.uri,
            range: {
                start: { line: targetLine, character: targetCol },
                end: { line: targetLine, character: targetLineText.length },
            },
        };
    }
    return null;
});
// ─── Completions ─────────────────────────────────────────────
connection.onCompletion((params) => {
    const doc = documents.get(params.textDocument.uri);
    const items = [];
    const resp = handler.handle({ id: 1, method: 'completion', params: {} });
    const staticItems = resp.result ?? [];
    for (const it of staticItems) {
        items.push({
            label: it.label,
            kind: mapCompletionKind(it.kind),
            detail: it.detail,
            insertText: it.insertText,
            insertTextFormat: typeof it.insertText === 'string' && /\$\{\d+[:}]?/.test(it.insertText)
                ? node_1.InsertTextFormat.Snippet
                : node_1.InsertTextFormat.PlainText,
            documentation: {
                kind: node_1.MarkupKind.Markdown,
                value: it.documentation ?? it.detail ?? it.label,
            },
            sortText: '1_' + it.label,
        });
    }
    if (doc) {
        const cached = documentSymbolsCache.get(doc.uri);
        if (cached) {
            for (const sym of cached) {
                if (items.find((i) => i.label === sym.name))
                    continue;
                items.push({
                    label: sym.name,
                    kind: sym.kind === 'axiom'
                        ? node_1.CompletionItemKind.Constant
                        : sym.kind === 'theorem'
                            ? node_1.CompletionItemKind.Class
                            : sym.kind === 'formula'
                                ? node_1.CompletionItemKind.Function
                                : node_1.CompletionItemKind.Variable,
                    detail: sym.detail ?? `(${sym.kind})`,
                    documentation: {
                        kind: node_1.MarkupKind.Markdown,
                        value: sym.description
                            ? `**${sym.kind}** \`${sym.name}\`\n\n${sym.description}`
                            : `**${sym.kind}** \`${sym.name}\`${sym.detail ? '\n\n`' + sym.detail + '`' : ''}`,
                    },
                    sortText: '0_' + sym.name,
                });
            }
        }
        const lineText = doc.getText().split('\n')[params.position.line] ?? '';
        const prefix = lineText.substring(0, params.position.character).trimStart();
        if (/^(logic|logica)\s+$/i.test(prefix)) {
            return items.filter((i) => typeof i.label === 'string' &&
                (i.label.startsWith('logic ') || i.label.startsWith('logica ')));
        }
        if (/from\s*\{\s*[^}]*$/i.test(prefix)) {
            const symItems = items.filter((i) => i.sortText?.startsWith('0_'));
            return symItems.length > 0 ? symItems : items;
        }
    }
    return items;
});
connection.onCompletionResolve((item) => item);
function mapCompletionKind(kind) {
    switch (kind) {
        case 'keyword': return node_1.CompletionItemKind.Keyword;
        case 'operator': return node_1.CompletionItemKind.Operator;
        case 'snippet': return node_1.CompletionItemKind.Snippet;
        case 'type': return node_1.CompletionItemKind.TypeParameter;
        case 'value': return node_1.CompletionItemKind.Value;
        case 'function': return node_1.CompletionItemKind.Function;
        default: return node_1.CompletionItemKind.Variable;
    }
}
// ─── Folding Ranges ──────────────────────────────────────────
connection.onFoldingRanges((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc)
        return [];
    const ranges = [];
    const lines = doc.getText().split('\n');
    const braceStack = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const trimmed = line.trim();
        if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
            for (let j = i + 1; j < lines.length; j++) {
                if ((lines[j] ?? '').includes('*/')) {
                    ranges.push({ startLine: i, endLine: j, kind: node_1.FoldingRangeKind.Comment });
                    break;
                }
            }
        }
        if (trimmed.startsWith('//')) {
            let end = i;
            while (end + 1 < lines.length && (lines[end + 1] ?? '').trim().startsWith('//'))
                end++;
            if (end > i)
                ranges.push({ startLine: i, endLine: end, kind: node_1.FoldingRangeKind.Comment });
        }
        for (const ch of line) {
            if (ch === '{')
                braceStack.push(i);
            if (ch === '}' && braceStack.length > 0) {
                const start = braceStack.pop();
                if (i > start)
                    ranges.push({ startLine: start, endLine: i, kind: node_1.FoldingRangeKind.Region });
            }
        }
    }
    return ranges;
});
// ─── Code Actions ────────────────────────────────────────────
connection.onCodeAction((params) => {
    const actions = [];
    const doc = documents.get(params.textDocument.uri);
    if (!doc)
        return actions;
    for (const diag of params.context.diagnostics) {
        if (diag.message.includes('perfil') ||
            diag.message.includes('profile') ||
            diag.message.includes('logic')) {
            for (const profile of ['classical.propositional', 'arithmetic']) {
                actions.push({
                    title: `Add "logic ${profile}" at top`,
                    kind: node_1.CodeActionKind.QuickFix,
                    diagnostics: [diag],
                    edit: {
                        changes: {
                            [params.textDocument.uri]: [
                                {
                                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                                    newText: `logic ${profile}\n\n`,
                                },
                            ],
                        },
                    },
                });
            }
        }
        if (diag.message.toLowerCase().includes('unexpected') ||
            diag.message.toLowerCase().includes('inesperado')) {
            const line = doc.getText().split('\n')[diag.range.start.line] ?? '';
            const trimmed = line.trim();
            const translations = [
                [/^axioma\b/, 'axiom', '"axioma" → "axiom"'],
                [/^axiom\b/, 'axioma', '"axiom" → "axioma"'],
                [/^teorema\b/, 'theorem', '"teorema" → "theorem"'],
                [/^theorem\b/, 'teorema', '"theorem" → "teorema"'],
                [/^derivar\b/, 'derive', '"derivar" → "derive"'],
                [/^derive\b/, 'derivar', '"derive" → "derivar"'],
                [/^logica\b/, 'logic', '"logica" → "logic"'],
                [/^logic\b/, 'logica', '"logic" → "logica"'],
            ];
            for (const [pattern, replacement, label] of translations) {
                if (pattern.test(trimmed)) {
                    const match = trimmed.match(pattern);
                    if (match) {
                        const startChar = line.indexOf(match[0]);
                        actions.push({
                            title: `Change ${label}`,
                            kind: node_1.CodeActionKind.QuickFix,
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
connection.onSignatureHelp((_params) => {
    const doc = documents.get(_params.textDocument.uri);
    if (!doc)
        return null;
    const lineText = doc.getText().split('\n')[_params.position.line] ?? '';
    const prefix = lineText.substring(0, _params.position.character);
    const fnMatch = prefix.match(/(\w+)\s*\(([^)]*)?$/);
    if (!fnMatch)
        return null;
    const fnName = fnMatch[1] ?? '';
    const paramText = fnMatch[2] ?? '';
    const activeParam = (paramText.match(/,/g) ?? []).length;
    const symbols = documentSymbolsCache.get(doc.uri) ?? [];
    const fnSym = symbols.find((s) => s.name === fnName);
    if (fnSym) {
        return {
            signatures: [
                {
                    label: `${fnName}(${fnSym.detail ?? '...'})`,
                    documentation: fnSym.description ?? `Function ${fnName}`,
                    parameters: [],
                },
            ],
            activeSignature: 0,
            activeParameter: activeParam,
        };
    }
    return null;
});
// ─── Custom requests ─────────────────────────────────────────
connection.onRequest('st/run', (params) => {
    return handler.handle({
        id: 1,
        method: 'run',
        params: { source: params.source, file: params.file ?? '<editor>' },
    });
});
connection.onRequest('st/render', (params) => {
    return handler.handle({
        id: 1,
        method: 'render',
        params: {
            source: params.source,
            file: params.file ?? '<editor>',
            format: params.format ?? 'markdown',
        },
    });
});
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map