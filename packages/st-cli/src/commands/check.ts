/**
 * st check <file.st> [--profile X]
 *
 * Parse and validate a .st file. Reads ;; profile: header if present.
 * Exits 0 on success, 1 on errors.
 */
import * as fs from 'fs';
import * as path from 'path';
import { evaluate } from '@stevenvo780/st-lang/api';
import { profileHeader, resolveProfile } from '../utils/profile.js';
import { printSuccess, printError, printWarning, printJSON, FormatOptions } from '../utils/format.js';

export interface CheckOptions extends FormatOptions {
  profile?: string;
}

/** Exported for testability */
export function runCheck(filePath: string, opts: CheckOptions): number {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    if (opts.json) {
      printJSON({ ok: false, error: `File not found: ${fullPath}` });
    } else {
      printError(`File not found: ${fullPath}`, opts);
    }
    return 1;
  }

  const rawSource = fs.readFileSync(fullPath, 'utf-8');

  // Detect profile from file header comment: ;; profile: modal.s4
  let detectedProfile: string | undefined;
  const headerMatch = /^;;\s*profile:\s*(\S+)/m.exec(rawSource);
  if (headerMatch) {
    detectedProfile = headerMatch[1];
  }

  const profile = opts.profile ?? detectedProfile;
  const resolvedProfile = profile ? (resolveProfile(profile) ?? profile) : 'classical.propositional';

  // Strip ;; comment lines (metadata headers) — st-lang doesn't parse them
  const source = rawSource.split('\n').filter(line => !line.trim().startsWith(';;')).join('\n');

  // Prepend logic declaration if source doesn't already have one
  let fullSource = source;
  if (!/^\s*logic\s+/m.test(source)) {
    fullSource = `${profileHeader(resolvedProfile)}\n${source}`;
  }

  const result = evaluate(fullSource, fullPath);

  if (opts.json) {
    printJSON({
      ok: result.ok,
      file: fullPath,
      profile: resolvedProfile,
      exitCode: result.exitCode,
      diagnostics: result.diagnostics,
      stdout: result.stdout,
    });
    return result.ok ? 0 : 1;
  }

  if (result.ok) {
    printSuccess(`${path.basename(fullPath)} — no errors (profile: ${resolvedProfile})`, opts);
  } else {
    printError(`${path.basename(fullPath)} — ${result.diagnostics.filter(d => d.severity === 'error').length} error(s)`, opts);
    for (const d of result.diagnostics) {
      if (d.severity === 'error') {
        printError(`  ${d.message}${d.line != null ? ` (line ${d.line})` : ''}`, opts);
      }
    }
  }

  const warnings = result.diagnostics.filter(d => d.severity === 'warning');
  if (warnings.length > 0) {
    for (const w of warnings) {
      printWarning(`  ${w.message}${w.line != null ? ` (line ${w.line})` : ''}`, opts);
    }
  }

  if (result.stdout && !result.ok) {
    console.log(result.stdout);
  }

  return result.ok ? 0 : 1;
}

export function registerCheck(program: import('commander').Command): void {
  program
    .command('check <file>')
    .description('Verify a .st file against its logical profile')
    .option('--profile <slug>', 'Logical profile (overrides ;; profile: header)', undefined)
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Verbose output')
    .action((file: string, opts: CheckOptions) => {
      const code = runCheck(file, opts);
      process.exit(code);
    });
}
