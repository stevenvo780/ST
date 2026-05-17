// ============================================================
// ST CSP — barrel público.
// ============================================================
// API:
//   ac3(csp)                      → { consistent, reducedDomains }
//   backtrack(csp, opts?)         → CSPResult  (primera solución)
//   allSolutions(csp, max?, opts?) → Map[]     (enumeración)
//   graphColoring(graph, k)       → Map<nodo, color> | null
//   nQueens(n)                    → number[] | null
// ============================================================

export type { CSP, CSPResult, Constraint, BacktrackOptions } from './types';
export { ac3, ac3InPlace } from './ac3';
export { backtrack, allSolutions } from './backtrack';
export { graphColoring, nQueens } from './builtins';
