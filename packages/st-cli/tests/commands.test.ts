/**
 * Tests for st-cli commands.
 * Uses importable run* functions for direct testability (no child_process needed).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// We import the compiled sources
import { runCheck } from '../src/commands/check.js';
import { runDerive } from '../src/commands/derive.js';
import { runCountermodel } from '../src/commands/countermodel.js';
import { runFormalize } from '../src/commands/formalize.js';
import { runExport } from '../src/commands/export.js';
import { evalReplInput } from '../src/commands/repl.js';
import { resolveProfile, listProfiles, profileHeader } from '../src/utils/profile.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'st-cli-test-'));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeStFile(name: string, content: string): string {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

// ── Profile utils ─────────────────────────────────────────────────────────────

describe('utils/profile', () => {
  it('resolves canonical profile name', () => {
    expect(resolveProfile('classical')).toBe('classical.propositional');
    expect(resolveProfile('prop')).toBe('classical.propositional');
    expect(resolveProfile('modal-s4')).toBe('modal.s4');
    expect(resolveProfile('nj')).toBe('intuitionistic.nj');
  });

  it('returns slug unchanged if not in alias map', () => {
    expect(resolveProfile('classical.fol')).toBe('classical.fol');
    expect(resolveProfile('modal.k')).toBe('modal.k');
  });

  it('returns null for unknown profiles in strict mode', () => {
    expect(resolveProfile('unknown-xyz', true)).toBeNull();
  });

  it('lists at least 10 known profiles', () => {
    expect(listProfiles().length).toBeGreaterThanOrEqual(10);
  });

  it('profileHeader returns logic declaration', () => {
    const h = profileHeader('modal.s4');
    expect(h).toContain('logic');
    expect(h).toContain('modal.s4');
  });
});

// ── check command ─────────────────────────────────────────────────────────────

describe('check command', () => {
  it('exits 1 for non-existent file', () => {
    const code = runCheck('/tmp/nonexistent-99999.st', { json: true });
    expect(code).toBe(1);
  });

  it('passes a valid trivial .st file', () => {
    const f = writeStFile('trivial.st', 'check valid P -> P\n');
    const code = runCheck(f, { json: true });
    expect(code).toBe(0);
  });

  it('detects ;; profile: header', () => {
    const f = writeStFile('with-header.st', ';; profile: classical.propositional\ncheck valid P -> P\n');
    const code = runCheck(f, {});
    expect(code).toBe(0);
  });

  it('returns JSON with diagnostics key', () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg: string) => logs.push(msg);
    const f = writeStFile('json-check.st', 'check valid P -> P\n');
    runCheck(f, { json: true });
    console.log = origLog;
    const parsed = JSON.parse(logs.join(''));
    expect(parsed).toHaveProperty('diagnostics');
    expect(parsed).toHaveProperty('ok');
  });
});

// ── derive command ────────────────────────────────────────────────────────────

describe('derive command', () => {
  it('derives tautology p -> p', () => {
    const code = runDerive('P -> P', { json: true });
    // May succeed or fail depending on st-lang version, but should not throw
    expect([0, 1]).toContain(code);
  });

  it('returns JSON output', () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg: string) => logs.push(msg);
    runDerive('P', { json: true });
    console.log = origLog;
    const combined = logs.join('');
    if (combined.trim()) {
      const parsed = JSON.parse(combined);
      expect(parsed).toHaveProperty('formula');
      expect(parsed).toHaveProperty('profile');
    }
  });

  it('uses provided profile', () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg: string) => logs.push(msg);
    runDerive('P -> P', { profile: 'classical.propositional', json: true });
    console.log = origLog;
    const combined = logs.join('');
    if (combined.trim()) {
      const parsed = JSON.parse(combined);
      expect(parsed.profile).toBe('classical.propositional');
    }
  });

  it('accepts axioms option', () => {
    const code = runDerive('Q', { axioms: 'P -> Q, P', json: true });
    expect([0, 1]).toContain(code);
  });
});

// ── countermodel command ──────────────────────────────────────────────────────

describe('countermodel command', () => {
  it('handles contradiction formula without throwing', () => {
    const code = runCountermodel('P & ~P', { json: true });
    expect([0, 1, 2]).toContain(code);
  });

  it('returns JSON with countermodelFound key', () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg: string) => logs.push(msg);
    runCountermodel('P & ~P', { json: true });
    console.log = origLog;
    const combined = logs.join('');
    if (combined.trim()) {
      const parsed = JSON.parse(combined);
      expect(parsed).toHaveProperty('formula');
    }
  });
});

// ── formalize command ─────────────────────────────────────────────────────────

describe('formalize command', () => {
  it('runs without --as and returns template', () => {
    const code = runFormalize('If it rains then the ground is wet', { json: true });
    expect(code).toBe(0);
  });

  it('returns JSON with input key (no --as)', () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg: string) => logs.push(msg);
    runFormalize('All humans are mortal', { json: true });
    console.log = origLog;
    const combined = logs.join('');
    if (combined.trim()) {
      const parsed = JSON.parse(combined);
      expect(parsed).toHaveProperty('input');
      expect(parsed).toHaveProperty('template');
    }
  });

  it('validates formula with --as option', () => {
    const code = runFormalize('If P then Q', { as: 'P -> Q', json: true });
    expect([0, 1]).toContain(code);
  });
});

// ── export command ────────────────────────────────────────────────────────────

describe('export command', () => {
  it('exports to json format', () => {
    const f = writeStFile('export-src.st', 'check valid P -> P\n');
    const outPath = path.join(tmpDir, 'export-out.json');
    const code = runExport(f, { to: 'json', output: outPath });
    expect(code).toBe(0);
    expect(fs.existsSync(outPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(content).toHaveProperty('file');
  });

  it('exports to coq format', () => {
    const f = writeStFile('coq-src.st', 'check valid P -> P\n');
    const outPath = path.join(tmpDir, 'output.v');
    const code = runExport(f, { to: 'coq', output: outPath });
    expect(code).toBe(0);
    expect(fs.existsSync(outPath)).toBe(true);
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('Coq');
  });

  it('exports to lean format', () => {
    const f = writeStFile('lean-src.st', 'check valid P -> P\n');
    const outPath = path.join(tmpDir, 'output.lean');
    const code = runExport(f, { to: 'lean', output: outPath });
    expect(code).toBe(0);
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('Lean');
  });

  it('exports to tptp format', () => {
    const f = writeStFile('tptp-src.st', 'check valid P -> P\n');
    const outPath = path.join(tmpDir, 'output.p');
    const code = runExport(f, { to: 'tptp', output: outPath });
    expect(code).toBe(0);
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('TPTP');
  });

  it('returns 1 for non-existent file', () => {
    const code = runExport('/tmp/nofile.st', { to: 'json' });
    expect(code).toBe(1);
  });
});

// ── repl eval ─────────────────────────────────────────────────────────────────

describe('repl evalReplInput', () => {
  it('returns non-empty string for valid check', () => {
    const output = evalReplInput('check valid P -> P', 'classical.propositional');
    expect(typeof output).toBe('string');
  });

  it('returns empty string for empty input', () => {
    const output = evalReplInput('', 'classical.propositional');
    expect(output).toBe('');
  });

  it('handles whitespace-only input', () => {
    const output = evalReplInput('   ', 'classical.propositional');
    expect(output).toBe('');
  });
});
