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
  // La deduplicación post-clausura es una optimización (evita re-evaluar
  // frames sintácticamente iguales tras cerrar los axiomas). El `seen` Set
  // crece hasta 2^|pairs| entradas; a partir de ~2^22 supera el tamaño
  // máximo de Set de V8 y lanza RangeError. Por encima de ese umbral
  // desactivamos la dedup: la corrección no depende de ella (sólo evita
  // trabajo repetido), así que preferimos enumerar con duplicados antes
  // que crashear.
  const DEDUP_MAX = 1 << 20;
  const seen = total <= DEDUP_MAX ? new Set<string>() : null;

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

    if (seen !== null) {
      const sig = [...model.edges].sort((a, b) => a - b).join(',');
      if (seen.has(sig)) continue;
      seen.add(sig);
    }

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
 * Cuenta las "demandas existenciales de sucesor" de `f`: cada modalidad
 * que, en la rama del tableau, obliga a crear un mundo testigo. Con
 * polaridad (NNF implícito): un ◇ en posición positiva, o un □ bajo un
 * nº impar de negaciones (≡ ◇¬), genera una demanda. □ positivo y ◇
 * negativo son universales (no crean mundos nuevos por sí mismos).
 *
 * Es una cota superior del nº de sucesores que la raíz puede necesitar:
 * en K un modelo árbol satisface `f` con a lo sumo (1 + #demandas)
 * mundos en el primer nivel, y las demandas anidadas se contabilizan
 * recursivamente. La usamos para dimensionar la búsqueda sin caer en la
 * constante fija que provocaba BUG-T2 ni en el costo de explorar siempre
 * el techo máximo.
 */
function countSuccessorDemands(f: ModalFormula): number {
  const walk = (g: ModalFormula, positive: boolean): number => {
    switch (g.kind) {
      case 'atom':
        return 0;
      case 'not':
        return walk(subUnary(g), !positive);
      case 'diamond':
        return (positive ? 1 : 0) + walk(subUnary(g), positive);
      case 'box':
        return (positive ? 0 : 1) + walk(subUnary(g), positive);
      case 'and':
      case 'or':
        return walk(subLeft(g), positive) + walk(subRight(g), positive);
      case 'implies':
        // a → b ≡ ¬a ∨ b: el antecedente invierte polaridad.
        return walk(subLeft(g), !positive) + walk(subRight(g), positive);
    }
  };
  return walk(f, true);
}

/**
 * Techo de mundos absoluto factible para la enumeración exhaustiva.
 *
 * El cuello de botella es la enumeración de frames: hay 2^(n²) (o
 * 2^(n²-n) bajo T) aristas posibles para `n` mundos. Mediciones en este
 * motor: n=4 ⇒ ~0.25s; n=5 ⇒ inviable (2^25≈33M frames, además el Set de
 * dedup supera el máximo de V8). Por eso el techo absoluto es 4.
 *
 * Trade-off (documentado): para fórmulas cuyo menor modelo satisfacible
 * requiere >4 mundos, esta enumeración por fuerza bruta no lo halla y
 * `isSatisfiable` puede dar un falso negativo (⇒ `isValid` un falso
 * positivo). Es una limitación inherente del enfoque enumerativo, no un
 * número mágico arbitrario: es el mayor `n` para el que la búsqueda
 * exhaustiva termina en tiempo razonable sin agotar memoria. Para
 * decisión completa de validez modal se necesitaría un tableau prefijado
 * real (con bloqueo) en lugar de enumeración de frames.
 */
const FEASIBLE_WORLD_CAP = 4;

/**
 * Tamaño máximo de modelo a explorar para `phi`. Antes era la constante
 * fija 3 (BUG-T2: declaraba insatisfacibles fórmulas K cuyo menor modelo
 * tiene 4 mundos, p.ej. ◇a∧◇b∧◇c∧◇d con átomos disjuntos por □). Ahora
 * se dimensiona por el nº de demandas existenciales de sucesor:
 * `1 (raíz) + #demandas`, con piso 3 (preserva el comportamiento de los
 * casos simples que ya cubría el 3) y recortado al techo factible.
 *
 * Usar las demandas (y no |sub(phi)|) mantiene barata la confirmación de
 * validez de fórmulas con pocas demandas pero muchas subfórmulas (p.ej.
 * el axioma K, ¬(□(p→q)→(□p→□q)) ≡ □(p→q)∧□p∧◇¬q: 1 demanda ⇒ 2 mundos,
 * que se confirma UNSAT en ~1ms en vez de ~4s explorando 4 mundos).
 *
 * Override vía `options.maxWorlds` en la API pública (también recortado
 * al techo factible para no crashear con valores grandes).
 */
function defaultMaxWorlds(phi: ModalFormula): number {
  const demands = countSuccessorDemands(phi);
  return Math.max(3, Math.min(1 + demands, FEASIBLE_WORLD_CAP));
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
  // Un `maxWorlds` explícito se recorta al techo factible para no agotar
  // memoria (la dedup de frames se desactiva sola por encima de 2^20,
  // pero la enumeración 2^(n²) seguiría siendo inviable para n grande).
  const requested = options.maxWorlds ?? defaultMaxWorlds(phi);
  const maxWorlds = Math.max(1, Math.min(requested, FEASIBLE_WORLD_CAP));

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
