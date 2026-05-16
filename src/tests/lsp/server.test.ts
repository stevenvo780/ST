// ============================================================
// ST LSP — Tests del language server v1
// ============================================================

import { describe, expect, it } from 'vitest';

import { STLanguageServer, type OutgoingMessage } from '../../lsp/server';
import { encodeMessage, parseFrames } from '../../lsp/protocol';
import {
  DiagnosticSeverity,
  type Hover,
  type InitializeResult,
  type Location,
  type LspCompletionItem,
  type LspDiagnostic,
  type PublishDiagnosticsParams,
} from '../../lsp/types';

interface CapturedNotification {
  method: string;
  params: unknown;
}

function makeServer(): { server: STLanguageServer; notifications: CapturedNotification[] } {
  const notifications: CapturedNotification[] = [];
  const server = new STLanguageServer((message: OutgoingMessage) => {
    if (!('id' in message)) {
      notifications.push({ method: message.method, params: message.params });
    }
  });
  return { server, notifications };
}

function getDiagnostics(notifications: CapturedNotification[], uri: string): LspDiagnostic[] {
  const matching = notifications
    .filter((n) => n.method === 'textDocument/publishDiagnostics')
    .map((n) => n.params as PublishDiagnosticsParams)
    .filter((p) => p.uri === uri);
  if (matching.length === 0) return [];
  return matching[matching.length - 1].diagnostics;
}

describe('STLanguageServer — initialize', () => {
  it('responde con capabilities completas a initialize', () => {
    const { server } = makeServer();
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { capabilities: {} },
    });
    expect(response).not.toBeNull();
    expect(response!.id).toBe(1);
    const result = response!.result as InitializeResult;
    expect(result.capabilities.hoverProvider).toBe(true);
    expect(result.capabilities.definitionProvider).toBe(true);
    expect(result.capabilities.completionProvider).toBeDefined();
    expect(result.capabilities.documentSymbolProvider).toBe(true);
    expect(result.capabilities.textDocumentSync).toBe(1); // Full
    expect(result.serverInfo?.name).toBe('st-lsp');
    expect(server.isInitialized()).toBe(true);
  });

  it('responde método-no-encontrado para requests desconocidos', () => {
    const { server } = makeServer();
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 99,
      method: 'no/existe',
    });
    expect(response).not.toBeNull();
    expect(response!.error?.code).toBe(-32601);
  });
});

describe('STLanguageServer — didOpen y publishDiagnostics', () => {
  const uri = 'file:///valid.st';

  it('publica diagnostics vacíos para un .st válido', () => {
    const { server, notifications } = makeServer();
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri,
          languageId: 'st',
          version: 1,
          text: [
            'logic classical.propositional',
            'axiom a1 : P -> Q',
            'axiom a2 : P',
            'derive Q from {a1, a2}',
          ].join('\n'),
        },
      },
    });
    const diags = getDiagnostics(notifications, uri);
    expect(diags).toEqual([]);
  });

  it('publica diagnostics con al menos un error para sintaxis inválida', () => {
    const { server, notifications } = makeServer();
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri: 'file:///invalid.st',
          languageId: 'st',
          version: 1,
          // Falta cierre de paréntesis
          text: 'logic classical.propositional\naxiom a : (P -> Q',
        },
      },
    });
    const diags = getDiagnostics(notifications, 'file:///invalid.st');
    expect(diags.length).toBeGreaterThan(0);
    expect(diags.some((d) => d.severity === DiagnosticSeverity.Error)).toBe(true);
    expect(diags.every((d) => d.source === 'st')).toBe(true);
  });

  it('actualiza diagnostics tras un didChange (Full sync)', () => {
    const { server, notifications } = makeServer();
    const docUri = 'file:///mut.st';
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri: docUri,
          languageId: 'st',
          version: 1,
          text: 'logic classical.propositional',
        },
      },
    });
    // Inicial: válido → 0 errors.
    expect(
      getDiagnostics(notifications, docUri).filter((d) => d.severity === DiagnosticSeverity.Error),
    ).toEqual([]);

    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didChange',
      params: {
        textDocument: { uri: docUri, version: 2 },
        contentChanges: [{ text: 'logic classical.propositional\naxiom (' }],
      },
    });
    const finalDiags = getDiagnostics(notifications, docUri);
    expect(finalDiags.some((d) => d.severity === DiagnosticSeverity.Error)).toBe(true);
  });

  it('publica diagnostics vacíos al cerrar el documento', () => {
    const { server, notifications } = makeServer();
    const docUri = 'file:///close.st';
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri: docUri,
          languageId: 'st',
          version: 1,
          text: 'logic classical.propositional\naxiom (',
        },
      },
    });
    expect(getDiagnostics(notifications, docUri).length).toBeGreaterThan(0);

    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didClose',
      params: { textDocument: { uri: docUri } },
    });
    expect(getDiagnostics(notifications, docUri)).toEqual([]);
  });
});

describe('STLanguageServer — hover', () => {
  it('devuelve MarkupContent markdown sobre un axioma conocido', () => {
    const { server } = makeServer();
    const uri = 'file:///hover.st';
    const text = [
      'logic classical.propositional',
      'axiom regla : P -> Q', // line 2 (0-based: 1)
    ].join('\n');
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: { textDocument: { uri, languageId: 'st', version: 1, text } },
    });
    // Posicionamos el cursor sobre la palabra "regla" en la línea 1 (0-based).
    // "axiom regla" — la "r" de regla está en character 6 (0-based).
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 10,
      method: 'textDocument/hover',
      params: { textDocument: { uri }, position: { line: 1, character: 7 } },
    });
    expect(response).not.toBeNull();
    const hover = response!.result as Hover | null;
    expect(hover).not.toBeNull();
    expect(hover!.contents.kind).toBe('markdown');
    expect(hover!.contents.value).toMatch(/Axioma/);
    expect(hover!.contents.value).toMatch(/regla/);
  });

  it('hover sobre keyword devuelve documentación estática', () => {
    const { server } = makeServer();
    const uri = 'file:///kw.st';
    const text = 'logic classical.propositional\nderive Q from {a1}';
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: { textDocument: { uri, languageId: 'st', version: 1, text } },
    });
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 11,
      method: 'textDocument/hover',
      params: { textDocument: { uri }, position: { line: 1, character: 1 } }, // sobre "derive"
    });
    const hover = response!.result as Hover | null;
    expect(hover).not.toBeNull();
    expect(hover!.contents.value.toLowerCase()).toContain('derive');
  });

  it('hover devuelve null si el documento no está abierto', () => {
    const { server } = makeServer();
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 12,
      method: 'textDocument/hover',
      params: { textDocument: { uri: 'file:///nope.st' }, position: { line: 0, character: 0 } },
    });
    expect(response!.result).toBeNull();
  });
});

describe('STLanguageServer — definition', () => {
  it('devuelve location del axioma sobre go-to-definition', () => {
    const { server } = makeServer();
    const uri = 'file:///def.st';
    const text = [
      'logic classical.propositional',
      'axiom premisa1 : P -> Q',
      'axiom premisa2 : P',
      'derive Q from {premisa1, premisa2}',
    ].join('\n');
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: { textDocument: { uri, languageId: 'st', version: 1, text } },
    });
    // Cursor sobre "premisa1" en la línea del derive (line 3 0-based, char 16).
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 20,
      method: 'textDocument/definition',
      params: { textDocument: { uri }, position: { line: 3, character: 17 } },
    });
    expect(response).not.toBeNull();
    const loc = response!.result as Location | null;
    expect(loc).not.toBeNull();
    expect(loc!.uri).toBe(uri);
    // El axioma `premisa1` está en la línea 2 (1-based) → 1 (0-based).
    expect(loc!.range.start.line).toBe(1);
  });

  it('devuelve null si el símbolo no existe', () => {
    const { server } = makeServer();
    const uri = 'file:///nodef.st';
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri,
          languageId: 'st',
          version: 1,
          text: 'logic classical.propositional\n',
        },
      },
    });
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 21,
      method: 'textDocument/definition',
      params: { textDocument: { uri }, position: { line: 0, character: 1 } },
    });
    expect(response!.result).toBeNull();
  });
});

describe('STLanguageServer — completion', () => {
  it('devuelve keywords ST en contexto vacío', () => {
    const { server } = makeServer();
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 30,
      method: 'textDocument/completion',
      params: {
        textDocument: { uri: 'file:///c.st' },
        position: { line: 0, character: 0 },
      },
    });
    expect(response).not.toBeNull();
    const completion = response!.result as { items: LspCompletionItem[]; isIncomplete: boolean };
    expect(completion.isIncomplete).toBe(false);
    const labels = new Set(completion.items.map((i) => i.label));
    // Keywords clave que pedimos en el spec
    expect(labels.has('derive')).toBe(true);
    expect(labels.has('axiom')).toBe(true);
    expect(labels.has('let')).toBe(true);
    expect(labels.has('import')).toBe(true);
    // Operadores Unicode
    expect(labels.has('∧')).toBe(true);
    expect(labels.has('∨')).toBe(true);
    expect(labels.has('→')).toBe(true);
    expect(labels.has('¬')).toBe(true);
    expect(labels.has('↔')).toBe(true);
    expect(labels.has('∀')).toBe(true);
    expect(labels.has('∃')).toBe(true);
    expect(labels.has('□')).toBe(true);
    expect(labels.has('◇')).toBe(true);
  });

  it('marca snippets con InsertTextFormat=2 (Snippet)', () => {
    const { server } = makeServer();
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 31,
      method: 'textDocument/completion',
      params: { textDocument: { uri: 'file:///c.st' }, position: { line: 0, character: 0 } },
    });
    const completion = response!.result as { items: LspCompletionItem[] };
    const axiomItem = completion.items.find((i) => i.label === 'axiom');
    expect(axiomItem).toBeDefined();
    expect(axiomItem!.insertTextFormat).toBe(2); // Snippet
    const unicodeAnd = completion.items.find((i) => i.label === '∧');
    expect(unicodeAnd!.insertTextFormat).toBe(1); // PlainText
  });
});

describe('STLanguageServer — documentSymbol', () => {
  it('devuelve la lista de axiomas y teoremas del documento', () => {
    const { server } = makeServer();
    const uri = 'file:///sym.st';
    const text = ['logic classical.propositional', 'axiom a1 : P', 'theorem t1 : P -> P'].join(
      '\n',
    );
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: { textDocument: { uri, languageId: 'st', version: 1, text } },
    });
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 40,
      method: 'textDocument/documentSymbol',
      params: { textDocument: { uri } },
    });
    const symbols = response!.result as Array<{ name: string }>;
    const names = symbols.map((s) => s.name);
    expect(names).toContain('a1');
    expect(names).toContain('t1');
  });
});

describe('STLanguageServer — lifecycle', () => {
  it('shutdown marca el server como shutdown-requested', () => {
    const { server } = makeServer();
    const response = server.dispatch({
      jsonrpc: '2.0',
      id: 50,
      method: 'shutdown',
    });
    expect(response!.result).toBeNull();
    expect(server.isShutdownRequested()).toBe(true);
  });

  it('didSave re-publica diagnostics del documento abierto', () => {
    const { server, notifications } = makeServer();
    const uri = 'file:///save.st';
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: { uri, languageId: 'st', version: 1, text: 'logic classical.propositional' },
      },
    });
    const before = notifications.filter(
      (n) => n.method === 'textDocument/publishDiagnostics',
    ).length;
    server.dispatch({
      jsonrpc: '2.0',
      method: 'textDocument/didSave',
      params: { textDocument: { uri } },
    });
    const after = notifications.filter(
      (n) => n.method === 'textDocument/publishDiagnostics',
    ).length;
    expect(after).toBeGreaterThan(before);
  });
});

describe('JSON-RPC framing', () => {
  it('encode/decode round-trip de un response', () => {
    const message: import('../../lsp/protocol').IncomingMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { capabilities: {} },
    };
    const encoded = encodeMessage(message);
    expect(encoded.toString('utf8')).toMatch(/^Content-Length: \d+\r\n\r\n/);

    const { messages, remainder } = parseFrames(encoded);
    expect(messages.length).toBe(1);
    expect(remainder.length).toBe(0);
    const decoded = messages[0] as { method: string; params: unknown };
    expect(decoded.method).toBe('initialize');
  });

  it('parsea múltiples mensajes concatenados en un solo buffer', () => {
    const m1 = encodeMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    });
    const m2 = encodeMessage({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {},
    });
    const { messages, remainder } = parseFrames(Buffer.concat([m1, m2]));
    expect(messages.length).toBe(2);
    expect(remainder.length).toBe(0);
  });

  it('deja remainder cuando un body llega parcial', () => {
    const full = encodeMessage({ jsonrpc: '2.0', id: 1, method: 'x' });
    const partial = full.slice(0, full.length - 5);
    const { messages, remainder } = parseFrames(partial);
    expect(messages.length).toBe(0);
    expect(remainder.length).toBe(partial.length);
  });
});
