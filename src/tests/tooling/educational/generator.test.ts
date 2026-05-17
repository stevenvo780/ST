// ============================================================
// Tests: generateExercise y generateLessonPath
// ============================================================

import { describe, it, expect } from 'vitest';
import { generateExercise, generateLessonPath, listTemplates } from '../../../tooling/educational';

describe('generateExercise', () => {
  it('devuelve un Exercise con todos los campos requeridos (level=1, classical, validity)', () => {
    const ex = generateExercise(1, 'classical.propositional', 'validity', { seed: 42 });
    expect(ex.id).toBeTruthy();
    expect(ex.level).toBe(1);
    expect(ex.profile).toBe('classical.propositional');
    expect(ex.kind).toBe('validity');
    expect(ex.prompt).toBeTruthy();
    expect(Array.isArray(ex.hints)).toBe(true);
    expect(ex.hints.length).toBeGreaterThanOrEqual(1);
    expect(ex.solution).toBeDefined();
    expect(ex.solution.expectedAnswer).toBeTruthy();
    expect(ex.solution.explanation).toBeTruthy();
  });

  it('genera ejercicios de satisfacibilidad nivel 1', () => {
    const ex = generateExercise(1, 'classical.propositional', 'satisfiability', {
      seed: 7,
    });
    expect(ex.kind).toBe('satisfiability');
    expect(ex.formula).toBeTruthy();
    expect(['satisfiable', 'unsatisfiable']).toContain(ex.solution.kind);
  });

  it('genera ejercicios de derivación nivel 2 con premisas y goal', () => {
    const ex = generateExercise(2, 'classical.propositional', 'derive', { seed: 11 });
    expect(ex.kind).toBe('derive');
    expect(Array.isArray(ex.premises)).toBe(true);
    expect(ex.premises!.length).toBeGreaterThan(0);
    expect(ex.goal).toBeTruthy();
  });

  it('genera ejercicios intuicionistas nivel 3', () => {
    const ex = generateExercise(3, 'intuitionistic.propositional', 'validity', {
      seed: 5,
    });
    expect(ex.profile).toBe('intuitionistic.propositional');
    expect(['valid', 'invalid']).toContain(ex.solution.kind);
  });

  it('genera ejercicios nivel 4 (avanzado)', () => {
    const ex = generateExercise(4, 'classical.propositional', 'derive', { seed: 99 });
    expect(ex.level).toBe(4);
    expect(ex.premises!.length).toBeGreaterThanOrEqual(2);
  });

  it('genera ejercicios de countermodel nivel 2', () => {
    const ex = generateExercise(2, 'classical.propositional', 'countermodel', {
      seed: 13,
    });
    expect(ex.kind).toBe('countermodel');
    expect(ex.solution.countermodelHint).toBeDefined();
  });

  it('determinismo: mismo seed produce mismo ejercicio', () => {
    const a = generateExercise(2, 'classical.propositional', 'derive', { seed: 12345 });
    const b = generateExercise(2, 'classical.propositional', 'derive', { seed: 12345 });
    expect(a.id).toBe(b.id);
    expect(a.prompt).toBe(b.prompt);
    expect(a.formula).toBe(b.formula);
    expect(a.premises).toEqual(b.premises);
    expect(a.goal).toBe(b.goal);
  });

  it('determinismo: distintos seeds (generalmente) producen distintos ejercicios', () => {
    const variants = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const ex = generateExercise(2, 'classical.propositional', 'derive', {
        seed: i * 1000 + 7,
      });
      variants.add(`${ex.prompt}|${ex.formula ?? ''}|${(ex.premises ?? []).join(',')}`);
    }
    expect(variants.size).toBeGreaterThan(1);
  });

  it('templateId fuerza una plantilla específica', () => {
    const ex = generateExercise(1, 'classical.propositional', 'validity', {
      seed: 1,
      templateId: 'l1-identity',
    });
    expect(ex.solution.kind).toBe('valid');
    expect(ex.formula).toContain('->');
  });

  it('lanza error si no hay plantilla para la combinación', () => {
    expect(() => generateExercise(4, 'aristotelian.syllogistic', 'derive')).toThrow();
  });

  it('lanza error si templateId no existe', () => {
    expect(() =>
      generateExercise(1, 'classical.propositional', 'validity', {
        templateId: 'no-existe-jamas',
      }),
    ).toThrow();
  });
});

describe('generateLessonPath', () => {
  it('devuelve >= 3 ejercicios de nivel creciente para classical hasta 3', () => {
    const path = generateLessonPath('classical.propositional', 3, { seed: 100 });
    expect(path.length).toBeGreaterThanOrEqual(3);
    // Niveles deben ser monotónicamente no-decrecientes
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1].level;
      const curr = path[i].level;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('cubre niveles de 1 a targetLevel', () => {
    const path = generateLessonPath('classical.propositional', 4, { seed: 200 });
    const levels = new Set(path.map((e) => e.level));
    expect(levels.has(1)).toBe(true);
    expect(levels.has(2)).toBe(true);
    expect(levels.has(3)).toBe(true);
    expect(levels.has(4)).toBe(true);
  });

  it('determinismo con seed', () => {
    const a = generateLessonPath('classical.propositional', 2, { seed: 99 });
    const b = generateLessonPath('classical.propositional', 2, { seed: 99 });
    expect(a.length).toBe(b.length);
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
  });

  it('genera path intuicionista', () => {
    const path = generateLessonPath('intuitionistic.propositional', 3, { seed: 33 });
    expect(path.length).toBeGreaterThan(0);
  });
});

describe('listTemplates', () => {
  it('hay plantillas para los 4 niveles', () => {
    const all = listTemplates();
    const levels = new Set(all.map((t) => t.level));
    expect(levels.has(1)).toBe(true);
    expect(levels.has(2)).toBe(true);
    expect(levels.has(3)).toBe(true);
    expect(levels.has(4)).toBe(true);
  });

  it('todas las plantillas declaran al menos un perfil', () => {
    for (const t of listTemplates()) {
      expect(t.profiles.length).toBeGreaterThan(0);
    }
  });
});
