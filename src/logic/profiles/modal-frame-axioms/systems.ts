// ============================================================
// Sistemas modales nombrados — composición de axiomas
// ============================================================
//
// Mapa de etiquetas estándar a sus axiomas. Los sistemas se
// caracterizan por la relación de accesibilidad del frame:
//
//   K     ∅                  — sin restricción
//   T     reflexiva          — {T}
//   D     serial             — {D}
//   KB    simétrica          — {B}
//   K4    transitiva         — {4}
//   K5    euclidiana         — {5}
//   B     refl + sim         — {T, B}    (a veces "KTB")
//   S4    refl + trans       — {T, 4}
//   S5    equivalencia       — {T, 4, 5} (≡ {T, B, 4})
//   KD45  ser + trans + eucl — {D, 4, 5} (lógica doxástica)

import { not, box, diamond, implies } from './formula';
import { tableauWithAxioms } from './tableau';
import { FrameAxiom, ModalFormula, ModalSystem } from './types';

/**
 * Devuelve los axiomas que caracterizan al sistema nombrado.
 *
 * Para sistemas no listados (e.g. "K45", "KTB5") usar directamente
 * {@link tableauWithAxioms} con la combinación deseada.
 */
export function systemAxioms(system: ModalSystem): FrameAxiom[] {
  switch (system) {
    case 'K':
      return [];
    case 'T':
      return ['T'];
    case 'D':
      return ['D'];
    case 'KB':
      return ['B'];
    case 'K4':
      return ['4'];
    case 'K5':
      return ['5'];
    case 'B':
      return ['T', 'B'];
    case 'S4':
      return ['T', '4'];
    case 'S5':
      return ['T', '4', '5'];
    case 'KD45':
      return ['D', '4', '5'];
  }
}

/**
 * ¿`phi` es satisfacible en el sistema `system`?
 *
 * Equivale a: ¿existe un modelo Kripke cuyo frame cumple los
 * axiomas y cuya raíz fuerza `phi`?
 */
export function isSatisfiable(phi: ModalFormula, system: ModalSystem): boolean {
  return tableauWithAxioms(phi, systemAxioms(system)).sat;
}

/**
 * ¿`phi` es válida en el sistema `system`?
 *
 * Equivale a: ¬(¬phi satisfacible) — si el tableau de ¬φ cierra
 * en todas las ramas, φ es teorema del sistema.
 */
export function isValid(phi: ModalFormula, system: ModalSystem): boolean {
  return !isSatisfiable(not(phi), system);
}

// ------------------------------------------------------------
// Helpers: axiomas como fórmulas (útil para tests)
// ------------------------------------------------------------

/**
 * Esquema del axioma como fórmula concreta sobre un átomo dado.
 * Útil para verificar que cada axioma es válido en su sistema
 * mínimo.
 */
export function axiomFormula(axiom: FrameAxiom, p: ModalFormula): ModalFormula {
  switch (axiom) {
    case 'T':
      return implies(box(p), p);
    case 'B':
      return implies(p, box(diamond(p)));
    case '4':
      return implies(box(p), box(box(p)));
    case '5':
      return implies(diamond(p), box(diamond(p)));
    case 'D':
      return implies(box(p), diamond(p));
  }
}
