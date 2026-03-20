#!/usr/bin/env node
// ============================================================
// ST CLI — Entry point principal (Commander based)
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Command } from 'commander';
import chalk from 'chalk';
import { Interpreter } from '../runtime/interpreter';
import { REPL } from '../repl/repl';
import { ProtocolHandler } from '../protocol/handler';
import { registry } from '../profiles/interface';
import { ProtocolRequest } from '../types';

// Version is injected at bundle time via esbuild --define, or read from package.json in dev
declare const __ST_VERSION__: string | undefined;
function getVersion(): string {
  if (typeof __ST_VERSION__ !== 'undefined') return __ST_VERSION__;
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'),
    ) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

const program = new Command();

program
  .name('st')
  .description('ST — Lenguaje ejecutable con nucleo logico y capa textual')
  .version(getVersion());

program
  .command('run')
  .description('Ejecutar script .st')
  .argument('<archivo>', 'Ruta al archivo .st')
  .option('-d, --diagnostics', 'Escribir diagnósticos en un archivo .json')
  .action((filePath: string, options: { diagnostics?: boolean }) => {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(chalk.red(`Error: archivo no encontrado: ${fullPath}`));
      process.exit(1);
    }

    const source = fs.readFileSync(fullPath, 'utf-8');
    const interpreter = new Interpreter();
    const output = interpreter.execute(source, fullPath);

    if (output.stdout) console.log(output.stdout);
    if (output.stderr) console.error(chalk.red(output.stderr));

    if (options.diagnostics) {
      const diagPath = fullPath.replace(/\.st$/, '.diagnostics.json');
      fs.writeFileSync(diagPath, JSON.stringify(output.diagnostics, null, 2));
      console.log(chalk.blue(`Diagnosticos escritos en: ${diagPath}`));
    }

    process.exit(output.exitCode);
  });

program
  .command('check')
  .description('Verificar sintaxis y bien-formacion de un archivo .st')
  .argument('<archivo>', 'Ruta al archivo .st')
  .action((filePath: string) => {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(chalk.red(`Error: archivo no encontrado: ${fullPath}`));
      process.exit(1);
    }

    const source = fs.readFileSync(fullPath, 'utf-8');
    const interpreter = new Interpreter();
    const output = interpreter.execute(source, fullPath);

    const errors = output.diagnostics.filter((d) => d.severity === 'error');
    const warnings = output.diagnostics.filter((d) => d.severity === 'warning');

    if (errors.length === 0) {
      console.log(chalk.green(`✓ ${fullPath}: sin errores`));
      if (warnings.length > 0) {
        console.log(chalk.yellow(`  ${warnings.length} advertencia(s)`));
        for (const w of warnings) {
          console.log(chalk.yellow(`  ⚠ ${w.message}${w.line ? ` (linea ${w.line})` : ''}`));
        }
      }
      for (const r of output.results) {
        if (r.status === 'invalid' || r.status === 'refutable' || r.status === 'unsatisfiable') {
          console.log(chalk.red(`  ✗ Resultado negativo: ${r.output}`));
        }
      }
      const hasNegativeResults = output.results.some(
        (r) => r.status === 'invalid' || r.status === 'refutable',
      );
      process.exit(hasNegativeResults ? 4 : 0);
    } else {
      console.error(chalk.red(`✗ ${fullPath}: ${errors.length} error(es)`));
      for (const e of errors) {
        console.error(chalk.red(`  ✗ ${e.message}${e.line ? ` (linea ${e.line})` : ''}`));
      }
      process.exit(1);
    }
  });

program
  .command('repl')
  .description('Iniciar REPL interactivo')
  .action(() => {
    const repl = new REPL();
    repl.start();
  });

program
  .command('eval')
  .description('Evaluar una expresion directa')
  .argument('<expresion>', 'Expresion ST a evaluar')
  .action((expression: string) => {
    const interpreter = new Interpreter();
    let fullSource = expression;
    if (!expression.trim().startsWith('logic ')) {
      fullSource = `logic classical.propositional\n${expression}`;
    }

    const output = interpreter.execute(fullSource, '<eval>');
    if (output.stdout) console.log(output.stdout);
    if (output.stderr) console.error(chalk.red(output.stderr));
    process.exit(output.exitCode);
  });

program
  .command('profiles')
  .description('Listar perfiles logicos disponibles')
  .action(() => {
    new Interpreter(); // Asegura registro
    console.log(chalk.bold('Perfiles logicos disponibles:\n'));
    for (const name of registry.list()) {
      const p = registry.get(name);
      const status =
        name === 'classical.propositional' ? chalk.green('completo') : chalk.yellow('stub');
      console.log(`  ${chalk.cyan(name)} [${status}]`);
      if (p?.description) console.log(`    ${p.description}`);
      console.log('');
    }
  });

program
  .command('protocol')
  .description('Modo JSON-RPC para integracion con editores (LSP-like)')
  .action(() => {
    const handler = new ProtocolHandler();
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', (line: string) => {
      try {
        const request = JSON.parse(line) as ProtocolRequest;
        const response = handler.handle(request);
        console.log(JSON.stringify(response));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.log(
          JSON.stringify({
            id: -1,
            error: { code: -32700, message: `Parse error: ${message}` },
          }),
        );
      }
    });
  });

// Handle unknown commands
program.on('command:*', () => {
  const args = program.args;
  if (args.length > 0 && (args[0].endsWith('.st') || args[0].endsWith('.md.st'))) {
    // Legacy support for `st file.st`
    const filePath = path.resolve(args[0]);
    if (fs.existsSync(filePath)) {
      const source = fs.readFileSync(filePath, 'utf-8');
      const interpreter = new Interpreter();
      const output = interpreter.execute(source, filePath);
      if (output.stdout) console.log(output.stdout);
      if (output.stderr) console.error(chalk.red(output.stderr));
      process.exit(output.exitCode);
    }
  }
  console.error(chalk.red(`Comando desconocido: ${program.args.join(' ')}`));
  console.error(`Usa 'st --help' para ver los comandos disponibles.`);
  process.exit(1);
});

if (process.argv.length === 2) {
  program.help();
} else {
  program.parse(process.argv);
}
