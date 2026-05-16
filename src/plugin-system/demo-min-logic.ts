import { Formula } from '../types';
import { PluginCheckResult, ProfilePlugin } from './types';

const TRUE_VAL = 1;
const UNKNOWN_VAL = 0.5;
const FALSE_VAL = 0;

function toScalar(value: unknown): number {
  if (typeof value === 'number') {
    if (value === TRUE_VAL || value === UNKNOWN_VAL || value === FALSE_VAL) return value;
    return UNKNOWN_VAL;
  }
  if (value === true) return TRUE_VAL;
  if (value === false) return FALSE_VAL;
  return UNKNOWN_VAL;
}

function evaluateMin(formula: Formula, env: Record<string, unknown>): number {
  switch (formula.kind) {
    case 'true':
      return TRUE_VAL;
    case 'false':
      return FALSE_VAL;
    case 'atom': {
      const name = formula.name ?? '';
      if (!(name in env)) return UNKNOWN_VAL;
      return toScalar(env[name]);
    }
    case 'not': {
      const inner = formula.args?.[0];
      if (!inner) return UNKNOWN_VAL;
      return TRUE_VAL - evaluateMin(inner, env);
    }
    case 'and': {
      const args = formula.args ?? [];
      if (args.length === 0) return TRUE_VAL;
      let acc = TRUE_VAL;
      for (const arg of args) {
        acc = Math.min(acc, evaluateMin(arg, env));
      }
      return acc;
    }
    case 'or': {
      const args = formula.args ?? [];
      if (args.length === 0) return FALSE_VAL;
      let acc = FALSE_VAL;
      for (const arg of args) {
        acc = Math.max(acc, evaluateMin(arg, env));
      }
      return acc;
    }
    case 'implies': {
      const left = formula.args?.[0];
      const right = formula.args?.[1];
      if (!left || !right) return UNKNOWN_VAL;
      const lv = evaluateMin(left, env);
      const rv = evaluateMin(right, env);
      return Math.max(TRUE_VAL - lv, rv);
    }
    default:
      return UNKNOWN_VAL;
  }
}

function collectAtoms(formula: Formula, out: Set<string>): void {
  if (formula.kind === 'atom' && formula.name) {
    out.add(formula.name);
    return;
  }
  for (const arg of formula.args ?? []) {
    collectAtoms(arg, out);
  }
}

function checkValidMin(formula: Formula): PluginCheckResult {
  const atoms = new Set<string>();
  collectAtoms(formula, atoms);
  const atomList = Array.from(atoms);
  const total = Math.pow(3, atomList.length);
  const values = [FALSE_VAL, UNKNOWN_VAL, TRUE_VAL];

  for (let i = 0; i < total; i++) {
    const env: Record<string, number> = {};
    let n = i;
    for (const atom of atomList) {
      const idx = n % 3;
      const slot = values[idx];
      env[atom] = slot === undefined ? UNKNOWN_VAL : slot;
      n = Math.floor(n / 3);
    }
    const v = evaluateMin(formula, env);
    if (v < TRUE_VAL) {
      return {
        valid: false,
        result: `contraejemplo en ${JSON.stringify(env)} → ${v}`,
      };
    }
  }
  return { valid: true, result: 'válido en lógica min (3-valores)' };
}

export const minLogicPlugin: ProfilePlugin = {
  name: 'min',
  description: 'Lógica de 3 valores (false=0, unknown=0.5, true=1) donde ∧ es min y ∨ es max',
  version: '1.0.0',
  evaluate(formula, env) {
    return evaluateMin(formula, env);
  },
  checkValid(formula) {
    return checkValidMin(formula);
  },
  supportedOperators: new Set(['and', 'or', 'not', 'implies', 'true', 'false', 'atom']),
};
