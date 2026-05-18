import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listProfiles } from '@stevenvo780/st-lang/api';
import {
  CheckInputShape,
  DeriveInputShape,
  CountermodelInputShape,
  FormalizeInputShape,
  type CheckInputT,
  type DeriveInputT,
  type CountermodelInputT,
  type FormalizeInputT,
} from './schemas.js';
import { runCheck } from './tools/st-check.js';
import { runDerive } from './tools/st-derive.js';
import { runCountermodel } from './tools/st-countermodel.js';
import { runFormalize } from './tools/st-formalize.js';

export const SERVER_NAME = '@stevenvo780/st-mcp';
export const SERVER_VERSION = '0.1.0';

/**
 * Construye un McpServer configurado con las 4 tools de ST. El caller
 * decide qué transport conectarle (stdio para uso en Claude Code /
 * Cursor, InMemoryTransport para tests, etc.).
 */
export function createServer(): McpServer {
  const profiles = listProfiles();
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions: [
        'ST — motor lógico ejecutable multi-perfil expuesto vía MCP.',
        '',
        'Tools disponibles:',
        '  • st_check        Verifica si una fórmula es válida en un perfil.',
        '  • st_derive       Deriva una conclusión a partir de axiomas.',
        '  • st_countermodel Busca una valuación que falsifique una fórmula.',
        '  • st_formalize    Registra y valida una formalización propuesta.',
        '',
        `Perfiles soportados: ${profiles.join(', ')}.`,
        '',
        'Sintaxis ST básica:',
        '  - Conectores: ! (no), & (y), | (o), -> (implica), <-> (equivale).',
        '  - Cuantificadores: forall x. P(x), exists x. P(x).',
        '  - Modales: [] P (necesidad), <> P (posibilidad).',
        '  - Paréntesis recomendados en operandos compuestos.',
      ].join('\n'),
    },
  );

  // Helper: convierte el output de cada runner en el shape que MCP espera
  // (un array de "content" con texto y, opcionalmente, structuredContent).
  const toToolResult = (data: unknown, summary: string) => {
    const text = typeof summary === 'string' && summary.length > 0 ? summary : 'OK';
    return {
      content: [{ type: 'text' as const, text }],
      structuredContent: data as Record<string, unknown>,
    };
  };

  const wrapError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error ejecutando la tool ST: ${msg}`,
        },
      ],
      structuredContent: { ok: false, error: msg },
    };
  };

  server.registerTool(
    'st_check',
    {
      title: 'ST · check valid',
      description:
        'Verifica si una fórmula lógica es válida (tautología/teorema) bajo el perfil indicado. Devuelve status, valid:boolean, summary y nota educativa.',
      inputSchema: CheckInputShape,
    },
    async (args: CheckInputT) => {
      try {
        const result = runCheck(args);
        return toToolResult(result, result.summary);
      } catch (err) {
        return wrapError(err);
      }
    },
  );

  server.registerTool(
    'st_derive',
    {
      title: 'ST · derive',
      description:
        'Intenta derivar una conclusión a partir de una lista de axiomas. Devuelve status, derivable:boolean y summary. Los axiomas se nombran a1..aN automáticamente.',
      inputSchema: DeriveInputShape,
    },
    async (args: DeriveInputT) => {
      try {
        const result = runDerive(args);
        return toToolResult(result, result.summary);
      } catch (err) {
        return wrapError(err);
      }
    },
  );

  server.registerTool(
    'st_countermodel',
    {
      title: 'ST · countermodel',
      description:
        'Busca un modelo (valuación) que falsifique la fórmula. Si la fórmula es válida, found=false; si encuentra contramodelo, found=true y se incluye el modelo concreto.',
      inputSchema: CountermodelInputShape,
    },
    async (args: CountermodelInputT) => {
      try {
        const result = runCountermodel(args);
        return toToolResult(result, result.summary);
      } catch (err) {
        return wrapError(err);
      }
    },
  );

  server.registerTool(
    'st_formalize',
    {
      title: 'ST · formalize',
      description:
        'Registra un pasaje de texto natural junto a su contraparte formal en sintaxis ST y la valida bajo el perfil indicado. Útil para capturar la formalización propuesta por el LLM y detectar typos sintácticos.',
      inputSchema: FormalizeInputShape,
    },
    async (args: FormalizeInputT) => {
      try {
        const result = runFormalize(args);
        return toToolResult(result, result.summary);
      } catch (err) {
        return wrapError(err);
      }
    },
  );

  return server;
}

export {
  CheckInputShape,
  DeriveInputShape,
  CountermodelInputShape,
  FormalizeInputShape,
  KNOWN_PROFILES,
} from './schemas.js';
export type {
  CheckInputT,
  DeriveInputT,
  CountermodelInputT,
  FormalizeInputT,
} from './schemas.js';
export { runCheck } from './tools/st-check.js';
export { runDerive } from './tools/st-derive.js';
export { runCountermodel } from './tools/st-countermodel.js';
export { runFormalize } from './tools/st-formalize.js';
export type { CheckResult } from './tools/st-check.js';
export type { DeriveResult } from './tools/st-derive.js';
export type { CountermodelResult } from './tools/st-countermodel.js';
export type { FormalizeResult } from './tools/st-formalize.js';
