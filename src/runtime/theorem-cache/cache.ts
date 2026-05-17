import { promises as fsp } from 'fs';
import path from 'path';
import os from 'os';
import { createHash } from 'crypto';
import { canonicalize, computeSubstitution, applySubstitution } from './canonical';
import { matchPattern } from './pattern';

export interface CachedTheorem {
  /** Hash determinista derivado de (normalizedFormula, profile). */
  id: string;
  formula: string;
  /** Forma canónica con identificadores normalizados a `?0`, `?1`, … */
  normalizedFormula: string;
  profile: string;
  /** Prueba opaca (ProofTree / NJProof / sequent / …). */
  proof: unknown;
  /** Nombre de la función de verificación, para re-verify. */
  verifier?: string;
  metadata: {
    provedAt: string;
    ms: number;
    provedBy?: string;
  };
}

export interface CacheOptions {
  /** Cap de entradas; LRU. Default 10000. */
  maxEntries?: number;
  /**
   * Ruta del archivo de persistencia (JSON). Default
   * `~/.st-theorem-cache/theorems.json`.
   */
  persistPath?: string;
  /** Hash function (default sha1 hex). */
  hashFn?: (formula: string) => string;
}

export interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  storedBytes: number;
}

export interface ReuseResult {
  reusable: boolean;
  substitution?: Record<string, string>;
  reusedProof?: unknown;
}

function defaultPersistPath(): string {
  return path.join(os.homedir(), '.st-theorem-cache', 'theorems.json');
}

function defaultHash(input: string): string {
  return createHash('sha1').update(input).digest('hex');
}

interface StoreEntry {
  theorem: CachedTheorem;
}

export class TheoremCache {
  private readonly maxEntries: number;
  private readonly persistPath: string;
  private readonly hashFn: (input: string) => string;

  private entries = new Map<string, StoreEntry>();
  private hits = 0;
  private misses = 0;

  constructor(opts?: CacheOptions) {
    this.maxEntries = opts?.maxEntries ?? 10000;
    this.persistPath = opts?.persistPath ?? defaultPersistPath();
    this.hashFn = opts?.hashFn ?? defaultHash;
  }

  /**
   * Canonicaliza una fórmula a forma estable (placeholders).
   */
  canonicalize(formula: string): string {
    return canonicalize(formula).canonical;
  }

  /**
   * Almacena un teorema; retorna el id asignado. Si ya existe una
   * entrada con el mismo (formula canónica, profile), la reemplaza
   * y la promueve a MRU.
   */
  store(theorem: Omit<CachedTheorem, 'id'>): string {
    const normalized =
      theorem.normalizedFormula && theorem.normalizedFormula.length > 0
        ? theorem.normalizedFormula
        : this.canonicalize(theorem.formula);

    const id = this.hashFn(`${theorem.profile}::${normalized}`);
    const full: CachedTheorem = { ...theorem, normalizedFormula: normalized, id };

    if (this.entries.has(id)) {
      this.entries.delete(id);
    } else if (this.entries.size >= this.maxEntries) {
      this.evictLru();
    }

    this.entries.set(id, { theorem: full });
    return id;
  }

  /**
   * Devuelve el teorema cacheado para una fórmula+profile dados, o
   * `undefined` si no existe. Incrementa hits/misses.
   */
  retrieve(formula: string, profile: string): CachedTheorem | undefined {
    const normalized = this.canonicalize(formula);
    const id = this.hashFn(`${profile}::${normalized}`);
    const entry = this.entries.get(id);
    if (entry === undefined) {
      this.misses++;
      return undefined;
    }
    this.hits++;
    // LRU promote.
    this.entries.delete(id);
    this.entries.set(id, entry);
    return entry.theorem;
  }

  /**
   * Retorna todos los teoremas que matchean el patrón dado.
   *
   * El patrón usa metavariables `?x`. Ej: `?x -> ?x` matchea cualquier
   * teorema cacheado cuya fórmula sea `<id> -> <id>` (mismo lado).
   *
   * El matching opera sobre la fórmula original (no la canónica), de
   * modo que el caller puede inspeccionar los nombres reales.
   */
  retrieveByPattern(pattern: string): CachedTheorem[] {
    const out: CachedTheorem[] = [];
    for (const { theorem } of this.entries.values()) {
      if (matchPattern(pattern, theorem.formula) !== undefined) {
        out.push(theorem);
      }
    }
    return out;
  }

  /**
   * Comprueba si existe una entrada para (formula, profile). NO afecta
   * los contadores hits/misses.
   */
  exists(formula: string, profile: string): boolean {
    const normalized = this.canonicalize(formula);
    const id = this.hashFn(`${profile}::${normalized}`);
    return this.entries.has(id);
  }

  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  clear(): void {
    this.entries.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async saveToDisk(): Promise<void> {
    const dir = path.dirname(this.persistPath);
    await fsp.mkdir(dir, { recursive: true });

    const payload: CachedTheorem[] = [];
    for (const { theorem } of this.entries.values()) payload.push(theorem);

    await fsp.writeFile(this.persistPath, JSON.stringify(payload), 'utf-8');
  }

  /**
   * Carga teoremas desde disco. Devuelve cuántas entradas cargó.
   * No-op silencioso si el archivo no existe.
   */
  async loadFromDisk(): Promise<number> {
    let raw: string;
    try {
      raw = await fsp.readFile(this.persistPath, 'utf-8');
    } catch {
      return 0;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return 0;
    }

    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const t = item as Partial<CachedTheorem>;
      if (
        typeof t.id !== 'string' ||
        typeof t.formula !== 'string' ||
        typeof t.normalizedFormula !== 'string' ||
        typeof t.profile !== 'string' ||
        !t.metadata ||
        typeof t.metadata !== 'object'
      ) {
        continue;
      }
      if (this.entries.has(t.id)) continue;
      if (this.entries.size >= this.maxEntries) break;
      this.entries.set(t.id, { theorem: t as CachedTheorem });
      loaded++;
    }
    return loaded;
  }

  stats(): CacheStats {
    let bytes = 0;
    for (const { theorem } of this.entries.values()) {
      bytes += JSON.stringify(theorem).length;
    }
    return {
      entries: this.entries.size,
      hits: this.hits,
      misses: this.misses,
      storedBytes: bytes,
    };
  }

  private evictLru(): void {
    const firstKey = this.entries.keys().next().value;
    if (firstKey !== undefined) this.entries.delete(firstKey);
  }
}

/**
 * Intenta reusar la prueba de un teorema cacheado para un target
 * dado. Si las fórmulas son canónicamente equivalentes (misma
 * estructura, identificadores en el mismo orden), calcula la
 * substitución y reemplaza los nombres en la prueba (cuando la
 * prueba es un string o un objeto JSON que la admita textualmente).
 *
 * Para pruebas opacas no-string, devuelve la prueba original sin
 * tocar — el caller es responsable de re-instanciar.
 */
export function tryReuseProof(theorem: CachedTheorem, targetFormula: string): ReuseResult {
  const substitution = computeSubstitution(theorem.formula, targetFormula);
  if (substitution === undefined) {
    return { reusable: false };
  }

  let reusedProof: unknown = theorem.proof;
  if (typeof theorem.proof === 'string') {
    reusedProof = applySubstitution(theorem.proof, substitution);
  } else if (theorem.proof && typeof theorem.proof === 'object') {
    // Substitución textual sobre la serialización JSON.
    try {
      const serialized = JSON.stringify(theorem.proof);
      const rewritten = applySubstitution(serialized, substitution);
      reusedProof = JSON.parse(rewritten);
    } catch {
      reusedProof = theorem.proof;
    }
  }

  return { reusable: true, substitution, reusedProof };
}
