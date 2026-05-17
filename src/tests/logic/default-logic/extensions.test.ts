/**
 * ST Default Logic (Reiter) — Tests de extensiones y entailment
 * =============================================================
 * Valida cálculo de extensiones, entailment crédulo/escéptico y
 * los casos canónicos de la literatura (Tweety, Nixon diamond,
 * defaults sin prerequisite cumplido, conflictos múltiples).
 */
import { describe, it, expect } from 'vitest';
import {
  computeExtensions,
  isInExtension,
  isSkepticallyEntailed,
  isCredulouslyEntailed,
  normalizeLiteral,
  negate,
  isConsistent,
} from '../../../logic/profiles/default-logic';
import type { DefaultTheory } from '../../../logic/profiles/default-logic';

describe('default-logic — normalizeLiteral', () => {
  it('canoniza literales positivos y negativos', () => {
    expect(normalizeLiteral('P')).toBe('P');
    expect(normalizeLiteral('  P  ')).toBe('P');
    expect(normalizeLiteral('¬P')).toBe('¬P');
    expect(normalizeLiteral('!P')).toBe('¬P');
    expect(normalizeLiteral('~P')).toBe('¬P');
    expect(normalizeLiteral('not P')).toBe('¬P');
    expect(normalizeLiteral('NOT P')).toBe('¬P');
  });

  it('cancela dobles negaciones', () => {
    expect(normalizeLiteral('¬¬P')).toBe('P');
    expect(normalizeLiteral('!!P')).toBe('P');
    expect(normalizeLiteral('¬!P')).toBe('P');
    expect(normalizeLiteral('not not P')).toBe('P');
  });

  it('preserva predicados FOL como literales atómicos', () => {
    expect(normalizeLiteral('flies(tweety)')).toBe('flies(tweety)');
    expect(normalizeLiteral('¬flies(tweety)')).toBe('¬flies(tweety)');
    expect(normalizeLiteral('!penguin(opus)')).toBe('¬penguin(opus)');
  });

  it('lanza error en literal vacío o sin átomo', () => {
    expect(() => normalizeLiteral('')).toThrow();
    expect(() => normalizeLiteral('   ')).toThrow();
    expect(() => normalizeLiteral('¬¬')).toThrow();
  });
});

describe('default-logic — negate y consistencia', () => {
  it('negate alterna polaridad', () => {
    expect(negate('P')).toBe('¬P');
    expect(negate('¬P')).toBe('P');
    expect(negate('flies(tweety)')).toBe('¬flies(tweety)');
  });

  it('isConsistent detecta pares L/¬L', () => {
    expect(isConsistent(new Set(['P', 'Q']))).toBe(true);
    expect(isConsistent(new Set(['P', '¬P']))).toBe(false);
    expect(isConsistent(new Set(['flies(tweety)', '¬flies(tweety)']))).toBe(false);
    expect(isConsistent(new Set())).toBe(true);
  });
});

describe('default-logic — teorías triviales', () => {
  it('sin defaults: extensión única = facts', () => {
    const T: DefaultTheory = { facts: ['P', 'Q'], defaults: [] };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(Array.from(exts[0].formulas).sort()).toEqual(['P', 'Q']);
    expect(exts[0].appliedDefaults).toEqual([]);
  });

  it('sin facts ni defaults: una extensión vacía', () => {
    const T: DefaultTheory = { facts: [], defaults: [] };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.size).toBe(0);
  });

  it('default con prerequisite no cumplido NO se aplica', () => {
    const T: DefaultTheory = {
      facts: ['Q'], // no incluye P
      defaults: [{ id: 'd1', prerequisite: 'P', justifications: ['R'], consequent: 'R' }],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.has('R')).toBe(false);
    expect(exts[0].appliedDefaults).toEqual([]);
  });
});

describe('default-logic — caso Tweety', () => {
  const facts = ['bird(tweety)'];
  const dBirdsFly = {
    id: 'birds-fly',
    prerequisite: 'bird(tweety)',
    justifications: ['flies(tweety)'],
    consequent: 'flies(tweety)',
  };

  it('Tweety vuela: única extensión con flies(tweety)', () => {
    const T: DefaultTheory = { facts, defaults: [dBirdsFly] };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.has('flies(tweety)')).toBe(true);
    expect(exts[0].appliedDefaults).toEqual(['birds-fly']);
  });

  it('Tweety + entailment crédulo y escéptico coinciden con extensión única', () => {
    const T: DefaultTheory = { facts, defaults: [dBirdsFly] };
    expect(isCredulouslyEntailed('flies(tweety)', T)).toBe(true);
    expect(isSkepticallyEntailed('flies(tweety)', T)).toBe(true);
    expect(isCredulouslyEntailed('¬flies(tweety)', T)).toBe(false);
  });

  it('Penguin + bird: el default "birds fly" queda bloqueado por inconsistencia', () => {
    // Pingüino que también es pájaro, pero el hecho ¬flies bloquea el default.
    const T: DefaultTheory = {
      facts: ['bird(opus)', 'penguin(opus)', '¬flies(opus)'],
      defaults: [
        {
          id: 'birds-fly',
          prerequisite: 'bird(opus)',
          justifications: ['flies(opus)'],
          consequent: 'flies(opus)',
        },
      ],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.has('flies(opus)')).toBe(false);
    expect(exts[0].formulas.has('¬flies(opus)')).toBe(true);
    expect(exts[0].appliedDefaults).toEqual([]);
  });

  it('Penguin con defaults compitiendo: prioridad por prerequisite más específico se elige por aplicabilidad', () => {
    // Dos defaults en conflicto, sin penguin como hecho duro.
    // En Reiter "puro" (sin priorización) ambos defaults son aplicables
    // pero mutuamente excluyentes → dos extensiones.
    const T: DefaultTheory = {
      facts: ['bird(opus)', 'penguin(opus)'],
      defaults: [
        {
          id: 'birds-fly',
          prerequisite: 'bird(opus)',
          justifications: ['flies(opus)'],
          consequent: 'flies(opus)',
        },
        {
          id: 'penguins-dont-fly',
          prerequisite: 'penguin(opus)',
          justifications: ['¬flies(opus)'],
          consequent: '¬flies(opus)',
        },
      ],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(2);
    const fliesExt = exts.find((e) => e.formulas.has('flies(opus)'));
    const noFliesExt = exts.find((e) => e.formulas.has('¬flies(opus)'));
    expect(fliesExt).toBeDefined();
    expect(noFliesExt).toBeDefined();
    // Entailment: crédulo ambos, escéptico ninguno
    expect(isCredulouslyEntailed('flies(opus)', T)).toBe(true);
    expect(isCredulouslyEntailed('¬flies(opus)', T)).toBe(true);
    expect(isSkepticallyEntailed('flies(opus)', T)).toBe(false);
    expect(isSkepticallyEntailed('¬flies(opus)', T)).toBe(false);
    // bird(opus) y penguin(opus) sí son escépticos
    expect(isSkepticallyEntailed('bird(opus)', T)).toBe(true);
    expect(isSkepticallyEntailed('penguin(opus)', T)).toBe(true);
  });
});

describe('default-logic — Nixon diamond', () => {
  it('Nixon: republicano (no pacifista) vs cuáquero (pacifista) → 2 extensiones', () => {
    // Caso canónico de Reiter: Nixon es republicano y cuáquero.
    // Republicanos típicamente NO son pacifistas; cuáqueros típicamente SÍ.
    const T: DefaultTheory = {
      facts: ['republican(nixon)', 'quaker(nixon)'],
      defaults: [
        {
          id: 'rep-not-pacifist',
          prerequisite: 'republican(nixon)',
          justifications: ['¬pacifist(nixon)'],
          consequent: '¬pacifist(nixon)',
        },
        {
          id: 'quaker-pacifist',
          prerequisite: 'quaker(nixon)',
          justifications: ['pacifist(nixon)'],
          consequent: 'pacifist(nixon)',
        },
      ],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(2);
    expect(isCredulouslyEntailed('pacifist(nixon)', T)).toBe(true);
    expect(isCredulouslyEntailed('¬pacifist(nixon)', T)).toBe(true);
    expect(isSkepticallyEntailed('pacifist(nixon)', T)).toBe(false);
    expect(isSkepticallyEntailed('¬pacifist(nixon)', T)).toBe(false);
  });
});

describe('default-logic — cadenas y dependencias', () => {
  it('cadena de defaults: P → Q → R', () => {
    const T: DefaultTheory = {
      facts: ['P'],
      defaults: [
        { id: 'd1', prerequisite: 'P', justifications: ['Q'], consequent: 'Q' },
        { id: 'd2', prerequisite: 'Q', justifications: ['R'], consequent: 'R' },
      ],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.has('Q')).toBe(true);
    expect(exts[0].formulas.has('R')).toBe(true);
    expect(exts[0].appliedDefaults.sort()).toEqual(['d1', 'd2']);
  });

  it('justificación inconsistente con facts bloquea default', () => {
    const T: DefaultTheory = {
      facts: ['P', '¬Q'],
      defaults: [
        // β=Q, pero ¬Q ∈ facts → no consistente
        { id: 'd1', prerequisite: 'P', justifications: ['Q'], consequent: 'R' },
      ],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.has('R')).toBe(false);
    expect(exts[0].appliedDefaults).toEqual([]);
  });

  it('defaults independientes que no compiten: ambos aplican en una sola extensión', () => {
    const T: DefaultTheory = {
      facts: ['A', 'B'],
      defaults: [
        { id: 'd1', prerequisite: 'A', justifications: ['X'], consequent: 'X' },
        { id: 'd2', prerequisite: 'B', justifications: ['Y'], consequent: 'Y' },
      ],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.has('X')).toBe(true);
    expect(exts[0].formulas.has('Y')).toBe(true);
  });

  it('default con consequent que rompería consistencia con facts: 0 extensiones (teoría incoherente en Reiter)', () => {
    // Caso conocido de Reiter: la justificación X es consistente con cualquier
    // candidato E, así que el operador Γ_T fuerza R en E. Pero R contradice
    // ¬R ∈ facts, así que ningún E puede ser punto fijo. Resultado correcto:
    // 0 extensiones (la teoría no tiene extensiones).
    const T: DefaultTheory = {
      facts: ['P', '¬R'],
      defaults: [{ id: 'd1', prerequisite: 'P', justifications: ['X'], consequent: 'R' }],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(0);
    // Entailment escéptico/crédulo sobre teoría sin extensiones: false
    expect(isSkepticallyEntailed('R', T)).toBe(false);
    expect(isCredulouslyEntailed('R', T)).toBe(false);
  });
});

describe('default-logic — múltiples justificaciones', () => {
  it('default aplica solo si TODAS las justificaciones son consistentes', () => {
    const T: DefaultTheory = {
      facts: ['P', '¬B'],
      defaults: [
        // Necesita A y B consistentes; ¬B ∈ facts → bloqueado
        { id: 'd1', prerequisite: 'P', justifications: ['A', 'B'], consequent: 'C' },
      ],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.has('C')).toBe(false);
  });

  it('todas las justificaciones consistentes → consequent se añade', () => {
    const T: DefaultTheory = {
      facts: ['P'],
      defaults: [{ id: 'd1', prerequisite: 'P', justifications: ['A', 'B'], consequent: 'C' }],
    };
    const exts = computeExtensions(T);
    expect(exts).toHaveLength(1);
    expect(exts[0].formulas.has('C')).toBe(true);
  });
});

describe('default-logic — isInExtension y validaciones', () => {
  it('isInExtension acepta formas no-canónicas de literal', () => {
    const T: DefaultTheory = {
      facts: ['P'],
      defaults: [{ id: 'd1', prerequisite: 'P', justifications: ['Q'], consequent: 'Q' }],
    };
    const ext = computeExtensions(T)[0];
    expect(isInExtension('Q', ext)).toBe(true);
    expect(isInExtension(' Q ', ext)).toBe(true);
    expect(isInExtension('¬¬Q', ext)).toBe(true);
    expect(isInExtension('¬Q', ext)).toBe(false);
  });

  it('facts inconsistentes lanzan error', () => {
    const T: DefaultTheory = { facts: ['P', '¬P'], defaults: [] };
    expect(() => computeExtensions(T)).toThrow(/inconsistentes/i);
  });

  it('IDs de defaults duplicados lanzan error', () => {
    const T: DefaultTheory = {
      facts: ['P'],
      defaults: [
        { id: 'd1', prerequisite: 'P', justifications: ['Q'], consequent: 'Q' },
        { id: 'd1', prerequisite: 'P', justifications: ['R'], consequent: 'R' },
      ],
    };
    expect(() => computeExtensions(T)).toThrow(/duplicado/i);
  });
});

describe('default-logic — opciones', () => {
  it('respeta maxExtensions', () => {
    // Tres pares independientes → 2^3 = 8 extensiones potenciales
    const T: DefaultTheory = {
      facts: ['A', 'B', 'C'],
      defaults: [
        { id: 'pa', prerequisite: 'A', justifications: ['Pa'], consequent: 'Pa' },
        { id: 'na', prerequisite: 'A', justifications: ['¬Pa'], consequent: '¬Pa' },
        { id: 'pb', prerequisite: 'B', justifications: ['Pb'], consequent: 'Pb' },
        { id: 'nb', prerequisite: 'B', justifications: ['¬Pb'], consequent: '¬Pb' },
        { id: 'pc', prerequisite: 'C', justifications: ['Pc'], consequent: 'Pc' },
        { id: 'nc', prerequisite: 'C', justifications: ['¬Pc'], consequent: '¬Pc' },
      ],
    };
    const exts = computeExtensions(T, { maxExtensions: 4 });
    expect(exts.length).toBeLessThanOrEqual(4);
    expect(exts.length).toBeGreaterThan(0);
  });

  it('rechaza teorías con más defaults que maxDefaults', () => {
    const defaults = Array.from({ length: 10 }, (_, i) => ({
      id: `d${i}`,
      prerequisite: 'P',
      justifications: [`Q${i}`],
      consequent: `Q${i}`,
    }));
    const T: DefaultTheory = { facts: ['P'], defaults };
    expect(() => computeExtensions(T, { maxDefaults: 5 })).toThrow(/excede el límite/);
    // Con maxDefaults amplio funciona
    const exts = computeExtensions(T, { maxDefaults: 20 });
    expect(exts).toHaveLength(1);
    expect(exts[0].appliedDefaults).toHaveLength(10);
  });
});
