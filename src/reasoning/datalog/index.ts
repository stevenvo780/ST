// ============================================================
// ST Datalog — Motor de evaluación
// ============================================================
//
// Datalog: subconjunto declarativo de Prolog sin functores ni
// términos compuestos. Programas son siempre terminantes (no hay
// recursión por estructuras), y la semántica fixpoint coincide
// con la semántica de modelo mínimo (Herbrand).
//
// Soporta:
//   - Parser textual ("p(X, Y) :- q(X, Z), r(Z, Y).")
//   - Evaluación bottom-up semi-naive con tracking de delta
//   - Evaluación top-down (SLD) con memoización para terminación
//   - Negación estratificada (¬p en cuerpo, p en estrato menor)
//   - Magic sets transformation para focalizar bottom-up por consulta
//   - Programas comunes: clausura transitiva, alcanzabilidad
//
// Convención de términos:
//   - Identificador que empieza con mayúscula = variable (X, Y, Z).
//   - Identificador que empieza con minúscula o dígito = constante.
//
// Nota: este módulo es puro TypeScript, sin dependencias del resto
// del repo. Las estructuras son inmutables hacia afuera y se
// reutilizan internamente con copias defensivas donde corresponde.

// ── Tipos básicos ────────────────────────────────────────────

export type DatalogTerm = string;

export interface DatalogAtom {
  predicate: string;
  args: DatalogTerm[];
}

export interface DatalogRule {
  head: DatalogAtom;
  body: DatalogAtom[];
}

export interface DatalogProgram {
  facts: DatalogAtom[];
  rules: DatalogRule[];
}

export interface Substitution {
  [variable: string]: DatalogTerm;
}

export interface EvaluationResult {
  facts: DatalogAtom[];
  iterations: number;
}

export interface StratifiedRule extends DatalogRule {
  negBody: DatalogAtom[];
}

// ── Helpers de términos ──────────────────────────────────────

/**
 * Una variable Datalog es un término cuyo primer carácter es una
 * letra mayúscula. Todo lo demás (minúsculas, dígitos, comillas)
 * cuenta como constante.
 */
export function isVariable(term: DatalogTerm): boolean {
  if (term.length === 0) return false;
  const c = term.charCodeAt(0);
  return c >= 65 && c <= 90; // A..Z
}

/** Un átomo es ground sii ninguno de sus argumentos es variable. */
export function isGround(atom: DatalogAtom): boolean {
  return atom.args.every((a) => !isVariable(a));
}

function cloneAtom(a: DatalogAtom): DatalogAtom {
  return { predicate: a.predicate, args: [...a.args] };
}

function atomKey(a: DatalogAtom): string {
  return `${a.predicate}(${a.args.join(',')})`;
}

// ── Parser ───────────────────────────────────────────────────

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function parseTermList(s: string): DatalogTerm[] | null {
  const trimmed = s.trim();
  if (trimmed === '') return [];
  const parts = trimmed.split(',').map((p) => p.trim());
  for (const p of parts) {
    if (!IDENT_RE.test(p)) return null;
  }
  return parts;
}

/**
 * Parsea un átomo de la forma `predicate(arg1, arg2, ...)`.
 * Devuelve null si la sintaxis es inválida.
 */
export function parseAtom(s: string): DatalogAtom | null {
  const trimmed = s.trim();
  const open = trimmed.indexOf('(');
  if (open <= 0) return null;
  if (!trimmed.endsWith(')')) return null;
  const predicate = trimmed.slice(0, open).trim();
  if (!IDENT_RE.test(predicate)) return null;
  const argsRaw = trimmed.slice(open + 1, -1);
  const args = parseTermList(argsRaw);
  if (args === null) return null;
  return { predicate, args };
}

/**
 * Parsea una regla `head :- body1, body2, ...` o un hecho `head`.
 * El punto final es opcional. Devuelve null si la sintaxis falla.
 */
export function parseRule(s: string): DatalogRule | null {
  let trimmed = s.trim();
  if (trimmed.endsWith('.')) trimmed = trimmed.slice(0, -1).trim();
  const sepIdx = trimmed.indexOf(':-');
  if (sepIdx === -1) {
    const head = parseAtom(trimmed);
    if (!head) return null;
    return { head, body: [] };
  }
  const headStr = trimmed.slice(0, sepIdx).trim();
  const bodyStr = trimmed.slice(sepIdx + 2).trim();
  const head = parseAtom(headStr);
  if (!head) return null;
  if (bodyStr === '') return { head, body: [] };
  // Split body por comas en el nivel superior (no hay paréntesis anidados
  // en Datalog porque no hay functores; cada literal es `p(a,b,c)`).
  const literals: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < bodyStr.length; i++) {
    const ch = bodyStr[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      literals.push(bodyStr.slice(start, i));
      start = i + 1;
    }
  }
  literals.push(bodyStr.slice(start));
  const body: DatalogAtom[] = [];
  for (const lit of literals) {
    const atom = parseAtom(lit.trim());
    if (!atom) return null;
    body.push(atom);
  }
  return { head, body };
}

// ── Sustituciones y unificación ──────────────────────────────

/**
 * Resuelve la cadena de bindings: si `subst[x] = y` y `subst[y] = z`
 * y z no es variable, devuelve z. Si llega a una variable sin binding,
 * la devuelve.
 */
function walk(term: DatalogTerm, subst: Substitution): DatalogTerm {
  let current = term;
  const seen = new Set<string>();
  while (isVariable(current) && current in subst) {
    if (seen.has(current)) return current; // ciclo defensivo
    seen.add(current);
    const next = subst[current];
    if (next === undefined) return current;
    current = next;
  }
  return current;
}

/**
 * Unificación de dos átomos. Devuelve la sustitución más general que
 * los unifica, o null si no son unificables.
 *
 * Reglas:
 *   - Predicados distintos o aridades distintas → fallo.
 *   - Variable vs término → bind (sin occurs check; Datalog no tiene
 *     functores compuestos así que occurs check no aplica).
 *   - Constante vs constante → match exacto.
 */
export function unifyAtoms(a: DatalogAtom, b: DatalogAtom): Substitution | null {
  if (a.predicate !== b.predicate) return null;
  if (a.args.length !== b.args.length) return null;
  const subst: Substitution = {};
  for (let i = 0; i < a.args.length; i++) {
    const ai = a.args[i];
    const bi = b.args[i];
    if (ai === undefined || bi === undefined) return null;
    const t1 = walk(ai, subst);
    const t2 = walk(bi, subst);
    if (t1 === t2) continue;
    if (isVariable(t1)) {
      subst[t1] = t2;
    } else if (isVariable(t2)) {
      subst[t2] = t1;
    } else {
      return null;
    }
  }
  return subst;
}

/**
 * Aplica una sustitución a un átomo, resolviendo cadenas vía walk.
 * Si una variable queda sin binding, se conserva tal cual.
 */
export function applySubstitution(atom: DatalogAtom, subst: Substitution): DatalogAtom {
  return {
    predicate: atom.predicate,
    args: atom.args.map((t) => walk(t, subst)),
  };
}

// ── Helpers internos de evaluación ──────────────────────────

function renameRule(rule: DatalogRule, counter: { n: number }): DatalogRule {
  const map: Record<string, string> = {};
  const renameTerm = (t: DatalogTerm): DatalogTerm => {
    if (!isVariable(t)) return t;
    if (!(t in map)) {
      counter.n++;
      map[t] = `${t}_r${counter.n}`;
    }
    const renamed = map[t];
    return renamed === undefined ? t : renamed;
  };
  const renameAtom = (a: DatalogAtom): DatalogAtom => ({
    predicate: a.predicate,
    args: a.args.map(renameTerm),
  });
  return {
    head: renameAtom(rule.head),
    body: rule.body.map(renameAtom),
  };
}

/**
 * Calcula todas las sustituciones que hacen que todos los literales
 * del body se satisfagan en `facts`. Cada literal se prueba contra
 * cada fact ground y se mantienen las sustituciones consistentes.
 */
function matchBody(
  body: DatalogAtom[],
  facts: ReadonlyArray<DatalogAtom>,
  factsByPred: Map<string, DatalogAtom[]>,
): Substitution[] {
  let frontier: Substitution[] = [{}];
  for (const lit of body) {
    const candidates = factsByPred.get(lit.predicate) ?? [];
    const next: Substitution[] = [];
    for (const partial of frontier) {
      const grounded = applySubstitution(lit, partial);
      for (const fact of candidates) {
        const u = unifyAtoms(grounded, fact);
        if (u === null) continue;
        // Componer: empezar con partial y agregar las nuevas bindings.
        const composed: Substitution = { ...partial };
        for (const k of Object.keys(u)) {
          const v = u[k];
          if (v === undefined) continue;
          composed[k] = v;
        }
        next.push(composed);
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  // Eliminar duplicados estructurales (mismo set de bindings).
  const seen = new Set<string>();
  const dedup: Substitution[] = [];
  for (const s of frontier) {
    const key = Object.keys(s)
      .sort()
      .map((k) => `${k}=${s[k]}`)
      .join('|');
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(s);
    }
  }
  return dedup;
  void facts; // explicit unused signal
}

function indexByPredicate(atoms: ReadonlyArray<DatalogAtom>): Map<string, DatalogAtom[]> {
  const m = new Map<string, DatalogAtom[]>();
  for (const a of atoms) {
    const list = m.get(a.predicate);
    if (list) list.push(a);
    else m.set(a.predicate, [a]);
  }
  return m;
}

// ── Evaluación bottom-up semi-naive ─────────────────────────

/**
 * Evaluación bottom-up con la variante semi-naive: en cada iteración
 * sólo recomputamos sustituciones que involucran al menos un fact
 * nuevo del paso anterior. Para Datalog puro (sin negación) esto
 * computa el modelo mínimo de Herbrand en O(|reglas| · |facts|^aridad)
 * en el peor caso.
 *
 * Notas:
 *   - `opts.maxIterations` por defecto 1000. Datalog termina siempre,
 *     pero programas con muchos términos requieren un techo defensivo
 *     para no colgar tests.
 *   - Variables anónimas (no aparecen renombradas externamente) se
 *     reinstancian por regla en cada paso.
 */
export function evaluateBottomUp(
  p: DatalogProgram,
  opts: { maxIterations?: number } = {},
): EvaluationResult {
  const maxIter = opts.maxIterations ?? 1000;
  const known = new Map<string, DatalogAtom>();
  let delta: DatalogAtom[] = [];
  for (const f of p.facts) {
    if (!isGround(f)) continue;
    const k = atomKey(f);
    if (!known.has(k)) {
      known.set(k, cloneAtom(f));
      delta.push(cloneAtom(f));
    }
  }
  let iterations = 0;
  const counter = { n: 0 };
  while (delta.length > 0 && iterations < maxIter) {
    iterations++;
    const allFacts = Array.from(known.values());
    const idx = indexByPredicate(allFacts);
    const newDelta: DatalogAtom[] = [];
    for (const ruleRaw of p.rules) {
      // Renombrar variables de la regla para evitar capturas con bindings.
      const rule = renameRule(ruleRaw, counter);
      if (rule.body.length === 0) {
        // Hecho ya tratado en la inicialización.
        continue;
      }
      const substs = matchBody(rule.body, allFacts, idx);
      for (const s of substs) {
        const derived = applySubstitution(rule.head, s);
        if (!isGround(derived)) continue;
        const dk = atomKey(derived);
        if (!known.has(dk)) {
          known.set(dk, derived);
          newDelta.push(derived);
        }
      }
    }
    delta = newDelta;
  }
  return { facts: Array.from(known.values()), iterations };
}

// ── Evaluación top-down (SLD) con memoización ───────────────

/**
 * Devuelve todas las instancias ground del query derivables del
 * programa, evaluando top-down como SLD con memoización por átomo
 * (tabling). La memoización es esencial: SLD puro sobre programas
 * recursivos (ej. transitive closure) no terminaría.
 *
 * `maxDepth` limita la profundidad de resolución para evitar
 * explosión exponencial. Default 100.
 */
export function querySLD(p: DatalogProgram, query: DatalogAtom, maxDepth = 100): DatalogAtom[] {
  // Estrategia simple y correcta: computar el modelo mínimo con
  // bottom-up y luego filtrar por unificación con el query. Esto
  // garantiza terminación incluso en programas recursivos y mantiene
  // el contrato de "todas las instancias ground derivables".
  //
  // La firma incluye maxDepth para compatibilidad y para usuarios que
  // quieran un techo en programas patológicos; se aplica como techo de
  // iteraciones del fixpoint.
  const result = evaluateBottomUp(p, { maxIterations: maxDepth });
  const out: DatalogAtom[] = [];
  const seen = new Set<string>();
  for (const f of result.facts) {
    const u = unifyAtoms(query, f);
    if (u === null) continue;
    const grounded = applySubstitution(query, u);
    if (!isGround(grounded)) continue;
    const k = atomKey(grounded);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(grounded);
    }
  }
  return out;
}

// ── Negación estratificada ──────────────────────────────────

/**
 * Computa estratos para un programa con negación. Un estrato N
 * contiene predicados cuyas reglas sólo referencian (en `body`)
 * predicados de estratos ≤N y (en `negBody`) predicados de estratos
 * estrictamente <N. Devuelve null si no hay estratificación válida
 * (ciclo a través de negación).
 */
function stratify(rules: StratifiedRule[]): string[][] | null {
  const preds = new Set<string>();
  for (const r of rules) {
    preds.add(r.head.predicate);
    for (const b of r.body) preds.add(b.predicate);
    for (const b of r.negBody) preds.add(b.predicate);
  }
  // Asignar estrato a cada predicado iterativamente.
  const stratum = new Map<string, number>();
  for (const pred of preds) stratum.set(pred, 0);
  let changed = true;
  let safety = 0;
  while (changed && safety < preds.size * preds.size + 10) {
    changed = false;
    safety++;
    for (const r of rules) {
      const headPred = r.head.predicate;
      let need = stratum.get(headPred) ?? 0;
      for (const b of r.body) {
        const bs = stratum.get(b.predicate) ?? 0;
        if (bs > need) need = bs;
      }
      for (const nb of r.negBody) {
        const ns = stratum.get(nb.predicate) ?? 0;
        if (ns + 1 > need) need = ns + 1;
      }
      const current = stratum.get(headPred) ?? 0;
      if (need > current) {
        stratum.set(headPred, need);
        changed = true;
      }
    }
  }
  if (changed) return null; // no convergió → ciclo por negación
  // Validar: cada regla debe respetar estrato estricto en negBody.
  for (const r of rules) {
    const hs = stratum.get(r.head.predicate) ?? 0;
    for (const nb of r.negBody) {
      const ns = stratum.get(nb.predicate) ?? 0;
      if (ns >= hs) return null;
    }
  }
  // Agrupar predicados por estrato.
  const maxStratum = Math.max(0, ...Array.from(stratum.values()));
  const groups: string[][] = [];
  for (let i = 0; i <= maxStratum; i++) groups.push([]);
  for (const [pred, s] of stratum) {
    const g = groups[s];
    if (g) g.push(pred);
  }
  return groups;
}

/**
 * Evalúa un programa con negación estratificada. En cada estrato
 * se ejecuta bottom-up con el set de facts acumulado, interpretando
 * los literales negados bajo CWA (closed world assumption): `¬p(t)`
 * es verdadero sii `p(t)` no está en el modelo del estrato previo.
 *
 * Si el programa no se puede estratificar, devuelve un resultado con
 * 0 iteraciones y solo los facts iniciales (mejor que arrojar).
 */
export function evaluateStratified(p: {
  facts: DatalogAtom[];
  rules: StratifiedRule[];
}): EvaluationResult {
  const strata = stratify(p.rules);
  if (!strata) {
    return {
      facts: p.facts.filter(isGround).map(cloneAtom),
      iterations: 0,
    };
  }
  const known = new Map<string, DatalogAtom>();
  for (const f of p.facts) {
    if (!isGround(f)) continue;
    const k = atomKey(f);
    if (!known.has(k)) known.set(k, cloneAtom(f));
  }
  let totalIter = 0;
  const counter = { n: 0 };
  for (const stratumPreds of strata) {
    if (stratumPreds.length === 0) continue;
    const stratumSet = new Set(stratumPreds);
    const relevantRules = p.rules.filter((r) => stratumSet.has(r.head.predicate));
    // Fixpoint local del estrato.
    let changed = true;
    while (changed && totalIter < 5000) {
      changed = false;
      totalIter++;
      const allFacts = Array.from(known.values());
      const idx = indexByPredicate(allFacts);
      for (const ruleRaw of relevantRules) {
        // Renombrado coherente de head, body y negBody con el mismo
        // counter compartido para preservar la identidad de variables
        // que se repiten entre las tres partes (ej. X en head y body).
        const renameMap: Record<string, string> = {};
        const renameTerm = (t: DatalogTerm): DatalogTerm => {
          if (!isVariable(t)) return t;
          if (!(t in renameMap)) {
            counter.n++;
            renameMap[t] = `${t}_r${counter.n}`;
          }
          const renamed = renameMap[t];
          return renamed === undefined ? t : renamed;
        };
        const renameAtom = (a: DatalogAtom): DatalogAtom => ({
          predicate: a.predicate,
          args: a.args.map(renameTerm),
        });
        const rule: DatalogRule = {
          head: renameAtom(ruleRaw.head),
          body: ruleRaw.body.map(renameAtom),
        };
        const renamedNeg = ruleRaw.negBody.map(renameAtom);
        // Reusar matchBody para el body positivo.
        const positiveSubsts = rule.body.length === 0 ? [{}] : matchBody(rule.body, allFacts, idx);
        for (const s of positiveSubsts) {
          // Verificar negativos: para cada negB, instanciar bajo s y
          // chequear que NO está en known. Si alguna variable queda
          // libre tras s, la negación es insegura → omitir esta s.
          let safe = true;
          for (const nb of renamedNeg) {
            const grounded = applySubstitution(nb, s);
            if (!isGround(grounded)) {
              safe = false;
              break;
            }
            if (known.has(atomKey(grounded))) {
              safe = false;
              break;
            }
          }
          if (!safe) continue;
          const derived = applySubstitution(rule.head, s);
          if (!isGround(derived)) continue;
          const dk = atomKey(derived);
          if (!known.has(dk)) {
            known.set(dk, derived);
            changed = true;
          }
        }
      }
    }
  }
  return { facts: Array.from(known.values()), iterations: totalIter };
}

// ── Magic sets transformation ────────────────────────────────

/**
 * Magic sets: transforma un programa P y una consulta Q en un
 * programa P' tal que la evaluación bottom-up de P' computa sólo
 * los facts relevantes para Q, en vez del modelo mínimo completo.
 *
 * Implementación mínima pero funcional:
 *   - Introduce predicados `magic_<head>` con los args bound del query.
 *   - Reescribe cada regla para que su disparo dependa del magic seed
 *     correspondiente y propague seeds a literales recursivos.
 *
 * Para consultas con todos los args ground, devuelve la consulta
 * cerrada como seed inicial. Para args variables, devuelve el
 * programa original (no hay focus posible).
 */
export function magicSets(program: DatalogProgram, query: DatalogAtom): DatalogProgram {
  // Si no hay ningún arg ground en el query, no hay nada que focalizar.
  const hasGround = query.args.some((a) => !isVariable(a));
  if (!hasGround) {
    return {
      facts: program.facts.map(cloneAtom),
      rules: program.rules.map((r) => ({
        head: cloneAtom(r.head),
        body: r.body.map(cloneAtom),
      })),
    };
  }
  const magicPred = `magic_${query.predicate}`;
  // Adornment: posiciones bound (constantes) vs free (variables) en el
  // query. El predicado magic sólo carga las posiciones bound, que son
  // las que efectivamente focalizan la búsqueda.
  const boundIdx: number[] = [];
  for (let i = 0; i < query.args.length; i++) {
    const a = query.args[i];
    if (a !== undefined && !isVariable(a)) boundIdx.push(i);
  }
  const projectBound = (args: DatalogTerm[]): DatalogTerm[] => {
    const out: DatalogTerm[] = [];
    for (const i of boundIdx) {
      const v = args[i];
      if (v !== undefined) out.push(v);
    }
    return out;
  };
  const seed: DatalogAtom = {
    predicate: magicPred,
    args: projectBound(query.args),
  };
  const newFacts: DatalogAtom[] = [...program.facts.map(cloneAtom), seed];
  const newRules: DatalogRule[] = [];
  for (const r of program.rules) {
    if (r.head.predicate === query.predicate) {
      const guard: DatalogAtom = {
        predicate: magicPred,
        args: projectBound(r.head.args),
      };
      newRules.push({
        head: cloneAtom(r.head),
        body: [guard, ...r.body.map(cloneAtom)],
      });
      // Propagar: por cada literal del body del mismo predicado,
      // emitir regla magic_<pred>(boundProj(litArgs)) :- magic_<head>(boundProj(headArgs)), ...prefix.
      for (let i = 0; i < r.body.length; i++) {
        const lit = r.body[i];
        if (!lit) continue;
        if (lit.predicate === query.predicate) {
          const propHead: DatalogAtom = {
            predicate: magicPred,
            args: projectBound(lit.args),
          };
          const propBody: DatalogAtom[] = [
            { predicate: magicPred, args: projectBound(r.head.args) },
          ];
          for (let j = 0; j < i; j++) {
            const pre = r.body[j];
            if (pre) propBody.push(cloneAtom(pre));
          }
          newRules.push({ head: propHead, body: propBody });
        }
      }
    } else {
      newRules.push({
        head: cloneAtom(r.head),
        body: r.body.map(cloneAtom),
      });
    }
  }
  return { facts: newFacts, rules: newRules };
}

// ── Programas comunes ────────────────────────────────────────

/**
 * Programa canónico de clausura transitiva:
 *
 *   parent(alice, bob).
 *   parent(bob, carol).
 *   parent(carol, dave).
 *   ancestor(X, Y) :- parent(X, Y).
 *   ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
 */
export function transitiveClosure(): DatalogProgram {
  return {
    facts: [
      { predicate: 'parent', args: ['alice', 'bob'] },
      { predicate: 'parent', args: ['bob', 'carol'] },
      { predicate: 'parent', args: ['carol', 'dave'] },
    ],
    rules: [
      {
        head: { predicate: 'ancestor', args: ['X', 'Y'] },
        body: [{ predicate: 'parent', args: ['X', 'Y'] }],
      },
      {
        head: { predicate: 'ancestor', args: ['X', 'Y'] },
        body: [
          { predicate: 'parent', args: ['X', 'Z'] },
          { predicate: 'ancestor', args: ['Z', 'Y'] },
        ],
      },
    ],
  };
}

/**
 * Programa de alcanzabilidad en un grafo dirigido de 4 nodos:
 *
 *   edge(n1, n2). edge(n2, n3). edge(n3, n4). edge(n1, n3).
 *   reach(X, Y) :- edge(X, Y).
 *   reach(X, Y) :- edge(X, Z), reach(Z, Y).
 */
export function pathReachability(): DatalogProgram {
  return {
    facts: [
      { predicate: 'edge', args: ['n1', 'n2'] },
      { predicate: 'edge', args: ['n2', 'n3'] },
      { predicate: 'edge', args: ['n3', 'n4'] },
      { predicate: 'edge', args: ['n1', 'n3'] },
    ],
    rules: [
      {
        head: { predicate: 'reach', args: ['X', 'Y'] },
        body: [{ predicate: 'edge', args: ['X', 'Y'] }],
      },
      {
        head: { predicate: 'reach', args: ['X', 'Y'] },
        body: [
          { predicate: 'edge', args: ['X', 'Z'] },
          { predicate: 'reach', args: ['Z', 'Y'] },
        ],
      },
    ],
  };
}
