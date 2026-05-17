// ============================================================
// Iterated elimination of (strictly|weakly) dominated strategies
// ============================================================
//
// Una estrategia pura `s` del jugador `i` está estrictamente
// dominada si existe otra estrategia pura `s'` tal que para todo
// perfil de los demás jugadores, u_i(s', t) > u_i(s, t).
//
// La versión "weak" usa ≥ con desigualdad estricta en al menos
// un perfil. Aquí soportamos `strict` (estricta) y la otra.

import type { MixedStrategy, NormalFormGame } from './types';
import { createGame, indexToProfile, profileToIndex, totalProfiles } from './types';

/**
 * Devuelve true si la estrategia pura `strategy` del jugador
 * `player` está dominada por otra pura. Si `strict` es true exige
 * dominancia estricta, si no permite weak.
 */
export function isDominated(
  game: NormalFormGame,
  player: number,
  strategy: number,
  strict = true,
): boolean {
  const sizes = game.strategies;
  const mySize = sizes[player];
  if (mySize === undefined) throw new Error(`player ${player} out of range`);
  const row = game.payoffs[player];
  if (!row) throw new Error(`payoffs missing for player ${player}`);

  // Conjunto de "perfiles del oponente" — un índice por combinación de
  // los demás jugadores. Iteramos los perfiles totales pero solo
  // miramos los que tienen `strategy` en `player`.
  const total = totalProfiles(sizes);

  // Para cada alternativa s' != strategy, ver si domina a strategy.
  for (let alt = 0; alt < mySize; alt++) {
    if (alt === strategy) continue;
    let allGE = true;
    let oneStrictGT = false;
    for (let idx = 0; idx < total; idx++) {
      const profile = indexToProfile(idx, sizes);
      if (profile[player] !== strategy) continue;
      const altProfile = profile.slice();
      altProfile[player] = alt;
      const altIdx = profileToIndex(altProfile, sizes);
      const uAlt = row[altIdx];
      const uCur = row[idx];
      if (strict) {
        if (!(uAlt > uCur)) {
          allGE = false;
          break;
        }
      } else {
        if (uAlt < uCur) {
          allGE = false;
          break;
        }
        if (uAlt > uCur) oneStrictGT = true;
      }
    }
    if (strict) {
      if (allGE) return true;
    } else {
      if (allGE && oneStrictGT) return true;
    }
  }
  return false;
}

/**
 * Aplica eliminación iterada hasta punto fijo. Devuelve un juego
 * cuyas estrategias son un subconjunto de las originales.
 *
 * Importante: el resultado siempre tiene al menos 1 estrategia por
 * jugador (la última no se elimina aunque "técnicamente" lo esté,
 * porque eliminarla deja el juego vacío y sin sentido).
 */
export function eliminateDominated(game: NormalFormGame, strict = true): NormalFormGame {
  let cur = game;
  // Mapeo opcional: índices supervivientes por jugador. No los
  // exportamos aún; el spec sólo pide el juego reducido.
  while (true) {
    const before = totalProfiles(cur.strategies);
    let removedSomething = false;
    for (let p = 0; p < cur.players; p++) {
      const size = cur.strategies[p];
      if (size <= 1) continue;
      for (let s = 0; s < size; s++) {
        if (isDominated(cur, p, s, strict)) {
          cur = removeStrategy(cur, p, s);
          removedSomething = true;
          break; // recalcular con el juego más chico
        }
      }
      if (removedSomething) break;
    }
    if (!removedSomething) break;
    if (totalProfiles(cur.strategies) === before) break; // safety
  }
  return cur;
}

/**
 * Quita una estrategia pura de un jugador y rebuilds payoffs.
 */
function removeStrategy(game: NormalFormGame, player: number, strategy: number): NormalFormGame {
  const newSizes = game.strategies.slice();
  newSizes[player] = newSizes[player] - 1;
  const newTotal = totalProfiles(newSizes);
  const newPayoffs: number[][] = [];
  for (let p = 0; p < game.players; p++) {
    newPayoffs.push(new Array<number>(newTotal));
  }
  for (let newIdx = 0; newIdx < newTotal; newIdx++) {
    const newProfile = indexToProfile(newIdx, newSizes);
    // Mapear back a perfil viejo: saltar la estrategia eliminada
    const oldProfile = newProfile.slice();
    const np = oldProfile[player];
    oldProfile[player] = np >= strategy ? np + 1 : np;
    const oldIdx = profileToIndex(oldProfile, game.strategies);
    for (let p = 0; p < game.players; p++) {
      newPayoffs[p][newIdx] = game.payoffs[p][oldIdx];
    }
  }
  return createGame(game.players, newSizes, newPayoffs);
}

/**
 * Mejores respuestas puras del jugador `player` dado que los demás
 * juegan según `opponentStrategies` (debe incluir TODOS los jugadores,
 * incluyendo el propio — la entrada de `player` se ignora).
 *
 * Retorna lista de índices de estrategias puras con utilidad máxima
 * (puede haber empates).
 */
export function bestResponse(
  game: NormalFormGame,
  player: number,
  opponentStrategies: MixedStrategy[],
): number[] {
  const sizes = game.strategies;
  const mySize = sizes[player];
  if (mySize === undefined) throw new Error(`player ${player} out of range`);
  if (opponentStrategies.length !== game.players) {
    throw new Error(
      `expected ${game.players} mixed strategies (one per player including self placeholder)`,
    );
  }

  const utilities = new Array<number>(mySize).fill(0);
  for (let s = 0; s < mySize; s++) {
    const dists: number[][] = [];
    for (let p = 0; p < game.players; p++) {
      if (p === player) {
        const d = new Array<number>(mySize).fill(0);
        d[s] = 1;
        dists.push(d);
      } else {
        dists.push(opponentStrategies[p].distribution);
      }
    }
    utilities[s] = expectedUtility(game, player, dists);
  }

  const best: number[] = [];
  let maxU = -Infinity;
  for (let s = 0; s < mySize; s++) {
    const u = utilities[s];
    if (u > maxU + 1e-12) {
      maxU = u;
      best.length = 0;
      best.push(s);
    } else if (Math.abs(u - maxU) < 1e-9) {
      best.push(s);
    }
  }
  return best;
}

function expectedUtility(game: NormalFormGame, player: number, dists: number[][]): number {
  const sizes = game.strategies;
  const total = totalProfiles(sizes);
  const row = game.payoffs[player];
  if (!row) throw new Error(`player ${player} out of range`);
  let acc = 0;
  for (let idx = 0; idx < total; idx++) {
    const profile = indexToProfile(idx, sizes);
    let prob = 1;
    for (let p = 0; p < profile.length; p++) {
      const d = dists[p];
      prob *= d[profile[p]];
      if (prob === 0) break;
    }
    if (prob === 0) continue;
    acc += prob * row[idx];
  }
  return acc;
}
