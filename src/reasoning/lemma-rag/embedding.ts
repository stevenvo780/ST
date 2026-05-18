// ============================================================
// HashEmbedding — embedding determinístico R^256 sobre features AST
//
// Sin dependencias de red ni modelos externos. Features extraídas
// directamente de la representación string de la fórmula:
//   1. Frecuencias de conectivos top-level (∧ ∨ ¬ → ↔ □ ◇ ∀ ∃ = ⊥ ⊤)
//   2. Átomos/identificadores hasheados a posiciones del vector
//   3. Profundidad de cuantificadores (∀ ∃)
//   4. Tipos de operadores (modal, aritmético, set-theory, etc.)
//   5. Firma de esqueleto: secuencia de categorías de tokens
//
// Propiedades garantizadas:
//   - Determinístico: misma entrada → mismo vector
//   - α-invariante por canonicalización previa
//   - Dimensión fija: EMBEDDING_DIM (256)
//   - Sin NaN/Infinity
// ============================================================

import { EMBEDDING_DIM } from './types';
import type { Embedding, EmbeddingProvider } from './types';

// --------------- Hashing FNV-1a 32-bit (determinístico) ----------------

function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

/** Proyecta un string a un índice [0, DIM). */
function strToIndex(str: string, dim: number): number {
  return fnv1a(str) % dim;
}

/** Proyecta un string a un índice con desplazamiento de salt. */
function strToIndexSalted(str: string, salt: string, dim: number): number {
  return fnv1a(salt + str) % dim;
}

// --------------- Extracción de features --------------------------------

const CONNECTIVE_SYMBOLS = ['∧', '∨', '¬', '→', '↔', '□', '◇', '∀', '∃', '=', '⊥', '⊤', '⊢', '⇒'];
const MODAL_OPS = new Set(['□', '◇']);
const QUANTIFIER_OPS = new Set(['∀', '∃']);
const ARITH_OPS = new Set(['+', '·', '<', '≤', '>', '≠', 'S']);
const SET_OPS = new Set(['∈', '∉', '⊆', '⊂', '∪', '∩', '∅']);
const IDENT_RE = /[A-Za-z_][A-Za-z0-9_]*/g;
const LOGIC_RESERVED = new Set([
  'not', 'and', 'or', 'implies', 'iff', 'forall', 'exists',
  'true', 'false', 'True', 'False', 'TRUE', 'FALSE',
]);

interface ASTFeatures {
  /** Frecuencia de cada conectivo. */
  connectiveFreq: Record<string, number>;
  /** Átomos no reservados con sus frecuencias. */
  atomFreq: Record<string, number>;
  /** Profundidad máxima de cuantificadores. */
  quantifierDepth: number;
  /** Número total de operadores modales. */
  modalCount: number;
  /** Número de operadores aritméticos. */
  arithCount: number;
  /** Número de operadores de teoría de conjuntos. */
  setCount: number;
  /** Longitud total de la fórmula (en chars). */
  totalLen: number;
  /** Número de paréntesis: indicador de complejidad estructural. */
  parenDepth: number;
  /** Secuencia esqueleto: primeros 8 tipos de token [c=connective, a=atom, q=quantifier]. */
  skeletonHash: number;
}

function extractFeatures(formula: string): ASTFeatures {
  const connectiveFreq: Record<string, number> = {};
  const atomFreq: Record<string, number> = {};
  let quantifierDepth = 0;
  let currentQDepth = 0;
  let modalCount = 0;
  let arithCount = 0;
  let setCount = 0;
  let parenDepth = 0;
  let maxParenDepth = 0;

  // Skeleton: primeros 16 tokens categorizados
  const skeleton: string[] = [];

  for (const ch of formula) {
    if (ch === '(') {
      parenDepth++;
      if (parenDepth > maxParenDepth) maxParenDepth = parenDepth;
    } else if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
    }

    if (CONNECTIVE_SYMBOLS.includes(ch)) {
      connectiveFreq[ch] = (connectiveFreq[ch] ?? 0) + 1;
      if (QUANTIFIER_OPS.has(ch)) {
        currentQDepth++;
        if (currentQDepth > quantifierDepth) quantifierDepth = currentQDepth;
        if (skeleton.length < 16) skeleton.push('q');
      } else if (MODAL_OPS.has(ch)) {
        modalCount++;
        if (skeleton.length < 16) skeleton.push('m');
      } else if (ARITH_OPS.has(ch)) {
        arithCount++;
        if (skeleton.length < 16) skeleton.push('n');
      } else if (SET_OPS.has(ch)) {
        setCount++;
        if (skeleton.length < 16) skeleton.push('s');
      } else {
        if (skeleton.length < 16) skeleton.push('c');
      }
    }
  }

  // Cuantificadores: restamos al salir del scope aproximado
  // (simplificado: depth = max alcanzada, no tracking exacto)

  // Extraer átomos con regex
  let m: RegExpExecArray | null;
  IDENT_RE.lastIndex = 0;
  while ((m = IDENT_RE.exec(formula)) !== null) {
    const tok = m[0];
    if (!LOGIC_RESERVED.has(tok)) {
      atomFreq[tok] = (atomFreq[tok] ?? 0) + 1;
      if (skeleton.length < 16) skeleton.push('a');
    }
  }

  // Aritmética también detecta dígitos
  for (const ch of formula) {
    if (ARITH_OPS.has(ch)) {
      arithCount++;
      if (skeleton.length < 16) skeleton.push('n');
    }
  }

  const skeletonHash = fnv1a(skeleton.join(''));

  return {
    connectiveFreq,
    atomFreq,
    quantifierDepth,
    modalCount,
    arithCount,
    setCount,
    totalLen: formula.length,
    parenDepth: maxParenDepth,
    skeletonHash,
  };
}

// --------------- Construcción del vector embedding ---------------------

/**
 * Construye un embedding R^256 determinístico a partir de la fórmula.
 * El vector NO está normalizado aquí — la normalización se hace en
 * `normalizeEmbedding`.
 */
function buildRawEmbedding(features: ASTFeatures, formula: string): Float32Array {
  const vec = new Float32Array(EMBEDDING_DIM);

  // ---- Bloque 1: conectivos (dim 0..15) ----
  // Cada conectivo tiene una posición fija
  const connectiveSlots: Record<string, number> = {
    '∧': 0, '∨': 1, '¬': 2, '→': 3, '↔': 4,
    '□': 5, '◇': 6, '∀': 7, '∃': 8, '=': 9,
    '⊥': 10, '⊤': 11, '⊢': 12, '⇒': 13,
  };
  for (const [sym, slot] of Object.entries(connectiveSlots)) {
    const freq = features.connectiveFreq[sym] ?? 0;
    if (freq > 0) vec[slot] = (vec[slot] ?? 0) + Math.log1p(freq);
  }

  // ---- Bloque 2: átomos hasheados (dim 16..127) ----
  for (const [atom, freq] of Object.entries(features.atomFreq)) {
    // Hash doble para reducir colisiones
    const idx1 = 16 + (strToIndex(atom, 56));
    const idx2 = 72 + (strToIndex(atom, 56));
    const idx3 = 16 + (strToIndexSalted(atom, 'b', 56));
    vec[idx1] = (vec[idx1] ?? 0) + Math.log1p(freq) * 0.5;
    vec[idx2] = (vec[idx2] ?? 0) + Math.log1p(freq) * 0.3;
    vec[idx3] = (vec[idx3] ?? 0) + Math.log1p(freq) * 0.2;
  }

  // ---- Bloque 3: profundidad y métricas estructurales (dim 128..143) ----
  vec[128] = features.quantifierDepth * 0.5;
  vec[129] = Math.log1p(features.modalCount);
  vec[130] = Math.log1p(features.arithCount);
  vec[131] = Math.log1p(features.setCount);
  vec[132] = Math.log1p(features.totalLen) * 0.1;
  vec[133] = features.parenDepth * 0.3;

  // ---- Bloque 4: firma de esqueleto (dim 144..159) ----
  // Esparcimos el hash del esqueleto en 16 posiciones con salts distintos
  for (let i = 0; i < 16; i++) {
    const pos = 144 + i;
    const contrib = Math.sin(features.skeletonHash * (i + 1)) * 0.5 + 0.5;
    vec[pos] = (vec[pos] ?? 0) + contrib;
  }

  // ---- Bloque 5: bigrams de conectivos hasheados (dim 160..191) ----
  // Captura patrones co-ocurrencia entre pares de conectivos
  const connKeys = Object.keys(features.connectiveFreq);
  for (let i = 0; i < connKeys.length; i++) {
    for (let j = i + 1; j < connKeys.length; j++) {
      const pair = (connKeys[i] ?? '') + (connKeys[j] ?? '');
      const pairIdx = 160 + (fnv1a(pair) % 32);
      const freq = Math.min(
        features.connectiveFreq[connKeys[i] ?? ''] ?? 0,
        features.connectiveFreq[connKeys[j] ?? ''] ?? 0,
      );
      vec[pairIdx] = (vec[pairIdx] ?? 0) + Math.log1p(freq) * 0.4;
    }
  }

  // ---- Bloque 6: n-grams de caracteres de la fórmula (dim 192..255) ----
  // Captura la "textura" local de la fórmula
  for (let i = 0; i < formula.length - 1; i++) {
    const bigram = formula[i]! + formula[i + 1]!;
    const pos = 192 + (fnv1a(bigram) % 64);
    vec[pos] = (vec[pos] ?? 0) + 0.1;
  }

  return vec;
}

/** Normaliza un vector a norma L2 = 1. Si la norma es 0 devuelve el vector de ceros. */
export function normalizeEmbedding(vec: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += (vec[i] ?? 0) * (vec[i] ?? 0);
  if (norm === 0) return vec;
  const invNorm = 1 / Math.sqrt(norm);
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = (vec[i] ?? 0) * invNorm;
  return out;
}

/**
 * Genera el embedding de una fórmula/texto.
 *
 * El embedding es:
 *   1. Determinístico (misma entrada → mismo vector)
 *   2. Normalizado L2
 *   3. Sin NaN/Infinity
 *
 * Para queries de texto libre (no fórmulas puras), el texto se trata
 * igual — los átomos y operadores se extraen con las mismas reglas.
 */
export function hashEmbed(text: string): Embedding {
  const features = extractFeatures(text);
  const raw = buildRawEmbedding(features, text);
  return normalizeEmbedding(raw);
}

/**
 * EmbeddingProvider basado en HashEmbedding.
 * Implementa la interfaz EmbeddingProvider para Stage 2.
 */
export class HashEmbeddingProvider implements EmbeddingProvider {
  readonly dim = EMBEDDING_DIM;

  embed(text: string): Embedding {
    return hashEmbed(text);
  }
}

/** Instancia singleton reutilizable. */
export const defaultProvider = new HashEmbeddingProvider();
