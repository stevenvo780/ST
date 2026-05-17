// ============================================================
// Game theory — Punto de entrada público
// ============================================================
//
// Computación de equilibria de Nash (puros y mixtos) para juegos
// 2-player en forma normal NxM y juegos n-player simétricos chicos.
//
//   - findPureNash         enumera Nash puros exhaustivamente.
//   - enumerateAllNash     enumera TODOS los Nash (puros y mixtos)
//                          via support enumeration (2-player).
//   - lemkeHowson          encuentra UN Nash via pivot LCP.
//   - eliminateDominated   iterated elimination of dominated strats.
//   - bestResponse         best responses puras dado un perfil mixto.
//
// Constructores ergonómicos: createTwoPlayerGame, prisonersDilemma,
// rockPaperScissors, battleOfSexes, matchingPennies, stagHunt.

export type { NormalFormGame, MixedStrategy, NashEquilibrium } from './types';
export {
  createGame,
  createTwoPlayerGame,
  profileToIndex,
  indexToProfile,
  totalProfiles,
  payoffOf,
  pureDistribution,
  expectedPayoff,
  approxEqual,
  vectorsApproxEqual,
} from './types';

export { findPureNash } from './pure-nash';
export { enumerateAllNash } from './support-enumeration';
export { lemkeHowson } from './lemke-howson';

export { isDominated, eliminateDominated, bestResponse } from './dominance';

export {
  prisonersDilemma,
  rockPaperScissors,
  battleOfSexes,
  matchingPennies,
  stagHunt,
} from './common-games';
