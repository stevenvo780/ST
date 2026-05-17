// ============================================================
// ST π-calculus — barrel público.
// ============================================================
// API:
//   freeNames(p)                  → Set<string> de nombres libres
//   boundNames(p)                 → Set<string> de nombres ligados
//   alphaRename(p, oldN, newN)    → AST con α-renaming
//   substitute(p, x, v)           → p[x := v] capture-avoiding
//   reduce(p)                     → PiProcess[] sucesores (un paso →)
//   isDeadlocked(p)               → boolean
//   trace(p, maxSteps?)           → traza determinista
//   structuralCongruence(a, b)    → ≡
// ============================================================

export type { PiProcess } from './types';
export { freeNames, boundNames, alphaRename, freshName } from './names';
export { substitute } from './substitution';
export { reduce, isDeadlocked, trace } from './reduction';
export { structuralCongruence } from './congruence';
