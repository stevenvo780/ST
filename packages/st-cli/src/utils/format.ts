/**
 * Output formatting utilities — color output, tables, JSON mode.
 */
import chalk from 'chalk';

export interface FormatOptions {
  json?: boolean;
  verbose?: boolean;
}

/** Print success message */
export function printSuccess(msg: string, opts: FormatOptions = {}): void {
  if (opts.json) return;
  console.log(chalk.green('✓ ') + msg);
}

/** Print error message */
export function printError(msg: string, opts: FormatOptions = {}): void {
  if (opts.json) return;
  console.error(chalk.red('✗ ') + msg);
}

/** Print warning message */
export function printWarning(msg: string, opts: FormatOptions = {}): void {
  if (opts.json) return;
  console.warn(chalk.yellow('⚠ ') + msg);
}

/** Print info/verbose message */
export function printInfo(msg: string, opts: FormatOptions = {}): void {
  if (opts.json) return;
  if (opts.verbose) console.log(chalk.blue('ℹ ') + msg);
}

/** Print a section header */
export function printHeader(title: string, opts: FormatOptions = {}): void {
  if (opts.json) return;
  console.log('\n' + chalk.bold.cyan(title));
  console.log(chalk.dim('─'.repeat(Math.min(title.length + 2, 60))));
}

/** Print a simple 2-column table */
export function printTable(rows: [string, string][], opts: FormatOptions = {}): void {
  if (opts.json) return;
  const maxKey = Math.max(...rows.map(([k]) => k.length));
  for (const [key, val] of rows) {
    console.log('  ' + chalk.cyan(key.padEnd(maxKey + 2)) + val);
  }
}

/** Print JSON result and exit */
export function printJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/** Format diagnostic severity */
export function severityColor(severity: string): string {
  switch (severity) {
    case 'error': return chalk.red(severity);
    case 'warning': return chalk.yellow(severity);
    case 'hint': return chalk.blue(severity);
    default: return chalk.gray(severity);
  }
}
