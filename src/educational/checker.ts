// ============================================================
// checkAnswer — evaluación de respuestas del estudiante
// ============================================================

import { evaluate } from '../api';
import { AnswerResult, Exercise, ExerciseKind, StudentAnswer, StudentAnswerObject } from './types';
import { formulasEqualText, matchesStatus, normalizeFormula, parseValuation } from './normalize';

function toAnswerObject(raw: StudentAnswer): StudentAnswerObject {
  if (typeof raw === 'string') return { answer: raw };
  return raw;
}

function pickHint(ex: Exercise, attemptScore: number): string | undefined {
  if (ex.hints.length === 0) return undefined;
  if (attemptScore >= 50) return ex.hints[0];
  if (attemptScore >= 25 && ex.hints.length >= 2) return ex.hints[1];
  return ex.hints[ex.hints.length - 1];
}

function evaluateValidity(ex: Exercise): 'valid' | 'invalid' | null {
  if (!ex.formula) return null;
  const source = `logic ${ex.profile}\ncheck valid ${ex.formula}`;
  const result = evaluate(source, '<educational>');
  const first = result.results[0];
  if (!first) return null;
  if (first.status === 'valid') return 'valid';
  if (first.status === 'invalid') return 'invalid';
  return null;
}

function evaluateSatisfiability(ex: Exercise): 'satisfiable' | 'unsatisfiable' | null {
  if (!ex.formula) return null;
  const source = `logic ${ex.profile}\ncheck satisfiable ${ex.formula}`;
  const result = evaluate(source, '<educational>');
  const first = result.results[0];
  if (!first) return null;
  if (first.status === 'satisfiable') return 'satisfiable';
  if (first.status === 'unsatisfiable') return 'unsatisfiable';
  return null;
}

function substituteAtoms(formula: string, valuation: Record<string, boolean>): string {
  let out = formula;
  // Sustituir átomos por true/false. Match identifier word boundaries.
  for (const [atom, val] of Object.entries(valuation)) {
    const re = new RegExp(`\\b${atom}\\b`, 'g');
    out = out.replace(re, val ? 'true' : 'false');
  }
  return out;
}

function evaluateCountermodel(ex: Exercise, valuation: Record<string, boolean>): boolean {
  if (!ex.formula) return false;
  const substituted = substituteAtoms(ex.formula, valuation);
  const source = `logic ${ex.profile}\ncheck satisfiable ${substituted}`;
  const result = evaluate(source, '<educational>');
  const first = result.results[0];
  if (!first) return false;
  // Si tras sustituir la fórmula queda insatisfacible/inválida, la valuación
  // hace falsa la fórmula original → es un contramodelo.
  return first.status === 'unsatisfiable' || first.status === 'invalid';
}

function checkValidityAnswer(ex: Exercise, raw: string): AnswerResult {
  const truth = evaluateValidity(ex) ?? ex.solution.kind;
  const expected = truth === 'valid' ? 'valid' : 'invalid';
  const ok = matchesStatus(raw, expected);
  if (ok) {
    return {
      correct: true,
      score: 100,
      feedback: `Correcto. ${ex.solution.explanation}`,
    };
  }
  return {
    correct: false,
    score: 0,
    feedback: `Incorrecto. La fórmula es ${expected === 'valid' ? 'válida' : 'inválida'} en ${ex.profile}. ${ex.solution.explanation}`,
    nextHint: pickHint(ex, 0),
  };
}

function checkSatisfiabilityAnswer(ex: Exercise, raw: string): AnswerResult {
  const truth = evaluateSatisfiability(ex) ?? ex.solution.kind;
  const expected = truth === 'satisfiable' ? 'satisfiable' : 'unsatisfiable';
  const ok = matchesStatus(raw, expected);
  if (ok) {
    return {
      correct: true,
      score: 100,
      feedback: `Correcto. ${ex.solution.explanation}`,
    };
  }
  return {
    correct: false,
    score: 0,
    feedback: `Incorrecto. La fórmula es ${expected === 'satisfiable' ? 'satisfacible' : 'insatisfacible'}. ${ex.solution.explanation}`,
    nextHint: pickHint(ex, 0),
  };
}

function checkDeriveAnswer(ex: Exercise, raw: string): AnswerResult {
  const trimmed = raw.trim().toLowerCase();
  const expectedGoal = ex.goal ?? ex.solution.canonicalFormula ?? '';
  if (expectedGoal && formulasEqualText(raw, expectedGoal)) {
    return {
      correct: true,
      score: 100,
      feedback: `Correcto. ${ex.solution.explanation}`,
    };
  }
  if (
    trimmed === 'sí' ||
    trimmed === 'si' ||
    trimmed === 'yes' ||
    trimmed === 'provable' ||
    trimmed === 'derivable' ||
    trimmed === 'true'
  ) {
    if (ex.solution.kind === 'provable') {
      return {
        correct: true,
        score: 80,
        feedback: `Correcto en intuición, pero se esperaba que escribieras la fórmula derivada: \`${expectedGoal}\`. ${ex.solution.explanation}`,
      };
    }
  }
  return {
    correct: false,
    score: 0,
    feedback: `Incorrecto. La fórmula derivable a partir de las premisas es \`${expectedGoal}\`. ${ex.solution.explanation}`,
    nextHint: pickHint(ex, 0),
  };
}

function checkCountermodelAnswer(
  ex: Exercise,
  rawText: string,
  parsedValuation: Record<string, boolean> | undefined,
): AnswerResult {
  let valuation = parsedValuation;
  if (!valuation) {
    const parsed = parseValuation(rawText);
    if (parsed) valuation = parsed;
  }
  if (!valuation) {
    return {
      correct: false,
      score: 0,
      feedback:
        'No pude interpretar tu respuesta como una asignación de valores. Usá formato como "P=V, Q=F" o un objeto JSON {"P": true, "Q": false}.',
      nextHint: pickHint(ex, 0),
    };
  }
  const isCountermodel = evaluateCountermodel(ex, valuation);
  if (isCountermodel) {
    return {
      correct: true,
      score: 100,
      feedback: `Correcto. La asignación ${JSON.stringify(valuation)} hace falsa la fórmula. ${ex.solution.explanation}`,
    };
  }
  return {
    correct: false,
    score: 0,
    feedback: `La asignación ${JSON.stringify(valuation)} no es un contramodelo: la fórmula sigue siendo verdadera bajo esa interpretación. ${ex.solution.explanation}`,
    nextHint: pickHint(ex, 0),
  };
}

function checkTranslateAnswer(ex: Exercise, raw: string): AnswerResult {
  const expected = ex.solution.canonicalFormula ?? '';
  if (!expected) {
    return {
      correct: false,
      score: 0,
      feedback: 'No hay traducción canónica registrada para este ejercicio.',
    };
  }
  if (formulasEqualText(raw, expected)) {
    return {
      correct: true,
      score: 100,
      feedback: `Correcto. ${ex.solution.explanation}`,
    };
  }
  // Acepta variantes sin paréntesis externos
  const stripped = expected.replace(/^\(/, '').replace(/\)$/, '');
  if (formulasEqualText(raw, stripped)) {
    return {
      correct: true,
      score: 95,
      feedback: `Correcto (los paréntesis externos son opcionales). ${ex.solution.explanation}`,
    };
  }
  return {
    correct: false,
    score: scoreFormulaSimilarity(raw, expected),
    feedback: `La traducción esperada es \`${expected}\`. ${ex.solution.explanation}`,
    nextHint: pickHint(ex, scoreFormulaSimilarity(raw, expected)),
  };
}

function scoreFormulaSimilarity(a: string, b: string): number {
  const na = normalizeFormula(a);
  const nb = normalizeFormula(b);
  if (na === nb) return 100;
  if (na.length === 0 || nb.length === 0) return 0;
  let common = 0;
  for (const ch of nb) {
    if (na.includes(ch)) common++;
  }
  return Math.min(50, Math.round((common / nb.length) * 50));
}

const CHECKERS: Record<
  ExerciseKind,
  (ex: Exercise, raw: string, obj: StudentAnswerObject) => AnswerResult
> = {
  validity: (ex, raw) => checkValidityAnswer(ex, raw),
  satisfiability: (ex, raw) => checkSatisfiabilityAnswer(ex, raw),
  derive: (ex, raw) => checkDeriveAnswer(ex, raw),
  countermodel: (ex, raw, obj) => checkCountermodelAnswer(ex, raw, obj.valuation),
  translate: (ex, raw) => checkTranslateAnswer(ex, raw),
};

export function checkAnswer(exercise: Exercise, studentAnswer: StudentAnswer): AnswerResult {
  const obj = toAnswerObject(studentAnswer);
  const raw = (obj.answer ?? obj.formula ?? '').toString();
  const checker = CHECKERS[exercise.kind];
  if (!checker) {
    return {
      correct: false,
      score: 0,
      feedback: `Tipo de ejercicio no soportado: ${exercise.kind}`,
    };
  }
  if (!raw && !obj.valuation) {
    return {
      correct: false,
      score: 0,
      feedback: 'No proporcionaste una respuesta.',
      nextHint: exercise.hints[0],
    };
  }
  return checker(exercise, raw, obj);
}
