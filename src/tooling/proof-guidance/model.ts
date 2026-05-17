// ============================================================
// ST Proof Guidance — Modelo de ranking
//
// Aprende un peso por par (tactic, feature) via logistic regression
// con descenso por gradiente. Sin embeddings, sin librerías externas
// — todo en memoria, vectorizable a mano.
// ============================================================

import { extractFeatures, featureNames } from './features';
import type { Feature, ProofState, RankedTactic, RankingModel, TacticRecord } from './types';

const KEY_SEP = '::';

function weightKey(tactic: string, featureName: string): string {
  return `${tactic}${KEY_SEP}${featureName}`;
}

function sigmoid(z: number): number {
  // Clamp para evitar overflow numérico en exp().
  if (z > 30) return 1;
  if (z < -30) return 0;
  return 1 / (1 + Math.exp(-z));
}

/**
 * Score lineal de una táctica para un set de features.
 * z = bias[tactic] + Σ_f weights[tactic, f] * featureValue.
 */
function linearScore(
  tactic: string,
  features: Feature[],
  model: Pick<RankingModel, 'weights' | 'bias'>,
): number {
  let z = model.bias.get(tactic) ?? 0;
  for (const f of features) {
    const w = model.weights.get(weightKey(tactic, f.name));
    if (w !== undefined) z += w * f.value;
  }
  return z;
}

/**
 * Inicializa modelo vacío con feature names canónicos.
 * Los pesos arrancan en 0 — equivalente a "uniform prior".
 */
export function createEmptyModel(): RankingModel {
  return {
    features: featureNames(),
    weights: new Map<string, number>(),
    bias: new Map<string, number>(),
  };
}

interface TrainOptions {
  /** Pasadas sobre el dataset. Default: 50. */
  epochs?: number;
  /** Learning rate. Default: 0.1. */
  learningRate?: number;
  /** L2 regularization. Default: 0.001 — leve, evita pesos enormes. */
  l2?: number;
}

/**
 * Entrena un `RankingModel` via logistic regression mini-batch full-epoch.
 *
 * Para cada record: target = `successful ? 1 : 0`, ponderado por
 * `1 / (1 + proofDepthRemaining ?? 0)` cuando está presente — tácticas
 * que dejan menos profundidad pesan más.
 *
 * Las features son las de `extractFeatures(record.beforeState)`.
 */
export function trainModel(records: TacticRecord[], opts: TrainOptions = {}): RankingModel {
  const epochs = opts.epochs ?? 50;
  const lr = opts.learningRate ?? 0.1;
  const l2 = opts.l2 ?? 0.001;

  const model = createEmptyModel();

  if (records.length === 0) return model;

  // Pre-extraemos features por record (1 vez, no por epoch).
  const extracted = records.map((r) => ({
    tactic: r.tactic,
    features: extractFeatures(r.beforeState),
    target: r.successful ? 1 : 0,
    weight: r.proofDepthRemaining !== undefined ? 1 / (1 + Math.max(0, r.proofDepthRemaining)) : 1,
  }));

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const sample of extracted) {
      const z = linearScore(sample.tactic, sample.features, model);
      const p = sigmoid(z);
      const error = (p - sample.target) * sample.weight;

      // Gradiente por feature.
      for (const f of sample.features) {
        const key = weightKey(sample.tactic, f.name);
        const w = model.weights.get(key) ?? 0;
        const grad = error * f.value + l2 * w;
        model.weights.set(key, w - lr * grad);
      }

      // Gradiente del bias.
      const b = model.bias.get(sample.tactic) ?? 0;
      const gradB = error + l2 * b;
      model.bias.set(sample.tactic, b - lr * gradB);
    }
  }

  return model;
}

/**
 * Rankea candidatas por score descendente. Las tácticas sin pesos
 * aprendidos reciben score 0 (bias 0 + features × 0) y quedan al
 * final establemente (sort estable por index).
 */
export function rankTactics(
  state: ProofState,
  model: RankingModel,
  candidates: string[],
): RankedTactic[] {
  const features = extractFeatures(state);
  const scored: Array<RankedTactic & { idx: number }> = candidates.map((tactic, idx) => ({
    tactic,
    score: linearScore(tactic, features, model),
    idx,
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.idx - b.idx; // tie-break determinístico.
  });

  return scored.map(({ tactic, score }) => ({ tactic, score }));
}

/**
 * Update online: 1 paso de gradient descent con el record nuevo.
 * Devuelve un modelo nuevo (no mutación in-place del Map original).
 *
 * Útil cuando el agente IA acaba de probar una táctica y queremos
 * incorporar la señal sin re-entrenar desde cero.
 */
export function updateModel(
  model: RankingModel,
  record: TacticRecord,
  learningRate = 0.1,
): RankingModel {
  const next: RankingModel = {
    features: model.features,
    weights: new Map(model.weights),
    bias: new Map(model.bias),
  };

  const features = extractFeatures(record.beforeState);
  const target = record.successful ? 1 : 0;
  const sampleWeight =
    record.proofDepthRemaining !== undefined
      ? 1 / (1 + Math.max(0, record.proofDepthRemaining))
      : 1;

  const z = linearScore(record.tactic, features, next);
  const p = sigmoid(z);
  const error = (p - target) * sampleWeight;

  for (const f of features) {
    const key = weightKey(record.tactic, f.name);
    const w = next.weights.get(key) ?? 0;
    next.weights.set(key, w - learningRate * error * f.value);
  }
  const b = next.bias.get(record.tactic) ?? 0;
  next.bias.set(record.tactic, b - learningRate * error);

  return next;
}

/** Probabilidad calibrada [0,1] de éxito según el modelo. */
export function tacticSuccessProbability(
  state: ProofState,
  model: RankingModel,
  tactic: string,
): number {
  const features = extractFeatures(state);
  return sigmoid(linearScore(tactic, features, model));
}
