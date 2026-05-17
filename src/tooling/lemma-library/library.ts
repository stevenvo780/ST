// ============================================================
// LemmaLibrary — repositorio in-memory de lemas curados con
// filtros por dominio/tag/dificultad, búsqueda keyword y
// recuperación de lemas similares por overlap léxico/estructural.
// ============================================================

import type { CuratedLemma, LemmaDifficulty } from './types';
import { tokenize } from './tokenize';

export interface SearchOptions {
  domain?: string;
  limit?: number;
}

export class LemmaLibrary {
  private byId: Map<string, CuratedLemma> = new Map();
  private byDomainIndex: Map<string, Set<string>> = new Map();
  private byTagIndex: Map<string, Set<string>> = new Map();
  private byDifficultyIndex: Map<LemmaDifficulty, Set<string>> = new Map();

  add(lemma: CuratedLemma): void {
    if (this.byId.has(lemma.id)) {
      throw new Error(`LemmaLibrary: duplicate id ${lemma.id}`);
    }
    this.byId.set(lemma.id, lemma);
    this.indexSet(this.byDomainIndex, lemma.domain, lemma.id);
    for (const tag of lemma.tags) {
      this.indexSet(this.byTagIndex, tag, lemma.id);
    }
    this.indexSet(this.byDifficultyIndex, lemma.difficulty, lemma.id);
  }

  get(id: string): CuratedLemma | undefined {
    return this.byId.get(id);
  }

  byDomain(domain: string): CuratedLemma[] {
    return this.resolve(this.byDomainIndex.get(domain));
  }

  byTag(tag: string): CuratedLemma[] {
    return this.resolve(this.byTagIndex.get(tag));
  }

  byDifficulty(d: LemmaDifficulty): CuratedLemma[] {
    return this.resolve(this.byDifficultyIndex.get(d));
  }

  all(): CuratedLemma[] {
    return Array.from(this.byId.values());
  }

  size(): number {
    return this.byId.size;
  }

  /**
   * Búsqueda por palabra clave: tokeniza la query, asigna score a
   * cada lema según matches en name (peso 3), tags (peso 2) y
   * statement (peso 1). Si `opts.domain` está, filtra antes.
   * Devuelve los top `opts.limit` (default 20).
   */
  search(query: string, opts: SearchOptions = {}): CuratedLemma[] {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];
    const candidates = opts.domain ? this.byDomain(opts.domain) : this.all();
    const scored: Array<{ lemma: CuratedLemma; score: number }> = [];
    for (const lemma of candidates) {
      const nameTokens = tokenize(lemma.name);
      const tagTokens = lemma.tags.flatMap((t) => tokenize(t));
      const statementTokens = tokenize(lemma.statement);
      let score = 0;
      for (const tok of tokens) {
        if (nameTokens.includes(tok)) score += 3;
        if (tagTokens.includes(tok)) score += 2;
        if (statementTokens.includes(tok)) score += 1;
      }
      if (score > 0) scored.push({ lemma, score });
    }
    scored.sort((a, b) => b.score - a.score || a.lemma.id.localeCompare(b.lemma.id));
    const limit = opts.limit ?? 20;
    return scored.slice(0, limit).map((s) => s.lemma);
  }

  /**
   * Recupera lemas similares al dado, ranqueados por overlap de
   * tokens en statement (peso 2) + tags (peso 1). Excluye al propio
   * lema. Default k = 5.
   */
  similar(lemma: CuratedLemma, k = 5): CuratedLemma[] {
    const targetStatementTokens = new Set(tokenize(lemma.statement));
    const targetTags = new Set(lemma.tags);
    const scored: Array<{ lemma: CuratedLemma; score: number }> = [];
    for (const other of this.all()) {
      if (other.id === lemma.id) continue;
      let score = 0;
      for (const tok of tokenize(other.statement)) {
        if (targetStatementTokens.has(tok)) score += 2;
      }
      for (const tag of other.tags) {
        if (targetTags.has(tag)) score += 1;
      }
      if (other.domain === lemma.domain) score += 1;
      if (score > 0) scored.push({ lemma: other, score });
    }
    scored.sort((a, b) => b.score - a.score || a.lemma.id.localeCompare(b.lemma.id));
    return scored.slice(0, k).map((s) => s.lemma);
  }

  private indexSet<K>(index: Map<K, Set<string>>, key: K, id: string): void {
    let bucket = index.get(key);
    if (!bucket) {
      bucket = new Set();
      index.set(key, bucket);
    }
    bucket.add(id);
  }

  private resolve(ids: Set<string> | undefined): CuratedLemma[] {
    if (!ids) return [];
    const out: CuratedLemma[] = [];
    for (const id of ids) {
      const lemma = this.byId.get(id);
      if (lemma) out.push(lemma);
    }
    return out;
  }
}
