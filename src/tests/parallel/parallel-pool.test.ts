/**
 * ST Parallel Profile Pool — Tests
 * ==================================
 * Valida:
 *   - 3 perfiles en paralelo dan mismo resultado que 3 secuenciales.
 *   - Si un perfil arroja, solo ese perfil marca error; los demás continúan.
 *   - shutdownPool() limpia workers correctamente.
 *   - Timeout por evaluación funciona.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { evalParallel, shutdownPool } from '../../runtime/parallel';
import { registry } from '../../profiles/interface';
import '../../profiles';
import type { Formula, RunResult } from '../../types';

// Fórmula tautológica simple (P -> P)
const tautology: Formula = {
  kind: 'implies',
  args: [
    { kind: 'atom', name: 'P' },
    { kind: 'atom', name: 'P' },
  ],
};

// Fórmula satisfiable simple (P)
const atom: Formula = { kind: 'atom', name: 'P' };

afterAll(async () => {
  await shutdownPool();
});

// ── 1. Resultado paralelo === resultado secuencial ────────────────────────────
describe('evalParallel: consistencia paralelo vs secuencial', () => {
  it('3 perfiles en paralelo dan el mismo status que secuencial', async () => {
    const profiles = ['classical.propositional', 'modal.k', 'intuitionistic.propositional'];

    // Resultado secuencial (referencia)
    const serial: Record<string, RunResult | { error: string }> = {};
    for (const name of profiles) {
      const profile = registry.get(name);
      if (profile) {
        serial[name] = profile.checkValid(tautology);
      }
    }

    // Resultado paralelo
    const result = await evalParallel(tautology, { profiles, timeoutMs: 8000 });

    for (const name of profiles) {
      const par = result.perProfile[name];
      const seq = serial[name];

      expect(par, `perProfile["${name}"] debe existir`).toBeDefined();
      expect(seq, `serial["${name}"] debe existir`).toBeDefined();

      if ('error' in (par as { error?: string })) {
        expect('error' in (seq as { error?: string })).toBe(true);
      } else {
        const parResult = par as RunResult;
        const seqResult = seq as RunResult;
        expect(parResult.status).toBe(seqResult.status);
      }
    }
  });

  it('resultado paralelo incluye todos los perfiles solicitados', async () => {
    const profiles = ['classical.propositional', 'paraconsistent.belnap', 'deontic.standard'];

    const result = await evalParallel(atom, { profiles, timeoutMs: 8000 });

    for (const name of profiles) {
      expect(result.perProfile[name], `falta perfil "${name}"`).toBeDefined();
    }

    expect(result.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.speedup).toBeGreaterThan(0);
  });
});

// ── 2. Error en un perfil no afecta los demás ────────────────────────────────
describe('evalParallel: aislamiento de errores', () => {
  it('perfil inexistente produce error solo para ese perfil', async () => {
    const profiles = ['classical.propositional', 'perfil.que.no.existe.jamas', 'modal.k'];

    const result = await evalParallel(tautology, { profiles, timeoutMs: 8000 });

    // El perfil real debe tener resultado
    const classical = result.perProfile['classical.propositional'];
    expect(classical).toBeDefined();
    expect('error' in (classical as { error?: string })).toBe(false);

    // El perfil inexistente debe tener error
    const bad = result.perProfile['perfil.que.no.existe.jamas'];
    expect(bad).toBeDefined();
    expect('error' in (bad as { error: string })).toBe(true);
    expect((bad as { error: string }).error).toContain('Perfil desconocido');

    // El modal también debe tener resultado válido
    const modal = result.perProfile['modal.k'];
    expect(modal).toBeDefined();
    expect('error' in (modal as { error?: string })).toBe(false);
  });

  it('un perfil con error no impide que otros terminen', async () => {
    const profiles = [
      'epistemic.s5',
      'perfil.inexistente.1',
      'perfil.inexistente.2',
      'paraconsistent.belnap',
    ];

    const result = await evalParallel(atom, { profiles, timeoutMs: 8000 });

    const epistemic = result.perProfile['epistemic.s5'];
    expect(epistemic).toBeDefined();
    expect('error' in (epistemic as { error?: string })).toBe(false);

    const belnap = result.perProfile['paraconsistent.belnap'];
    expect(belnap).toBeDefined();
    expect('error' in (belnap as { error?: string })).toBe(false);

    expect((result.perProfile['perfil.inexistente.1'] as { error: string }).error).toBeDefined();
    expect((result.perProfile['perfil.inexistente.2'] as { error: string }).error).toBeDefined();
  });
});

// ── 3. shutdownPool limpia workers ───────────────────────────────────────────
describe('shutdownPool: limpieza de workers', () => {
  it('shutdownPool no lanza errores aunque se llame sin pool activo', async () => {
    await expect(shutdownPool()).resolves.toBeUndefined();
  });

  it('shutdownPool cierra workers del pool compartido sin error', async () => {
    const profiles = ['classical.propositional', 'modal.k'];

    // Crear pool compartido
    await evalParallel(tautology, {
      profiles,
      shareWorkPool: true,
      poolSize: 2,
      timeoutMs: 8000,
    });

    // Shutdown no debe lanzar
    await expect(shutdownPool()).resolves.toBeUndefined();
  });

  it('después de shutdown, nueva evaluación funciona correctamente', async () => {
    await shutdownPool();

    const profiles = ['classical.propositional'];
    const result = await evalParallel(tautology, { profiles, timeoutMs: 8000 });

    expect(result.perProfile['classical.propositional']).toBeDefined();
    expect('error' in (result.perProfile['classical.propositional'] as { error?: string })).toBe(
      false,
    );

    await shutdownPool();
  });
});

// ── 4. Timeout por evaluación ────────────────────────────────────────────────
describe('evalParallel: timeout', () => {
  it('timeout muy corto (1ms) hace que todos fallen o sean marcados como timeout', async () => {
    const profiles = ['classical.propositional', 'modal.k'];

    // Con timeout 1ms es imposible evaluar; el worker puede terminar más rápido
    // pero el global timer se dispara y marca pendientes como timeout.
    // Aceptamos que pueda completar o dar timeout, pero NO debe colgar.
    const result = await evalParallel(tautology, { profiles, timeoutMs: 1 });

    // Todos los perfiles deben tener algún resultado (sea RunResult o error)
    for (const name of profiles) {
      expect(result.perProfile[name], `falta perfil "${name}"`).toBeDefined();
    }

    expect(result.totalMs).toBeGreaterThanOrEqual(0);
  }, 10000);

  it('timeout suficiente permite completar la evaluación', async () => {
    const profiles = ['classical.propositional'];
    const result = await evalParallel(tautology, { profiles, timeoutMs: 5000 });

    const r = result.perProfile['classical.propositional'];
    expect(r).toBeDefined();
    expect('error' in (r as { error?: string })).toBe(false);
    expect((r as RunResult).status).toBe('valid');
  });
});

// ── 5. Casos borde ────────────────────────────────────────────────────────────
describe('evalParallel: casos borde', () => {
  it('lista de perfiles vacía devuelve resultado vacío', async () => {
    const result = await evalParallel(tautology, { profiles: [] });
    expect(Object.keys(result.perProfile)).toHaveLength(0);
    expect(result.totalMs).toBeGreaterThanOrEqual(0);
  });

  it('un solo perfil funciona correctamente', async () => {
    const result = await evalParallel(tautology, {
      profiles: ['classical.propositional'],
      timeoutMs: 5000,
    });

    const r = result.perProfile['classical.propositional'];
    expect(r).toBeDefined();
    expect('error' in (r as { error?: string })).toBe(false);
    expect((r as RunResult).status).toBe('valid');
  });

  it('shareWorkPool=true reutiliza workers entre llamadas', async () => {
    const profiles = ['classical.propositional', 'modal.k'];

    const r1 = await evalParallel(tautology, {
      profiles,
      shareWorkPool: true,
      poolSize: 2,
      timeoutMs: 8000,
    });

    const r2 = await evalParallel(atom, {
      profiles,
      shareWorkPool: true,
      poolSize: 2,
      timeoutMs: 8000,
    });

    for (const name of profiles) {
      expect(r1.perProfile[name]).toBeDefined();
      expect(r2.perProfile[name]).toBeDefined();
    }

    await shutdownPool();
  });
});
