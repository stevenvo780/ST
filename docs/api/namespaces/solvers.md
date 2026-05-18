# `namespaces/solvers.ts`

Namespace: Solvers

Solvers de decisión combinatoria: SAT (CDCL v1/v2 + incremental),
SMT bridge, CSP (AC-3 + backtracking + builtins), MUS (minimal
unsat subsets), pool de evaluación paralela.

Importa así:
  import { Solvers } from '@stevenvo780/st-lang';
  const r = Solvers.cdclV2.solveCDCLv2(cnf);
  const mus = Solvers.mus.extractMUS(clauses);
