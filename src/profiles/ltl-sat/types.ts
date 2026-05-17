// ============================================================
// ST LTL-SAT — Tipos para el procedimiento de decisión de LTL
// ============================================================
// AST nativo de LTL para el decisor por tableau:
//   atom, not, and, or, X (next), F (eventually), G (globally),
//   U (until), R (release).
//
// La operación derivada W (weak until) se traduce a R en la
// normalización: φ W ψ ≡ ψ R (φ ∨ ψ) ≡ (G φ) ∨ (φ U ψ).
// ============================================================

export type LTLFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'not'; arg: LTLFormula }
  | { kind: 'and'; args: LTLFormula[] }
  | { kind: 'or'; args: LTLFormula[] }
  | { kind: 'X'; arg: LTLFormula }
  | { kind: 'F'; arg: LTLFormula }
  | { kind: 'G'; arg: LTLFormula }
  | { kind: 'U'; left: LTLFormula; right: LTLFormula }
  | { kind: 'R'; left: LTLFormula; right: LTLFormula };

// Constructores ergonómicos.
export const atom = (name: string): LTLFormula => ({ kind: 'atom', name });
export const not = (arg: LTLFormula): LTLFormula => ({ kind: 'not', arg });
export const and = (...args: LTLFormula[]): LTLFormula => ({ kind: 'and', args });
export const or = (...args: LTLFormula[]): LTLFormula => ({ kind: 'or', args });
export const next = (arg: LTLFormula): LTLFormula => ({ kind: 'X', arg });
export const eventually = (arg: LTLFormula): LTLFormula => ({ kind: 'F', arg });
export const globally = (arg: LTLFormula): LTLFormula => ({ kind: 'G', arg });
export const until = (left: LTLFormula, right: LTLFormula): LTLFormula => ({
  kind: 'U',
  left,
  right,
});
export const release = (left: LTLFormula, right: LTLFormula): LTLFormula => ({
  kind: 'R',
  left,
  right,
});
// Weak until: φ W ψ ≡ (φ U ψ) ∨ G φ
export const weakUntil = (left: LTLFormula, right: LTLFormula): LTLFormula =>
  or(until(left, right), globally(left));

// Implicación derivada: φ → ψ ≡ ¬φ ∨ ψ
export const implies = (left: LTLFormula, right: LTLFormula): LTLFormula => or(not(left), right);

export interface Witness {
  prefix: string[];
  loop: string[];
}

export interface SatResult {
  sat: boolean;
  witness?: Witness;
}

export function formulaToString(f: LTLFormula): string {
  switch (f.kind) {
    case 'atom':
      return f.name;
    case 'not':
      return `¬${parenthesize(f.arg)}`;
    case 'and':
      return f.args.map(parenthesize).join(' ∧ ');
    case 'or':
      return f.args.map(parenthesize).join(' ∨ ');
    case 'X':
      return `X ${parenthesize(f.arg)}`;
    case 'F':
      return `F ${parenthesize(f.arg)}`;
    case 'G':
      return `G ${parenthesize(f.arg)}`;
    case 'U':
      return `(${formulaToString(f.left)} U ${formulaToString(f.right)})`;
    case 'R':
      return `(${formulaToString(f.left)} R ${formulaToString(f.right)})`;
  }
}

function parenthesize(f: LTLFormula): string {
  if (f.kind === 'atom') return f.name;
  if (f.kind === 'not') return formulaToString(f);
  return `(${formulaToString(f)})`;
}

// Clave canónica: usada para hashing en sets/maps.
export function formulaKey(f: LTLFormula): string {
  switch (f.kind) {
    case 'atom':
      return `a:${f.name}`;
    case 'not':
      return `n:${formulaKey(f.arg)}`;
    case 'and':
      return `&:${f.args.map(formulaKey).sort().join(',')}`;
    case 'or':
      return `|:${f.args.map(formulaKey).sort().join(',')}`;
    case 'X':
      return `X:${formulaKey(f.arg)}`;
    case 'F':
      return `F:${formulaKey(f.arg)}`;
    case 'G':
      return `G:${formulaKey(f.arg)}`;
    case 'U':
      return `U:${formulaKey(f.left)};${formulaKey(f.right)}`;
    case 'R':
      return `R:${formulaKey(f.left)};${formulaKey(f.right)}`;
  }
}
