// ============================================================
// ST Proof Mining — Estadísticas
// ============================================================

import type { MinedLemma, UsageStats } from './types';

/**
 * Computa las stats agregadas dado el corpus original y la lista
 * final de lemmas extraídos.
 */
export function computeStats(
  proofsAnalyzed: number,
  candidatesFound: number,
  lemmas: MinedLemma[],
): UsageStats {
  let totalSavings = 0;
  let totalUsage = 0;
  let generalizedCount = 0;
  for (const l of lemmas) {
    totalSavings += l.savings;
    totalUsage += l.usageCount;
    if (l.abstractionLevel > 0) generalizedCount++;
  }
  return {
    proofsAnalyzed,
    candidatesFound,
    lemmasExtracted: lemmas.length,
    totalSavings,
    averageUsage: lemmas.length === 0 ? 0 : totalUsage / lemmas.length,
    generalizedCount,
  };
}

/**
 * Render textual de las stats (para logs / debugging).
 */
export function statsToString(s: UsageStats): string {
  return [
    `proofsAnalyzed=${s.proofsAnalyzed}`,
    `candidates=${s.candidatesFound}`,
    `extracted=${s.lemmasExtracted}`,
    `totalSavings=${s.totalSavings.toFixed(2)}`,
    `avgUsage=${s.averageUsage.toFixed(2)}`,
    `generalized=${s.generalizedCount}`,
  ].join(' ');
}
