import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Interpreter } from '../../runtime/interpreter';

const EXAMPLES_DIR = join(__dirname, '..', '..', '..', 'examples');

// Exclude files known to be intentional adversarial stress tests
// or that take too long for unit-test scope.
const SKIP = new Set([
  'attack-arithmetic.st',
  'attack-fol-infinity.st',
  'attack-recursion-forced.st',
  'attack-recursion.st',
  'break-st.st',
  'limit-tester.st',
  'omega-attack.st',
  'parity-test.st',
  'philosophical-extremes.st',
  'mega-logic.st',
]);

describe('Examples runner — coverage via real .st files', () => {
  const files = readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.st') && !SKIP.has(f));

  for (const file of files) {
    it(`runs ${file} without crashing`, () => {
      const src = readFileSync(join(EXAMPLES_DIR, file), 'utf-8');
      const interp = new Interpreter();
      const out = interp.execute(src, file);
      expect(out).toBeDefined();
      expect(typeof out.exitCode).toBe('number');
    });
  }
});
