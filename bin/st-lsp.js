#!/usr/bin/env node
// ============================================================
// ST Language Server — entrypoint stdin/stdout
// ============================================================
//
// Arranca el LSP en modo standard (Content-Length framing sobre
// stdin/stdout). Para usar desde un editor:
//   "command": "node", "args": ["./bin/st-lsp.js"]
// O tras `npm i -g @stevenvo780/st-lang` simplemente:
//   "command": "st-lsp"

'use strict';

const path = require('path');

// El bin se publica junto a `dist/`. Resolvemos relativo a `__dirname`
// para que funcione tanto desde el repo (./bin/st-lsp.js → dist/lsp/server.js)
// como desde una instalación global (node_modules/@stevenvo780/st-lang/bin/...).
const candidates = [
  path.resolve(__dirname, '..', 'dist', 'lsp', 'server.js'),
  path.resolve(__dirname, '..', '..', 'dist', 'lsp', 'server.js'),
];

let serverModule = null;
let lastError = null;
for (const candidate of candidates) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    serverModule = require(candidate);
    break;
  } catch (err) {
    lastError = err;
  }
}

if (!serverModule) {
  process.stderr.write(
    '[st-lsp] no se pudo localizar dist/lsp/server.js. Ejecuta `npm run build` primero.\n',
  );
  if (lastError) process.stderr.write(`[st-lsp] último error: ${lastError.message}\n`);
  process.exit(1);
}

const { STLanguageServer } = serverModule;
const server = new STLanguageServer();
server.listen(process.stdin, process.stdout);

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
