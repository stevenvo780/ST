// ============================================================
// ST Lemma synthesis — Theory exploration tipo QuickSpec
// ============================================================
// Dada una signatura (sorts, constantes, funciones, predicados) y
// un evaluador semántico, sintetizamos conjeturas/lemmas
// automáticamente:
//
//   1. Enumeramos términos hasta cierta profundidad por sort.
//   2. Para cada par de términos de igual sort generamos una
//      conjetura `t1 = t2`.
//   3. Evaluamos sobre N valuaciones aleatorias. Si todas pasan,
//      la conjetura sobrevive (confidence ≈ 1 − falsificability).
//   4. Pruning: eliminamos trivialidades (t = t), conmutativas
//      duplicadas (t1 = t2 vs t2 = t1) y consecuencias triviales
//      (renombrado de variables, substitución de instancias).
//   5. Verificación opcional via prover externo.
//
// Esta es la idea original de QuickSpec / Hipster aplicada a
// términos cualesquiera, sin asumir un dominio fijo. El usuario
// provee el evaluador.
// ============================================================

// ── Signatura y términos ────────────────────────────────────

/**
 * Algebraic signature for lemma synthesis: declares sorts, constants,
 * functions (with argument and result sorts) and predicates.
 * The synthesizer enumerates terms and conjectures equalities based on this.
 */
export interface Signature {
  sorts: string[];
  constants: Array<{ name: string; sort: string }>;
  functions: Array<{ name: string; argSorts: string[]; resultSort: string }>;
  predicates: Array<{ name: string; argSorts: string[] }>;
}

/**
 * Término interno. Lo mantenemos discriminado para podarlo
 * y serializarlo sin ambigüedad.
 */
export type Term =
  | { kind: 'var'; name: string; sort: string }
  | { kind: 'const'; name: string; sort: string }
  | { kind: 'app'; name: string; args: Term[]; sort: string };

/**
 * A synthesized equality conjecture `∀vars. termLeft = termRight`.
 * `confidence = 1` means all random tests passed; smaller values indicate partial evidence.
 */
export interface Conjecture {
  variables: Array<{ name: string; sort: string }>;
  formula: string;
  confidence: number;
  termLeft?: Term;
  termRight?: Term;
}

/** Options controlling synthesis depth, test count, and randomness. */
export interface SynthesisOptions {
  /** Maximum term depth for enumeration (default 2). */
  maxDepth?: number;
  /** Number of random valuations to test each conjecture (default 100). */
  numTests?: number;
  /** Maximum number of conjectures to return (default 200). */
  maxConjectures?: number;
  /** Generador de valuaciones aleatorias por sort */
  randomValue?: (sort: string, rng: () => number) => unknown;
  /** Variables disponibles por sort (default: 2 por sort) */
  varsPerSort?: number;
  /** Semilla para PRNG determinístico */
  seed?: number;
}

// ── Helpers de impresión ────────────────────────────────────

/** Serializes a term to a human-readable string, using infix notation for binary operators. */
export function termToString(t: Term): string {
  switch (t.kind) {
    case 'var':
    case 'const':
      return t.name;
    case 'app':
      if (t.args.length === 0) return t.name;
      // Notación infija para nombres "simbólicos" binarios
      if (t.args.length === 2 && /^[+\-*/^∧∨↔→=<>≤≥&|]+$/.test(t.name)) {
        return `(${termToString(t.args[0])} ${t.name} ${termToString(t.args[1])})`;
      }
      if (t.args.length === 1 && /^[¬!~]+$/.test(t.name)) {
        return `${t.name}${termToString(t.args[0])}`;
      }
      return `${t.name}(${t.args.map(termToString).join(', ')})`;
  }
}

const termKeyMemo = new WeakMap<object, string>();
function termKey(t: Term): string {
  if (typeof t !== 'object' || t === null) return String(t);
  const cached = termKeyMemo.get(t);
  if (cached !== undefined) return cached;
  let k: string;
  switch (t.kind) {
    case 'var':
      k = `v:${t.name}:${t.sort}`;
      break;
    case 'const':
      k = `c:${t.name}:${t.sort}`;
      break;
    case 'app':
      k = `a:${t.name}(${t.args.map(termKey).join(',')})`;
      break;
  }
  termKeyMemo.set(t, k);
  return k;
}

/** Lista las variables que aparecen en un término, en orden de primera aparición */
export function freeVars(t: Term): Array<{ name: string; sort: string }> {
  const seen = new Set<string>();
  const result: Array<{ name: string; sort: string }> = [];
  const walk = (u: Term): void => {
    if (u.kind === 'var') {
      if (!seen.has(u.name)) {
        seen.add(u.name);
        result.push({ name: u.name, sort: u.sort });
      }
      return;
    }
    if (u.kind === 'app') {
      for (const a of u.args) walk(a);
    }
  };
  walk(t);
  return result;
}

// ── PRNG determinístico simple (mulberry32) ─────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Enumeración de términos ─────────────────────────────────

/**
 * Enumera todos los términos cerrados (sobre constantes + variables
 * declaradas) del sort dado, hasta `depth`. Profundidad 0 = solo
 * variables y constantes; cada nivel agrega aplicaciones cuyos
 * argumentos provienen de niveles inferiores.
 */
export function enumerateTerms(
  sig: Signature,
  sort: string,
  depth: number,
  variables: Array<{ name: string; sort: string }> = defaultVariables(sig),
): Term[] {
  if (depth < 0) return [];

  // Memo por (sort, depth)
  const cache = new Map<string, Term[]>();

  const buildBase = (s: string): Term[] => {
    const out: Term[] = [];
    for (const v of variables) {
      if (v.sort === s) out.push({ kind: 'var', name: v.name, sort: s });
    }
    for (const c of sig.constants) {
      if (c.sort === s) out.push({ kind: 'const', name: c.name, sort: s });
    }
    return out;
  };

  const at = (s: string, d: number): Term[] => {
    const key = `${s}@${d}`;
    const cached = cache.get(key);
    if (cached) return cached;

    if (d <= 0) {
      const base = buildBase(s);
      cache.set(key, base);
      return base;
    }

    // Niveles previos (inclusivo): todos los términos de sort s con profundidad < d
    const prev = at(s, d - 1);
    const result: Term[] = [...prev];

    for (const f of sig.functions) {
      if (f.resultSort !== s) continue;
      // Cartesiano de argumentos en niveles ≤ d − 1
      const argPools = f.argSorts.map((as) => at(as, d - 1));
      // Evitar explosión catastrófica
      const totalSize = argPools.reduce((acc, p) => acc * p.length, 1);
      if (totalSize > 50_000) continue;
      const idx = new Array(f.argSorts.length).fill(0) as number[];
      const allEmpty = argPools.some((p) => p.length === 0);
      if (allEmpty) continue;
      while (true) {
        const args = idx.map((i, k) => argPools[k][i]);
        // Al menos un argumento debe usar el nivel d − 1 estricto para
        // ser "nuevo"; pero por simplicidad y para inclusividad, dejamos
        // todos. Deduplicamos luego por clave.
        result.push({ kind: 'app', name: f.name, args, sort: s });
        let carry = idx.length - 1;
        while (carry >= 0) {
          idx[carry]++;
          if (idx[carry] < argPools[carry].length) break;
          idx[carry] = 0;
          carry--;
        }
        if (carry < 0) break;
      }
    }

    // Deduplicar
    const seen = new Set<string>();
    const dedup: Term[] = [];
    for (const t of result) {
      const k = termKey(t);
      if (!seen.has(k)) {
        seen.add(k);
        dedup.push(t);
      }
    }
    cache.set(key, dedup);
    return dedup;
  };

  return at(sort, depth);
}

function defaultVariables(sig: Signature): Array<{ name: string; sort: string }> {
  const out: Array<{ name: string; sort: string }> = [];
  for (const s of sig.sorts) {
    out.push({ name: `${s.toLowerCase()[0] ?? 'x'}0`, sort: s });
    out.push({ name: `${s.toLowerCase()[0] ?? 'x'}1`, sort: s });
    out.push({ name: `${s.toLowerCase()[0] ?? 'x'}2`, sort: s });
  }
  return out;
}

// ── Evaluación y síntesis ───────────────────────────────────

/**
 * Evaluates a term under a variable environment.
 * Should throw when the term is ill-typed or outside the evaluator's domain;
 * the synthesizer will skip conjectures whose terms cannot be evaluated.
 */
export type Evaluator = (term: Term, env: Record<string, unknown>) => unknown;

function defaultRandomValue(sort: string, rng: () => number): unknown {
  // Generadores razonables por convención de nombre
  const lo = sort.toLowerCase();
  if (lo === 'nat' || lo === 'n' || lo === 'number' || lo === 'int') {
    return Math.floor(rng() * 6);
  }
  if (lo === 'bool' || lo === 'b' || lo === 'boolean') {
    return rng() < 0.5;
  }
  if (lo === 'list' || lo === 'l') {
    const len = Math.floor(rng() * 4);
    const list: number[] = [];
    for (let i = 0; i < len; i++) list.push(Math.floor(rng() * 4));
    return list;
  }
  return rng();
}

/**
 * Sintetiza conjeturas de igualdad: para cada par de términos del
 * mismo sort, las evalúa sobre `numTests` valuaciones aleatorias.
 * Sobreviven las que pasan todas las pruebas.
 */
export function synthesizeEqualities(
  sig: Signature,
  evaluator: Evaluator,
  opts: SynthesisOptions = {},
): Conjecture[] {
  const maxDepth = opts.maxDepth ?? 2;
  const numTests = opts.numTests ?? 100;
  const maxConj = opts.maxConjectures ?? 200;
  const seed = opts.seed ?? 0xc0ffee;
  const rng = mulberry32(seed);
  const randVal = opts.randomValue ?? defaultRandomValue;
  const varsPerSort = opts.varsPerSort ?? 3;

  // Variables: K por cada sort que aparece
  const variables: Array<{ name: string; sort: string }> = [];
  for (const s of sig.sorts) {
    for (let i = 0; i < varsPerSort; i++) {
      variables.push({ name: `${s.toLowerCase()[0] ?? 'x'}${i}`, sort: s });
    }
  }

  const conjectures: Conjecture[] = [];

  for (const sort of sig.sorts) {
    const terms = enumerateTerms(sig, sort, maxDepth, variables);

    // Pre-evaluar cada término en cada valuación: clave de "comportamiento"
    const valuations: Array<Record<string, unknown>> = [];
    for (let t = 0; t < numTests; t++) {
      const env: Record<string, unknown> = {};
      for (const v of variables) env[v.name] = randVal(v.sort, rng);
      valuations.push(env);
    }

    // Mapa: signatura semántica → primer término que la produce
    const sigToRep = new Map<string, Term>();

    for (const term of terms) {
      const traces: string[] = [];
      let evalFailed = false;
      for (const env of valuations) {
        let val: unknown;
        try {
          val = evaluator(term, env);
        } catch {
          evalFailed = true;
          break;
        }
        traces.push(serializeValue(val));
      }
      if (evalFailed) continue;

      const key = traces.join('|');
      const rep = sigToRep.get(key);
      if (rep === undefined) {
        sigToRep.set(key, term);
      } else {
        // Encontramos otro término con misma extensión → conjetura
        // Evitamos trivialidades: rep === term sintácticamente, o
        // ambos son la misma var/const sin función aplicada.
        if (termKey(rep) === termKey(term)) continue;
        if (rep.kind !== 'app' && term.kind !== 'app') continue;

        const allVars = mergeVars(freeVars(rep), freeVars(term));
        const formula = `∀${allVars.map((v) => `${v.name}:${v.sort}`).join(', ')}. ${termToString(rep)} = ${termToString(term)}`;
        conjectures.push({
          variables: allVars,
          formula,
          confidence: 1,
          termLeft: rep,
          termRight: term,
        });
        if (conjectures.length >= maxConj) break;
      }
    }
    if (conjectures.length >= maxConj) break;
  }

  // Ordenar por tamaño del lado izquierdo (lemmas más simples primero)
  conjectures.sort((a, b) => {
    const sa = a.termLeft ? termSize(a.termLeft) : 0;
    const sb = b.termLeft ? termSize(b.termLeft) : 0;
    return sa - sb;
  });

  return conjectures;
}

function mergeVars(
  a: Array<{ name: string; sort: string }>,
  b: Array<{ name: string; sort: string }>,
): Array<{ name: string; sort: string }> {
  const seen = new Set<string>();
  const out: Array<{ name: string; sort: string }> = [];
  for (const v of [...a, ...b]) {
    if (!seen.has(v.name)) {
      seen.add(v.name);
      out.push(v);
    }
  }
  return out;
}

function termSize(t: Term): number {
  if (t.kind === 'var' || t.kind === 'const') return 1;
  return 1 + t.args.reduce((acc, a) => acc + termSize(a), 0);
}

function serializeValue(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(serializeValue).join(',')}]`;
  if (v === null || v === undefined) return String(v);
  if (typeof v === 'number') {
    // Quantizar para tolerar epsilon en aritmética real
    if (!Number.isFinite(v)) return String(v);
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(9);
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return `"${v}"`;
  if (typeof v === 'bigint') return `${v.toString()}n`;
  if (typeof v === 'object') return JSON.stringify(v);
  // function, symbol — last resort
  return Object.prototype.toString.call(v);
}

// ── Pruning de consecuencias ────────────────────────────────

/**
 * Descarta conjeturas redundantes:
 *   • Reflexivas (t = t).
 *   • Simétricas duplicadas (t1 = t2 vs t2 = t1).
 *   • Instancias de otras conjeturas más generales (un lemma
 *     ya hallado subsume a uno con más estructura específica).
 */
export function pruneConsequences(conjectures: Conjecture[]): Conjecture[] {
  // Paso 1: reflexivas
  const noReflex = conjectures.filter((c) => {
    if (!c.termLeft || !c.termRight) return true;
    return termKey(c.termLeft) !== termKey(c.termRight);
  });

  // Paso 2: simétricas duplicadas — clave canónica = par ordenado de termKey
  const seen = new Map<string, Conjecture>();
  for (const c of noReflex) {
    if (!c.termLeft || !c.termRight) {
      seen.set(c.formula, c);
      continue;
    }
    const k1 = termKey(c.termLeft);
    const k2 = termKey(c.termRight);
    const canonical = k1 < k2 ? `${k1}≡${k2}` : `${k2}≡${k1}`;
    if (!seen.has(canonical)) seen.set(canonical, c);
  }

  const result = Array.from(seen.values());

  // Paso 3: ordenar por tamaño y eliminar conjeturas que son
  // "instancias" sintácticas más complejas de una previa.
  result.sort((a, b) => {
    const sa = (a.termLeft ? termSize(a.termLeft) : 0) + (a.termRight ? termSize(a.termRight) : 0);
    const sb = (b.termLeft ? termSize(b.termLeft) : 0) + (b.termRight ? termSize(b.termRight) : 0);
    return sa - sb;
  });

  // Paso 4: eliminar conjeturas en las que un lado es subsumido por
  // un lemma anterior aplicado a un subtérmino (heurística simple:
  // si reescribiendo con un lemma previo `l → r` colapsamos la
  // conjetura actual en una reflexiva, es redundante). Usamos
  // únicamente patrones con cabeza fija (no pure-vars): éstos sí
  // discriminan y no explotan la búsqueda.
  const survivors: Conjecture[] = [];
  for (const c of result) {
    if (!c.termLeft || !c.termRight) {
      survivors.push(c);
      continue;
    }
    let lhs: Term = c.termLeft;
    let rhs: Term = c.termRight;
    for (const prev of survivors) {
      if (!prev.termLeft || !prev.termRight) continue;
      // No usar lemmas cuyo patrón sea una variable pura (matchearía
      // cualquier cosa y explota el costo del prune sin agregar señal).
      if (prev.termLeft.kind === 'var' && prev.termRight.kind !== 'var') continue;
      if (prev.termRight.kind === 'var' && prev.termLeft.kind !== 'var') {
        // Usar como `replacement → pattern`: orientación grande→chica.
        lhs = rewriteOnce(lhs, prev.termLeft, prev.termRight);
        rhs = rewriteOnce(rhs, prev.termLeft, prev.termRight);
        continue;
      }
      lhs = rewriteOnce(lhs, prev.termLeft, prev.termRight);
      rhs = rewriteOnce(rhs, prev.termLeft, prev.termRight);
    }
    if (termKey(lhs) === termKey(rhs)) {
      // Es consecuencia trivial de los anteriores
      continue;
    }
    survivors.push(c);
  }

  return survivors;
}

/**
 * Reescritura sintáctica simple: si `t` (o un subtérmino) matchea
 * `pattern` con substitución σ, reemplaza por `σ(replacement)`.
 * Solo intenta una sustitución de raíz para mantenerlo predecible.
 */
function rewriteOnce(t: Term, pattern: Term, replacement: Term): Term {
  const subst = match(pattern, t, new Map());
  if (subst) return applySubst(replacement, subst);
  if (t.kind === 'app') {
    const newArgs = t.args.map((a) => rewriteOnce(a, pattern, replacement));
    // Si nada cambió, devolver original (preserva identidad)
    let changed = false;
    for (let i = 0; i < newArgs.length; i++) {
      if (termKey(newArgs[i]) !== termKey(t.args[i])) {
        changed = true;
        break;
      }
    }
    if (!changed) return t;
    return { kind: 'app', name: t.name, args: newArgs, sort: t.sort };
  }
  return t;
}

function match(pattern: Term, target: Term, subst: Map<string, Term>): Map<string, Term> | null {
  // Mutable variant: records additions and rolls back on failure.
  const added: string[] = [];
  const tryMatch = (p: Term, t: Term): boolean => {
    if (p.kind === 'var') {
      const prev = subst.get(p.name);
      if (prev) return termKey(prev) === termKey(t);
      if (p.sort !== t.sort) return false;
      subst.set(p.name, t);
      added.push(p.name);
      return true;
    }
    if (p.kind === 'const') {
      return t.kind === 'const' && p.name === t.name;
    }
    if (t.kind !== 'app') return false;
    if (p.name !== t.name) return false;
    if (p.args.length !== t.args.length) return false;
    for (let i = 0; i < p.args.length; i++) {
      if (!tryMatch(p.args[i], t.args[i])) return false;
    }
    return true;
  };
  if (tryMatch(pattern, target)) return subst;
  // rollback
  for (const k of added) subst.delete(k);
  return null;
}

function applySubst(t: Term, subst: Map<string, Term>): Term {
  if (t.kind === 'var') {
    const v = subst.get(t.name);
    return v ?? t;
  }
  if (t.kind === 'const') return t;
  return {
    kind: 'app',
    name: t.name,
    args: t.args.map((a) => applySubst(a, subst)),
    sort: t.sort,
  };
}

// ── Verificación opcional via prover ────────────────────────

/**
 * An optional external prover that attempts to prove or disprove a conjecture.
 * Returns `{ proven: true }` on success, `{ proven: false, counter }` on refutation,
 * or `{ proven: false }` when the result is unknown.
 */
export type Prover = (conjecture: Conjecture) => { proven: boolean; counter?: unknown };

/** A conjecture annotated with its verification status after calling a {@link Prover}. */
export interface VerifiedConjecture extends Conjecture {
  status: 'verified' | 'counter' | 'unknown';
  counter?: unknown;
}

/**
 * Runs each conjecture through `prover`, annotating it with
 * `'verified'`, `'counter'` (with a counterexample), or `'unknown'`.
 * Prover exceptions are silently caught and treated as `'unknown'`.
 */
export function verifyConjectures(conjectures: Conjecture[], prover: Prover): VerifiedConjecture[] {
  return conjectures.map((c) => {
    let r: { proven: boolean; counter?: unknown };
    try {
      r = prover(c);
    } catch {
      return { ...c, status: 'unknown' };
    }
    if (r.proven) return { ...c, status: 'verified' };
    if (r.counter !== undefined) return { ...c, status: 'counter', counter: r.counter };
    return { ...c, status: 'unknown' };
  });
}

// ── Signaturas de ejemplo ───────────────────────────────────

/** Returns a {@link Signature} for the natural numbers (0, S, +, *). */
export function naturalNumbersSignature(): Signature {
  return {
    sorts: ['Nat'],
    constants: [{ name: '0', sort: 'Nat' }],
    functions: [
      { name: 'S', argSorts: ['Nat'], resultSort: 'Nat' },
      { name: '+', argSorts: ['Nat', 'Nat'], resultSort: 'Nat' },
      { name: '*', argSorts: ['Nat', 'Nat'], resultSort: 'Nat' },
    ],
    predicates: [],
  };
}

/** Returns a {@link Signature} for booleans (T, F, ¬, ∧, ∨). */
export function booleansSignature(): Signature {
  return {
    sorts: ['Bool'],
    constants: [
      { name: 'T', sort: 'Bool' },
      { name: 'F', sort: 'Bool' },
    ],
    functions: [
      { name: '¬', argSorts: ['Bool'], resultSort: 'Bool' },
      { name: '∧', argSorts: ['Bool', 'Bool'], resultSort: 'Bool' },
      { name: '∨', argSorts: ['Bool', 'Bool'], resultSort: 'Bool' },
    ],
    predicates: [],
  };
}

/** Returns a {@link Signature} for lists over Nat (nil, cons, ++, length). */
export function listsSignature(): Signature {
  return {
    sorts: ['List', 'Nat'],
    constants: [
      { name: 'nil', sort: 'List' },
      { name: '0', sort: 'Nat' },
    ],
    functions: [
      { name: 'S', argSorts: ['Nat'], resultSort: 'Nat' },
      { name: 'cons', argSorts: ['Nat', 'List'], resultSort: 'List' },
      { name: '++', argSorts: ['List', 'List'], resultSort: 'List' },
      { name: 'length', argSorts: ['List'], resultSort: 'Nat' },
    ],
    predicates: [],
  };
}

// ── Evaluadores de ejemplo (útiles para tests y demos) ──────

/** Sample {@link Evaluator} for the natural numbers signature. */
export const naturalsEvaluator: Evaluator = (term, env) => {
  const evalT = (t: Term): number => {
    if (t.kind === 'var') {
      const v = env[t.name];
      return typeof v === 'number' ? v : 0;
    }
    if (t.kind === 'const') return t.name === '0' ? 0 : 0;
    switch (t.name) {
      case 'S':
        return evalT(t.args[0]) + 1;
      case '+':
        return evalT(t.args[0]) + evalT(t.args[1]);
      case '*':
        return evalT(t.args[0]) * evalT(t.args[1]);
      default:
        throw new Error(`unknown function ${t.name}`);
    }
  };
  return evalT(term);
};

/** Sample {@link Evaluator} for the booleans signature. */
export const booleansEvaluator: Evaluator = (term, env) => {
  const evalT = (t: Term): boolean => {
    if (t.kind === 'var') {
      const v = env[t.name];
      return typeof v === 'boolean' ? v : false;
    }
    if (t.kind === 'const') return t.name === 'T';
    switch (t.name) {
      case '¬':
        return !evalT(t.args[0]);
      case '∧':
        return evalT(t.args[0]) && evalT(t.args[1]);
      case '∨':
        return evalT(t.args[0]) || evalT(t.args[1]);
      default:
        throw new Error(`unknown function ${t.name}`);
    }
  };
  return evalT(term);
};

/** Sample {@link Evaluator} for the lists-over-Nat signature. */
export const listsEvaluator: Evaluator = (term, env) => {
  const evalT = (t: Term): unknown => {
    if (t.kind === 'var') {
      return env[t.name];
    }
    if (t.kind === 'const') {
      if (t.name === 'nil') return [];
      if (t.name === '0') return 0;
      return undefined;
    }
    switch (t.name) {
      case 'S':
        return (evalT(t.args[0]) as number) + 1;
      case 'cons': {
        const h = evalT(t.args[0]) as number;
        const tl = evalT(t.args[1]) as number[];
        return [h, ...tl];
      }
      case '++': {
        const a = evalT(t.args[0]) as number[];
        const b = evalT(t.args[1]) as number[];
        return [...a, ...b];
      }
      case 'length':
        return (evalT(t.args[0]) as number[]).length;
      default:
        throw new Error(`unknown function ${t.name}`);
    }
  };
  return evalT(term);
};

// ── Re-exports para tests ───────────────────────────────────

export const __internals = {
  termKey,
  termSize,
  match,
  rewriteOnce,
  applySubst,
  mulberry32,
  serializeValue,
};
