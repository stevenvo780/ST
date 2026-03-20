import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { Interpreter } from '../runtime/interpreter';

const examplesDir = path.resolve(__dirname, '..', '..', 'examples');
// Exclude intentional stress/attack files that are designed to push limits
const EXCLUDED_EXAMPLES = new Set([
  'attack-arithmetic.st',
  'attack-fol-infinity.st',
  'attack-recursion-forced.st',
  'attack-recursion.st',
  'break-st.st',
  'omega-attack.st',
  'limit-tester.st',
]);

const exampleFiles = fs
  .readdirSync(examplesDir)
  .filter((file) => file.endsWith('.st') && !EXCLUDED_EXAMPLES.has(file))
  .sort();

const expectedOutputs: Record<string, string[]> = {
  'programming-control-flow.st': ['tautologia ok', 'invalid ok', 'while once', 'P', 'Q', 'R'],
  'arithmetic-programming.st': ['division ok', 'loop arithmetic', 'Contramodelo trivial'],
  'theory-showcase.st': ['=== theory-showcase ===', '(P → Q)', '✓ [check valid]'],
};

describe('examples smoke suite', () => {
  it('has at least one example to execute', () => {
    expect(exampleFiles.length).toBeGreaterThan(0);
  });

  for (const fileName of exampleFiles) {
    it(`runs ${fileName} without runtime errors`, () => {
      const fullPath = path.join(examplesDir, fileName);
      const source = fs.readFileSync(fullPath, 'utf-8');
      const interpreter = new Interpreter();
      const output = interpreter.execute(source, fullPath);

      expect(output.exitCode).toBe(0);
      expect(output.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    }, 30000);
  }
});

describe('examples regression outputs', () => {
  for (const [fileName, snippets] of Object.entries(expectedOutputs)) {
    it(`keeps expected output markers for ${fileName}`, () => {
      const fullPath = path.join(examplesDir, fileName);
      const source = fs.readFileSync(fullPath, 'utf-8');
      const interpreter = new Interpreter();
      const output = interpreter.execute(source, fullPath);

      expect(output.exitCode).toBe(0);
      for (const snippet of snippets) {
        expect(output.stdout).toContain(snippet);
      }
    });
  }
});
