// ============================================================
// ST Automata — Barrel
// ============================================================
//
// Teoría clásica de autómatas:
//
//   DFA (Deterministic Finite Automaton)
//     · dfaAccepts          simulación
//     · dfaMinimize         Hopcroft partition refinement
//     · dfaUnion/dfaIntersection/dfaComplement
//
//   NFA (con ε-transiciones)
//     · nfaAccepts          BFS sobre el frontier
//     · nfaToDfa            subset construction
//     · epsilonClosure
//
//   Regex
//     · parseRegex          gramática '|', concat, *, +, ?, (), \\esc
//     · regexToNfa          Thompson construction
//     · regexMatches        match exacto
//
//   PDA (push-down)
//     · pdaAccepts          BFS no determinista con memo
//     · pdaPalindromes      palíndromes sobre {a,b}
//     · pdaBalancedParens   paréntesis balanceados
//
//   Lenguajes estándar:
//     · dfaEvenZeros        {0,1}* con # de '0' par
//     · dfaContainsAB       {a,b,c}* que contienen "ab"
//     · regexEmail          regex simplificada de email
//
// Constantes:
//   · EPSILON = 'ε'
// ============================================================

export { EPSILON } from './types';
export type { DFA, NFA, PDA, PDATransition, Regex, Symbol } from './types';

export {
  dfaAccepts,
  dfaMinimize,
  dfaComplement,
  dfaProduct,
  dfaUnion,
  dfaIntersection,
  dfaTotalize,
} from './dfa';

export { nfaAccepts, nfaToDfa, epsilonClosure } from './nfa';

export { parseRegex, regexToNfa, regexMatches } from './regex';

export { pdaAccepts, pdaPalindromes, pdaBalancedParens } from './pda';

export { dfaEvenZeros, dfaContainsAB, regexEmail } from './languages';
