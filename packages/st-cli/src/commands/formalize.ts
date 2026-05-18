/**
 * st formalize <text> [--profile X] [--as <formula>]
 *
 * Register a passage and optionally formalize it as an ST formula.
 * With --as: validates the formula by registering it as a formalization.
 * Without --as: shows a template for manual formalization.
 */
import { evaluate } from '@stevenvo780/st-lang/api';
import { profileHeader, resolveProfile } from '../utils/profile.js';
import { printSuccess, printError, printInfo, printJSON, FormatOptions } from '../utils/format.js';
import chalk from 'chalk';

export interface FormalizeOptions extends FormatOptions {
  profile?: string;
  as?: string;
}

/** Exported for testability */
export function runFormalize(text: string, opts: FormalizeOptions): number {
  const resolvedProfile = opts.profile
    ? (resolveProfile(opts.profile) ?? opts.profile)
    : 'classical.propositional';

  printInfo(`Formalizing with profile: ${resolvedProfile}`, opts);

  if (opts.as) {
    // Formalize text as the given formula
    const formulaStr = opts.as.trim();
    const source = [
      profileHeader(resolvedProfile),
      `let p = passage([[cli-input#b1]])`,
      `let phi = formalize p as (${formulaStr})`,
      `claim result = phi`,
    ].join('\n');

    const result = evaluate(source, '<formalize>');

    if (opts.json) {
      printJSON({
        ok: result.ok,
        input: text,
        formula: formulaStr,
        profile: resolvedProfile,
        stdout: result.stdout,
        stderr: result.stderr,
        diagnostics: result.diagnostics,
      });
      return result.ok ? 0 : 1;
    }

    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    if (result.ok) {
      printSuccess(`Formalized as: ${formulaStr}`, opts);
    } else {
      printError(`Formalization failed`, opts);
    }
    return result.ok ? 0 : 1;
  }

  // Without --as: print template for manual formalization
  if (opts.json) {
    printJSON({
      ok: true,
      input: text,
      profile: resolvedProfile,
      hint: 'Use --as <formula> to validate a specific formalization',
      template: [
        `${profileHeader(resolvedProfile)}`,
        `let p = passage([[my-doc#section]])`,
        `let phi = formalize p as (P -> Q)`,
        `claim result = phi`,
      ].join('\n'),
    });
    return 0;
  }

  console.log(chalk.bold('\nFormalization template for: ') + chalk.cyan(`"${text}"`));
  console.log(chalk.dim('\nST source to formalize this passage:\n'));
  console.log(chalk.green(`  ${profileHeader(resolvedProfile)}`));
  console.log(chalk.green(`  let p = passage([[my-doc#section]])`));
  console.log(chalk.green(`  let phi = formalize p as (<your-formula>)`));
  console.log(chalk.green(`  claim result = phi`));
  console.log('');
  console.log(chalk.yellow('  Tip: Use --as <formula> to validate a specific formalization'));
  console.log(chalk.yellow(`  Example: st formalize "${text}" --as "P -> Q"`));
  console.log('');

  return 0;
}

export function registerFormalize(program: import('commander').Command): void {
  program
    .command('formalize <text>')
    .description('Show formalization template or validate a formula (use --as <formula>)')
    .option('--profile <slug>', 'Logical profile (default: classical.propositional)')
    .option('--as <formula>', 'ST formula to validate as formalization of the text')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Verbose output')
    .action((text: string, opts: FormalizeOptions) => {
      const code = runFormalize(text, opts);
      process.exit(code);
    });
}
