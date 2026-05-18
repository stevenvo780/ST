/**
 * st derive <formula> [--profile X] [--axioms "A1, A2"]
 *
 * Attempt derivation of a formula and show the derivation tree.
 * Exits 0 if derivable, 1 if not.
 */
import { evaluate } from '@stevenvo780/st-lang/api';
import { profileHeader, resolveProfile } from '../utils/profile.js';
import { printSuccess, printError, printJSON, printInfo, FormatOptions } from '../utils/format.js';

export interface DeriveOptions extends FormatOptions {
  profile?: string;
  axioms?: string;
}

/** Exported for testability */
export function runDerive(formula: string, opts: DeriveOptions): number {
  const resolvedProfile = opts.profile
    ? (resolveProfile(opts.profile) ?? opts.profile)
    : 'classical.propositional';

  let sourceLines: string[] = [profileHeader(resolvedProfile)];

  if (opts.axioms) {
    // With axioms: declare them and derive formula from all
    const axiomNames: string[] = [];
    opts.axioms.split(',').forEach((a, i) => {
      const name = `a${i + 1}`;
      sourceLines.push(`axiom ${name} : ${a.trim()}`);
      axiomNames.push(name);
    });
    sourceLines.push(`derive ${formula.trim()} from ${axiomNames.join(', ')}`);
  } else {
    // Without axioms: use check valid (verifies if formula is a tautology)
    sourceLines.push(`check valid ${formula.trim()}`);
  }

  const source = sourceLines.join('\n');

  printInfo(`Running derive with profile: ${resolvedProfile}`, opts);

  const result = evaluate(source, '<derive>');

  if (opts.json) {
    printJSON({
      ok: result.ok,
      formula,
      profile: resolvedProfile,
      derivable: result.ok,
      stdout: result.stdout,
      stderr: result.stderr,
      diagnostics: result.diagnostics,
    });
    return result.ok ? 0 : 1;
  }

  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);

  if (result.ok) {
    printSuccess(`"${formula}" is derivable under ${resolvedProfile}`, opts);
  } else {
    printError(`"${formula}" could not be derived under ${resolvedProfile}`, opts);
  }

  return result.ok ? 0 : 1;
}

export function registerDerive(program: import('commander').Command): void {
  program
    .command('derive <formula>')
    .description('Attempt derivation of a formula')
    .option('--profile <slug>', 'Logical profile (default: classical.propositional)')
    .option('--axioms <list>', 'Comma-separated axioms to use in derivation')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Verbose output')
    .action((formula: string, opts: DeriveOptions) => {
      const code = runDerive(formula, opts);
      process.exit(code);
    });
}
