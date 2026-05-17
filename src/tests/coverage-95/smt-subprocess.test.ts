import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SubprocessSMTBackend,
  detectAvailableSMT,
  detectAvailableSMTDetailed,
} from '../../runtime/smt/subprocess-backend';

describe('detectAvailableSMT — detection', () => {
  it('detectAvailableSMT resolves to a DetectedSolver', async () => {
    const solver = await detectAvailableSMT();
    expect(['z3', 'cvc5', 'none']).toContain(solver);
  });

  it('detectAvailableSMTDetailed with mock which returns z3', () => {
    const which = (bin: string): string | undefined =>
      bin === 'z3' ? '/usr/local/bin/z3' : undefined;
    const r = detectAvailableSMTDetailed(which);
    expect(r.solver).toBe('z3');
    expect(r.binaryPath).toBe('/usr/local/bin/z3');
  });

  it('detectAvailableSMTDetailed with mock which returns cvc5 when z3 missing', () => {
    const which = (bin: string): string | undefined =>
      bin === 'cvc5' ? '/usr/local/bin/cvc5' : undefined;
    const r = detectAvailableSMTDetailed(which);
    expect(r.solver).toBe('cvc5');
  });

  it('detectAvailableSMTDetailed returns none when nothing found', () => {
    const which = (): string | undefined => undefined;
    const r = detectAvailableSMTDetailed(which);
    expect(r.solver).toBe('none');
  });

  it('detectAvailableSMTDetailed tolerates which that throws', () => {
    const which = (): string => {
      throw new Error('boom');
    };
    const r = detectAvailableSMTDetailed(which);
    expect(r.solver).toBe('none');
  });
});

describe('SubprocessSMTBackend — no-op mode (no solver)', () => {
  let backend: SubprocessSMTBackend;
  const noWhich = (): string | undefined => undefined;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    backend = new SubprocessSMTBackend({ which: noWhich, warnOnUnavailable: false });
  });

  it('reports name subprocess:noop', () => {
    expect(backend.name).toBe('subprocess:noop');
    expect(backend.isAvailable()).toBe(false);
  });

  it('checkSat returns unknown', () => {
    backend.assertFormula('P');
    expect(backend.checkSat()).toBe('unknown');
    expect(backend.getModel()).toBeUndefined();
    expect(backend.getUnsatCore()).toEqual([]);
  });

  it('lifecycle (push/pop/reset) does not throw', () => {
    backend.push();
    backend.declareConst('x', 'Int');
    backend.declareFromInference([
      { name: 'x', sort: 'Int' },
      { name: 'y', sort: 'Bool' },
    ]);
    backend.assertFormula('(> x 0)');
    backend.pop();
    backend.reset();
    expect(backend.checkSat()).toBe('unknown');
  });

  it('pop multiple levels', () => {
    backend.push();
    backend.push();
    backend.pop(2);
    backend.pop(99);
    expect(backend.checkSat()).toBe('unknown');
  });

  it('warnOnUnavailable=true emits console.warn once', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const noopWarn = new SubprocessSMTBackend({ which: noWhich, warnOnUnavailable: true });
    noopWarn.checkSat();
    noopWarn.checkSat();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('SubprocessSMTBackend — when solver path provided', () => {
  it('uses preferred solver when which returns path', () => {
    const which = (bin: string): string | undefined =>
      bin === 'z3' ? '/usr/local/bin/z3' : undefined;
    const backend = new SubprocessSMTBackend({ which, prefer: 'z3' });
    expect(backend.name).toBe('subprocess:z3');
    expect(backend.isAvailable()).toBe(true);
  });

  it('falls back to auto-detect when preferred not found', () => {
    const which = (bin: string): string | undefined =>
      bin === 'cvc5' ? '/usr/local/bin/cvc5' : undefined;
    const backend = new SubprocessSMTBackend({ which, prefer: 'z3' });
    expect(backend.name).toBe('subprocess:cvc5');
  });

  it('falls back to noop when nothing available', () => {
    const which = (): string | undefined => undefined;
    const backend = new SubprocessSMTBackend({ which, prefer: 'none' });
    expect(backend.name).toBe('subprocess:noop');
  });
});
