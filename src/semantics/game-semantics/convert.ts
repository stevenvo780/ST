// ============================================================
// Conversión IPCFormula ↔ IntuitFormula
// ============================================================
//
// Reutilizamos el prover NJ existente (`profiles/intuitionistic-nj`)
// como oráculo de validez para certificar "existe estrategia
// ganadora". Por el teorema de Lorenzen-Felscher: P tiene
// estrategia ganadora en el juego dialógico sobre φ sii φ es
// demostrable en NJ (equivalentemente, válida en IPC).

import type { IntuitFormula } from '../../logic/profiles/intuitionistic-nj';
import {
  atom as njAtom,
  bottom as njBottom,
  and as njAnd,
  or as njOr,
  implies as njImplies,
} from '../../logic/profiles/intuitionistic-nj';
import { IPCFormula } from './types';

export function toIntuit(f: IPCFormula): IntuitFormula {
  switch (f.kind) {
    case 'atom':
      return njAtom(f.name);
    case 'bottom':
      return njBottom();
    case 'and':
      return njAnd(toIntuit(f.left), toIntuit(f.right));
    case 'or':
      return njOr(toIntuit(f.left), toIntuit(f.right));
    case 'implies':
      return njImplies(toIntuit(f.left), toIntuit(f.right));
  }
}
