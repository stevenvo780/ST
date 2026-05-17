// ============================================================
// ST Hybrid Logic — Tipos del fragmento H(@, ↓, ∃)
// ============================================================
// Hybrid logic extiende la modal estándar con:
//   - nominales i, j, k ... — proposiciones que denotan UN único
//     mundo del frame.
//   - @i φ — "φ se satisface en el mundo nombrado por i".
//   - ↓i. φ — bind el mundo actual como nominal i en φ.
//   - ∃i. φ — existe un mundo i tal que φ se satisface allí.
//
// Referencias: Blackburn, Areces & ten Cate (2007), "Hybrid Logic".
// ============================================================

/** Constructores sintácticos del fragmento. */
export type HybridFormulaKind =
  | 'atom'
  | 'nominal'
  | 'not'
  | 'and'
  | 'or'
  | 'implies'
  | 'box'
  | 'diamond'
  | 'at'
  | 'down'
  | 'exists-world';

/**
 * AST de fórmulas híbridas.
 *
 * Las "variables de mundo" producidas por ↓ y ∃ comparten espacio de
 * nombres con los nominales libres; ambas se resuelven al mismo
 * mundo del frame en tiempo de evaluación (vía `env`).
 */
export type HybridFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'nominal'; name: string }
  | { kind: 'not'; arg: HybridFormula }
  | { kind: 'and'; args: HybridFormula[] }
  | { kind: 'or'; args: HybridFormula[] }
  | { kind: 'implies'; left: HybridFormula; right: HybridFormula }
  | { kind: 'box'; arg: HybridFormula }
  | { kind: 'diamond'; arg: HybridFormula }
  | { kind: 'at'; nominal: string; arg: HybridFormula }
  | { kind: 'down'; bind: string; arg: HybridFormula }
  | { kind: 'exists-world'; bind: string; arg: HybridFormula };

/**
 * Modelo de Kripke enriquecido con asignación de nominales.
 *
 * - `worlds`        : identificadores de los mundos.
 * - `accessibility` : relación R ⊆ W × W (pares ordenados).
 * - `nominals`      : nominal-name → world-id (función parcial total
 *                     sobre los nominales libres usados por la
 *                     fórmula que se evalúa).
 * - `valuation`     : atom-name → set de mundos donde el átomo es
 *                     verdadero.
 */
export interface HybridFrame {
  worlds: string[];
  accessibility: Array<[string, string]>;
  nominals: Record<string, string>;
  valuation: Record<string, Set<string>>;
}

// ── Constructores de conveniencia ──────────────────────────

export function atom(name: string): HybridFormula {
  return { kind: 'atom', name };
}

export function nominal(name: string): HybridFormula {
  return { kind: 'nominal', name };
}

export function not(arg: HybridFormula): HybridFormula {
  return { kind: 'not', arg };
}

export function and(...args: HybridFormula[]): HybridFormula {
  if (args.length === 0) throw new Error('and: aridad >= 1 requerida');
  if (args.length === 1) return args[0];
  return { kind: 'and', args };
}

export function or(...args: HybridFormula[]): HybridFormula {
  if (args.length === 0) throw new Error('or: aridad >= 1 requerida');
  if (args.length === 1) return args[0];
  return { kind: 'or', args };
}

export function implies(left: HybridFormula, right: HybridFormula): HybridFormula {
  return { kind: 'implies', left, right };
}

export function box(arg: HybridFormula): HybridFormula {
  return { kind: 'box', arg };
}

export function diamond(arg: HybridFormula): HybridFormula {
  return { kind: 'diamond', arg };
}

export function at(nominalName: string, arg: HybridFormula): HybridFormula {
  return { kind: 'at', nominal: nominalName, arg };
}

export function down(bind: string, arg: HybridFormula): HybridFormula {
  return { kind: 'down', bind, arg };
}

export function existsWorld(bind: string, arg: HybridFormula): HybridFormula {
  return { kind: 'exists-world', bind, arg };
}

/** Renderiza una fórmula híbrida en notación textual estándar. */
export function formulaToString(phi: HybridFormula): string {
  switch (phi.kind) {
    case 'atom':
      return phi.name;
    case 'nominal':
      return phi.name;
    case 'not':
      return `¬${wrap(phi.arg)}`;
    case 'and':
      return `(${phi.args.map(formulaToString).join(' ∧ ')})`;
    case 'or':
      return `(${phi.args.map(formulaToString).join(' ∨ ')})`;
    case 'implies':
      return `(${formulaToString(phi.left)} → ${formulaToString(phi.right)})`;
    case 'box':
      return `□${wrap(phi.arg)}`;
    case 'diamond':
      return `◇${wrap(phi.arg)}`;
    case 'at':
      return `@${phi.nominal} ${wrap(phi.arg)}`;
    case 'down':
      return `↓${phi.bind}. ${wrap(phi.arg)}`;
    case 'exists-world':
      return `∃${phi.bind}. ${wrap(phi.arg)}`;
  }
}

function wrap(phi: HybridFormula): string {
  if (
    phi.kind === 'atom' ||
    phi.kind === 'nominal' ||
    phi.kind === 'not' ||
    phi.kind === 'box' ||
    phi.kind === 'diamond' ||
    phi.kind === 'at'
  ) {
    return formulaToString(phi);
  }
  return `(${formulaToString(phi)})`;
}
