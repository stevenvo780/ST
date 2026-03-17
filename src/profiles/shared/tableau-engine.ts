// ============================================================
// ST Tableau Engine — Motor genérico de Labeled Tableau
// ============================================================
// Parametrizable con FrameRules para soportar distintos
// sistemas modales (K, KD, S4, S5, etc.) sin duplicar código.
// ============================================================

import { Formula } from '../../types';
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
  worlds: Set<string>;
  gammaWatchers: GammaWatcher[];
  processed: Set<string>;
  worldCounter: number;
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
    const worldsWithGamma = new Set<string>();
    for (const gw of branch.gammaWatchers) worldsWithGamma.add(gw.sourceWorld);
    let applied = false;
    for (const w of worldsWithGamma) {
      const successors = branch.accessibility.get(w);
      if (!successors || successors.size === 0) {
        const newWorld = `w${branch.worldCounter++}`;
        if (!branch.accessibility.has(w)) branch.accessibility.set(w, new Set());
        branch.accessibility.get(w)!.add(newWorld);
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
      const w = queue.shift()!;
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
        const w = queue.shift()!;
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

export function formulaHash(f: Formula): string {
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
      return 'literal';
    }
    case 'modal_necessity':
      return 'gamma';
    case 'modal_possibility':
      return 'delta';
    default:
      return 'literal';
  }
}

// ── Contradicción ───────────────────────────────────────────

function closes(branch: Branch, node: LabeledNode): boolean {
  const f = node.formula;
  const w = node.world;
  if (f.kind === 'not' && f.args?.[0]) {
    return branch.literals.some((l) => l.world === w && formulaEqual(l.formula, f.args![0]));
  }
  return branch.literals.some(
    (l) =>
      l.world === w &&
      l.formula.kind === 'not' &&
      l.formula.args?.[0] &&
      formulaEqual(l.formula.args[0], f),
  );
}

// ── Clonación ───────────────────────────────────────────────

function cloneBranch(b: Branch): Branch {
  const newAcc = new Map<string, Set<string>>();
  for (const [k, v] of b.accessibility) newAcc.set(k, new Set(v));
  return {
    literals: [...b.literals],
    pending: [...b.pending],
    accessibility: newAcc,
    worlds: new Set(b.worlds),
    gammaWatchers: [...b.gammaWatchers],
    processed: new Set(b.processed),
    worldCounter: b.worldCounter,
  };
}

// ── Constantes ──────────────────────────────────────────────

const MAX_DEPTH = 200;

// ── Expansión principal (parametrizada) ─────────────────────

function expand(branch: Branch, depth: number, rules: FrameRules): boolean {
  if (depth > MAX_DEPTH) return false;

  // 1. Procesar literales del pending
  while (branch.pending.length > 0) {
    const next = branch.pending[branch.pending.length - 1];
    if (classify(next.formula) !== 'literal') break;
    branch.pending.pop();
    const key = `${next.world}:${formulaHash(next.formula)}`;
    if (branch.processed.has(key)) continue;
    branch.processed.add(key);
    if (closes(branch, next)) return true;
    branch.literals.push(next);
  }

  if (branch.pending.length === 0) {
    // Hook: enforceFrameConditions (serialidad, reflexividad, etc.)
    if (rules.enforceFrameConditions?.(branch)) {
      return expand(branch, depth + 1, rules);
    }
    return false; // Rama abierta
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
        const f = node.formula;
        let children: Formula[];
        if (f.kind === 'and') {
          children = f.args || [];
        } else if (f.kind === 'not' && f.args?.[0]?.kind === 'or') {
          children = (f.args[0].args || []).map((a) => fullNNF({ kind: 'not', args: [a] }));
        } else if (f.kind === 'not' && f.args?.[0]?.kind === 'implies') {
          // ¬(A→B) ≡ A ∧ ¬B
          const inner = f.args[0];
          const args = inner.args || [];
          children = [args[0], fullNNF({ kind: 'not', args: [args[1]] })];
        } else {
          return expand(branch, depth + 1, rules);
        }
        for (const c of children) branch.pending.push({ formula: c, world: node.world });
        return expand(branch, depth + 1, rules);
      }

      case 'delta': {
        if (branch.processed.has(key)) return expand(branch, depth + 1, rules);
        branch.processed.add(key);
        const rawDeltaInner = (node.formula.args || [])[0];
        if (!rawDeltaInner) return expand(branch, depth + 1, rules);
        const inner = fullNNF(rawDeltaInner);

        const newWorld = `w${branch.worldCounter++}`;
        if (!branch.accessibility.has(node.world)) branch.accessibility.set(node.world, new Set());
        const acc = branch.accessibility.get(node.world);
        if (acc) acc.add(newWorld);
        branch.worlds.add(newWorld);

        branch.pending.push({ formula: inner, world: newWorld });

        // ★ Instanciar gamma-watchers según frame rules
        const watchers = rules.deltaGammaWatchers(node.world, newWorld, branch);
        for (const gw of watchers) {
          const instKey = `${newWorld}:${formulaHash(gw.innerFormula)}`;
          if (!branch.processed.has(instKey)) {
            branch.pending.push({ formula: gw.innerFormula, world: newWorld });
          }
        }
        return expand(branch, depth + 1, rules);
      }

      case 'gamma': {
        if (branch.processed.has(key)) return expand(branch, depth + 1, rules);
        branch.processed.add(key);
        const rawInner = (node.formula.args || [])[0];
        if (!rawInner) return expand(branch, depth + 1, rules);
        const inner = fullNNF(rawInner);

        // Registrar gamma-watcher permanente
        const exists = branch.gammaWatchers.some(
          (gw) => gw.sourceWorld === node.world && formulaEqual(gw.innerFormula, inner),
        );
        if (!exists) {
          branch.gammaWatchers.push({ innerFormula: inner, sourceWorld: node.world });
        }

        // ★ Instanciar según frame rules
        const targets = rules.gammaTargets(node.world, branch);
        for (const target of targets) {
          const instKey = `${target}:${formulaHash(inner)}`;
          if (!branch.processed.has(instKey)) {
            branch.pending.push({ formula: inner, world: target });
          }
        }
        return expand(branch, depth + 1, rules);
      }

      case 'beta': {
        if (branch.processed.has(key)) return expand(branch, depth + 1, rules);
        branch.processed.add(key);
        const f = node.formula;
        let disjuncts: Formula[];
        if (f.kind === 'or') {
          disjuncts = f.args || [];
        } else if (f.kind === 'implies') {
          // A → B ≡ ¬A ∨ B
          const args = f.args || [];
          disjuncts = [fullNNF({ kind: 'not', args: [args[0]] }), args[1]];
        } else if (f.kind === 'biconditional') {
          // A ↔ B ≡ (A∧B) ∨ (¬A∧¬B)
          const args = f.args || [];
          disjuncts = [
            { kind: 'and', args: [args[0], args[1]] },
            {
              kind: 'and',
              args: [
                fullNNF({ kind: 'not', args: [args[0]] }),
                fullNNF({ kind: 'not', args: [args[1]] }),
              ],
            },
          ];
        } else if (f.kind === 'not' && f.args?.[0]?.kind === 'and') {
          disjuncts = (f.args[0].args || []).map((a) => fullNNF({ kind: 'not', args: [a] }));
        } else if (f.kind === 'not' && f.args?.[0]?.kind === 'implies') {
          // ¬(A→B) ≡ A ∧ ¬B — alpha, pero handle it
          const args = f.args[0].args || [];
          disjuncts = [args[0], fullNNF({ kind: 'not', args: [args[1]] })];
          // This is actually alpha, add all to same branch
          for (const d of disjuncts) branch.pending.push({ formula: d, world: node.world });
          return expand(branch, depth + 1, rules);
        } else {
          return expand(branch, depth + 1, rules);
        }
        return disjuncts.every((d) => {
          const child = cloneBranch(branch);
          child.pending.push({ formula: d, world: node.world });
          return expand(child, depth + 1, rules);
        });
      }
    }
  }
  return false;
}

// ── API pública ─────────────────────────────────────────────

export function makeBranch(nodes: LabeledNode[]): Branch {
  return {
    literals: [],
    pending: [...nodes],
    accessibility: new Map(),
    worlds: new Set(['w0']),
    gammaWatchers: [],
    processed: new Set(),
    worldCounter: 1,
  };
}

/**
 * ¿Es `formula` válida bajo las frame rules dadas?
 * (Niega la fórmula y verifica si el tableau cierra)
 */
export function isValid(formula: Formula, rules: FrameRules): boolean {
  const negated = fullNNF({ kind: 'not', args: [formula] });
  const branch = makeBranch([{ formula: negated, world: 'w0' }]);
  return expand(branch, 0, rules);
}

/**
 * ¿Es `formula` satisfacible bajo las frame rules dadas?
 */
export function isSatisfiable(formula: Formula, rules: FrameRules): boolean {
  const nnf = fullNNF(formula);
  const branch = makeBranch([{ formula: nnf, world: 'w0' }]);
  return !expand(branch, 0, rules);
}
