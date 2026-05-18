// ============================================================
// ST Profile Bridge — traducciones cross-profile
// ============================================================
// Implementa las traducciones clásicas entre perfiles lógicos:
//
//   intuitionistic → classical  (Glivenko ¬¬-translation)
//   classical      → S4         (Gödel-McKinsey-Tarski □-embedding)
//   LTL            → CTL        (embedding conservativo uno-a-uno)
//   CTL            → LTL        (aproximación parcial, paths existenciales)
//   fuzzy          → classical  (aproximación por umbral 0.5)
//
// Grafo de traducciones:
//
//   intuitionistic ──(Glivenko)──→ classical ──(Gödel)──→ S4
//                                                             ↑
//   LTL ──(ltlToCTL)──→ CTL ─────────────────────────────────┘
//   CTL ──(ctlToLTL)──→ LTL  (partial, one-way)
// ============================================================

import type { Formula } from '../../types';
import type { LTLFormula } from '../profiles/ltl-sat/types';
import type { CTLFormula } from '../profiles/ctl/types';

// ── Tipos públicos ───────────────────────────────────────────

export type Profile = 'classical' | 'intuitionistic' | 'S4' | 'LTL' | 'CTL' | 'fuzzy';

export interface GenericFormula {
  profile: Profile;
  ast: unknown;
}

export type Validity = 'preserved' | 'one-way' | 'partial';

export interface Translation {
  source: Profile;
  target: Profile;
  translate(formula: unknown): unknown;
  validity: Validity;
}

// ── Utilidades internas ──────────────────────────────────────

/** Envuelve una Formula en doble negación: φ → ¬¬φ */
function doubleNeg(f: Formula): Formula {
  return { kind: 'not', args: [{ kind: 'not', args: [f] }] };
}

/** Aplica la traducción ¬¬ de Glivenko recursivamente.
 *
 * Reglas (Glivenko 1929):
 *   atom p         → ¬¬p
 *   ¬φ             → ¬¬(¬φ')        = ¬φ'     (¬¬¬ ≡ ¬)
 *   φ ∧ ψ          → ¬¬(φ' ∧ ψ')
 *   φ ∨ ψ          → ¬¬(φ' ∨ ψ')
 *   φ → ψ          → ¬¬(φ' → ψ')
 *   φ ↔ ψ          → ¬¬(φ' ↔ ψ')
 *   ⊤              → ⊤
 *   ⊥              → ⊥
 *
 * Resultado: clásicamente válido si y solo si el original lo es en IPC.
 */
export function glivenkoTranslation(intuitFormula: unknown): Formula {
  const f = intuitFormula as Formula;
  return applyGlivenko(f);
}

function applyGlivenko(f: Formula): Formula {
  switch (f.kind) {
    case 'true':
    case 'false':
      return f;

    case 'atom':
      return doubleNeg(f);

    case 'not': {
      const inner = (f.args ?? [])[0];
      if (!inner) return doubleNeg(f);
      // ¬φ' — la doble negación de una negación colapsa: ¬¬¬φ ≡ ¬φ
      return { kind: 'not', args: [applyGlivenko(inner)] };
    }

    case 'and':
    case 'or':
    case 'implies':
    case 'biconditional': {
      const translatedArgs = (f.args ?? []).map(applyGlivenko);
      return doubleNeg({ ...f, args: translatedArgs });
    }

    default:
      return doubleNeg(f);
  }
}

/** Aplica la traducción de Gödel-McKinsey-Tarski: clasical → S4.
 *
 * Reglas (Gödel 1933):
 *   atom p         → □p
 *   ¬φ             → □¬φ'
 *   φ ∧ ψ          → φ' ∧ ψ'
 *   φ ∨ ψ          → φ' ∨ ψ'
 *   φ → ψ          → □(φ' → ψ')
 *   φ ↔ ψ          → □(φ' ↔ ψ')
 *   ⊤              → ⊤
 *   ⊥              → ⊥
 *
 * Corrección: φ es tautología clásica sii godelTranslation(φ) es
 * tautología S4 (Gödel 1933, McKinsey-Tarski 1948).
 */
export function godelTranslation(classicalFormula: unknown): Formula {
  const f = classicalFormula as Formula;
  return applyGodel(f);
}

function box(f: Formula): Formula {
  return { kind: 'modal_necessity', args: [f] };
}

function applyGodel(f: Formula): Formula {
  switch (f.kind) {
    case 'true':
    case 'false':
      return f;

    case 'atom':
      return box(f);

    case 'not': {
      const inner = (f.args ?? [])[0];
      if (!inner) return box(f);
      return box({ kind: 'not', args: [applyGodel(inner)] });
    }

    case 'and':
    case 'or': {
      const translatedArgs = (f.args ?? []).map(applyGodel);
      return { ...f, args: translatedArgs };
    }

    case 'implies':
    case 'biconditional': {
      const translatedArgs = (f.args ?? []).map(applyGodel);
      return box({ ...f, args: translatedArgs });
    }

    default:
      return box(f);
  }
}

// ── LTL → CTL ───────────────────────────────────────────────
// Embedding conservativo: operadores path-existencial de LTL
// se mapean a sus contrapartes existenciales de CTL.
//
//   X φ   → EX φ'    (existe un sucesor)
//   F φ   → EF φ'    (existe un camino que eventualmente alcanza)
//   G φ   → EG φ'    (existe un camino siempre φ)
//   φ U ψ → E[φ' U ψ'] (existe un camino con until)
//   φ R ψ → E[ψ' R φ'] (release: E[ψ U (ψ∧φ)] aproximado)
//
// validity: 'one-way' — LTL-valid ⇒ imagen CTL-valid en E-paths,
// pero no viceversa (CTL tiene más poder expresivo sobre branching).

export function ltlToCTL(ltlFormula: unknown): CTLFormula {
  const f = ltlFormula as LTLFormula;
  return ltlToCTLRec(f);
}

function ltlToCTLRec(f: LTLFormula): CTLFormula {
  switch (f.kind) {
    case 'atom':
      return { kind: 'atom', name: f.name };

    case 'not':
      return { kind: 'not', arg: ltlToCTLRec(f.arg) };

    case 'and':
      return { kind: 'and', args: f.args.map(ltlToCTLRec) };

    case 'or':
      return { kind: 'or', args: f.args.map(ltlToCTLRec) };

    case 'X':
      return { kind: 'EX', arg: ltlToCTLRec(f.arg) };

    case 'F':
      return { kind: 'EF', arg: ltlToCTLRec(f.arg) };

    case 'G':
      return { kind: 'EG', arg: ltlToCTLRec(f.arg) };

    case 'U':
      return { kind: 'EU', left: ltlToCTLRec(f.left), right: ltlToCTLRec(f.right) };

    case 'R': {
      // Release φ R ψ ≡ ψ W (ψ∧φ): no hay operador R nativo en CTL.
      // Traducimos como ¬(¬ψ U ¬φ) vía dualidad, representado con EU.
      // Para la traducción conservativa one-way usamos:
      //   φ R ψ ≡ ¬(¬ψ U ¬φ) → CTL: ¬E[¬ψ' U ¬φ']
      const notLeft: CTLFormula = { kind: 'not', arg: ltlToCTLRec(f.left) };
      const notRight: CTLFormula = { kind: 'not', arg: ltlToCTLRec(f.right) };
      return {
        kind: 'not',
        arg: { kind: 'EU', left: notRight, right: notLeft },
      };
    }
  }
}

// ── CTL → LTL ───────────────────────────────────────────────
// Aproximación parcial. Los operadores A (universal-path) de CTL
// no tienen equivalente directo en LTL (Vardi 1988). Los E
// (existencial) se traducen fielmente en el fragmento linear.
//
//   EX φ  → X φ'
//   AX φ  → X φ'     (aproximación: LTL no distingue branching)
//   EF φ  → F φ'
//   AF φ  → F φ'
//   EG φ  → G φ'
//   AG φ  → G φ'
//   E[φUψ] → φ' U ψ'
//   A[φUψ] → φ' U ψ'
//
// validity: 'partial' — la imagen LTL es más débil; sólo preserva
// semántica lineal, no branching. No apta para model checking exacto.

export function ctlToLTL(ctlFormula: unknown): LTLFormula {
  const f = ctlFormula as CTLFormula;
  return ctlToLTLRec(f);
}

function ctlToLTLRec(f: CTLFormula): LTLFormula {
  switch (f.kind) {
    case 'atom':
      return { kind: 'atom', name: f.name };

    case 'true':
      return {
        kind: 'or',
        args: [
          { kind: 'atom', name: '__true__' },
          { kind: 'not', arg: { kind: 'atom', name: '__true__' } },
        ],
      };

    case 'false':
      return {
        kind: 'and',
        args: [
          { kind: 'atom', name: '__false__' },
          { kind: 'not', arg: { kind: 'atom', name: '__false__' } },
        ],
      };

    case 'not':
      return { kind: 'not', arg: ctlToLTLRec(f.arg) };

    case 'and':
      return { kind: 'and', args: f.args.map(ctlToLTLRec) };

    case 'or':
      return { kind: 'or', args: f.args.map(ctlToLTLRec) };

    case 'implies':
      return {
        kind: 'or',
        args: [{ kind: 'not', arg: ctlToLTLRec(f.left) }, ctlToLTLRec(f.right)],
      };

    case 'EX':
    case 'AX':
      return { kind: 'X', arg: ctlToLTLRec(f.arg) };

    case 'EF':
    case 'AF':
      return { kind: 'F', arg: ctlToLTLRec(f.arg) };

    case 'EG':
    case 'AG':
      return { kind: 'G', arg: ctlToLTLRec(f.arg) };

    case 'EU':
    case 'AU':
      return { kind: 'U', left: ctlToLTLRec(f.left), right: ctlToLTLRec(f.right) };
  }
}

// ── fuzzy → classical ────────────────────────────────────────
// Umbral crisp: valores ≥ 0.5 → true; < 0.5 → false.
// Formula de fuzzy se asume como una Formula con valores numéricos
// codificados como kind:'number'. Aproximación heurística.

function fuzzyCrisp(f: Formula): Formula {
  if (f.kind === 'number') {
    const v = f.value ?? 0;
    return { kind: v >= 0.5 ? 'true' : 'false' };
  }
  const newArgs = (f.args ?? []).map(fuzzyCrisp);
  return { ...f, args: newArgs.length > 0 ? newArgs : undefined };
}

// ── Registro de traducciones ────────────────────────────────

export const TRANSLATIONS: Translation[] = [
  {
    source: 'intuitionistic',
    target: 'classical',
    translate: glivenkoTranslation,
    validity: 'preserved',
  },
  {
    source: 'classical',
    target: 'S4',
    translate: godelTranslation,
    validity: 'preserved',
  },
  {
    source: 'LTL',
    target: 'CTL',
    translate: ltlToCTL,
    validity: 'one-way',
  },
  {
    source: 'CTL',
    target: 'LTL',
    translate: ctlToLTL,
    validity: 'partial',
  },
  {
    source: 'fuzzy',
    target: 'classical',
    translate: (f) => fuzzyCrisp(f as Formula),
    validity: 'partial',
  },
  {
    source: 'intuitionistic',
    target: 'S4',
    translate: (f) => godelTranslation(glivenkoTranslation(f)),
    validity: 'preserved',
  },
];

// ── Grafo de rutas de traducción ────────────────────────────

/** Retorna los vecinos directos de un perfil en el grafo de traducciones. */
function neighbours(from: Profile): Profile[] {
  return TRANSLATIONS.filter((t) => t.source === from).map((t) => t.target);
}

/**
 * Encuentra la ruta más corta desde `from` hasta `to` en el grafo
 * de traducciones disponibles (BFS).
 *
 * Devuelve la secuencia de perfiles [from, ..., to] o null si no hay ruta.
 */
export function findTranslationPath(from: Profile, to: Profile): Profile[] | null {
  if (from === to) return [from];

  const visited = new Set<Profile>([from]);
  const queue: Profile[][] = [[from]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    for (const next of neighbours(current)) {
      if (next === to) return [...path, next];
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }

  return null;
}

/**
 * Traduce una fórmula genérica al perfil `target` siguiendo el camino
 * de traducciones más corto disponible.
 *
 * Devuelve null si no existe ruta desde `formula.profile` hasta `target`.
 */
export function translateFormula(formula: GenericFormula, target: Profile): GenericFormula | null {
  const path = findTranslationPath(formula.profile, target);
  if (!path) return null;

  let current: GenericFormula = formula;

  for (let i = 0; i < path.length - 1; i++) {
    const src = path[i];
    const dst = path[i + 1];
    const translation = TRANSLATIONS.find((t) => t.source === src && t.target === dst);
    if (!translation) return null;
    current = {
      profile: dst,
      ast: translation.translate(current.ast),
    };
  }

  return current;
}
