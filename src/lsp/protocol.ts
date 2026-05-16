// ============================================================
// ST LSP — Framing JSON-RPC base
// ============================================================

import { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse } from './types';

const CONTENT_LENGTH_RE = /Content-Length:\s*(\d+)/i;
const HEADER_TERMINATOR = '\r\n\r\n';

export type IncomingMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;

export interface FramedParseResult {
  messages: IncomingMessage[];
  remainder: Buffer;
}

/**
 * Codifica un mensaje JSON-RPC con framing Content-Length de LSP.
 * Devuelve un Buffer listo para escribir a stdout.
 */
export function encodeMessage(message: JsonRpcResponse | JsonRpcNotification): Buffer {
  const json = JSON.stringify(message);
  const body = Buffer.from(json, 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8');
  return Buffer.concat([header, body]);
}

/**
 * Acumula chunks entrantes y extrae todos los mensajes completos. Lo que
 * sobra (header parcial o body parcial) vuelve en `remainder` para reintentar
 * en la siguiente entrega.
 */
export function parseFrames(buffer: Buffer): FramedParseResult {
  const messages: IncomingMessage[] = [];
  let cursor = 0;

  while (cursor < buffer.length) {
    const headerEnd = buffer.indexOf(HEADER_TERMINATOR, cursor, 'utf8');
    if (headerEnd === -1) break;

    const headerText = buffer.slice(cursor, headerEnd).toString('utf8');
    const match = CONTENT_LENGTH_RE.exec(headerText);
    if (!match) {
      cursor = headerEnd + HEADER_TERMINATOR.length;
      continue;
    }

    const contentLength = Number.parseInt(match[1], 10);
    const bodyStart = headerEnd + HEADER_TERMINATOR.length;
    const bodyEnd = bodyStart + contentLength;
    if (bodyEnd > buffer.length) break;

    const body = buffer.slice(bodyStart, bodyEnd).toString('utf8');
    try {
      const parsed = JSON.parse(body) as IncomingMessage;
      messages.push(parsed);
    } catch {
      // Mensaje invalido: lo descartamos para no quedar atascados; el server
      // puede responder con un error si lo identifica via id.
    }

    cursor = bodyEnd;
  }

  return { messages, remainder: buffer.slice(cursor) };
}

export function isRequest(message: IncomingMessage): message is JsonRpcRequest {
  return 'method' in message && 'id' in message && message.id !== undefined;
}

export function isNotification(message: IncomingMessage): message is JsonRpcNotification {
  return 'method' in message && !('id' in message);
}
