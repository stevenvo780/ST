// VSIDS (Variable State Independent Decaying Sum) — Moskewicz et al. (2001)
// + EVSIDS (Exponential VSIDS) con rescaling para evitar overflow (MiniSat 2.0+).
//
// Cada conflicto bumpea las variables que aparecen en la cláusula aprendida.
// El `varInc` se incrementa periódicamente (cada conflicto) mediante división
// por VAR_DECAY, lo que efectivamente decae las activities viejas relativas a
// las nuevas — equivalente matemáticamente a multiplicar todo el array por
// VAR_DECAY pero O(1) en vez de O(n).

const RESCALE_THRESHOLD = 1e100;
const RESCALE_FACTOR = 1e-100;

export class VSIDS {
  readonly activity: Float64Array;
  readonly numVars: number;
  private varInc = 1.0;
  private readonly decay: number;

  constructor(numVars: number, decay: number = 0.95) {
    if (numVars < 0 || !Number.isInteger(numVars)) {
      throw new RangeError(`VSIDS: numVars inválido ${numVars}`);
    }
    if (!(decay > 0 && decay <= 1)) {
      throw new RangeError(`VSIDS: decay debe estar en (0, 1], recibido ${decay}`);
    }
    this.numVars = numVars;
    this.decay = decay;
    this.activity = new Float64Array(numVars + 1);
  }

  /** Inicializa activities por frecuencia de aparición en las cláusulas dadas. */
  initFromClauses(clauses: ReadonlyArray<Int32Array>): void {
    for (const c of clauses) {
      for (let i = 0; i < c.length; i++) {
        const v = Math.abs(c[i] ?? 0);
        if (v > 0 && v <= this.numVars) this.activity[v] += 1.0;
      }
    }
  }

  /** Incrementa la activity de la variable y dispara rescaling si hace falta. */
  bump(v: number): void {
    if (v <= 0 || v > this.numVars) return;
    this.activity[v] += this.varInc;
    if (this.activity[v] > RESCALE_THRESHOLD) this.rescale();
  }

  /** Aumenta varInc para que próximos bumps pesen más (decay efectivo). */
  decayStep(): void {
    this.varInc /= this.decay;
    if (this.varInc > RESCALE_THRESHOLD) this.rescale();
  }

  /** Variable libre (varVal[v]==0) con mayor activity, 0 si no hay. */
  pick(varVal: Int8Array): number {
    let best = 0;
    let bestAct = -1;
    for (let v = 1; v <= this.numVars; v++) {
      if (varVal[v] === 0 && this.activity[v] > bestAct) {
        bestAct = this.activity[v];
        best = v;
      }
    }
    return best;
  }

  /** Acceso al incremento actual (para tests). */
  get currentInc(): number {
    return this.varInc;
  }

  private rescale(): void {
    for (let i = 1; i <= this.numVars; i++) this.activity[i] *= RESCALE_FACTOR;
    this.varInc *= RESCALE_FACTOR;
  }
}
