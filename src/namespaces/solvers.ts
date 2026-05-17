/**
 * Namespace: Solvers
 *
 * Solvers de decisión combinatoria: SAT (CDCL v1/v2 + incremental),
 * SMT bridge, CSP (AC-3 + backtracking + builtins), MUS (minimal
 * unsat subsets), pool de evaluación paralela.
 *
 * Importa así:
 *   import { Solvers } from '@stevenvo780/st-lang';
 *   const r = Solvers.cdclV2.solveCDCLv2(cnf);
 *   const mus = Solvers.mus.extractMUS(clauses);
 */

import * as cdclV2 from '../solver/cdcl-v2';
import * as cdclV2Incremental from '../solver/cdcl-v2-incremental';
import * as csp from '../runtime/csp';
import * as mus from '../runtime/mus';
import * as smt from '../runtime/smt';
import * as parallel from '../runtime/parallel';

export { cdclV2, cdclV2Incremental, csp, mus, smt, parallel };

// Conveniencia: símbolos populares re-expuestos en raíz del namespace.
export { solveCDCLv2 } from '../solver/cdcl-v2';
export { IncrementalCDCL } from '../solver/cdcl-v2-incremental';
