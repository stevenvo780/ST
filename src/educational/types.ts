// ============================================================
// ST Educational — Tipos públicos del generador de ejercicios
// ============================================================

export type ExerciseLevel = 1 | 2 | 3 | 4;

export type ExerciseKind = 'satisfiability' | 'validity' | 'derive' | 'countermodel' | 'translate';

export type ProfileName =
  | 'classical.propositional'
  | 'classical.first_order'
  | 'intuitionistic.propositional'
  | 'paraconsistent.belnap'
  | 'modal.k'
  | 'epistemic.s5'
  | 'deontic.standard'
  | 'temporal.ltl'
  | 'aristotelian.syllogistic'
  | 'probabilistic.basic'
  | 'arithmetic';

export type SolutionKind =
  | 'valid'
  | 'invalid'
  | 'satisfiable'
  | 'unsatisfiable'
  | 'provable'
  | 'refutable'
  | 'translate';

export interface ExerciseSolution {
  kind: SolutionKind;
  expectedAnswer: string;
  acceptableAnswers: string[];
  canonicalFormula?: string;
  explanation: string;
  countermodelHint?: Record<string, boolean>;
}

export interface Exercise {
  id: string;
  level: ExerciseLevel;
  profile: ProfileName;
  kind: ExerciseKind;
  prompt: string;
  formula?: string;
  premises?: string[];
  goal?: string;
  hints: string[];
  solution: ExerciseSolution;
}

export interface AnswerResult {
  correct: boolean;
  score: number;
  feedback: string;
  nextHint?: string;
}

export interface GenerateOptions {
  seed?: number;
  templateId?: string;
}

export type StudentAnswer = string | StudentAnswerObject;

export interface StudentAnswerObject {
  answer?: string;
  valuation?: Record<string, boolean>;
  formula?: string;
  steps?: string[];
}

export type PublicExercise = Omit<Exercise, 'solution'>;

export function toPublicExercise(ex: Exercise): PublicExercise {
  return {
    id: ex.id,
    level: ex.level,
    profile: ex.profile,
    kind: ex.kind,
    prompt: ex.prompt,
    formula: ex.formula,
    premises: ex.premises,
    goal: ex.goal,
    hints: ex.hints,
  };
}
