// ============================================================
// ST dL-Hybrid — Decision procedure tipo tableau (subset)
// ============================================================
// Implementación pragmática y *no* completa del cálculo de pruebas de dL.
// La idea: en lugar de un cálculo simbólico KeYmaera-completo, modelamos
// el espacio de estados con muestreo sobre un conjunto finito de estados
// iniciales generados a partir de la fórmula y exploramos las posibles
// trayectorias del programa híbrido.
//
// Decisión:
//   • Para mostrar `validez universal` exigimos que NO exista un estado
//     en el universo finito muestreado que produzca un contraejemplo.
//   • Para `satisfiabilidad` basta con encontrar un estado donde la
//     fórmula se cumple.
//
// Este enfoque cubre los ejemplos canónicos del paper de Platzer con
// dominio acotado y se comporta como un "model-finder con horizonte
// finito" en lugar de un decision procedure completo. Para ODEs no
// soportadas (clasifyOde → unsupported) responde `unknown`.
//
// Reglas operativas para [α]φ:
//   • [x := e] φ            → φ[e/x]  evaluado en estado actual
//   • [x := *] φ            → ∀v . φ[v/x]  aproximado con malla
//   • [?ψ] φ                → ψ → φ
//   • [α; β] φ              → [α][β] φ
//   • [α ∪ β] φ             → [α]φ ∧ [β]φ
//   • [α*] φ                → φ ∧ [α]φ ∧ [α;α]φ ∧ … (unfold a profundidad N)
//   • [{x'=f & Q}] φ        → ∀t≥0 . (∀s∈[0,t] . Q(x(s))) → φ(x(t))
//                              muestreado con malla temporal.
// ============================================================

import type { DLFormula, DLTerm, HybridProgram, State } from './ast';
import { cloneState, formulaVars, programVars } from './ast';
import { evalQuantifierFree, evalTerm } from './semantics';
import { classifyOde, flow } from './differential';

export interface DLOptions {
  /** Profundidad máxima al desenrollar loops `α*`. */
  loopUnfold?: number;
  /** Cantidad de muestras temporales para evaluar ODEs continuas. */
  odeSamples?: number;
  /** Horizonte temporal máximo a explorar en ODEs. */
  odeHorizon?: number;
  /** Cantidad de valores muestrales para `x := *`. */
  nondetSamples?: number[];
  /** Estados iniciales explícitos. Si vacío, se genera una malla cubriendo las variables relevantes. */
  initialStates?: State[];
  /** Valores muestrales por defecto para construir la malla de iniciales. */
  initialMesh?: number[];
}

const DEFAULTS: Required<DLOptions> = {
  loopUnfold: 3,
  odeSamples: 9,
  odeHorizon: 5,
  nondetSamples: [-2, -1, 0, 1, 2],
  initialStates: [],
  initialMesh: [-1, 0, 1, 2],
};

function withDefaults(opts?: DLOptions): Required<DLOptions> {
  return { ...DEFAULTS, ...(opts ?? {}) };
}

/**
 * Resultado de evaluar `holds(post, αState)` para un programa: lista de
 * estados de salida (o un símbolo de no determinación). Para los casos en
 * los que la salida es no-acotadamente infinita (asignación no
 * determinista), muestreamos un set discreto.
 *
 * `unsupported` se activa cuando el programa contiene una ODE que
 * classifyOde marca como 'unsupported'. En ese caso outcomes es vacío y
 * el llamador debe propagar 'unknown' en lugar de evaluar la post-condición.
 */
type StepResult = { outcomes: State[]; blocked?: boolean; unsupported?: boolean };

/**
 * Devuelve TODOS los estados de salida posibles tras ejecutar `prog`
 * desde `s`. Para tests bloqueantes devuelve outcomes=[] con blocked=true.
 * No es exhaustivo: muestrea estados.
 */
function executeProgram(prog: HybridProgram, s: State, opts: Required<DLOptions>): StepResult {
  switch (prog.kind) {
    case 'assign': {
      const next = cloneState(s);
      next.set(prog.varName, evalTerm(prog.rhs, s));
      return { outcomes: [next] };
    }
    case 'nondet': {
      const out: State[] = [];
      for (const v of opts.nondetSamples) {
        const ns = cloneState(s);
        ns.set(prog.varName, v);
        out.push(ns);
      }
      return { outcomes: out };
    }
    case 'test': {
      if (evalQuantifierFree(prog.cond, s)) return { outcomes: [s] };
      return { outcomes: [], blocked: true };
    }
    case 'seq': {
      const first = executeProgram(prog.left, s, opts);
      if (first.unsupported) return { outcomes: [], unsupported: true };
      const combined: State[] = [];
      let seqUnsupported = false;
      for (const mid of first.outcomes) {
        const after = executeProgram(prog.right, mid, opts);
        if (after.unsupported) { seqUnsupported = true; break; }
        combined.push(...after.outcomes);
      }
      if (seqUnsupported) return { outcomes: [], unsupported: true };
      return { outcomes: combined };
    }
    case 'choice': {
      const a = executeProgram(prog.left, s, opts);
      const b = executeProgram(prog.right, s, opts);
      if (a.unsupported || b.unsupported) return { outcomes: [], unsupported: true };
      return { outcomes: [...a.outcomes, ...b.outcomes] };
    }
    case 'loop': {
      // Desenrolla hasta loopUnfold iteraciones; cada k es una posible salida.
      const outcomes: State[] = [cloneState(s)];
      let current: State[] = [cloneState(s)];
      for (let k = 0; k < opts.loopUnfold; k++) {
        const next: State[] = [];
        for (const st of current) {
          const step = executeProgram(prog.body, st, opts);
          if (step.unsupported) return { outcomes: [], unsupported: true };
          next.push(...step.outcomes);
        }
        if (next.length === 0) break;
        outcomes.push(...next);
        current = next;
      }
      return { outcomes };
    }
    case 'ode': {
      const klass = classifyOde(prog.system);
      if (klass.kind === 'unsupported') {
        return { outcomes: [], unsupported: true };
      }
      const out: State[] = [];
      const dt = opts.odeHorizon / Math.max(1, opts.odeSamples - 1);
      for (let i = 0; i < opts.odeSamples; i++) {
        const t = i * dt;
        const ns = flow(prog.system, s, t);
        // Verifica dominio: si dominio falla en algún punto del segmento
        // [0, t] descartamos. Aproximamos con malla.
        if (prog.system.domain) {
          let ok = true;
          for (let j = 0; j <= i; j++) {
            const tau = j * dt;
            const inter = flow(prog.system, s, tau);
            if (!evalQuantifierFree(prog.system.domain, inter)) {
              ok = false;
              break;
            }
          }
          if (!ok) continue;
        }
        out.push(ns);
      }
      // Siempre incluir t=0 al menos
      if (out.length === 0) out.push(cloneState(s));
      return { outcomes: out };
    }
  }
}

/**
 * Evalúa una fórmula dL sobre un estado concreto. Para modalidades
 * recurre a `executeProgram`. Retorna `'unknown'` cuando la evaluación
 * topa con una ODE no soportada y no puede decidirse de forma sonora.
 */
function evalFormula(f: DLFormula, s: State, opts: Required<DLOptions>): boolean | 'unknown' {
  switch (f.kind) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'comp':
      return evalQuantifierFree(f, s);
    case 'not': {
      const v = evalFormula(f.arg, s, opts);
      if (v === 'unknown') return 'unknown';
      return !v;
    }
    case 'and': {
      const l = evalFormula(f.left, s, opts);
      if (l === false) return false;
      const r = evalFormula(f.right, s, opts);
      if (r === false) return false;
      if (l === 'unknown' || r === 'unknown') return 'unknown';
      return true;
    }
    case 'or': {
      const l = evalFormula(f.left, s, opts);
      if (l === true) return true;
      const r = evalFormula(f.right, s, opts);
      if (r === true) return true;
      if (l === 'unknown' || r === 'unknown') return 'unknown';
      return false;
    }
    case 'implies': {
      const l = evalFormula(f.left, s, opts);
      if (l === false) return true;
      const r = evalFormula(f.right, s, opts);
      if (r === true) return true;
      if (l === 'unknown' || r === 'unknown') return 'unknown';
      return false;
    }
    case 'iff': {
      const l = evalFormula(f.left, s, opts);
      const r = evalFormula(f.right, s, opts);
      if (l === 'unknown' || r === 'unknown') return 'unknown';
      return l === r;
    }
    case 'box': {
      const step = executeProgram(f.program, s, opts);
      if (step.unsupported) return 'unknown';
      // [α]φ: en TODOS los outcomes φ debe valer.
      // Si el test bloquea (sin outcomes), [?ψ]φ es vacuously true.
      let sawUnknown = false;
      for (const out of step.outcomes) {
        const v = evalFormula(f.post, out, opts);
        if (v === false) return false;
        if (v === 'unknown') sawUnknown = true;
      }
      return sawUnknown ? 'unknown' : true;
    }
    case 'diamond': {
      const step = executeProgram(f.program, s, opts);
      if (step.unsupported) return 'unknown';
      // ⟨α⟩φ: existe un outcome donde φ vale.
      let sawUnknown = false;
      for (const out of step.outcomes) {
        const v = evalFormula(f.post, out, opts);
        if (v === true) return true;
        if (v === 'unknown') sawUnknown = true;
      }
      return sawUnknown ? 'unknown' : false;
    }
  }
}

/** Genera una malla de estados iniciales según las variables libres de la fórmula. */
function generateInitialStates(f: DLFormula, opts: Required<DLOptions>): State[] {
  if (opts.initialStates.length > 0) return opts.initialStates;
  const vars = Array.from(formulaVars(f));
  // También variables modificadas dentro de programas (parten de un valor inicial).
  if (vars.length === 0) return [new Map()];
  // Producto cartesiano de la malla — limita a 4 vars máx para evitar explosión.
  if (vars.length > 4) {
    // Modo light: usa sólo {0, 1, -1} para cada var y limita combinaciones.
    const mesh = [-1, 0, 1];
    const states: State[] = [];
    // Una muestra "todo a v" por cada v
    for (const v of mesh) {
      const s: State = new Map();
      for (const x of vars) s.set(x, v);
      states.push(s);
    }
    // Una muestra mixta: variable individual con valor distinto
    for (let i = 0; i < vars.length; i++) {
      for (const v of mesh) {
        const s: State = new Map();
        for (let j = 0; j < vars.length; j++) {
          s.set(vars[j] ?? '', j === i ? v : 0);
        }
        states.push(s);
      }
    }
    return states;
  }
  const mesh = opts.initialMesh;
  const result: State[] = [];
  const recurse = (idx: number, current: State): void => {
    if (idx === vars.length) {
      result.push(new Map(current));
      return;
    }
    const v = vars[idx];
    if (!v) return;
    for (const val of mesh) {
      current.set(v, val);
      recurse(idx + 1, current);
    }
  };
  recurse(0, new Map());
  return result;
}

/** Decisión: la fórmula es válida (vale en todo estado muestreado). */
export interface DLCheckResult {
  status: 'valid' | 'invalid' | 'satisfiable' | 'unsatisfiable' | 'unknown';
  /** Contramodelo o testigo si aplica. */
  witness?: State;
  /** Cantidad de estados muestreados. */
  statesChecked: number;
}

/**
 * Decide si `f` es válida sobre toda la malla muestreada (criterio de
 * validez universal acotada). Si encuentra contraejemplo lo retorna.
 * Si algún estado resulta 'unknown' (ODE no soportada) y ninguno produce
 * contraejemplo, retorna {status:'unknown'} para no afirmar validez sin respaldo.
 */
export function checkValid(f: DLFormula, opts?: DLOptions): DLCheckResult {
  const o = withDefaults(opts);
  const states = generateInitialStates(f, o);
  let sawUnknown = false;
  for (const s of states) {
    const v = evalFormula(f, s, o);
    if (v === false) {
      return { status: 'invalid', witness: s, statesChecked: states.length };
    }
    if (v === 'unknown') sawUnknown = true;
  }
  if (sawUnknown) return { status: 'unknown', statesChecked: states.length };
  return { status: 'valid', statesChecked: states.length };
}

/** Decide si `f` es satisfacible en algún estado muestreado. */
export function checkSatisfiable(f: DLFormula, opts?: DLOptions): DLCheckResult {
  const o = withDefaults(opts);
  const states = generateInitialStates(f, o);
  let sawUnknown = false;
  for (const s of states) {
    const v = evalFormula(f, s, o);
    if (v === true) {
      return { status: 'satisfiable', witness: s, statesChecked: states.length };
    }
    if (v === 'unknown') sawUnknown = true;
  }
  if (sawUnknown) return { status: 'unknown', statesChecked: states.length };
  return { status: 'unsatisfiable', statesChecked: states.length };
}

/**
 * Evalúa la fórmula en un estado específico — útil para casos donde el
 * usuario quiere chequear desde una pre-condición concreta.
 * Retorna `'unknown'` si la evaluación topa con una ODE no soportada.
 */
export function evalInState(f: DLFormula, s: State, opts?: DLOptions): boolean | 'unknown' {
  return evalFormula(f, s, withDefaults(opts));
}

/** Re-export utilitario: lista de variables relevantes en la fórmula. */
export function relevantVariables(f: DLFormula): string[] {
  const acc = formulaVars(f);
  // Incluir variables que sólo aparecen dentro de programas modales
  const inner = (g: DLFormula): void => {
    if (g.kind === 'box' || g.kind === 'diamond') {
      programVars(g.program, acc);
      inner(g.post);
    } else if (g.kind === 'and' || g.kind === 'or' || g.kind === 'implies' || g.kind === 'iff') {
      inner(g.left);
      inner(g.right);
    } else if (g.kind === 'not') {
      inner(g.arg);
    }
  };
  inner(f);
  return Array.from(acc);
}
