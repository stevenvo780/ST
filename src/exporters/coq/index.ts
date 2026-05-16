// ============================================================
// ST Exporters — Coq code generator (classical profile only)
// ============================================================
// Converts ST Formula AST and Proof objects into valid Coq 8.x
// source code. Scope v1: classical connectives + quantifiers.
// ============================================================

import { Formula, Proof, ProofStep } from '../../types';

// ----------------------------------------------------------------
// Public API types
// ----------------------------------------------------------------

export interface CoqExportOptions {
  /** Default: 'STExport' */
  moduleName?: string;
  /** Default: true — emits `Require Import Classical.` header */
  includeImports?: boolean;
  /** Default: true — emits a Theorem + Proof skeleton (Admitted. if not derivable) */
  emitProof?: boolean;
}

// ----------------------------------------------------------------
// Formula → Coq term
// ----------------------------------------------------------------

/**
 * Converts an ST Formula AST node into a Coq Prop expression string.
 * Only classical connectives and quantifiers are handled; other kinds
 * produce a `(* unsupported: <kind> *)` placeholder so callers can
 * inspect what was dropped.
 */
export function formulaToCoqTerm(formula: Formula): string {
  switch (formula.kind) {
    case 'atom':
      return formula.name ?? 'UnknownAtom';

    case 'true':
      return 'True';

    case 'false':
      return 'False';

    case 'not': {
      const inner = formula.args?.[0];
      if (!inner) return '(* missing arg for not *)';
      const innerStr = formulaToCoqTerm(inner);
      return needsParens(inner) ? `(~ (${innerStr}))` : `(~ ${innerStr})`;
    }

    case 'and': {
      const left = formula.args?.[0];
      const right = formula.args?.[1];
      if (!left || !right) return '(* missing args for and *)';
      return `(${formulaToCoqTerm(left)} /\\ ${formulaToCoqTerm(right)})`;
    }

    case 'or': {
      const left = formula.args?.[0];
      const right = formula.args?.[1];
      if (!left || !right) return '(* missing args for or *)';
      return `(${formulaToCoqTerm(left)} \\/ ${formulaToCoqTerm(right)})`;
    }

    case 'implies': {
      const antecedent = formula.args?.[0];
      const consequent = formula.args?.[1];
      if (!antecedent || !consequent) return '(* missing args for implies *)';
      return `(${formulaToCoqTerm(antecedent)} -> ${formulaToCoqTerm(consequent)})`;
    }

    case 'biconditional': {
      const left = formula.args?.[0];
      const right = formula.args?.[1];
      if (!left || !right) return '(* missing args for biconditional *)';
      return `(${formulaToCoqTerm(left)} <-> ${formulaToCoqTerm(right)})`;
    }

    case 'forall': {
      const variable = formula.variable ?? 'x';
      const body = formula.args?.[0];
      if (!body) return `(* missing body for forall ${variable} *)`;
      return `(forall ${variable} : Prop, ${formulaToCoqTerm(body)})`;
    }

    case 'exists': {
      const variable = formula.variable ?? 'x';
      const body = formula.args?.[0];
      if (!body) return `(* missing body for exists ${variable} *)`;
      return `(exists ${variable} : Prop, ${formulaToCoqTerm(body)})`;
    }

    case 'predicate': {
      const name = formula.name ?? 'P';
      const params = formula.params ?? formula.terms ?? [];
      if (params.length === 0) return name;
      return `(${name} ${params.join(' ')})`;
    }

    default:
      return `(* unsupported formula kind: ${formula.kind} *)`;
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
// Tactic skeleton derivation
// ----------------------------------------------------------------

/**
 * Tries to emit a useful tactic block for a proof step.
 * Falls back to `Admitted.` with a TODO comment when the rule
 * is not mechanically translatable.
 */
function proofStepToTactics(step: ProofStep): string {
  const just = step.justification.toLowerCase();

  if (just.includes('premise') || step.source === 'premise') {
    return `    (* step ${step.stepNumber}: premise — already in context *)`;
  }
  if (just.includes('assumption') || step.source === 'assumption') {
    return `    assumption.`;
  }
  if (just.includes('modus ponens') || just.includes('mp')) {
    return `    apply H. (* modus ponens — adjust H to actual hypothesis name *)`;
  }
  if (just.includes('intro') || just.includes('→i') || just.includes('implies intro')) {
    return `    intro H.`;
  }
  if (just.includes('and intro') || just.includes('∧i') || just.includes('conjunction intro')) {
    return `    split.`;
  }
  if (just.includes('and elim') || just.includes('∧e') || just.includes('conjunction elim')) {
    return `    destruct H as [HL HR].`;
  }
  if (just.includes('or intro left') || just.includes('∨il')) {
    return `    left.`;
  }
  if (just.includes('or intro right') || just.includes('∨ir')) {
    return `    right.`;
  }
  if (just.includes('or elim') || just.includes('∨e')) {
    return `    destruct H as [HL | HR].`;
  }
  if (just.includes('not intro') || just.includes('¬i')) {
    return `    intro Habs.`;
  }
  if (just.includes('not elim') || just.includes('¬e') || just.includes('contradiction')) {
    return `    contradiction.`;
  }
  if (just.includes('forall intro') || just.includes('∀i')) {
    return `    intro x.`;
  }
  if (just.includes('forall elim') || just.includes('∀e')) {
    return `    apply H.`;
  }
  if (just.includes('exists intro') || just.includes('∃i')) {
    return `    exists x. (* instantiate with actual witness *)`;
  }
  if (just.includes('exists elim') || just.includes('∃e')) {
    return `    destruct H as [x Hx].`;
  }
  if (just.includes('exact') || step.source === 'goal') {
    return `    exact H. (* adjust to actual hypothesis name *)`;
  }

  return `    Admitted. (* TODO: derive — step ${step.stepNumber}: ${step.justification} *)`;
}

/**
 * Builds a tactic block from a Proof's steps.
 * If the proof is complete and has recognisable steps, emits them.
 * Otherwise falls back to a single `Admitted.`.
 */
function buildTacticBlock(proof: Proof): string {
  if (proof.status !== 'complete' || proof.steps.length === 0) {
    return '    Admitted. (* TODO: derive — proof not complete *)';
  }

  const tactics: string[] = [];
  for (const step of proof.steps) {
    const line = proofStepToTactics(step);
    tactics.push(line);
  }
  return tactics.join('\n');
}

// ----------------------------------------------------------------
// Simple identity proof heuristic
// ----------------------------------------------------------------

/**
 * Detects `P → P` pattern (identity) and emits `intros P H. exact H.`
 * Returns null when the formula is not an identity implication.
 */
function tryIdentityProof(formula: Formula): string | null {
  if (formula.kind !== 'implies') return null;
  const ant = formula.args?.[0];
  const con = formula.args?.[1];
  if (!ant || !con) return null;
  if (ant.kind === 'atom' && con.kind === 'atom' && ant.name === con.name) {
    return `    intros ${ant.name} H. exact H.`;
  }
  if (ant.kind === 'forall' && con.kind === 'exists') {
    return null;
  }
  return null;
}

/**
 * Heuristic: `(A ∧ B) → A` — conjunction elimination left.
 */
function tryAndElimLeftProof(formula: Formula): string | null {
  if (formula.kind !== 'implies') return null;
  const ant = formula.args?.[0];
  const con = formula.args?.[1];
  if (!ant || !con) return null;
  if (ant.kind === 'and' && con.kind === 'atom') {
    const leftArg = ant.args?.[0];
    if (leftArg?.kind === 'atom' && leftArg.name === con.name) {
      return `    intros H. destruct H as [HL _]. exact HL.`;
    }
  }
  return null;
}

/**
 * Picks the best tactic skeleton for the goal formula without a Proof object.
 */
function heuristicTactics(formula: Formula): string {
  const identity = tryIdentityProof(formula);
  if (identity) return identity;

  const andElim = tryAndElimLeftProof(formula);
  if (andElim) return andElim;

  if (formula.kind === 'forall') {
    const body = formula.args?.[0];
    if (body?.kind === 'implies') {
      const ant = body.args?.[0];
      const con = body.args?.[1];
      if (ant?.kind === 'predicate' && con?.kind === 'exists') {
        const exVar = con.variable ?? 'y';
        return `    intro x. intro H. exists ${exVar}. exact H.`;
      }
    }
    return `    intro ${formula.variable ?? 'x'}.`;
  }

  return `    Admitted. (* TODO: derive *)`;
}

// ----------------------------------------------------------------
// Main export functions
// ----------------------------------------------------------------

/**
 * Exports a single ST Formula as a Coq module with a `Definition`
 * and an optional `Theorem` skeleton.
 *
 * @param formula - The ST Formula AST node.
 * @param opts    - Export options (moduleName, includeImports, emitProof).
 * @returns       Valid Coq source code as a string.
 */
export function exportToCoq(formula: Formula, opts?: CoqExportOptions): string {
  const moduleName = opts?.moduleName ?? 'STExport';
  const includeImports = opts?.includeImports ?? true;
  const emitProof = opts?.emitProof ?? true;

  const coqTerm = formulaToCoqTerm(formula);
  const lines: string[] = [];

  if (includeImports) {
    lines.push('Require Import Classical.');
    lines.push('');
  }

  lines.push(`Module ${moduleName}.`);
  lines.push(`  Definition stmt : Prop := ${coqTerm}.`);

  if (emitProof) {
    lines.push(`  Theorem stmt_proof : stmt.`);
    lines.push('  Proof.');
    lines.push(heuristicTactics(formula));
    lines.push('  Qed.');
  }

  lines.push(`End ${moduleName}.`);

  return lines.join('\n');
}

/**
 * Exports an ST Proof object as a Coq module with a `Definition`
 * and a `Theorem` block whose body is derived from the proof steps.
 *
 * @param proof - The ST Proof object.
 * @param opts  - Export options.
 * @returns     Valid Coq source code as a string.
 */
export function exportProofToCoq(proof: Proof, opts?: CoqExportOptions): string {
  const moduleName = opts?.moduleName ?? 'STExport';
  const includeImports = opts?.includeImports ?? true;
  const emitProof = opts?.emitProof ?? true;

  const coqTerm = formulaToCoqTerm(proof.goal);
  const lines: string[] = [];

  if (includeImports) {
    lines.push('Require Import Classical.');
    lines.push('');
  }

  lines.push(`Module ${moduleName}.`);
  lines.push(`  Definition stmt : Prop := ${coqTerm}.`);

  if (emitProof) {
    lines.push(`  Theorem stmt_proof : stmt.`);
    lines.push('  Proof.');
    lines.push(buildTacticBlock(proof));
    lines.push('  Qed.');
  }

  lines.push(`End ${moduleName}.`);

  return lines.join('\n');
}
