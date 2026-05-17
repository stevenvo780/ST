// ============================================================
// LJ Sequent Calculus — Calculo de secuentes intuicionista
// ============================================================
//
// LJ de Gentzen (1934) para logica intuicionista proposicional.
// A diferencia de LK clasico, LJ admite a lo sumo UNA formula
// en el succedente: secuentes de la forma Γ ⊢ φ (con succedente
// no vacio) o Γ ⊢ (succedente vacio). Esta restriccion es lo
// que hace que LJ NO derive ¬¬P → P ni P ∨ ¬P (LEM/DNE
// clasicas).
//
// Reglas (proposicionales):
//   axiom   : A, Γ ⊢ A
//   cut     : Γ ⊢ A     A, Σ ⊢ C    ⟹   Γ, Σ ⊢ C
//   weakL   : Γ ⊢ C                  ⟹   A, Γ ⊢ C
//   contrL  : A, A, Γ ⊢ C            ⟹   A, Γ ⊢ C
//   exL     : permuta a la izquierda
//   notL    : Γ ⊢ A                  ⟹   ¬A, Γ ⊢ C
//   notR    : A, Γ ⊢                 ⟹   Γ ⊢ ¬A     (succedente vacio)
//   andL    : A, B, Γ ⊢ C            ⟹   A∧B, Γ ⊢ C
//   andR    : Γ ⊢ A   y   Γ ⊢ B      ⟹   Γ ⊢ A∧B
//   orL     : A, Γ ⊢ C  y  B, Γ ⊢ C  ⟹   A∨B, Γ ⊢ C
//   orR-l   : Γ ⊢ A                  ⟹   Γ ⊢ A∨B
//   orR-r   : Γ ⊢ B                  ⟹   Γ ⊢ A∨B
//   impL    : Γ ⊢ A   y   B, Γ ⊢ C   ⟹   A→B, Γ ⊢ C
//   impR    : A, Γ ⊢ B               ⟹   Γ ⊢ A→B
//   bottomL : ⊥, Γ ⊢ C               (ex falso quodlibet)
//
// Glivenko (1929): Γ ⊢_LK φ  sii  Γ ⊢_LJ ¬¬φ. La funcion
// `glivenkoEmbed` traduce una formula clasica a su lectura
// intuicionista doble-negada.
//
//   import { proveLJ, hasCut, eliminateCut, isValid, ljToLk, lkToLj, glivenkoEmbed }
//     from 'src/profiles/sequent-lj';

// ============================================================
// Sintaxis
// ============================================================

export type LJFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'not'; arg: LJFormula }
  | { kind: 'and'; left: LJFormula; right: LJFormula }
  | { kind: 'or'; left: LJFormula; right: LJFormula }
  | { kind: 'implies'; left: LJFormula; right: LJFormula }
  | { kind: 'bottom' };

export type LJRule =
  | 'axiom'
  | 'cut'
  | 'weakL'
  | 'contrL'
  | 'exL'
  | 'notL'
  | 'notR'
  | 'andL'
  | 'andR'
  | 'orL'
  | 'orR-l'
  | 'orR-r'
  | 'impL'
  | 'impR'
  | 'bottomL';

/**
 * Secuente intuicionista. `right === null` modela el succedente
 * vacio (necesario para regla `notR` y `bottomL` sin formula
 * conclusion).
 */
export interface LJSequent {
  left: LJFormula[];
  right: LJFormula | null;
}

export interface LJProof {
  goal: LJSequent;
  rule: LJRule;
  premises: LJProof[];
  /** Formula del cut (presente solo cuando `rule === 'cut'`). */
  cutFormula?: LJFormula;
  /** Formula principal a la que se aplica la regla. */
  principalFormula?: LJFormula;
}

// ============================================================
// Utilidades sintacticas
// ============================================================

function ljKey(f: LJFormula): string {
  switch (f.kind) {
    case 'atom':
      return `a:${f.name}`;
    case 'not':
      return `n(${ljKey(f.arg)})`;
    case 'and':
      return `&(${ljKey(f.left)},${ljKey(f.right)})`;
    case 'or':
      return `|(${ljKey(f.left)},${ljKey(f.right)})`;
    case 'implies':
      return `>(${ljKey(f.left)},${ljKey(f.right)})`;
    case 'bottom':
      return '_';
  }
}

function eqF(a: LJFormula, b: LJFormula): boolean {
  return ljKey(a) === ljKey(b);
}

function eqSide(a: LJFormula | null, b: LJFormula | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return eqF(a, b);
}

function removeAt<T>(xs: T[], idx: number): T[] {
  const copy = xs.slice();
  copy.splice(idx, 1);
  return copy;
}

function removeFirstByKey(xs: LJFormula[], key: string): LJFormula[] {
  const idx = xs.findIndex((f) => ljKey(f) === key);
  if (idx === -1) return xs.slice();
  return removeAt(xs, idx);
}

function containsKey(xs: LJFormula[], key: string): boolean {
  return xs.some((f) => ljKey(f) === key);
}

function multisetIncludes(haystack: LJFormula[], needle: LJFormula[]): boolean {
  const counts = new Map<string, number>();
  for (const f of haystack) counts.set(ljKey(f), (counts.get(ljKey(f)) ?? 0) + 1);
  for (const f of needle) {
    const k = ljKey(f);
    const c = counts.get(k) ?? 0;
    if (c <= 0) return false;
    counts.set(k, c - 1);
  }
  return true;
}

function sameMultiset(a: LJFormula[], b: LJFormula[]): boolean {
  if (a.length !== b.length) return false;
  return multisetIncludes(a, b) && multisetIncludes(b, a);
}

function depth(f: LJFormula): number {
  switch (f.kind) {
    case 'atom':
    case 'bottom':
      return 0;
    case 'not':
      return depth(f.arg) + 1;
    case 'and':
    case 'or':
    case 'implies':
      return Math.max(depth(f.left), depth(f.right)) + 1;
  }
}

// ============================================================
// Backward proof search (LJ single-succedent)
// ============================================================
//
// Estrategia: G3i-style con loop-checking. Las reglas invertibles
// (andL, orL, impR, andR, notR, bottomL, axiom) se aplican primero.
// Las no invertibles (orR-l, orR-r, impL, notL) se prueban con
// memoizacion de fallidos.

interface ProveCtx {
  budget: number;
  used: number;
  depth: number;
  maxDepth: number;
  /** Subgoals que ya sabemos fallidos (loop-checking). */
  failed: Set<string>;
  /** Subgoals activos (para detectar ciclos en derivacion). */
  active: Set<string>;
}

function exhausted(ctx: ProveCtx): boolean {
  return ctx.used >= ctx.budget || ctx.depth >= ctx.maxDepth;
}

function seqKey(left: LJFormula[], right: LJFormula | null): string {
  const lkeys = left.map(ljKey).sort().join(',');
  const rkey = right ? ljKey(right) : '_';
  return `${lkeys}|${rkey}`;
}

function isAtomic(f: LJFormula): boolean {
  return f.kind === 'atom' || f.kind === 'bottom';
}

function prove(left: LJFormula[], right: LJFormula | null, ctx: ProveCtx): LJProof | undefined {
  ctx.used++;
  if (exhausted(ctx)) return undefined;

  const key = seqKey(left, right);
  if (ctx.failed.has(key)) return undefined;
  if (ctx.active.has(key)) return undefined;
  ctx.active.add(key);
  ctx.depth++;

  const result = proveInner(left, right, ctx);

  ctx.depth--;
  ctx.active.delete(key);
  if (!result) ctx.failed.add(key);
  return result;
}

function proveInner(
  left: LJFormula[],
  right: LJFormula | null,
  ctx: ProveCtx,
): LJProof | undefined {
  // 1. Axioma: A ∈ Γ y right = A
  if (right) {
    const rkey = ljKey(right);
    if (containsKey(left, rkey)) {
      return {
        goal: { left: left.slice(), right },
        rule: 'axiom',
        premises: [],
        principalFormula: right,
      };
    }
  }

  // 2. bottomL: ⊥ ∈ Γ → cualquier conclusion (incluyendo right=null)
  const bottomIdx = left.findIndex((f) => f.kind === 'bottom');
  if (bottomIdx !== -1) {
    const bf = left[bottomIdx];
    if (bf) {
      return {
        goal: { left: left.slice(), right },
        rule: 'bottomL',
        premises: [],
        principalFormula: bf,
      };
    }
  }

  // 3. Reglas invertibles a la izquierda (no ramificantes salvo orL/andL)
  for (let i = 0; i < left.length; i++) {
    const f = left[i];
    if (!f) continue;
    if (f.kind === 'and') {
      // A∧B, Γ ⊢ C  ↦  A, B, Γ ⊢ C
      const newL = [f.left, f.right, ...removeAt(left, i)];
      const sub = prove(newL, right, ctx);
      if (!sub) return undefined;
      return {
        goal: { left: left.slice(), right },
        rule: 'andL',
        premises: [sub],
        principalFormula: f,
      };
    }
  }

  // 4. Reglas invertibles a la derecha (no ramificantes)
  if (right) {
    if (right.kind === 'and') {
      // Γ ⊢ A∧B  ↦  Γ ⊢ A  y  Γ ⊢ B
      const subA = prove(left, right.left, ctx);
      if (!subA) return undefined;
      const subB = prove(left, right.right, ctx);
      if (!subB) return undefined;
      return {
        goal: { left: left.slice(), right },
        rule: 'andR',
        premises: [subA, subB],
        principalFormula: right,
      };
    }
    if (right.kind === 'implies') {
      // Γ ⊢ A→B  ↦  A, Γ ⊢ B
      const newL = [right.left, ...left];
      const sub = prove(newL, right.right, ctx);
      if (!sub) return undefined;
      return {
        goal: { left: left.slice(), right },
        rule: 'impR',
        premises: [sub],
        principalFormula: right,
      };
    }
    if (right.kind === 'not') {
      // Γ ⊢ ¬A  ↦  A, Γ ⊢ (succedente vacio)
      const newL = [right.arg, ...left];
      const sub = prove(newL, null, ctx);
      if (!sub) return undefined;
      return {
        goal: { left: left.slice(), right },
        rule: 'notR',
        premises: [sub],
        principalFormula: right,
      };
    }
  }

  // 5. Reglas invertibles ramificantes a la izquierda (orL)
  for (let i = 0; i < left.length; i++) {
    const f = left[i];
    if (!f) continue;
    if (f.kind === 'or') {
      const rest = removeAt(left, i);
      const subL = prove([f.left, ...rest], right, ctx);
      if (!subL) continue; // tratar como fallida la rama → no es orL; sigue intentando
      const subR = prove([f.right, ...rest], right, ctx);
      if (!subR) continue;
      return {
        goal: { left: left.slice(), right },
        rule: 'orL',
        premises: [subL, subR],
        principalFormula: f,
      };
    }
  }

  // 6. Regla no invertible a la izquierda: impL  (Dyckhoff G3i, contraction-free)
  //    A→B, Γ ⊢ C  via  Γ' ⊢ A  y  B, Γ' ⊢ C   (Γ' = Γ \ {A→B})
  for (let i = 0; i < left.length; i++) {
    const f = left[i];
    if (!f) continue;
    if (f.kind === 'implies') {
      const rest = removeAt(left, i);
      // Sub-meta 1: Γ' ⊢ A   (sin re-añadir A→B → contraction-free)
      const subA = prove(rest, f.left, ctx);
      if (!subA) continue;
      // Sub-meta 2: B, Γ' ⊢ C
      const subB = prove([f.right, ...rest], right, ctx);
      if (!subB) continue;
      return {
        goal: { left: left.slice(), right },
        rule: 'impL',
        premises: [subA, subB],
        principalFormula: f,
      };
    }
  }

  // 7. Regla no invertible a la izquierda: notL
  //    ¬A, Γ ⊢ C   via   Γ' ⊢ A
  //    Por defecto contraction-free (Γ' = Γ \ {¬A}). Pero cuando el
  //    succedente esta vacio (busqueda de contradiccion para Glivenko)
  //    o cuando esa rama no cierra, intentamos tambien con contraccion
  //    (Γ' = Γ, manteniendo ¬A para usos multiples).
  for (let i = 0; i < left.length; i++) {
    const f = left[i];
    if (!f) continue;
    if (f.kind === 'not') {
      const rest = removeAt(left, i);
      const subA = prove(rest, f.arg, ctx);
      if (subA) {
        return {
          goal: { left: left.slice(), right },
          rule: 'notL',
          premises: [subA],
          principalFormula: f,
        };
      }
      // Variante con contraccion (¬A se mantiene): util para derivar
      // contradicciones donde ¬A se usa multiples veces.
      const subAcontr = prove(left.slice(), f.arg, ctx);
      if (subAcontr) {
        return {
          goal: { left: left.slice(), right },
          rule: 'notL',
          premises: [subAcontr],
          principalFormula: f,
        };
      }
    }
  }

  // 8. Reglas no invertibles a la derecha: orR-l y orR-r
  if (right && right.kind === 'or') {
    const subL = prove(left, right.left, ctx);
    if (subL) {
      return {
        goal: { left: left.slice(), right },
        rule: 'orR-l',
        premises: [subL],
        principalFormula: right,
      };
    }
    const subR = prove(left, right.right, ctx);
    if (subR) {
      return {
        goal: { left: left.slice(), right },
        rule: 'orR-r',
        premises: [subR],
        principalFormula: right,
      };
    }
  }

  // 9. Sin reglas aplicables → no derivable
  if (right === null) {
    // succedente vacio sin ⊥ a la izquierda y sin formulas descomponibles
    const anyComplex = left.some((f) => !isAtomic(f));
    if (!anyComplex) return undefined;
  }
  return undefined;
}

/**
 * Demuestra el secuente `seq` en LJ intuicionista (sin cortes).
 * Devuelve `null` si no encuentra derivacion dentro del budget.
 */
export function proveLJ(seq: LJSequent, options: { budget?: number } = {}): LJProof | null {
  const ctx: ProveCtx = {
    budget: options.budget ?? 10_000,
    used: 0,
    depth: 0,
    maxDepth: 200,
    failed: new Set(),
    active: new Set(),
  };
  const tree = prove(seq.left.slice(), seq.right, ctx);
  return tree ?? null;
}

/** Atajo: ⊢ φ en LJ. */
export function proveLJFormula(
  formula: LJFormula,
  options: { budget?: number } = {},
): LJProof | null {
  return proveLJ({ left: [], right: formula }, options);
}

// ============================================================
// Validacion estructural de derivaciones LJ
// ============================================================

export function isValid(proof: LJProof): boolean {
  const { goal, rule, premises } = proof;
  const L = goal.left;
  const R = goal.right;

  for (const p of premises) {
    if (!isValid(p)) return false;
  }

  switch (rule) {
    case 'axiom': {
      if (premises.length !== 0) return false;
      if (R === null) return false;
      return containsKey(L, ljKey(R));
    }
    case 'bottomL': {
      if (premises.length !== 0) return false;
      return L.some((f) => f.kind === 'bottom');
    }
    case 'cut': {
      if (premises.length !== 2) return false;
      const cf = proof.cutFormula;
      if (!cf) return false;
      const [p1, p2] = premises;
      if (!p1 || !p2) return false;
      // p1: Γ ⊢ A     p2: A, Σ ⊢ C    ⟹    Γ, Σ ⊢ C
      if (!eqSide(p1.goal.right, cf)) return false;
      if (!containsKey(p2.goal.left, ljKey(cf))) return false;
      const gamma = p1.goal.left;
      const sigma = removeFirstByKey(p2.goal.left, ljKey(cf));
      if (!eqSide(p2.goal.right, R)) return false;
      return sameMultiset(L, [...gamma, ...sigma]);
    }
    case 'weakL': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      if (!eqSide(p.goal.right, R)) return false;
      for (let i = 0; i < L.length; i++) {
        const x = L[i];
        if (!x) continue;
        if (sameMultiset(removeAt(L, i), p.goal.left)) return true;
      }
      return false;
    }
    case 'contrL': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      if (!eqSide(p.goal.right, R)) return false;
      // p.goal.left ≡ L con alguna formula duplicada
      for (let i = 0; i < L.length; i++) {
        const x = L[i];
        if (!x) continue;
        const candidate = [x, ...L];
        if (sameMultiset(p.goal.left, candidate)) return true;
      }
      return false;
    }
    case 'exL': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      return sameMultiset(p.goal.left, L) && eqSide(p.goal.right, R);
    }
    case 'notL': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      const pf = proof.principalFormula;
      if (!pf || pf.kind !== 'not') return false;
      // ¬A, Γ ⊢ C   ;   premisa: Γ ⊢ A
      // Aceptamos forma contraction-free (Γ' = Γ \ {¬A}) o con contraccion (Γ' = Γ).
      if (!containsKey(L, ljKey(pf))) return false;
      const gamma = removeFirstByKey(L, ljKey(pf));
      const okCtx = sameMultiset(p.goal.left, gamma) || sameMultiset(p.goal.left, L);
      return okCtx && eqSide(p.goal.right, pf.arg);
    }
    case 'notR': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      const pf = proof.principalFormula;
      if (!pf || pf.kind !== 'not') return false;
      if (!eqSide(R, pf)) return false;
      // premisa: A, Γ ⊢ (vacio)
      if (p.goal.right !== null) return false;
      if (!containsKey(p.goal.left, ljKey(pf.arg))) return false;
      const gamma = removeFirstByKey(p.goal.left, ljKey(pf.arg));
      return sameMultiset(gamma, L);
    }
    case 'andL': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      const pf = proof.principalFormula;
      if (!pf || pf.kind !== 'and') return false;
      if (!containsKey(L, ljKey(pf))) return false;
      const gamma = removeFirstByKey(L, ljKey(pf));
      const expected = [pf.left, pf.right, ...gamma];
      return sameMultiset(p.goal.left, expected) && eqSide(p.goal.right, R);
    }
    case 'andR': {
      if (premises.length !== 2) return false;
      const [p1, p2] = premises;
      if (!p1 || !p2) return false;
      if (!R || R.kind !== 'and') return false;
      const pf = proof.principalFormula ?? R;
      if (pf.kind !== 'and') return false;
      return (
        sameMultiset(p1.goal.left, L) &&
        eqSide(p1.goal.right, pf.left) &&
        sameMultiset(p2.goal.left, L) &&
        eqSide(p2.goal.right, pf.right)
      );
    }
    case 'orL': {
      if (premises.length !== 2) return false;
      const [p1, p2] = premises;
      if (!p1 || !p2) return false;
      const pf = proof.principalFormula;
      if (!pf || pf.kind !== 'or') return false;
      if (!containsKey(L, ljKey(pf))) return false;
      const gamma = removeFirstByKey(L, ljKey(pf));
      const okL =
        containsKey(p1.goal.left, ljKey(pf.left)) &&
        sameMultiset(removeFirstByKey(p1.goal.left, ljKey(pf.left)), gamma) &&
        eqSide(p1.goal.right, R);
      const okR =
        containsKey(p2.goal.left, ljKey(pf.right)) &&
        sameMultiset(removeFirstByKey(p2.goal.left, ljKey(pf.right)), gamma) &&
        eqSide(p2.goal.right, R);
      return okL && okR;
    }
    case 'orR-l': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      if (!R || R.kind !== 'or') return false;
      return sameMultiset(p.goal.left, L) && eqSide(p.goal.right, R.left);
    }
    case 'orR-r': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      if (!R || R.kind !== 'or') return false;
      return sameMultiset(p.goal.left, L) && eqSide(p.goal.right, R.right);
    }
    case 'impL': {
      if (premises.length !== 2) return false;
      const [p1, p2] = premises;
      if (!p1 || !p2) return false;
      const pf = proof.principalFormula;
      if (!pf || pf.kind !== 'implies') return false;
      if (!containsKey(L, ljKey(pf))) return false;
      const gamma = removeFirstByKey(L, ljKey(pf));
      // p1: Γ' ⊢ A   (contraction-free: sin re-añadir A→B)
      const okL = sameMultiset(p1.goal.left, gamma) && eqSide(p1.goal.right, pf.left);
      // p2: B, Γ' ⊢ C
      const okR =
        containsKey(p2.goal.left, ljKey(pf.right)) &&
        sameMultiset(removeFirstByKey(p2.goal.left, ljKey(pf.right)), gamma) &&
        eqSide(p2.goal.right, R);
      return okL && okR;
    }
    case 'impR': {
      if (premises.length !== 1) return false;
      const [p] = premises;
      if (!p) return false;
      if (!R || R.kind !== 'implies') return false;
      // A, Γ ⊢ B
      if (!containsKey(p.goal.left, ljKey(R.left))) return false;
      const gamma = removeFirstByKey(p.goal.left, ljKey(R.left));
      return sameMultiset(gamma, L) && eqSide(p.goal.right, R.right);
    }
  }
}

export function hasCut(proof: LJProof): boolean {
  if (proof.rule === 'cut') return true;
  return proof.premises.some(hasCut);
}

// ============================================================
// Eliminacion de cortes (Hauptsatz para LJ)
// ============================================================
//
// Gentzen (1934) prueba que LJ admite eliminacion de cortes. La
// estrategia aqui combina reducciones principales cuando el cut
// es sobre un conectivo principal en ambas premisas, y usa el
// prover cut-free como oraculo para los casos restantes (cuts
// permutativos / commutativos): si el secuente final es
// derivable, lo es sin cortes por el Hauptsatz.

function eliminateCutAtRoot(proof: LJProof): LJProof {
  if (proof.rule !== 'cut') return proof;
  const [p1, p2] = proof.premises;
  if (!p1 || !p2 || !proof.cutFormula) return proof;
  const A = proof.cutFormula;
  const ak = ljKey(A);

  // Caso axioma: A ⊢ A   cut   A, Σ ⊢ C   ⟹   A, Σ ⊢ C (= p2)
  if (p1.rule === 'axiom' && p1.principalFormula && ljKey(p1.principalFormula) === ak) {
    // p1 prueba (Γ con A) ⊢ A; el cut con p2: A, Σ ⊢ C resulta en p2 con Γ adicional.
    // Si p1 es exactamente "A ⊢ A", la conclusion es Σ ⊢ C = p2.
    return p2;
  }
  if (p2.rule === 'axiom' && p2.principalFormula && ljKey(p2.principalFormula) === ak) {
    return p1;
  }

  const principalOnLeft = p1.principalFormula && ljKey(p1.principalFormula) === ak;
  const principalOnRight = p2.principalFormula && ljKey(p2.principalFormula) === ak;

  if (principalOnLeft && principalOnRight) {
    switch (A.kind) {
      case 'and': {
        // p1 termina en andR: Γ ⊢ A∧B con premisas Γ ⊢ A y Γ ⊢ B
        // p2 termina en andL: A∧B, Σ ⊢ C con premisa A, B, Σ ⊢ C
        // Resultado: cut sobre A y luego sobre B.
        const subA = p1.premises[0];
        const subB = p1.premises[1];
        const subAB = p2.premises[0];
        if (!subA || !subB || !subAB) break;
        const innerCut: LJProof = {
          goal: {
            left: [...subB.goal.left, ...subAB.goal.left.filter((f) => ljKey(f) !== ljKey(A.left))],
            right: subAB.goal.right,
          },
          rule: 'cut',
          cutFormula: A.right,
          premises: [subB, subAB],
        };
        const outerCut: LJProof = {
          goal: proof.goal,
          rule: 'cut',
          cutFormula: A.left,
          premises: [subA, innerCut],
        };
        return eliminateCut(outerCut);
      }
      case 'or': {
        // p1 termina en orR-l (Γ ⊢ A) o orR-r (Γ ⊢ B); p2 termina en orL.
        const subOrR = p1.premises[0];
        const subOrL_left = p2.premises[0]; // A, Σ ⊢ C
        const subOrL_right = p2.premises[1]; // B, Σ ⊢ C
        if (!subOrR || !subOrL_left || !subOrL_right) break;
        if (p1.rule === 'orR-l') {
          // cut sobre A
          const newCut: LJProof = {
            goal: proof.goal,
            rule: 'cut',
            cutFormula: A.left,
            premises: [subOrR, subOrL_left],
          };
          return eliminateCut(newCut);
        }
        if (p1.rule === 'orR-r') {
          const newCut: LJProof = {
            goal: proof.goal,
            rule: 'cut',
            cutFormula: A.right,
            premises: [subOrR, subOrL_right],
          };
          return eliminateCut(newCut);
        }
        break;
      }
      case 'implies': {
        // p1 termina en impR: A, Γ ⊢ B → premisa A, Γ ⊢ B   (objetivo Γ ⊢ A→B)
        // p2 termina en impL: A→B, Σ ⊢ C, premisas Σ ⊢ A y B, Σ ⊢ C
        const subAB = p1.premises[0];
        const subA = p2.premises[0];
        const subC = p2.premises[1];
        if (!subAB || !subA || !subC) break;
        // Cut sobre A: Σ ⊢ A  y  A, Γ ⊢ B  → Σ, Γ ⊢ B
        const cutOnA: LJProof = {
          goal: {
            left: [...subA.goal.left, ...subAB.goal.left.filter((f) => ljKey(f) !== ljKey(A.left))],
            right: subAB.goal.right,
          },
          rule: 'cut',
          cutFormula: A.left,
          premises: [subA, subAB],
        };
        // Cut sobre B: Σ, Γ ⊢ B  y  B, Σ ⊢ C  → Σ, Γ, Σ ⊢ C
        const cutOnB: LJProof = {
          goal: proof.goal,
          rule: 'cut',
          cutFormula: A.right,
          premises: [cutOnA, subC],
        };
        return eliminateCut(cutOnB);
      }
      case 'not': {
        // p1 termina en notR: Γ ⊢ ¬B, premisa B, Γ ⊢ (vacio)
        // p2 termina en notL: ¬B, Σ ⊢ C, premisa Σ ⊢ B
        // Cut sobre B:  Σ ⊢ B  y  B, Γ ⊢  → Σ, Γ ⊢ ... pero el succedente
        // del nuevo cut es null (de p1.premises[0]). Si necesitamos derivar
        // C, debemos primero matar la rama con bottom; mas simple: usar oracle.
        break;
      }
      case 'atom':
      case 'bottom':
        break;
    }
  }

  // Casos restantes: usar el prover cut-free como oraculo.
  const cutFree = proveLJ(proof.goal);
  if (cutFree) return cutFree;
  return proof;
}

export function eliminateCut(proof: LJProof): LJProof {
  const premises = proof.premises.map(eliminateCut);
  const updated: LJProof = { ...proof, premises };

  if (updated.rule !== 'cut') return updated;
  const reduced = eliminateCutAtRoot(updated);

  let cur: LJProof = reduced;
  for (let i = 0; i < 32 && hasCut(cur); i++) {
    cur = { ...cur, premises: cur.premises.map(eliminateCut) };
    if (cur.rule === 'cut') cur = eliminateCutAtRoot(cur);
  }

  if (hasCut(cur)) {
    const cutFree = proveLJ(cur.goal);
    if (cutFree && isValid(cutFree)) return cutFree;
  }
  return cur;
}

// ============================================================
// Relacion LJ ↔ LK
// ============================================================

/**
 * Estructura LK-like para representar el output de `ljToLk`.
 * Mantenemos un shape opaco (`unknown` en la firma publica) para
 * no acoplar perfiles a nivel de tipos.
 */
interface LKLike {
  goal: { left: unknown[]; right: unknown[] };
  rule: string;
  premises: LKLike[];
  cutFormula?: unknown;
  principalFormula?: unknown;
}

function formulaToLKLike(f: LJFormula): unknown {
  // LK no tiene `bottom` en este perfil; lo modelamos como atomo dedicado.
  if (f.kind === 'bottom') return { kind: 'atom', name: '⊥' };
  if (f.kind === 'atom') return { kind: 'atom', name: f.name };
  if (f.kind === 'not') return { kind: 'not', arg: formulaToLKLike(f.arg) };
  if (f.kind === 'and')
    return { kind: 'and', left: formulaToLKLike(f.left), right: formulaToLKLike(f.right) };
  if (f.kind === 'or')
    return { kind: 'or', left: formulaToLKLike(f.left), right: formulaToLKLike(f.right) };
  return { kind: 'implies', left: formulaToLKLike(f.left), right: formulaToLKLike(f.right) };
}

function mapRuleLJtoLK(r: LJRule): string {
  switch (r) {
    case 'orR-l':
    case 'orR-r':
      return 'orR';
    default:
      return r;
  }
}

/**
 * Toda derivacion LJ es tambien una derivacion LK (con succedente
 * a lo sumo unitario). La conversion es estructural: copia el arbol,
 * usa right = [φ] o [] segun el secuente intuicionista, y mapea
 * orR-l/orR-r → orR.
 */
export function ljToLk(proof: LJProof): unknown {
  const convert = (p: LJProof): LKLike => ({
    goal: {
      left: p.goal.left.map(formulaToLKLike),
      right: p.goal.right ? [formulaToLKLike(p.goal.right)] : [],
    },
    rule: mapRuleLJtoLK(p.rule),
    premises: p.premises.map(convert),
    ...(p.cutFormula ? { cutFormula: formulaToLKLike(p.cutFormula) } : {}),
    ...(p.principalFormula ? { principalFormula: formulaToLKLike(p.principalFormula) } : {}),
  });
  return convert(proof);
}

/**
 * Conversion LK → LJ. Falla cuando la derivacion LK usa
 * multisuccedente esencial (ej. LEM, doble negacion clasica).
 * Estrategia: validar que cada secuente del arbol LK tenga
 * succedente |Δ| ≤ 1; si no, rechazar con motivo.
 */
export function lkToLj(lkProof: unknown): LJProof | { rejected: string } {
  if (lkProof === null || typeof lkProof !== 'object') {
    return { rejected: 'entrada no es un LKProof' };
  }
  const lk = lkProof as LKLike;
  if (!lk.goal || !Array.isArray(lk.goal.left) || !Array.isArray(lk.goal.right)) {
    return { rejected: 'estructura LKProof invalida' };
  }
  return convertLKtoLJ(lk);
}

function convertLKtoLJ(lk: LKLike): LJProof | { rejected: string } {
  if (lk.goal.right.length > 1) {
    return {
      rejected: `secuente LK con multisuccedente |Δ|=${lk.goal.right.length}; no traducible a LJ`,
    };
  }
  const premises: LJProof[] = [];
  for (const sub of lk.premises) {
    const r = convertLKtoLJ(sub);
    if ('rejected' in r) return r;
    premises.push(r);
  }
  // Mapear reglas LK → LJ. Reglas exclusivas de LK (weakR, contrR, exR)
  // no tienen analogo intuicionista; las rechazamos.
  const ruleMap: Record<string, LJRule | null> = {
    axiom: 'axiom',
    cut: 'cut',
    weakL: 'weakL',
    weakR: null,
    contrL: 'contrL',
    contrR: null,
    exL: 'exL',
    exR: null,
    notL: 'notL',
    notR: 'notR',
    andL: 'andL',
    andR: 'andR',
    orL: 'orL',
    orR: 'orR-l', // ambiguo: elegimos la rama izquierda por defecto
    impL: 'impL',
    impR: 'impR',
    bottomL: 'bottomL',
  };
  const ljRule = ruleMap[lk.rule];
  if (ljRule === undefined) {
    return { rejected: `regla LK desconocida: ${lk.rule}` };
  }
  if (ljRule === null) {
    return { rejected: `regla ${lk.rule} es exclusiva de LK (multisuccedente)` };
  }
  return {
    goal: {
      left: lk.goal.left.map(lkFormulaToLJ),
      right: lk.goal.right.length === 0 ? null : lkFormulaToLJ(lk.goal.right[0]),
    },
    rule: ljRule,
    premises,
    ...(lk.cutFormula ? { cutFormula: lkFormulaToLJ(lk.cutFormula) } : {}),
    ...(lk.principalFormula ? { principalFormula: lkFormulaToLJ(lk.principalFormula) } : {}),
  };
}

function lkFormulaToLJ(f: unknown): LJFormula {
  if (!f || typeof f !== 'object') {
    return { kind: 'atom', name: '?' };
  }
  const o = f as { kind: string; [k: string]: unknown };
  switch (o.kind) {
    case 'atom':
      return { kind: 'atom', name: typeof o.name === 'string' ? o.name : '?' };
    case 'not':
      return { kind: 'not', arg: lkFormulaToLJ(o.arg) };
    case 'and':
      return { kind: 'and', left: lkFormulaToLJ(o.left), right: lkFormulaToLJ(o.right) };
    case 'or':
      return { kind: 'or', left: lkFormulaToLJ(o.left), right: lkFormulaToLJ(o.right) };
    case 'implies':
      return { kind: 'implies', left: lkFormulaToLJ(o.left), right: lkFormulaToLJ(o.right) };
    default:
      return { kind: 'atom', name: '?' };
  }
}

// ============================================================
// Glivenko: clasico ⊢ φ  sii  intuicionista ⊢ ¬¬φ
// ============================================================
//
// Glivenko (1929) demostro que el fragmento proposicional clasico
// se traduce al intuicionista mediante doble negacion (Glivenko
// embedding). La traduccion mas simple es φ ↦ ¬¬φ.

export function glivenkoEmbed(formula: LJFormula): LJFormula {
  return { kind: 'not', arg: { kind: 'not', arg: formula } };
}

// ============================================================
// Re-exports utiles
// ============================================================

export { ljKey, eqF as ljEq, depth as ljDepth };
