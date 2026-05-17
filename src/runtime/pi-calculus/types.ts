// ============================================================
// π-calculus — tipos del álgebra de procesos de Milner.
// ============================================================
// Sintaxis (subset estándar monádico):
//   0                      proceso nulo (nil)
//   c(x).P                 input: recibe valor por canal c, lo liga a x, sigue P
//   c̄⟨v⟩.P                output: envía v por canal c, sigue P
//   P | Q                  composición paralela
//   (ν c) P                restricción / canal nuevo (scope local)
//   !P                     replicación (infinitas copias en paralelo)
//   P + Q                  suma / choice no-determinista
//   [x = y].P              match: continúa solo si x ≡ y
//
// Convenciones de nombres:
//   - Los "names" son strings; un canal y un valor pueden coincidir
//     sintácticamente (uniformidad de nombres es la firma del π-calculus).
//   - Las ligaduras (input y new) pueden requerir α-conversión durante
//     la sustitución para evitar capturas.
// ============================================================

/**
 * Proceso del π-calculus. Es un AST con etiquetas discriminadas para
 * facilitar pattern matching exhaustivo en TypeScript.
 */
export type PiProcess =
  | { kind: 'nil' }
  | { kind: 'input'; channel: string; bind: string; cont: PiProcess }
  | { kind: 'output'; channel: string; value: string; cont: PiProcess }
  | { kind: 'parallel'; left: PiProcess; right: PiProcess }
  | { kind: 'new'; channel: string; body: PiProcess }
  | { kind: 'replication'; body: PiProcess }
  | { kind: 'choice'; left: PiProcess; right: PiProcess }
  | { kind: 'match'; left: string; right: string; cont: PiProcess };
