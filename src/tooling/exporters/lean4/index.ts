// ============================================================
// ST Exporters — Lean 4 code generator (classical profile)
// ============================================================
// Converts ST Formula AST and Proof objects into valid Lean 4
// source code. Differences vs. Coq exporter:
//   - Uses Unicode connectives (∧ ∨ → ¬ ↔) instead of ASCII.
//   - Definitions use `:=` and theorems use `theorem ... := by ...`.
//   - Tactics use Lean 4 vocabulary: `intro`, `exact`, `constructor`,
//     `obtain ⟨...⟩`, `cases`, `left`/`right`, `exfalso`, etc.
//   - Imports list controls Mathlib vs. core; default pulls in
//     `Mathlib.Tactic` for `tauto`, `exact?`, `Classical.em`, etc.
// ============================================================

import { Formula, Proof, ProofStep } from '../../../types';

// ----------------------------------------------------------------
// Public API types
// ----------------------------------------------------------------

export interface Lean4ExportOptions {
  /** Default: 'STExport' */
  moduleName?: string;
  /** Explicit import list. When omitted, picks default depending on `useMathlib`. */
  imports?: string[];
  /** Default: true — when true and `imports` not set, uses Mathlib preset. */
  useMathlib?: boolean;
  /** Default: true — emits a `theorem stmt_proof : stmt := by ...` skeleton. */
  emitProof?: boolean;
}

// ----------------------------------------------------------------
// Common imports presets
// ----------------------------------------------------------------

export const COMMON_IMPORTS: Record<'standard' | 'mathlib' | 'minimal', string[]> = {
  /** Lean 4 core only — no Mathlib needed. */
  minimal: [],
  /** Init prelude only — same as the empty list but explicit. */
  standard: ['Init'],
  /** Mathlib tactic suite — enables `tauto`, `exact?`, `Classical.em`. */
  mathlib: ['Mathlib.Tactic'],
};

// ----------------------------------------------------------------
// Symbol mapping
// ----------------------------------------------------------------

/**
 * Maps ST/Unicode logical operators to their Lean 4 surface syntax.
 * Lean 4 happens to accept the same Unicode glyphs, but we keep the
 * map explicit so downstream tooling can introspect the mapping.
 */
export const LEAN4_OPS: Map<string, string> = new Map([
  ['not', '¬'],
  ['and', '∧'],
  ['or', '∨'],
  ['implies', '→'],
  ['biconditional', '↔'],
  ['forall', '∀'],
  ['exists', '∃'],
  ['true', 'True'],
  ['false', 'False'],
]);

// ----------------------------------------------------------------
// Formula → Lean 4 term
// ----------------------------------------------------------------

/**
 * Converts an ST Formula AST node into a Lean 4 Prop expression string.
 * Unsupported kinds emit `(/- unsupported: <kind> -/)` so dropped
 * sub-trees are visible to the reader.
 */
export function formulaToLeanTerm(formula: Formula): string {
  switch (formula.kind) {
    case 'atom':
      return formula.name ?? 'UnknownAtom';

    case 'true':
      return 'True';

    case 'false':
      return 'False';

    case 'not': {
      const inner = formula.args?.[0];
      if (!inner) return '(/- missing arg for not -/)';
      const innerStr = formulaToLeanTerm(inner);
      return needsParens(inner) ? `(¬ (${innerStr}))` : `(¬ ${innerStr})`;
    }

    case 'and': {
      const left = formula.args?.[0];
      const right = formula.args?.[1];
      if (!left || !right) return '(/- missing args for and -/)';
      return `(${formulaToLeanTerm(left)} ∧ ${formulaToLeanTerm(right)})`;
    }

    case 'or': {
      const left = formula.args?.[0];
      const right = formula.args?.[1];
      if (!left || !right) return '(/- missing args for or -/)';
      return `(${formulaToLeanTerm(left)} ∨ ${formulaToLeanTerm(right)})`;
    }

    case 'implies': {
      const antecedent = formula.args?.[0];
      const consequent = formula.args?.[1];
      if (!antecedent || !consequent) return '(/- missing args for implies -/)';
      return `(${formulaToLeanTerm(antecedent)} → ${formulaToLeanTerm(consequent)})`;
    }

    case 'biconditional': {
      const left = formula.args?.[0];
      const right = formula.args?.[1];
      if (!left || !right) return '(/- missing args for biconditional -/)';
      return `(${formulaToLeanTerm(left)} ↔ ${formulaToLeanTerm(right)})`;
    }

    case 'forall': {
      const variable = formula.variable ?? 'x';
      const body = formula.args?.[0];
      if (!body) return `(/- missing body for forall ${variable} -/)`;
      return `(∀ ${variable} : Prop, ${formulaToLeanTerm(body)})`;
    }

    case 'exists': {
      const variable = formula.variable ?? 'x';
      const body = formula.args?.[0];
      if (!body) return `(/- missing body for exists ${variable} -/)`;
      return `(∃ ${variable} : Prop, ${formulaToLeanTerm(body)})`;
    }

    case 'predicate': {
      const name = formula.name ?? 'P';
      const params = formula.params ?? formula.terms ?? [];
      if (params.length === 0) return name;
      return `(${name} ${params.join(' ')})`;
    }

    default:
      return `(/- unsupported formula kind: ${formula.kind} -/)`;
  }
}

/** Whether the formula needs outer parens when used as an argument. */
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
// Rule → Lean 4 tactic
// ----------------------------------------------------------------

/**
 * Translates a natural-deduction rule label into a Lean 4 tactic.
 * Used by callers that already know what rule they want to apply
 * outside the context of a full proof step.
 */
export function leanTacticForRule(rule: string): string {
  const r = rule.toLowerCase();

  if (r.includes('modus ponens') || r === 'mp' || r.includes('modus-ponens')) {
    return 'exact h₁ h₂';
  }
  if (r.includes('implies intro') || r.includes('→i') || r.includes('imp-intro') || r === 'intro') {
    return 'intro h';
  }
  if (r.includes('and intro') || r.includes('∧i') || r.includes('and-intro')) {
    return 'constructor';
  }
  if (r.includes('and elim left') || r.includes('∧el')) {
    return 'exact h.left';
  }
  if (r.includes('and elim right') || r.includes('∧er')) {
    return 'exact h.right';
  }
  if (r.includes('and elim') || r.includes('∧e')) {
    return 'obtain ⟨hL, hR⟩ := h';
  }
  if (r.includes('or intro left') || r.includes('∨il')) {
    return 'left';
  }
  if (r.includes('or intro right') || r.includes('∨ir')) {
    return 'right';
  }
  if (r.includes('or elim') || r.includes('∨e')) {
    return 'cases h with\n    | inl hL => sorry\n    | inr hR => sorry';
  }
  if (r.includes('not intro') || r.includes('¬i')) {
    return 'intro habs';
  }
  if (r.includes('not elim') || r.includes('¬e') || r.includes('contradiction')) {
    return 'contradiction';
  }
  if (r.includes('forall intro') || r.includes('∀i')) {
    return 'intro x';
  }
  if (r.includes('forall elim') || r.includes('∀e')) {
    return 'exact h x';
  }
  if (r.includes('exists intro') || r.includes('∃i')) {
    return 'exact ⟨x, hx⟩';
  }
  if (r.includes('exists elim') || r.includes('∃e')) {
    return 'obtain ⟨x, hx⟩ := h';
  }
  if (r.includes('lem') || r.includes('excluded middle') || r.includes('em')) {
    return 'exact Classical.em _';
  }
  if (r.includes('exact') || r === 'goal') {
    return 'exact h';
  }
  if (r.includes('assumption') || r === 'premise') {
    return 'assumption';
  }
  if (r.includes('tauto')) {
    return 'tauto';
  }

  return `sorry -- TODO: ${rule}`;
}

// ----------------------------------------------------------------
// Tactic skeleton derivation from a Proof object
// ----------------------------------------------------------------

function proofStepToTactic(step: ProofStep): string {
  if (step.source === 'premise' || step.justification.toLowerCase().includes('premise')) {
    return `    -- step ${step.stepNumber}: premise — already in context`;
  }
  if (step.source === 'assumption' || step.justification.toLowerCase().includes('assumption')) {
    return '    assumption';
  }
  return `    ${leanTacticForRule(step.justification)}`;
}

function buildTacticBlock(proof: Proof): string {
  if (proof.status !== 'complete' || proof.steps.length === 0) {
    return '    sorry -- TODO: derive — proof not complete';
  }
  return proof.steps.map(proofStepToTactic).join('\n');
}

// ----------------------------------------------------------------
// Heuristic proofs for common shapes
// ----------------------------------------------------------------

/** Detects `P → P` and emits the identity proof. */
function tryIdentityProof(formula: Formula): string | null {
  if (formula.kind !== 'implies') return null;
  const ant = formula.args?.[0];
  const con = formula.args?.[1];
  if (!ant || !con) return null;
  if (ant.kind === 'atom' && con.kind === 'atom' && ant.name === con.name) {
    return `    intro h\n    exact h`;
  }
  return null;
}

/** Detects `(A ∧ B) → A` — left projection. */
function tryAndElimLeftProof(formula: Formula): string | null {
  if (formula.kind !== 'implies') return null;
  const ant = formula.args?.[0];
  const con = formula.args?.[1];
  if (!ant || !con) return null;
  if (ant.kind === 'and' && con.kind === 'atom') {
    const leftArg = ant.args?.[0];
    if (leftArg?.kind === 'atom' && leftArg.name === con.name) {
      return `    intro h\n    exact h.left`;
    }
  }
  return null;
}

/** Detects `(A ∧ B) → B` — right projection. */
function tryAndElimRightProof(formula: Formula): string | null {
  if (formula.kind !== 'implies') return null;
  const ant = formula.args?.[0];
  const con = formula.args?.[1];
  if (!ant || !con) return null;
  if (ant.kind === 'and' && con.kind === 'atom') {
    const rightArg = ant.args?.[1];
    if (rightArg?.kind === 'atom' && rightArg.name === con.name) {
      return `    intro h\n    exact h.right`;
    }
  }
  return null;
}

/** Detects `P ∨ ¬P` (LEM). */
function tryLEMProof(formula: Formula): string | null {
  if (formula.kind !== 'or') return null;
  const left = formula.args?.[0];
  const right = formula.args?.[1];
  if (!left || !right) return null;
  if (left.kind === 'atom' && right.kind === 'not') {
    const negArg = right.args?.[0];
    if (negArg?.kind === 'atom' && negArg.name === left.name) {
      return `    exact Classical.em _`;
    }
  }
  if (right.kind === 'atom' && left.kind === 'not') {
    const negArg = left.args?.[0];
    if (negArg?.kind === 'atom' && negArg.name === right.name) {
      return `    exact (Classical.em _).symm`;
    }
  }
  return null;
}

/** Picks the best tactic skeleton given just a goal formula. */
function heuristicTactics(formula: Formula): string {
  const identity = tryIdentityProof(formula);
  if (identity) return identity;

  const lem = tryLEMProof(formula);
  if (lem) return lem;

  const andLeft = tryAndElimLeftProof(formula);
  if (andLeft) return andLeft;

  const andRight = tryAndElimRightProof(formula);
  if (andRight) return andRight;

  if (formula.kind === 'forall') {
    const body = formula.args?.[0];
    if (body?.kind === 'implies') {
      const ant = body.args?.[0];
      const con = body.args?.[1];
      if (ant?.kind === 'predicate' && con?.kind === 'exists') {
        const exVar = con.variable ?? 'y';
        // Lean 4: provide the witness and reuse the assumption.
        return `    intro x\n    intro h\n    exact ⟨${exVar}, h⟩`;
      }
    }
    return `    intro ${formula.variable ?? 'x'}\n    sorry -- TODO: derive`;
  }

  return `    sorry -- TODO: derive`;
}

// ----------------------------------------------------------------
// Import / header helpers
// ----------------------------------------------------------------

function resolveImports(opts: Lean4ExportOptions | undefined): string[] {
  if (opts?.imports !== undefined) return opts.imports;
  const useMathlib = opts?.useMathlib ?? true;
  return useMathlib ? COMMON_IMPORTS.mathlib : COMMON_IMPORTS.minimal;
}

function emitImports(imports: string[]): string[] {
  return imports.filter((i) => i.length > 0).map((i) => `import ${i}`);
}

// ----------------------------------------------------------------
// Main export functions
// ----------------------------------------------------------------

/**
 * Exports a single ST Formula as a Lean 4 module containing a
 * `def stmt : Prop := ...` and an optional `theorem stmt_proof : stmt := by ...`.
 */
export function exportToLean4(formula: Formula, opts?: Lean4ExportOptions): string {
  const moduleName = opts?.moduleName ?? 'STExport';
  const emitProof = opts?.emitProof ?? true;
  const imports = resolveImports(opts);

  const term = formulaToLeanTerm(formula);
  const lines: string[] = [];

  const importLines = emitImports(imports);
  if (importLines.length > 0) {
    lines.push(...importLines);
    lines.push('');
  }

  lines.push(`namespace ${moduleName}`);
  lines.push('');
  lines.push(`def stmt : Prop := ${term}`);

  if (emitProof) {
    lines.push('');
    lines.push(`theorem stmt_proof : stmt := by`);
    lines.push(heuristicTactics(formula));
  }

  lines.push('');
  lines.push(`end ${moduleName}`);

  return lines.join('\n');
}

/**
 * Exports an ST Proof object as a Lean 4 module whose theorem body is
 * derived from the proof steps.
 */
export function exportProofToLean4(proof: Proof, opts?: Lean4ExportOptions): string {
  const moduleName = opts?.moduleName ?? 'STExport';
  const emitProof = opts?.emitProof ?? true;
  const imports = resolveImports(opts);

  const term = formulaToLeanTerm(proof.goal);
  const lines: string[] = [];

  const importLines = emitImports(imports);
  if (importLines.length > 0) {
    lines.push(...importLines);
    lines.push('');
  }

  lines.push(`namespace ${moduleName}`);
  lines.push('');
  lines.push(`def stmt : Prop := ${term}`);

  if (emitProof) {
    lines.push('');
    lines.push(`theorem stmt_proof : stmt := by`);
    lines.push(buildTacticBlock(proof));
  }

  lines.push('');
  lines.push(`end ${moduleName}`);

  return lines.join('\n');
}

/**
 * Exports a small theory (axioms + theorems) as a single Lean 4 module.
 * Axioms become `axiom ax_i : <prop>` declarations; theorems become
 * `theorem th_i : <prop> := by sorry` skeletons that the user fills in.
 */
export function exportTheoryToLean4(
  axioms: Formula[],
  theorems: Formula[],
  opts?: Lean4ExportOptions,
): string {
  const moduleName = opts?.moduleName ?? 'STExport';
  const emitProof = opts?.emitProof ?? true;
  const imports = resolveImports(opts);

  const lines: string[] = [];
  const importLines = emitImports(imports);
  if (importLines.length > 0) {
    lines.push(...importLines);
    lines.push('');
  }

  lines.push(`namespace ${moduleName}`);

  axioms.forEach((ax, idx) => {
    lines.push('');
    lines.push(`axiom ax_${idx + 1} : ${formulaToLeanTerm(ax)}`);
  });

  theorems.forEach((th, idx) => {
    lines.push('');
    lines.push(`def stmt_${idx + 1} : Prop := ${formulaToLeanTerm(th)}`);
    if (emitProof) {
      lines.push(`theorem stmt_${idx + 1}_proof : stmt_${idx + 1} := by`);
      lines.push(heuristicTactics(th));
    }
  });

  lines.push('');
  lines.push(`end ${moduleName}`);

  return lines.join('\n');
}
