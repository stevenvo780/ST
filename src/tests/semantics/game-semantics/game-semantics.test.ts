import { describe, it, expect } from 'vitest';
import {
  winningStrategy,
  play,
  ipcAtom,
  ipcAnd,
  ipcOr,
  ipcImplies,
  ipcNot,
  ipcBottom,
  ipcEquals,
  ipcToString,
  toIntuit,
  type Move,
} from '../../../semantics/game-semantics';

const P = ipcAtom('P');
const Q = ipcAtom('Q');
const R = ipcAtom('R');

describe('Game semantics IPC — winningStrategy', () => {
  it('P → P: proponente tiene estrategia ganadora', () => {
    const result = winningStrategy(ipcImplies(P, P));
    expect(result.exists).toBe(true);
    expect(typeof result.strategy).toBe('function');
  });

  it('P ∨ ¬P: proponente NO tiene estrategia (no es válida en IPC)', () => {
    const result = winningStrategy(ipcOr(P, ipcNot(P)));
    expect(result.exists).toBe(false);
    expect(result.strategy).toBeUndefined();
  });

  it('(P ∧ Q) → P: proponente gana (proyección)', () => {
    const result = winningStrategy(ipcImplies(ipcAnd(P, Q), P));
    expect(result.exists).toBe(true);
  });

  it('(P ∧ Q) → Q: proponente gana (proyección derecha)', () => {
    const result = winningStrategy(ipcImplies(ipcAnd(P, Q), Q));
    expect(result.exists).toBe(true);
  });

  it('P → (Q → P): proponente gana (axioma K débil)', () => {
    const result = winningStrategy(ipcImplies(P, ipcImplies(Q, P)));
    expect(result.exists).toBe(true);
  });

  it('(P → Q) → ((Q → R) → (P → R)): transitividad de →', () => {
    const phi = ipcImplies(ipcImplies(P, Q), ipcImplies(ipcImplies(Q, R), ipcImplies(P, R)));
    const result = winningStrategy(phi);
    expect(result.exists).toBe(true);
  });

  it('¬¬(P ∨ ¬P): proponente gana (estable en IPC aunque P∨¬P no)', () => {
    const phi = ipcNot(ipcNot(ipcOr(P, ipcNot(P))));
    const result = winningStrategy(phi);
    expect(result.exists).toBe(true);
  });

  it('¬¬P → P (DNE): proponente NO tiene estrategia (clásica pero no intuicionista)', () => {
    const phi = ipcImplies(ipcNot(ipcNot(P)), P);
    const result = winningStrategy(phi);
    expect(result.exists).toBe(false);
  });

  it('((P → Q) → P) → P (Peirce): proponente NO tiene estrategia', () => {
    const phi = ipcImplies(ipcImplies(ipcImplies(P, Q), P), P);
    const result = winningStrategy(phi);
    expect(result.exists).toBe(false);
  });

  it('⊥ → P (ex falso): proponente gana', () => {
    const phi = ipcImplies(ipcBottom(), P);
    const result = winningStrategy(phi);
    expect(result.exists).toBe(true);
  });

  it('P: átomo aislado NO es válido (proponente pierde)', () => {
    const result = winningStrategy(P);
    expect(result.exists).toBe(false);
  });
});

describe('Game semantics IPC — play (simulación de partida)', () => {
  it('P → P contra ataque-implica: P gana', () => {
    const phi = ipcImplies(P, P);
    const opp: Move[] = [{ kind: 'attack-implies' }];
    const { winner, trace } = play(phi, opp);
    expect(winner).toBe('proponent');
    expect(trace.length).toBeGreaterThan(1);
    // El primer estado refleja la tesis original.
    expect(ipcEquals(trace[0].current, phi)).toBe(true);
  });

  it('(P ∧ Q) → P: O ataca →, luego pide ∧-left, P concluye P', () => {
    const phi = ipcImplies(ipcAnd(P, Q), P);
    const opp: Move[] = [{ kind: 'attack-implies' }];
    const { winner, trace } = play(phi, opp);
    expect(winner).toBe('proponent');
    // El contexto en algún momento contiene P∧Q (concedido por O).
    const sawConjunction = trace.some((s) => s.context.some((c) => ipcEquals(c, ipcAnd(P, Q))));
    expect(sawConjunction).toBe(true);
  });

  it('P (átomo aislado): O no necesita atacar, P pierde inmediatamente', () => {
    const { winner } = play(P, []);
    expect(winner).toBe('opponent');
  });

  it('P ∨ ¬P: P no tiene estrategia → O gana', () => {
    const phi = ipcOr(P, ipcNot(P));
    const { winner } = play(phi, []);
    expect(winner).toBe('opponent');
  });

  it('history acumula movidas con etiquetas legibles', () => {
    const phi = ipcImplies(P, P);
    const opp: Move[] = [{ kind: 'attack-implies' }];
    const { trace } = play(phi, opp);
    const last = trace[trace.length - 1];
    expect(last.history.length).toBeGreaterThanOrEqual(2);
    // Hay al menos una movida del oponente y otra del proponente.
    const players = new Set(last.history.map((h) => h.player));
    expect(players.has('proponent')).toBe(true);
    expect(players.has('opponent')).toBe(true);
  });
});

describe('Game semantics IPC — invariantes y serialización', () => {
  it('ipcToString es estable y legible', () => {
    expect(ipcToString(P)).toBe('P');
    expect(ipcToString(ipcBottom())).toBe('⊥');
    expect(ipcToString(ipcImplies(P, Q))).toBe('(P → Q)');
    expect(ipcToString(ipcAnd(P, Q))).toBe('(P ∧ Q)');
    expect(ipcToString(ipcOr(P, Q))).toBe('(P ∨ Q)');
    expect(ipcToString(ipcNot(P))).toBe('(P → ⊥)');
  });

  it('toIntuit preserva la estructura sintáctica', () => {
    const phi = ipcImplies(ipcAnd(P, Q), ipcOr(P, ipcBottom()));
    const t = toIntuit(phi);
    expect(t.kind).toBe('implies');
    if (t.kind === 'implies') {
      expect(t.left.kind).toBe('and');
      expect(t.right.kind).toBe('or');
    }
  });

  it('winningStrategy es determinista para la misma fórmula', () => {
    const phi = ipcImplies(P, P);
    const r1 = winningStrategy(phi);
    const r2 = winningStrategy(phi);
    expect(r1.exists).toBe(r2.exists);
  });

  it('estrategia de P → P produce una movida válida desde el estado inicial', () => {
    const phi = ipcImplies(P, P);
    const r = winningStrategy(phi);
    expect(r.exists).toBe(true);
    const move = r.strategy!({
      current: phi,
      context: [],
      history: [],
    });
    // La movida es alguna de las del ADT (no es null/undefined).
    expect(['choose-and', 'choose-or', 'attack-implies', 'defend-bottom']).toContain(move.kind);
  });

  it('play preserva la fórmula original en trace[0].current', () => {
    const phi = ipcImplies(ipcAnd(P, Q), Q);
    const { trace } = play(phi, [{ kind: 'attack-implies' }]);
    expect(ipcEquals(trace[0].current, phi)).toBe(true);
  });
});
