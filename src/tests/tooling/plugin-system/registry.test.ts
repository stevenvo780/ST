import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProfileRegistry,
  PluginConflictError,
  PluginValidationError,
  type ProfilePlugin,
} from '../../../tooling/plugin-system';
import { Formula } from '../../../types';

function makeStubPlugin(overrides: Partial<ProfilePlugin> = {}): ProfilePlugin {
  return {
    name: 'stub',
    description: 'plugin de prueba',
    version: '0.1.0',
    evaluate: (_f: Formula, _env: Record<string, unknown>) => true,
    checkValid: (_f: Formula) => ({ valid: true }),
    ...overrides,
  };
}

describe('ProfileRegistry — registro de plugins', () => {
  beforeEach(() => {
    ProfileRegistry.clear();
  });

  it('registra un plugin válido y aparece en list()', () => {
    const plugin = makeStubPlugin({ name: 'alpha', version: '1.2.3' });
    ProfileRegistry.register(plugin);

    expect(ProfileRegistry.has('alpha')).toBe(true);
    expect(ProfileRegistry.size()).toBe(1);

    const list = ProfileRegistry.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      name: 'alpha',
      version: '1.2.3',
      description: 'plugin de prueba',
    });
  });

  it('list() omite description cuando no fue provista', () => {
    const plugin = makeStubPlugin({ name: 'sinDesc' });
    delete plugin.description;
    ProfileRegistry.register(plugin);

    const [info] = ProfileRegistry.list();
    expect(info).toBeDefined();
    expect(info?.description).toBeUndefined();
    expect(info?.name).toBe('sinDesc');
  });

  it('get() devuelve el plugin registrado y undefined si no existe', () => {
    const plugin = makeStubPlugin({ name: 'beta' });
    ProfileRegistry.register(plugin);

    expect(ProfileRegistry.get('beta')).toBe(plugin);
    expect(ProfileRegistry.get('no-existe')).toBeUndefined();
  });

  it('doble register con mismo name lanza PluginConflictError', () => {
    const a = makeStubPlugin({ name: 'dup', version: '1.0.0' });
    const b = makeStubPlugin({ name: 'dup', version: '2.0.0' });

    ProfileRegistry.register(a);
    expect(() => ProfileRegistry.register(b)).toThrow(PluginConflictError);

    try {
      ProfileRegistry.register(b);
    } catch (err) {
      expect(err).toBeInstanceOf(PluginConflictError);
      if (err instanceof PluginConflictError) {
        expect(err.pluginName).toBe('dup');
        expect(err.message).toContain('dup');
        expect(err.message).toContain('unregister');
      }
    }
  });

  it('unregister() lo quita y devuelve true; segundo unregister devuelve false', () => {
    const plugin = makeStubPlugin({ name: 'gamma' });
    ProfileRegistry.register(plugin);
    expect(ProfileRegistry.unregister('gamma')).toBe(true);
    expect(ProfileRegistry.has('gamma')).toBe(false);
    expect(ProfileRegistry.unregister('gamma')).toBe(false);
  });

  it('unregister() devuelve false si el plugin no existe', () => {
    expect(ProfileRegistry.unregister('nope')).toBe(false);
  });

  it('clear() quita todos los plugins', () => {
    ProfileRegistry.register(makeStubPlugin({ name: 'a' }));
    ProfileRegistry.register(makeStubPlugin({ name: 'b' }));
    ProfileRegistry.register(makeStubPlugin({ name: 'c' }));
    expect(ProfileRegistry.size()).toBe(3);

    ProfileRegistry.clear();
    expect(ProfileRegistry.size()).toBe(0);
    expect(ProfileRegistry.list()).toEqual([]);
  });

  it('register() lanza PluginValidationError si el plugin es inválido', () => {
    const bad = { name: 'nover', evaluate: () => 0, checkValid: () => ({ valid: true }) };
    expect(() => ProfileRegistry.register(bad as unknown as ProfilePlugin)).toThrow(
      PluginValidationError,
    );
  });
});
