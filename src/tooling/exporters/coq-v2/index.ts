// ============================================================
// ST Exporters — Coq code generator V2
// ============================================================
// Mejoras sobre v1:
//   - Tactics derivadas: auto / tauto / firstorder / intuition / lia / omega.
//   - Dependent types: forall x : nat / forall x : Type, ...
//   - Generación de hints: Hint Resolve, Hint Rewrite.
//   - Proof terms (lambda) además de tactics, o "both".
// Mantiene coq/index.ts (v1) intacto: ambos coexisten.
// ============================================================

import { Formula, Proof, ProofStep } from '../../../types';

// ----------------------------------------------------------------
// Public API types
// ----------------------------------------------------------------

export type CoqEmitMode = 'tactic' | 'proofterm' | 'both';

export interface CoqV2ExportOptions {
  /** Default: 'STExportV2' */
  moduleName?: string;
  /**
   * Imports adicionales (sin el `Require Import` prefix). Si se omite, se
   * infiere a partir de la fórmula (Classical/Arith según sea necesario).
   */
  imports?: string[];
  /** Default: 'tactic'. 'both' emite tactic + proofterm comentado. */
  emitMode?: CoqEmitMode;
  /** Default: true. Si true, agrega `auto` como tactic fallback. */
  useAuto?: boolean;
  /** Default: true. Si true, usa hints registrados (`auto with stdb`). */
  useHints?: boolean;
  /** Default: false. Si true, genera bloque `Hint Resolve ...`. */
  emitHints?: boolean;
}

// ----------------------------------------------------------------
// Dependent sort inference
// ----------------------------------------------------------------

/**
 * Heurística simple: si una variable aparece como argumento de un predicado
 * aritmético (`<`, `>`, `+`, `=`, etc.) la consideramos `nat`. Si aparece
 * en un predicado simbólico, la consideramos `Prop`. Default: `Type`.
 */
export function inferDependentSorts(formula: unknown): Map<string, string> {
  const sorts = new Map<string, string>();
  if (!isFormulaLike(formula)) return sorts;
  walkFormula(formula, (node) => {
    // Quantifier: registra la variable bajo el sort heredado de cómo se usa.
    if (node.kind === 'forall' || node.kind === 'exists') {
      const v = node.variable ?? 'x';
      if (!sorts.has(v)) {
        const inferred = inferVarSortInBody(v, node.args?.[0]);
        sorts.set(v, inferred);
      }
    }
  });
  return sorts;
}

function inferVarSortInBody(v: string, body: Formula | undefined): string {
  if (!body) return 'Type';
  let inferred: string | null = null;
  walkFormula(body, (node) => {
    if (inferred) return;
    if (
      node.kind === 'less' ||
      node.kind === 'greater' ||
      node.kind === 'less_eq' ||
      node.kind === 'greater_eq' ||
      node.kind === 'add' ||
      node.kind === 'subtract' ||
      node.kind === 'multiply' ||
      node.kind === 'divide' ||
      node.kind === 'modulo'
    ) {
      // Si la variable aparece en algún arg numérico, asume nat.
      if (formulaMentionsVar(node, v)) inferred = 'nat';
    }
    if (node.kind === 'equals') {
      // Equality numérica si los args son números/aritméticos.
      const a = node.args?.[0];
      const b = node.args?.[1];
      if (
        (a && (a.kind === 'number' || isArithmetic(a))) ||
        (b && (b.kind === 'number' || isArithmetic(b)))
      ) {
        if (formulaMentionsVar(node, v)) inferred = 'nat';
      }
    }
  });
  return inferred ?? 'Type';
}

function isArithmetic(f: Formula): boolean {
  return (
    f.kind === 'add' ||
    f.kind === 'subtract' ||
    f.kind === 'multiply' ||
    f.kind === 'divide' ||
    f.kind === 'modulo'
  );
}

function formulaMentionsVar(f: Formula, v: string): boolean {
  if (f.kind === 'atom' && f.name === v) return true;
  if (f.kind === 'predicate') {
    const params = f.params ?? f.terms ?? [];
    if (params.includes(v)) return true;
  }
  for (const child of f.args ?? []) {
    if (formulaMentionsVar(child, v)) return true;
  }
  return false;
}

function walkFormula(f: Formula, visit: (node: Formula) => void): void {
  visit(f);
  for (const child of f.args ?? []) {
    walkFormula(child, visit);
  }
}

function isFormulaLike(v: unknown): v is Formula {
  return !!v && typeof v === 'object' && typeof (v as Formula).kind === 'string';
}

// ----------------------------------------------------------------
// Formula → Coq Type (dependent-aware)
// ----------------------------------------------------------------

/**
 * Convierte una fórmula ST en un tipo Coq, con cuantificadores tipados según
 * la inferencia dependiente. Caso por defecto: Prop.
 */
export function formulaToCoqType(formula: unknown): string {
  if (!isFormulaLike(formula)) return 'Prop';
  const sorts = inferDependentSorts(formula);
  return renderFormula(formula, sorts);
}

function renderFormula(formula: Formula, sorts: Map<string, string>): string {
  switch (formula.kind) {
    case 'atom':
      return formula.name ?? 'UnknownAtom';
    case 'true':
      return 'True';
    case 'false':
      return 'False';
    case 'number':
      return String(formula.value ?? 0);
    case 'not': {
      const inner = formula.args?.[0];
      if (!inner) return '(* missing arg for not *)';
      const innerStr = renderFormula(inner, sorts);
      return needsParens(inner) ? `(~ (${innerStr}))` : `(~ ${innerStr})`;
    }
    case 'and': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for and *)';
      return `(${renderFormula(l, sorts)} /\\ ${renderFormula(r, sorts)})`;
    }
    case 'or': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for or *)';
      return `(${renderFormula(l, sorts)} \\/ ${renderFormula(r, sorts)})`;
    }
    case 'implies': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for implies *)';
      return `(${renderFormula(l, sorts)} -> ${renderFormula(r, sorts)})`;
    }
    case 'biconditional': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for biconditional *)';
      return `(${renderFormula(l, sorts)} <-> ${renderFormula(r, sorts)})`;
    }
    case 'forall': {
      const v = formula.variable ?? 'x';
      const sort = sorts.get(v) ?? 'Prop';
      const body = formula.args?.[0];
      if (!body) return `(* missing body for forall ${v} *)`;
      return `(forall ${v} : ${sort}, ${renderFormula(body, sorts)})`;
    }
    case 'exists': {
      const v = formula.variable ?? 'x';
      const sort = sorts.get(v) ?? 'Prop';
      const body = formula.args?.[0];
      if (!body) return `(* missing body for exists ${v} *)`;
      return `(exists ${v} : ${sort}, ${renderFormula(body, sorts)})`;
    }
    case 'predicate': {
      const name = formula.name ?? 'P';
      const params = formula.params ?? formula.terms ?? [];
      if (params.length === 0) return name;
      return `(${name} ${params.join(' ')})`;
    }
    case 'equals': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for equals *)';
      return `(${renderFormula(l, sorts)} = ${renderFormula(r, sorts)})`;
    }
    case 'less': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for less *)';
      return `(${renderFormula(l, sorts)} < ${renderFormula(r, sorts)})`;
    }
    case 'greater': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for greater *)';
      return `(${renderFormula(l, sorts)} > ${renderFormula(r, sorts)})`;
    }
    case 'less_eq': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for less_eq *)';
      return `(${renderFormula(l, sorts)} <= ${renderFormula(r, sorts)})`;
    }
    case 'greater_eq': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for greater_eq *)';
      return `(${renderFormula(l, sorts)} >= ${renderFormula(r, sorts)})`;
    }
    case 'add': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for add *)';
      return `(${renderFormula(l, sorts)} + ${renderFormula(r, sorts)})`;
    }
    case 'subtract': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for subtract *)';
      return `(${renderFormula(l, sorts)} - ${renderFormula(r, sorts)})`;
    }
    case 'multiply': {
      const [l, r] = pair(formula);
      if (!l || !r) return '(* missing args for multiply *)';
      return `(${renderFormula(l, sorts)} * ${renderFormula(r, sorts)})`;
    }
    default:
      return `(* unsupported formula kind: ${formula.kind} *)`;
  }
}

function pair(f: Formula): [Formula | undefined, Formula | undefined] {
  return [f.args?.[0], f.args?.[1]];
}

function needsParens(f: Formula): boolean {
  return (
    f.kind === 'and' ||
    f.kind === 'or' ||
    f.kind === 'implies' ||
    f.kind === 'biconditional' ||
    f.kind === 'forall' ||
    f.kind === 'exists'
  );
}

// ----------------------------------------------------------------
// Tactic strategies
// ----------------------------------------------------------------

export type TacticStrategy =
  | 'auto'
  | 'tauto'
  | 'firstorder'
  | 'intuition'
  | 'lia'
  | 'omega'
  | 'reflexivity'
  | 'admit'
  | 'custom';

/**
 * Elige la mejor tactic automática según las features de la fórmula.
 * Reglas (ordenadas):
 *   1. equality syntactically idéntica (a = a) → reflexivity.
 *   2. aritmética puramente lineal (<, >, +, -, =, lia) → lia.
 *   3. cuantificadores de primer orden con predicados → firstorder.
 *   4. propositional clásico con ∨ + ¬ → tauto.
 *   5. propositional con implicaciones encadenadas → intuition.
 *   6. fallback → auto.
 */
export function chooseStrategy(formula: unknown): TacticStrategy {
  if (!isFormulaLike(formula)) return 'auto';

  if (isTrivialReflexivity(formula)) return 'reflexivity';
  if (hasArithmetic(formula)) return 'lia';
  if (hasFirstOrderQuantifiers(formula)) return 'firstorder';
  if (hasDisjunctionWithNegation(formula)) return 'tauto';
  if (isPureImplicationChain(formula)) return 'intuition';
  return 'auto';
}

function isTrivialReflexivity(f: Formula): boolean {
  // forall x, x = x
  if (f.kind === 'forall') {
    const body = f.args?.[0];
    if (body?.kind === 'equals') {
      const a = body.args?.[0];
      const b = body.args?.[1];
      if (
        a &&
        b &&
        a.kind === 'atom' &&
        b.kind === 'atom' &&
        a.name === b.name &&
        a.name === f.variable
      ) {
        return true;
      }
    }
  }
  if (f.kind === 'equals') {
    const a = f.args?.[0];
    const b = f.args?.[1];
    if (a && b && a.kind === 'atom' && b.kind === 'atom' && a.name === b.name) return true;
  }
  return false;
}

function hasArithmetic(f: Formula): boolean {
  let found = false;
  walkFormula(f, (node) => {
    if (
      node.kind === 'less' ||
      node.kind === 'greater' ||
      node.kind === 'less_eq' ||
      node.kind === 'greater_eq' ||
      node.kind === 'add' ||
      node.kind === 'subtract' ||
      node.kind === 'multiply' ||
      node.kind === 'modulo'
    ) {
      found = true;
    }
  });
  return found;
}

function hasFirstOrderQuantifiers(f: Formula): boolean {
  let hasQ = false;
  let hasPred = false;
  walkFormula(f, (node) => {
    if (node.kind === 'forall' || node.kind === 'exists') hasQ = true;
    if (node.kind === 'predicate') hasPred = true;
  });
  return hasQ && hasPred;
}

function hasDisjunctionWithNegation(f: Formula): boolean {
  let hasOr = false;
  let hasNot = false;
  walkFormula(f, (node) => {
    if (node.kind === 'or') hasOr = true;
    if (node.kind === 'not') hasNot = true;
  });
  return hasOr && hasNot;
}

function isPureImplicationChain(f: Formula): boolean {
  // (A -> B) -> (B -> C) -> A -> C — patrones encadenados
  if (f.kind !== 'implies') return false;
  let hasNestedImp = false;
  walkFormula(f, (node) => {
    if (node.kind === 'implies' && node !== f) hasNestedImp = true;
  });
  return hasNestedImp;
}

// ----------------------------------------------------------------
// Tactic block builder (per step)
// ----------------------------------------------------------------

function proofStepToTactics(step: ProofStep): string {
  const just = step.justification.toLowerCase();

  if (just.includes('premise') || step.source === 'premise') {
    return `    (* step ${step.stepNumber}: premise — already in context *)`;
  }
  if (just.includes('assumption') || step.source === 'assumption') {
    return `    assumption.`;
  }
  if (just.includes('modus ponens') || just.includes('mp')) {
    return `    apply H. (* MP — ajustar nombre de H *)`;
  }
  if (just.includes('intro') || just.includes('→i') || just.includes('implies intro')) {
    return `    intro H.`;
  }
  if (just.includes('and intro') || just.includes('∧i')) return `    split.`;
  if (just.includes('and elim') || just.includes('∧e')) return `    destruct H as [HL HR].`;
  if (just.includes('or intro left') || just.includes('∨il')) return `    left.`;
  if (just.includes('or intro right') || just.includes('∨ir')) return `    right.`;
  if (just.includes('or elim') || just.includes('∨e')) return `    destruct H as [HL | HR].`;
  if (just.includes('not intro') || just.includes('¬i')) return `    intro Habs.`;
  if (just.includes('not elim') || just.includes('¬e') || just.includes('contradiction'))
    return `    contradiction.`;
  if (just.includes('forall intro') || just.includes('∀i')) return `    intro x.`;
  if (just.includes('forall elim') || just.includes('∀e')) return `    apply H.`;
  if (just.includes('exists intro') || just.includes('∃i'))
    return `    exists x. (* instanciar con testigo real *)`;
  if (just.includes('exists elim') || just.includes('∃e')) return `    destruct H as [x Hx].`;
  if (just.includes('reflex')) return `    reflexivity.`;
  if (just.includes('exact') || step.source === 'goal') return `    exact H.`;
  if (just.includes('auto')) return `    auto.`;
  if (just.includes('tauto')) return `    tauto.`;

  return `    auto. (* fallback step ${step.stepNumber}: ${step.justification} *)`;
}

function buildTacticBlock(proof: Proof, fallback: TacticStrategy, useAuto: boolean): string {
  if (proof.status !== 'complete' || proof.steps.length === 0) {
    const tac = useAuto ? `    ${fallback}.` : `    admit.`;
    return tac;
  }
  return proof.steps.map((step) => proofStepToTactics(step)).join('\n');
}

// ----------------------------------------------------------------
// Heuristic tactic for a bare formula
// ----------------------------------------------------------------

function heuristicTacticsForFormula(formula: Formula, useAuto: boolean): string {
  const strat = chooseStrategy(formula);
  // strategies devuelven 1 tactic + Qed cierra. admit no usa Qed.
  if (strat === 'reflexivity') {
    if (formula.kind === 'forall') return `    intros. reflexivity.`;
    return `    reflexivity.`;
  }
  if (strat === 'lia') return `    intros. lia.`;
  if (strat === 'firstorder') return `    firstorder.`;
  if (strat === 'tauto') return `    tauto.`;
  if (strat === 'intuition') return `    intuition.`;
  if (strat === 'auto') return useAuto ? `    intros. auto.` : `    admit.`;
  return `    admit.`;
}

// ----------------------------------------------------------------
// Proof term reconstruction
// ----------------------------------------------------------------

/**
 * Genera un proof term (lambda) directo desde un Proof object.
 * Soporta patrones básicos: identidad, MP, conjunción/disyunción intro-elim.
 * Para casos no manejados devuelve un placeholder con TODO.
 */
export function ndProofToProofTerm(proof: unknown): string {
  if (!proof || typeof proof !== 'object') return '(* invalid proof *)';
  const p = proof as Proof;

  // Identity: P -> P
  if (
    p.goal &&
    p.goal.kind === 'implies' &&
    p.goal.args?.[0]?.kind === 'atom' &&
    p.goal.args?.[1]?.kind === 'atom' &&
    p.goal.args[0].name === p.goal.args[1].name
  ) {
    return `fun (${p.goal.args[0].name} : Prop) (H : ${p.goal.args[0].name}) => H`;
  }

  // (A -> B) -> A -> B (modus ponens — curry full).
  // En AST: implies(implies(A,B), implies(A, B)).
  if (
    p.goal &&
    p.goal.kind === 'implies' &&
    p.goal.args?.[0]?.kind === 'implies' &&
    p.goal.args?.[1]?.kind === 'implies'
  ) {
    const ab = p.goal.args[0];
    const ab2 = p.goal.args[1];
    const a = ab.args?.[0];
    const b = ab.args?.[1];
    const a2 = ab2.args?.[0];
    const b2 = ab2.args?.[1];
    if (
      a?.kind === 'atom' &&
      b?.kind === 'atom' &&
      a2?.kind === 'atom' &&
      b2?.kind === 'atom' &&
      a.name === a2.name &&
      b.name === b2.name
    ) {
      return `fun (H1 : ${a.name} -> ${b.name}) (H2 : ${a.name}) => H1 H2`;
    }
  }

  // (P /\ Q) -> P (and elim left)
  if (
    p.goal &&
    p.goal.kind === 'implies' &&
    p.goal.args?.[0]?.kind === 'and' &&
    p.goal.args?.[1]?.kind === 'atom'
  ) {
    const andF = p.goal.args[0];
    const target = p.goal.args[1];
    const left = andF.args?.[0];
    const right = andF.args?.[1];
    if (left?.kind === 'atom' && right?.kind === 'atom') {
      if (left.name === target.name) {
        return `fun (H : ${left.name} /\\ ${right.name}) => match H with | conj HL _ => HL end`;
      }
      if (right.name === target.name) {
        return `fun (H : ${left.name} /\\ ${right.name}) => match H with | conj _ HR => HR end`;
      }
    }
  }

  // forall x : T, x = x → fun x => eq_refl x
  if (p.goal?.kind === 'forall') {
    const body = p.goal.args?.[0];
    if (
      body?.kind === 'equals' &&
      body.args?.[0]?.kind === 'atom' &&
      body.args?.[1]?.kind === 'atom' &&
      body.args[0].name === body.args[1].name
    ) {
      const v = p.goal.variable ?? 'x';
      return `fun (${v} : nat) => eq_refl ${v}`;
    }
  }

  return `(* TODO: proof term reconstruction not implemented for this shape *)`;
}

// ----------------------------------------------------------------
// Hints generation
// ----------------------------------------------------------------

/**
 * Genera líneas `Hint Resolve` / `Hint Rewrite` para una base `stdb`.
 * - Axiomas con head implicación → `Hint Resolve`.
 * - Igualdades universales → `Hint Rewrite`.
 * - Theorems "obvios" (identidad, P→P) también van como Hint Resolve.
 */
export function generateHints(axioms: unknown[], theorems: unknown[]): string[] {
  const lines: string[] = [];
  const axiomList = Array.isArray(axioms) ? axioms : [];
  const theoremList = Array.isArray(theorems) ? theorems : [];

  axiomList.forEach((ax, i) => {
    if (!isFormulaLike(ax)) return;
    const name = `Ax_${i + 1}`;
    if (isEqualityRewrite(ax)) {
      lines.push(`Hint Rewrite ${name} : stdb.`);
    } else {
      lines.push(`Hint Resolve ${name} : stdb.`);
    }
  });

  theoremList.forEach((th, i) => {
    if (!isFormulaLike(th)) return;
    const name = `Th_${i + 1}`;
    lines.push(`Hint Resolve ${name} : stdb.`);
  });

  return lines;
}

function isEqualityRewrite(f: Formula): boolean {
  if (f.kind === 'equals') return true;
  if (f.kind === 'forall') {
    const body = f.args?.[0];
    if (body) return isEqualityRewrite(body);
  }
  return false;
}

// ----------------------------------------------------------------
// Import inference
// ----------------------------------------------------------------

function inferImports(formula: Formula | undefined, opts: CoqV2ExportOptions): string[] {
  if (opts.imports && opts.imports.length > 0) return opts.imports;
  const set = new Set<string>();
  // Default classical for excluded middle
  set.add('Classical');
  if (formula) {
    if (hasArithmetic(formula)) {
      set.add('Arith');
      set.add('Lia');
    }
    walkFormula(formula, (node) => {
      if (node.kind === 'list') set.add('List');
    });
  }
  return Array.from(set);
}

// ----------------------------------------------------------------
// Main API
// ----------------------------------------------------------------

/**
 * Exporta una fórmula ST a Coq como módulo V2 con tactic strategy automática.
 */
export function exportToCoqV2(formula: unknown, opts?: CoqV2ExportOptions): string {
  const moduleName = opts?.moduleName ?? 'STExportV2';
  const emitMode = opts?.emitMode ?? 'tactic';
  const useAuto = opts?.useAuto ?? true;
  const useHints = opts?.useHints ?? true;
  const emitHints = opts?.emitHints ?? false;

  if (!isFormulaLike(formula)) {
    return `(* coq-v2: input is not a Formula AST *)`;
  }

  const term = formulaToCoqType(formula);
  const imports = inferImports(formula, opts ?? {});
  const lines: string[] = [];

  for (const imp of imports) {
    lines.push(`Require Import ${imp}.`);
  }
  lines.push('');
  lines.push(`Module ${moduleName}.`);
  lines.push(`  Definition stmt : Prop := ${term}.`);

  if (emitHints) {
    lines.push(`  (* hints registrados en base stdb *)`);
  }

  if (emitMode === 'tactic' || emitMode === 'both') {
    lines.push(`  Theorem stmt_proof : stmt.`);
    lines.push('  Proof.');
    lines.push(heuristicTacticsForFormula(formula, useAuto));
    if (useHints) {
      lines.push(`    (* auto with stdb registered hints if needed *)`);
    }
    lines.push('  Qed.');
  }

  if (emitMode === 'proofterm' || emitMode === 'both') {
    const fakeProof: Proof = { goal: formula, status: 'complete', steps: [] };
    const term2 = ndProofToProofTerm(fakeProof);
    lines.push(`  Definition stmt_term : stmt := ${term2}.`);
  }

  lines.push(`End ${moduleName}.`);
  return lines.join('\n');
}

/**
 * Exporta un Proof ST a Coq como módulo V2, derivando tactics desde steps
 * y, opcionalmente, un proof term reconstruido.
 */
export function exportProofToCoqV2(proof: unknown, opts?: CoqV2ExportOptions): string {
  const moduleName = opts?.moduleName ?? 'STExportV2';
  const emitMode = opts?.emitMode ?? 'tactic';
  const useAuto = opts?.useAuto ?? true;

  if (!proof || typeof proof !== 'object' || !('goal' in proof)) {
    return `(* coq-v2: input is not a Proof *)`;
  }
  const p = proof as Proof;
  const term = formulaToCoqType(p.goal);
  const imports = inferImports(p.goal, opts ?? {});
  const fallback = chooseStrategy(p.goal);
  const lines: string[] = [];

  for (const imp of imports) {
    lines.push(`Require Import ${imp}.`);
  }
  lines.push('');
  lines.push(`Module ${moduleName}.`);
  lines.push(`  Definition stmt : Prop := ${term}.`);

  if (emitMode === 'tactic' || emitMode === 'both') {
    lines.push(`  Theorem stmt_proof : stmt.`);
    lines.push('  Proof.');
    lines.push(buildTacticBlock(p, fallback, useAuto));
    lines.push('  Qed.');
  }

  if (emitMode === 'proofterm' || emitMode === 'both') {
    const term2 = ndProofToProofTerm(p);
    lines.push(`  Definition stmt_term : stmt := ${term2}.`);
  }

  lines.push(`End ${moduleName}.`);
  return lines.join('\n');
}

/**
 * Exporta una teoría completa: axiomas + theorems con hints derivados.
 */
export function exportTheoryToCoqV2(
  axioms: unknown[],
  theorems: unknown[],
  opts?: CoqV2ExportOptions,
): string {
  const moduleName = opts?.moduleName ?? 'STTheoryV2';
  const emitHints = opts?.emitHints ?? true;
  const useAuto = opts?.useAuto ?? true;
  const lines: string[] = [];

  // Imports: combinar de toda la teoría
  const importsSet = new Set<string>();
  const all = [...axioms, ...theorems];
  for (const f of all) {
    if (!isFormulaLike(f)) continue;
    const imp = inferImports(f, opts ?? {});
    for (const i of imp) importsSet.add(i);
  }
  for (const imp of importsSet) {
    lines.push(`Require Import ${imp}.`);
  }
  lines.push('');
  lines.push(`Module ${moduleName}.`);

  // Axiomas
  axioms.forEach((ax, i) => {
    if (!isFormulaLike(ax)) return;
    const t = formulaToCoqType(ax);
    lines.push(`  Axiom Ax_${i + 1} : ${t}.`);
  });

  // Theorems
  theorems.forEach((th, i) => {
    if (!isFormulaLike(th)) return;
    const t = formulaToCoqType(th);
    lines.push(`  Theorem Th_${i + 1} : ${t}.`);
    lines.push('  Proof.');
    lines.push(heuristicTacticsForFormula(th, useAuto));
    lines.push('  Qed.');
  });

  if (emitHints) {
    const hints = generateHints(axioms, theorems);
    if (hints.length > 0) {
      lines.push('');
      lines.push(`  (* hints — base "stdb" *)`);
      for (const h of hints) lines.push(`  ${h}`);
    }
  }

  lines.push(`End ${moduleName}.`);
  return lines.join('\n');
}
