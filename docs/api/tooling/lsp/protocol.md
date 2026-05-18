# `tooling/lsp/protocol.ts`

============================================================ ST LSP — Framing JSON-RPC base ============================================================

## Contents

- [`IncomingMessage`](#incomingmessage) — Type
- [`FramedParseResult`](#framedparseresult) — Interface
- [`encodeMessage`](#encodemessage) — Function
- [`parseFrames`](#parseframes) — Function
- [`isRequest`](#isrequest) — Function
- [`isNotification`](#isnotification) — Function

## `IncomingMessage`

> Type · `tooling/lsp/protocol.ts:10`

```ts
export type IncomingMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;
```


## `FramedParseResult`

> Interface · `tooling/lsp/protocol.ts:12`

```ts
export interface FramedParseResult
```


## `encodeMessage`

> Function · `tooling/lsp/protocol.ts:21`

Codifica un mensaje JSON-RPC con framing Content-Length de LSP.
Devuelve un Buffer listo para escribir a stdout.

```ts
export function encodeMessage(message: JsonRpcResponse | JsonRpcNotification): Buffer
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `message` | `JsonRpcResponse \| JsonRpcNotification` | no |  |

### Returns

`Buffer` — 


## `parseFrames`

> Function · `tooling/lsp/protocol.ts:33`

Acumula chunks entrantes y extrae todos los mensajes completos. Lo que
sobra (header parcial o body parcial) vuelve en `remainder` para reintentar
en la siguiente entrega.

```ts
export function parseFrames(buffer: Buffer): FramedParseResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `buffer` | `Buffer` | no |  |

### Returns

`FramedParseResult` — 


## `isRequest`

> Function · `tooling/lsp/protocol.ts:68`

```ts
export function isRequest(message: IncomingMessage): message is JsonRpcRequest
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `message` | `IncomingMessage` | no |  |

### Returns

`message is JsonRpcRequest` — 


## `isNotification`

> Function · `tooling/lsp/protocol.ts:72`

```ts
export function isNotification(message: IncomingMessage): message is JsonRpcNotification
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `message` | `IncomingMessage` | no |  |

### Returns

`message is JsonRpcNotification` — 

