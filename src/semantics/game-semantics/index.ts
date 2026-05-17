// ============================================================
// Game semantics IPC — Punto de entrada público
// ============================================================
//
// Juegos dialógicos (Lorenzen-Felscher) para Intuitionistic
// Propositional Calculus. Una fórmula φ es válida en IPC sii el
// Proponente tiene estrategia ganadora en el juego dialógico
// sobre φ.

export type { IPCFormula, Player, Move, GameState } from './types';
export {
  ipcAtom,
  ipcBottom,
  ipcAnd,
  ipcOr,
  ipcImplies,
  ipcNot,
  ipcKey,
  ipcEquals,
  ipcToString,
} from './types';

export { winningStrategy, play, traceToString } from './strategy';
export type { WinningStrategyResult, PlayResult } from './strategy';

export { toIntuit } from './convert';
