/**
 * st repl [--profile X]
 *
 * Interactive REPL with prompt:  st [profile]>
 * Special commands: :profile <slug>, :profiles, :help, :quit
 */
import * as readline from 'readline';
import { evaluate } from '@stevenvo780/st-lang/api';
import { profileHeader, resolveProfile, listProfiles } from '../utils/profile.js';
import chalk from 'chalk';

export interface ReplOptions {
  profile?: string;
}

const REPL_HELP = `
ST Interactive REPL
-------------------
Enter ST expressions directly (logic declaration is added automatically).

Special commands:
  :profile <slug>   Switch logical profile
  :profiles         List available profiles
  :help             Show this help
  :quit / :exit     Exit REPL
  Ctrl+C / Ctrl+D   Exit REPL

Examples:
  check valid P -> P
  derive Q from P -> Q, P
  check sat P & ~P
`;

/** Exported for testability — returns output string instead of printing */
export function evalReplInput(input: string, profile: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // If input already has logic declaration, use as-is
  let source = trimmed;
  if (!/^\s*logic\s+/m.test(trimmed)) {
    source = `${profileHeader(profile)}\n${trimmed}`;
  }

  const result = evaluate(source, '<repl>');
  const out: string[] = [];
  if (result.stdout) out.push(result.stdout.trimEnd());
  if (result.stderr) out.push(result.stderr.trimEnd());
  return out.join('\n');
}

export function runRepl(opts: ReplOptions): void {
  let currentProfile = opts.profile
    ? (resolveProfile(opts.profile) ?? opts.profile)
    : 'classical.propositional';

  console.log(chalk.bold.cyan('ST Interactive REPL'));
  console.log(chalk.dim('Type :help for commands, :quit to exit.\n'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: chalk.cyan(`st [${currentProfile}]> `),
  });

  rl.prompt();

  rl.on('line', (rawLine: string) => {
    const line = rawLine.trim();

    if (!line) {
      rl.prompt();
      return;
    }

    // Special REPL commands
    if (line.startsWith(':')) {
      const parts = line.slice(1).split(/\s+/);
      const cmd = parts[0] ?? '';

      switch (cmd.toLowerCase()) {
        case 'quit':
        case 'exit':
          console.log(chalk.dim('Goodbye.'));
          rl.close();
          process.exit(0);
          return;

        case 'help':
          console.log(REPL_HELP);
          break;

        case 'profiles':
          console.log(chalk.bold('\nAvailable profiles:'));
          for (const p of listProfiles()) {
            const marker = p === currentProfile ? chalk.green(' ← current') : '';
            console.log('  ' + chalk.cyan(p) + marker);
          }
          console.log('');
          break;

        case 'profile':
          if (!parts[1]) {
            console.log(chalk.yellow(`Current profile: ${currentProfile}`));
          } else {
            const newProfile = resolveProfile(parts[1]) ?? parts[1];
            currentProfile = newProfile;
            console.log(chalk.green(`Profile switched to: ${currentProfile}`));
          }
          break;

        default:
          console.log(chalk.red(`Unknown command: :${cmd}. Type :help for help.`));
      }
    } else {
      // ST expression
      try {
        const output = evalReplInput(line, currentProfile);
        if (output) console.log(output);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`Error: ${msg}`));
      }
    }

    // Update prompt in case profile changed
    rl.setPrompt(chalk.cyan(`st [${currentProfile}]> `));
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(chalk.dim('\nGoodbye.'));
    process.exit(0);
  });
}

export function registerRepl(program: import('commander').Command): void {
  program
    .command('repl')
    .description('Start an interactive REPL')
    .option('--profile <slug>', 'Starting logical profile (default: classical.propositional)')
    .action((opts: ReplOptions) => {
      runRepl(opts);
    });
}
