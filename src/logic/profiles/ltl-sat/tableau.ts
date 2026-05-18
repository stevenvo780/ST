// ============================================================
// ST LTL-SAT — Tableau / construcción de autómata estilo Büchi
// ============================================================
// Procedimiento de decisión clásico (Wolper, Vardi-Wolper):
//
//   1. Normalizar a NNF (negaciones empujadas hasta átomos).
//   2. Cerrar bajo subfórmulas y duales.
//   3. Generar "atoms" = subconjuntos máximalmente consistentes
//      de la clausura que cumplen las reglas locales de tableau
//      (α/β rules: una ∧ requiere ambas conyuntas; una ∨
//      requiere ≥1 disyunta; etc.).
//   4. Construir transición: atom A → atom B sii cada Xφ ∈ A
//      cumple φ ∈ B (y nada más restringe el siguiente estado).
//   5. Decidir SAT: existe lazo accesible desde un átomo que
//      contiene φ tal que cada eventualidad (F ψ o φ U ψ) se
//      cumple en el ciclo (presencia de ψ).
//
// El procedimiento es decidible: 2^O(|φ|) atoms, búsqueda de
// lazo en el grafo resultante (NL en el tamaño del grafo).
// ============================================================

import { LTLFormula, formulaKey, formulaToString } from './types';

// --- NNF: negation normal form -----------------------------------------------

/** Convierte una fórmula LTL a Negation Normal Form (NNF): negaciones empujadas hasta átomos. */
export function toNNF(f: LTLFormula): LTLFormula {
  return pushNot(f, false);
}

function pushNot(f: LTLFormula, negated: boolean): LTLFormula {
  switch (f.kind) {
    case 'atom':
      return negated ? { kind: 'not', arg: f } : f;
    case 'not':
      return pushNot(f.arg, !negated);
    case 'and':
      if (negated) {
        return { kind: 'or', args: f.args.map((a) => pushNot(a, true)) };
      }
      return { kind: 'and', args: f.args.map((a) => pushNot(a, false)) };
    case 'or':
      if (negated) {
        return { kind: 'and', args: f.args.map((a) => pushNot(a, true)) };
      }
      return { kind: 'or', args: f.args.map((a) => pushNot(a, false)) };
    case 'X':
      // ¬X φ ≡ X ¬φ  (en LTL lineal el next es funcional).
      return { kind: 'X', arg: pushNot(f.arg, negated) };
    case 'F':
      // ¬F φ ≡ G ¬φ
      return negated
        ? { kind: 'G', arg: pushNot(f.arg, true) }
        : { kind: 'F', arg: pushNot(f.arg, false) };
    case 'G':
      // ¬G φ ≡ F ¬φ
      return negated
        ? { kind: 'F', arg: pushNot(f.arg, true) }
        : { kind: 'G', arg: pushNot(f.arg, false) };
    case 'U':
      // ¬(φ U ψ) ≡ (¬ψ) R (¬φ)
      if (negated) {
        return {
          kind: 'R',
          left: pushNot(f.right, true),
          right: pushNot(f.left, true),
        };
      }
      return {
        kind: 'U',
        left: pushNot(f.left, false),
        right: pushNot(f.right, false),
      };
    case 'R':
      // ¬(φ R ψ) ≡ (¬φ) U (¬ψ)
      if (negated) {
        return {
          kind: 'U',
          left: pushNot(f.left, true),
          right: pushNot(f.right, true),
        };
      }
      return {
        kind: 'R',
        left: pushNot(f.left, false),
        right: pushNot(f.right, false),
      };
  }
}

// --- Closure ----------------------------------------------------------------

/**
 * Calcula la clausura de subfórmulas de `f` (incluyendo duales de F, G, U, R via X).
 * El conjunto resultado es el universo de fórmulas sobre el que se construyen los atoms.
 */
export function closure(f: LTLFormula): LTLFormula[] {
  const seen = new Map<string, LTLFormula>();
  function visit(g: LTLFormula): void {
    const k = formulaKey(g);
    if (seen.has(k)) return;
    seen.set(k, g);
    switch (g.kind) {
      case 'atom':
        return;
      case 'not':
        visit(g.arg);
        return;
      case 'and':
      case 'or':
        g.args.forEach(visit);
        return;
      case 'X':
        visit(g.arg);
        return;
      case 'F':
        // F φ ≡ φ ∨ X F φ; añadimos también X F φ a la clausura.
        visit(g.arg);
        visit({ kind: 'X', arg: g });
        return;
      case 'G':
        // G φ ≡ φ ∧ X G φ
        visit(g.arg);
        visit({ kind: 'X', arg: g });
        return;
      case 'U':
        // φ U ψ ≡ ψ ∨ (φ ∧ X(φ U ψ))
        visit(g.left);
        visit(g.right);
        visit({ kind: 'X', arg: g });
        return;
      case 'R':
        // φ R ψ ≡ ψ ∧ (φ ∨ X(φ R ψ))
        visit(g.left);
        visit(g.right);
        visit({ kind: 'X', arg: g });
        return;
    }
  }
  visit(f);
  return Array.from(seen.values());
}

// --- Atoms (subconjuntos localmente consistentes) ---------------------------

/**
 * Subconjunto de la clausura localmente consistente con las reglas de tableau.
 * Cada `Atom` representa un estado posible del autómata de Büchi implícito.
 */
export interface Atom {
  id: number;
  /** Fórmulas presentes en este átomo (clave canónica → fórmula). */
  formulas: Map<string, LTLFormula>;
  /** Literales positivos presentes (para trazas legibles). */
  positiveLiterals: string[];
  /** Literales negativos presentes (para trazas legibles). */
  negativeLiterals: string[];
}

// Devuelve true si la asignación parcial `present` es localmente consistente
// con respecto a las reglas tableau y *contiene* todas las fórmulas que se
// derivan obligatoriamente de las que ya están dentro.
function isLocallyConsistent(present: Set<string>, byKey: Map<string, LTLFormula>): boolean {
  for (const [k, f] of byKey) {
    if (!present.has(k)) continue;

    switch (f.kind) {
      case 'atom': {
        const negKey = `n:${k}`;
        if (present.has(negKey)) return false;
        break;
      }
      case 'not': {
        if (f.arg.kind === 'atom') {
          // ¬p: p no debe estar.
          if (present.has(formulaKey(f.arg))) return false;
        }
        // Cualquier otro `not` no debería existir tras NNF.
        break;
      }
      case 'and':
        for (const a of f.args) {
          if (!present.has(formulaKey(a))) return false;
        }
        break;
      case 'or': {
        // Al menos una disyunta presente.
        let ok = false;
        for (const a of f.args) {
          if (present.has(formulaKey(a))) {
            ok = true;
            break;
          }
        }
        if (!ok) return false;
        break;
      }
      case 'X':
        // X φ no impone condiciones locales en el átomo actual; lo
        // valida la relación de transición.
        break;
      case 'F': {
        // F φ ≡ φ ∨ X F φ: φ presente o X(F φ) presente.
        const phiKey = formulaKey(f.arg);
        const xFphiKey = `X:${k}`;
        if (!present.has(phiKey) && !present.has(xFphiKey)) return false;
        break;
      }
      case 'G': {
        // G φ ≡ φ ∧ X G φ: ambas.
        const phiKey = formulaKey(f.arg);
        const xGphiKey = `X:${k}`;
        if (!present.has(phiKey) || !present.has(xGphiKey)) return false;
        break;
      }
      case 'U': {
        // φ U ψ ≡ ψ ∨ (φ ∧ X(φ U ψ))
        const psiKey = formulaKey(f.right);
        const phiKey = formulaKey(f.left);
        const xUKey = `X:${k}`;
        const optA = present.has(psiKey);
        const optB = present.has(phiKey) && present.has(xUKey);
        if (!optA && !optB) return false;
        break;
      }
      case 'R': {
        // φ R ψ ≡ ψ ∧ (φ ∨ X(φ R ψ))
        const psiKey = formulaKey(f.right);
        const phiKey = formulaKey(f.left);
        const xRKey = `X:${k}`;
        if (!present.has(psiKey)) return false;
        if (!present.has(phiKey) && !present.has(xRKey)) return false;
        break;
      }
    }
  }
  return true;
}

// Genera todos los atoms (subconjuntos de la clausura) localmente
// consistentes. Para evitar explosión usamos enumeración por elección
// de subfórmulas en orden tópico con poda temprana.
/**
 * Genera todos los atoms localmente consistentes a partir de la clausura dada.
 * Usa backtracking con poda de contradicciones átomo/¬átomo.
 * Límite de seguridad: 200 000 atoms para evitar explosión exponencial.
 */
export function enumerateAtoms(closureFormulas: LTLFormula[]): Atom[] {
  const byKey = new Map<string, LTLFormula>();
  for (const g of closureFormulas) byKey.set(formulaKey(g), g);

  // Particionamos en: átomos atómicos (incluyendo sus negaciones), y el resto.
  // Para cada átomo proposicional decidimos true/false. Para el resto, lo
  // derivamos por reglas; pero algunas elecciones quedan: ∨, U, R, F
  // tienen disyunciones internas. Las enumeramos por subset de la clausura.
  //
  // Estrategia: enumerar sobre todos los subconjuntos de la clausura y
  // filtrar por consistencia local. La clausura |Φ| ≤ O(|φ|*2). Para
  // fórmulas pequeñas (~5-10 ops) esto da 2^20 ≈ 1M ⇒ aceptable en tests.

  const keys = closureFormulas.map(formulaKey);
  const atoms: Atom[] = [];
  const n = keys.length;
  // Búsqueda por backtracking con poda.
  const present = new Set<string>();

  // Helper para chequeo de consistencia parcial: dado que el orden de
  // selección es arbitrario, sólo evaluamos consistencia completa al final.
  // (La poda más simple: cláusulas atom/¬atom contradictorias.)
  function backtrack(i: number): void {
    if (atoms.length > 200000) return; // safety hard cap
    if (i === n) {
      if (isLocallyConsistent(present, byKey)) {
        const formulas = new Map<string, LTLFormula>();
        const pos: string[] = [];
        const neg: string[] = [];
        for (const k of present) {
          const ff = byKey.get(k);
          if (!ff) continue;
          formulas.set(k, ff);
          if (ff.kind === 'atom') pos.push(ff.name);
          else if (ff.kind === 'not' && ff.arg.kind === 'atom') neg.push(ff.arg.name);
        }
        atoms.push({
          id: atoms.length,
          formulas,
          positiveLiterals: pos.sort(),
          negativeLiterals: neg.sort(),
        });
      }
      return;
    }
    // Decide no incluir keys[i].
    backtrack(i + 1);
    // Decide incluir keys[i].
    const k = keys[i];
    const f = byKey.get(k);
    if (!f) return;
    // Poda inmediata: si f es atom p y ¬p ya está, no incluir.
    if (f.kind === 'atom') {
      if (present.has(`n:${k}`)) return; // poda
    } else if (f.kind === 'not' && f.arg.kind === 'atom') {
      if (present.has(formulaKey(f.arg))) return;
    }
    present.add(k);
    backtrack(i + 1);
    present.delete(k);
  }

  backtrack(0);
  return atoms;
}

// --- Transition relation ----------------------------------------------------

// A → B sii: para toda Xφ ∈ A, φ ∈ B. (No exigimos lo recíproco porque B
// puede contener fórmulas "iniciales" de su estado.)
//
// IMPORTANTE: además, las fórmulas obligatorias de la siguiente generación
// (F, G, U, R) deben mantenerse consistentes. La regla X-φ ∈ A ⇒ φ ∈ B
// es suficiente porque la clausura ya contiene X(F φ), X(G φ), X(φ U ψ),
// X(φ R ψ) explícitamente.
/**
 * Construye la relación de transición entre atoms.
 * A → B sii para toda Xφ ∈ A se cumple φ ∈ B.
 * @returns Mapa de id de atom origen a lista de ids de atoms destino.
 */
export function transitions(atoms: Atom[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  for (const a of atoms) {
    // Recolectamos las obligaciones "next".
    const nextObligations: string[] = [];
    for (const f of a.formulas.values()) {
      if (f.kind === 'X') {
        nextObligations.push(formulaKey(f.arg));
      }
    }
    const succ: number[] = [];
    for (const b of atoms) {
      let ok = true;
      for (const obl of nextObligations) {
        if (!b.formulas.has(obl)) {
          ok = false;
          break;
        }
      }
      if (ok) succ.push(b.id);
    }
    out.set(a.id, succ);
  }
  return out;
}

// --- Eventualities ----------------------------------------------------------

// Una "eventualidad" en LTL es F ψ (que debe satisfacerse alguna vez) o
// φ U ψ (idem). Para que un lazo sea aceptante, cada eventualidad presente
// debe cumplirse dentro del ciclo (estado donde ψ está presente).
/**
 * Eventualidad LTL que debe cumplirse dentro del lazo aceptante.
 * F ψ y φ U ψ son eventualidades; se satisfacen cuando ψ aparece en algún estado del ciclo.
 */
export interface Eventuality {
  /** Clave canónica de la eventualidad (F ψ o φ U ψ). */
  key: string;
  /** Clave de la fórmula testigo ψ que debe estar presente en el ciclo. */
  witnessFormulaKey: string;
}

/** Extrae todas las eventualidades (F ψ y φ U ψ) presentes en un atom. */
export function eventualitiesIn(atom: Atom): Eventuality[] {
  const ev: Eventuality[] = [];
  for (const [k, f] of atom.formulas) {
    if (f.kind === 'F') {
      ev.push({ key: k, witnessFormulaKey: formulaKey(f.arg) });
    } else if (f.kind === 'U') {
      ev.push({ key: k, witnessFormulaKey: formulaKey(f.right) });
    }
  }
  return ev;
}

/** Describe un atom por sus literales: "p,¬q" o "∅" si está vacío. */
export function describeAtom(a: Atom): string {
  const pos = a.positiveLiterals.join(',');
  const neg = a.negativeLiterals.map((n) => `¬${n}`).join(',');
  const all = [pos, neg].filter((s) => s.length > 0).join(',');
  return all || '∅';
}

/** Alias de `formulaToString` para uso en contextos de depuración del tableau. */
export function describeFormula(f: LTLFormula): string {
  return formulaToString(f);
}
