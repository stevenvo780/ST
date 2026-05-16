// ============================================================
// ST Hyperreal — Lógica probabilística con infinitesimales
// ============================================================
// Modela valores como números hiperreales de primer orden:
//
//   x = standard + infinitesimal · ε
//
// donde ε es un infinitesimal formal con ε² ≈ 0. Esto permite:
//   • distinguir 1 y 1 + ε (probabilidad "casi 1" pero no exacta).
//   • razonar sobre diferencias infinitamente pequeñas sin colapsar
//     al límite estándar.
//   • propagar incertidumbre con cotas inferior/superior conservadoras
//     bajo operadores booleanos probabilísticos.
//
// Aritmética (sólo primer orden en ε; los términos ε² se descartan):
//   (a_s + a_i ε) + (b_s + b_i ε) = (a_s + b_s) + (a_i + b_i) ε
//   (a_s + a_i ε) - (b_s + b_i ε) = (a_s - b_s) + (a_i - b_i) ε
//   (a_s + a_i ε) · (b_s + b_i ε) = a_s b_s + (a_s b_i + a_i b_s) ε
//                                    [+ a_i b_i ε² → 0]
//
// Orden total (lexicográfico standard primero, después infinitesimal):
//   a < b  ⇔  a_s < b_s  ∨  (a_s = b_s ∧ a_i < b_i)
//
// Lógica probabilística hiperreal:
//   p ∧ q = p · q
//   p ∨ q = p + q − p·q       (inclusión-exclusión)
//   ¬p     = 1 − p
//   p → q = ¬p ∨ q = 1 − p + p·q
//
// Propagación de cotas [lower, upper]:
//   AND y OR son monótonas crecientes en ambas variables.
//   NOT invierte y refleja la cota.
//   IMPLIES es decreciente en p y creciente en q ⇒ la cota inferior
//   sale del lado conservador (upper_p, lower_q) y viceversa.
// ============================================================

export interface Hyperreal {
  readonly standard: number;
  readonly infinitesimal: number;
}

export function hr(standard: number, infinitesimal: number = 0): Hyperreal {
  return { standard, infinitesimal };
}

export const HR_ZERO: Hyperreal = { standard: 0, infinitesimal: 0 };
export const HR_ONE: Hyperreal = { standard: 1, infinitesimal: 0 };
export const HR_EPSILON: Hyperreal = { standard: 0, infinitesimal: 1 };

// ── Aritmética ──────────────────────────────────────────────

export function add(a: Hyperreal, b: Hyperreal): Hyperreal {
  return {
    standard: a.standard + b.standard,
    infinitesimal: a.infinitesimal + b.infinitesimal,
  };
}

export function sub(a: Hyperreal, b: Hyperreal): Hyperreal {
  return {
    standard: a.standard - b.standard,
    infinitesimal: a.infinitesimal - b.infinitesimal,
  };
}

export function mul(a: Hyperreal, b: Hyperreal): Hyperreal {
  // (a.s + a.i ε)(b.s + b.i ε) = a.s·b.s + (a.s·b.i + a.i·b.s)·ε + O(ε²)
  return {
    standard: a.standard * b.standard,
    infinitesimal: a.standard * b.infinitesimal + a.infinitesimal * b.standard,
  };
}

/**
 * Compara dos hiperreales lexicográficamente: primero la parte estándar,
 * luego la infinitesimal. Devuelve -1, 0 o 1.
 *
 * Usa una tolerancia ínfima sobre las componentes para absorber el ruido
 * de coma flotante; los infinitesimales formales no se ven afectados
 * porque su magnitud es de orden O(1) en el coeficiente.
 */
export function compare(a: Hyperreal, b: Hyperreal): -1 | 0 | 1 {
  const EPS = 1e-12;
  const ds = a.standard - b.standard;
  if (ds > EPS) return 1;
  if (ds < -EPS) return -1;
  const di = a.infinitesimal - b.infinitesimal;
  if (di > EPS) return 1;
  if (di < -EPS) return -1;
  return 0;
}

export function eq(a: Hyperreal, b: Hyperreal): boolean {
  return compare(a, b) === 0;
}

export function lt(a: Hyperreal, b: Hyperreal): boolean {
  return compare(a, b) < 0;
}

export function gt(a: Hyperreal, b: Hyperreal): boolean {
  return compare(a, b) > 0;
}

// ── Lógica probabilística hiperreal ─────────────────────────

export function hrAnd(p: Hyperreal, q: Hyperreal): Hyperreal {
  return mul(p, q);
}

export function hrOr(p: Hyperreal, q: Hyperreal): Hyperreal {
  return sub(add(p, q), mul(p, q));
}

export function hrNot(p: Hyperreal): Hyperreal {
  return sub(HR_ONE, p);
}

export function hrImplies(p: Hyperreal, q: Hyperreal): Hyperreal {
  // p → q ≡ ¬p ∨ q
  return hrOr(hrNot(p), q);
}

// ── Propagación de incertidumbre ────────────────────────────

export interface UncertaintyBound {
  readonly lower: Hyperreal;
  readonly upper: Hyperreal;
}

export function bound(lower: Hyperreal, upper: Hyperreal): UncertaintyBound {
  if (compare(lower, upper) > 0) {
    throw new Error(
      `UncertaintyBound inválido: lower (${lower.standard}+${lower.infinitesimal}ε) > upper (${upper.standard}+${upper.infinitesimal}ε)`,
    );
  }
  return { lower, upper };
}

/**
 * Propaga una operación lógica sobre cotas de incertidumbre.
 *
 * - `and`/`or` requieren `other`; ambas operaciones son monótonas en
 *   sus dos argumentos, por lo que la cota se obtiene aplicando la
 *   operación a (lower, lower) y (upper, upper) respectivamente.
 * - `not` invierte la cota: ¬[a, b] = [1 − b, 1 − a].
 * - `implies` requiere `other`. p → q es decreciente en p y creciente
 *   en q ⇒ lower = (upper_p → lower_q), upper = (lower_p → upper_q).
 */
export function propagate(
  b: UncertaintyBound,
  op: 'and' | 'or' | 'not' | 'implies',
  other?: UncertaintyBound,
): UncertaintyBound {
  switch (op) {
    case 'and': {
      if (!other) throw new Error("propagate('and') requiere el segundo operando");
      return {
        lower: hrAnd(b.lower, other.lower),
        upper: hrAnd(b.upper, other.upper),
      };
    }
    case 'or': {
      if (!other) throw new Error("propagate('or') requiere el segundo operando");
      return {
        lower: hrOr(b.lower, other.lower),
        upper: hrOr(b.upper, other.upper),
      };
    }
    case 'not': {
      return {
        lower: hrNot(b.upper),
        upper: hrNot(b.lower),
      };
    }
    case 'implies': {
      if (!other) throw new Error("propagate('implies') requiere el segundo operando");
      return {
        lower: hrImplies(b.upper, other.lower),
        upper: hrImplies(b.lower, other.upper),
      };
    }
  }
}

// ── Utilidades de depuración ────────────────────────────────

export function hrToString(x: Hyperreal): string {
  if (x.infinitesimal === 0) return `${x.standard}`;
  const sign = x.infinitesimal >= 0 ? '+' : '-';
  const mag = Math.abs(x.infinitesimal);
  return `${x.standard} ${sign} ${mag}ε`;
}
