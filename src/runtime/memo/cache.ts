import { promises as fsp } from 'fs';
import path from 'path';
import os from 'os';
import { Formula, RunResult } from '../../types';
import { hashFormula } from './hash';

export interface MemoOptions {
  maxEntries?: number;
  persistPath?: string;
  ttlMs?: number;
}

export interface MemoStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

interface CacheEntry {
  result: RunResult;
  expiresAt: number | null;
}

function defaultPersistPath(): string {
  return path.join(os.homedir(), '.st-cache', 'derivations.json');
}

export type { RunResult as EvalResult };

export class DerivationCache {
  private readonly maxEntries: number;
  private readonly persistPath: string | null;
  private readonly ttlMs: number | null;

  private store = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(opts?: MemoOptions) {
    this.maxEntries = opts?.maxEntries ?? 1000;
    this.persistPath = opts?.persistPath !== undefined ? opts.persistPath : null;
    this.ttlMs = opts?.ttlMs !== undefined ? opts.ttlMs : null;
  }

  get(formula: Formula): RunResult | undefined {
    const key = hashFormula(formula);
    const entry = this.store.get(key);

    if (entry === undefined) {
      this.misses++;
      return undefined;
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    this.lruPromote(key, entry);
    return entry.result;
  }

  set(formula: Formula, result: RunResult): void {
    const key = hashFormula(formula);

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      this.evictLru();
    }

    const expiresAt = this.ttlMs !== null ? Date.now() + this.ttlMs : null;
    this.store.set(key, { result, expiresAt });
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  stats(): MemoStats {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.store.size,
    };
  }

  async loadFromDisk(): Promise<void> {
    const filePath = this.persistPath ?? defaultPersistPath();
    let raw: string;
    try {
      raw = await fsp.readFile(filePath, 'utf-8');
    } catch {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (!Array.isArray(parsed)) return;

    const now = Date.now();
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const rawKey = record['key'];
      if (typeof rawKey !== 'string' || rawKey === '') continue;
      if (!record['result'] || typeof record['result'] !== 'object') continue;
      const rawExpires = record['expiresAt'];
      const expiresAt = typeof rawExpires === 'number' ? rawExpires : null;

      if (expiresAt !== null && now > expiresAt) continue;

      const key = rawKey;
      if (!this.store.has(key) && this.store.size < this.maxEntries) {
        this.store.set(key, { result: record['result'] as RunResult, expiresAt });
      }
    }
  }

  async saveToDisk(): Promise<void> {
    const filePath = this.persistPath ?? defaultPersistPath();
    const dir = path.dirname(filePath);
    await fsp.mkdir(dir, { recursive: true });

    const entries: Array<{ key: string; result: RunResult; expiresAt: number | null }> = [];
    for (const [key, entry] of this.store) {
      entries.push({ key, result: entry.result, expiresAt: entry.expiresAt });
    }

    await fsp.writeFile(filePath, JSON.stringify(entries), 'utf-8');
  }

  private lruPromote(key: string, entry: CacheEntry): void {
    this.store.delete(key);
    this.store.set(key, entry);
  }

  private evictLru(): void {
    const firstKey = this.store.keys().next().value;
    if (firstKey !== undefined) {
      this.store.delete(firstKey);
      this.evictions++;
    }
  }
}
