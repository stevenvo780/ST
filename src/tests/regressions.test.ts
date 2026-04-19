import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, expect, it } from 'vitest';

import { createInterpreter } from '../api';
import { Interpreter } from '../runtime/interpreter';

describe('Regression fixes', () => {
  it('invalidates function memoization when global bindings change', () => {
    const interpreter = new Interpreter();
    const output = interpreter.execute(
      `
        logic arithmetic
        let y = 1
        fn addY(x) {
          return x + y
        }
        print addY(1)
        set y = 2
        print addY(1)
      `,
      '<test>',
    );

    expect(output.exitCode).toBe(0);
    const lines = output.stdout.trim().split('\n');
    expect(lines.at(-1)).toBe('3');
  });

  it('reloads imports when the file content changes in a persistent interpreter', () => {
    const dir = mkdtempSync(join(tmpdir(), 'st-import-'));
    const file = join(dir, 'shared.st');
    const interpreter = createInterpreter();

    try {
      writeFileSync(file, 'export let val = 1\n', 'utf-8');
      const first = interpreter.exec(`logic arithmetic\nimport "${file}"\nprint val`);

      writeFileSync(file, 'export let val = 2\n', 'utf-8');
      const second = interpreter.exec(`import "${file}"\nprint val`);

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      expect(first.stdout.trim().split('\n').at(-1)).toBe('1');
      expect(second.stdout.trim().split('\n').at(-1)).toBe('2');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects oversized classical truth tables instead of returning bogus results', () => {
    const interpreter = new Interpreter();
    const atoms = Array.from({ length: 21 }, (_, i) => `P${i + 1}`).join(' | ');
    const output = interpreter.execute(
      `logic classical.propositional\ntruth_table (${atoms})`,
      '<test>',
    );

    expect(output.exitCode).toBe(3);
    expect(output.stderr).toContain('truth_table soporta hasta 20 variables');
    expect(output.results).toHaveLength(0);
  });
});
