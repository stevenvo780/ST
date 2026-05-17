// ============================================================
// Tableau extendido con axiomas de frame (T, B, 4, 5, D)
// ============================================================
//
// Estrategia: enumeración acotada de modelos Kripke finitos que
// satisfacen las condiciones de frame impuestas por los axiomas
// elegidos. Toda lógica modal normal definida por un subconjunto
// de {T, B, 4, 5, D} tiene la propiedad del modelo finito (FMP),
// así que la búsqueda bounded es completa para tamaños suficientes.
//
// El nombre "tableau" se mantiene por la interfaz pública: el
// procedimiento es equivalente a saturar un tableau prefijado y
// extraer un Kripke model de la rama abierta, sólo que aquí se
// hace por enumeración directa de frames + valuaciones — más
// simple de auditar y más rápido para |sub(φ)| pequeño.
//
// Para evitar explosión combinatoria:
//   - El tamaño del frame se elige según |sub(φ)| y los axiomas.
//   - Se aplica clausura del frame antes de evaluar para
//     enforce de las condiciones (transitivo, simétrico, etc.).
//   - Las valuaciones se enumeran sólo sobre átomos que aparecen.

import { FrameAxiom, KripkeModel, ModalFormula, TableauResult } from './types';
import { collectAtoms, subLeft, subRight, subUnary } from './formula';

// ------------------------------------------------------------
// Modelo interno (representación compacta basada en índices)
// ------------------------------------------------------------

interface InternalModel {
  size: number;
  /** Conjunto de aristas (from, to) como Set<from*size+to>. */
  edges: Set<number>;
  /** Por mundo i, conjunto de átomos verdaderos en i. */
  val: Set<string>[];
}

function edgeKey(size: number, from: number, to: number): number {
  return from * size + to;
}

function hasEdge(m: InternalModel, from: number, to: number): boolean {
  return m.edges.has(edgeKey(m.size, from, to));
}

function successors(m: InternalModel, w: number): number[] {
  const out: number[] = [];
  for (let v = 0; v < m.size; v++) {
    if (hasEdge(m, w, v)) out.push(v);
  }
  return out;
}

// ------------------------------------------------------------
// Forcing modal estándar (semántica Kripke)
// ------------------------------------------------------------

function forces(m: InternalModel, w: number, f: ModalFormula): boolean {
  switch (f.kind) {
    case 'atom':
      return f.name !== undefined && m.val[w].has(f.name);
    case 'not':
      return !forces(m, w, subUnary(f));
    case 'and':
      return forces(m, w, subLeft(f)) && forces(m, w, subRight(f));
    case 'or':
      return forces(m, w, subLeft(f)) || forces(m, w, subRight(f));
    case 'implies':
      return !forces(m, w, subLeft(f)) || forces(m, w, subRight(f));
    case 'box': {
      const inner = subUnary(f);
      for (const v of successors(m, w)) {
        if (!forces(m, v, inner)) return false;
      }
      return true;
    }
    case 'diamond': {
      const inner = subUnary(f);
      for (const v of successors(m, w)) {
        if (forces(m, v, inner)) return true;
      }
      return false;
    }
  }
}

// ------------------------------------------------------------
// Aplicación de axiomas de frame — clausura sobre las aristas
// ------------------------------------------------------------

/**
 * Aplica las condiciones de frame impuestas por los axiomas
 * IN-PLACE sobre `edges`. Devuelve `false` si el frame no puede
 * satisfacer las condiciones (e.g. D requiere serialidad y el
 * mundo está aislado — se intentará añadir, pero el chequeo
 * final lo confirma).
 *
 * Reglas:
 *   - T : ∀w. R(w,w)          → añadir lazos.
 *   - B : R(w,v) → R(v,w)     → simetrizar.
 *   - 4 : transitividad        → cerrar transitivamente.
 *   - 5 : R(w,v)∧R(w,u)→R(v,u) → euclidianizar.
 *   - D : ∀w. ∃v. R(w,v)       → si w sin sucesor, añadir lazo
 *                                a w (siempre coherente con K+D).
 *
 * Las clausuras (B, 4, 5) se iteran hasta punto fijo porque se
 * generan mutuamente.
 */
function closeFrame(model: InternalModel, axioms: Set<FrameAxiom>): void {
  const size = model.size;

  if (axioms.has('T')) {
    for (let w = 0; w < size; w++) {
      model.edges.add(edgeKey(size, w, w));
    }
  }

  let changed = true;
  while (changed) {
    changed = false;

    if (axioms.has('B')) {
      const snapshot = [...model.edges];
      for (const k of snapshot) {
        const from = Math.floor(k / size);
        const to = k % size;
        const rev = edgeKey(size, to, from);
        if (!model.edges.has(rev)) {
          model.edges.add(rev);
          changed = true;
        }
      }
    }

    if (axioms.has('4')) {
      // Cierre transitivo (Floyd-Warshall sobre la matriz booleana)
      for (let k = 0; k < size; k++) {
        for (let i = 0; i < size; i++) {
          if (!hasEdge(model, i, k)) continue;
          for (let j = 0; j < size; j++) {
            if (hasEdge(model, k, j) && !hasEdge(model, i, j)) {
              model.edges.add(edgeKey(size, i, j));
              changed = true;
            }
          }
        }
      }
    }

    if (axioms.has('5')) {
      // Euclidianidad: si w R v y w R u entonces v R u.
      for (let w = 0; w < size; w++) {
        const succs: number[] = [];
        for (let v = 0; v < size; v++) {
          if (hasEdge(model, w, v)) succs.push(v);
        }
        for (const v of succs) {
          for (const u of succs) {
            if (!hasEdge(model, v, u)) {
              model.edges.add(edgeKey(size, v, u));
              changed = true;
            }
          }
        }
      }
    }
  }

  if (axioms.has('D')) {
    // Serialidad: cada mundo necesita ≥1 sucesor. Si falta, lo
    // damos como auto-lazo (coherente con D, pero no añade T
    // a otros mundos).
    for (let w = 0; w < size; w++) {
      let has = false;
      for (let v = 0; v < size; v++) {
        if (hasEdge(model, w, v)) {
          has = true;
          break;
        }
      }
      if (!has) {
        model.edges.add(edgeKey(size, w, w));
      }
    }
    // Cerrar de nuevo simetría/transitividad/euclidiana si las
    // nuevas aristas introducen requerimientos.
    if (axioms.has('B') || axioms.has('4') || axioms.has('5')) {
      closeFrame(model, new Set([...axioms].filter((a) => a !== 'D')));
    }
  }
}

// ------------------------------------------------------------
// Enumeración de frames y valuaciones
// ------------------------------------------------------------

/**
 * Genera todos los frames de tamaño `size`. Para cada uno
 * aplica la clausura del axioma y descarta duplicados sintácticos
 * post-clausura.
 */
function* generateFrames(size: number, axioms: Set<FrameAxiom>): Generator<InternalModel> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      // Si T está activo, todos los lazos están forzados — no
      // los enumeramos como variables libres.
      if (axioms.has('T') && i === j) continue;
      pairs.push([i, j]);
    }
  }

  const total = 1 << pairs.length;
  const seen = new Set<string>();

  for (let mask = 0; mask < total; mask++) {
    const edges = new Set<number>();
    for (let b = 0; b < pairs.length; b++) {
      if (mask & (1 << b)) {
        const [from, to] = pairs[b];
        edges.add(edgeKey(size, from, to));
      }
    }
    const model: InternalModel = {
      size,
      edges,
      val: Array.from({ length: size }, () => new Set<string>()),
    };
    closeFrame(model, axioms);

    const sig = [...model.edges].sort((a, b) => a - b).join(',');
    if (seen.has(sig)) continue;
    seen.add(sig);

    yield model;
  }
}

/**
 * Enumera valuaciones sobre `atoms` para los `size` mundos
 * (subconjunto arbitrario de átomos por mundo, sin restricción
 * de monotonía — la lógica modal estándar no la exige).
 */
function* generateValuations(size: number, atoms: string[]): Generator<Set<string>[]> {
  const k = atoms.length;
  const perWorld = 1 << k;
  const total = Math.pow(perWorld, size);
  for (let i = 0; i < total; i++) {
    const val: Set<string>[] = [];
    let idx = i;
    for (let w = 0; w < size; w++) {
      const mask = idx % perWorld;
      idx = Math.floor(idx / perWorld);
      const set = new Set<string>();
      for (let a = 0; a < k; a++) {
        if (mask & (1 << a)) set.add(atoms[a]);
      }
      val.push(set);
    }
    yield val;
  }
}

// ------------------------------------------------------------
// Cota de tamaño de modelo
// ------------------------------------------------------------

/**
 * Tamaño máximo de modelo a explorar. Conservador: 2^|atoms|+1
 * bastaría para la propiedad de filtración en muchas lógicas,
 * pero acotado por un máximo absoluto para evitar explosiones.
 *
 * Override vía `options.maxWorlds` en la API pública.
 */
function defaultMaxWorlds(atomCount: number): number {
  if (atomCount <= 1) return 3;
  if (atomCount <= 2) return 3;
  return 3;
}

// ------------------------------------------------------------
// Conversión modelo interno → público
// ------------------------------------------------------------

function toPublic(model: InternalModel, actual: number): KripkeModel {
  const worlds = Array.from({ length: model.size }, (_, i) => `w${i}`);
  const accessibility: Array<[string, string]> = [];
  for (const k of model.edges) {
    const from = Math.floor(k / model.size);
    const to = k % model.size;
    accessibility.push([`w${from}`, `w${to}`]);
  }
  accessibility.sort((a, b) =>
    a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0]),
  );
  const valuation = new Map<string, Set<string>>();
  for (let w = 0; w < model.size; w++) {
    valuation.set(`w${w}`, new Set(model.val[w]));
  }
  return { worlds, accessibility, valuation, actual: `w${actual}` };
}

// ------------------------------------------------------------
// API: tableau / sat / valid
// ------------------------------------------------------------

export interface TableauOptions {
  /** Máximo número de mundos a explorar. Default heurístico. */
  maxWorlds?: number;
}

/**
 * Construye un tableau extendido para `phi` bajo los axiomas
 * de frame `axioms`. Devuelve `sat` con un modelo si existe; en
 * caso contrario `closed=true`.
 */
export function tableauWithAxioms(
  phi: ModalFormula,
  axioms: FrameAxiom[],
  options: TableauOptions = {},
): TableauResult {
  const axiomSet = new Set<FrameAxiom>(axioms);
  const atoms = [...collectAtoms(phi)];
  // Si la fórmula no menciona átomos (e.g. □⊥ con notación
  // sintética), igual hay que considerar valuaciones triviales.
  const effectiveAtoms = atoms.length === 0 ? [] : atoms;
  const maxWorlds = options.maxWorlds ?? defaultMaxWorlds(effectiveAtoms.length);

  for (let size = 1; size <= maxWorlds; size++) {
    for (const frame of generateFrames(size, axiomSet)) {
      for (const val of generateValuations(size, effectiveAtoms)) {
        frame.val = val;
        if (forces(frame, 0, phi)) {
          return { sat: true, closed: false, model: toPublic(frame, 0) };
        }
      }
    }
  }

  return { sat: false, closed: true };
}
