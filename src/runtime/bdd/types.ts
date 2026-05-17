// ============================================================
// ROBDD — Tipos de nodos
// ============================================================
//
// Un ROBDD (Reduced Ordered Binary Decision Diagram) representa
// una función booleana como un DAG canónico bajo un orden fijo de
// variables. Cada nodo interno tiene:
//   - una variable `variable` (índice según el orden global)
//   - un sucesor `low` para la asignación variable = 0
//   - un sucesor `high` para la asignación variable = 1
//
// Las hojas son terminales `true` o `false`. La canonicidad se
// obtiene compartiendo nodos vía unique table y aplicando las
// reglas de reducción:
//   (R1) eliminación: si low === high, no se crea nodo interno
//   (R2) isomorfismo: dos nodos con el mismo (var, low, high)
//        comparten identidad estructural

export type BDDNode =
  | { kind: 'terminal'; value: boolean }
  | { kind: 'internal'; variable: number; low: BDDNode; high: BDDNode; id: number };

export interface BDDStats {
  nodes: number;
  reductions: number;
}

export function isTerminal(b: BDDNode): b is { kind: 'terminal'; value: boolean } {
  return b.kind === 'terminal';
}

export function nodeId(b: BDDNode): string {
  return b.kind === 'terminal' ? (b.value ? 'T' : 'F') : `N${b.id}`;
}
