// ============================================================
// TPTP — Bridge a fol-prover
// ============================================================
//
// Convierte una TptpFormula al tipo `Formula` que entiende
// `src/fol-prover` (y por extensión los demás solvers FOL del repo).
//
// Mapeo:
//   atom p(t1,...,tn) → kind:'predicate', name:'p', params:[term-strings]
//   atom prop (sin args) → kind:'atom', name:prop
//   eq a b → kind:'equals', args:[a, b]  (consumido por fol-prover-equality)
//   neq a b → kind:'not', args:[ eq a b ]
//   ~F → kind:'not', args:[F]
//   F & G → kind:'and', args:[F,G]
//   F | G → kind:'or', args:[F,G]
//   F => G → kind:'implies', args:[F,G]
//   F <=> G → kind:'biconditional', args:[F,G]
//   F <~> G → ~(F <=> G)
//   ![X,Y]:F → forall X. forall Y. F
//   ?[X,Y]:F → exists X. exists Y. F
//   $true / $false → kind:'true' / kind:'false'
//
// `params`/`terms` en Formula es `string[]`; los términos no-variables
// (constantes/funciones) se serializan como string usando una convención
// estable: `f(a,b)`, `c`, `X`.

import { Formula } from '../types';
import { TptpAnnotated, TptpFormula, TptpProblem, TptpTerm } from './ast';

function termToString(t: TptpTerm): string {
  if (t.kind === 'var' || t.kind === 'const') return t.name;
  if (t.args.length === 0) return t.name;
  return `${t.name}(${t.args.map(termToString).join(',')})`;
}

export function tptpFormulaToFol(f: TptpFormula): Formula {
  switch (f.kind) {
    case 'true':
      return { kind: 'true' };
    case 'false':
      return { kind: 'false' };
    case 'atom': {
      if (f.args.length === 0) {
        return { kind: 'atom', name: f.predicate };
      }
      const params = f.args.map(termToString);
      return { kind: 'predicate', name: f.predicate, params, terms: params };
    }
    case 'eq': {
      const left = makeTermFormula(f.left);
      const right = makeTermFormula(f.right);
      return { kind: 'equals', args: [left, right] };
    }
    case 'neq': {
      const left = makeTermFormula(f.left);
      const right = makeTermFormula(f.right);
      return { kind: 'not', args: [{ kind: 'equals', args: [left, right] }] };
    }
    case 'not':
      return { kind: 'not', args: [tptpFormulaToFol(f.arg)] };
    case 'and':
      return { kind: 'and', args: f.args.map(tptpFormulaToFol) };
    case 'or':
      return { kind: 'or', args: f.args.map(tptpFormulaToFol) };
    case 'implies':
      return {
        kind: 'implies',
        args: [tptpFormulaToFol(f.left), tptpFormulaToFol(f.right)],
      };
    case 'iff':
      return {
        kind: 'biconditional',
        args: [tptpFormulaToFol(f.left), tptpFormulaToFol(f.right)],
      };
    case 'xor': {
      // p <~> q  ≡  ~(p <=> q)
      const inner: Formula = {
        kind: 'biconditional',
        args: [tptpFormulaToFol(f.left), tptpFormulaToFol(f.right)],
      };
      return { kind: 'not', args: [inner] };
    }
    case 'forall':
      return wrapQuantifier('forall', f.vars, tptpFormulaToFol(f.body));
    case 'exists':
      return wrapQuantifier('exists', f.vars, tptpFormulaToFol(f.body));
  }
}

function wrapQuantifier(kind: 'forall' | 'exists', vars: string[], inner: Formula): Formula {
  let f: Formula = inner;
  for (let i = vars.length - 1; i >= 0; i--) {
    const v = vars[i];
    if (v === undefined) continue;
    f = { kind, variable: v, args: [f] };
  }
  return f;
}

// Para `equals`, el solver fol-prover-equality espera "args" que sean
// fórmulas representando términos. Convención: serializamos el término
// como atom con `name` = term-string.
function makeTermFormula(t: TptpTerm): Formula {
  return { kind: 'atom', name: termToString(t) };
}

export interface FolProverBridgeOutput {
  axioms: Formula[];
  conjecture: Formula | null;
  negatedConjectures: Formula[];
  /** Otros anotados (lemmas, theorems, definitions, plain, hypothesis). */
  hypotheses: Formula[];
}

export function toFolProverFormat(problem: TptpProblem): FolProverBridgeOutput {
  const axioms: Formula[] = [];
  const negatedConjectures: Formula[] = [];
  const hypotheses: Formula[] = [];
  let conjecture: Formula | null = null;

  for (const a of problem.annotated) {
    const fol = tptpFormulaToFol(a.formula);
    switch (a.role) {
      case 'axiom':
        axioms.push(fol);
        break;
      case 'conjecture':
        // Si hay varias conjectures, conservamos la primera; las demás
        // pasan como hypotheses (caso poco común en problemas reales).
        if (conjecture === null) {
          conjecture = fol;
        } else {
          hypotheses.push(fol);
        }
        break;
      case 'negated_conjecture':
        negatedConjectures.push(fol);
        break;
      case 'lemma':
      case 'theorem':
      case 'hypothesis':
      case 'definition':
      case 'plain':
        hypotheses.push(fol);
        break;
    }
  }

  return { axioms, conjecture, negatedConjectures, hypotheses };
}

/** Helper para `TptpAnnotated` individual. */
export function annotatedToFol(a: TptpAnnotated): Formula {
  return tptpFormulaToFol(a.formula);
}
