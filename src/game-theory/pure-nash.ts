// ============================================================
// Pure-strategy Nash equilibria
// ============================================================
//
// Un perfil puro (s_1, ..., s_n) es Nash sii cada s_i es best
// response del jugador i contra (s_{-i}). Lo verificamos
// enumerando todos los perfiles y comprobando la condición.

import type { NashEquilibrium, NormalFormGame } from './types';
import {
  expectedPayoffFromDistributions,
  indexToProfile,
  profileToIndex,
  pureDistribution,
  totalProfiles,
} from './types';

export function findPureNash(game: NormalFormGame): NashEquilibrium[] {
  const sizes = game.strategies;
  const total = totalProfiles(sizes);
  const equilibria: NashEquilibrium[] = [];

  for (let idx = 0; idx < total; idx++) {
    const profile = indexToProfile(idx, sizes);
    if (isProfileNash(game, profile)) {
      equilibria.push(buildPureEquilibrium(game, profile));
    }
  }
  return equilibria;
}

function isProfileNash(game: NormalFormGame, profile: number[]): boolean {
  const sizes = game.strategies;
  for (let p = 0; p < game.players; p++) {
    const mySize = sizes[p];
    const baseIdx = profileToIndex(profile, sizes);
    const row = game.payoffs[p];
    if (!row) throw new Error(`payoff missing for player ${p}`);
    const curU = row[baseIdx];
    for (let alt = 0; alt < mySize; alt++) {
      if (alt === profile[p]) continue;
      const altProfile = profile.slice();
      altProfile[p] = alt;
      const altIdx = profileToIndex(altProfile, sizes);
      const altU = row[altIdx];
      if (altU > curU + 1e-12) return false;
    }
  }
  return true;
}

function isStrictPureNash(game: NormalFormGame, profile: number[]): boolean {
  const sizes = game.strategies;
  for (let p = 0; p < game.players; p++) {
    const mySize = sizes[p];
    const baseIdx = profileToIndex(profile, sizes);
    const row = game.payoffs[p];
    if (!row) throw new Error(`payoff missing for player ${p}`);
    const curU = row[baseIdx];
    for (let alt = 0; alt < mySize; alt++) {
      if (alt === profile[p]) continue;
      const altProfile = profile.slice();
      altProfile[p] = alt;
      const altIdx = profileToIndex(altProfile, sizes);
      const altU = row[altIdx];
      if (altU >= curU - 1e-12) return false;
    }
  }
  return true;
}

function buildPureEquilibrium(game: NormalFormGame, profile: number[]): NashEquilibrium {
  const sizes = game.strategies;
  const strategies = profile.map((s, p) => ({
    player: p,
    distribution: pureDistribution(s, sizes[p]),
  }));
  const dists = strategies.map((s) => s.distribution);
  const payoffs = new Array<number>(game.players);
  for (let p = 0; p < game.players; p++) {
    payoffs[p] = expectedPayoffFromDistributions(game, p, dists);
  }
  return {
    strategies,
    payoffs,
    isPure: true,
    isStrict: isStrictPureNash(game, profile),
  };
}
