// ============================================================
// generateExercise + generateLessonPath
// ============================================================

import {
  Exercise,
  ExerciseKind,
  ExerciseLevel,
  ExerciseSolution,
  GenerateOptions,
  ProfileName,
  SolutionKind,
} from './types';
import { SeededRng, autoSeed } from './rng';
import { ExerciseTemplate, findTemplateById, findTemplatesFor, pickVars } from './templates';

function statusToSolutionKind(
  status: 'valid' | 'invalid' | 'satisfiable' | 'unsatisfiable' | 'provable' | 'refutable',
): SolutionKind {
  return status;
}

function expectedAnswerFor(
  kind: ExerciseKind,
  status: 'valid' | 'invalid' | 'satisfiable' | 'unsatisfiable' | 'provable' | 'refutable',
  canonicalFormula: string | undefined,
  countermodelHint: Record<string, boolean> | undefined,
): { expected: string; acceptable: string[] } {
  switch (kind) {
    case 'validity':
      return status === 'valid'
        ? {
            expected: 'valid',
            acceptable: [
              'valid',
              'sí',
              'si',
              'yes',
              'verdadero',
              'tautología',
              'tautologia',
              'válida',
              'valida',
            ],
          }
        : { expected: 'invalid', acceptable: ['invalid', 'no', 'falso', 'inválida', 'invalida'] };
    case 'satisfiability':
      return status === 'satisfiable'
        ? { expected: 'satisfiable', acceptable: ['satisfiable', 'sat', 'consistente'] }
        : {
            expected: 'unsatisfiable',
            acceptable: [
              'unsatisfiable',
              'unsat',
              'inconsistente',
              'contradicción',
              'contradiccion',
            ],
          };
    case 'derive':
      return {
        expected: canonicalFormula ?? 'provable',
        acceptable:
          status === 'provable'
            ? ['provable', 'derivable', 'demostrable', 'sí', 'si', canonicalFormula ?? '']
            : ['refutable', 'no derivable', 'no'],
      };
    case 'countermodel':
      if (countermodelHint) {
        const text = Object.entries(countermodelHint)
          .map(([k, v]) => `${k}=${v ? 'V' : 'F'}`)
          .join(', ');
        return { expected: text, acceptable: [text, JSON.stringify(countermodelHint)] };
      }
      return { expected: 'countermodel', acceptable: [] };
    case 'translate':
      return {
        expected: canonicalFormula ?? '',
        acceptable: canonicalFormula ? [canonicalFormula] : [],
      };
  }
}

function makeSolution(
  template: ExerciseTemplate,
  buildResult: ReturnType<ExerciseTemplate['build']>,
): ExerciseSolution {
  const { expected, acceptable } = expectedAnswerFor(
    template.kind,
    buildResult.expectedStatus,
    buildResult.canonicalFormula,
    buildResult.countermodelHint,
  );
  return {
    kind: statusToSolutionKind(buildResult.expectedStatus),
    expectedAnswer: expected,
    acceptableAnswers: acceptable,
    canonicalFormula: buildResult.canonicalFormula,
    explanation: buildResult.explanation,
    countermodelHint: buildResult.countermodelHint,
  };
}

function makeId(template: ExerciseTemplate, rng: SeededRng): string {
  const suffix = Math.floor(rng.next() * 1e8)
    .toString(36)
    .padStart(6, '0');
  return `${template.id}-${suffix}`;
}

export function generateExercise(
  level: ExerciseLevel,
  profile: ProfileName,
  kind: ExerciseKind,
  options: GenerateOptions = {},
): Exercise {
  const seed = options.seed ?? autoSeed();
  const rng = new SeededRng(seed);

  let candidates: ExerciseTemplate[];
  if (options.templateId) {
    const t = findTemplateById(options.templateId);
    if (!t) {
      throw new Error(`Template "${options.templateId}" no encontrada`);
    }
    if (!t.profiles.includes(profile)) {
      throw new Error(`Template "${options.templateId}" no soporta el perfil "${profile}"`);
    }
    if (t.kind !== kind) {
      throw new Error(`Template "${options.templateId}" es de tipo "${t.kind}", no "${kind}"`);
    }
    if (t.level !== level) {
      throw new Error(`Template "${options.templateId}" es de nivel ${t.level}, no ${level}`);
    }
    candidates = [t];
  } else {
    candidates = findTemplatesFor(level, profile, kind);
  }

  if (candidates.length === 0) {
    throw new Error(`No hay plantillas para level=${level}, profile=${profile}, kind=${kind}`);
  }

  const template = rng.pick(candidates);
  const vars = pickVars(rng, Math.max(template.minVars, 2));
  const build = template.build({ vars, rng });

  return {
    id: makeId(template, rng),
    level,
    profile,
    kind,
    prompt: build.prompt,
    formula: build.formula,
    premises: build.premises,
    goal: build.goal,
    hints: build.hints,
    solution: makeSolution(template, build),
  };
}

const KIND_PROGRESSION_BY_LEVEL: Record<ExerciseLevel, ExerciseKind[]> = {
  1: ['validity', 'satisfiability', 'translate'],
  2: ['derive', 'countermodel', 'validity'],
  3: ['validity', 'derive'],
  4: ['validity', 'derive'],
};

export function generateLessonPath(
  profile: ProfileName,
  targetLevel: ExerciseLevel,
  options: GenerateOptions = {},
): Exercise[] {
  const seed = options.seed ?? autoSeed();
  const rng = new SeededRng(seed);
  const path: Exercise[] = [];

  for (let lvl = 1; lvl <= targetLevel; lvl++) {
    const level = lvl as ExerciseLevel;
    const kinds = KIND_PROGRESSION_BY_LEVEL[level];
    for (const kind of kinds) {
      const candidates = findTemplatesFor(level, profile, kind);
      if (candidates.length === 0) continue;
      const subSeed = Math.floor(rng.next() * 0xffffffff) | 0;
      try {
        const ex = generateExercise(level, profile, kind, { seed: subSeed });
        path.push(ex);
      } catch {
        // skip kinds que el perfil no soporta
      }
    }
  }

  if (path.length === 0) {
    throw new Error(
      `No se pudo generar un lesson path para profile=${profile}, targetLevel=${targetLevel}`,
    );
  }
  return path;
}
