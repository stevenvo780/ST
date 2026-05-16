import { describe, it, expect } from 'vitest';
import { validatePlugin, assertPlugin } from '../../plugin-system';

describe('validatePlugin — duck typing', () => {
  const validBase = {
    name: 'ok',
    version: '1.0.0',
    evaluate: (_f: unknown, _env: unknown) => 0,
    checkValid: (_f: unknown) => ({ valid: true }),
  };

  it('acepta un plugin con todos los campos requeridos', () => {
    const res = validatePlugin(validBase);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('rechaza non-objects', () => {
    expect(validatePlugin(null).valid).toBe(false);
    expect(validatePlugin(undefined).valid).toBe(false);
    expect(validatePlugin(42).valid).toBe(false);
    expect(validatePlugin('plugin').valid).toBe(false);
    expect(validatePlugin([validBase]).valid).toBe(false);
  });

  it('detecta name faltante con mensaje claro', () => {
    const res = validatePlugin({ ...validBase, name: undefined });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('name'))).toBe(true);
  });

  it('detecta name vacío', () => {
    const res = validatePlugin({ ...validBase, name: '   ' });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('name'))).toBe(true);
  });

  it('detecta version faltante', () => {
    const res = validatePlugin({ ...validBase, version: undefined });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('version'))).toBe(true);
  });

  it('detecta version mal formada (no semver)', () => {
    const res = validatePlugin({ ...validBase, version: 'v1' });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('semver'))).toBe(true);
  });

  it('acepta semver con prerelease y build metadata', () => {
    const a = validatePlugin({ ...validBase, version: '1.0.0-beta.1' });
    const b = validatePlugin({ ...validBase, version: '1.0.0+build.42' });
    const c = validatePlugin({ ...validBase, version: '1.0.0-rc.1+exp.sha.5114f85' });
    expect(a.valid).toBe(true);
    expect(b.valid).toBe(true);
    expect(c.valid).toBe(true);
  });

  it('detecta evaluate ausente o no-función', () => {
    const a = validatePlugin({ ...validBase, evaluate: undefined });
    const b = validatePlugin({ ...validBase, evaluate: 'not a fn' });
    expect(a.valid).toBe(false);
    expect(b.valid).toBe(false);
    expect(a.errors.some((e) => e.includes('evaluate'))).toBe(true);
    expect(b.errors.some((e) => e.includes('evaluate'))).toBe(true);
  });

  it('detecta evaluate con aridad insuficiente', () => {
    const res = validatePlugin({ ...validBase, evaluate: (_f: unknown) => 0 });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('evaluate'))).toBe(true);
  });

  it('detecta checkValid ausente', () => {
    const res = validatePlugin({ ...validBase, checkValid: undefined });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('checkValid'))).toBe(true);
  });

  it('acepta description string opcional y rechaza description no-string', () => {
    expect(validatePlugin({ ...validBase, description: 'ok' }).valid).toBe(true);
    expect(validatePlugin({ ...validBase, description: 42 }).valid).toBe(false);
  });

  it('valida supportedOperators como Set<string>', () => {
    const good = validatePlugin({
      ...validBase,
      supportedOperators: new Set(['and', 'or']),
    });
    const badType = validatePlugin({ ...validBase, supportedOperators: ['and', 'or'] });
    const badContents = validatePlugin({
      ...validBase,
      supportedOperators: new Set(['and', 42]),
    });
    expect(good.valid).toBe(true);
    expect(badType.valid).toBe(false);
    expect(badContents.valid).toBe(false);
  });

  it('acumula múltiples errores en un solo pase', () => {
    const res = validatePlugin({
      version: 'mal',
      evaluate: 'no es función',
    });
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('assertPlugin lanza con plugin inválido y pasa con válido', () => {
    expect(() => assertPlugin({})).toThrow(/Plugin inválido/);
    expect(() => assertPlugin(validBase)).not.toThrow();
  });
});
