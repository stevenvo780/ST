# `tooling/lsp/types.ts`

Mensaje base JSON-RPC 2.0.

## Contents

- [`JsonRpcMessage`](#jsonrpcmessage) — Interface
- [`JsonRpcId`](#jsonrpcid) — Type
- [`JsonRpcRequest`](#jsonrpcrequest) — Interface
- [`JsonRpcNotification`](#jsonrpcnotification) — Interface
- [`JsonRpcResponse`](#jsonrpcresponse) — Interface
- [`JsonRpcResponseError`](#jsonrpcresponseerror) — Interface
- [`JSON_RPC_ERROR_CODES`](#json-rpc-error-codes) — Const
- [`Position`](#position) — Interface
- [`Range`](#range) — Interface
- [`Location`](#location) — Interface
- [`TextDocumentIdentifier`](#textdocumentidentifier) — Interface
- [`VersionedTextDocumentIdentifier`](#versionedtextdocumentidentifier) — Interface
- [`TextDocumentItem`](#textdocumentitem) — Interface
- [`TextDocumentContentChangeEvent`](#textdocumentcontentchangeevent) — Interface
- [`TextDocumentPositionParams`](#textdocumentpositionparams) — Interface
- [`DiagnosticSeverity`](#diagnosticseverity) — Enum
- [`LspDiagnostic`](#lspdiagnostic) — Interface
- [`PublishDiagnosticsParams`](#publishdiagnosticsparams) — Interface
- [`MarkupContent`](#markupcontent) — Interface
- [`Hover`](#hover) — Interface
- [`CompletionItemKind`](#completionitemkind) — Enum
- [`InsertTextFormat`](#inserttextformat) — Enum
- [`LspCompletionItem`](#lspcompletionitem) — Interface
- [`TextDocumentSyncKind`](#textdocumentsynckind) — Enum
- [`InitializeResult`](#initializeresult) — Interface
- [`ServerCapabilities`](#servercapabilities) — Interface

## `JsonRpcMessage`

> Interface · `tooling/lsp/types.ts:11`

Mensaje base JSON-RPC 2.0.

```ts
export interface JsonRpcMessage
```


## `JsonRpcId`

> Type · `tooling/lsp/types.ts:16`

Identificador de una petición JSON-RPC: número, string o null (para notificaciones).

```ts
export type JsonRpcId = number | string | null;
```


## `JsonRpcRequest`

> Interface · `tooling/lsp/types.ts:19`

Petición JSON-RPC 2.0 con id, método y parámetros opcionales.

```ts
export interface JsonRpcRequest extends JsonRpcMessage
```


## `JsonRpcNotification`

> Interface · `tooling/lsp/types.ts:26`

Notificación JSON-RPC 2.0 (sin id, no requiere respuesta).

```ts
export interface JsonRpcNotification extends JsonRpcMessage
```


## `JsonRpcResponse`

> Interface · `tooling/lsp/types.ts:32`

Respuesta JSON-RPC 2.0: resultado exitoso o error.

```ts
export interface JsonRpcResponse extends JsonRpcMessage
```


## `JsonRpcResponseError`

> Interface · `tooling/lsp/types.ts:39`

Error en una respuesta JSON-RPC 2.0: código numérico, mensaje y datos opcionales.

```ts
export interface JsonRpcResponseError
```


## `JSON_RPC_ERROR_CODES`

> Const · `tooling/lsp/types.ts:46`

Códigos de error estándar JSON-RPC 2.0 y extensiones LSP (RequestCancelled).

```ts
const JSON_RPC_ERROR_CODES
```


## `Position`

> Interface · `tooling/lsp/types.ts:59`

Posición LSP (0-based): línea y carácter dentro de un documento de texto.

```ts
export interface Position
```


## `Range`

> Interface · `tooling/lsp/types.ts:65`

Rango LSP: par de posiciones inicio/fin que delimitan una región del texto.

```ts
export interface Range
```


## `Location`

> Interface · `tooling/lsp/types.ts:71`

Ubicación LSP: URI del documento y rango dentro de él.

```ts
export interface Location
```


## `TextDocumentIdentifier`

> Interface · `tooling/lsp/types.ts:77`

Identificador de documento de texto LSP: solo su URI.

```ts
export interface TextDocumentIdentifier
```


## `VersionedTextDocumentIdentifier`

> Interface · `tooling/lsp/types.ts:82`

Identificador de documento con número de versión para sincronización incremental.

```ts
export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier
```


## `TextDocumentItem`

> Interface · `tooling/lsp/types.ts:87`

Ítem de documento de texto LSP: URI, languageId, versión y contenido completo.

```ts
export interface TextDocumentItem
```


## `TextDocumentContentChangeEvent`

> Interface · `tooling/lsp/types.ts:94`

```ts
export interface TextDocumentContentChangeEvent
```


## `TextDocumentPositionParams`

> Interface · `tooling/lsp/types.ts:99`

```ts
export interface TextDocumentPositionParams
```


## `DiagnosticSeverity`

> Enum · `tooling/lsp/types.ts:106`

```ts
export enum DiagnosticSeverity
```


## `LspDiagnostic`

> Interface · `tooling/lsp/types.ts:113`

```ts
export interface LspDiagnostic
```


## `PublishDiagnosticsParams`

> Interface · `tooling/lsp/types.ts:121`

```ts
export interface PublishDiagnosticsParams
```


## `MarkupContent`

> Interface · `tooling/lsp/types.ts:129`

```ts
export interface MarkupContent
```


## `Hover`

> Interface · `tooling/lsp/types.ts:134`

```ts
export interface Hover
```


## `CompletionItemKind`

> Enum · `tooling/lsp/types.ts:141`

```ts
export enum CompletionItemKind
```


## `InsertTextFormat`

> Enum · `tooling/lsp/types.ts:169`

```ts
export enum InsertTextFormat
```


## `LspCompletionItem`

> Interface · `tooling/lsp/types.ts:174`

```ts
export interface LspCompletionItem
```


## `TextDocumentSyncKind`

> Enum · `tooling/lsp/types.ts:185`

```ts
export enum TextDocumentSyncKind
```


## `InitializeResult`

> Interface · `tooling/lsp/types.ts:191`

```ts
export interface InitializeResult
```


## `ServerCapabilities`

> Interface · `tooling/lsp/types.ts:196`

```ts
export interface ServerCapabilities
```

