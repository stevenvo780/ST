// ============================================================
// ST Model Checking — Explicit-state model checker
// ============================================================
//
// Verificación de propiedades sobre sistemas de transiciones
// finitos (Kripke structures) mediante exploración explícita
// del espacio de estados:
//
//   - Reachability: BFS desde estados iniciales con cota opcional.
//   - Safety (G p / invariant p): DFS que falla en el primer
//     estado donde p no se cumple y devuelve traza desde inicial.
//   - Liveness (GF p, FG p): exploración con detección de ciclos
//     accesibles (lasso = stem + loop) para encontrar contraejemplos
//     o testigos.
//   - Bounded model checking: BFS truncado a profundidad k.
//   - Detección de deadlock: estado alcanzable sin sucesores.
//
// El espacio de estados es genérico: el usuario provee una
// función `successors`, una función `hash` (clave canónica para
// detección de visitados) y `labels` (proposiciones atómicas que
// hold en el estado, opcional para uso futuro con LTL completo).
//
// Diseño:
//   - Cada estado se canoniza por `hash(s)` (string). El usuario
//     debe garantizar que estados equivalentes produzcan el mismo
//     hash, y estados distintos hashes distintos.
//   - Trazas y lassos se devuelven como arrays de S (no de hashes)
//     para que el caller pueda inspeccionar los estados.
//   - Las funciones nunca lanzan: cap `maxStates` para evitar
//     explosión combinatoria sobre sistemas no acotados.
//
// Convención: las propiedades reciben un estado y devuelven boolean;
// se asume que son puras y deterministas sobre el estado.

// ── Tipos básicos ───────────────────────────────────────────

export interface StateSpace<S> {
  /** Estados iniciales (≥1). */
  initial: S[];
  /** Sucesores inmediatos de un estado. Vacío = estado deadlock. */
  successors: (s: S) => S[];
  /** Proposiciones atómicas que hold en el estado. */
  labels: (s: S) => Set<string>;
  /** Igualdad estructural (en práctica raramente usada: hash es la fuente de verdad). */
  equals: (a: S, b: S) => boolean;
  /** Clave canónica del estado para visited set. */
  hash: (s: S) => string;
}

export interface ReachabilityResult<S> {
  /** Estados únicos alcanzados desde initial. */
  states: S[];
  /** Total de estados visitados (== states.length salvo cota). */
  explored: number;
  /** True si se cortó por `maxStates`. */
  truncated: boolean;
}

export interface SafetyResult<S> {
  safe: boolean;
  /** Traza desde algún initial hasta el violatingState (incluido). */
  trace?: S[];
  /** Estado donde la propiedad falló. */
  violatingState?: S;
}

export interface LivenessResult<S> {
  holds: boolean;
  /** Si `holds=false`: ciclo testigo del contraejemplo (stem→loop). */
  lasso?: { stem: S[]; loop: S[] };
}

export interface DeadlockResult<S> {
  deadlocked: boolean;
  state?: S;
  /** Traza desde initial hasta el estado sin sucesores. */
  trace?: S[];
}

interface ReachabilityOpts {
  /** Tope duro de estados visitados. Default 100000. */
  maxStates?: number;
}

const DEFAULT_MAX_STATES = 100_000;

// ── Reachability (BFS) ───────────────────────────────────────

/**
 * Calcula el conjunto de estados alcanzables desde los estados
 * iniciales del espacio. BFS por nivel; se detiene al agotar la
 * frontera o al alcanzar `maxStates`.
 */
export function reachableStates<S>(
  space: StateSpace<S>,
  opts: ReachabilityOpts = {},
): ReachabilityResult<S> {
  const maxStates = opts.maxStates ?? DEFAULT_MAX_STATES;
  const visited = new Map<string, S>();
  const queue: S[] = [];

  for (const s of space.initial) {
    const h = space.hash(s);
    if (!visited.has(h)) {
      visited.set(h, s);
      queue.push(s);
    }
  }

  let truncated = false;
  while (queue.length > 0) {
    if (visited.size >= maxStates) {
      truncated = true;
      break;
    }
    const cur = queue.shift() as S;
    for (const next of space.successors(cur)) {
      const h = space.hash(next);
      if (!visited.has(h)) {
        visited.set(h, next);
        queue.push(next);
        if (visited.size >= maxStates) {
          truncated = true;
          break;
        }
      }
    }
    if (truncated) break;
  }

  return {
    states: Array.from(visited.values()),
    explored: visited.size,
    truncated,
  };
}

// ── Reconstrucción de trazas ────────────────────────────────

/**
 * Reconstruye una traza desde un estado raíz (de `roots`) hasta
 * el estado con hash `targetHash`, usando el mapa `parent` que
 * mapea hash de hijo → { parent: S, hash: string } o null si root.
 */
function reconstructTrace<S>(
  parent: Map<string, { parent: S; parentHash: string } | null>,
  byHash: Map<string, S>,
  targetHash: string,
): S[] {
  const path: S[] = [];
  let h: string | null = targetHash;
  const guard = new Set<string>();
  while (h !== null) {
    if (guard.has(h)) break; // safety: no debería pasar
    guard.add(h);
    const node = byHash.get(h);
    if (node === undefined) break;
    path.push(node);
    const p = parent.get(h);
    if (!p) break;
    h = p.parentHash;
  }
  return path.reverse();
}

// ── Safety (BFS con tracking de padre) ──────────────────────

/**
 * Verifica que `predicate` se cumple en *todos* los estados
 * alcanzables. Si encuentra un estado violador, devuelve una
 * traza mínima desde algún initial hasta él. Equivale a G p.
 */
export function checkSafety<S>(
  space: StateSpace<S>,
  predicate: (s: S) => boolean,
  opts: ReachabilityOpts = {},
): SafetyResult<S> {
  const maxStates = opts.maxStates ?? DEFAULT_MAX_STATES;
  const visited = new Set<string>();
  const byHash = new Map<string, S>();
  const parent = new Map<string, { parent: S; parentHash: string } | null>();
  const queue: S[] = [];

  for (const s of space.initial) {
    const h = space.hash(s);
    if (visited.has(h)) continue;
    visited.add(h);
    byHash.set(h, s);
    parent.set(h, null);
    if (!predicate(s)) {
      return { safe: false, violatingState: s, trace: [s] };
    }
    queue.push(s);
  }

  while (queue.length > 0 && visited.size < maxStates) {
    const cur = queue.shift() as S;
    const curHash = space.hash(cur);
    for (const next of space.successors(cur)) {
      const h = space.hash(next);
      if (visited.has(h)) continue;
      visited.add(h);
      byHash.set(h, next);
      parent.set(h, { parent: cur, parentHash: curHash });
      if (!predicate(next)) {
        return {
          safe: false,
          violatingState: next,
          trace: reconstructTrace(parent, byHash, h),
        };
      }
      queue.push(next);
    }
  }

  return { safe: true };
}

/** Alias semántico: invariante = safety check con el mismo predicado. */
export function checkInvariant<S>(
  space: StateSpace<S>,
  invariant: (s: S) => boolean,
  opts: ReachabilityOpts = {},
): SafetyResult<S> {
  return checkSafety(space, invariant, opts);
}

// ── Bounded Model Checking ──────────────────────────────────

/**
 * BMC: busca un estado donde `predicate` falla dentro de los
 * primeros `depth` pasos desde initial. No certifica safety
 * global; sirve para encontrar contraejemplos cortos.
 *
 * `depth=0` solo evalúa estados iniciales.
 */
export function bmc<S>(
  space: StateSpace<S>,
  predicate: (s: S) => boolean,
  depth: number,
): SafetyResult<S> {
  if (!Number.isFinite(depth) || depth < 0) {
    return { safe: true };
  }
  const visited = new Set<string>();
  const byHash = new Map<string, S>();
  const parent = new Map<string, { parent: S; parentHash: string } | null>();
  // Cola con profundidad (BFS por nivel).
  const queue: Array<{ s: S; d: number }> = [];

  for (const s of space.initial) {
    const h = space.hash(s);
    if (visited.has(h)) continue;
    visited.add(h);
    byHash.set(h, s);
    parent.set(h, null);
    if (!predicate(s)) {
      return { safe: false, violatingState: s, trace: [s] };
    }
    queue.push({ s, d: 0 });
  }

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const { s: cur, d } = item;
    if (d >= depth) continue;
    const curHash = space.hash(cur);
    for (const next of space.successors(cur)) {
      const h = space.hash(next);
      if (visited.has(h)) continue;
      visited.add(h);
      byHash.set(h, next);
      parent.set(h, { parent: cur, parentHash: curHash });
      if (!predicate(next)) {
        return {
          safe: false,
          violatingState: next,
          trace: reconstructTrace(parent, byHash, h),
        };
      }
      queue.push({ s: next, d: d + 1 });
    }
  }

  return { safe: true };
}

// ── Deadlock ────────────────────────────────────────────────

/**
 * Detecta el primer estado alcanzable sin sucesores. Devuelve la
 * traza desde initial hasta ese estado para diagnóstico.
 */
export function hasDeadlock<S>(
  space: StateSpace<S>,
  opts: ReachabilityOpts = {},
): DeadlockResult<S> {
  const maxStates = opts.maxStates ?? DEFAULT_MAX_STATES;
  const visited = new Set<string>();
  const byHash = new Map<string, S>();
  const parent = new Map<string, { parent: S; parentHash: string } | null>();
  const queue: S[] = [];

  for (const s of space.initial) {
    const h = space.hash(s);
    if (visited.has(h)) continue;
    visited.add(h);
    byHash.set(h, s);
    parent.set(h, null);
    queue.push(s);
  }

  while (queue.length > 0 && visited.size < maxStates) {
    const cur = queue.shift() as S;
    const curHash = space.hash(cur);
    const succ = space.successors(cur);
    if (succ.length === 0) {
      return {
        deadlocked: true,
        state: cur,
        trace: reconstructTrace(parent, byHash, curHash),
      };
    }
    for (const next of succ) {
      const h = space.hash(next);
      if (visited.has(h)) continue;
      visited.add(h);
      byHash.set(h, next);
      parent.set(h, { parent: cur, parentHash: curHash });
      queue.push(next);
    }
  }

  return { deadlocked: false };
}

// ── Búsqueda de lassos para liveness ────────────────────────

/**
 * Tarjan-like SCC sobre el sub-grafo de estados que cumplen
 * `accepting`. Para GF p (always-eventually p): el sistema GF p
 * holds sii toda SCC no-trivial accesible contiene al menos un
 * estado donde p hold. Simplificación útil: bucle infinito
 * factible sii hay un ciclo (≥1 arista) en la parte alcanzable
 * cuyo support incluye un estado con p=true.
 *
 * Para FG p (eventually-always): hay ciclo enteramente dentro
 * del subgrafo p=true accesible. Equivalente: una SCC no trivial
 * contenida en el subgrafo restringido a estados p=true.
 */

function tarjanSCCs<S>(
  space: StateSpace<S>,
  nodes: Map<string, S>,
  edgeFilter: (from: S, to: S) => boolean,
): Array<string[]> {
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: Array<string[]> = [];
  let idx = 0;

  // Iterativo para evitar stack overflow en grafos grandes.
  type Frame = { hash: string; node: S; succHashes: string[]; i: number };
  const callStack: Frame[] = [];

  for (const [startHash, startNode] of nodes) {
    if (indices.has(startHash)) continue;

    indices.set(startHash, idx);
    lowlink.set(startHash, idx);
    idx += 1;
    stack.push(startHash);
    onStack.add(startHash);
    const startSucc = space
      .successors(startNode)
      .filter((n) => {
        if (!edgeFilter(startNode, n)) return false;
        return nodes.has(space.hash(n));
      })
      .map((n) => space.hash(n));
    callStack.push({ hash: startHash, node: startNode, succHashes: startSucc, i: 0 });

    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];
      if (!frame) break;
      if (frame.i < frame.succHashes.length) {
        const wHash = frame.succHashes[frame.i];
        frame.i += 1;
        if (!indices.has(wHash)) {
          const wNode = nodes.get(wHash);
          if (!wNode) continue;
          indices.set(wHash, idx);
          lowlink.set(wHash, idx);
          idx += 1;
          stack.push(wHash);
          onStack.add(wHash);
          const wSucc = space
            .successors(wNode)
            .filter((n) => {
              if (!edgeFilter(wNode, n)) return false;
              return nodes.has(space.hash(n));
            })
            .map((n) => space.hash(n));
          callStack.push({ hash: wHash, node: wNode, succHashes: wSucc, i: 0 });
        } else if (onStack.has(wHash)) {
          const wIdx = indices.get(wHash) as number;
          const cur = lowlink.get(frame.hash) as number;
          if (wIdx < cur) lowlink.set(frame.hash, wIdx);
        }
      } else {
        // Pop the frame, propagate lowlink up.
        const finishedHash = frame.hash;
        callStack.pop();
        const flow = lowlink.get(finishedHash) as number;
        const findex = indices.get(finishedHash) as number;
        if (flow === findex) {
          const scc: string[] = [];
          while (stack.length > 0) {
            const top = stack.pop() as string;
            onStack.delete(top);
            scc.push(top);
            if (top === finishedHash) break;
          }
          sccs.push(scc);
        }
        const parentFrame = callStack[callStack.length - 1];
        if (parentFrame) {
          const pl = lowlink.get(parentFrame.hash) as number;
          if (flow < pl) lowlink.set(parentFrame.hash, flow);
        }
      }
    }
  }

  return sccs;
}

/**
 * Determina si una SCC es no-trivial: tiene >1 nodos o un único
 * nodo con auto-bucle (self-loop) bajo `edgeFilter`.
 */
function sccNonTrivial<S>(
  space: StateSpace<S>,
  scc: string[],
  nodes: Map<string, S>,
  edgeFilter: (from: S, to: S) => boolean,
): boolean {
  if (scc.length === 0) return false;
  if (scc.length > 1) return true;
  const onlyHash = scc[0];
  const onlyNode = nodes.get(onlyHash);
  if (!onlyNode) return false;
  for (const next of space.successors(onlyNode)) {
    if (!edgeFilter(onlyNode, next)) continue;
    if (space.hash(next) === onlyHash) return true;
  }
  return false;
}

/**
 * Encuentra un ciclo (loop) dentro de una SCC con ≥1 arista y
 * lo devuelve como array de estados (cerrado: último → primero).
 * Asume SCC no-trivial bajo `edgeFilter`.
 */
function findCycleInSCC<S>(
  space: StateSpace<S>,
  scc: string[],
  nodes: Map<string, S>,
  edgeFilter: (from: S, to: S) => boolean,
): S[] {
  const sccSet = new Set(scc);
  if (scc.length === 1) {
    const onlyHash = scc[0];
    const onlyNode = nodes.get(onlyHash);
    if (!onlyNode) return [];
    return [onlyNode];
  }
  // BFS dentro de la SCC desde un nodo arbitrario hasta volver.
  const startHash = scc[0];
  const start = nodes.get(startHash);
  if (!start) return [];

  // Buscamos el camino más corto start → start con ≥1 arista.
  const parent = new Map<string, { parentHash: string; node: S }>();
  const queue: Array<{ hash: string; node: S }> = [];
  const succs = space
    .successors(start)
    .filter((n) => edgeFilter(start, n) && sccSet.has(space.hash(n)));
  for (const n of succs) {
    const h = space.hash(n);
    if (!parent.has(h)) {
      parent.set(h, { parentHash: startHash, node: start });
      if (h === startHash) {
        // self-loop (no debería entrar aquí porque scc.length>1, pero por defensa)
        return [start];
      }
      queue.push({ hash: h, node: n });
    }
  }

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const { hash: curHash, node: cur } = item;
    if (curHash === startHash) break;
    for (const next of space.successors(cur)) {
      if (!edgeFilter(cur, next)) continue;
      const nh = space.hash(next);
      if (!sccSet.has(nh)) continue;
      if (parent.has(nh)) continue;
      parent.set(nh, { parentHash: curHash, node: cur });
      if (nh === startHash) {
        // reconstruir start → ... → cur → start
        const path: S[] = [start];
        const inverse: S[] = [];
        let h: string = curHash;
        while (h !== startHash) {
          const p = parent.get(h);
          if (!p) break;
          inverse.push(p.node);
          if (p.parentHash === startHash) break;
          h = p.parentHash;
        }
        // inverse va desde cur hacia atrás hasta el sucesor inmediato de start.
        // path es [start, ...inverse.reverse(), cur]
        // pero start ya está; añadimos camino inverso revertido (sin start), y luego cur.
        // Cuidado: si solo hay 1 paso (start→cur→start), inverse = [start] (porque parent[cur] = start)
        // path final esperado: [start, cur]
        const inner = inverse.reverse();
        // inner ahora incluye start como primer elemento si vino directo; lo limpiamos:
        if (inner.length > 0 && space.hash(inner[0]) === startHash) {
          inner.shift();
        }
        for (const x of inner) path.push(x);
        path.push(cur);
        return path;
      }
      queue.push({ hash: nh, node: next });
    }
  }

  // Fallback: ciclo trivial alrededor de start (no debería ocurrir si SCC es real).
  return [start];
}

/**
 * Camino más corto desde algún initial hasta `targetHash`,
 * dentro del sub-grafo restringido por `nodes` y `edgeFilter`.
 * Si no hay camino, devuelve [].
 */
function bfsStem<S>(
  space: StateSpace<S>,
  targetHash: string,
  nodes: Map<string, S>,
  edgeFilter: (from: S, to: S) => boolean,
): S[] {
  const parent = new Map<string, { parentHash: string; node: S }>();
  const visited = new Set<string>();
  const byHash = new Map<string, S>();
  const queue: S[] = [];

  for (const s of space.initial) {
    const h = space.hash(s);
    if (!nodes.has(h)) continue;
    if (visited.has(h)) continue;
    visited.add(h);
    byHash.set(h, s);
    if (h === targetHash) {
      return [s];
    }
    queue.push(s);
  }

  while (queue.length > 0) {
    const cur = queue.shift() as S;
    const curHash = space.hash(cur);
    for (const next of space.successors(cur)) {
      if (!edgeFilter(cur, next)) continue;
      const nh = space.hash(next);
      if (!nodes.has(nh)) continue;
      if (visited.has(nh)) continue;
      visited.add(nh);
      byHash.set(nh, next);
      parent.set(nh, { parentHash: curHash, node: cur });
      if (nh === targetHash) {
        // Reconstruir
        const path: S[] = [next];
        let h: string = curHash;
        while (true) {
          const node = byHash.get(h);
          if (!node) break;
          path.push(node);
          const p = parent.get(h);
          if (!p) break;
          h = p.parentHash;
        }
        return path.reverse();
      }
      queue.push(next);
    }
  }

  return [];
}

// ── Liveness: GF p (always eventually p) ────────────────────

/**
 * GF p: en todo camino infinito, p ocurre infinitas veces.
 * Contraejemplo: lasso accesible (stem + loop) tal que NINGÚN
 * estado del loop satisface p (porque entonces existe un camino
 * infinito que evita p eventualmente).
 *
 * Algoritmo: SCCs no-triviales accesibles desde initial; si alguna
 * NO contiene estado p=true → contraejemplo. Si todas las SCCs
 * no-triviales accesibles contienen al menos un estado p=true,
 * holds.
 */
export function checkAlwaysEventually<S>(
  space: StateSpace<S>,
  p: (s: S) => boolean,
  opts: ReachabilityOpts = {},
): LivenessResult<S> {
  const reach = reachableStates(space, opts);
  const nodes = new Map<string, S>();
  for (const s of reach.states) nodes.set(space.hash(s), s);

  const allEdges = (_a: S, _b: S): boolean => true;
  const sccs = tarjanSCCs(space, nodes, allEdges);

  for (const scc of sccs) {
    if (!sccNonTrivial(space, scc, nodes, allEdges)) continue;
    // ¿Hay algún estado en la SCC que satisfaga p?
    let containsP = false;
    for (const h of scc) {
      const node = nodes.get(h);
      if (node && p(node)) {
        containsP = true;
        break;
      }
    }
    if (!containsP) {
      // Construir contraejemplo lasso.
      const loop = findCycleInSCC(space, scc, nodes, allEdges);
      const target = loop[0];
      if (!target) continue;
      const stem = bfsStem(space, space.hash(target), nodes, allEdges);
      if (stem.length === 0) continue;
      return { holds: false, lasso: { stem, loop } };
    }
  }

  return { holds: true };
}

// ── Liveness: FG p (eventually always p) ────────────────────

/**
 * FG p: existe un punto a partir del cual p siempre holds.
 *
 * Holds sii: existe un lasso accesible cuyo loop está contenido
 * íntegramente en {s | p(s)}. Es decir, SCC no-trivial accesible
 * dentro del sub-grafo inducido por p=true.
 */
export function checkEventuallyAlways<S>(
  space: StateSpace<S>,
  p: (s: S) => boolean,
  opts: ReachabilityOpts = {},
): LivenessResult<S> {
  const reach = reachableStates(space, opts);
  // Sub-grafo de estados con p=true.
  const pNodes = new Map<string, S>();
  for (const s of reach.states) {
    if (p(s)) pNodes.set(space.hash(s), s);
  }
  // Aristas internas (from y to en pNodes).
  const internalEdges = (from: S, to: S): boolean => {
    return pNodes.has(space.hash(from)) && pNodes.has(space.hash(to));
  };
  const sccs = tarjanSCCs(space, pNodes, internalEdges);

  for (const scc of sccs) {
    if (!sccNonTrivial(space, scc, pNodes, internalEdges)) continue;
    const loop = findCycleInSCC(space, scc, pNodes, internalEdges);
    const target = loop[0];
    if (!target) continue;
    // El stem se construye en el grafo completo, no en el sub-grafo.
    const allNodes = new Map<string, S>();
    for (const s of reach.states) allNodes.set(space.hash(s), s);
    const allEdges = (_a: S, _b: S): boolean => true;
    const stem = bfsStem(space, space.hash(target), allNodes, allEdges);
    if (stem.length === 0) continue;
    return { holds: true, lasso: { stem, loop } };
  }

  return { holds: false };
}

// ── Ejemplos estándar ───────────────────────────────────────

// 1) Mutual exclusion (Peterson-like simplificado): dos procesos
//    p1, p2 con estados idle → waiting → critical, y un `turn`.
//    Un proceso entra a critical solo si turn==self o el otro
//    está idle. Tras critical vuelve a idle.

export type MutexProcState = 'idle' | 'waiting' | 'critical';
export interface MutexState {
  p1: MutexProcState;
  p2: MutexProcState;
  turn: 1 | 2;
}

export function mutualExclusionSpace(): StateSpace<MutexState> {
  const initial: MutexState[] = [
    { p1: 'idle', p2: 'idle', turn: 1 },
    { p1: 'idle', p2: 'idle', turn: 2 },
  ];

  function step(proc: 1 | 2, s: MutexState): MutexState[] {
    const my: MutexProcState = proc === 1 ? s.p1 : s.p2;
    const other: MutexProcState = proc === 1 ? s.p2 : s.p1;
    const otherProc: 1 | 2 = proc === 1 ? 2 : 1;
    const out: MutexState[] = [];
    const set = (mine: MutexProcState, turn: 1 | 2): MutexState => {
      if (proc === 1) return { p1: mine, p2: s.p2, turn };
      return { p1: s.p1, p2: mine, turn };
    };
    if (my === 'idle') {
      // Peterson: al entrar en waiting, cedo turn al otro.
      out.push(set('waiting', otherProc));
    } else if (my === 'waiting') {
      // Entra a critical sii turn==self o other==idle.
      if (s.turn === proc || other === 'idle') {
        out.push(set('critical', s.turn));
      }
    } else {
      // critical → idle, conserva turn (el otro ya lo tendrá si tocó).
      out.push(set('idle', s.turn));
    }
    return out;
  }

  return {
    initial,
    successors: (s) => [...step(1, s), ...step(2, s)],
    labels: (s) => {
      const ls = new Set<string>();
      if (s.p1 === 'critical') ls.add('p1_critical');
      if (s.p2 === 'critical') ls.add('p2_critical');
      if (s.p1 === 'critical' && s.p2 === 'critical') ls.add('mutex_violation');
      return ls;
    },
    equals: (a, b) => a.p1 === b.p1 && a.p2 === b.p2 && a.turn === b.turn,
    hash: (s) => `${s.p1}|${s.p2}|${s.turn}`,
  };
}

// 2) Dining philosophers: N filósofos en círculo, N tenedores.
//    Cada filósofo: thinking → holds-left → holds-both → eating
//    → releases-both → thinking. Estado: tenedores tomados +
//    estado de cada filósofo.

export type PhilState = 'thinking' | 'has_left' | 'eating';
export interface DiningState {
  phils: PhilState[];
  forks: boolean[]; // forks[i] = true sii tomado
}

export function diningPhilosophersSpace(n: number): StateSpace<DiningState> {
  if (n < 2) throw new Error('n>=2 required');

  const initialPhils: PhilState[] = Array.from({ length: n }, () => 'thinking');
  const initialForks: boolean[] = Array.from({ length: n }, () => false);
  const initial: DiningState[] = [{ phils: initialPhils, forks: initialForks }];

  function leftFork(i: number): number {
    return i;
  }
  function rightFork(i: number): number {
    return (i + 1) % n;
  }

  function step(i: number, s: DiningState): DiningState[] {
    const phil = s.phils[i];
    const out: DiningState[] = [];
    const cloneArr = <T>(a: T[]): T[] => a.slice();

    if (phil === 'thinking') {
      const lf = leftFork(i);
      if (!s.forks[lf]) {
        const newPhils = cloneArr(s.phils);
        newPhils[i] = 'has_left';
        const newForks = cloneArr(s.forks);
        newForks[lf] = true;
        out.push({ phils: newPhils, forks: newForks });
      }
    } else if (phil === 'has_left') {
      const rf = rightFork(i);
      if (!s.forks[rf]) {
        const newPhils = cloneArr(s.phils);
        newPhils[i] = 'eating';
        const newForks = cloneArr(s.forks);
        newForks[rf] = true;
        out.push({ phils: newPhils, forks: newForks });
      }
    } else {
      // eating → thinking, libera ambos.
      const newPhils = cloneArr(s.phils);
      newPhils[i] = 'thinking';
      const newForks = cloneArr(s.forks);
      newForks[leftFork(i)] = false;
      newForks[rightFork(i)] = false;
      out.push({ phils: newPhils, forks: newForks });
    }
    return out;
  }

  return {
    initial,
    successors: (s) => {
      const out: DiningState[] = [];
      for (let i = 0; i < n; i += 1) {
        for (const next of step(i, s)) out.push(next);
      }
      return out;
    },
    labels: (s) => {
      const ls = new Set<string>();
      for (let i = 0; i < n; i += 1) {
        if (s.phils[i] === 'eating') ls.add(`eating_${i}`);
      }
      return ls;
    },
    equals: (a, b) => {
      if (a.phils.length !== b.phils.length) return false;
      for (let i = 0; i < a.phils.length; i += 1) {
        if (a.phils[i] !== b.phils[i]) return false;
      }
      if (a.forks.length !== b.forks.length) return false;
      for (let i = 0; i < a.forks.length; i += 1) {
        if (a.forks[i] !== b.forks[i]) return false;
      }
      return true;
    },
    hash: (s) => `P:${s.phils.join(',')}|F:${s.forks.map((b) => (b ? '1' : '0')).join('')}`,
  };
}

// 3) Reader-writer (versión simple sin starvation control).
//    Estado: número de readers activos (0..numReaders) y un flag
//    de writer activo. Transiciones: acquireRead (si !writer),
//    releaseRead, acquireWrite (si readers==0 && !writer),
//    releaseWrite.

export interface RWState {
  readers: number;
  writer: boolean;
  maxReaders: number;
}

export function readerWriterSpace(numReaders: number): StateSpace<RWState> {
  if (numReaders < 1) throw new Error('numReaders>=1 required');
  const initial: RWState[] = [{ readers: 0, writer: false, maxReaders: numReaders }];

  return {
    initial,
    successors: (s) => {
      const out: RWState[] = [];
      // Adquirir lectura.
      if (!s.writer && s.readers < s.maxReaders) {
        out.push({ readers: s.readers + 1, writer: false, maxReaders: s.maxReaders });
      }
      // Liberar lectura.
      if (s.readers > 0) {
        out.push({ readers: s.readers - 1, writer: false, maxReaders: s.maxReaders });
      }
      // Adquirir escritura.
      if (s.readers === 0 && !s.writer) {
        out.push({ readers: 0, writer: true, maxReaders: s.maxReaders });
      }
      // Liberar escritura.
      if (s.writer) {
        out.push({ readers: 0, writer: false, maxReaders: s.maxReaders });
      }
      return out;
    },
    labels: (s) => {
      const ls = new Set<string>();
      if (s.writer) ls.add('writer');
      if (s.readers > 0) ls.add('reading');
      if (s.writer && s.readers > 0) ls.add('rw_violation');
      return ls;
    },
    equals: (a, b) =>
      a.readers === b.readers && a.writer === b.writer && a.maxReaders === b.maxReaders,
    hash: (s) => `R:${s.readers}|W:${s.writer ? '1' : '0'}|M:${s.maxReaders}`,
  };
}
