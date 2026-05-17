// ============================================================
// RNG determinista (mulberry32) — para seedable exercises
// ============================================================

export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0 || 1;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) {
      throw new Error('SeededRng.pick: array vacío');
    }
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
}

let globalCounter = 0;

export function autoSeed(): number {
  globalCounter = (globalCounter + 1) | 0;
  const t = Date.now() & 0xffffffff;
  return (t ^ (globalCounter * 0x9e3779b1)) | 0;
}
