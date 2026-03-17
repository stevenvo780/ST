// ============================================================
// ST Deontic Standard — Lógica Deóntica KD (Labeled Tableau)
// ============================================================
// Motor de tableau etiquetado para lógica deóntica estándar.
// Extiende Modal K con la restricción de serialidad (axioma D):
//   O(φ) → P(φ)  —  "lo obligatorio es permisible"
// Esto equivale al sistema modal KD.
//
// Operadores:
//   [] = O = Obligación ("es obligatorio que...")
//   <> = P = Permisión  ("está permitido que...")
//   Prohibición: []!φ  ("está prohibido que φ")
// ============================================================

import { Formula, RunResult, Theory, LogicProfile, Diagnostic } from '../../types';
import { formulaToString, toNNF } from '../classical/propositional';

// ── Tipos internos ──────────────────────────────────────────

interface LabeledNode {
  readonly formula: Formula;
  readonly world: string;
}

interface GammaWatcher {
  readonly innerFormula: Formula;
  readonly sourceWorld: string;
}

interface Branch {
  literals: LabeledNode[];
  pending: LabeledNode[];
  accessibility: Map<string, Set<string>>;
  gammaWatchers: GammaWatcher[];
  processed: Set<string>;
  worldCounter: number;
}

const MAX_DEPTH = 200;

// ── Eliminación de implies/biconditional ────────────────────

function eliminateConnectives(f: Formula): Formula {
  const args = (f.args || []).map(eliminateConnectives);
  switch (f.kind) {
    case 'implies':
      return { kind: 'or', args: [{ kind: 'not', args: [args[0]] }, args[1]] };
    case 'biconditional':
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
    case 'and':
    case 'or':
      return { ...f, args };
    default:
      return f;
  }
}

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
  switch (f.kind) {
    case 'atom': return f.name || '?';
    case 'not': return `!${formulaHash((f.args || [])[0])}`;
    case 'and': return `(${formulaHash((f.args || [])[0])} & ${formulaHash((f.args || [])[1])})`;
    case 'or': return `(${formulaHash((f.args || [])[0])} | ${formulaHash((f.args || [])[1])})`;
    case 'implies': return `(${formulaHash((f.args || [])[0])} -> ${formulaHash((f.args || [])[1])})`;
    case 'biconditional': return `(${formulaHash((f.args || [])[0])} <-> ${formulaHash((f.args || [])[1])})`;
    case 'modal_necessity': return `O(${formulaHash((f.args || [])[0])})`;
    case 'modal_possibility': return `P(${formulaHash((f.args || [])[0])})`;
    default: return f.kind;
  }
}

function isLiteral(f: Formula): boolean {
  return f.kind === 'atom' || (f.kind === 'not' && (f.args || [])[0]?.kind === 'atom');
}

function isContradiction(literals: LabeledNode[]): boolean {
  for (let i = 0; i < literals.length; i++) {
    for (let j = i + 1; j < literals.length; j++) {
      if (literals[i].world !== literals[j].world) continue;
      const a = literals[i].formula;
      const b = literals[j].formula;
      if (a.kind === 'atom' && b.kind === 'not' && formulaEqual(a, (b.args || [])[0])) return true;
      if (b.kind === 'atom' && a.kind === 'not' && formulaEqual(b, (a.args || [])[0])) return true;
    }
  }
  return false;
}

function nodeKey(node: LabeledNode): string {
  return `${node.world}:${formulaHash(node.formula)}`;
}

function cloneBranch(b: Branch): Branch {
  const newAcc = new Map<string, Set<string>>();
  for (const [k, v] of b.accessibility) newAcc.set(k, new Set(v));
  return {
    literals: [...b.literals],
    pending: [...b.pending],
    accessibility: newAcc,
    gammaWatchers: [...b.gammaWatchers],
    processed: new Set(b.processed),
    worldCounter: b.worldCounter,
  };
}

// ── Clasificación de fórmulas ───────────────────────────────

type FormulaClass = 'literal' | 'alpha' | 'beta' | 'gamma' | 'delta';

function classify(f: Formula): FormulaClass {
  if (isLiteral(f)) return 'literal';
  switch (f.kind) {
    case 'and': return 'alpha';
    case 'or': return 'beta';
    case 'not': {
      const inner = (f.args || [])[0];
      if (!inner) return 'literal';
      if (inner.kind === 'and') return 'beta';
      if (inner.kind === 'or') return 'alpha';
      return 'literal';
    }
    case 'modal_necessity': return 'gamma';
    case 'modal_possibility': return 'delta';
    default: return 'literal';
  }
}

// ── Expansión del Tableau con Serialidad (KD) ───────────────

function expand(branch: Branch, depth: number): boolean {
  if (depth > MAX_DEPTH) return false;

  // Procesar literales del pending
  while (branch.pending.length > 0) {
    const next = branch.pending[branch.pending.length - 1];
    const cls = classify(next.formula);

    if (cls !== 'literal') break;
    branch.pending.pop();
    const key = nodeKey(next);
    if (branch.processed.has(key)) continue;
    branch.processed.add(key);
    branch.literals.push(next);
    if (isContradiction(branch.literals)) return true;
  }

  if (branch.pending.length === 0) {
    // ── KD Serialidad: antes de declarar "abierto", asegurar
    // que todo mundo con gamma-watchers tiene al menos un sucesor.
    // Si no, crear uno y continuar expansión.
    const serialityApplied = enforceSerialitiy(branch);
    if (serialityApplied) {
      return expand(branch, depth + 1);
    }
    return false; // Rama abierta, no hay contradicción
  }

  // Prioridad: alpha > delta > gamma > beta
  const alphaIdx = branch.pending.findIndex(n => classify(n.formula) === 'alpha');
  if (alphaIdx >= 0) return applyAlpha(branch, alphaIdx, depth);

  const deltaIdx = branch.pending.findIndex(n => classify(n.formula) === 'delta');
  if (deltaIdx >= 0) return applyDelta(branch, deltaIdx, depth);

  const gammaIdx = branch.pending.findIndex(n => classify(n.formula) === 'gamma');
  if (gammaIdx >= 0) return applyGamma(branch, gammaIdx, depth);

  const betaIdx = branch.pending.findIndex(n => classify(n.formula) === 'beta');
  if (betaIdx >= 0) return applyBeta(branch, betaIdx, depth);

  return false;
}

// ── KD Serialidad ───────────────────────────────────────────
// En KD, todo mundo debe tener al menos un mundo accesible.
// Si un mundo tiene gamma-watchers pero no tiene sucesores,
// creamos un sucesor (mundo vacío) para satisfacer serialidad.

function enforceSerialitiy(branch: Branch): boolean {
  const worldsWithGamma = new Set<string>();
  for (const gw of branch.gammaWatchers) {
    worldsWithGamma.add(gw.sourceWorld);
  }

  let applied = false;
  for (const w of worldsWithGamma) {
    const successors = branch.accessibility.get(w);
    if (!successors || successors.size === 0) {
      // Crear un sucesor para satisfacer serialidad
      const newWorld = `w${branch.worldCounter++}`;
      if (!branch.accessibility.has(w)) branch.accessibility.set(w, new Set());
      branch.accessibility.get(w)!.add(newWorld);

      // Instanciar todos los gamma-watchers en el nuevo mundo
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
}

// ── Reglas de expansión ─────────────────────────────────────

function applyAlpha(branch: Branch, idx: number, depth: number): boolean {
  const node = branch.pending.splice(idx, 1)[0];
  const key = nodeKey(node);
  if (branch.processed.has(key)) return expand(branch, depth + 1);
  branch.processed.add(key);

  const f = node.formula;
  let children: Formula[];

  if (f.kind === 'and') {
    children = f.args || [];
  } else if (f.kind === 'not') {
    const inner = (f.args || [])[0];
    if (inner?.kind === 'or') {
      children = (inner.args || []).map(a => ({ kind: 'not' as const, args: [a] }));
      children = children.map(fullNNF);
    } else {
      return expand(branch, depth + 1);
    }
  } else {
    return expand(branch, depth + 1);
  }

  for (const c of children) {
    branch.pending.push({ formula: c, world: node.world });
  }
  return expand(branch, depth + 1);
}

function applyDelta(branch: Branch, idx: number, depth: number): boolean {
  const node = branch.pending.splice(idx, 1)[0];
  const key = nodeKey(node);
  if (branch.processed.has(key)) return expand(branch, depth + 1);
  branch.processed.add(key);

  const f = node.formula;
  if (f.kind !== 'modal_possibility') return expand(branch, depth + 1);
  const inner = (f.args || [])[0];
  if (!inner) return expand(branch, depth + 1);

  const newWorld = `w${branch.worldCounter++}`;
  if (!branch.accessibility.has(node.world)) branch.accessibility.set(node.world, new Set());
  branch.accessibility.get(node.world)!.add(newWorld);

  branch.pending.push({ formula: inner, world: newWorld });

  // Re-instanciar TODOS los gamma-watchers del mundo source en el nuevo mundo
  for (const gw of branch.gammaWatchers) {
    if (gw.sourceWorld === node.world) {
      const gwKey = `${newWorld}:${formulaHash(gw.innerFormula)}`;
      if (!branch.processed.has(gwKey)) {
        branch.pending.push({ formula: gw.innerFormula, world: newWorld });
      }
    }
  }

  return expand(branch, depth + 1);
}

function applyGamma(branch: Branch, idx: number, depth: number): boolean {
  const node = branch.pending.splice(idx, 1)[0];
  const key = nodeKey(node);
  if (branch.processed.has(key)) return expand(branch, depth + 1);
  branch.processed.add(key);

  const f = node.formula;
  if (f.kind !== 'modal_necessity') return expand(branch, depth + 1);
  const inner = (f.args || [])[0];
  if (!inner) return expand(branch, depth + 1);

  // Registrar gamma-watcher permanente
  branch.gammaWatchers.push({ innerFormula: inner, sourceWorld: node.world });

  // Instanciar en mundos accesibles existentes
  const accessible = branch.accessibility.get(node.world);
  if (accessible) {
    for (const target of accessible) {
      const instKey = `${target}:${formulaHash(inner)}`;
      if (!branch.processed.has(instKey)) {
        branch.pending.push({ formula: inner, world: target });
      }
    }
  }

  return expand(branch, depth + 1);
}

function applyBeta(branch: Branch, idx: number, depth: number): boolean {
  const node = branch.pending.splice(idx, 1)[0];
  const key = nodeKey(node);
  if (branch.processed.has(key)) return expand(branch, depth + 1);
  branch.processed.add(key);

  const f = node.formula;
  let disjuncts: Formula[];

  if (f.kind === 'or') {
    disjuncts = f.args || [];
  } else if (f.kind === 'not') {
    const inner = (f.args || [])[0];
    if (inner?.kind === 'and') {
      disjuncts = (inner.args || []).map(a => ({ kind: 'not' as const, args: [a] }));
      disjuncts = disjuncts.map(fullNNF);
    } else {
      return expand(branch, depth + 1);
    }
  } else {
    return expand(branch, depth + 1);
  }

  // Ambas ramas deben cerrarse
  return disjuncts.every(d => {
    const child = cloneBranch(branch);
    child.pending.push({ formula: d, world: node.world });
    return expand(child, depth + 1);
  });
}

// ── Tableau principal ───────────────────────────────────────

function isValid(formula: Formula): boolean {
  const negated = fullNNF({ kind: 'not', args: [formula] });
  const branch: Branch = {
    literals: [],
    pending: [{ formula: negated, world: 'w0' }],
    accessibility: new Map(),
    gammaWatchers: [],
    processed: new Set(),
    worldCounter: 1,
  };
  return expand(branch, 0);
}

function isSatisfiable(formula: Formula): boolean {
  const nnf = fullNNF(formula);
  const branch: Branch = {
    literals: [],
    pending: [{ formula: nnf, world: 'w0' }],
    accessibility: new Map(),
    gammaWatchers: [],
    processed: new Set(),
    worldCounter: 1,
  };
  return !expand(branch, 0);
}

// ── Formateo deóntico ───────────────────────────────────────

function deonticToString(f: Formula): string {
  switch (f.kind) {
    case 'modal_necessity': {
      const inner = (f.args || [])[0];
      if (!inner) return 'O(?)';
      // O(!φ) = F(φ) — prohibición
      if (inner.kind === 'not' && inner.args?.[0]) {
        return `F(${deonticToString(inner.args[0])})`;
      }
      return `O(${deonticToString(inner)})`;
    }
    case 'modal_possibility': {
      const inner = (f.args || [])[0];
      return inner ? `P(${deonticToString(inner)})` : 'P(?)';
    }
    case 'atom': return f.name || '?';
    case 'not': {
      const inner = (f.args || [])[0];
      if (!inner) return '¬?';
      if (inner.kind === 'atom') return `¬${deonticToString(inner)}`;
      return `¬(${deonticToString(inner)})`;
    }
    case 'and': return `(${deonticToString((f.args || [])[0])} ∧ ${deonticToString((f.args || [])[1])})`;
    case 'or': return `(${deonticToString((f.args || [])[0])} ∨ ${deonticToString((f.args || [])[1])})`;
    case 'implies': return `(${deonticToString((f.args || [])[0])} → ${deonticToString((f.args || [])[1])})`;
    case 'biconditional': return `(${deonticToString((f.args || [])[0])} ↔ ${deonticToString((f.args || [])[1])})`;
    default: return formulaToString(f);
  }
}

// ── Perfil Deóntico Estándar ────────────────────────────────

export class DeonticStandard implements LogicProfile {
  name = 'deontic.standard';
  description = 'Lógica deóntica estándar (KD) — obligación (O/[]), permisión (P/<>), prohibición (F/[]!)';

  checkWellFormed(formula: Formula): Diagnostic[] {
    return [];
  }

  checkValid(formula: Formula): RunResult {
    const result = isValid(formula);
    return {
      status: result ? 'valid' : 'invalid',
      output: result
        ? `${deonticToString(formula)} es VÁLIDA en lógica deóntica KD`
        : `${deonticToString(formula)} NO es válida en lógica deóntica KD`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const result = isSatisfiable(formula);
    return {
      status: result ? 'satisfiable' : 'unsatisfiable',
      output: result
        ? `${deonticToString(formula)} es SATISFACIBLE en KD`
        : `${deonticToString(formula)} es INSATISFACIBLE en KD`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axiomFormulas = Array.from(theory.axioms.values());
    if (axiomFormulas.length === 0) {
      return this.checkValid(goal);
    }
    const conjunction: Formula = axiomFormulas.reduce((acc, f) => ({
      kind: 'and',
      args: [acc, f],
    }));
    const implication: Formula = { kind: 'implies', args: [conjunction, goal] };
    const result = isValid(implication);
    return {
      status: result ? 'provable' : 'refutable',
      output: result
        ? `${deonticToString(goal)} es DEMOSTRABLE desde los axiomas`
        : `${deonticToString(goal)} NO es demostrable desde los axiomas`,
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const premiseFormulas: Formula[] = [];
    for (const name of premises) {
      const f = theory.axioms.get(name) || theory.theorems.get(name);
      if (!f) {
        return {
          status: 'error',
          output: `Premisa no encontrada: ${name}`,
          diagnostics: [{ severity: 'error', message: `Premisa '${name}' no definida` }],
          formula: goal,
        };
      }
      premiseFormulas.push(f);
    }
    if (premiseFormulas.length === 0) {
      return this.checkValid(goal);
    }
    const conjunction: Formula = premiseFormulas.reduce((acc, f) => ({
      kind: 'and',
      args: [acc, f],
    }));
    const implication: Formula = { kind: 'implies', args: [conjunction, goal] };
    const result = isValid(implication);
    return {
      status: result ? 'provable' : 'refutable',
      output: result
        ? `${deonticToString(goal)} es DERIVABLE desde {${premises.join(', ')}}`
        : `${deonticToString(goal)} NO es derivable desde {${premises.join(', ')}}`,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const sat = isSatisfiable({ kind: 'not', args: [formula] });
    return {
      status: sat ? 'invalid' : 'valid',
      output: sat
        ? `Existe un contramodelo deóntico para ${deonticToString(formula)}`
        : `No existe contramodelo — ${deonticToString(formula)} es válida en KD`,
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const dStr = deonticToString(formula);
    let explanation = `Fórmula deóntica: ${dStr}\n\n`;
    explanation += `Operadores deónticos:\n`;
    explanation += `  O(φ) = [](φ)  — "Es obligatorio que φ"\n`;
    explanation += `  P(φ) = <>(φ)  — "Está permitido que φ"\n`;
    explanation += `  F(φ) = [](!φ) — "Está prohibido que φ"\n\n`;
    explanation += `Sistema: KD (K + axioma D)\n`;
    explanation += `  Axioma K: O(φ→ψ) → (O(φ)→O(ψ))\n`;
    explanation += `  Axioma D: O(φ) → P(φ) — "lo obligatorio es permisible"\n`;
    explanation += `  Serialidad: todo mundo tiene al menos un mundo accesible\n`;

    const valid = isValid(formula);
    explanation += `\nEstatus: ${valid ? 'VÁLIDA' : 'NO válida'} en KD`;

    return {
      status: valid ? 'valid' : 'invalid',
      output: explanation,
      diagnostics: [],
      formula,
    };
  }
}
