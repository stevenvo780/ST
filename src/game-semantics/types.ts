// ============================================================
// Game semantics para IPC — Tipos
// ============================================================
//
// Juegos dialógicos al estilo Lorenzen (1958) / Felscher (1985):
// dos jugadores debaten una fórmula. El Proponente (P) la afirma;
// el Oponente (O) la ataca. Una fórmula es válida en IPC sii P
// tiene una estrategia ganadora bajo las reglas estructurales
// intuicionistas. (Lorenzen, Felscher: equivalencia con NJ.)
//
// ADT pública pedida por el spec (sin `not` explícito; `¬φ` se
// modela como `φ → ⊥`). La conversión a/desde otras
// representaciones de fórmulas vive en `convert.ts`.

export type IPCFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'and'; left: IPCFormula; right: IPCFormula }
  | { kind: 'or'; left: IPCFormula; right: IPCFormula }
  | { kind: 'implies'; left: IPCFormula; right: IPCFormula }
  | { kind: 'bottom' };

export type Player = 'proponent' | 'opponent';

/**
 * Movida del juego dialógico:
 *   - `choose-and`  → ataque a `∧`: O elige qué conjunto pedir.
 *   - `choose-or`   → defensa de `∨`: P elige qué disyunto afirmar.
 *   - `attack-implies` → ataque a `→`: O asume el antecedente y
 *     pide el consecuente.
 *   - `defend-bottom`  → "no se puede defender ⊥"; usada
 *     simbólicamente cuando P queda obligado a defender `⊥`.
 */
export type Move =
  | { kind: 'choose-and'; side: 'left' | 'right' }
  | { kind: 'choose-or'; side: 'left' | 'right' }
  | { kind: 'attack-implies' }
  | { kind: 'defend-bottom' };

/**
 * Estado del juego pedido por el spec. `current` es la fórmula
 * en juego ahora mismo; `context` son las aserciones del Oponente
 * disponibles para que P las use; `history` traza las movidas.
 */
export interface GameState {
  current: IPCFormula;
  context: IPCFormula[];
  history: Array<{ player: Player; move: string; formula?: IPCFormula }>;
}

// ---------- constructores ergonómicos ----------

export const ipcAtom = (name: string): IPCFormula => ({ kind: 'atom', name });
export const ipcBottom = (): IPCFormula => ({ kind: 'bottom' });
export const ipcAnd = (left: IPCFormula, right: IPCFormula): IPCFormula => ({
  kind: 'and',
  left,
  right,
});
export const ipcOr = (left: IPCFormula, right: IPCFormula): IPCFormula => ({
  kind: 'or',
  left,
  right,
});
export const ipcImplies = (left: IPCFormula, right: IPCFormula): IPCFormula => ({
  kind: 'implies',
  left,
  right,
});
/** Azúcar: `¬φ` = `φ → ⊥`. Útil para tests pedagógicos. */
export const ipcNot = (arg: IPCFormula): IPCFormula => ipcImplies(arg, ipcBottom());

// ---------- igualdad y clave ----------

export function ipcKey(f: IPCFormula): string {
  switch (f.kind) {
    case 'atom':
      return `A(${f.name})`;
    case 'bottom':
      return '⊥';
    case 'and':
      return `&(${ipcKey(f.left)},${ipcKey(f.right)})`;
    case 'or':
      return `|(${ipcKey(f.left)},${ipcKey(f.right)})`;
    case 'implies':
      return `>(${ipcKey(f.left)},${ipcKey(f.right)})`;
  }
}

export function ipcEquals(a: IPCFormula, b: IPCFormula): boolean {
  return ipcKey(a) === ipcKey(b);
}

export function ipcToString(f: IPCFormula): string {
  switch (f.kind) {
    case 'atom':
      return f.name;
    case 'bottom':
      return '⊥';
    case 'and':
      return `(${ipcToString(f.left)} ∧ ${ipcToString(f.right)})`;
    case 'or':
      return `(${ipcToString(f.left)} ∨ ${ipcToString(f.right)})`;
    case 'implies':
      return `(${ipcToString(f.left)} → ${ipcToString(f.right)})`;
  }
}
