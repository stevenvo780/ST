// ============================================================
// ST SMT Tests — SubprocessSMTBackend y detectAvailableSMT
// ============================================================

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  SubprocessSMTBackend,
  detectAvailableSMT,
  detectAvailableSMTDetailed,
} from '../../../solver/smt/subprocess-backend';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('detectAvailableSMT — fake PATH', () => {
  it('devuelve "none" cuando no hay binarios', () => {
    const which = vi.fn(() => undefined);
    const result = detectAvailableSMTDetailed(which);
    expect(result.solver).toBe('none');
    expect(result.binaryPath).toBeUndefined();
  });

  it('prefiere z3 cuando ambos existen', () => {
    const which = vi.fn((bin: string) =>
      bin === 'z3' ? '/usr/bin/z3' : bin === 'cvc5' ? '/usr/bin/cvc5' : undefined,
    );
    const result = detectAvailableSMTDetailed(which);
    expect(result.solver).toBe('z3');
    expect(result.binaryPath).toBe('/usr/bin/z3');
  });

  it('detecta cvc5 si z3 está ausente', () => {
    const which = vi.fn((bin: string) => (bin === 'cvc5' ? '/usr/local/bin/cvc5' : undefined));
    const result = detectAvailableSMTDetailed(which);
    expect(result.solver).toBe('cvc5');
  });

  it('detectAvailableSMT async no lanza si no hay solver', async () => {
    await expect(detectAvailableSMT()).resolves.toMatch(/z3|cvc5|none/);
  });
});

describe('SubprocessSMTBackend — sin solver disponible', () => {
  it('checkSat devuelve "unknown" sin throw', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const which = vi.fn(() => undefined);
    const backend = new SubprocessSMTBackend({ which, warnOnUnavailable: true });

    expect(backend.isAvailable()).toBe(false);
    expect(backend.name).toBe('subprocess:noop');

    backend.declareConst('P', 'Bool');
    backend.assertFormula('P');
    expect(backend.checkSat()).toBe('unknown');
    expect(backend.getModel()).toBeUndefined();
    expect(backend.getUnsatCore()).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('opciones push/pop/reset funcionan en modo no-op', () => {
    const which = vi.fn(() => undefined);
    const backend = new SubprocessSMTBackend({ which, warnOnUnavailable: false });
    backend.push();
    backend.declareConst('Q', 'Bool');
    backend.assertFormula('Q');
    backend.pop();
    backend.reset();
    expect(backend.checkSat()).toBe('unknown');
  });

  it('no avisa más de una vez aunque se llame checkSat múltiples veces', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const which = vi.fn(() => undefined);
    const backend = new SubprocessSMTBackend({ which, warnOnUnavailable: true });
    backend.checkSat();
    backend.checkSat();
    backend.checkSat();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('no avisa si warnOnUnavailable es false', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const which = vi.fn(() => undefined);
    const backend = new SubprocessSMTBackend({ which, warnOnUnavailable: false });
    backend.checkSat();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('SubprocessSMTBackend — solver simulado disponible', () => {
  it('reporta name "subprocess:z3" cuando se prefiere z3 y existe', () => {
    // Nota: aunque marcamos available, no ejecutamos el solver real en este test.
    // El path apunta a un binario que probablemente no existe, así que checkSat
    // devolverá 'unknown' (runSolver fallará silenciosamente).
    const which = vi.fn((bin: string) => (bin === 'z3' ? '/nonexistent/z3' : undefined));
    const backend = new SubprocessSMTBackend({ which, prefer: 'z3', warnOnUnavailable: false });
    expect(backend.name).toBe('subprocess:z3');
    expect(backend.isAvailable()).toBe(true);

    backend.declareConst('P', 'Bool');
    backend.assertFormula('P');
    // El binario no existe → spawnSync devuelve error → checkSat → 'unknown'.
    expect(backend.checkSat()).toBe('unknown');
  });
});
