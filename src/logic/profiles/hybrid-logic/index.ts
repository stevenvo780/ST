// ============================================================
// ST Hybrid Logic — API pública del fragmento H(@, ↓, ∃)
// ============================================================
// Hybrid logic = modal logic + nominales (i, j, k) + @-operator +
// ↓-binder + ∃-world quantifier. Permite hablar internamente de
// mundos identificables — útil para razonar sobre identidad de
// estados en sistemas Kripke (procesos, módulos epistémicos).
//
// Este módulo es independiente del ProfileRegistry textual (igual
// que description-logic): provee la semántica relacional y un
// decisor de satisfacibilidad por búsqueda finita acotada.
// ============================================================

export type { HybridFormula, HybridFormulaKind, HybridFrame } from './types';

export {
  atom,
  nominal,
  not,
  and,
  or,
  implies,
  box,
  diamond,
  at,
  down,
  existsWorld,
  formulaToString,
} from './types';

export { satisfies, isSatisfiableInFrame } from './semantics';

export { isSatisfiable } from './sat';
