/**
 * st countermodel <formula> [--profile X]
 *
 * If the formula is not valid/derivable, show a countermodel.
 * Exits 0 if a countermodel was found (formula is invalid),
 * exits 1 if formula is valid (no countermodel possible),
 * exits 2 on error.
 */
import { evaluate } from '@stevenvo780/st-lang/api';
import { profileHeader, resolveProfile } from '../utils/profile.js';
import { printSuccess, printError, printInfo, printJSON, FormatOptions } from '../utils/format.js';

export interface CountermodelOptions extends FormatOptions {
  profile?: string;
}

/** Exported for testability */
export function runCountermodel(formula: string, opts: CountermodelOptions): number {
  const resolvedProfile = opts.profile
    ? (resolveProfile(opts.profile) ?? opts.profile)
    : 'classical.propositional';

  // Use 'countermodel' command to find a countermodel
  const source = [
    profileHeader(resolvedProfile),
    `countermodel ${formula.trim()}`,
  ].join('\n');

  printInfo(`Checking countermodel with profile: ${resolvedProfile}`, opts);

  const result = evaluate(source, '<countermodel>');

  if (opts.json) {
    const hasCountermodel = result.stdout.includes('Contramodelo encontrado');
    printJSON({
      formula,
      profile: resolvedProfile,
      countermodelFound: hasCountermodel,
      stdout: result.stdout,
      stderr: result.stderr,
      diagnostics: result.diagnostics,
    });
    if (hasCountermodel) return 0;
    if (!result.ok) return 2;
    return 1;
  }

  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);

  const output = result.stdout + result.stderr;
  // st-lang outputs "Contramodelo encontrado" when a countermodel is found
  const foundCountermodel = output.includes('Contramodelo encontrado') || output.includes('contramodelo encontrado');
  // st-lang outputs "es tautologia" or "no hay contramodelo" when no countermodel exists
  const isTautology = output.includes('tautologia') || output.includes('no hay contramodelo');

  if (foundCountermodel) {
    printSuccess(`Countermodel found for "${formula}"`, opts);
    return 0;
  }

  if (isTautology) {
    printError(`"${formula}" is a tautology — no countermodel exists`, opts);
    return 1;
  }

  if (!result.ok) {
    printError(`Could not determine countermodel for "${formula}"`, opts);
    return 2;
  }

  printInfo(`No countermodel found for "${formula}"`, opts);
  return 1;
}

export function registerCountermodel(program: import('commander').Command): void {
  program
    .command('countermodel <formula>')
    .description('Show countermodel if formula is invalid')
    .option('--profile <slug>', 'Logical profile (default: classical.propositional)')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Verbose output')
    .action((formula: string, opts: CountermodelOptions) => {
      const code = runCountermodel(formula, opts);
      process.exit(code);
    });
}
