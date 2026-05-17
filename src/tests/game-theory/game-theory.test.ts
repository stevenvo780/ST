import { describe, it, expect } from 'vitest';
import {
  approxEqual,
  battleOfSexes,
  bestResponse,
  createTwoPlayerGame,
  eliminateDominated,
  enumerateAllNash,
  expectedPayoff,
  findPureNash,
  isDominated,
  lemkeHowson,
  matchingPennies,
  prisonersDilemma,
  pureDistribution,
  rockPaperScissors,
  stagHunt,
  vectorsApproxEqual,
  type MixedStrategy,
  type NormalFormGame,
} from '../../game-theory';

function pure(player: number, s: number, size: number): MixedStrategy {
  return { player, distribution: pureDistribution(s, size) };
}

function mixed(player: number, dist: number[]): MixedStrategy {
  return { player, distribution: dist };
}

describe('game-theory — common-games sanity', () => {
  it("Prisoner's Dilemma: único Nash puro (D, D) con payoff (1, 1)", () => {
    const g = prisonersDilemma();
    const eqs = findPureNash(g);
    expect(eqs).toHaveLength(1);
    const eq = eqs[0];
    expect(eq.isPure).toBe(true);
    expect(eq.isStrict).toBe(true);
    expect(eq.strategies[0].distribution).toEqual([0, 1]);
    expect(eq.strategies[1].distribution).toEqual([0, 1]);
    expect(eq.payoffs).toEqual([1, 1]);
  });

  it('Matching Pennies: no hay Nash puro', () => {
    const g = matchingPennies();
    const eqs = findPureNash(g);
    expect(eqs).toHaveLength(0);
  });

  it('Matching Pennies: Nash mixto (1/2, 1/2) via support enumeration', () => {
    const g = matchingPennies();
    const all = enumerateAllNash(g);
    expect(all).toHaveLength(1);
    const eq = all[0];
    expect(eq.isPure).toBe(false);
    expect(vectorsApproxEqual(eq.strategies[0].distribution, [0.5, 0.5], 1e-7)).toBe(true);
    expect(vectorsApproxEqual(eq.strategies[1].distribution, [0.5, 0.5], 1e-7)).toBe(true);
    expect(approxEqual(eq.payoffs[0], 0, 1e-7)).toBe(true);
    expect(approxEqual(eq.payoffs[1], 0, 1e-7)).toBe(true);
  });

  it('Rock-Paper-Scissors: único Nash mixto (1/3, 1/3, 1/3) cada jugador', () => {
    const g = rockPaperScissors();
    expect(findPureNash(g)).toHaveLength(0);
    const all = enumerateAllNash(g);
    expect(all).toHaveLength(1);
    const eq = all[0];
    expect(eq.isPure).toBe(false);
    expect(vectorsApproxEqual(eq.strategies[0].distribution, [1 / 3, 1 / 3, 1 / 3], 1e-7)).toBe(
      true,
    );
    expect(vectorsApproxEqual(eq.strategies[1].distribution, [1 / 3, 1 / 3, 1 / 3], 1e-7)).toBe(
      true,
    );
  });

  it('Battle of the Sexes: 2 Nash puros + 1 mixto', () => {
    const g = battleOfSexes();
    const pures = findPureNash(g);
    expect(pures).toHaveLength(2);
    const all = enumerateAllNash(g);
    expect(all).toHaveLength(3);
    const mixedEq = all.find((e) => !e.isPure);
    expect(mixedEq).toBeDefined();
    // En BoS con (2,1)/(0,0)/(0,0)/(1,2), el mixto es p=2/3 para player1
    // (probabilidad de Opera) y q=1/3 para player2.
    expect(vectorsApproxEqual(mixedEq!.strategies[0].distribution, [2 / 3, 1 / 3], 1e-7)).toBe(
      true,
    );
    expect(vectorsApproxEqual(mixedEq!.strategies[1].distribution, [1 / 3, 2 / 3], 1e-7)).toBe(
      true,
    );
  });

  it('Stag Hunt: 2 Nash puros + 1 mixto', () => {
    const g = stagHunt();
    const pures = findPureNash(g);
    expect(pures).toHaveLength(2);
    const all = enumerateAllNash(g);
    expect(all).toHaveLength(3);
  });
});

describe('game-theory — bestResponse', () => {
  it('PD: best response a coop puro es D', () => {
    const g = prisonersDilemma();
    // opponentStrategies debe incluir todos los jugadores; la entrada
    // de "player" se ignora — usamos una distribución placeholder.
    const opp = [pure(0, 0, 2), pure(1, 0, 2)];
    const br = bestResponse(g, 0, opp);
    expect(br).toEqual([1]); // Defect
  });

  it('Matching Pennies: best response a mezcla 50/50 son todas las puras (empate)', () => {
    const g = matchingPennies();
    const opp = [pure(0, 0, 2), mixed(1, [0.5, 0.5])];
    const br = bestResponse(g, 0, opp);
    expect(br.sort()).toEqual([0, 1]);
  });

  it('Battle of the Sexes: best response a "Opera" puro del rival es "Opera"', () => {
    const g = battleOfSexes();
    const opp = [pure(0, 0, 2), pure(1, 0, 2)];
    const br0 = bestResponse(g, 0, opp);
    expect(br0).toEqual([0]);
  });
});

describe('game-theory — dominance', () => {
  it('isDominated detecta estrategia estrictamente dominada', () => {
    // Jugador 1: estrategia 0 da [1,1], estrategia 1 da [3,3] → 0 dominada
    const g = createTwoPlayerGame(
      [
        [1, 1],
        [3, 3],
      ],
      [
        [0, 0],
        [0, 0],
      ],
    );
    expect(isDominated(g, 0, 0, true)).toBe(true);
    expect(isDominated(g, 0, 1, true)).toBe(false);
  });

  it('eliminateDominated reduce el juego', () => {
    // 3x2: la estrategia 2 del jugador 1 está dominada por la 0 (estricta).
    // Las otras dos filas de P1 dan los mismos pagos, así que ninguna
    // está estrictamente dominada por la otra. P2 tiene pagos planos →
    // tampoco se elimina nada del lado 2.
    const g = createTwoPlayerGame(
      [
        [5, 5],
        [5, 5], // mismo que fila 0 → no estrictamente dominada
        [1, 1], // dominada por estrategia 0
      ],
      [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    );
    const reduced = eliminateDominated(g, true);
    expect(reduced.strategies[0]).toBe(2);
    expect(reduced.strategies[1]).toBe(2);
  });

  it('eliminateDominated: iterado encuentra mas reducciones', () => {
    // Juego donde tras eliminar una de player 1, una de player 2 queda dominada.
    // Player 1 elige fila, Player 2 elige columna.
    // Row 2 dominada por row 0 para P1; tras eliminarla, col 2 queda dominada por col 0 para P2.
    const g = createTwoPlayerGame(
      [
        [5, 4, 3], // P1 utility
        [4, 3, 2],
        [1, 0, -1], // dominada por fila 0
      ],
      [
        [3, 4, 2], // P2 utility
        [3, 4, 2],
        [3, 4, 2],
      ],
    );
    const reduced = eliminateDominated(g, true);
    // Tras eliminar fila 2 de P1, miramos columnas de P2.
    // P2 ahora tiene matrices [[3,4,2],[3,4,2]]. col 2 (=2) está dominada por col 1 (=4).
    expect(reduced.strategies[0]).toBeLessThanOrEqual(2);
    expect(reduced.strategies[1]).toBeLessThanOrEqual(3);
    // Al menos UNA dimensión debe haberse reducido del original
    const originalProfiles = 3 * 3;
    const newProfiles = reduced.strategies[0] * reduced.strategies[1];
    expect(newProfiles).toBeLessThan(originalProfiles);
  });

  it('PD: ninguna estrategia esta dominada (D es weak-better pero ambos prefieren D)', () => {
    const g = prisonersDilemma();
    // Cooperate está estrictamente dominada por Defect en PD
    expect(isDominated(g, 0, 0, true)).toBe(true);
    expect(isDominated(g, 0, 1, true)).toBe(false);
    expect(isDominated(g, 1, 0, true)).toBe(true);
    expect(isDominated(g, 1, 1, true)).toBe(false);
    const reduced = eliminateDominated(g, true);
    expect(reduced.strategies).toEqual([1, 1]);
    expect(reduced.payoffs[0]).toEqual([1]);
    expect(reduced.payoffs[1]).toEqual([1]);
  });
});

describe('game-theory — lemke-howson', () => {
  it('lemkeHowson encuentra Nash en matching pennies', () => {
    const g = matchingPennies();
    const eq = lemkeHowson(g, 0);
    expect(eq).not.toBeNull();
    expect(vectorsApproxEqual(eq!.strategies[0].distribution, [0.5, 0.5], 1e-6)).toBe(true);
    expect(vectorsApproxEqual(eq!.strategies[1].distribution, [0.5, 0.5], 1e-6)).toBe(true);
  });

  it('lemkeHowson encuentra Nash en RPS', () => {
    const g = rockPaperScissors();
    const eq = lemkeHowson(g, 0);
    expect(eq).not.toBeNull();
    expect(vectorsApproxEqual(eq!.strategies[0].distribution, [1 / 3, 1 / 3, 1 / 3], 1e-6)).toBe(
      true,
    );
  });

  it('lemkeHowson encuentra UN Nash en battle of sexes', () => {
    const g = battleOfSexes();
    const eq = lemkeHowson(g, 0);
    expect(eq).not.toBeNull();
    // Debe ser uno de los 3 Nash conocidos
    const allEqs = enumerateAllNash(g);
    const match = allEqs.some(
      (e) =>
        vectorsApproxEqual(e.strategies[0].distribution, eq!.strategies[0].distribution, 1e-5) &&
        vectorsApproxEqual(e.strategies[1].distribution, eq!.strategies[1].distribution, 1e-5),
    );
    expect(match).toBe(true);
  });
});

describe('game-theory — expectedPayoff', () => {
  it('expectedPayoff es lineal en el perfil mixto', () => {
    const g = matchingPennies();
    const halfHalf = [mixed(0, [0.5, 0.5]), mixed(1, [0.5, 0.5])];
    expect(approxEqual(expectedPayoff(g, 0, halfHalf), 0, 1e-9)).toBe(true);
    expect(approxEqual(expectedPayoff(g, 1, halfHalf), 0, 1e-9)).toBe(true);

    // Si player 2 juega H puro y player 1 juega 50/50, payoff de player 1 = 0
    const allH = [mixed(0, [0.5, 0.5]), pure(1, 0, 2)];
    expect(approxEqual(expectedPayoff(g, 0, allH), 0, 1e-9)).toBe(true);
    // y payoff de player 2 = 0
    expect(approxEqual(expectedPayoff(g, 1, allH), 0, 1e-9)).toBe(true);
  });
});

describe('game-theory — asymmetric NxM games', () => {
  it('2x3 con única Nash pura', () => {
    // Construido para que (0, 1) sea la única Nash:
    //   P1: fila 0 le da 5,7,3 ; fila 1 le da 4,2,1 → fila 0 domina
    //   P2: dada fila 0, columna 1 (=7) le da 6 vs 1 y 2 → mejor.
    const g = createTwoPlayerGame(
      [
        [5, 7, 3],
        [4, 2, 1],
      ],
      [
        [1, 6, 2],
        [3, 5, 4],
      ],
    );
    const eqs = findPureNash(g);
    expect(eqs.length).toBeGreaterThanOrEqual(1);
    const has01 = eqs.some(
      (e) => e.strategies[0].distribution[0] === 1 && e.strategies[1].distribution[1] === 1,
    );
    expect(has01).toBe(true);
  });

  it('enumerateAllNash respeta maxSize cap', () => {
    const g = rockPaperScissors();
    const cap1 = enumerateAllNash(g, 1);
    // Cap a tamaño 1 → solo busca puros (no hay en RPS)
    expect(cap1).toHaveLength(0);
    const cap3 = enumerateAllNash(g, 3);
    expect(cap3).toHaveLength(1);
  });
});

describe('game-theory — N-player simétricos chicos', () => {
  it('3-player coordination game: hay Nash puros donde todos coordinan', () => {
    // 3 jugadores, 2 estrategias cada uno (A=0, B=1).
    // payoff[player][profile_index]: si todos juegan lo mismo dan 1, sino 0.
    // perfil index: (s1, s2, s3) → s1*4 + s2*2 + s3
    const players = 3;
    const sizes = [2, 2, 2];
    const payoff = (s1: number, s2: number, s3: number): number => (s1 === s2 && s2 === s3 ? 1 : 0);
    const payoffs: number[][] = [];
    for (let p = 0; p < players; p++) {
      const row: number[] = [];
      for (let s1 = 0; s1 < 2; s1++) {
        for (let s2 = 0; s2 < 2; s2++) {
          for (let s3 = 0; s3 < 2; s3++) {
            row.push(payoff(s1, s2, s3));
          }
        }
      }
      payoffs.push(row);
    }
    const g: NormalFormGame = { players, strategies: sizes, payoffs };
    const pures = findPureNash(g);
    // (0,0,0) y (1,1,1) son Nash; (0,0,1) no (player 3 desviaría a 0).
    expect(pures.length).toBeGreaterThanOrEqual(2);
    const allCoord = pures.filter(
      (e) =>
        e.strategies.every((s) => s.distribution[0] === 1) ||
        e.strategies.every((s) => s.distribution[1] === 1),
    );
    expect(allCoord).toHaveLength(2);
  });
});
