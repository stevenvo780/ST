// ============================================================
// CSP Hoare — Tipos del cálculo de procesos secuenciales comunicantes
// ============================================================
// Comunicating Sequential Processes (Hoare 1978/1985): procesos que
// se sincronizan mediante eventos atómicos compartidos. Diferente del
// π-cálculo: los eventos NO transportan valores; lo que importa es la
// ocurrencia sincronizada del nombre.
//
// Operadores estándar:
//   STOP            — proceso muerto, no acepta nada.
//   SKIP            — termina exitosamente (evento ✓ implícito).
//   a → P           — prefijo: ejecuta el evento `a`, luego se comporta como P.
//   P □ Q           — elección externa: el entorno decide entre los primeros
//                     eventos ofrecidos por P y Q.
//   P ⊓ Q           — elección interna: el proceso decide; el entorno solo
//                     ve el resultado. Introduce no-determinismo.
//   P |[A]| Q       — paralelo sincronizado: los eventos en A deben darse en
//                     ambos lados simultáneamente; los demás se entrelazan.
//   P ||| Q         — entrelazado puro (paralelo con alfabeto vacío).
//   P ; Q           — composición secuencial: Q comienza cuando P termina (SKIP).
//   P \ A           — ocultación: los eventos en A se vuelven internos (τ).
//   P[f]            — renombrado funcional de eventos.
//   μ X . P         — recursión: el proceso se reescribe a sí mismo.
//   X               — variable de proceso (referencia a μ).
// ============================================================

export type Event = string;

export type Process =
  | { kind: 'stop' }
  | { kind: 'skip' }
  | { kind: 'prefix'; event: Event; cont: Process }
  | { kind: 'choice'; left: Process; right: Process }
  | { kind: 'internal'; left: Process; right: Process }
  | { kind: 'parallel'; left: Process; right: Process; alphabet: Event[] }
  | { kind: 'interleave'; left: Process; right: Process }
  | { kind: 'sequence'; left: Process; right: Process }
  | { kind: 'hide'; process: Process; events: Event[] }
  | { kind: 'rename'; process: Process; mapping: Map<Event, Event> }
  | { kind: 'recursion'; name: string; body: Process }
  | { kind: 'var'; name: string };

/** Una traza es una secuencia finita de eventos visibles observados. */
export type Trace = Event[];

/**
 * Failure (failures-semantics): la traza `trace` es observable y, tras ella,
 * el proceso PUEDE rehusar cualquier subconjunto de `refusal` (en alguna
 * resolución del no-determinismo interno).
 */
export interface FailurePair {
  trace: Trace;
  refusal: Set<Event>;
}

/** Evento especial que marca la terminación exitosa (✓ / "tick"). */
export const TICK: Event = '✓';
