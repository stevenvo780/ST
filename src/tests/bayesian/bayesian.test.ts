// ============================================================
// ST Bayesian Inference — Tests
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  jointProbability,
  mostProbableExplanation,
  query,
  variableElimination,
  type BayesianNetwork,
} from '../../runtime/bayesian';

// ── Fixtures ─────────────────────────────────────────────────

// Red clásica de Russell & Norvig (Burglary / Earthquake / Alarm /
// JohnCalls / MaryCalls). Valores: "true" / "false".
const burglaryNet: BayesianNetwork = {
  variables: [
    { name: 'Burglary', values: ['true', 'false'] },
    { name: 'Earthquake', values: ['true', 'false'] },
    { name: 'Alarm', values: ['true', 'false'] },
    { name: 'JohnCalls', values: ['true', 'false'] },
    { name: 'MaryCalls', values: ['true', 'false'] },
  ],
  cpts: [
    {
      variable: 'Burglary',
      parents: [],
      entries: { '': { true: 0.001, false: 0.999 } },
    },
    {
      variable: 'Earthquake',
      parents: [],
      entries: { '': { true: 0.002, false: 0.998 } },
    },
    {
      variable: 'Alarm',
      parents: ['Burglary', 'Earthquake'],
      entries: {
        'Burglary=true|Earthquake=true': { true: 0.95, false: 0.05 },
        'Burglary=true|Earthquake=false': { true: 0.94, false: 0.06 },
        'Burglary=false|Earthquake=true': { true: 0.29, false: 0.71 },
        'Burglary=false|Earthquake=false': { true: 0.001, false: 0.999 },
      },
    },
    {
      variable: 'JohnCalls',
      parents: ['Alarm'],
      entries: {
        'Alarm=true': { true: 0.9, false: 0.1 },
        'Alarm=false': { true: 0.05, false: 0.95 },
      },
    },
    {
      variable: 'MaryCalls',
      parents: ['Alarm'],
      entries: {
        'Alarm=true': { true: 0.7, false: 0.3 },
        'Alarm=false': { true: 0.01, false: 0.99 },
      },
    },
  ],
};

// Red simple cadena A → B → C (todas binarias).
const chainNet: BayesianNetwork = {
  variables: [
    { name: 'A', values: ['t', 'f'] },
    { name: 'B', values: ['t', 'f'] },
    { name: 'C', values: ['t', 'f'] },
  ],
  cpts: [
    { variable: 'A', parents: [], entries: { '': { t: 0.7, f: 0.3 } } },
    {
      variable: 'B',
      parents: ['A'],
      entries: {
        'A=t': { t: 0.8, f: 0.2 },
        'A=f': { t: 0.1, f: 0.9 },
      },
    },
    {
      variable: 'C',
      parents: ['B'],
      entries: {
        'B=t': { t: 0.9, f: 0.1 },
        'B=f': { t: 0.2, f: 0.8 },
      },
    },
  ],
};

// Red trinaria simple para test de dominios >2.
const weatherNet: BayesianNetwork = {
  variables: [
    { name: 'Weather', values: ['sunny', 'cloudy', 'rainy'] },
    { name: 'Mood', values: ['happy', 'sad'] },
  ],
  cpts: [
    {
      variable: 'Weather',
      parents: [],
      entries: { '': { sunny: 0.5, cloudy: 0.3, rainy: 0.2 } },
    },
    {
      variable: 'Mood',
      parents: ['Weather'],
      entries: {
        'Weather=sunny': { happy: 0.9, sad: 0.1 },
        'Weather=cloudy': { happy: 0.5, sad: 0.5 },
        'Weather=rainy': { happy: 0.2, sad: 0.8 },
      },
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────

function close(a: number, b: number, eps = 1e-4): boolean {
  return Math.abs(a - b) < eps;
}

function bruteForceMarginal(
  net: BayesianNetwork,
  queryVar: string,
  evidence: Record<string, string> = {},
): Record<string, number> {
  // Enumera todas las asignaciones, suma joint, normaliza.
  const out: Record<string, number> = {};
  for (const v of net.variables.find((x) => x.name === queryVar)!.values) {
    out[v] = 0;
  }
  const vars = net.variables.map((v) => v.name);
  const doms = net.variables.map((v) => v.values);
  function rec(i: number, acc: Record<string, string>): void {
    if (i === vars.length) {
      for (const [k, val] of Object.entries(evidence)) {
        if (acc[k] !== val) return;
      }
      const p = jointProbability(net, acc);
      out[acc[queryVar]] = (out[acc[queryVar]] ?? 0) + p;
      return;
    }
    const vname = vars[i];
    for (const val of doms[i]) {
      acc[vname] = val;
      rec(i + 1, acc);
    }
  }
  rec(0, {});
  const total = Object.values(out).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const k of Object.keys(out)) out[k] = out[k] / total;
  }
  return out;
}

// ── Tests ────────────────────────────────────────────────────

describe('bayesian — joint probability', () => {
  it('jointProbability sobre asignación completa = producto de CPTs', () => {
    // P(B=t, E=f, A=t, J=t, M=t) = 0.001 * 0.998 * 0.94 * 0.9 * 0.7
    const p = jointProbability(burglaryNet, {
      Burglary: 'true',
      Earthquake: 'false',
      Alarm: 'true',
      JohnCalls: 'true',
      MaryCalls: 'true',
    });
    const expected = 0.001 * 0.998 * 0.94 * 0.9 * 0.7;
    expect(close(p, expected, 1e-10)).toBe(true);
  });

  it('jointProbability suma 1 sobre todas las asignaciones', () => {
    let total = 0;
    const vals = ['t', 'f'];
    for (const a of vals)
      for (const b of vals)
        for (const c of vals) {
          total += jointProbability(chainNet, { A: a, B: b, C: c });
        }
    expect(close(total, 1, 1e-10)).toBe(true);
  });

  it('jointProbability falla con asignación incompleta', () => {
    expect(() => jointProbability(burglaryNet, { Burglary: 'true' })).toThrow(/incompleta/);
  });

  it('jointProbability falla con valor fuera de dominio', () => {
    expect(() => jointProbability(chainNet, { A: 't', B: 'x', C: 't' })).toThrow(/dominio/);
  });
});

describe('bayesian — variable elimination', () => {
  it('P(Burglary=true | JohnCalls=true, MaryCalls=true) ≈ 0.284', () => {
    const post = query(burglaryNet, 'Burglary', {
      JohnCalls: 'true',
      MaryCalls: 'true',
    });
    expect(post.variable).toBe('Burglary');
    expect(close(post.distribution['true'], 0.2841, 5e-3)).toBe(true);
    expect(close(post.distribution['true'] + post.distribution['false'], 1, 1e-9)).toBe(true);
  });

  it('P(Burglary) sin evidencia ≈ prior 0.001', () => {
    const post = query(burglaryNet, 'Burglary');
    expect(close(post.distribution['true'], 0.001, 1e-9)).toBe(true);
    expect(close(post.distribution['false'], 0.999, 1e-9)).toBe(true);
  });

  it('P(Alarm) sin evidencia: marginal sobre Burglary/Earthquake', () => {
    const post = query(burglaryNet, 'Alarm');
    // P(A=t) = sum_B,E P(A=t|B,E) P(B) P(E)
    const expectedT =
      0.95 * 0.001 * 0.002 + 0.94 * 0.001 * 0.998 + 0.29 * 0.999 * 0.002 + 0.001 * 0.999 * 0.998;
    expect(close(post.distribution['true'], expectedT, 1e-6)).toBe(true);
  });

  it('VE coincide con brute force (Burglary | JohnCalls=t)', () => {
    const ve = query(burglaryNet, 'Burglary', { JohnCalls: 'true' });
    const bf = bruteForceMarginal(burglaryNet, 'Burglary', {
      JohnCalls: 'true',
    });
    expect(close(ve.distribution['true'], bf['true'], 1e-6)).toBe(true);
    expect(close(ve.distribution['false'], bf['false'], 1e-6)).toBe(true);
  });

  it('VE coincide con brute force (Alarm | MaryCalls=t)', () => {
    const ve = query(burglaryNet, 'Alarm', { MaryCalls: 'true' });
    const bf = bruteForceMarginal(burglaryNet, 'Alarm', {
      MaryCalls: 'true',
    });
    expect(close(ve.distribution['true'], bf['true'], 1e-6)).toBe(true);
  });

  it('cadena A→B→C: P(C=t) marginal', () => {
    // P(C=t) = sum_B P(C=t|B) P(B) ; P(B=t)=0.7*0.8+0.3*0.1=0.59
    // P(C=t)=0.9*0.59+0.2*0.41=0.613
    const post = query(chainNet, 'C');
    expect(close(post.distribution['t'], 0.613, 1e-4)).toBe(true);
  });

  it('cadena: P(A | C=t) actualiza el prior', () => {
    const post = query(chainNet, 'A', { C: 't' });
    const bf = bruteForceMarginal(chainNet, 'A', { C: 't' });
    expect(close(post.distribution['t'], bf['t'], 1e-6)).toBe(true);
    expect(post.distribution['t'] > 0.7).toBe(true); // C=t sube creencia en A=t
  });

  it('dominio ternario: P(Weather | Mood=happy)', () => {
    const post = query(weatherNet, 'Weather', { Mood: 'happy' });
    const sum =
      post.distribution['sunny'] + post.distribution['cloudy'] + post.distribution['rainy'];
    expect(close(sum, 1, 1e-9)).toBe(true);
    expect(post.distribution['sunny'] > post.distribution['rainy']).toBe(true);
    const bf = bruteForceMarginal(weatherNet, 'Weather', { Mood: 'happy' });
    expect(close(post.distribution['sunny'], bf['sunny'], 1e-6)).toBe(true);
    expect(close(post.distribution['rainy'], bf['rainy'], 1e-6)).toBe(true);
  });

  it('query observada devuelve distribución degenerada', () => {
    const post = query(burglaryNet, 'Burglary', { Burglary: 'true' });
    expect(post.distribution['true']).toBe(1);
    expect(post.distribution['false']).toBe(0);
  });

  it('evidencia con variable inexistente lanza error', () => {
    expect(() => query(chainNet, 'A', { ZZZ: 't' })).toThrow(/no existe/);
  });

  it('evidencia con valor fuera de dominio lanza error', () => {
    expect(() => query(chainNet, 'A', { B: 'maybe' })).toThrow(/dominio/);
  });

  it('query a variable inexistente lanza error', () => {
    expect(() => query(chainNet, 'ZZZ')).toThrow(/no existe/);
  });

  it('variableElimination es alias de query', () => {
    const a = query(chainNet, 'A', { C: 't' });
    const b = variableElimination(chainNet, 'A', { C: 't' });
    expect(close(a.distribution['t'], b.distribution['t'], 1e-12)).toBe(true);
  });
});

describe('bayesian — most probable explanation', () => {
  it('MPE devuelve asignación completa', () => {
    const mpe = mostProbableExplanation(burglaryNet);
    expect(Object.keys(mpe).sort()).toEqual([
      'Alarm',
      'Burglary',
      'Earthquake',
      'JohnCalls',
      'MaryCalls',
    ]);
  });

  it('MPE sin evidencia maximiza joint (Burglary network)', () => {
    const mpe = mostProbableExplanation(burglaryNet);
    const pMpe = jointProbability(burglaryNet, mpe);
    // Verificar contra enumeración: no debe haber asignación con joint > pMpe.
    const vars = burglaryNet.variables.map((v) => v.name);
    const doms = burglaryNet.variables.map((v) => v.values);
    let best = -1;
    function rec(i: number, acc: Record<string, string>): void {
      if (i === vars.length) {
        const p = jointProbability(burglaryNet, acc);
        if (p > best) best = p;
        return;
      }
      for (const val of doms[i]) {
        acc[vars[i]] = val;
        rec(i + 1, acc);
      }
    }
    rec(0, {});
    expect(close(pMpe, best, 1e-9)).toBe(true);
  });

  it('MPE respeta la evidencia observada', () => {
    const mpe = mostProbableExplanation(burglaryNet, {
      JohnCalls: 'true',
      MaryCalls: 'true',
    });
    expect(mpe['JohnCalls']).toBe('true');
    expect(mpe['MaryCalls']).toBe('true');
  });

  it('MPE con ambas llamadas activa Alarm más probable', () => {
    const mpe = mostProbableExplanation(burglaryNet, {
      JohnCalls: 'true',
      MaryCalls: 'true',
    });
    // El argmax dado J=t,M=t tiene Alarm=true (la probabilidad
    // de Alarm dada las llamadas es muy alta).
    expect(mpe['Alarm']).toBe('true');
  });

  it('MPE en cadena: argmax sobre joint', () => {
    const mpe = mostProbableExplanation(chainNet);
    const pMpe = jointProbability(chainNet, mpe);
    let best = -1;
    for (const a of ['t', 'f']) {
      for (const b of ['t', 'f']) {
        for (const c of ['t', 'f']) {
          const p = jointProbability(chainNet, { A: a, B: b, C: c });
          if (p > best) best = p;
        }
      }
    }
    expect(close(pMpe, best, 1e-9)).toBe(true);
  });

  it('MPE en weather: sunny+happy es el modo dominante', () => {
    const mpe = mostProbableExplanation(weatherNet);
    expect(mpe['Weather']).toBe('sunny');
    expect(mpe['Mood']).toBe('happy');
  });

  it('MPE con evidencia Weather=rainy elige Mood=sad', () => {
    const mpe = mostProbableExplanation(weatherNet, { Weather: 'rainy' });
    expect(mpe['Weather']).toBe('rainy');
    expect(mpe['Mood']).toBe('sad');
  });
});
