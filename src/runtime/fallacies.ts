// ============================================================
// ST Runtime — Detector de Falacias Lógicas
// ============================================================
// Analiza un argumento (premisas + conclusión) buscando
// patrones conocidos de falacias formales.
// Diseñado para educación en humanidades.
// ============================================================

import { Formula } from '../types';
import { LogicProfile } from '../profiles/interface';
import { formulaToUnicode } from './format';

/** Información sobre una falacia detectada. */
export interface FallacyInfo {
  /** Nombre de la falacia (español). */
  name: string;
  /** Descripción pedagógica breve. */
  description: string;
  /** Patrón lógico asociado (notación Unicode). */
  pattern: string;
}

// ── Helpers internos ──────────────────────────────────────────

function isImplies(f: Formula): f is Formula & { kind: 'implies' } {
  return f.kind === 'implies';
}

function isNot(f: Formula): f is Formula & { kind: 'not' } {
  return f.kind === 'not';
}

function isAnd(f: Formula): f is Formula & { kind: 'and' } {
  return f.kind === 'and';
}

/** Compara dos fórmulas estructuralmente (igualdad profunda). */
function formulaEquals(a: Formula, b: Formula): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'atom' && b.kind === 'atom') return a.name === b.name;
  if (a.kind === 'predicate' && b.kind === 'predicate') {
    const ap = a.params ?? [];
    const bp = b.params ?? [];
    return a.name === b.name && ap.length === bp.length && ap.every((p, i) => p === bp[i]);
  }
  if ((a.kind === 'forall' || a.kind === 'exists') && a.variable !== b.variable) {
    return false;
  }
  const aArgs = a.args ?? [];
  const bArgs = b.args ?? [];
  if (aArgs.length !== bArgs.length) return false;
  return aArgs.every((arg, i) => formulaEquals(arg, bArgs[i]));
}

/** Busca en las premisas una fórmula que satisfaga un predicado. */
function findPremise(premises: Formula[], pred: (f: Formula) => boolean): Formula | undefined {
  return premises.find(pred);
}

// ── Detectores individuales ───────────────────────────────────

/**
 * Afirmación del consecuente: (P → Q), Q ⊢ P
 * Error: del hecho de que Q sea verdadero no se sigue P.
 */
function checkAffirmingConsequent(premises: Formula[], conclusion: Formula): FallacyInfo | null {
  for (const p of premises) {
    if (!isImplies(p) || !p.args?.[0] || !p.args?.[1]) continue;
    const antecedent = p.args[0];
    const consequent = p.args[1];
    if (!formulaEquals(conclusion, antecedent)) continue;
    const affirmed = findPremise(premises, (f) => f !== p && formulaEquals(f, consequent));
    if (affirmed) {
      return {
        name: 'Afirmación del consecuente',
        description:
          'De «si P entonces Q» y «Q» no se puede concluir «P». ' +
          'El consecuente puede ser verdadero por otras razones.',
        pattern:
          `(${formulaToUnicode(antecedent)} → ${formulaToUnicode(consequent)}), ` +
          `${formulaToUnicode(consequent)} ⊬ ${formulaToUnicode(antecedent)}`,
      };
    }
  }
  return null;
}

/**
 * Negación del antecedente: (P → Q), ¬P ⊢ ¬Q
 * Error: negar P no implica negar Q.
 */
function checkDenyingAntecedent(premises: Formula[], conclusion: Formula): FallacyInfo | null {
  if (!isNot(conclusion) || !conclusion.args?.[0]) return null;
  const negatedConclusion = conclusion.args[0];

  for (const p of premises) {
    if (!isImplies(p) || !p.args?.[0] || !p.args?.[1]) continue;
    const antecedent = p.args[0];
    const consequent = p.args[1];
    if (!formulaEquals(negatedConclusion, consequent)) continue;
    const denied = findPremise(premises, (f) => {
      if (!isNot(f) || !f.args?.[0]) return false;
      return formulaEquals(f.args[0], antecedent);
    });
    if (denied) {
      return {
        name: 'Negación del antecedente',
        description:
          'De «si P entonces Q» y «no P» no se puede concluir «no Q». ' +
          'Q puede ser verdadero por otras causas.',
        pattern:
          `(${formulaToUnicode(antecedent)} → ${formulaToUnicode(consequent)}), ` +
          `¬${formulaToUnicode(antecedent)} ⊬ ¬${formulaToUnicode(consequent)}`,
      };
    }
  }
  return null;
}

/**
 * Medio no distribuido (silogismo categórico inválido).
 * Busca dos condicionales P→M y S→M con conclusión S→P.
 */
function checkUndistributedMiddle(premises: Formula[], conclusion: Formula): FallacyInfo | null {
  if (!isImplies(conclusion) || !conclusion.args?.[0] || !conclusion.args?.[1]) return null;
  const cAntecedent = conclusion.args[0]; // S
  const cConsequent = conclusion.args[1]; // P

  for (let i = 0; i < premises.length; i++) {
    const pi = premises[i];
    if (!isImplies(pi) || !pi.args?.[0] || !pi.args?.[1]) continue;
    for (let j = 0; j < premises.length; j++) {
      if (i === j) continue;
      const pj = premises[j];
      if (!isImplies(pj) || !pj.args?.[0] || !pj.args?.[1]) continue;
      const piCons = pi.args[1]; // M₁
      const pjCons = pj.args[1]; // M₂
      if (!formulaEquals(piCons, pjCons)) continue;
      if (formulaEquals(pj.args[0], cAntecedent) && formulaEquals(pi.args[0], cConsequent)) {
        const m = formulaToUnicode(piCons);
        return {
          name: 'Medio no distribuido',
          description:
            'El término medio aparece como consecuente en ambas premisas ' +
            'y nunca se distribuye. No se puede concluir una relación entre sujeto y predicado.',
          pattern:
            `(${formulaToUnicode(pi.args[0])} → ${m}), ` +
            `(${formulaToUnicode(pj.args[0])} → ${m}) ⊬ ` +
            `(${formulaToUnicode(cAntecedent)} → ${formulaToUnicode(cConsequent)})`,
        };
      }
    }
  }
  return null;
}

/**
 * Falacia de composición:
 * cada parte tiene propiedad P ⊢ el todo tiene propiedad P
 * Detecta: conclusión (A∧B)→C donde premisas contienen A→C y B→C.
 */
function checkCompositionFallacy(premises: Formula[], conclusion: Formula): FallacyInfo | null {
  if (!isImplies(conclusion) || !conclusion.args?.[0] || !conclusion.args?.[1]) return null;
  const ant = conclusion.args[0];
  if (!isAnd(ant) || !ant.args?.[0] || !ant.args?.[1]) return null;
  const left = ant.args[0];
  const right = ant.args[1];
  const cons = conclusion.args[1];

  const hasLeft = findPremise(premises, (f) => {
    if (!isImplies(f) || !f.args?.[0] || !f.args?.[1]) return false;
    return formulaEquals(f.args[0], left) && formulaEquals(f.args[1], cons);
  });
  const hasRight = findPremise(premises, (f) => {
    if (!isImplies(f) || !f.args?.[0] || !f.args?.[1]) return false;
    return formulaEquals(f.args[0], right) && formulaEquals(f.args[1], cons);
  });

  if (hasLeft && hasRight) {
    const l = formulaToUnicode(left);
    const r = formulaToUnicode(right);
    const c = formulaToUnicode(cons);
    return {
      name: 'Falacia de composición',
      description:
        'Que cada parte tenga una propiedad no implica que el todo la tenga. ' +
        'Las propiedades de las partes no siempre se transfieren al conjunto.',
      pattern: `(${l} → ${c}), (${r} → ${c}) ⊬ ((${l} ∧ ${r}) → ${c})`,
    };
  }
  return null;
}

/**
 * Falso dilema: silogismo disyuntivo con disyunción no justificada.
 * (P ∨ Q), ¬P ⊢ Q  —  formalmente válido, pero advierte al estudiante.
 */
function checkFalseDisjunction(premises: Formula[], conclusion: Formula): FallacyInfo | null {
  for (const p of premises) {
    if (p.kind !== 'or' || !p.args?.[0] || !p.args?.[1]) continue;
    const left = p.args[0];
    const right = p.args[1];
    if (!formulaEquals(conclusion, right)) continue;
    const denied = findPremise(premises, (f) => {
      if (!isNot(f) || !f.args?.[0]) return false;
      return formulaEquals(f.args[0], left);
    });
    if (denied) {
      const l = formulaToUnicode(left);
      const r = formulaToUnicode(right);
      return {
        name: 'Posible falso dilema',
        description:
          'El silogismo disyuntivo (P∨Q, ¬P ⊢ Q) es válido formalmente, ' +
          'pero verifique que la disyunción sea genuinamente exhaustiva. ' +
          'Si existen otras alternativas, se trata de un falso dilema.',
        pattern: `(${l} ∨ ${r}), ¬${l} → ¿realmente solo ${r}?`,
      };
    }
  }
  return null;
}

// ── API pública ───────────────────────────────────────────────

type FallacyChecker = (p: Formula[], c: Formula, prof: LogicProfile) => FallacyInfo | null;

/** Lista de todos los checks registrados. */
const FALLACY_CHECKERS: FallacyChecker[] = [
  (p, c, _prof) => checkAffirmingConsequent(p, c),
  (p, c, _prof) => checkDenyingAntecedent(p, c),
  (p, c, _prof) => checkUndistributedMiddle(p, c),
  (p, c, _prof) => checkCompositionFallacy(p, c),
  (p, c, _prof) => checkFalseDisjunction(p, c),
];

/**
 * Ejecuta todos los detectores de falacias sobre un argumento.
 *
 * @param premises  Lista de fórmulas-premisa.
 * @param conclusion Fórmula-conclusión.
 * @param profile   Perfil lógico activo (para contexto futuro).
 * @returns Lista de falacias detectadas (vacía si el argumento parece correcto).
 */
export function detectFallacies(
  premises: Formula[],
  conclusion: Formula,
  profile: LogicProfile,
): FallacyInfo[] {
  const results: FallacyInfo[] = [];
  for (const checker of FALLACY_CHECKERS) {
    const result = checker(premises, conclusion, profile);
    if (result) results.push(result);
  }
  return results;
}
