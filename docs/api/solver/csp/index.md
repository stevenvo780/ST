# `solver/csp/index.ts`

============================================================ ST CSP — barrel público. ============================================================ API:   ac3(csp)                      → { consistent, reducedDomains }   backtrack(csp, opts?)         → CSPResult  (primera solución)   allSolutions(csp, max?, opts?) → Map[]     (enumeración)   graphColoring(graph, k)       → Map<nodo, color> | null   nQueens(n)                    → number[] | null ============================================================
