// ============================================================
// ST Modal K — Labeled Tableau v3 (Gamma-Watchers)
// ============================================================
// Motor completo de tableau etiquetado para lógica modal K.
// Resuelve el problema del Axioma K mediante el patrón
// Gamma-Watcher: las reglas gamma se registran como observadores
// permanentes que se re-instancian cuando Delta crea mundos nuevos.
// ============================================================

import { Formula, RunResult, Theory, LogicProfile, Diagnostic } from '../../types';
import { formulaToString, toNNF } from '../classical/propositional';

// ── Tipos internos ──────────────────────────────────────────

interface LabeledNode {
  readonly formula: Formula;
  readonly world: string;
}

interface GammaWatcher {
  readonly innerFormula: Formula; // La subfórmula dentro de []
  readonly sourceWorld: string;   // Mundo donde vive la regla gamma
}

interface Branch {
  literals: LabeledNode[];
  pending: LabeledNode[];
  accessibility: Map<string, Set<string>>; // mundo → mundos accesibles
  gammaWatchers: GammaWatcher[];
  processed: Set<string>;
  worldCounter: number;
}

const MAX_DEPTH = 200;

// ── Eliminación de implies/biconditional ────────────────────
// toNNF conserva implies/biconditional en caso no-negado.
// El tableau necesita que todo sea and/or/not/atom/modal.

function eliminateConnectives(f: Formula): Formula {
  const args = (f.args || []).map(eliminateConnectives);
  switch (f.kind) {
    case 'implies':
      // A -> B  ≡  ¬A ∨ B
      return { kind: 'or', args: [{ kind: 'not', args: [args[0]] }, args[1]] };
    case 'biconditional':
      // A <-> B  ≡  (A ∧ B) ∨ (¬A ∧ ¬B)
      return {
        kind: 'or',
        args: [
          { kind: 'and', args: [args[0], args[1]] },
          { kind: 'and', args: [{ kind: 'not', args: [args[0]] }, { kind: 'not', args: [args[1]] }] },
        ],
      };
    case 'modal_necessity':
    case 'modal_possibility':
      return { ...f, args };
    case 'not':
      return { ...f, args };
    case 'and':
    case 'or':
      return { ...f, args };
    default:
      return f;
  }
}

/** NNF completo: primero elimina implies/biconditional, luego aplica toNNF */
function fullNNF(f: Formula): Formula {
  return toNNF(eliminateConnectives(f));
}

// ── Utilidades ──────────────────────────────────────────────

function formulaEqual(a: Formula, b: Formula): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'atom' && b.kind === 'atom') return a.name === b.name;
  const aa = a.args || [];
  const bb = b.args || [];
  if (aa.length !== bb.length) return false;
  return aa.every((ai, i) => formulaEqual(ai, bb[i]));
}

function formulaHash(f: Formula): string {
  // Hash propio que SÍ maneja operadores modales (formulaToString no lo hace)
  switch (f.kind) {
    case 'atom': return f.name || '?';
    case 'not': return `!${formulaHash((f.args || [])[0])}`;
    case 'and': return `(${formulaHash((f.args || [])[0])} & ${formulaHash((f.args || [])[1])})`;
    case 'or': return `(${formulaHash((f.args || [])[0])} | ${formulaHash((f.args || [])[1])})`;
    case 'implies': return `(${formulaHash((f.args || [])[0])} -> ${formulaHash((f.args || [])[1])})`;
    case 'biconditional': return `(${formulaHash((f.args || [])[0])} <-> ${formulaHash((f.args || [])[1])})`;
    case 'modal_necessity': return `[](${formulaHash((f.args || [])[0])})`;
    case 'modal_possibility': return `<>(${formulaHash((f.args || [])[0])})`;
    case 'forall': return `A${f.variable}(${formulaHash((f.args || [])[0])})`;
    case 'exists': return `E${f.variable}(${formulaHash((f.args || [])[0])})`;
    case 'predicate': return `${f.name}(${(f.args || []).map(formulaHash).join(',')})`;
    default: return f.kind;
  }
}

function nodeKey(n: LabeledNode): string {
  return `${n.world}:${formulaHash(n.formula)}`;
}

function cloneBranch(b: Branch): Branch {
  return {
    literals: [...b.literals],
    pending: [...b.pending],
    accessibility: new Map(
      Array.from(b.accessibility.entries()).map(([k, v]) => [k, new Set(v)])
    ),
    gammaWatchers: [...b.gammaWatchers],
    processed: new Set(b.processed),
    worldCounter: b.worldCounter,
  };
}

// ── Clasificación de fórmulas ───────────────────────────────

type NodeType = 'alfa' | 'beta' | 'delta' | 'gamma' | 'literal';

function classify(f: Formula): NodeType {
  switch (f.kind) {
    case 'and': return 'alfa';
    case 'or': return 'beta';
    case 'implies': return 'beta'; // A->B = !A | B en NNF, pero si llega, tratar como beta
    case 'modal_possibility': return 'delta';
    case 'modal_necessity': return 'gamma';
    default: return 'literal';
  }
}

// ── Motor principal ─────────────────────────────────────────

export class ModalK implements LogicProfile {
  readonly name = 'modal.k';
  readonly description = 'Logica modal K — Labeled Tableau v3 (Gamma-Watchers)';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const walk = (f: Formula) => {
      if (f.kind === 'atom' && !f.name)
        diags.push({ severity: 'error', message: 'Atomo sin nombre' });
      f.args?.forEach(walk);
    };
    walk(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const negated = fullNNF({ kind: 'not', args: [formula] });
    const closed = this.tableau(negated);
    return {
      status: closed ? 'valid' : 'invalid',
      output: closed
        ? `${formulaToString(formula)} es VALIDA en K`
        : `${formulaToString(formula)} NO es valida en K`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const nnf = fullNNF(formula);
    const closed = this.tableau(nnf);
    return {
      status: !closed ? 'satisfiable' : 'unsatisfiable',
      output: !closed ? 'Satisfacible' : 'Insatisfacible',
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axiomNodes: LabeledNode[] = Array.from(theory.axioms.values())
      .map(a => ({ formula: fullNNF(a), world: 'w0' }));
    const negGoal: LabeledNode = { formula: fullNNF({ kind: 'not', args: [goal] }), world: 'w0' };
    const allNodes = [...axiomNodes, negGoal];
    const branch = this.makeBranch(allNodes);
    const closed = this.expand(branch, 0);
    return {
      status: closed ? 'provable' : 'refutable',
      output: closed ? 'Demostrado por tableau' : 'No demostrable',
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const formulas = premises
      .map(p => theory.axioms.get(p))
      .filter((f): f is Formula => !!f);
    const nodes: LabeledNode[] = [
      ...formulas.map(f => ({ formula: fullNNF(f), world: 'w0' })),
      { formula: fullNNF({ kind: 'not', args: [goal] }), world: 'w0' },
    ];
    const branch = this.makeBranch(nodes);
    const closed = this.expand(branch, 0);
    return {
      status: closed ? 'provable' : 'refutable',
      output: closed ? 'Derivacion valida' : 'Derivacion no valida',
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    return this.checkValid(formula);
  }

  explain(formula: Formula): RunResult {
    return {
      status: 'unknown',
      output: `Modal K — Labeled Tableau v3`,
      diagnostics: [],
      formula,
    };
  }

  // ── Punto de entrada del tableau ──────────────────────────

  private tableau(formula: Formula): boolean {
    const branch = this.makeBranch([{ formula, world: 'w0' }]);
    return this.expand(branch, 0);
  }

  private makeBranch(nodes: LabeledNode[]): Branch {
    return {
      literals: [],
      pending: [...nodes],
      accessibility: new Map([['w0', new Set<string>()]]),
      gammaWatchers: [],
      processed: new Set(),
      worldCounter: 1,
    };
  }

  // ── Expansión del tableau ─────────────────────────────────

  private expand(branch: Branch, depth: number): boolean {
    if (depth > MAX_DEPTH) return false;

    // 1. Procesar todos los literales primero
    while (true) {
      const litIdx = branch.pending.findIndex(n => classify(n.formula) === 'literal');
      if (litIdx === -1) break;

      const node = branch.pending.splice(litIdx, 1)[0];
      // Comprobar cierre
      if (this.closes(branch, node)) return true;
      branch.literals.push(node);
    }

    // 2. Buscar siguiente regla por prioridad: alfa → delta → gamma → beta
    const priorities: NodeType[] = ['alfa', 'delta', 'gamma', 'beta'];

    for (const priority of priorities) {
      const idx = branch.pending.findIndex(n => {
        const t = classify(n.formula);
        if (t !== priority) return false;
        if (priority === 'gamma') return true; // Gamma siempre se puede intentar
        const key = nodeKey(n);
        return !branch.processed.has(key);
      });

      if (idx === -1) continue;

      const node = branch.pending.splice(idx, 1)[0];
      const key = nodeKey(node);

      switch (priority) {
        case 'alfa':
          return this.applyAlfa(branch, node, key, depth);
        case 'delta':
          return this.applyDelta(branch, node, key, depth);
        case 'gamma':
          return this.applyGamma(branch, node, key, depth);
        case 'beta':
          return this.applyBeta(branch, node, key, depth);
      }
    }

    // Sin más reglas que aplicar: rama abierta
    return false;
  }

  // ── Regla Alfa (conjunción) ───────────────────────────────

  private applyAlfa(branch: Branch, node: LabeledNode, key: string, depth: number): boolean {
    branch.processed.add(key);
    const args = node.formula.args || [];
    if (args.length < 2) return this.expand(branch, depth + 1);

    branch.pending.push(
      { formula: args[0], world: node.world },
      { formula: args[1], world: node.world },
    );
    return this.expand(branch, depth + 1);
  }

  // ── Regla Delta (posibilidad: crea mundo nuevo) ───────────

  private applyDelta(branch: Branch, node: LabeledNode, key: string, depth: number): boolean {
    branch.processed.add(key);
    const inner = (node.formula.args || [])[0];
    if (!inner) return this.expand(branch, depth + 1);

    const newWorld = `w${branch.worldCounter++}`;

    // Establecer accesibilidad: sourceWorld → newWorld
    if (!branch.accessibility.has(node.world)) {
      branch.accessibility.set(node.world, new Set());
    }
    branch.accessibility.get(node.world)!.add(newWorld);
    branch.accessibility.set(newWorld, new Set());

    // Agregar la subfórmula en el mundo nuevo
    branch.pending.push({ formula: inner, world: newWorld });

    // ★ Clave: Re-instanciar TODOS los gamma-watchers del mundo fuente
    for (const watcher of branch.gammaWatchers) {
      if (watcher.sourceWorld === node.world) {
        const instKey = `gamma-inst:${newWorld}:${formulaHash(watcher.innerFormula)}`;
        if (!branch.processed.has(instKey)) {
          branch.processed.add(instKey);
          branch.pending.push({ formula: watcher.innerFormula, world: newWorld });
        }
      }
    }

    return this.expand(branch, depth + 1);
  }

  // ── Regla Gamma (necesidad: instanciar en mundos accesibles) ──

  private applyGamma(branch: Branch, node: LabeledNode, _key: string, depth: number): boolean {
    const inner = (node.formula.args || [])[0];
    if (!inner) return this.expand(branch, depth + 1);

    // Registrar como gamma-watcher permanente (si no existe ya)
    const watcherExists = branch.gammaWatchers.some(
      w => w.sourceWorld === node.world && formulaEqual(w.innerFormula, inner)
    );
    if (!watcherExists) {
      branch.gammaWatchers.push({ innerFormula: inner, sourceWorld: node.world });
    }

    // Instanciar en todos los mundos accesibles existentes
    const accessibleWorlds = branch.accessibility.get(node.world) || new Set();
    let addedAny = false;

    for (const targetWorld of accessibleWorlds) {
      const instKey = `gamma-inst:${targetWorld}:${formulaHash(inner)}`;
      if (!branch.processed.has(instKey)) {
        branch.processed.add(instKey);
        branch.pending.push({ formula: inner, world: targetWorld });
        addedAny = true;
      }
    }

    // Gamma se descarta del pending (ya registrada como watcher)
    // No se marca en processed como los demás, porque es re-usable
    if (addedAny) {
      return this.expand(branch, depth + 1);
    }

    // Si no se agregó nada, continuar con el siguiente pending
    return this.expand(branch, depth + 1);
  }

  // ── Regla Beta (disyunción: bifurca) ──────────────────────

  private applyBeta(branch: Branch, node: LabeledNode, key: string, depth: number): boolean {
    branch.processed.add(key);
    const args = node.formula.args || [];
    if (args.length < 2) return this.expand(branch, depth + 1);

    // Bifurcar: ambas ramas deben cerrarse para que el tableau cierre
    const branchLeft = cloneBranch(branch);
    branchLeft.pending.push({ formula: args[0], world: node.world });

    const branchRight = cloneBranch(branch);
    branchRight.pending.push({ formula: args[1], world: node.world });

    return this.expand(branchLeft, depth + 1) && this.expand(branchRight, depth + 1);
  }

  // ── Detección de cierre (contradicción) ───────────────────

  private closes(branch: Branch, node: LabeledNode): boolean {
    const f = node.formula;
    const w = node.world;

    // Caso 1: node = !A, buscar A en literals
    if (f.kind === 'not' && f.args?.[0]) {
      const target = f.args[0];
      return branch.literals.some(
        lit => lit.world === w && formulaEqual(lit.formula, target)
      );
    }

    // Caso 2: node = A, buscar !A en literals
    return branch.literals.some(
      lit => lit.world === w
        && lit.formula.kind === 'not'
        && lit.formula.args?.[0] !== undefined
        && formulaEqual(lit.formula.args[0], f)
    );
  }
}
