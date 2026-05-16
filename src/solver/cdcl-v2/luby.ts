// Luby sequence — Knuth (1991) / Luby et al. (1993)
// Secuencia: 1, 1, 2, 1, 1, 2, 4, 1, 1, 2, 1, 1, 2, 4, 8, ...
// Usada como cadencia de restart en CDCL (Huang 2007).

/**
 * Calcula el i-ésimo término (1-indexado) de la secuencia de Luby.
 * Para mantener la indexación pública 0-indexada, internamente trabajamos
 * con t = i + 1, aplicando la recurrencia clásica de Knuth (1991):
 *   luby(t) = 2^(k-1)             si t = 2^k - 1
 *   luby(t) = luby(t - 2^(k-1) + 1) si 2^(k-1) ≤ t < 2^k - 1
 */
export function luby(i: number): number {
  if (i < 0 || !Number.isFinite(i)) {
    throw new RangeError(`luby: index debe ser entero >= 0, recibido ${String(i)}`);
  }
  let t = i + 1;
  while (true) {
    // Encontrar la menor potencia tal que 2^k - 1 >= t.
    let pow = 2;
    while (pow - 1 < t) {
      pow *= 2;
    }
    if (pow - 1 === t) return pow >>> 1; // t = 2^k - 1 ⇒ luby = 2^(k-1)
    t = t - (pow >>> 1) + 1;
  }
}

/**
 * Genera los primeros `n` términos de la secuencia de Luby.
 * Útil para tests y previsualización.
 */
export function lubySequence(n: number): number[] {
  const out: number[] = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = luby(i);
  return out;
}

/**
 * Política de restart Luby con multiplicador `base`.
 * Cada paso devuelve cuántos conflictos esperar antes del próximo restart.
 */
export class LubyRestartPolicy {
  private idx = 0;
  constructor(private readonly base: number = 100) {
    if (!(base > 0)) {
      throw new RangeError(`LubyRestartPolicy: base debe ser > 0, recibido ${base}`);
    }
  }

  /** Conflictos hasta el próximo restart (avanza el contador interno). */
  next(): number {
    const n = this.base * luby(this.idx);
    this.idx++;
    return n;
  }

  /** Estado actual (para inspección/tests). */
  get index(): number {
    return this.idx;
  }

  reset(): void {
    this.idx = 0;
  }
}
