// ============================================================
// Common games — fixtures clásicos para tests y docs.
// ============================================================

import type { NormalFormGame } from './types';
import { createTwoPlayerGame } from './types';

/**
 * Prisoner's dilemma. Estrategias: 0=cooperate, 1=defect.
 * Pagos típicos (T > R > P > S):
 *   T=5, R=3, P=1, S=0
 *
 *           C       D
 *      C  (3,3)  (0,5)
 *      D  (5,0)  (1,1)
 *
 * Único Nash: (D, D) con payoff (1, 1).
 */
export function prisonersDilemma(): NormalFormGame {
  const p1 = [
    [3, 0],
    [5, 1],
  ];
  const p2 = [
    [3, 5],
    [0, 1],
  ];
  return createTwoPlayerGame(p1, p2);
}

/**
 * Rock-Paper-Scissors (zero-sum). Estrategias: 0=R, 1=P, 2=S.
 * Único Nash: (1/3, 1/3, 1/3) por jugador, payoff (0, 0).
 */
export function rockPaperScissors(): NormalFormGame {
  const p1 = [
    [0, -1, 1],
    [1, 0, -1],
    [-1, 1, 0],
  ];
  const p2 = [
    [0, 1, -1],
    [-1, 0, 1],
    [1, -1, 0],
  ];
  return createTwoPlayerGame(p1, p2);
}

/**
 * Battle of the sexes. Dos jugadores prefieren coordinar pero
 * en cosas distintas. Estrategias: 0=Opera, 1=Football.
 *
 *           O       F
 *      O  (2,1)  (0,0)
 *      F  (0,0)  (1,2)
 *
 * Tres Nash: (O,O), (F,F), mixto.
 */
export function battleOfSexes(): NormalFormGame {
  const p1 = [
    [2, 0],
    [0, 1],
  ];
  const p2 = [
    [1, 0],
    [0, 2],
  ];
  return createTwoPlayerGame(p1, p2);
}

/**
 * Matching pennies (zero-sum). Estrategias: 0=H, 1=T.
 *
 *           H        T
 *      H  ( 1,-1) (-1, 1)
 *      T  (-1, 1) ( 1,-1)
 *
 * Único Nash: (1/2, 1/2).
 */
export function matchingPennies(): NormalFormGame {
  const p1 = [
    [1, -1],
    [-1, 1],
  ];
  const p2 = [
    [-1, 1],
    [1, -1],
  ];
  return createTwoPlayerGame(p1, p2);
}

/**
 * Coordination "stag hunt". Estrategias: 0=Stag, 1=Hare.
 *
 *           S       H
 *      S  (4,4)  (0,3)
 *      H  (3,0)  (2,2)
 *
 * Nash puros: (S,S) y (H,H); además uno mixto.
 */
export function stagHunt(): NormalFormGame {
  const p1 = [
    [4, 0],
    [3, 2],
  ];
  const p2 = [
    [4, 3],
    [0, 2],
  ];
  return createTwoPlayerGame(p1, p2);
}
