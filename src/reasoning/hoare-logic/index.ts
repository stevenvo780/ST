// ============================================================
// ST Hoare Logic — Verificación de programas imperativos
// ============================================================
//
// Lógica de Hoare para un lenguaje IMP minimal (asignación, skip,
// secuencia, condicional, bucle). El motor calcula precondiciones
// más débiles (weakest precondition, wp) y postcondiciones más
// fuertes (strongest postcondition, sp), genera condiciones de
// verificación (VCs) y las refuta por búsqueda aleatoria sobre el
// universo entero acotado.
//
// Tripleta de Hoare:
//   {P} c {Q}  ≡  ejecutar c desde un estado que cumple P deja un
//                estado que cumple Q (corrección parcial).
//
// Reglas (Hoare):
//   skip      :  {P} skip {P}
//   assign    :  {P[E/x]} x := E {P}
//   seq       :  {P} c1 {R}, {R} c2 {Q}  ⊢  {P} c1; c2 {Q}
//   if        :  {P ∧ B} c1 {Q}, {P ∧ ¬B} c2 {Q}  ⊢  {P} if B then c1 else c2 {Q}
//   while     :  {I ∧ B} c {I}  ⊢  {I} while B do c {I ∧ ¬B}
//   weakening :  P → P', {P'} c {Q'}, Q' → Q  ⊢  {P} c {Q}
//
// Para `while` exigimos invariant explícito (campo `invariant`) o
// el VC pasa a ser trivial-falso (no podemos probar terminación
// parcial sin invariant). Las VCs se evalúan por muestreo aleatorio
// + estados sintéticos extraídos del programa: si alguna falla,
// devolvemos un contramodelo.

// ── Tipos del lenguaje IMP ───────────────────────────────────

/** Operadores binarios del lenguaje IMP: aritméticos, relacionales y lógicos. */
export type ImpBinop =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '<'
  | '<='
  | '>'
  | '>='
  | '=='
  | '!='
  | '&&'
  | '||';

/** Expresión del lenguaje IMP: constante, booleano, variable o aplicación de operador. */
export type ImpExpr =
  | { kind: 'const'; value: number }
  | { kind: 'bool'; value: boolean }
  | { kind: 'var'; name: string }
  | { kind: 'binop'; op: ImpBinop; left: ImpExpr; right: ImpExpr }
  | { kind: 'not'; arg: ImpExpr };

/** Sentencia del lenguaje IMP: skip, asignación, secuencia, condicional y bucle while con invariante opcional. */
export type ImpStmt =
  | { kind: 'skip' }
  | { kind: 'assign'; var: string; expr: ImpExpr }
  | { kind: 'seq'; first: ImpStmt; second: ImpStmt }
  | { kind: 'if'; cond: ImpExpr; then: ImpStmt; else: ImpStmt }
  | { kind: 'while'; cond: ImpExpr; invariant?: ImpExpr; body: ImpStmt };

/** Tripleta de Hoare {P} stmt {Q}: precondición, comando y postcondición. */
export interface HoareTriple {
  pre: ImpExpr;
  stmt: ImpStmt;
  post: ImpExpr;
}

// ── Constructores de conveniencia ────────────────────────────

/** Constructor de literal numérico IMP. */
export const num = (n: number): ImpExpr => ({ kind: 'const', value: n });
/** Constructor de literal booleano IMP. */
export const bool = (b: boolean): ImpExpr => ({ kind: 'bool', value: b });
/** Constructor de referencia a variable IMP por nombre. */
export const v = (name: string): ImpExpr => ({ kind: 'var', name });
/** Constructor de operación binaria IMP. */
export const binop = (op: ImpBinop, left: ImpExpr, right: ImpExpr): ImpExpr => ({
  kind: 'binop',
  op,
  left,
  right,
});
/** Constructor de negación de expresión IMP. */
export const not = (arg: ImpExpr): ImpExpr => ({ kind: 'not', arg });
/** Constructor de conjunción lógica IMP: `left && right`. */
export const and = (left: ImpExpr, right: ImpExpr): ImpExpr => binop('&&', left, right);
/** Constructor de disyunción lógica IMP: `left || right`. */
export const or = (left: ImpExpr, right: ImpExpr): ImpExpr => binop('||', left, right);
/** Constructor de igualdad IMP: `left == right`. */
export const eq = (left: ImpExpr, right: ImpExpr): ImpExpr => binop('==', left, right);
/** Constructor de menor estricto IMP: `left < right`. */
export const lt = (left: ImpExpr, right: ImpExpr): ImpExpr => binop('<', left, right);
/** Constructor de menor o igual IMP: `left <= right`. */
export const le = (left: ImpExpr, right: ImpExpr): ImpExpr => binop('<=', left, right);

/** Instrucción `skip` (no-op). */
export const skip = (): ImpStmt => ({ kind: 'skip' });
/** Instrucción de asignación: `varName := expr`. */
export const assign = (varName: string, expr: ImpExpr): ImpStmt => ({
  kind: 'assign',
  var: varName,
  expr,
});
/** Secuencia de instrucciones (asociativa a la derecha). Con 0 args devuelve `skip`. */
export function seq(...stmts: ImpStmt[]): ImpStmt {
  if (stmts.length === 0) return skip();
  if (stmts.length === 1) return stmts[0];
  // Foldr para mantener asociatividad derecha estable.
  let acc: ImpStmt = stmts[stmts.length - 1];
  for (let i = stmts.length - 2; i >= 0; i--) {
    acc = { kind: 'seq', first: stmts[i], second: acc };
  }
  return acc;
}
/** Instrucción condicional `if cond then then_ else else_`. */
export const ifS = (cond: ImpExpr, then_: ImpStmt, else_: ImpStmt): ImpStmt => ({
  kind: 'if',
  cond,
  then: then_,
  else: else_,
});
/** Instrucción `while cond body` con invariante opcional para verificación. */
export const whileS = (cond: ImpExpr, body: ImpStmt, invariant?: ImpExpr): ImpStmt => ({
  kind: 'while',
  cond,
  invariant,
  body,
});

// ── Sustitución sintáctica P[E/x] ────────────────────────────

/** Sustitución sintáctica `expr[replacement/varName]` en expresiones IMP. */
export function substitute(expr: ImpExpr, varName: string, replacement: ImpExpr): ImpExpr {
  switch (expr.kind) {
    case 'const':
    case 'bool':
      return expr;
    case 'var':
      return expr.name === varName ? replacement : expr;
    case 'binop':
      return {
        kind: 'binop',
        op: expr.op,
        left: substitute(expr.left, varName, replacement),
        right: substitute(expr.right, varName, replacement),
      };
    case 'not':
      return { kind: 'not', arg: substitute(expr.arg, varName, replacement) };
  }
}

// ── Recolección de variables libres ──────────────────────────

/** Variables libres en la expresión IMP `expr`. Acumula en `acc` (o devuelve un nuevo Set). */
export function freeVars(expr: ImpExpr, acc: Set<string> = new Set()): Set<string> {
  switch (expr.kind) {
    case 'const':
    case 'bool':
      return acc;
    case 'var':
      acc.add(expr.name);
      return acc;
    case 'binop':
      freeVars(expr.left, acc);
      freeVars(expr.right, acc);
      return acc;
    case 'not':
      freeVars(expr.arg, acc);
      return acc;
  }
}

/** Variables mencionadas en la instrucción IMP `stmt` (asignadas y/o leídas). */
export function stmtVars(stmt: ImpStmt, acc: Set<string> = new Set()): Set<string> {
  switch (stmt.kind) {
    case 'skip':
      return acc;
    case 'assign':
      acc.add(stmt.var);
      freeVars(stmt.expr, acc);
      return acc;
    case 'seq':
      stmtVars(stmt.first, acc);
      stmtVars(stmt.second, acc);
      return acc;
    case 'if':
      freeVars(stmt.cond, acc);
      stmtVars(stmt.then, acc);
      stmtVars(stmt.else, acc);
      return acc;
    case 'while':
      freeVars(stmt.cond, acc);
      if (stmt.invariant) freeVars(stmt.invariant, acc);
      stmtVars(stmt.body, acc);
      return acc;
  }
}

// ── Evaluación de expresiones en un estado concreto ──────────

/** Estado concreto de IMP: mapa de variables a valores enteros (variables no definidas = 0). */
export type State = Record<string, number>;

/** Evalúa la expresión IMP `expr` en el estado `state`. Devuelve un número o booleano. */
export function evalExpr(expr: ImpExpr, state: State): number | boolean {
  switch (expr.kind) {
    case 'const':
      return expr.value;
    case 'bool':
      return expr.value;
    case 'var': {
      const value = state[expr.name];
      // Variables no definidas valen 0 (estado total). Esto simplifica
      // el muestreo aleatorio y los VCs sobre programas pequeños.
      return value === undefined ? 0 : value;
    }
    case 'not': {
      const a = evalExpr(expr.arg, state);
      return !toBool(a);
    }
    case 'binop': {
      const l = evalExpr(expr.left, state);
      const r = evalExpr(expr.right, state);
      switch (expr.op) {
        case '+':
          return toNum(l) + toNum(r);
        case '-':
          return toNum(l) - toNum(r);
        case '*':
          return toNum(l) * toNum(r);
        case '/': {
          const rn = toNum(r);
          if (rn === 0) return 0; // división por cero → 0 (estado total)
          return Math.trunc(toNum(l) / rn);
        }
        case '%': {
          const rn = toNum(r);
          if (rn === 0) return 0;
          return toNum(l) % rn;
        }
        case '<':
          return toNum(l) < toNum(r);
        case '<=':
          return toNum(l) <= toNum(r);
        case '>':
          return toNum(l) > toNum(r);
        case '>=':
          return toNum(l) >= toNum(r);
        case '==':
          return toNum(l) === toNum(r);
        case '!=':
          return toNum(l) !== toNum(r);
        case '&&':
          return toBool(l) && toBool(r);
        case '||':
          return toBool(l) || toBool(r);
      }
    }
  }
}

function toNum(v: number | boolean): number {
  return typeof v === 'boolean' ? (v ? 1 : 0) : v;
}

function toBool(v: number | boolean): boolean {
  return typeof v === 'boolean' ? v : v !== 0;
}

// ── Ejecución concreta de statements ─────────────────────────

/** Error de ejecución en IMP (e.g. timeout por bucle infinito). */
export type ExecError = { error: string };

/** Ejecuta `stmt` sobre `state` con un límite de `maxSteps` pasos. Devuelve el estado final o un error. */
export function execStmt(
  stmt: ImpStmt,
  state: State,
  maxSteps: number = 10_000,
): State | ExecError {
  const counter = { steps: 0, limit: maxSteps };
  try {
    return execInternal(stmt, { ...state }, counter);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function execInternal(
  stmt: ImpStmt,
  state: State,
  counter: { steps: number; limit: number },
): State {
  if (counter.steps++ > counter.limit) {
    throw new Error(`execStmt: límite de pasos excedido (${counter.limit})`);
  }
  switch (stmt.kind) {
    case 'skip':
      return state;
    case 'assign': {
      const value = evalExpr(stmt.expr, state);
      state[stmt.var] = toNum(value);
      return state;
    }
    case 'seq': {
      execInternal(stmt.first, state, counter);
      execInternal(stmt.second, state, counter);
      return state;
    }
    case 'if': {
      const cond = evalExpr(stmt.cond, state);
      if (toBool(cond)) {
        execInternal(stmt.then, state, counter);
      } else {
        execInternal(stmt.else, state, counter);
      }
      return state;
    }
    case 'while': {
      while (toBool(evalExpr(stmt.cond, state))) {
        if (counter.steps++ > counter.limit) {
          throw new Error(`execStmt: límite de pasos excedido en while (${counter.limit})`);
        }
        execInternal(stmt.body, state, counter);
      }
      return state;
    }
  }
}

// ── Weakest precondition (wp) ────────────────────────────────

/** Precondición más débil `wp(stmt, post)`. Para while requiere invariant anotado; sin él devuelve `false`. */
export function wp(stmt: ImpStmt, post: ImpExpr): ImpExpr {
  switch (stmt.kind) {
    case 'skip':
      return post;
    case 'assign':
      return substitute(post, stmt.var, stmt.expr);
    case 'seq': {
      const after = wp(stmt.second, post);
      return wp(stmt.first, after);
    }
    case 'if': {
      const wpThen = wp(stmt.then, post);
      const wpElse = wp(stmt.else, post);
      // (cond → wpThen) ∧ (¬cond → wpElse)
      return and(or(not(stmt.cond), wpThen), or(stmt.cond, wpElse));
    }
    case 'while': {
      // Sin invariant no podemos calcular wp exacto en general.
      // Devolvemos `false` para forzar fallo de VC explícito.
      if (!stmt.invariant) return bool(false);
      // Con invariant I la wp es simplemente I; las verificaciones
      // adicionales (mantenimiento, salida) se generan como VCs.
      return stmt.invariant;
    }
  }
}

// ── Strongest postcondition (sp), versión sintáctica ─────────
//
// Implementación pragmática: para statements sin loops devolvemos
// una fórmula que describe el estado tras ejecutar `stmt`. Para
// loops sin invariant cae a `true` (no informativo).

/** Postcondición más fuerte aproximada `sp(stmt, pre)`. Para x := E cuando E no menciona x; sino devuelve `true`. */
export function spExtension(stmt: ImpStmt, pre: ImpExpr): ImpExpr {
  switch (stmt.kind) {
    case 'skip':
      return pre;
    case 'assign': {
      // Introducimos una variable fresca para el valor previo de stmt.var:
      //   sp(P, x := E) = ∃x'. P[x'/x] ∧ x = E[x'/x]
      // Como no soportamos cuantificadores, aproximamos por la
      // post-substitución del valor nuevo cuando E no menciona x.
      // Si E menciona x, devolvemos `true` (no informativo).
      const eVars = freeVars(stmt.expr);
      if (!eVars.has(stmt.var)) {
        return and(pre, eq(v(stmt.var), stmt.expr));
      }
      return bool(true);
    }
    case 'seq':
      return spExtension(stmt.second, spExtension(stmt.first, pre));
    case 'if': {
      const spThen = spExtension(stmt.then, and(pre, stmt.cond));
      const spElse = spExtension(stmt.else, and(pre, not(stmt.cond)));
      return or(spThen, spElse);
    }
    case 'while':
      // Saliendo de un while, vale (I ∧ ¬cond) si hay invariant.
      if (stmt.invariant) return and(stmt.invariant, not(stmt.cond));
      return bool(true);
  }
}

// ── Generación de condiciones de verificación (VCs) ──────────

/** Genera las condiciones de verificación (VCs) para la tripla de Hoare: pre, wp global y VCs de loops. */
export function generateVCs(triple: HoareTriple): ImpExpr[] {
  const vcs: ImpExpr[] = [];
  // VC global: pre → wp(stmt, post)
  vcs.push(implies(triple.pre, wp(triple.stmt, triple.post)));
  collectLoopVCs(triple.stmt, triple.post, vcs);
  return vcs;
}

function implies(p: ImpExpr, q: ImpExpr): ImpExpr {
  return or(not(p), q);
}

function collectLoopVCs(stmt: ImpStmt, post: ImpExpr, out: ImpExpr[]): void {
  switch (stmt.kind) {
    case 'skip':
    case 'assign':
      return;
    case 'seq':
      collectLoopVCs(stmt.first, wp(stmt.second, post), out);
      collectLoopVCs(stmt.second, post, out);
      return;
    case 'if':
      collectLoopVCs(stmt.then, post, out);
      collectLoopVCs(stmt.else, post, out);
      return;
    case 'while': {
      if (!stmt.invariant) {
        // VC trivialmente falso: no hay invariant.
        out.push(bool(false));
        return;
      }
      const I = stmt.invariant;
      // Mantenimiento: (I ∧ cond) → wp(body, I)
      out.push(implies(and(I, stmt.cond), wp(stmt.body, I)));
      // Salida: (I ∧ ¬cond) → post (sólo si este while es el último
      // step antes de la post). Para keep it simple, lo generamos
      // siempre — es una condición necesaria local en el contexto del
      // VC global, no redundante.
      out.push(implies(and(I, not(stmt.cond)), post));
      // Recurse sobre el body por loops anidados.
      collectLoopVCs(stmt.body, I, out);
      return;
    }
  }
}

// ── Verificación por muestreo de VCs ─────────────────────────

/** Resultado de `verifyTriple`: validez, lista de VCs y fallos con contraejemplo. */
export interface VerificationResult {
  valid: boolean;
  vcs: ImpExpr[];
  failures: Array<{ vc: ImpExpr; state?: State }>;
}

/** Opciones para `verifyTriple`: tamaño de muestreo, rango de enteros, semilla y estados extra. */
export interface VerifyOptions {
  samples?: number;
  /** Rango de muestreo entero para variables (inclusive en ambos extremos). */
  range?: [number, number];
  /** Semilla determinista; si no, se usa Math.random. */
  seed?: number;
  /** Estados explícitos extra que el caller quiere verificar siempre. */
  seedStates?: State[];
}

/** Verifica la tripla `{pre} stmt {post}` por muestreo aleatorio de estados. */
export function verifyTriple(triple: HoareTriple, opts: VerifyOptions = {}): VerificationResult {
  const samples = opts.samples ?? 200;
  const range = opts.range ?? [-5, 10];
  const vcs = generateVCs(triple);

  const vars = new Set<string>();
  freeVars(triple.pre, vars);
  freeVars(triple.post, vars);
  stmtVars(triple.stmt, vars);
  const varNames = [...vars];

  const rand = makeRandom(opts.seed);
  const failures: Array<{ vc: ImpExpr; state?: State }> = [];

  // Determinismo: incluimos estados "corner": todos 0, todos 1, todos -1.
  const cornerStates: State[] = [];
  for (const c of [0, 1, -1, range[0], range[1]]) {
    const st: State = {};
    for (const name of varNames) st[name] = c;
    cornerStates.push(st);
  }
  const allSeed = [...cornerStates, ...(opts.seedStates ?? [])];

  for (const vc of vcs) {
    let counterexample: State | undefined;
    // VCs literalmente `false` se reportan como fallo sintáctico sin
    // necesidad de muestrear.
    if (vc.kind === 'bool' && vc.value === false) {
      failures.push({ vc });
      continue;
    }

    // 1) corner + seed states
    for (const st of allSeed) {
      if (!evalVC(vc, st)) {
        counterexample = st;
        break;
      }
    }
    // 2) random sampling
    if (counterexample === undefined) {
      for (let i = 0; i < samples; i++) {
        const st: State = {};
        for (const name of varNames) {
          st[name] = randIntInRange(rand, range[0], range[1]);
        }
        if (!evalVC(vc, st)) {
          counterexample = st;
          break;
        }
      }
    }

    if (counterexample !== undefined) {
      failures.push({ vc, state: counterexample });
    }
  }

  return { valid: failures.length === 0, vcs, failures };
}

function evalVC(vc: ImpExpr, state: State): boolean {
  return toBool(evalExpr(vc, state));
}

function makeRandom(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  // Mulberry32 — pequeño PRNG determinista.
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randIntInRange(rand: () => number, lo: number, hi: number): number {
  return Math.floor(rand() * (hi - lo + 1)) + lo;
}

// ── Programas estándar de la literatura ──────────────────────

/**
 * Swap x ↔ y vía variable temporal `t`.
 *   t := x; x := y; y := t
 * Tripleta canónica: {x = a ∧ y = b} swap {x = b ∧ y = a}
 */
export function programSwap(): ImpStmt {
  return seq(assign('t', v('x')), assign('x', v('y')), assign('y', v('t')));
}

/**
 * Factorial:  r := 1; k := 0; while k < n do { k := k+1; r := r * k }
 * Tripleta:   {n = N ∧ N ≥ 0} fact {r = N!}
 * Invariant:  k ≤ n ∧ r = k!  (codificable como r = k!, k entre 0 y n)
 *
 * Como la lógica de Hoare aquí no tiene factorial nativo, exponemos el
 * código y el invariant en forma `r > 0 ∧ k ≤ n` (suficiente para
 * los tests de mantenimiento sintácticos con muestreo: el ejecutor
 * confirma corrección concreta para n pequeños).
 */
export function programFactorial(): ImpStmt {
  const body = seq(
    assign('k', binop('+', v('k'), num(1))),
    assign('r', binop('*', v('r'), v('k'))),
  );
  const invariant = and(le(v('k'), v('n')), binop('>=', v('r'), num(1)));
  return seq(
    assign('r', num(1)),
    assign('k', num(0)),
    whileS(binop('<', v('k'), v('n')), body, invariant),
  );
}

/**
 * GCD por algoritmo de Euclides con restas:
 *   while x != y do { if x > y then x := x - y else y := y - x }
 * Invariant: gcd(x, y) = gcd(a, b). Como no tenemos gcd nativo,
 * usamos como invariant `x ≥ 1 ∧ y ≥ 1` (mantenido por restas
 * positivas cuando x ≠ y y ambos positivos al entrar).
 */
export function programGCD(): ImpStmt {
  const body = ifS(
    binop('>', v('x'), v('y')),
    assign('x', binop('-', v('x'), v('y'))),
    assign('y', binop('-', v('y'), v('x'))),
  );
  const invariant = and(binop('>=', v('x'), num(1)), binop('>=', v('y'), num(1)));
  return whileS(binop('!=', v('x'), v('y')), body, invariant);
}

/**
 * Búsqueda lineal:
 *   i := 0; found := 0;
 *   while i < n && found == 0 do {
 *     if a == target then found := 1 else skip;
 *     i := i + 1
 *   }
 * Modelo simplificado: `a` representa el elemento actual (no un array;
 * el AST de IMP no tiene arrays). Sirve como esqueleto pedagógico
 * para discutir el invariant `i ≤ n` y la post `found == 1 ∨ i == n`.
 */
export function programLinearSearch(): ImpStmt {
  const body = seq(
    ifS(eq(v('a'), v('target')), assign('found', num(1)), skip()),
    assign('i', binop('+', v('i'), num(1))),
  );
  const invariant = and(le(v('i'), v('n')), or(eq(v('found'), num(0)), eq(v('found'), num(1))));
  return seq(
    assign('i', num(0)),
    assign('found', num(0)),
    whileS(and(binop('<', v('i'), v('n')), eq(v('found'), num(0))), body, invariant),
  );
}

// ── Helper: cómputo factorial concreto (para los tests) ──────

/** Calcula el factorial de `n` en enteros (JavaScript). Solo para tests. */
export function factorial(n: number): number {
  let r = 1;
  for (let k = 1; k <= n; k++) r *= k;
  return r;
}

/** Máximo común divisor de `a` y `b` (Euclides). Solo para tests. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  if (x === 0) return y;
  if (y === 0) return x;
  while (x !== y) {
    if (x > y) x -= y;
    else y -= x;
  }
  return x;
}
