// ============================================================
// ST Tests — Runner simple sin dependencias
// ============================================================

import { runCoreTests } from './core.test';
import { runParserTests } from './parser.test';
import { runCLITests } from './cli.test';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

let results: TestResult[] = [];
let currentSuite = '';

export function describe(name: string, fn: () => void): void {
  currentSuite = name;
  console.log(`\n  ${name}`);
  fn();
}

export function it(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name: `${currentSuite} > ${name}`, passed: true });
    console.log(`    ✓ ${name}`);
  } catch (e: any) {
    results.push({ name: `${currentSuite} > ${name}`, passed: false, error: e.message });
    console.log(`    ✗ ${name}`);
    console.log(`      ${e.message}`);
  }
}

export function assert(condition: boolean, message: string = 'Assertion failed'): void {
  if (!condition) throw new Error(message);
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertIncludes(str: string, substring: string, message?: string): void {
  if (!str.includes(substring)) {
    throw new Error(message || `Expected string to include "${substring}", got: "${str.slice(0, 200)}"`);
  }
}

// Main
console.log('ST Tests');
console.log('========\n');

runCoreTests();
runParserTests();
runCLITests();

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`\n========`);
console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed tests:');
  for (const r of results.filter(r => !r.passed)) {
    console.log(`  ✗ ${r.name}: ${r.error}`);
  }
  process.exit(1);
} else {
  console.log('\n✓ Todos los tests pasaron');
  process.exit(0);
}
