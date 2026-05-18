#!/usr/bin/env node
/**
 * ST CLI — @stevenvo780/st-cli
 *
 * Proof assistant CLI powered by @stevenvo780/st-lang.
 * Usage: st <command> [options]
 */
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { registerCheck } from './commands/check.js';
import { registerDerive } from './commands/derive.js';
import { registerCountermodel } from './commands/countermodel.js';
import { registerFormalize } from './commands/formalize.js';
import { registerExport } from './commands/export.js';
import { registerRepl } from './commands/repl.js';

function getVersion(): string {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version: string };
    return pkg.version;
  } catch {
    return '0.1.0';
  }
}

const program = new Command();

program
  .name('st')
  .description(
    'ST — proof assistant CLI (powered by @stevenvo780/st-lang)\n' +
    '\n' +
    'Examples:\n' +
    '  st check proof.st --profile modal.s4\n' +
    '  st derive "p -> p"\n' +
    '  st countermodel "p & ~p"\n' +
    '  st formalize "If it rains then the ground is wet"\n' +
    '  st export proof.st --to lean\n' +
    '  st repl --profile intuitionistic.nj',
  )
  .version(getVersion());

// Register all subcommands
registerCheck(program);
registerDerive(program);
registerCountermodel(program);
registerFormalize(program);
registerExport(program);
registerRepl(program);

// Show help if no arguments given
if (process.argv.length <= 2) {
  program.help();
} else {
  program.parse(process.argv);
}
