# `tooling/lsp/server.ts`

============================================================ ST LSP — Server v1 ============================================================ Soporta JSON-RPC sobre stdin/stdout con framing Content-Length. Implementa textDocument/didOpen,didChange,didSave,didClose, hover, definition, completion y publishDiagnostics.

## Contents

- [`OutgoingMessage`](#outgoingmessage) — Type
- [`STLanguageServer`](#stlanguageserver) — Class

## `OutgoingMessage`

> Type · `tooling/lsp/server.ts:57`

```ts
export type OutgoingMessage = JsonRpcResponse | JsonRpcNotification;
```


## `STLanguageServer`

> Class · `tooling/lsp/server.ts:70`

Implementa el Language Server Protocol mínimo para archivos `.st`.

Diseñado para que la lógica de dispatch sea testeable sin streams: usa
`dispatch()` directamente o llama `listen(stdin, stdout)` para correrlo
conectado a procesos.

```ts
export class STLanguageServer
```

