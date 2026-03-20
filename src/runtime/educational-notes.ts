/**
 * Pool de notas pedagógicas contextuales para enriquecer los resultados del motor.
 * Cada operación/resultado tiene varias notas posibles; se elige una al azar.
 */

type NotePool = readonly string[];

// ── Helpers ──────────────────────────────────────────────────

function pick(pool: NotePool): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Pools por operación ─────────────────────────────────────

const SATISFIABLE_YES: NotePool = [
  'Una fórmula satisfacible tiene al menos una valuación que la hace verdadera. No necesariamente es una tautología.',
  'Satisfacibilidad ≠ validez. Que exista un modelo que la haga verdadera no garantiza que siempre lo sea.',
  'El problema de satisfacibilidad (SAT) es NP-completo (Cook-Levin, 1971). Para fórmulas pequeñas se evalúa por fuerza bruta.',
  'Una fórmula satisfacible es consistente: puede formar parte de una teoría sin contradicción.',
  'Satisfacible significa que existe al menos una interpretación donde la fórmula es verdadera.',
];

const SATISFIABLE_NO: NotePool = [
  'Una fórmula insatisfacible (contradicción) es falsa bajo toda valuación. Su negación es una tautología.',
  'Si φ es insatisfacible, entonces ¬φ es válida. Este es el principio de dualidad entre satisfacibilidad y validez.',
  'Las contradicciones son útiles en lógica: si un conjunto de premisas es insatisfacible, las premisas son inconsistentes entre sí.',
  'Toda contradicción implica cualquier cosa (ex falso quodlibet). Por eso detectar insatisfacibilidad es crucial.',
];

const VALID_YES: NotePool = [
  'Una tautología es verdadera bajo toda valuación posible. Es una verdad lógica, independiente del contenido.',
  'Las tautologías son los teoremas de la lógica proposicional: demostrables sin premisas.',
  'Ejemplos clásicos de tautologías: P ∨ ¬P (tercero excluido), P → P (reflexividad), ¬(P ∧ ¬P) (no contradicción).',
  'Una fórmula válida es necesariamente verdadera en el sentido lógico: ninguna interpretación la falsifica.',
  'Validez y satisfacibilidad son duales: φ es válida ⟺ ¬φ es insatisfacible.',
];

const VALID_NO: NotePool = [
  'Una fórmula no válida tiene al menos un contramodelo: una valuación que la hace falsa.',
  'Que una fórmula no sea una tautología no significa que sea falsa — puede ser satisfacible (verdadera en algunos casos).',
  'El contramodelo muestra exactamente qué asignación de verdad falsifica la fórmula.',
  'En lógica clásica, si una fórmula no es válida, existe al menos una fila de su tabla de verdad con resultado F.',
];

const EQUIVALENT_YES: NotePool = [
  'Dos fórmulas son lógicamente equivalentes cuando tienen el mismo valor de verdad en toda valuación posible.',
  'Equivalencia lógica: φ ≡ ψ significa que φ ↔ ψ es una tautología. Son intercambiables salva veritate.',
  'Las equivalencias permiten simplificar fórmulas: reemplazar una sub-expresión por otra equivalente preserva el significado.',
  'Leyes de De Morgan, doble negación, distribución — son todas equivalencias lógicas fundamentales.',
];

const EQUIVALENT_NO: NotePool = [
  'Las fórmulas no son equivalentes: existe al menos una valuación donde difieren en valor de verdad.',
  'Que dos fórmulas no sean equivalentes no significa que sean contradictorias — pueden coincidir en muchos casos pero no en todos.',
  'El contramodelo muestra una asignación donde una es verdadera y la otra falsa (o viceversa).',
];

const DERIVE_OK: NotePool = [
  'Derivación completada mediante reglas de inferencia. Cada paso está justificado formalmente.',
  'En lógica proposicional clásica, si una conclusión se sigue semánticamente (⊨), también se puede derivar sintácticamente (⊢). Esto es el teorema de completitud.',
  'La derivación formal muestra el camino paso a paso desde las premisas hasta la conclusión.',
  'Consecuencia lógica: la conclusión no puede ser falsa si todas las premisas son verdaderas.',
  'Las reglas de inferencia (Modus Ponens, Modus Tollens, Silogismo Hipotético, etc.) preservan la verdad de las premisas a la conclusión.',
];

const DERIVE_FAIL: NotePool = [
  'No se encontró derivación. Esto puede significar que la conclusión no se sigue de las premisas, o que se necesitan más pasos de los permitidos.',
  'Si no hay derivación, considere agregar premisas adicionales o verificar que el argumento sea realmente válido.',
  'Un argumento inválido tiene al menos un caso donde las premisas son verdaderas y la conclusión falsa.',
];

const PROVE_OK: NotePool = [
  'Demostrado desde la teoría: la fórmula se sigue lógicamente de los axiomas definidos.',
  'Un teorema es una fórmula demostrable a partir de los axiomas de una teoría usando reglas de inferencia.',
  'La demostración certifica que la fórmula es una consecuencia lógica de la teoría.',
];

const PROVE_FAIL: NotePool = [
  'No se pudo demostrar desde la teoría dada. La fórmula puede ser independiente de los axiomas.',
  'Una fórmula no demostrable puede ser: (a) falsa en la teoría, o (b) independiente (ni demostrable ni refutable).',
  'Considere revisar los axiomas de la teoría o agregar nuevos para cubrir este caso.',
];

const COUNTERMODEL_FOUND: NotePool = [
  'Se encontró un contramodelo: una valuación que hace la fórmula falsa. Esto demuestra que no es una tautología.',
  'El contramodelo es la evidencia constructiva de que la fórmula puede ser falsa.',
  'En lógica clásica, un solo contramodelo basta para refutar la validez universal de una fórmula.',
];

const COUNTERMODEL_NONE: NotePool = [
  'No existe contramodelo: la fórmula es verdadera bajo toda valuación. Es una tautología.',
  'Si no hay contramodelo, la fórmula es válida — una verdad lógica.',
  'La ausencia de contramodelo equivale a la validez: no hay forma de hacer la fórmula falsa.',
];

// ── API pública ─────────────────────────────────────────────

export type NoteContext =
  | { op: 'satisfiable'; sat: boolean }
  | { op: 'valid'; valid: boolean }
  | { op: 'equivalent'; equiv: boolean }
  | { op: 'derive'; ok: boolean; steps?: number; rules?: string[] }
  | { op: 'prove'; ok: boolean }
  | { op: 'countermodel'; found: boolean };

export function pickEducationalNote(ctx: NoteContext): string {
  switch (ctx.op) {
    case 'satisfiable':
      return pick(ctx.sat ? SATISFIABLE_YES : SATISFIABLE_NO);
    case 'valid':
      return pick(ctx.valid ? VALID_YES : VALID_NO);
    case 'equivalent':
      return pick(ctx.equiv ? EQUIVALENT_YES : EQUIVALENT_NO);
    case 'derive':
      if (!ctx.ok) return pick(DERIVE_FAIL);
      return pick(DERIVE_OK);
    case 'prove':
      return pick(ctx.ok ? PROVE_OK : PROVE_FAIL);
    case 'countermodel':
      return pick(ctx.found ? COUNTERMODEL_FOUND : COUNTERMODEL_NONE);
  }
}
