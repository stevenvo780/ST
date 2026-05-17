// ============================================================
// π-calculus — semántica de reducción (operacional).
// ============================================================
// Reglas básicas (relación →):
//
//   COMM     c̄⟨v⟩.P | c(x).Q   →   P | Q[x := v]
//   PAR      P → P'   ⇒   P|Q → P'|Q
//   RES      P → P'   ⇒   (νc) P → (νc) P'
//   STRUCT   P ≡ P' → Q' ≡ Q   ⇒   P → Q     (congruencia estructural)
//   SUM      P → P'   ⇒   P + Q → P'         (elige rama y descarta otra)
//   REPL     !P → P | !P                      (unfold de replicación)
//   MATCH    [x = x].P  →  P                  (match exitoso)
//
// La función `reduce(p)` devuelve el conjunto de todos los procesos
// inmediatamente sucesores; un proceso sin sucesores está deadlocked.
// ============================================================

import type { PiProcess } from './types';
import { substitute } from './substitution';
import { freeNames, alphaRename, freshName } from './names';

// ------------------------------------------------------------
// Helpers — extraer prefijos input/output expuestos para sincronizar.
// ------------------------------------------------------------

interface InputPrefix {
  channel: string;
  bind: string;
  cont: PiProcess;
  /** función que reconstruye el proceso original sustituyendo el prefijo */
  rebuild: (replacement: PiProcess) => PiProcess;
}

interface OutputPrefix {
  channel: string;
  value: string;
  cont: PiProcess;
  rebuild: (replacement: PiProcess) => PiProcess;
}

/**
 * Recolecta todos los prefijos input expuestos al "top level" del
 * proceso (es decir, no anidados bajo otro prefijo o binder cerrado).
 * Atraviesa parallel, choice, replication (haciendo unfold virtual) y
 * new (transparentemente, registrando el contexto).
 *
 * Cada prefijo recolectado lleva una función `rebuild` que dado un
 * proceso reemplazo (lo que queda tras consumir el prefijo) reconstruye
 * el proceso global con esa parte cambiada.
 */
function collectInputs(
  p: PiProcess,
  rebuild: (q: PiProcess) => PiProcess,
  out: InputPrefix[],
): void {
  switch (p.kind) {
    case 'input':
      out.push({
        channel: p.channel,
        bind: p.bind,
        cont: p.cont,
        rebuild,
      });
      break;
    case 'parallel':
      collectInputs(p.left, (q) => rebuild({ kind: 'parallel', left: q, right: p.right }), out);
      collectInputs(p.right, (q) => rebuild({ kind: 'parallel', left: p.left, right: q }), out);
      break;
    case 'choice':
      // En un choice, consumir un prefijo descarta la otra rama.
      collectInputs(p.left, (q) => rebuild(q), out);
      collectInputs(p.right, (q) => rebuild(q), out);
      break;
    case 'replication':
      // Unfold: !P ≡ P | !P. Tomamos una copia y dejamos la replicación intacta.
      collectInputs(
        p.body,
        (q) => rebuild({ kind: 'parallel', left: q, right: { kind: 'replication', body: p.body } }),
        out,
      );
      break;
    case 'match':
      if (p.left === p.right) {
        // [x=x].P se evalúa a P; entonces los prefijos visibles son los de P.
        collectInputs(p.cont, rebuild, out);
      }
      break;
    case 'new':
    case 'nil':
    case 'output':
      // new se trata fuera de este recolector (afecta el contexto de scope).
      // output y nil no exponen inputs en el top level.
      break;
  }
}

function collectOutputs(
  p: PiProcess,
  rebuild: (q: PiProcess) => PiProcess,
  out: OutputPrefix[],
): void {
  switch (p.kind) {
    case 'output':
      out.push({
        channel: p.channel,
        value: p.value,
        cont: p.cont,
        rebuild,
      });
      break;
    case 'parallel':
      collectOutputs(p.left, (q) => rebuild({ kind: 'parallel', left: q, right: p.right }), out);
      collectOutputs(p.right, (q) => rebuild({ kind: 'parallel', left: p.left, right: q }), out);
      break;
    case 'choice':
      collectOutputs(p.left, (q) => rebuild(q), out);
      collectOutputs(p.right, (q) => rebuild(q), out);
      break;
    case 'replication':
      collectOutputs(
        p.body,
        (q) => rebuild({ kind: 'parallel', left: q, right: { kind: 'replication', body: p.body } }),
        out,
      );
      break;
    case 'match':
      if (p.left === p.right) {
        collectOutputs(p.cont, rebuild, out);
      }
      break;
    case 'new':
    case 'nil':
    case 'input':
      break;
  }
}

// ------------------------------------------------------------
// reduce — devuelve los procesos sucesores posibles (un paso →).
// ------------------------------------------------------------

/**
 * Devuelve todos los procesos sucesores tras un paso de reducción.
 *
 * Implementa la regla COMM atravesando new (canales restringidos pueden
 * comunicar internamente: scope extrusion básica intra-scope) y desplegando
 * replicaciones lazy. Match se evalúa al pasar.
 *
 * Si el resultado es vacío, no hay comunicación posible (deadlock o
 * proceso terminal).
 */
export function reduce(p: PiProcess): PiProcess[] {
  // Caso especial: [x=x].P → P es una "reducción" silenciosa
  // (no es COMM, pero forma parte de la relación →). Lo exponemos también.
  const successors: PiProcess[] = [];
  collectCommReductions(p, (q) => q, successors);
  return successors;
}

/**
 * Recorre el AST descendiendo por (ν) (que no bloquea reducciones
 * internas) y emite todos los sucesores de COMM.
 */
function collectCommReductions(
  p: PiProcess,
  rebuild: (q: PiProcess) => PiProcess,
  out: PiProcess[],
): void {
  // 1. Match top-level
  if (p.kind === 'match' && p.left === p.right) {
    out.push(rebuild(p.cont));
  }

  // 2. Descenso por (νc) — las reducciones dentro suben envueltas.
  if (p.kind === 'new') {
    collectCommReductions(
      p.body,
      (q) => rebuild({ kind: 'new', channel: p.channel, body: q }),
      out,
    );
  }

  // 3. COMM: buscamos pares input/output con el mismo canal en este "nivel".
  const inputs: InputPrefix[] = [];
  const outputs: OutputPrefix[] = [];
  collectInputs(p, (q) => q, inputs);
  collectOutputs(p, (q) => q, outputs);

  for (const i of inputs) {
    for (const o of outputs) {
      if (i.channel !== o.channel) continue;
      // Para sincronizar dentro del mismo proceso necesitamos que i y o
      // vivan en ramas paralelas: el rebuild de uno aplicado al resultado
      // del otro debe componer paralelamente. Reconstruimos manualmente:
      const reduced = applyComm(p, i, o);
      if (reduced !== null) out.push(rebuild(reduced));
    }
  }
}

/**
 * Aplica una reducción COMM concreta sobre `p`: localiza los prefijos
 * `i` y `o` (que viven en ramas paralelas) y los reemplaza por sus
 * continuaciones (con sustitución en el input).
 *
 * Estrategia: como `rebuild` de cada prefijo asume que reemplaza
 * solo su propio sub-proceso, no podemos componerlos directamente.
 * En su lugar reconstruimos el AST haciendo un "structural walk" que
 * marca y reemplaza los dos prefijos en una sola pasada.
 */
function applyComm(p: PiProcess, i: InputPrefix, o: OutputPrefix): PiProcess | null {
  const marker = { found: false };
  const result = replaceTwoPrefixes(p, i, o, marker);
  return marker.found ? result : null;
}

/**
 * Reemplaza simultáneamente el prefijo input `i` y el prefijo output `o`
 * en el AST. Los identifica por referencia estructural (mismo kind y
 * mismas continuaciones — funciona porque collectInputs/Outputs
 * preserva las referencias originales).
 */
function replaceTwoPrefixes(
  p: PiProcess,
  i: InputPrefix,
  o: OutputPrefix,
  marker: { found: boolean },
): PiProcess {
  // ¿Es el input que buscamos?
  if (
    p.kind === 'input' &&
    p.channel === i.channel &&
    p.bind === i.bind &&
    p.cont === i.cont
  ) {
    const substituted = substitute(p.cont, p.bind, o.value);
    return substituted;
  }
  // ¿Es el output que buscamos?
  if (
    p.kind === 'output' &&
    p.channel === o.channel &&
    p.value === o.value &&
    p.cont === o.cont
  ) {
    return p.cont;
  }
  switch (p.kind) {
    case 'nil':
    case 'input':
    case 'output':
      return p;
    case 'parallel': {
      const leftHadIO = containsPrefixes(p.left, i, o);
      const rightHadIO = containsPrefixes(p.right, i, o);
      if (leftHadIO.hasInput && rightHadIO.hasOutput) {
        marker.found = true;
        return {
          kind: 'parallel',
          left: replaceTwoPrefixes(p.left, i, o, { found: false }),
          right: replaceTwoPrefixes(p.right, i, o, { found: false }),
        };
      }
      if (rightHadIO.hasInput && leftHadIO.hasOutput) {
        marker.found = true;
        return {
          kind: 'parallel',
          left: replaceTwoPrefixes(p.left, i, o, { found: false }),
          right: replaceTwoPrefixes(p.right, i, o, { found: false }),
        };
      }
      // Ambos en el mismo lado: descender.
      if (leftHadIO.hasInput && leftHadIO.hasOutput) {
        return {
          kind: 'parallel',
          left: replaceTwoPrefixes(p.left, i, o, marker),
          right: p.right,
        };
      }
      if (rightHadIO.hasInput && rightHadIO.hasOutput) {
        return {
          kind: 'parallel',
          left: p.left,
          right: replaceTwoPrefixes(p.right, i, o, marker),
        };
      }
      return p;
    }
    case 'choice': {
      // En un choice, elegir un prefijo descarta la otra rama.
      const leftHas = containsPrefixes(p.left, i, o);
      const rightHas = containsPrefixes(p.right, i, o);
      if (leftHas.hasInput || leftHas.hasOutput) {
        return replaceTwoPrefixes(p.left, i, o, marker);
      }
      if (rightHas.hasInput || rightHas.hasOutput) {
        return replaceTwoPrefixes(p.right, i, o, marker);
      }
      return p;
    }
    case 'new': {
      // α-renombramos el binder si el valor a enviar coincide (evita captura).
      let body = p.body;
      let channel = p.channel;
      if (p.channel === o.value) {
        const avoid = new Set<string>();
        for (const n of freeNames(body)) avoid.add(n);
        avoid.add(o.value);
        avoid.add(i.bind);
        const fresh = freshName(p.channel, avoid);
        body = alphaRename(body, p.channel, fresh);
        channel = fresh;
      }
      return { kind: 'new', channel, body: replaceTwoPrefixes(body, i, o, marker) };
    }
    case 'replication': {
      // Desplegamos: !P ≡ P | !P; el prefijo consumido viene de la copia.
      const has = containsPrefixes(p.body, i, o);
      if ((has.hasInput || has.hasOutput) && (has.hasInput || has.hasOutput)) {
        const unfolded: PiProcess = {
          kind: 'parallel',
          left: p.body,
          right: { kind: 'replication', body: p.body },
        };
        return replaceTwoPrefixes(unfolded, i, o, marker);
      }
      return p;
    }
    case 'match':
      if (p.left === p.right) {
        return replaceTwoPrefixes(p.cont, i, o, marker);
      }
      return p;
  }
}

/**
 * Tests si un subárbol contiene los prefijos buscados (por referencia).
 * Conservador: si `p` está bajo replicación, se reporta como "contiene"
 * porque podría producir una copia.
 */
function containsPrefixes(
  p: PiProcess,
  i: InputPrefix,
  o: OutputPrefix,
): { hasInput: boolean; hasOutput: boolean } {
  let hasInput = false;
  let hasOutput = false;
  walk(p);
  return { hasInput, hasOutput };

  function walk(q: PiProcess): void {
    if (q.kind === 'input' && q.channel === i.channel && q.bind === i.bind && q.cont === i.cont) {
      hasInput = true;
    }
    if (
      q.kind === 'output' &&
      q.channel === o.channel &&
      q.value === o.value &&
      q.cont === o.cont
    ) {
      hasOutput = true;
    }
    switch (q.kind) {
      case 'parallel':
      case 'choice':
        walk(q.left);
        walk(q.right);
        return;
      case 'new':
      case 'replication':
        walk(q.body);
        return;
      case 'match':
        walk(q.cont);
        return;
      default:
        return;
    }
  }
}

/**
 * `isDeadlocked(p)`: `true` si no hay ninguna reducción posible.
 * Incluye procesos terminales (`0`, `0 | 0`, etc.) y procesos con
 * prefijos que no pueden sincronizar por incompatibilidad de canales.
 */
export function isDeadlocked(p: PiProcess): boolean {
  return reduce(p).length === 0;
}

/**
 * `trace(p, maxSteps)`: explora una traza determinista (elige el
 * primer sucesor en cada paso). Útil para inspección, no pretende ser
 * una semántica completa. Se detiene en deadlock o tras `maxSteps`.
 */
export function trace(p: PiProcess, maxSteps: number = 100): PiProcess[] {
  const result: PiProcess[] = [p];
  let current = p;
  for (let step = 0; step < maxSteps; step++) {
    const next = reduce(current);
    if (next.length === 0) break;
    const head = next[0]!;
    result.push(head);
    current = head;
  }
  return result;
}
