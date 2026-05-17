// ============================================================
// CSP Hoare — Trazas, failures, deadlock, livelock, refinement
// ============================================================
// Sobre la LTS definida en `semantics.ts` calculamos las semánticas
// observacionales clásicas de CSP:
//
//   • traces(P)   — conjunto de prefijos de eventos visibles posibles.
//   • failures(P) — pares (traza, refusal). El conjunto de refusal es el
//                   conjunto de eventos que el proceso PUEDE rehusar tras
//                   esa traza, bajo ALGUNA resolución del no-determinismo.
//
// Refinement (notación CSP estándar):
//
//   P ⊑_T Q   ⇔   traces(Q) ⊆ traces(P)
//   P ⊑_F Q   ⇔   traces(Q) ⊆ traces(P) ∧ failures(Q) ⊆ failures(P)
//
// Intuición: Q refina a P sii Q es "más predecible" / "más determinista".
// STOP es el refinement máximo: refina todo lo que tenga traza vacía.
// ============================================================

import type { Event, FailurePair, Process, Trace } from './types';
import { internalResolutions, nextEvents, step } from './semantics';

// ── Trazas ──────────────────────────────────────────────────

/**
 * Enumera todas las trazas de `p` hasta longitud `maxLength` (inclusive).
 * Incluye la traza vacía (siempre presente) y los prefijos intermedios.
 *
 * Las trazas se devuelven sin duplicados, ordenadas por longitud
 * ascendente, y como copias de arrays inmutables (las modificaciones no
 * afectan el motor).
 */
export function traces(p: Process, maxLength = 6): Trace[] {
  const seen = new Set<string>();
  const out: Trace[] = [];

  const visit = (q: Process, prefix: Trace): void => {
    const key = prefix.join('');
    if (seen.has(key)) return;
    seen.add(key);
    out.push([...prefix]);
    if (prefix.length >= maxLength) return;

    // Para enumerar trazas hay que considerar TODAS las resoluciones
    // internas: cada rama puede ofrecer eventos distintos.
    const resolutions = internalResolutions(q);
    for (const r of resolutions) {
      const initials = nextEvents(r);
      for (const e of initials) {
        const next = step(r, e);
        if (next !== null) {
          visit(next, [...prefix, e]);
        }
      }
    }
  };

  visit(p, []);
  // Orden estable: por longitud, luego lex.
  out.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    for (let i = 0; i < a.length; i++) {
      const av = a[i] ?? '';
      const bv = b[i] ?? '';
      if (av !== bv) return av < bv ? -1 : 1;
    }
    return 0;
  });
  return out;
}

// ── Failures ────────────────────────────────────────────────

/**
 * Para una RESOLUCIÓN interna estable `q`, el conjunto de refusal máximo
 * sobre un alfabeto candidato `Σ` es: todo evento de `Σ` que `q` no
 * ofrezca como inicial. (Definición estándar: R es refusal sii q no
 * tiene transición para ningún a ∈ R.)
 *
 * `candidates` debe ser el conjunto de eventos relevantes (alfabeto de
 * comparación) — típicamente la unión sintáctica de los alfabetos de los
 * procesos involucrados en un test de refinement.
 */
function refusalsOf(q: Process, candidates: Set<Event>): Set<Event> {
  const offered = nextEvents(q);
  const r = new Set<Event>();
  for (const e of candidates) {
    if (!offered.has(e)) r.add(e);
  }
  return r;
}

/**
 * Calcula failures hasta `maxLength`. Para cada traza alcanzable, registra
 * los refusal sets posibles iterando todas las resoluciones internas del
 * estado tras la traza.
 *
 * Devuelve una lista (no un set) porque los refusal sets son objetos —
 * agrupamos por igualdad estructural y deduplicamos manualmente.
 */
export function failures(p: Process, maxLength = 4): FailurePair[] {
  const alphaPrime = collectVisibleEvents(p);
  const reachable: { state: Process; trace: Trace }[] = [];
  const seenStates = new Set<string>();

  const enqueue = (state: Process, trace: Trace): void => {
    const key = trace.join('');
    if (seenStates.has(key)) return;
    seenStates.add(key);
    reachable.push({ state, trace });
    if (trace.length >= maxLength) return;
    const resolutions = internalResolutions(state);
    for (const r of resolutions) {
      const initials = nextEvents(r);
      for (const e of initials) {
        const next = step(r, e);
        if (next !== null) enqueue(next, [...trace, e]);
      }
    }
  };
  enqueue(p, []);

  const out: FailurePair[] = [];
  const seenPairs = new Set<string>();

  for (const { state, trace } of reachable) {
    const resolutions = internalResolutions(state);
    for (const r of resolutions) {
      const ref = refusalsOf(r, alphaPrime);
      const k = trace.join('') + '|' + [...ref].sort().join(',');
      if (seenPairs.has(k)) continue;
      seenPairs.add(k);
      out.push({ trace: [...trace], refusal: ref });
    }
  }
  return out;
}

/** Alfabeto visible relevante (incluye tick si aparece). */
function collectVisibleEvents(p: Process): Set<Event> {
  // Reaprovechamos `traces` superficialmente: alcanzamos hasta profundidad
  // moderada para acumular eventos efectivamente observables.
  const out = new Set<Event>();
  const visit = (q: Process, depth: number): void => {
    if (depth > 8) return;
    for (const r of internalResolutions(q)) {
      const initials = nextEvents(r);
      for (const e of initials) {
        out.add(e);
        const next = step(r, e);
        if (next !== null) visit(next, depth + 1);
      }
    }
  };
  visit(p, 0);
  return out;
}

// ── Deadlock / livelock ─────────────────────────────────────

/**
 * Hay deadlock si el proceso no ofrece NINGÚN evento (ni siquiera ✓) en
 * ALGUNA resolución interna alcanzable desde el estado inicial.
 *
 * En `STOP` el chequeo es trivial: `nextEvents(STOP) = ∅`.
 */
export function isDeadlocked(p: Process): boolean {
  for (const r of internalResolutions(p)) {
    if (nextEvents(r).size === 0) return true;
  }
  return false;
}

/**
 * Detección heurística de livelock: el proceso recorre eventos ocultos
 * (τ) indefinidamente sin avanzar visiblemente. Implementación: chequea
 * si la profundidad de despliegues internos excede `depth` sin ofrecer
 * eventos visibles.
 *
 * No es decisión: usamos límite acotado. Útil para advertir sobre `μX.X`
 * o `(a → STOP) \ {a}` con loop.
 */
export function isLiveLocked(p: Process, depth = 32): boolean {
  // Estrategia: si tras `depth` resoluciones internas seguidas no hay
  // eventos visibles (cardinality 0) pero la recursión sigue siendo
  // "productiva" internamente, lo consideramos livelock probable.
  const initials = nextEvents(p);
  if (initials.size > 0) return false;
  // Sin eventos: distinguir deadlock estructural (STOP) vs livelock real
  // requiere examinar el cuerpo de la recursión.
  return isLiveLockedRec(p, depth);
}

function isLiveLockedRec(p: Process, depth: number): boolean {
  if (depth <= 0) return true;
  // Si hay recursión que se autoincorpora sin guarda visible, divergir.
  if (p.kind === 'recursion') {
    // Cuerpo sin prefix ni skip → diverge.
    if (!hasVisibleGuard(p.body, p.name)) return true;
    return false;
  }
  if (p.kind === 'hide') {
    // Si todos los eventos iniciales son ocultos, podemos estar en un loop τ.
    const hidden = new Set(p.events);
    const inner = nextEvents(p.process);
    if (inner.size === 0) return false;
    let allHidden = true;
    for (const e of inner) {
      if (!hidden.has(e)) {
        allHidden = false;
        break;
      }
    }
    return allHidden;
  }
  return false;
}

function hasVisibleGuard(body: Process, recName: string): boolean {
  switch (body.kind) {
    case 'prefix':
      return true; // hay un evento visible antes de recurrir.
    case 'skip':
      return true; // SKIP da ✓ (visible).
    case 'choice':
    case 'internal':
    case 'parallel':
    case 'interleave':
    case 'sequence':
      return hasVisibleGuard(body.left, recName) || hasVisibleGuard(body.right, recName);
    case 'hide':
    case 'rename':
      return hasVisibleGuard(body.process, recName);
    case 'recursion':
      return hasVisibleGuard(body.body, recName);
    case 'var':
      return body.name !== recName; // si referencia otra var, asumimos guardada.
    case 'stop':
      return true; // STOP no es guarda pero tampoco divergente.
  }
}

// ── Refinement ──────────────────────────────────────────────

/**
 * P ⊑_T Q : Q refina a P en trazas sii cada traza de Q es traza de P.
 * Equivalentemente: Q no puede hacer nada que P no pudiera observar.
 */
export function refinesTraces(spec: Process, impl: Process, maxLength = 6): boolean {
  const specTraces = encodeSet(traces(spec, maxLength));
  const implTraces = traces(impl, maxLength);
  for (const t of implTraces) {
    if (!specTraces.has(encodeTrace(t))) return false;
  }
  return true;
}

/**
 * P ⊑_F Q : refinamiento en failures. Q refina a P sii:
 *   (a) traces(Q) ⊆ traces(P)
 *   (b) failures(Q) ⊆ failures(P)
 *
 * Una falla `(t, R)` de Q debe poder ser exhibida también por P. Esto
 * capta el principio de que Q es "menos no-determinista" que P.
 */
export function refinesFailures(spec: Process, impl: Process, maxLength = 4): boolean {
  if (!refinesTraces(spec, impl, maxLength)) return false;
  const specF = failures(spec, maxLength);
  const implF = failures(impl, maxLength);

  // Para cada failure de impl, debe existir un failure de spec con la
  // misma traza y un refusal ⊇ del de impl. (Refusal sets son cerrados
  // por subconjunto en CSP: si P rehúsa R, también rehúsa todo R' ⊆ R.)
  const specByTrace = new Map<string, Set<Event>[]>();
  for (const f of specF) {
    const k = encodeTrace(f.trace);
    const arr = specByTrace.get(k) ?? [];
    arr.push(f.refusal);
    specByTrace.set(k, arr);
  }

  for (const f of implF) {
    const k = encodeTrace(f.trace);
    const candidates = specByTrace.get(k);
    if (!candidates) return false;
    let matched = false;
    for (const r of candidates) {
      if (subsetEq(f.refusal, r)) {
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }
  return true;
}

function encodeTrace(t: Trace): string {
  return t.join('');
}

function encodeSet(ts: Trace[]): Set<string> {
  const out = new Set<string>();
  for (const t of ts) out.add(encodeTrace(t));
  return out;
}

function subsetEq(a: Set<Event>, b: Set<Event>): boolean {
  for (const e of a) if (!b.has(e)) return false;
  return true;
}
