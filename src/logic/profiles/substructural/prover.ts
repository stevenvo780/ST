// ============================================================
// Substructural Prover — Linear & Affine (backward search)
// ============================================================
//
// Calculo de secuentes intuicionistico bi-zonal para ILL
// (Intuitionistic Linear Logic) + variante afin:
//
//   Σ ; Γ ⊢ A
//
// donde:
//   - Σ es la "zona unrestricted": contiene los argumentos de `!`
//     ya derelictados. Sobre Σ, contraction y weakening son libres
//     (de modo implicito: Σ se duplica/descarta sin coste).
//   - Γ es la "zona lineal": cada formula debe usarse exactamente
//     una vez (afin: a lo sumo una vez, weakening libre sobre Γ).
//
// Esto evita los loops infinitos del enfoque con regla explicita de
// contraction sobre `!A`, manteniendo expresividad equivalente.
//
// Reglas (clave):
//   axiom              Σ ; A ⊢ A          (linear)
//   axiom (afin)       Σ ; Γ, A ⊢ A       (descartando Γ por weakening)
//   axiom (unrestr.)   Σ, A ; · ⊢ A       (afin) o Σ, A ; · ⊢ A en linear
//                        — copia A desde Σ
//   oneR               Σ ; · ⊢ 1          (Γ vacio en linear; en afin
//                                          tambien con Γ no vacio)
//   oneL               Σ ; Γ, 1 ⊢ C  ↪  Σ ; Γ ⊢ C
//   tensorR            Σ ; Γ1, Γ2 ⊢ A⊗B  ↪  Σ;Γ1 ⊢ A  ∧  Σ;Γ2 ⊢ B
//   tensorL            Σ ; Γ, A⊗B ⊢ C    ↪  Σ ; Γ, A, B ⊢ C
//   lollipopR          Σ ; Γ ⊢ A⊸B       ↪  Σ ; Γ, A ⊢ B
//   lollipopL          Σ;Γ1,Γ2,A⊸B ⊢ C   ↪  Σ;Γ1 ⊢ A  ∧  Σ;Γ2, B ⊢ C
//   withR              Σ ; Γ ⊢ A & B     ↪  Σ;Γ ⊢ A  ∧  Σ;Γ ⊢ B
//   withL1 / withL2    Σ ; Γ, A&B ⊢ C    ↪  Σ ; Γ, A ⊢ C  (o B)
//   plusR1 / plusR2    Σ ; Γ ⊢ A⊕B       ↪  Σ;Γ ⊢ A  (o B)
//   plusL              Σ ; Γ, A⊕B ⊢ C    ↪  Σ;Γ,A ⊢ C  ∧  Σ;Γ,B ⊢ C
//   bangR              Σ ; · ⊢ !A        ↪  Σ ; · ⊢ A
//                       (en linear Γ debe estar vacio; en afin se
//                        permite Γ ⊆ formulas no-bang descartables)
//   bangL (promote)    Σ ; Γ, !A ⊢ C     ↪  Σ, A ; Γ ⊢ C
//                       (mueve A a la zona unrestricted, "abriendo"
//                        contraction y weakening implicitos)

import { LinearFormula, LinearProof, LinearSequent, SequentRule, SubstructuralMode } from './types';

// --- Utilidades de comparacion sintactica ---

export function formulaKey(f: LinearFormula): string {
  switch (f.kind) {
    case 'atom':
      return `a:${f.name}`;
    case 'one':
      return '1';
    case 'tensor':
      return `(${formulaKey(f.left)}*${formulaKey(f.right)})`;
    case 'lollipop':
      return `(${formulaKey(f.left)}-o${formulaKey(f.right)})`;
    case 'with':
      return `(${formulaKey(f.left)}&${formulaKey(f.right)})`;
    case 'plus':
      return `(${formulaKey(f.left)}+${formulaKey(f.right)})`;
    case 'bang':
      return `!${formulaKey(f.arg)}`;
    case 'whynot':
      return `?${formulaKey(f.arg)}`;
  }
}

function eqFormula(a: LinearFormula, b: LinearFormula): boolean {
  return formulaKey(a) === formulaKey(b);
}

function removeAt<T>(arr: T[], idx: number): T[] {
  const copy = arr.slice();
  copy.splice(idx, 1);
  return copy;
}

// --- Particiones de multiset (splitting de contexto lineal) ---
//
// Solo se usa sobre la zona lineal Γ. Σ se hereda completa en ambas
// premisas (porque sus formulas son reutilizables).

function* partitions<T>(gamma: T[]): Generator<[T[], T[]]> {
  const n = gamma.length;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    const left: T[] = [];
    const right: T[] = [];
    for (let i = 0; i < n; i++) {
      const item = gamma[i];
      if (item === undefined) continue;
      if (mask & (1 << i)) left.push(item);
      else right.push(item);
    }
    yield [left, right];
  }
}

// --- Contexto de busqueda ---

interface ProveCtx {
  mode: SubstructuralMode;
  budget: number;
  used: number;
  /** Memo opcional para evitar reexplorar el mismo subgoal. */
  memo: Map<string, LinearProof | null>;
}

function step(ctx: ProveCtx): boolean {
  ctx.used++;
  return ctx.used <= ctx.budget;
}

function goalKey(sigma: LinearFormula[], gamma: LinearFormula[], target: LinearFormula): string {
  // Ordenamos para que multisets distintos en orden no causen miss.
  const s = sigma.map(formulaKey).sort().join('|');
  const g = gamma.map(formulaKey).sort().join('|');
  return `${s}//${g}//${formulaKey(target)}`;
}

// --- Construccion de pruebas ---

function mkProof(
  conclusion: LinearSequent,
  rule: SequentRule,
  premises: LinearProof[],
): LinearProof {
  return { conclusion, rule, premises };
}

/**
 * Construye un secuente "plano" para el `LinearProof`. Las formulas
 * de Σ se preservan como `!A` en el left (notacion: lo que esta en
 * la zona unrestricted entra al secuente como bangs explicitos).
 */
function seqOf(
  sigma: LinearFormula[],
  gamma: LinearFormula[],
  delta: LinearFormula[],
): LinearSequent {
  const left: LinearFormula[] = [];
  for (const s of sigma) left.push({ kind: 'bang', arg: s });
  for (const g of gamma) left.push(g);
  return { left, right: delta.slice() };
}

// --- Predicados sobre formulas ---

function isBang(f: LinearFormula): boolean {
  return f.kind === 'bang';
}

// --- Cierre por axioma ---
//
// Posibles axiomas:
//   (linear) Σ ; A ⊢ A       — Γ es exactamente [A] y matchea target
//   (linear) Σ, A ; · ⊢ A    — A esta en Σ y Γ vacio
//   (afin)   Σ ; Γ ⊢ A       — Γ contiene A; resto se descarta
//                              por weakening implicito
//   (afin)   Σ, A ; Γ ⊢ A    — A en Σ, Γ descartable

function tryAxiom(
  sigma: LinearFormula[],
  gamma: LinearFormula[],
  target: LinearFormula,
  mode: SubstructuralMode,
): LinearProof | undefined {
  // Caso linear estricto.
  if (mode === 'linear') {
    // Γ = [A]
    if (gamma.length === 1 && gamma[0] && eqFormula(gamma[0], target)) {
      return mkProof(seqOf(sigma, gamma, [target]), 'axiom', []);
    }
    // Γ = [] y A esta en Σ.
    if (gamma.length === 0 && sigma.some((s) => eqFormula(s, target))) {
      return mkProof(seqOf(sigma, gamma, [target]), 'axiom', []);
    }
    return undefined;
  }
  // afin: weakening sobre Γ implicito en el axioma.
  const inGamma = gamma.findIndex((g) => eqFormula(g, target));
  if (inGamma >= 0) {
    // Construimos: axiom + weakening por cada formula sobrante.
    let cur: LinearProof = mkProof(seqOf(sigma, [target], [target]), 'axiom', []);
    for (let i = 0; i < gamma.length; i++) {
      if (i === inGamma) continue;
      const extra = gamma[i];
      if (extra === undefined) continue;
      const accGamma = cur.conclusion.left.slice();
      accGamma.push(extra);
      cur = mkProof({ left: accGamma, right: [target] }, 'weakening', [cur]);
    }
    return cur;
  }
  const inSigma = sigma.findIndex((s) => eqFormula(s, target));
  if (inSigma >= 0) {
    // axiom desde Σ + weakening de Γ.
    let cur: LinearProof = mkProof(seqOf(sigma, [], [target]), 'axiom', []);
    for (const g of gamma) {
      const accGamma = cur.conclusion.left.slice();
      accGamma.push(g);
      cur = mkProof({ left: accGamma, right: [target] }, 'weakening', [cur]);
    }
    return cur;
  }
  return undefined;
}

function tryOneR(
  sigma: LinearFormula[],
  gamma: LinearFormula[],
  target: LinearFormula,
  mode: SubstructuralMode,
): LinearProof | undefined {
  if (target.kind !== 'one') return undefined;
  if (gamma.length === 0) {
    return mkProof(seqOf(sigma, [], [target]), 'oneR', []);
  }
  if (mode === 'affine') {
    let cur: LinearProof = mkProof(seqOf(sigma, [], [target]), 'oneR', []);
    for (const g of gamma) {
      const accGamma = cur.conclusion.left.slice();
      accGamma.push(g);
      cur = mkProof({ left: accGamma, right: [target] }, 'weakening', [cur]);
    }
    return cur;
  }
  return undefined;
}

// --- Prover principal ---

function prove(
  sigma: LinearFormula[],
  gamma: LinearFormula[],
  delta: LinearFormula[],
  ctx: ProveCtx,
): LinearProof | undefined {
  if (!step(ctx)) return undefined;
  if (delta.length !== 1) return undefined;
  const target = delta[0];
  if (target === undefined) return undefined;

  const key = goalKey(sigma, gamma, target);
  const cached = ctx.memo.get(key);
  if (cached !== undefined) return cached ?? undefined;
  // Marca temporal contra ciclos sintacticos:
  ctx.memo.set(key, null);

  const ans = proveCore(sigma, gamma, target, ctx);
  ctx.memo.set(key, ans ?? null);
  return ans;
}

function proveCore(
  sigma: LinearFormula[],
  gamma: LinearFormula[],
  target: LinearFormula,
  ctx: ProveCtx,
): LinearProof | undefined {
  // 1. Axiom.
  const ax = tryAxiom(sigma, gamma, target, ctx.mode);
  if (ax) return ax;

  // 2. oneR.
  const o = tryOneR(sigma, gamma, target, ctx.mode);
  if (o) return o;

  // 3. Promover !A de Γ a Σ (bangL): siempre seguro, reduce Γ.
  for (let i = 0; i < gamma.length; i++) {
    const f = gamma[i];
    if (f && f.kind === 'bang') {
      const rest = removeAt(gamma, i);
      const sub = prove([...sigma, f.arg], rest, [target], ctx);
      if (!sub) return undefined;
      return mkProof(seqOf(sigma, gamma, [target]), 'bangL', [sub]);
    }
  }

  // 4. Reglas reversibles del sucedente.

  // lollipopR.
  if (target.kind === 'lollipop') {
    const sub = prove(sigma, [...gamma, target.left], [target.right], ctx);
    if (sub) return mkProof(seqOf(sigma, gamma, [target]), 'lollipopR', [sub]);
    return undefined;
  }

  // withR.
  if (target.kind === 'with') {
    const subA = prove(sigma, gamma, [target.left], ctx);
    if (!subA) return undefined;
    const subB = prove(sigma, gamma, [target.right], ctx);
    if (!subB) return undefined;
    return mkProof(seqOf(sigma, gamma, [target]), 'withR', [subA, subB]);
  }

  // bangR: en linear, Γ debe estar vacio; en afin, Γ debe ser
  // descartable (todo no-bang en Γ se weakenea, pero ya promovimos
  // todos los !A a Σ al inicio, asi que Γ aqui es no-bang).
  if (target.kind === 'bang') {
    if (gamma.length === 0) {
      const sub = prove(sigma, [], [target.arg], ctx);
      if (sub) return mkProof(seqOf(sigma, [], [target]), 'bangR', [sub]);
      return undefined;
    }
    if (ctx.mode === 'affine') {
      // Descartar todo Γ por weakening.
      const sub = prove(sigma, [], [target.arg], ctx);
      if (sub) {
        const bangProof = mkProof(seqOf(sigma, [], [target]), 'bangR', [sub]);
        // Aplicar weakenings.
        let cur = bangProof;
        for (const g of gamma) {
          const accGamma = cur.conclusion.left.slice();
          accGamma.push(g);
          cur = mkProof({ left: accGamma, right: [target] }, 'weakening', [cur]);
        }
        return cur;
      }
    }
    // En linear con Γ no vacio, bangR no aplica directamente.
  }

  // 5. Reglas reversibles de la izquierda (sobre Γ).

  // tensorL.
  for (let i = 0; i < gamma.length; i++) {
    const f = gamma[i];
    if (f && f.kind === 'tensor') {
      const rest = removeAt(gamma, i);
      const sub = prove(sigma, [...rest, f.left, f.right], [target], ctx);
      if (!sub) return undefined;
      return mkProof(seqOf(sigma, gamma, [target]), 'tensorL', [sub]);
    }
  }

  // oneL.
  for (let i = 0; i < gamma.length; i++) {
    const f = gamma[i];
    if (f && f.kind === 'one') {
      const rest = removeAt(gamma, i);
      const sub = prove(sigma, rest, [target], ctx);
      if (!sub) return undefined;
      return mkProof(seqOf(sigma, gamma, [target]), 'oneL', [sub]);
    }
  }

  // plusL.
  for (let i = 0; i < gamma.length; i++) {
    const f = gamma[i];
    if (f && f.kind === 'plus') {
      const rest = removeAt(gamma, i);
      const subA = prove(sigma, [...rest, f.left], [target], ctx);
      if (!subA) continue;
      const subB = prove(sigma, [...rest, f.right], [target], ctx);
      if (!subB) continue;
      return mkProof(seqOf(sigma, gamma, [target]), 'plusL', [subA, subB]);
    }
  }

  // 6. Reglas no-reversibles del sucedente.

  // tensorR: parte Γ; Σ se hereda completa a ambos lados.
  if (target.kind === 'tensor') {
    for (const [g1, g2] of partitions(gamma)) {
      const subA = prove(sigma, g1, [target.left], ctx);
      if (!subA) continue;
      const subB = prove(sigma, g2, [target.right], ctx);
      if (!subB) continue;
      return mkProof(seqOf(sigma, gamma, [target]), 'tensorR', [subA, subB]);
    }
    return undefined;
  }

  // plusR.
  if (target.kind === 'plus') {
    const left = prove(sigma, gamma, [target.left], ctx);
    if (left) return mkProof(seqOf(sigma, gamma, [target]), 'plusR1', [left]);
    const right = prove(sigma, gamma, [target.right], ctx);
    if (right) return mkProof(seqOf(sigma, gamma, [target]), 'plusR2', [right]);
    return undefined;
  }

  // 7. Reglas no-reversibles de la izquierda.

  // withL1/2.
  for (let i = 0; i < gamma.length; i++) {
    const f = gamma[i];
    if (f && f.kind === 'with') {
      const rest = removeAt(gamma, i);
      const subA = prove(sigma, [...rest, f.left], [target], ctx);
      if (subA) return mkProof(seqOf(sigma, gamma, [target]), 'withL1', [subA]);
      const subB = prove(sigma, [...rest, f.right], [target], ctx);
      if (subB) return mkProof(seqOf(sigma, gamma, [target]), 'withL2', [subB]);
    }
  }

  // lollipopL: parte Γ (sin contar el ⊸).
  for (let i = 0; i < gamma.length; i++) {
    const f = gamma[i];
    if (f && f.kind === 'lollipop') {
      const rest = removeAt(gamma, i);
      for (const [g1, g2] of partitions(rest)) {
        const subA = prove(sigma, g1, [f.left], ctx);
        if (!subA) continue;
        const subB = prove(sigma, [...g2, f.right], [target], ctx);
        if (!subB) continue;
        return mkProof(seqOf(sigma, gamma, [target]), 'lollipopL', [subA, subB]);
      }
    }
  }

  // 8. Reglas sobre Σ (zona unrestricted).
  //
  // Dereliction implicita: copiamos una formula de Σ a Γ.
  //
  // Esto es la combinacion clasica de bangL + contraction:
  //   Σ, A ; Γ ⊢ C  ↪  Σ, A ; Γ, A ⊢ C
  //
  // Para evitar loops, solo copiamos si la formula no aparece ya en
  // Γ Y el contexto lineal no es "saturado" respecto a esa formula.
  // Como heuristica simple, limitamos a una copia por formula de Σ
  // por subgoal sintactico (la memoizacion corta el resto).

  for (let i = 0; i < sigma.length; i++) {
    const f = sigma[i];
    if (f === undefined) continue;
    // Si Γ ya contiene esta formula, copiar de nuevo es contraccion.
    // Permitimos hasta un numero acotado por la "demanda" del target:
    // si el target es lineal-puro, no necesitamos > #atomos(target).
    const currentCopies = gamma.filter((g) => eqFormula(g, f)).length;
    const cap = countAtomDemand(target);
    if (currentCopies >= cap) continue;
    const sub = prove(sigma, [...gamma, f], [target], ctx);
    if (sub) {
      // Etiquetamos como derelictionL (con contraction implicita).
      return mkProof(seqOf(sigma, gamma, [target]), 'derelictionL', [sub]);
    }
  }

  // 9. Weakening sobre Γ no-bang en afin (descartar recursos sobrantes).
  if (ctx.mode === 'affine') {
    for (let i = 0; i < gamma.length; i++) {
      const f = gamma[i];
      if (f && !isBang(f)) {
        const rest = removeAt(gamma, i);
        const sub = prove(sigma, rest, [target], ctx);
        if (sub) {
          return mkProof(seqOf(sigma, gamma, [target]), 'weakening', [sub]);
        }
      }
    }
  }

  return undefined;
}

/**
 * Cota heuristica sobre cuantas copias de un mismo recurso pueden
 * necesitarse para probar `target`. Cuenta ocurrencias de atomos y
 * permite un margen pequeno por estructura adicional. Esto acota la
 * dereliction-con-contraction sin perder casos validos.
 */
function countAtomDemand(target: LinearFormula): number {
  let count = 0;
  const stack: LinearFormula[] = [target];
  while (stack.length > 0) {
    const f = stack.pop();
    if (!f) continue;
    switch (f.kind) {
      case 'atom':
        count++;
        break;
      case 'one':
        break;
      case 'tensor':
      case 'with':
      case 'plus':
      case 'lollipop':
        stack.push(f.left, f.right);
        break;
      case 'bang':
      case 'whynot':
        stack.push(f.arg);
        break;
    }
  }
  // Margen de seguridad: al menos 2 para permitir A ⊗ A desde !A.
  return Math.max(count, 2);
}

// --- API publica ---

export interface ProveOptions {
  budget?: number;
}

export interface ProveResult {
  provable: boolean;
  proof?: LinearProof;
}

function proveWithMode(
  seqInput: LinearSequent,
  mode: SubstructuralMode,
  options: ProveOptions = {},
): ProveResult {
  const ctx: ProveCtx = {
    mode,
    budget: options.budget ?? 50_000,
    used: 0,
    memo: new Map(),
  };
  // Particionamos el left input en (sigma, gamma): los !A iniciales
  // pueden empezar en sigma o en gamma. Por uniformidad, todo arranca
  // en gamma; bangL los promueve a sigma en la primera oportunidad.
  const tree = prove([], seqInput.left.slice(), seqInput.right.slice(), ctx);
  if (!tree) return { provable: false };
  return { provable: true, proof: tree };
}

export function proveLinear(seqInput: LinearSequent, options?: ProveOptions): LinearProof | null {
  const r = proveWithMode(seqInput, 'linear', options);
  return r.proof ?? null;
}

export function proveAffine(seqInput: LinearSequent, options?: ProveOptions): LinearProof | null {
  const r = proveWithMode(seqInput, 'affine', options);
  return r.proof ?? null;
}

export function proofToString(p: LinearProof, indent = 0): string {
  const pad = '  '.repeat(indent);
  const left = p.conclusion.left.map(formulaKey).join(', ') || '·';
  const right = p.conclusion.right.map(formulaKey).join(', ') || '·';
  const head = `${pad}${left} ⊢ ${right}    [${p.rule}]`;
  const tail = p.premises.map((pr) => proofToString(pr, indent + 1)).join('\n');
  return tail ? `${head}\n${tail}` : head;
}
