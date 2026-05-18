// ============================================================
// ST Proof Mining — Barrel + orquestador
// ============================================================
//
// API pública del módulo. La pipeline es:
//
//   mineLemmas(corpus, options)
//     → extractor.extractAuxiliaryLemmas
//     → para cada grupo: generalizer.generalizeLemma
//     → ranker.rankLemmas
//     → (opcional) persistence.persistLemmas
//
// `ProofMiner` es una fachada stateful que mantiene un cache
// interno entre llamadas (útil si se procesa el corpus en batches).

import { createHash } from 'crypto';
import { TheoremCache } from '../../runtime/theorem-cache';
import {
  extractAuxiliaryLemmas,
  extractSubtrees,
  groupSubtrees,
  subtreeKey,
} from './extractor';
import type { SubtreeCandidate, SubtreeGroup } from './extractor';
import { generalizeLemma, generalizeFormulas, generalizeTerms } from './generalizer';
import type { GeneralizationResult } from './generalizer';
import { persistLemmas, recoverLemmas, recoverLemmaFromCache, MINED_LEMMA_PROVER } from './persistence';
import { rankLemmas, scoreLemma, topK } from './ranker';
import type { RankingWeights } from './ranker';
import { computeStats, statsToString } from './statistics';
import type {
  MinedLemma,
  MiningOptions,
  MiningResult,
  ProofStep,
  ProofTrace,
  UsageStats,
} from './types';

// ── Re-exports ──────────────────────────────────────────────

export type {
  MinedLemma,
  MiningOptions,
  MiningResult,
  ProofStep,
  ProofTrace,
  UsageStats,
} from './types';
export type { SubtreeCandidate, SubtreeGroup } from './extractor';
export type { GeneralizationResult } from './generalizer';
export type { RankingWeights } from './ranker';

export {
  extractSubtrees,
  groupSubtrees,
  subtreeKey,
  extractAuxiliaryLemmas,
} from './extractor';
export {
  generalizeLemma,
  generalizeFormulas,
  generalizeTerms,
} from './generalizer';
export { rankLemmas, scoreLemma, topK } from './ranker';
export {
  persistLemmas,
  recoverLemmas,
  recoverLemmaFromCache,
  MINED_LEMMA_PROVER,
} from './persistence';
export { computeStats, statsToString } from './statistics';

// ── Orquestador funcional ───────────────────────────────────

function hashStatement(profile: string, statement: string): string {
  return createHash('sha1').update(`${profile}::${statement}`).digest('hex');
}

/**
 * Construye un MinedLemma a partir de un grupo. La conclusión
 * generalizada se obtiene del generalizer; el proof representativo
 * es el del primer member (estructura idéntica al resto módulo
 * renombre).
 */
function buildLemmaFromGroup(
  group: SubtreeGroup,
  options: Required<MiningOptions>,
): MinedLemma | undefined {
  if (group.members.length === 0) return undefined;
  const conclusions = group.members.map((m) => m.conclusion);
  const gen = generalizeLemma(conclusions, {
    maxAbstractionLevel: options.maxAbstractionLevel,
    preserveSemantic: options.preserveSemantic,
  });

  // Stat representativo: usamos el statement generalizado si
  // nonTrivial, si no el canonical de la primera conclusión.
  const statement = gen.statement || group.canonicalConclusion;

  const distinctProofs = new Set(group.members.map((m) => m.proofId));
  const usageCount = distinctProofs.size;
  const repMember = group.members[0];
  if (repMember === undefined) return undefined;
  const subproofCost = repMember.cost;
  // Saving total: cost del sub-proof × (usageCount - 1) — la 1ª
  // ocurrencia no se ahorra, solo las subsecuentes.
  const savings = subproofCost * Math.max(0, usageCount - 1);

  // Re-armamos un ProofTrace independiente para el lemma. Los
  // pasos se normalizan al subtree del primer member; las hojas
  // (deepest steps que no tienen children) se interpretan como
  // premises del lemma.
  const steps: ProofStep[] = repMember.steps.map((s) => ({ ...s }));
  // Premises: outputs de pasos cuya depth es la máxima dentro del
  // sub-tree (hojas en el árbol).
  let maxDepth = -1;
  for (const s of steps) if (s.depth > maxDepth) maxDepth = s.depth;
  const premises: string[] = [];
  for (const s of steps) {
    if (s.depth === maxDepth) {
      // Los inputs del nivel más profundo se consideran hojas.
      for (const inp of s.inputs) {
        if (!premises.includes(inp)) premises.push(inp);
      }
    }
  }

  const proof: ProofTrace = {
    conclusion: repMember.conclusion,
    premises,
    profile: repMember.profile,
    steps,
    cost: subproofCost,
  };
  const id = hashStatement(repMember.profile, statement);

  return {
    id,
    statement,
    proof,
    abstractionLevel: gen.abstractionLevel,
    usageCount,
    savings,
    sourceProofs: Array.from(distinctProofs).sort(),
  };
}

function resolveOptions(o?: MiningOptions): Required<MiningOptions> {
  return {
    minReuseThreshold: o?.minReuseThreshold ?? 2,
    minSubtreeSize: o?.minSubtreeSize ?? 2,
    maxAbstractionLevel: o?.maxAbstractionLevel ?? 3,
    preserveSemantic: o?.preserveSemantic ?? true,
  };
}

/**
 * Mina lemmas del corpus de proofs. Devuelve los lemmas ordenados
 * por score descendente + stats agregadas.
 *
 * Esta es la entrada principal del módulo. No persiste por defecto;
 * para meter al cache, pasar `cache` o usar `ProofMiner`.
 */
export function mineLemmas(
  corpus: ProofTrace[],
  options?: MiningOptions & { weights?: RankingWeights; cache?: TheoremCache },
): MiningResult {
  const opts = resolveOptions(options);
  const groups = extractAuxiliaryLemmas(corpus, {
    minReuseThreshold: opts.minReuseThreshold,
    minSubtreeSize: opts.minSubtreeSize,
  });

  // Candidates count: cuántos sub-trees pasaron el primer filtro,
  // antes del ranking final.
  let candidatesFound = 0;
  for (const g of groups) candidatesFound += g.members.length;

  const lemmas: MinedLemma[] = [];
  for (const g of groups) {
    const l = buildLemmaFromGroup(g, opts);
    if (l !== undefined) lemmas.push(l);
  }

  const ranked = rankLemmas(lemmas, options?.weights);
  const stats = computeStats(corpus.length, candidatesFound, ranked);

  if (options?.cache !== undefined) {
    persistLemmas(ranked, options.cache);
  }

  return { lemmas: ranked, stats };
}

// ── Fachada stateful ────────────────────────────────────────

/**
 * `ProofMiner` es una clase fachada con estado interno: acumula
 * lemmas a través de múltiples corpus, los persiste en un cache
 * común, y expone consultas.
 */
export class ProofMiner {
  private readonly cache: TheoremCache;
  private readonly options: Required<MiningOptions>;
  private readonly weights: RankingWeights | undefined;
  private readonly seen = new Map<string, MinedLemma>();
  private totalProofsAnalyzed = 0;
  private totalCandidatesFound = 0;

  constructor(opts?: MiningOptions & { weights?: RankingWeights; cache?: TheoremCache }) {
    this.options = resolveOptions(opts);
    this.weights = opts?.weights;
    this.cache = opts?.cache ?? new TheoremCache();
  }

  /**
   * Procesa un corpus de proofs y acumula los lemmas en estado.
   * Lemmas con el mismo `id` se mergean: usageCount += new, savings
   * += new, sourceProofs se unifican.
   */
  mine(corpus: ProofTrace[]): MiningResult {
    const single = mineLemmas(corpus, {
      ...this.options,
      weights: this.weights,
    });
    this.totalProofsAnalyzed += corpus.length;
    this.totalCandidatesFound += single.stats.candidatesFound;

    for (const l of single.lemmas) {
      const existing = this.seen.get(l.id);
      if (existing === undefined) {
        this.seen.set(l.id, l);
        continue;
      }
      // Merge: unión de sourceProofs y suma de usage/savings.
      const merged: MinedLemma = {
        ...existing,
        usageCount: existing.usageCount + l.usageCount,
        savings: existing.savings + l.savings,
        sourceProofs: Array.from(
          new Set([...existing.sourceProofs, ...l.sourceProofs]),
        ).sort(),
      };
      this.seen.set(l.id, merged);
    }

    // Persistir lo nuevo en el cache.
    persistLemmas(Array.from(this.seen.values()), this.cache);

    const all = rankLemmas(Array.from(this.seen.values()), this.weights);
    const stats = computeStats(this.totalProofsAnalyzed, this.totalCandidatesFound, all);
    return { lemmas: all, stats };
  }

  /**
   * Devuelve los lemmas acumulados, rankeados.
   */
  all(): MinedLemma[] {
    return rankLemmas(Array.from(this.seen.values()), this.weights);
  }

  /**
   * Top-k del catálogo acumulado.
   */
  top(k: number): MinedLemma[] {
    return topK(Array.from(this.seen.values()), k, this.weights);
  }

  /**
   * Stats agregadas.
   */
  stats(): UsageStats {
    return computeStats(
      this.totalProofsAnalyzed,
      this.totalCandidatesFound,
      Array.from(this.seen.values()),
    );
  }

  /** Cache subyacente (lectura). */
  getCache(): TheoremCache {
    return this.cache;
  }

  clear(): void {
    this.seen.clear();
    this.totalProofsAnalyzed = 0;
    this.totalCandidatesFound = 0;
  }
}
