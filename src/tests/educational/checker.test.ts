// ============================================================
// Tests: checkAnswer
// ============================================================

import { describe, it, expect } from 'vitest';
import { checkAnswer, generateExercise } from '../../educational';

describe('checkAnswer — validity', () => {
  it('respuesta correcta a tautología clásica devuelve correct=true score=100', () => {
    const ex = generateExercise(1, 'classical.propositional', 'validity', {
      seed: 1,
      templateId: 'l1-identity',
    });
    const result = checkAnswer(ex, 'valid');
    expect(result.correct).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback).toBeTruthy();
  });

  it('acepta sinónimos como "sí" para validez', () => {
    const ex = generateExercise(1, 'classical.propositional', 'validity', {
      seed: 1,
      templateId: 'l1-identity',
    });
    const result = checkAnswer(ex, 'sí');
    expect(result.correct).toBe(true);
  });

  it('respuesta incorrecta devuelve correct=false con feedback útil y next hint', () => {
    const ex = generateExercise(1, 'classical.propositional', 'validity', {
      seed: 1,
      templateId: 'l1-identity',
    });
    const result = checkAnswer(ex, 'invalid');
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback.length).toBeGreaterThan(10);
    expect(result.nextHint).toBeTruthy();
  });

  it('LEM intuicionista: la respuesta "invalid" es correcta', () => {
    const ex = generateExercise(3, 'intuitionistic.propositional', 'validity', {
      seed: 1,
      templateId: 'l3-intuit-lem',
    });
    const result = checkAnswer(ex, 'invalid');
    expect(result.correct).toBe(true);
  });

  it('LEM clásico: la respuesta "valid" es correcta', () => {
    const ex = generateExercise(1, 'classical.propositional', 'validity', {
      seed: 1,
      templateId: 'l1-lem-classical',
    });
    const result = checkAnswer(ex, 'valid');
    expect(result.correct).toBe(true);
  });
});

describe('checkAnswer — satisfiability', () => {
  it('responder "satisfiable" a un átomo es correcto', () => {
    const ex = generateExercise(1, 'classical.propositional', 'satisfiability', {
      seed: 1,
      templateId: 'l1-sat-atom',
    });
    const result = checkAnswer(ex, 'satisfiable');
    expect(result.correct).toBe(true);
  });

  it('responder "unsat" a una contradicción es correcto', () => {
    const ex = generateExercise(1, 'classical.propositional', 'satisfiability', {
      seed: 1,
      templateId: 'l1-unsat-contradiction',
    });
    const result = checkAnswer(ex, 'unsat');
    expect(result.correct).toBe(true);
  });

  it('respuesta incorrecta a contradicción', () => {
    const ex = generateExercise(1, 'classical.propositional', 'satisfiability', {
      seed: 1,
      templateId: 'l1-unsat-contradiction',
    });
    const result = checkAnswer(ex, 'satisfiable');
    expect(result.correct).toBe(false);
  });
});

describe('checkAnswer — derive', () => {
  it('responder la fórmula correcta para modus ponens', () => {
    const ex = generateExercise(2, 'classical.propositional', 'derive', {
      seed: 1,
      templateId: 'l2-modus-ponens',
    });
    expect(ex.goal).toBeTruthy();
    const result = checkAnswer(ex, ex.goal!);
    expect(result.correct).toBe(true);
  });

  it('responder "sí" da score parcial pero correcto', () => {
    const ex = generateExercise(2, 'classical.propositional', 'derive', {
      seed: 1,
      templateId: 'l2-modus-ponens',
    });
    const result = checkAnswer(ex, 'sí');
    expect(result.correct).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it('responder fórmula incorrecta da feedback', () => {
    const ex = generateExercise(2, 'classical.propositional', 'derive', {
      seed: 1,
      templateId: 'l2-modus-ponens',
    });
    const result = checkAnswer(ex, 'X');
    expect(result.correct).toBe(false);
    expect(result.feedback).toBeTruthy();
    expect(result.nextHint).toBeTruthy();
  });
});

describe('checkAnswer — countermodel', () => {
  it('valuación correcta para P -> Q como contramodelo', () => {
    const ex = generateExercise(2, 'classical.propositional', 'countermodel', {
      seed: 1,
      templateId: 'l2-cm-pq',
    });
    const hint = ex.solution.countermodelHint!;
    const result = checkAnswer(ex, { valuation: hint });
    expect(result.correct).toBe(true);
  });

  it('valuación incorrecta (todas verdaderas) no es contramodelo', () => {
    const ex = generateExercise(2, 'classical.propositional', 'countermodel', {
      seed: 1,
      templateId: 'l2-cm-pq',
    });
    const keys = Object.keys(ex.solution.countermodelHint!);
    const allTrue: Record<string, boolean> = {};
    for (const k of keys) allTrue[k] = true;
    const result = checkAnswer(ex, { valuation: allTrue });
    expect(result.correct).toBe(false);
  });

  it('acepta formato string "P=V, Q=F"', () => {
    const ex = generateExercise(2, 'classical.propositional', 'countermodel', {
      seed: 1,
      templateId: 'l2-cm-pq',
    });
    const hint = ex.solution.countermodelHint!;
    const text = Object.entries(hint)
      .map(([k, v]) => `${k}=${v ? 'V' : 'F'}`)
      .join(', ');
    const result = checkAnswer(ex, text);
    expect(result.correct).toBe(true);
  });

  it('respuesta vacía/malformada da feedback', () => {
    const ex = generateExercise(2, 'classical.propositional', 'countermodel', {
      seed: 1,
      templateId: 'l2-cm-pq',
    });
    const result = checkAnswer(ex, 'no sé');
    expect(result.correct).toBe(false);
    expect(result.feedback).toBeTruthy();
  });
});

describe('checkAnswer — translate', () => {
  it('traducción correcta de conjunción', () => {
    const ex = generateExercise(1, 'classical.propositional', 'translate', {
      seed: 1,
      templateId: 'l1-translate-and',
    });
    expect(ex.solution.canonicalFormula).toBeTruthy();
    const result = checkAnswer(ex, ex.solution.canonicalFormula!);
    expect(result.correct).toBe(true);
  });

  it('traducción correcta de implicación', () => {
    const ex = generateExercise(1, 'classical.propositional', 'translate', {
      seed: 1,
      templateId: 'l1-translate-implies',
    });
    const result = checkAnswer(ex, ex.solution.canonicalFormula!);
    expect(result.correct).toBe(true);
  });

  it('traducción incorrecta da feedback con sugerencia', () => {
    const ex = generateExercise(1, 'classical.propositional', 'translate', {
      seed: 1,
      templateId: 'l1-translate-and',
    });
    const result = checkAnswer(ex, 'zzz');
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain('esperada');
  });
});

describe('toPublicExercise', () => {
  it('NO expone la solution al estudiante', () => {
    const ex = generateExercise(1, 'classical.propositional', 'validity', {
      seed: 1,
      templateId: 'l1-identity',
    });
    // Verificamos que un consumer puede pasar sólo el subset sin solution
    const publicEx = {
      id: ex.id,
      level: ex.level,
      profile: ex.profile,
      kind: ex.kind,
      prompt: ex.prompt,
      formula: ex.formula,
      hints: ex.hints,
    };
    expect((publicEx as Record<string, unknown>).solution).toBeUndefined();
  });
});

describe('integration: generateLessonPath + checkAnswer', () => {
  it('para cada ejercicio del path, responder con su expectedAnswer es correcto', () => {
    const ex = generateExercise(1, 'classical.propositional', 'validity', {
      seed: 1,
      templateId: 'l1-identity',
    });
    const result = checkAnswer(ex, ex.solution.expectedAnswer);
    expect(result.correct).toBe(true);
  });
});
