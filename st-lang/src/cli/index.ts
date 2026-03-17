// ============================================================
// ST CLI — Entry point principal
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { Interpreter } from '../runtime/interpreter';
import { REPL } from '../repl/repl';
import { ProtocolHandler } from '../protocol/handler';

const VERSION = '0.1.0';

function printUsage(): void {
  console.log(`
st v${VERSION} — Lenguaje ejecutable con nucleo logico y capa textual

Uso:
  st run <archivo.st>                    Ejecutar script
  st check <archivo.st>                  Verificar sintaxis y bien-formacion
  st repl                                Iniciar REPL interactivo
  st eval "<expresion>"                  Evaluar expresion directa
  st render <archivo.st> --format <fmt>  Renderizar salida (markdown|json)
  st version                             Mostrar version
  st help                                Mostrar esta ayuda
  st profiles                            Listar perfiles logicos

Codigos de salida:
  0  Ejecucion correcta
  1  Error de parseo o tipado
  2  Error de resolucion
  3  Error de runtime
  4  Resultado logico negativo esperado

Ejemplos:
  st run demo.st
  st check demo.st
  st eval "check valid (P -> (Q -> P))"
  st repl
`);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'run':
      return cmdRun(args.slice(1));
    case 'check':
      return cmdCheck(args.slice(1));
    case 'repl':
      return cmdRepl();
    case 'eval':
      return cmdEval(args.slice(1));
    case 'render':
      return cmdRender(args.slice(1));
    case 'version':
    case '--version':
    case '-v':
      console.log(`st v${VERSION}`);
      process.exit(0);
      break;
    case 'help':
    case '--help':
    case '-h':
      printUsage();
      process.exit(0);
      break;
    case 'profiles':
      return cmdProfiles();
    case 'protocol':
      return cmdProtocol(args.slice(1));
    default:
      // Si es un archivo, ejecutar como `st run`
      if (args[0].endsWith('.st') || args[0].endsWith('.md.st')) {
        return cmdRun(args);
      }
      console.error(`Comando desconocido: ${command}`);
      console.error(`Usa 'st help' para ver los comandos disponibles.`);
      process.exit(1);
  }
}

function cmdRun(args: string[]): void {
  if (args.length === 0) {
    console.error('Error: se necesita un archivo. Uso: st run <archivo.st>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const interpreter = new Interpreter();
  const output = interpreter.execute(source, filePath);

  if (output.stdout) {
    console.log(output.stdout);
  }
  if (output.stderr) {
    console.error(output.stderr);
  }

  // Escribir diagnósticos si se pide
  if (args.includes('--diagnostics')) {
    const diagPath = filePath.replace(/\.st$/, '.diagnostics.json');
    fs.writeFileSync(diagPath, JSON.stringify(output.diagnostics, null, 2));
    console.log(`Diagnosticos escritos en: ${diagPath}`);
  }

  process.exit(output.exitCode);
}

function cmdCheck(args: string[]): void {
  if (args.length === 0) {
    console.error('Error: se necesita un archivo. Uso: st check <archivo.st>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const interpreter = new Interpreter();
  const output = interpreter.execute(source, filePath);

  const errors = output.diagnostics.filter(d => d.severity === 'error');
  const warnings = output.diagnostics.filter(d => d.severity === 'warning');

  if (errors.length === 0) {
    console.log(`✓ ${filePath}: sin errores`);
    if (warnings.length > 0) {
      console.log(`  ${warnings.length} advertencia(s)`);
      for (const w of warnings) {
        console.log(`  ⚠ ${w.message}${w.line ? ` (linea ${w.line})` : ''}`);
      }
    }
    // Mostrar resultados lógicos
    for (const r of output.results) {
      if (r.status === 'invalid' || r.status === 'refutable' || r.status === 'unsatisfiable') {
        console.log(`  ✗ Resultado negativo: ${r.output}`);
      }
    }
    const hasNegativeResults = output.results.some(
      r => r.status === 'invalid' || r.status === 'refutable'
    );
    process.exit(hasNegativeResults ? 4 : 0);
  } else {
    console.error(`✗ ${filePath}: ${errors.length} error(es)`);
    for (const e of errors) {
      console.error(`  ✗ ${e.message}${e.line ? ` (linea ${e.line})` : ''}`);
    }
    process.exit(1);
  }
}

function cmdRepl(): void {
  const repl = new REPL();
  repl.start();
}

function cmdEval(args: string[]): void {
  if (args.length === 0) {
    console.error('Error: se necesita una expresion. Uso: st eval "<expresion>"');
    process.exit(1);
  }

  const source = args.join(' ');
  const interpreter = new Interpreter();

  // Si no empieza con "logic", prepend classical.propositional
  let fullSource = source;
  if (!source.trim().startsWith('logic ')) {
    fullSource = `logic classical.propositional\n${source}`;
  }

  const output = interpreter.execute(fullSource, '<eval>');

  if (output.stdout) {
    console.log(output.stdout);
  }
  if (output.stderr) {
    console.error(output.stderr);
  }

  process.exit(output.exitCode);
}

function cmdRender(args: string[]): void {
  if (args.length === 0) {
    console.error('Error: se necesita un archivo. Uso: st render <archivo.st> --format <fmt>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  let format = 'markdown';

  const fmtIdx = args.indexOf('--format');
  if (fmtIdx !== -1 && args[fmtIdx + 1]) {
    format = args[fmtIdx + 1];
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const handler = new ProtocolHandler();
  const response = handler.handle({
    id: 1,
    method: 'render',
    params: { source, file: filePath, format },
  });

  if (response.result) {
    const res = response.result as { rendered: string };
    console.log(res.rendered);
  }

  if (response.error) {
    console.error(response.error.message);
    process.exit(3);
  }

  process.exit(0);
}

function cmdProfiles(): void {
  // Forzar registro
  const interpreter = new Interpreter();
  const { registry } = require('../profiles/interface');

  console.log('Perfiles logicos disponibles:\n');
  for (const name of registry.list()) {
    const p = registry.get(name);
    const status = name === 'classical.propositional' ? '✓ completo' : '○ stub';
    console.log(`  ${name}`);
    console.log(`    ${p?.description || ''}`);
    console.log(`    Estado: ${status}`);
    console.log('');
  }
}

function cmdProtocol(args: string[]): void {
  // Modo JSON-RPC sobre stdin/stdout para integración con editores
  const handler = new ProtocolHandler();
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', (line: string) => {
    try {
      const request = JSON.parse(line);
      const response = handler.handle(request);
      console.log(JSON.stringify(response));
    } catch (e: any) {
      console.log(JSON.stringify({
        id: -1,
        error: { code: -32700, message: `Parse error: ${e.message}` },
      }));
    }
  });
}

main();
