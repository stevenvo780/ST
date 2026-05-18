// ============================================================
// ST Proof Mining — Extracción de sub-pruebas reutilizables
// ============================================================
//
// Algoritmo:
//
//   1. Para cada proof P en el corpus, descomponer en sub-trees.
//      Un sub-tree comienza en un paso s y abarca todos los pasos
//      con depth > s.depth hasta que aparezca otro paso de depth
//      ≤ s.depth (regreso al nivel del padre).
//
//   2. Para cada sub-tree, calcular una clave estructural (hash
//      α-canónico): la secuencia de reglas + outputs normalizados a
//      placeholders `?0`, `?1`, …
//
//   3. Agrupar sub-trees por clave. Los grupos con count ≥
//      minReuseThreshold y size ≥ minSubtreeSize son candidatos
//      a lemma.
//
// La descomposición es lineal en el tamaño del proof: cada paso
// participa en O(1) sub-trees (el que arranca en él) — aunque cada
// sub-tree puede tener O(size) pasos. Total: O(N · S) donde S es
// el tamaño promedio del sub-tree (usualmente pequeño).

import { canonicalString } from '../../runtime/theorem-cache/canonical';
import type { ProofStep, ProofTrace } from './types';

/**
 * Un sub-tree candidato extraído de un proof, antes de pasar a
 * generalización/ranking.
 */
export interface SubtreeCandidate {
  /** ID del proof origen. */
  proofId: string;
  /** Posición del paso raíz en `steps`. */
  rootIndex: number;
  /** Pasos que componen el sub-tree (en orden top-down). */
  steps: ProofStep[];
  /** Conclusión del sub-tree (= output del paso raíz). */
  conclusion: string;
  /** Profile del proof origen. */
  profile: string;
  /** Cost asignado (igual al cost del proof original prorrateado). */
  cost: number;
}

/**
 * Agrupación de sub-trees estructuralmente equivalentes.
 */
export interface SubtreeGroup {
  /** Hash α-canónico común. */
  key: string;
  /** Conclusión canónica representativa. */
  canonicalConclusion: string;
  /** Sub-trees miembros del grupo. */
  members: SubtreeCandidate[];
}

function genProofId(p: ProofTrace, idx: number): string {
  return p.id ?? `proof-${idx}`;
}

/**
 * Descompone un proof en sub-trees a partir de cada paso. El
 * sub-tree con raíz en `i` incluye `steps[i]` y todos los
 * descendientes consecutivos (depth > steps[i].depth) hasta que
 * vuelve a aparecer un paso de depth ≤ steps[i].depth.
 *
 * Para steps[i] con depth d_i, el sub-tree es:
 *   steps[i], steps[i+1], …, steps[j-1]
 * donde j es el menor índice > i con steps[j].depth ≤ d_i (o
 * length si no existe).
 */
export function extractSubtrees(proof: ProofTrace, proofId: string): SubtreeCandidate[] {
  const out: SubtreeCandidate[] = [];
  const steps = proof.steps;
  if (steps.length === 0) return out;

  // Cost prorrateado: cada paso aporta cost/length al sub-tree donde participa.
  const perStepCost = proof.cost / Math.max(1, steps.length);

  for (let i = 0; i < steps.length; i++) {
    const root = steps[i];
    if (root === undefined) continue;
    const rootDepth = root.depth;
    let j = i + 1;
    while (j < steps.length) {
      const sj = steps[j];
      if (sj === undefined) break;
      if (sj.depth <= rootDepth) break;
      j++;
    }
    const subSteps = steps.slice(i, j);
    out.push({
      proofId,
      rootIndex: i,
      steps: subSteps,
      conclusion: root.output,
      profile: proof.profile,
      cost: perStepCost * subSteps.length,
    });
  }
  return out;
}

/**
 * Clave estructural canónica de un sub-tree.
 *
 * Combina: secuencia de reglas (por orden top-down) + diferencias
 * relativas de depth (para reconstruir forma del árbol) + outputs
 * normalizados α-canónicamente.
 *
 * El canónico depende del orden de aparición de los identificadores
 * de cada output, lo que da un hash estable módulo renombrado de
 * variables.
 */
export function subtreeKey(sub: SubtreeCandidate): string {
  if (sub.steps.length === 0) return 'empty';
  const root = sub.steps[0];
  if (root === undefined) return 'empty';
  const baseDepth = root.depth;
  const parts: string[] = [];
  // Renombrado coherente de identificadores a través de todos los outputs
  // del sub-tree. Concatenamos con separador para que aparezcan en el orden
  // correcto y un único pase de canonicalización los renombra de forma
  // consistente.
  const joined = sub.steps.map((s) => s.output).join(' ⫶ ');
  const canon = canonicalString(joined);
  const outputs = canon.split(' ⫶ ');
  for (let i = 0; i < sub.steps.length; i++) {
    const s = sub.steps[i];
    if (s === undefined) continue;
    const out = outputs[i] ?? canonicalString(s.output);
    parts.push(`${s.rule}@${s.depth - baseDepth}:${out}`);
  }
  return parts.join('|');
}

/**
 * Agrupa sub-trees por clave estructural canónica.
 */
export function groupSubtrees(candidates: SubtreeCandidate[]): SubtreeGroup[] {
  const groups = new Map<string, SubtreeGroup>();
  for (const c of candidates) {
    const k = subtreeKey(c);
    let g = groups.get(k);
    if (g === undefined) {
      g = {
        key: k,
        canonicalConclusion: canonicalString(c.conclusion),
        members: [],
      };
      groups.set(k, g);
    }
    g.members.push(c);
  }
  return Array.from(groups.values());
}

/**
 * Identifica sub-pruebas auxiliares en el corpus. Recibe un array
 * de proofs, devuelve los grupos de sub-trees estructuralmente
 * equivalentes que pasan los filtros (minReuseThreshold y
 * minSubtreeSize).
 *
 * Esta función NO genera lemmas todavía — solo identifica los
 * candidatos. `mineLemmas` los procesa, genera el statement y los
 * persiste.
 */
export function extractAuxiliaryLemmas(
  corpus: ProofTrace[],
  options?: { minReuseThreshold?: number; minSubtreeSize?: number },
): SubtreeGroup[] {
  const minReuse = options?.minReuseThreshold ?? 2;
  const minSize = options?.minSubtreeSize ?? 2;

  const allSubtrees: SubtreeCandidate[] = [];
  for (let i = 0; i < corpus.length; i++) {
    const p = corpus[i];
    if (p === undefined) continue;
    const id = genProofId(p, i);
    for (const sub of extractSubtrees(p, id)) {
      if (sub.steps.length < minSize) continue;
      allSubtrees.push(sub);
    }
  }

  const groups = groupSubtrees(allSubtrees);

  // Filtrar por umbral de reuso, contando proofs DISTINTOS (no
  // múltiples ocurrencias dentro del mismo proof).
  const filtered: SubtreeGroup[] = [];
  for (const g of groups) {
    const distinctProofs = new Set(g.members.map((m) => m.proofId));
    if (distinctProofs.size >= minReuse) {
      filtered.push(g);
    }
  }
  return filtered;
}
