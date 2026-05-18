#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer, SERVER_NAME, SERVER_VERSION } from './index.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write(`${SERVER_NAME} ${SERVER_VERSION}\n`);
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(
      [
        `${SERVER_NAME} ${SERVER_VERSION}`,
        '',
        'MCP server que expone las tools core de ST (st_check, st_derive,',
        'st_countermodel, st_formalize) sobre stdio.',
        '',
        'Uso típico (Claude Code / Cursor / etc.):',
        '  Añadir al claude_desktop_config.json:',
        '    "st-mcp": {',
        '      "command": "npx",',
        '      "args": ["-y", "@stevenvo780/st-mcp"]',
        '    }',
        '',
        'Para correrlo manualmente (stdio):',
        '  npx -y @stevenvo780/st-mcp',
        '',
        'Flags:',
        '  --version, -v    Muestra la versión y sale.',
        '  --help, -h       Muestra esta ayuda y sale.',
        '',
      ].join('\n'),
    );
    return;
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  // Conectarse al transport stdio: este proceso vivirá hasta que el cliente
  // cierre la conexión (típico de Claude Code / Cursor al apagarse).
  await server.connect(transport);

  // Logging muy básico hacia stderr (NUNCA stdout — stdout es para JSON-RPC).
  process.stderr.write(`[st-mcp] ${SERVER_NAME} ${SERVER_VERSION} listo via stdio.\n`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`[st-mcp] fatal: ${msg}\n`);
  process.exit(1);
});
