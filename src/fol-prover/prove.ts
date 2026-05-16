import { Formula } from '../types';
import { toCNF } from './cnf';
import { runResolutionLoop } from './resolve';
import { FOLProveOptions, FOLProveResult } from './types';

const DEFAULT_TIMEOUT_MS = 2000;
const DEFAULT_MAX_STEPS = 5000;

export function proveFOL(
  premises: Formula[],
  goal: Formula,
  opts: FOLProveOptions = {},
): FOLProveResult {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxSteps = opts.maxSteps ?? DEFAULT_MAX_STEPS;

  const premiseClauses = premises.flatMap((p) => toCNF(p));
  const negatedGoal: Formula = { kind: 'not', args: [goal] };
  const negatedGoalClauses = toCNF(negatedGoal);

  if (
    premiseClauses.some((c) => c.length === 0) ||
    negatedGoalClauses.some((c) => c.length === 0)
  ) {
    return { proven: true, steps: [] };
  }

  const result = runResolutionLoop({
    premiseClauses,
    negatedGoalClauses,
    timeoutMs,
    maxSteps,
  });
  const out: FOLProveResult = {
    proven: result.proven,
    steps: result.steps,
  };
  if (result.timeoutHit) out.timeoutHit = true;
  if (result.reason) out.reason = result.reason;
  return out;
}
