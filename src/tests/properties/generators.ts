// ============================================================
// Property-based testing — Generators compartidos
// ============================================================
//
// Generadores de fast-check para ASTs y estructuras que se
// usan en múltiples properties. Centralizamos acá para que
// los tests individuales se mantengan compactos.

import * as fc from 'fast-check';
import type { Formula } from '../../types';
import type { HOTerm } from '../../proof-systems/higher-order-unify';
import type { Term as LamTerm } from '../../type-theory/lambda-calc/types';
import type { Term as TRSTerm, RewriteRule } from '../../runtime/term-rewriting/types';
import type { Term as AUTerm } from '../../runtime/anti-unification/types';
import type { FType, FTerm } from '../../type-theory/system-f/types';
import type { MLTTTerm } from '../../type-theory/mltt/types';
import type { Expr } from '../../runtime/symbolic-diff/types';
import type { LTS } from '../../runtime/bisimulation/types';

// ============================================================
// Identifiers / símbolos
// ============================================================

export const atomName = (): fc.Arbitrary<string> =>
  fc.constantFrom('p', 'q', 'r', 's', 't', 'a', 'b', 'c');

export const varName = (): fc.Arbitrary<string> =>
  fc.constantFrom('x', 'y', 'z', 'u', 'v', 'w');

export const funcName = (): fc.Arbitrary<string> =>
  fc.constantFrom('f', 'g', 'h', 'k');

export const constName = (): fc.Arbitrary<string> =>
  fc.constantFrom('A', 'B', 'C', 'D', 'E');

// ============================================================
// Fórmulas proposicionales clásicas (AST de `types.ts`)
// ============================================================

const propAtom = (): fc.Arbitrary<Formula> =>
  atomName().map((name) => ({ kind: 'atom', name }) as Formula);

export const propFormula = (maxDepth = 3): fc.Arbitrary<Formula> => {
  const { formula } = fc.letrec((tie) => ({
    formula: fc.oneof(
      { maxDepth, depthIdentifier: 'prop' },
      propAtom(),
      tie('formula').map((arg) => ({ kind: 'not', args: [arg as Formula] }) as Formula),
      fc.tuple(tie('formula'), tie('formula')).map(
        ([l, r]) => ({ kind: 'and', args: [l as Formula, r as Formula] }) as Formula,
      ),
      fc.tuple(tie('formula'), tie('formula')).map(
        ([l, r]) => ({ kind: 'or', args: [l as Formula, r as Formula] }) as Formula,
      ),
      fc.tuple(tie('formula'), tie('formula')).map(
        ([l, r]) => ({ kind: 'implies', args: [l as Formula, r as Formula] }) as Formula,
      ),
    ),
  }));
  return formula as fc.Arbitrary<Formula>;
};

// ============================================================
// Cláusulas DIMACS (3-SAT random)
// ============================================================

/**
 * Genera una instancia 3-SAT pequeña: numVars en [3, maxVars],
 * y cantidad de cláusulas hasta `ratio * numVars`. Cada cláusula
 * tiene 3 literales (con repetición permitida pero forzando que
 * ningún literal y su negación coexistan en la misma cláusula —
 * evitamos cláusulas trivialmente true por tautología).
 */
export const dimacs3SAT = (maxVars = 8, maxRatio = 4): fc.Arbitrary<{
  clauses: Int32Array[];
  numVars: number;
}> =>
  fc
    .integer({ min: 3, max: maxVars })
    .chain((numVars) =>
      fc
        .integer({ min: 1, max: Math.max(1, Math.floor(maxRatio * numVars)) })
        .chain((numClauses) =>
          fc
            .array(
              fc
                .tuple(
                  fc.integer({ min: 1, max: numVars }),
                  fc.boolean(),
                  fc.integer({ min: 1, max: numVars }),
                  fc.boolean(),
                  fc.integer({ min: 1, max: numVars }),
                  fc.boolean(),
                )
                .map(([v1, s1, v2, s2, v3, s3]) => {
                  const l1 = s1 ? v1 : -v1;
                  const l2 = s2 ? v2 : -v2;
                  const l3 = s3 ? v3 : -v3;
                  // Evitar literal+su-negación en misma cláusula (tautología).
                  // Si ocurre, forzamos la misma polaridad.
                  const lits = [l1, l2, l3];
                  return new Int32Array(lits);
                }),
              { minLength: numClauses, maxLength: numClauses },
            )
            .map((clauses) => ({ clauses, numVars })),
        ),
    );

// ============================================================
// Términos de primer orden para anti-unification / TRS
// ============================================================

/** Term del módulo anti-unification (admite `const`). */
export const auTerm = (maxDepth = 3): fc.Arbitrary<AUTerm> => {
  const { term } = fc.letrec((tie) => ({
    term: fc.oneof(
      { maxDepth, depthIdentifier: 'au' },
      varName().map((name) => ({ kind: 'var', name }) as AUTerm),
      constName().map((name) => ({ kind: 'const', name }) as AUTerm),
      fc
        .tuple(funcName(), fc.array(tie('term'), { minLength: 1, maxLength: 3 }))
        .map(
          ([name, args]) =>
            ({ kind: 'func', name, args: args as AUTerm[] }) as AUTerm,
        ),
    ),
  }));
  return term as fc.Arbitrary<AUTerm>;
};

/** Term del módulo term-rewriting (sin `const`; usa `func` con []). */
export const trsTerm = (maxDepth = 3): fc.Arbitrary<TRSTerm> => {
  const { term } = fc.letrec((tie) => ({
    term: fc.oneof(
      { maxDepth, depthIdentifier: 'trs' },
      varName().map((name) => ({ kind: 'var', name }) as TRSTerm),
      constName().map((name) => ({ kind: 'func', name, args: [] }) as TRSTerm),
      fc
        .tuple(funcName(), fc.array(tie('term'), { minLength: 1, maxLength: 3 }))
        .map(
          ([name, args]) =>
            ({ kind: 'func', name, args: args as TRSTerm[] }) as TRSTerm,
        ),
    ),
  }));
  return term as fc.Arbitrary<TRSTerm>;
};

/** Term sin variables (closed) — útil para que las reglas TRS produzcan
 *  reductos completos. */
export const trsClosedTerm = (maxDepth = 3): fc.Arbitrary<TRSTerm> => {
  const { term } = fc.letrec((tie) => ({
    term: fc.oneof(
      { maxDepth, depthIdentifier: 'trsC' },
      constName().map((name) => ({ kind: 'func', name, args: [] }) as TRSTerm),
      fc
        .tuple(funcName(), fc.array(tie('term'), { minLength: 1, maxLength: 2 }))
        .map(
          ([name, args]) =>
            ({ kind: 'func', name, args: args as TRSTerm[] }) as TRSTerm,
        ),
    ),
  }));
  return term as fc.Arbitrary<TRSTerm>;
};

// ============================================================
// HO Terms (Miller patterns)
// ============================================================

const metaName = (): fc.Arbitrary<string> =>
  fc.constantFrom('M', 'N', 'P', 'Q');

/**
 * Genera un término HO de la "forma patrón" (Miller): meta-vars
 * aparecen aplicadas únicamente a variables ligadas distintas.
 * Construye términos del tipo λx.λy. M x y, var x, etc.
 */
export const hoPatternTerm = (maxDepth = 3): fc.Arbitrary<HOTerm> => {
  // Generamos un λ-spine con boundVars distintos, luego el cuerpo:
  // variables ligadas o meta aplicada a un subconjunto de boundVars.
  return fc
    .uniqueArray(varName(), { minLength: 0, maxLength: 3 })
    .chain((bvs) => {
      const bodyArb: fc.Arbitrary<HOTerm> = fc.oneof(
        // var libre o ligada
        varName().map((n) => ({ kind: 'var', name: n }) as HOTerm),
        // var ligada del scope (si hay)
        ...(bvs.length > 0
          ? [
              fc
                .constantFrom(...bvs)
                .map((n) => ({ kind: 'var', name: n }) as HOTerm),
            ]
          : []),
        // meta aplicada a vars ligadas distintas
        ...(bvs.length > 0
          ? [
              fc.tuple(
                metaName(),
                fc
                  .shuffledSubarray(bvs, { minLength: 1, maxLength: bvs.length })
                  .map((sub) =>
                    sub.map((n) => ({ kind: 'var', name: n }) as HOTerm),
                  ),
              ).map(
                ([m, args]) =>
                  ({
                    kind: 'app',
                    fn: { kind: 'meta', name: m },
                    args: args as HOTerm[],
                  }) as HOTerm,
              ),
            ]
          : [metaName().map((m) => ({ kind: 'meta', name: m }) as HOTerm)]),
      );
      // Envolvemos en λ-spine.
      return bodyArb.map((body) => {
        let t: HOTerm = body;
        for (let i = bvs.length - 1; i >= 0; i--) {
          t = { kind: 'abs', param: bvs[i]!, body: t };
        }
        return t;
      });
    });
};

// ============================================================
// Lambda calc untyped term
// ============================================================

export const lamTerm = (maxDepth = 3): fc.Arbitrary<LamTerm> => {
  const { term } = fc.letrec((tie) => ({
    term: fc.oneof(
      { maxDepth, depthIdentifier: 'lam' },
      varName().map((n) => ({ kind: 'var', name: n }) as LamTerm),
      fc
        .tuple(varName(), tie('term'))
        .map(
          ([param, body]) =>
            ({ kind: 'abs', param, body: body as LamTerm }) as LamTerm,
        ),
      fc
        .tuple(tie('term'), tie('term'))
        .map(
          ([fn, arg]) =>
            ({ kind: 'app', fn: fn as LamTerm, arg: arg as LamTerm }) as LamTerm,
        ),
    ),
  }));
  return term as fc.Arbitrary<LamTerm>;
};

// ============================================================
// System F well-typed terms (sub-fragmento controlado)
// ============================================================

// Generamos λ²-terms cerrados, simplemente tipados, sin ∀.
// Foco: identidad, aplicación, abstracción anidada.
export const fTermSimple = (): fc.Arbitrary<{
  term: FTerm;
  type: FType;
}> => {
  // Generamos un tipo simple A → A o A → (A → A).
  const atomType: fc.Arbitrary<FType> = fc.constantFrom(
    { kind: 'atom', name: 'A' },
    { kind: 'atom', name: 'B' },
  );
  const arrowType: fc.Arbitrary<FType> = fc
    .tuple(atomType, atomType)
    .map(([from, to]) => ({ kind: 'arrow', from, to }) as FType);

  // Genera la identidad λx:T. x para T en {A, B, A→A, A→B}.
  return fc.oneof(atomType, arrowType).chain((t) => {
    const idTerm: FTerm = {
      kind: 'abs',
      param: 'x',
      paramType: t,
      body: { kind: 'var', name: 'x' },
    };
    return fc.constant({
      term: idTerm,
      type: { kind: 'arrow', from: t, to: t } as FType,
    });
  });
};

// ============================================================
// MLTT well-typed terms básicos
// ============================================================

export const mlttSimpleTerm = (): fc.Arbitrary<MLTTTerm> =>
  fc.oneof(
    fc.constant({ kind: 'zero' } as MLTTTerm),
    fc.constant({ kind: 'nat' } as MLTTTerm),
    fc.integer({ min: 0, max: 5 }).map((n) => {
      let t: MLTTTerm = { kind: 'zero' };
      for (let i = 0; i < n; i++) t = { kind: 'succ', arg: t };
      return t;
    }),
    fc.integer({ min: 0, max: 3 }).map((lvl) => ({ kind: 'universe', level: lvl }) as MLTTTerm),
  );

// ============================================================
// Symbolic-diff expressions
// ============================================================

export const symExpr = (maxDepth = 3): fc.Arbitrary<Expr> => {
  const { expr } = fc.letrec((tie) => ({
    expr: fc.oneof(
      { maxDepth, depthIdentifier: 'sym' },
      fc
        .integer({ min: -5, max: 5 })
        .map((v) => ({ kind: 'const', value: v }) as Expr),
      fc.constantFrom('x', 'y').map((name) => ({ kind: 'var', name }) as Expr),
      fc
        .tuple(tie('expr'), tie('expr'))
        .map(
          ([a, b]) =>
            ({ kind: 'add', args: [a as Expr, b as Expr] }) as Expr,
        ),
      fc
        .tuple(tie('expr'), tie('expr'))
        .map(
          ([a, b]) =>
            ({ kind: 'mul', args: [a as Expr, b as Expr] }) as Expr,
        ),
      fc
        .tuple(tie('expr'), tie('expr'))
        .map(
          ([l, r]) => ({ kind: 'sub', left: l as Expr, right: r as Expr }) as Expr,
        ),
      // Potencias enteras pequeñas para evitar números absurdos.
      fc
        .tuple(tie('expr'), fc.integer({ min: 0, max: 3 }))
        .map(
          ([base, n]) =>
            ({
              kind: 'pow',
              base: base as Expr,
              exp: { kind: 'const', value: n },
            }) as Expr,
        ),
    ),
  }));
  return expr as fc.Arbitrary<Expr>;
};

/** Versión "segura" (sin div ni log/exp con base inestable) — derivable
 *  numéricamente con diferencias finitas. */
export const symExprSafe = symExpr;

// ============================================================
// Bayesian networks (chain network mini)
// ============================================================

/** Genera una red bayesiana de cadena A → B → C con valores binarios. */
export const tinyBayesNet = (): fc.Arbitrary<{
  variables: Array<{ name: string; values: string[] }>;
  cpts: Array<{
    variable: string;
    parents: string[];
    entries: Record<string, Record<string, number>>;
  }>;
}> =>
  fc
    .tuple(
      fc.double({ min: 0.05, max: 0.95, noNaN: true }),
      fc.double({ min: 0.05, max: 0.95, noNaN: true }),
      fc.double({ min: 0.05, max: 0.95, noNaN: true }),
      fc.double({ min: 0.05, max: 0.95, noNaN: true }),
      fc.double({ min: 0.05, max: 0.95, noNaN: true }),
    )
    .map(([pA, pBT, pBF, pCT, pCF]) => {
      const variables = [
        { name: 'A', values: ['T', 'F'] },
        { name: 'B', values: ['T', 'F'] },
        { name: 'C', values: ['T', 'F'] },
      ];
      const cpts: Array<{
        variable: string;
        parents: string[];
        entries: Record<string, Record<string, number>>;
      }> = [
        {
          variable: 'A',
          parents: [],
          entries: { '': { T: pA, F: 1 - pA } },
        },
        {
          variable: 'B',
          parents: ['A'],
          entries: {
            'A=T': { T: pBT, F: 1 - pBT },
            'A=F': { T: pBF, F: 1 - pBF },
          },
        },
        {
          variable: 'C',
          parents: ['B'],
          entries: {
            'B=T': { T: pCT, F: 1 - pCT },
            'B=F': { T: pCF, F: 1 - pCF },
          },
        },
      ];
      return { variables, cpts };
    });

// ============================================================
// LTS pequeño (states + transitions etiquetados)
// ============================================================

export const tinyLTS = (): fc.Arbitrary<LTS> =>
  fc
    .integer({ min: 1, max: 5 })
    .chain((nStates) =>
      fc
        .array(
          fc
            .tuple(
              fc.integer({ min: 0, max: nStates - 1 }),
              fc.constantFrom('a', 'b', 'c', 'tau'),
              fc.integer({ min: 0, max: nStates - 1 }),
            )
            .map(([i, l, j]) => [`s${i}`, l, `s${j}`] as [string, string, string]),
          { minLength: 0, maxLength: 12 },
        )
        .map((transitions) => ({
          states: Array.from({ length: nStates }, (_, i) => `s${i}`),
          transitions,
        })),
    );

// ============================================================
// AGM belief revision: belief set inicial + fórmula
// ============================================================

const propAtomString = (): fc.Arbitrary<string> =>
  fc.constantFrom('p', 'q', 'r');

const propLiteral = (): fc.Arbitrary<string> =>
  fc.tuple(fc.boolean(), propAtomString()).map(([neg, a]) => (neg ? `!${a}` : a));

export const beliefSetAndFormula = (): fc.Arbitrary<{
  initial: string[];
  phi: string;
}> =>
  fc
    .tuple(
      fc.array(propLiteral(), { minLength: 0, maxLength: 3 }),
      propLiteral(),
    )
    .map(([initial, phi]) => ({ initial, phi }));

// ============================================================
// Argumentation framework pequeño
// ============================================================

export const tinyAF = (): fc.Arbitrary<{
  arguments: Set<string>;
  attacks: Array<[string, string]>;
}> =>
  fc
    .integer({ min: 1, max: 5 })
    .chain((n) => {
      const args = Array.from({ length: n }, (_, i) => `a${i}`);
      return fc
        .array(
          fc
            .tuple(fc.integer({ min: 0, max: n - 1 }), fc.integer({ min: 0, max: n - 1 }))
            .map(([i, j]) => [args[i]!, args[j]!] as [string, string]),
          { minLength: 0, maxLength: 8 },
        )
        .map((attacks) => ({ arguments: new Set(args), attacks }));
    });

// ============================================================
// Hyperreal random
// ============================================================

export const hyperrealArb = (): fc.Arbitrary<{ standard: number; infinitesimal: number }> =>
  fc.tuple(
    fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
  ).map(([s, i]) => ({ standard: s, infinitesimal: i }));

// ============================================================
// Refinement types (RefType random simple)
// ============================================================

import type { RefType } from '../../type-theory/refinement-types/types';

export const refTypeIntSimple = (): fc.Arbitrary<RefType> =>
  fc.oneof(
    fc.integer({ min: -20, max: 20 }).map(
      (k) =>
        ({
          base: 'Int' as const,
          binding: 'x',
          predicate: `x > ${k}`,
        }) as RefType,
    ),
    fc.integer({ min: -20, max: 20 }).map(
      (k) =>
        ({
          base: 'Int' as const,
          binding: 'x',
          predicate: `x >= ${k}`,
        }) as RefType,
    ),
    fc.constant({ base: 'Int' as const, binding: 'x', predicate: 'true' } as RefType),
  );

// ============================================================
// Re-export fast-check
// ============================================================

export { fc };
