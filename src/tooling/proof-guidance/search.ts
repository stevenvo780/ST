// ============================================================
// ST Proof Guidance — Beam search guiado por el modelo
//
// Hill-climbing relajado: en cada paso retenemos los `beamWidth`
// estados con mejor score acumulado y expandimos solo esos.
// El score se hereda del modelo (ranking) — el modelo guía qué
// rama explorar primero.
// ============================================================

import { rankTactics } from './model';
import type {
  ApplyTactic,
  ProofState,
  RankingModel,
  SearchOptions,
  SearchResult,
  TacticRecord,
} from './types';

interface BeamNode {
  state: ProofState;
  path: TacticRecord[];
  /** score acumulado = suma de log-likelihoods de las tácticas tomadas. */
  cumulativeScore: number;
}

/**
 * Reconoce un estado "cerrado" — goal vacío o `⊤` o reducido a una
 * hipótesis idéntica. Hook minimalista; el caller puede pasar tácticas
 * que devuelvan estados con goal = '' para indicar QED.
 */
function isClosed(state: ProofState): boolean {
  const goal = state.goal.trim();
  if (goal === '' || goal === '⊤') return true;
  if (state.hypotheses.some((h) => h.trim() === goal)) return true;
  return false;
}

/**
 * Hash determinístico de un estado para detectar ciclos en el beam.
 * No es criptográfico — sólo evita re-expandir el mismo estado.
 */
function stateKey(state: ProofState): string {
  // Hipótesis ordenadas para que {A, B} y {B, A} sean el mismo estado.
  const hyps = state.hypotheses.slice().sort().join('|');
  return `${state.goal.trim()}#${hyps}`;
}

/**
 * Beam search guiado por el modelo. `applyTactic` define la semántica
 * de cada táctica — el módulo no asume nada sobre la lógica de fondo.
 */
export function guidedSearch(
  initialState: ProofState,
  applyTactic: ApplyTactic,
  model: RankingModel,
  candidates: string[],
  opts: SearchOptions = {},
): SearchResult {
  const maxDepth = opts.maxDepth ?? 16;
  const beamWidth = Math.max(1, opts.beamWidth ?? 4);
  const timeoutMs = opts.timeoutMs ?? 5000;
  const maxExploredStates = opts.maxExploredStates ?? 10000;

  const start = Date.now();
  let explored = 0;
  const visited = new Set<string>();
  visited.add(stateKey(initialState));

  if (isClosed(initialState)) {
    return { proof: [], exploredStates: 0, success: true };
  }

  let beam: BeamNode[] = [{ state: initialState, path: [], cumulativeScore: 0 }];

  for (let depth = 0; depth < maxDepth; depth++) {
    if (Date.now() - start > timeoutMs) {
      return { exploredStates: explored, success: false, reason: 'timeout' };
    }
    if (explored >= maxExploredStates) {
      return { exploredStates: explored, success: false, reason: 'cap' };
    }

    const nextBeam: BeamNode[] = [];

    for (const node of beam) {
      if (Date.now() - start > timeoutMs) {
        return { exploredStates: explored, success: false, reason: 'timeout' };
      }
      const ranked = rankTactics(node.state, model, candidates);

      for (const r of ranked) {
        if (explored >= maxExploredStates) break;
        const newState = applyTactic(node.state, r.tactic);
        explored++;
        if (newState === null) continue;

        const key = stateKey(newState);
        if (visited.has(key)) continue;
        visited.add(key);

        const record: TacticRecord = {
          tactic: r.tactic,
          beforeState: node.state,
          afterState: newState,
          successful: isClosed(newState),
        };
        const newPath = [...node.path, record];

        if (isClosed(newState)) {
          return { proof: newPath, exploredStates: explored, success: true };
        }

        nextBeam.push({
          state: newState,
          path: newPath,
          cumulativeScore: node.cumulativeScore + r.score,
        });
      }
    }

    if (nextBeam.length === 0) {
      return { exploredStates: explored, success: false, reason: 'exhausted' };
    }

    // Mantener los top-`beamWidth` por score acumulado.
    nextBeam.sort((a, b) => b.cumulativeScore - a.cumulativeScore);
    beam = nextBeam.slice(0, beamWidth);
  }

  return { exploredStates: explored, success: false, reason: 'depth' };
}
