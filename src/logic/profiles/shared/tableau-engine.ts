// ============================================================
// ST Tableau Engine — Motor genérico de Labeled Tableau
// ============================================================
// Parametrizable con FrameRules para soportar distintos
// sistemas modales (K, KD, S4, S5, etc.) sin duplicar código.
// ============================================================

import { Formula, TableauTraceEntry } from '../../../types';
import { toNNF } from '../classical/propositional';

// ── Tipos públicos ──────────────────────────────────────────

export interface LabeledNode {
  readonly formula: Formula;
  readonly world: string;
}

export interface GammaWatcher {
  readonly innerFormula: Formula;
  readonly sourceWorld: string;
}

export interface Branch {
  literals: LabeledNode[];
  pending: LabeledNode[];
  accessibility: Map<string, Set<string>>;
  nextWorlds: Map<string, string>;
  worlds: Set<string>;
  gammaWatchers: GammaWatcher[];
  processed: Set<string>;
  worldCounter: number;
  branchId: string;
  trace: TableauTraceEntry[];
}

/**
 * FrameRules parametriza el comportamiento del tableau según
 * las propiedades de la relación de accesibilidad.
 */
export interface FrameRules {
  /**
   * Gamma (□φ): ¿en qué mundos se instancia inner?
   * Recibe el mundo fuente, branch actual, y devuelve los mundos target.
   */
  gammaTargets(sourceWorld: string, branch: Branch): string[];

  /**
   * Delta (◇φ): crea un mundo nuevo. ¿Qué gamma-watchers se instancian?
   * Recibe el mundo fuente, nuevo mundo, y branch.
   * Devuelve los gamma-watchers que deben instanciarse en newWorld.
   */
  deltaGammaWatchers(sourceWorld: string, newWorld: string, branch: Branch): GammaWatcher[];

  /**
   * Hook opcional post-saturación: ¿forzar creación de mundos?
   * Ej: serialidad en KD, reflexividad en T.
   * Devuelve true si se agregaron nodos (continuar expansión).
   */
  enforceFrameConditions?(branch: Branch): boolean;

  /**
   * Si está activo, X(φ) reutiliza un único sucesor inmediato por mundo.
   * Esto evita tratar `next` como un diamante modal arbitrario.
   */
  deterministicNext?: boolean;
}

// ── Reglas de marco preconfiguradas ─────────────────────────

/** K: sin restricciones — gamma solo a accesibles, delta solo instancia watchers del source */
export const FRAME_K: FrameRules = {
  gammaTargets(source, branch) {
    return Array.from(branch.accessibility.get(source) || []);
  },
  deltaGammaWatchers(source, _newWorld, branch) {
    return branch.gammaWatchers.filter((gw) => gw.sourceWorld === source);
  },
};

/** KD: K + serialidad (todo mundo tiene al menos un sucesor) */
export const FRAME_KD: FrameRules = {
  gammaTargets(source, branch) {
    return Array.from(branch.accessibility.get(source) || []);
  },
  deltaGammaWatchers(source, _newWorld, branch) {
    return branch.gammaWatchers.filter((gw) => gw.sourceWorld === source);
  },
  enforceFrameConditions(branch) {
    const worldsRequiringSuccessor = new Set<string>();
    for (const gw of branch.gammaWatchers) worldsRequiringSuccessor.add(gw.sourceWorld);
    for (const pending of branch.pending) {
      if (classify(pending.formula) === 'delta') {
        worldsRequiringSuccessor.add(pending.world);
      }
    }
    let applied = false;
    for (const w of worldsRequiringSuccessor) {
      const successors = branch.accessibility.get(w);
      if (!successors || successors.size === 0) {
        const newWorld = `w${branch.worldCounter++}`;
        if (!branch.accessibility.has(w)) branch.accessibility.set(w, new Set());
        (branch.accessibility.get(w) as Set<string>).add(newWorld);
        branch.worlds.add(newWorld);
        for (const gw of branch.gammaWatchers) {
          if (gw.sourceWorld === w) {
            const key = `${newWorld}:${formulaHash(gw.innerFormula)}`;
            if (!branch.processed.has(key)) {
              branch.pending.push({ formula: gw.innerFormula, world: newWorld });
            }
          }
        }
        applied = true;
      }
    }
    return applied;
  },
};

/** S5: relación universal — gamma se instancia en TODOS los mundos */
export const FRAME_S5: FrameRules = {
  gammaTargets(_source, branch) {
    return Array.from(branch.worlds);
  },
  deltaGammaWatchers(_source, _newWorld, branch) {
    // En S5 TODOS los gamma-watchers aplican a todo mundo nuevo
    return [...branch.gammaWatchers];
  },
};

/** T (reflexivo): K + reflexividad */
export const FRAME_T: FrameRules = {
  gammaTargets(source, branch) {
    const accessible = Array.from(branch.accessibility.get(source) || []);
    // Reflexividad: incluir el propio mundo
    if (!accessible.includes(source)) accessible.push(source);
    return accessible;
  },
  deltaGammaWatchers(source, _newWorld, branch) {
    return branch.gammaWatchers.filter((gw) => gw.sourceWorld === source);
  },
};

/** S4: reflexivo + transitivo */
export const FRAME_S4: FrameRules = {
  gammaTargets(source, branch) {
    // Cierre transitivo-reflexivo
    const visited = new Set<string>();
    const queue = [source];
    while (queue.length > 0) {
      const w = queue.shift() as string;
      if (visited.has(w)) continue;
      visited.add(w);
      for (const next of branch.accessibility.get(w) || []) {
        queue.push(next);
      }
    }
    return Array.from(visited);
  },
  deltaGammaWatchers(source, _newWorld, branch) {
    // En S4 con transitividad, todos los watchers que puedan alcanzar source
    return branch.gammaWatchers.filter((gw) => {
      const reachable = new Set<string>();
      const queue = [gw.sourceWorld];
      while (queue.length > 0) {
        const w = queue.shift() as string;
        if (reachable.has(w)) continue;
        reachable.add(w);
        for (const next of branch.accessibility.get(w) || []) queue.push(next);
      }
      return reachable.has(source);
    });
  },
};

// ── Utilidades exportadas ───────────────────────────────────

export function formulaEqual(a: Formula, b: Formula): boolean {
  return alphaEqual(a, b, new Map(), new Map());
}

/**
 * Alpha-equivalencia: ∀x.P(x) ≡ ∀y.P(y)
 * Compara fórmulas módulo renombramiento de variables ligadas.
 */
function alphaEqual(
  a: Formula,
  b: Formula,
  envA: Map<string, number>,
  envB: Map<string, number>,
  depth: number = 0,
): boolean {
  if (a.kind !== b.kind) return false;

  // Átomos y variables: comparar nombres teniendo en cuenta bindings
  if (a.kind === 'atom' && b.kind === 'atom') {
    const nameA = a.name || '?';
    const nameB = b.name || '?';
    const boundA = envA.get(nameA);
    const boundB = envB.get(nameB);
    // Si ambos están ligados, comparar nivel de binding
    if (boundA !== undefined && boundB !== undefined) return boundA === boundB;
    // Si ninguno está ligado, comparar nombres directamente
    if (boundA === undefined && boundB === undefined) return nameA === nameB;
    // Uno ligado y otro libre → no iguales
    return false;
  }

  // Predicados: comparar nombre y parámetros
  if (a.kind === 'predicate' && b.kind === 'predicate') {
    if (a.name !== b.name) return false;
    const pa = a.params || [];
    const pb = b.params || [];
    if (pa.length !== pb.length) return false;
    return pa.every((p, i) => {
      const boundA = envA.get(p);
      const boundB = envB.get(pb[i]);
      if (boundA !== undefined && boundB !== undefined) return boundA === boundB;
      if (boundA === undefined && boundB === undefined) return p === pb[i];
      return false;
    });
  }

  // Cuantificadores: extender el ambiente
  if ((a.kind === 'forall' || a.kind === 'exists') && a.kind === b.kind) {
    const varA = a.variable || '_';
    const varB = b.variable || '_';
    const newEnvA = new Map(envA);
    const newEnvB = new Map(envB);
    newEnvA.set(varA, depth);
    newEnvB.set(varB, depth);
    const aa = a.args || [];
    const bb = b.args || [];
    if (aa.length !== bb.length) return false;
    return aa.every((ai, i) => alphaEqual(ai, bb[i], newEnvA, newEnvB, depth + 1));
  }

  // Resto: comparar sub-fórmulas recursivamente
  const aa = a.args || [];
  const bb = b.args || [];
  if (aa.length !== bb.length) return false;
  return aa.every((ai, i) => alphaEqual(ai, bb[i], envA, envB, depth));
}

import { memoizeHash } from '../../../utils/memo';

export function formulaHash(f: Formula): string {
  return memoizeHash(f, computeFormulaHash);
}

function computeFormulaHash(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return f.name || '?';
    case 'not':
      return `!${formulaHash((f.args || [])[0])}`;
    case 'and':
      return `(${formulaHash((f.args || [])[0])} & ${formulaHash((f.args || [])[1])})`;
    case 'or':
      return `(${formulaHash((f.args || [])[0])} | ${formulaHash((f.args || [])[1])})`;
    case 'implies':
      return `(${formulaHash((f.args || [])[0])} -> ${formulaHash((f.args || [])[1])})`;
    case 'biconditional':
      return `(${formulaHash((f.args || [])[0])} <-> ${formulaHash((f.args || [])[1])})`;
    case 'modal_necessity':
      return `[](${formulaHash((f.args || [])[0])})`;
    case 'modal_possibility':
      return `<>(${formulaHash((f.args || [])[0])})`;
    case 'forall':
      return `A${f.variable}(${formulaHash((f.args || [])[0])})`;
    case 'exists':
      return `E${f.variable}(${formulaHash((f.args || [])[0])})`;
    case 'predicate':
      return `${f.name}(${(f.args || []).map(formulaHash).join(',')})`;
    case 'equals':
      return `(${formulaHash((f.args || [])[0])} = ${formulaHash((f.args || [])[1])})`;
    case 'temporal_next':
      return `X(${formulaHash((f.args || [])[0])})`;
    case 'temporal_until':
      return `(${formulaHash((f.args || [])[0])} U ${formulaHash((f.args || [])[1])})`;
    default:
      return f.kind;
  }
}

export function eliminateConnectives(f: Formula): Formula {
  const args = (f.args || []).map(eliminateConnectives);
  switch (f.kind) {
    case 'implies':
      return { kind: 'or', args: [{ kind: 'not', args: [args[0]] }, args[1]] };
    case 'biconditional':
      return {
        kind: 'or',
        args: [
          { kind: 'and', args: [args[0], args[1]] },
          {
            kind: 'and',
            args: [
              { kind: 'not', args: [args[0]] },
              { kind: 'not', args: [args[1]] },
            ],
          },
        ],
      };
    default:
      return { ...f, args: args.length ? args : f.args };
  }
}

export function fullNNF(f: Formula): Formula {
  return toNNF(eliminateConnectives(f));
}

// ── Clasificación ───────────────────────────────────────────

function isLiteral(f: Formula): boolean {
  return f.kind === 'atom' || (f.kind === 'not' && (f.args || [])[0]?.kind === 'atom');
}

type FormulaClass = 'literal' | 'alpha' | 'beta' | 'gamma' | 'delta';

function classify(f: Formula): FormulaClass {
  if (isLiteral(f)) return 'literal';
  switch (f.kind) {
    case 'and':
      return 'alpha';
    case 'or':
    case 'implies':
      return 'beta';
    case 'biconditional':
      return 'beta';
    case 'not': {
      const inner = (f.args || [])[0];
      if (!inner) return 'literal';
      if (inner.kind === 'and') return 'beta';
      if (inner.kind === 'or') return 'alpha';
      if (inner.kind === 'implies') return 'alpha';
      if (inner.kind === 'modal_necessity') return 'delta';
      if (inner.kind === 'modal_possibility') return 'gamma';
      if (inner.kind === 'temporal_until') return 'alpha';
      return 'literal';
    }
    case 'modal_necessity':
      return 'gamma';
    case 'modal_possibility':
      return 'delta';
    case 'temporal_next':
      return 'delta';
    case 'temporal_until':
      return 'beta';
    default:
      return 'literal';
  }
}

// ── Contradicción ───────────────────────────────────────────

function closes(branch: Branch, node: LabeledNode): boolean {
  const f = node.formula;
  const w = node.world;
  // ⊥ alone closes the branch; ¬⊤ does too. (NNF turns ¬⊤ into ⊥, so the
  // second case is a safety net if non-NNF formulas reach here.)
  if (f.kind === 'false') return true;
  if (f.kind === 'not' && f.args?.[0]?.kind === 'true') return true;
  if (f.kind === 'not' && f.args?.[0]) {
    return branch.literals.some(
      (l) => l.world === w && formulaEqual(l.formula, (f.args as Formula[])[0]),
    );
  }
  return branch.literals.some(
    (l) =>
      l.world === w &&
      l.formula.kind === 'not' &&
      l.formula.args?.[0] &&
      formulaEqual(l.formula.args[0], f),
  );
}

// ── Pool de Ramas (Object Pooling) ──────────────────────────

const branchPool: Branch[] = [];
let nextBranchId = 1;
let nextTraceNodeId = 1;

function pushTrace(
  branch: Branch,
  message: string,
  options?: {
    depth?: number;
    rule?: TableauTraceEntry['rule'];
    status?: TableauTraceEntry['status'];
    world?: string;
    formula?: Formula;
  },
): void {
  branch.trace.push({
    message,
    branchId: branch.branchId,
    depth: options?.depth,
    rule: options?.rule ?? 'info',
    status: options?.status,
    world: options?.world,
    formula: options?.formula ? formulaHash(options.formula) : undefined,
    nodeId: `tt-${nextTraceNodeId++}`,
  });
}

function acquireBranch(): Branch {
  if (branchPool.length > 0) {
    const branch = branchPool.pop();
    if (branch) return branch;
  }
  return {
    literals: [],
    pending: [],
    accessibility: new Map(),
    nextWorlds: new Map(),
    worlds: new Set(),
    gammaWatchers: [],
    processed: new Set(),
    worldCounter: 0,
    branchId: `b${nextBranchId++}`,
    trace: [],
  };
}

// ── Clonación ───────────────────────────────────────────────

function cloneBranch(b: Branch): Branch {
  const clone = acquireBranch();
  clone.literals.push(...b.literals);
  clone.pending.push(...b.pending);
  for (const [k, v] of b.accessibility) clone.accessibility.set(k, new Set(v));
  for (const [k, v] of b.nextWorlds) clone.nextWorlds.set(k, v);
  for (const w of b.worlds) clone.worlds.add(w);
  clone.gammaWatchers.push(...b.gammaWatchers);
  for (const p of b.processed) clone.processed.add(p);
  clone.worldCounter = b.worldCounter;
  clone.branchId = `b${nextBranchId++}`;
  clone.trace.push(...b.trace);
  return clone;
}

// ── Constantes ──────────────────────────────────────────────

const MAX_DEPTH = 200;

function ensureTemporalNextWorld(
  branch: Branch,
  sourceWorld: string,
): { world: string; created: boolean } {
  const existing = branch.nextWorlds.get(sourceWorld);
  if (existing) {
    return { world: existing, created: false };
  }

  const world = `w${branch.worldCounter++}`;
  branch.nextWorlds.set(sourceWorld, world);
  if (!branch.accessibility.has(sourceWorld)) {
    branch.accessibility.set(sourceWorld, new Set());
  }
  (branch.accessibility.get(sourceWorld) as Set<string>).add(world);
  branch.worlds.add(world);
  return { world, created: true };
}

// ── Expansión principal (parametrizada) ─────────────────────

export interface ExpandResult {
  closed: boolean;
  openBranch?: Branch;
  trace: TableauTraceEntry[];
}

function expand(branch: Branch, depth: number, rules: FrameRules): ExpandResult {
  if (depth > MAX_DEPTH) {
    pushTrace(branch, `[${depth}] ⚠ MAX_DEPTH reached. Aborting.`, {
      depth,
      rule: 'limit',
      status: 'limit',
    });
    return { closed: false, openBranch: branch, trace: branch.trace };
  }

  // 1. Procesar literales del pending
  while (branch.pending.length > 0) {
    const next = branch.pending[branch.pending.length - 1];
    if (classify(next.formula) !== 'literal') break;
    branch.pending.pop();
    const key = `${next.world}:${formulaHash(next.formula)}`;
    if (branch.processed.has(key)) continue;
    branch.processed.add(key);
    pushTrace(
      branch,
      `[${depth}] Analizando literal: ${formulaHash(next.formula)} en ${next.world}`,
      {
        depth,
        rule: 'literal',
        status: 'expanded',
        world: next.world,
        formula: next.formula,
      },
    );
    if (closes(branch, next)) {
      pushTrace(
        branch,
        `[${depth}] ✕ Rama cerrada por contradicción con ${formulaHash(next.formula)} en ${next.world}`,
        {
          depth,
          rule: 'close',
          status: 'closed',
          world: next.world,
          formula: next.formula,
        },
      );
      return { closed: true, trace: branch.trace };
    }
    branch.literals.push(next);
  }

  if (branch.pending.length === 0) {
    // Hook: enforceFrameConditions
    if (rules.enforceFrameConditions?.(branch)) {
      pushTrace(branch, `[${depth}] Aplicando enforceFrameConditions (serialidad/etc)`, {
        depth,
        rule: 'frame',
        status: 'expanded',
      });
      return expand(branch, depth + 1, rules);
    }
    pushTrace(branch, `[${depth}] ✓ Rama saturada y ABIERTA.`, {
      depth,
      rule: 'open',
      status: 'open',
    });
    return { closed: false, openBranch: branch, trace: branch.trace };
  }

  // 2. Prioridad: alpha > delta > gamma > beta
  const priorities: FormulaClass[] = ['alpha', 'delta', 'gamma', 'beta'];

  for (const pri of priorities) {
    const idx = branch.pending.findIndex((n) => classify(n.formula) === pri);
    if (idx < 0) continue;

    const node = branch.pending.splice(idx, 1)[0];
    const key = `${node.world}:${formulaHash(node.formula)}`;

    switch (pri) {
      case 'alpha': {
        if (branch.processed.has(key)) return expand(branch, depth + 1, rules);
        branch.processed.add(key);
        pushTrace(
          branch,
          `[${depth}] Regla Alpha (Conjunción) en ${node.world}: ${formulaHash(node.formula)}`,
          {
            depth,
            rule: 'alpha',
            status: 'expanded',
            world: node.world,
            formula: node.formula,
          },
        );
        const f = node.formula;
        let children: Formula[];
        if (f.kind === 'and') children = f.args || [];
        else if (f.kind === 'not' && f.args?.[0]?.kind === 'or')
          children = (f.args[0].args || []).map((a) => fullNNF({ kind: 'not', args: [a] }));
        else if (f.kind === 'not' && f.args?.[0]?.kind === 'implies')
          children = [
            (f.args[0].args || [])[0],
            fullNNF({ kind: 'not', args: [(f.args[0].args || [])[1]] }),
          ];
        else if (f.kind === 'not' && f.args?.[0]?.kind === 'temporal_until')
          children = [
            fullNNF({ kind: 'not', args: [(f.args[0].args || [])[1]] }),
            fullNNF({
              kind: 'or',
              args: [
                { kind: 'not', args: [(f.args[0].args || [])[0]] },
                { kind: 'not', args: [{ kind: 'temporal_next', args: [f.args[0]] }] },
              ],
            }),
          ];
        else return expand(branch, depth + 1, rules);
        for (const c of children) branch.pending.push({ formula: c, world: node.world });
        return expand(branch, depth + 1, rules);
      }

      case 'delta': {
        if (branch.processed.has(key)) return expand(branch, depth + 1, rules);
        branch.processed.add(key);
        const rawDeltaInner = (node.formula.args || [])[0];
        if (!rawDeltaInner) return expand(branch, depth + 1, rules);
        const inner = fullNNF(rawDeltaInner);
        let newWorld: string;
        let created = true;
        if (node.formula.kind === 'temporal_next' && rules.deterministicNext) {
          const nextWorld = ensureTemporalNextWorld(branch, node.world);
          newWorld = nextWorld.world;
          created = nextWorld.created;
        } else {
          newWorld = `w${branch.worldCounter++}`;
          if (!branch.accessibility.has(node.world))
            branch.accessibility.set(node.world, new Set());
          (branch.accessibility.get(node.world) as Set<string>).add(newWorld);
          branch.worlds.add(newWorld);
        }
        pushTrace(
          branch,
          `[${depth}] Regla Delta (Posibilidad/Existe) en ${node.world}: ${formulaHash(node.formula)} ─> ${created ? 'nuevo mundo' : 'reusa mundo'} ${newWorld}`,
          {
            depth,
            rule: 'delta',
            status: 'expanded',
            world: node.world,
            formula: node.formula,
          },
        );

        branch.pending.push({ formula: inner, world: newWorld });

        const watchers = rules.deltaGammaWatchers(node.world, newWorld, branch);
        for (const gw of watchers) {
          const instKey = `${newWorld}:${formulaHash(gw.innerFormula)}`;
          if (!branch.processed.has(instKey))
            branch.pending.push({ formula: gw.innerFormula, world: newWorld });
        }
        return expand(branch, depth + 1, rules);
      }

      case 'gamma': {
        if (branch.processed.has(key)) return expand(branch, depth + 1, rules);
        branch.processed.add(key);
        const rawInner = (node.formula.args || [])[0];
        if (!rawInner) return expand(branch, depth + 1, rules);
        const inner = fullNNF(rawInner);

        pushTrace(
          branch,
          `[${depth}] Regla Gamma (Necesidad/ParaTodo) en ${node.world}: ${formulaHash(node.formula)}`,
          {
            depth,
            rule: 'gamma',
            status: 'expanded',
            world: node.world,
            formula: node.formula,
          },
        );
        const exists = branch.gammaWatchers.some(
          (gw) => gw.sourceWorld === node.world && formulaEqual(gw.innerFormula, inner),
        );
        if (!exists) branch.gammaWatchers.push({ innerFormula: inner, sourceWorld: node.world });

        const targets = rules.gammaTargets(node.world, branch);
        for (const target of targets) {
          const instKey = `${target}:${formulaHash(inner)}`;
          if (!branch.processed.has(instKey))
            branch.pending.push({ formula: inner, world: target });
        }
        return expand(branch, depth + 1, rules);
      }

      case 'beta': {
        if (branch.processed.has(key)) return expand(branch, depth + 1, rules);
        branch.processed.add(key);
        pushTrace(
          branch,
          `[${depth}] Regla Beta (Disyunción/Impl) en ${node.world}: ${formulaHash(node.formula)}. Bifurcando...`,
          {
            depth,
            rule: 'beta',
            status: 'expanded',
            world: node.world,
            formula: node.formula,
          },
        );
        const f = node.formula;
        let disjuncts: Formula[];
        if (f.kind === 'or') disjuncts = f.args || [];
        else if (f.kind === 'implies')
          disjuncts = [fullNNF({ kind: 'not', args: [(f.args || [])[0]] }), (f.args || [])[1]];
        else if (f.kind === 'biconditional')
          disjuncts = [
            { kind: 'and', args: [(f.args || [])[0], (f.args || [])[1]] },
            {
              kind: 'and',
              args: [
                fullNNF({ kind: 'not', args: [(f.args || [])[0]] }),
                fullNNF({ kind: 'not', args: [(f.args || [])[1]] }),
              ],
            },
          ];
        else if (f.kind === 'temporal_until')
          disjuncts = [
            (f.args || [])[1],
            fullNNF({
              kind: 'and',
              args: [(f.args || [])[0], { kind: 'temporal_next', args: [f] }],
            }),
          ];
        else if (f.kind === 'not' && f.args?.[0]?.kind === 'and')
          disjuncts = (f.args[0].args || []).map((a) => fullNNF({ kind: 'not', args: [a] }));
        else if (f.kind === 'not' && f.args?.[0]?.kind === 'implies') {
          disjuncts = [
            (f.args[0].args || [])[0],
            fullNNF({ kind: 'not', args: [(f.args[0].args || [])[1]] }),
          ];
          for (const d of disjuncts) branch.pending.push({ formula: d, world: node.world });
          return expand(branch, depth + 1, rules);
        } else return expand(branch, depth + 1, rules);

        let mergedTrace = [...branch.trace];
        for (let i = 0; i < disjuncts.length; i++) {
          const d = disjuncts[i];
          const child = cloneBranch(branch);
          pushTrace(child, `[${depth}]   -> Rama Beta ${i + 1}: ${formulaHash(d)}`, {
            depth,
            rule: 'beta',
            status: 'expanded',
            world: node.world,
            formula: d,
          });
          child.pending.push({ formula: d, world: node.world });
          const res = expand(child, depth + 1, rules);
          if (!res.closed) {
            return res; // Open branch found!
          }
          mergedTrace = res.trace; // Keep the trace of the closed branch
        }
        return { closed: true, trace: mergedTrace };
      }
    }
  }
  return { closed: false, openBranch: branch, trace: branch.trace };
}

// ── API pública ─────────────────────────────────────────────

export function makeBranch(nodes: LabeledNode[]): Branch {
  const branch = acquireBranch();
  branch.pending.push(...nodes);
  branch.worlds.add('w0');
  branch.worldCounter = 1;
  return branch;
}

export function checkTableau(
  formula: Formula,
  rules: FrameRules,
  isValidityCheck: boolean,
): ExpandResult {
  if (isValidityCheck) {
    const negated = fullNNF({ kind: 'not', args: [formula] });
    const branch = makeBranch([{ formula: negated, world: 'w0' }]);
    pushTrace(branch, `Iniciando prueba de validez por refutación para: ${formulaHash(formula)}`, {
      rule: 'start',
      status: 'expanded',
      world: 'w0',
      formula,
    });
    return expand(branch, 0, rules);
  } else {
    const nnf = fullNNF(formula);
    const branch = makeBranch([{ formula: nnf, world: 'w0' }]);
    pushTrace(branch, `Iniciando prueba de satisfacibilidad para: ${formulaHash(formula)}`, {
      rule: 'start',
      status: 'expanded',
      world: 'w0',
      formula,
    });
    return expand(branch, 0, rules);
  }
}

// Retro-compatibilidad opcional (aunque se cambiará en base-profile)
export function isValid(formula: Formula, rules: FrameRules): boolean {
  return checkTableau(formula, rules, true).closed;
}

export function isSatisfiable(formula: Formula, rules: FrameRules): boolean {
  return !checkTableau(formula, rules, false).closed;
}
