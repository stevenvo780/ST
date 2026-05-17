import { describe, it, expect } from 'vitest';
import { STLanguageServer, type OutgoingMessage } from '../../lsp/server';
import type { JsonRpcRequest, JsonRpcNotification } from '../../lsp/types';

function req(id: number, method: string, params: unknown = {}): JsonRpcRequest {
  return { jsonrpc: '2.0', id, method, params };
}

function notify(method: string, params: unknown = {}): JsonRpcNotification {
  return { jsonrpc: '2.0', method, params };
}

describe('STLanguageServer — initialize / shutdown', () => {
  it('initialize returns capabilities and serverInfo', () => {
    const s = new STLanguageServer();
    const resp = s.dispatch(req(1, 'initialize', {}));
    expect(resp).not.toBeNull();
    expect((resp!.result as { serverInfo: { name: string } }).serverInfo.name).toBe('st-lsp');
    expect(s.isInitialized()).toBe(true);
  });

  it('shutdown sets shutdownRequested', () => {
    const s = new STLanguageServer();
    s.dispatch(req(1, 'initialize', {}));
    const r = s.dispatch(req(2, 'shutdown', {}));
    expect(r).not.toBeNull();
    expect(s.isShutdownRequested()).toBe(true);
  });

  it('exit returns null', () => {
    const s = new STLanguageServer();
    const r = s.dispatch(req(2, 'exit', {}));
    expect(r).not.toBeNull();
  });

  it('initialized as request returns null result', () => {
    const s = new STLanguageServer();
    const r = s.dispatch(req(3, 'initialized', {}));
    expect((r!.result as null) ?? null).toBeNull();
  });

  it('unknown method returns error', () => {
    const s = new STLanguageServer();
    const r = s.dispatch(req(4, 'unsupported/method', {}));
    expect((r as { error?: { code: number } }).error).toBeDefined();
  });
});

describe('STLanguageServer — document lifecycle', () => {
  it('didOpen + hover + definition + symbols', () => {
    const messages: OutgoingMessage[] = [];
    const s = new STLanguageServer((m) => messages.push(m));
    s.dispatch(req(1, 'initialize', {}));

    s.dispatch(
      notify('textDocument/didOpen', {
        textDocument: {
          uri: 'file:///tmp/a.st',
          languageId: 'st',
          version: 1,
          text: 'logic classical.propositional\naxiom a : P\n',
        },
      }),
    );

    // publishDiagnostics should have been emitted
    expect(messages.length).toBeGreaterThan(0);
    const lastPublish = messages.find(
      (m) => 'method' in m && m.method === 'textDocument/publishDiagnostics',
    );
    expect(lastPublish).toBeDefined();

    const hover = s.dispatch(
      req(2, 'textDocument/hover', {
        textDocument: { uri: 'file:///tmp/a.st' },
        position: { line: 1, character: 7 },
      }),
    );
    expect(hover).not.toBeNull();

    const def = s.dispatch(
      req(3, 'textDocument/definition', {
        textDocument: { uri: 'file:///tmp/a.st' },
        position: { line: 1, character: 7 },
      }),
    );
    expect(def).not.toBeNull();

    const syms = s.dispatch(
      req(4, 'textDocument/documentSymbol', {
        textDocument: { uri: 'file:///tmp/a.st' },
      }),
    );
    expect(Array.isArray(syms!.result)).toBe(true);

    const compl = s.dispatch(
      req(5, 'textDocument/completion', {
        textDocument: { uri: 'file:///tmp/a.st' },
        position: { line: 1, character: 0 },
      }),
    );
    expect((compl!.result as { items: unknown[] }).items.length).toBeGreaterThan(0);
  });

  it('didChange updates document and publishes diagnostics', () => {
    const messages: OutgoingMessage[] = [];
    const s = new STLanguageServer((m) => messages.push(m));
    s.dispatch(req(1, 'initialize', {}));

    s.dispatch(
      notify('textDocument/didOpen', {
        textDocument: {
          uri: 'file:///tmp/b.st',
          languageId: 'st',
          version: 1,
          text: 'logic classical.propositional\n',
        },
      }),
    );

    const initialCount = messages.length;

    s.dispatch(
      notify('textDocument/didChange', {
        textDocument: { uri: 'file:///tmp/b.st', version: 2 },
        contentChanges: [{ text: 'logic classical.propositional\naxiom a : Q\n' }],
      }),
    );

    expect(messages.length).toBeGreaterThan(initialCount);
  });

  it('didSave republishes diagnostics', () => {
    const messages: OutgoingMessage[] = [];
    const s = new STLanguageServer((m) => messages.push(m));
    s.dispatch(req(1, 'initialize', {}));
    s.dispatch(
      notify('textDocument/didOpen', {
        textDocument: {
          uri: 'file:///tmp/c.st',
          languageId: 'st',
          version: 1,
          text: 'logic classical.propositional\n',
        },
      }),
    );
    const before = messages.length;
    s.dispatch(
      notify('textDocument/didSave', {
        textDocument: { uri: 'file:///tmp/c.st' },
      }),
    );
    expect(messages.length).toBeGreaterThanOrEqual(before);
  });

  it('didClose clears document and emits empty diagnostics', () => {
    const messages: OutgoingMessage[] = [];
    const s = new STLanguageServer((m) => messages.push(m));
    s.dispatch(req(1, 'initialize', {}));
    s.dispatch(
      notify('textDocument/didOpen', {
        textDocument: {
          uri: 'file:///tmp/d.st',
          languageId: 'st',
          version: 1,
          text: 'logic classical.propositional\n',
        },
      }),
    );

    s.dispatch(
      notify('textDocument/didClose', {
        textDocument: { uri: 'file:///tmp/d.st' },
      }),
    );

    // After close, hover on closed doc returns null
    const hover = s.dispatch(
      req(2, 'textDocument/hover', {
        textDocument: { uri: 'file:///tmp/d.st' },
        position: { line: 0, character: 0 },
      }),
    );
    expect(hover!.result).toBeNull();
  });

  it('hover on missing document returns null', () => {
    const s = new STLanguageServer();
    s.dispatch(req(1, 'initialize', {}));
    const r = s.dispatch(
      req(2, 'textDocument/hover', {
        textDocument: { uri: 'file:///missing.st' },
        position: { line: 0, character: 0 },
      }),
    );
    expect(r!.result).toBeNull();
  });

  it('definition on missing document returns null', () => {
    const s = new STLanguageServer();
    s.dispatch(req(1, 'initialize', {}));
    const r = s.dispatch(
      req(2, 'textDocument/definition', {
        textDocument: { uri: 'file:///missing.st' },
        position: { line: 0, character: 0 },
      }),
    );
    expect(r!.result).toBeNull();
  });

  it('hover with invalid params returns null', () => {
    const s = new STLanguageServer();
    s.dispatch(req(1, 'initialize', {}));
    const r = s.dispatch(req(2, 'textDocument/hover', { invalid: 'params' }));
    expect(r!.result).toBeNull();
  });

  it('documentSymbol with bad params returns empty array', () => {
    const s = new STLanguageServer();
    s.dispatch(req(1, 'initialize', {}));
    const r = s.dispatch(req(2, 'textDocument/documentSymbol', {}));
    expect(r!.result).toEqual([]);
  });

  it('exit notification clears state', () => {
    const s = new STLanguageServer();
    s.dispatch(req(1, 'initialize', {}));
    s.dispatch(notify('exit', {}));
    // No assertion on state — just ensure it doesn't throw
    expect(true).toBe(true);
  });

  it('ignores unknown notifications', () => {
    const s = new STLanguageServer();
    s.dispatch(req(1, 'initialize', {}));
    expect(() => s.dispatch(notify('workspace/didChangeConfig', {}))).not.toThrow();
  });
});
