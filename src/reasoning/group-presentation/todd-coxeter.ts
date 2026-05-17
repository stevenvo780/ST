// ============================================================
// Todd-Coxeter coset enumeration.
// ============================================================
//
// Enumera las clases laterales (cosets) de un subgrupo H ≤ G en
// un grupo finitamente presentado G = ⟨S | R⟩. Si H es trivial,
// enumera el grupo entero (los cosets son los elementos de G).
//
// Idea: representamos los cosets como enteros 1, 2, 3, ... El coset
// 1 es el subgrupo H. Mantenemos una tabla `τ(c, x) = c'` que
// significa "el coset `c` multiplicado por la letra `x` es el coset
// `c'`". A medida que aplicamos las relaciones de R en cada coset
// y los generadores subgrupales en el coset 1, descubrimos
// igualdades (coset c ≡ coset c') que se procesan por
// union-find (coincidence handling).
//
// Implementación: HLT (Haselgrove–Leech–Trotter) básico. Para los
// tamaños de tests que necesitamos (Z/n, D_n, S_3) basta de sobra
// y termina rápido. `maxCosets` actúa de poda: el algoritmo es
// indecidible en general (problema de la palabra), así que si se
// alcanza el límite devolvemos 'incomplete'.
//
// Referencias: Holt–Eick–O'Brien, "Handbook of Computational
// Group Theory", cap. 5 — versión escolar.
// ============================================================

import type { GroupPresentation, Generator, Word } from './types';
import { inverse, reduceWord } from './words';

export interface CosetTable {
  numCosets: number;
  generators: Generator[]; // generadores positivos (sin inversos)
  // tabla: cosetId → letra (gen o inverso) → cosetId
  table: Map<number, Map<Generator, number>>;
}

// Estado interno con union-find sobre cosets vivos.
interface State {
  // mapping coset → tabla τ(c, letter) → coset (o undefined si vacío)
  table: Map<number, Map<Generator, number>>;
  // unión-find: si replaced[c] != c entonces c fue identificado con
  // replaced[c] (que a su vez podría haber sido identificado más).
  replaced: Map<number, number>;
  // alfabeto extendido (generadores + inversos) sobre el que se
  // indexa la tabla.
  alphabet: Generator[];
  generators: Generator[];
  relations: Word[];
  next: number; // siguiente cosetId a asignar
  alive: Set<number>; // cosets vivos
  maxCosets: number;
}

function buildAlphabet(generators: Generator[]): Generator[] {
  const out: Generator[] = [];
  for (const g of generators) {
    out.push(g);
    out.push(inverse(g));
  }
  return out;
}

// rep: encuentra la raíz de la clase de equivalencia con path
// compression. Si c nunca apareció en replaced, devuelve c.
function rep(state: State, c: number): number {
  let cur = c;
  // Encuentra raíz.
  while (true) {
    const parent = state.replaced.get(cur);
    if (parent === undefined || parent === cur) break;
    cur = parent;
  }
  // Path compression.
  let walker = c;
  while (true) {
    const parent = state.replaced.get(walker);
    if (parent === undefined || parent === cur) break;
    state.replaced.set(walker, cur);
    walker = parent;
  }
  return cur;
}

// newCoset: reserva el siguiente cosetId disponible.
function newCoset(state: State): number {
  const c = state.next++;
  state.alive.add(c);
  state.table.set(c, new Map<Generator, number>());
  return c;
}

// get τ(c, x). Antes de leer canonicaliza c con rep().
function getEdge(state: State, c: number, x: Generator): number | undefined {
  const rc = rep(state, c);
  const row = state.table.get(rc);
  if (!row) return undefined;
  const v = row.get(x);
  return v === undefined ? undefined : rep(state, v);
}

// set τ(c, x) = d y τ(d, x⁻¹) = c (consistencia). Si ya había
// un valor distinto, dispara una coincidencia (deducción de que
// dos cosets son iguales).
function setEdge(state: State, c: number, x: Generator, d: number, queue: number[][]): void {
  const rc = rep(state, c);
  const rd = rep(state, d);
  const xi = inverse(x);
  // Dirección c --x--> d
  const rowC = state.table.get(rc);
  if (!rowC) throw new Error(`setEdge: coset ${rc} sin fila`);
  const existing = rowC.get(x);
  if (existing !== undefined) {
    const re = rep(state, existing);
    if (re !== rd) {
      // Coincidencia: re ≡ rd
      queue.push([re, rd]);
    }
    // No sobreescribimos; ya estaba apuntando a algo equivalente.
  } else {
    rowC.set(x, rd);
  }
  // Dirección d --x⁻¹--> c
  const rowD = state.table.get(rd);
  if (!rowD) throw new Error(`setEdge: coset ${rd} sin fila`);
  const existingInv = rowD.get(xi);
  if (existingInv !== undefined) {
    const rei = rep(state, existingInv);
    if (rei !== rc) {
      queue.push([rei, rc]);
    }
  } else {
    rowD.set(xi, rc);
  }
}

// processCoincidences: union-find sobre cosets, propaga igualdades.
function processCoincidences(state: State, queue: number[][]): void {
  while (queue.length > 0) {
    const pair = queue.shift();
    if (!pair) break;
    const a = rep(state, pair[0]);
    const b = rep(state, pair[1]);
    if (a === b) continue;
    // Por convenio, identificamos el mayor con el menor.
    const keep = a < b ? a : b;
    const drop = a < b ? b : a;
    state.replaced.set(drop, keep);
    state.alive.delete(drop);
    // Volcar la fila de `drop` sobre `keep`.
    const rowDrop = state.table.get(drop);
    if (!rowDrop) continue;
    for (const [x, target] of rowDrop) {
      const rTarget = rep(state, target);
      const rowKeep = state.table.get(keep);
      if (!rowKeep) continue;
      const existing = rowKeep.get(x);
      if (existing === undefined) {
        rowKeep.set(x, rTarget);
      } else {
        const rExisting = rep(state, existing);
        if (rExisting !== rTarget) {
          queue.push([rExisting, rTarget]);
        }
      }
    }
    state.table.delete(drop);
  }
}

// scan: recorre la palabra `w` empezando en `start`. Si en algún
// momento llega al final, deduce τ(prev, lastLetter) = start
// (porque la relación = 1 obliga al ciclo). Si no llega, completa
// con cosets nuevos hacia adelante.
function scanAndFill(state: State, start: number, w: Word, queue: number[][]): void {
  if (w.length === 0) return;
  // Caminamos desde la izquierda.
  let left = start;
  let leftIdx = 0;
  while (leftIdx < w.length) {
    const x = w[leftIdx];
    const next = getEdge(state, left, x);
    if (next === undefined) break;
    left = next;
    leftIdx++;
  }
  if (leftIdx === w.length) {
    // Cerramos el ciclo: τ(left, ε) ya está en start.
    if (rep(state, left) !== rep(state, start)) {
      queue.push([left, start]);
      processCoincidences(state, queue);
    }
    return;
  }
  // Caminamos desde la derecha (con inversos).
  let right = start;
  let rightIdx = w.length;
  while (rightIdx > leftIdx) {
    const x = w[rightIdx - 1];
    const xi = inverse(x);
    const prev = getEdge(state, right, xi);
    if (prev === undefined) break;
    right = prev;
    rightIdx--;
  }
  // En este punto, izquierda y derecha solo están separadas por
  // una porción de la palabra (leftIdx .. rightIdx).
  if (leftIdx === rightIdx) {
    // Se encontraron: nada que hacer salvo cerrar si no eran iguales.
    if (rep(state, left) !== rep(state, right)) {
      queue.push([left, right]);
      processCoincidences(state, queue);
    }
    return;
  }
  if (leftIdx + 1 === rightIdx) {
    // Una sola letra entre medio: deducción τ(left, w[leftIdx]) = right.
    const x = w[leftIdx];
    setEdge(state, left, x, right, queue);
    processCoincidences(state, queue);
    return;
  }
  // Hay >1 letras entre medio: rellenamos con nuevos cosets desde
  // la izquierda. (HLT clásico.)
  while (leftIdx < rightIdx - 1) {
    if (state.next > state.maxCosets) {
      throw new Error('MAX_COSETS');
    }
    const x = w[leftIdx];
    const fresh = newCoset(state);
    setEdge(state, left, x, fresh, queue);
    processCoincidences(state, queue);
    left = rep(state, fresh);
    leftIdx++;
  }
  // Última conexión.
  const x = w[leftIdx];
  setEdge(state, left, x, right, queue);
  processCoincidences(state, queue);
}

// toddCoxeter: enumera cosets de ⟨subgroupGens⟩ en ⟨S | R⟩.
// Si subgroupGens es vacío o no se pasa, enumera el grupo.
// Devuelve la `CosetTable` si terminó, o 'incomplete' si alcanzó
// el cap `maxCosets`.
export function toddCoxeter(
  presentation: GroupPresentation,
  subgroupGens: Word[] = [],
  maxCosets = 4096,
): CosetTable | 'incomplete' {
  const alphabet = buildAlphabet(presentation.generators);
  const state: State = {
    table: new Map<number, Map<Generator, number>>(),
    replaced: new Map<number, number>(),
    alphabet,
    generators: [...presentation.generators],
    relations: presentation.relations.map((r) => reduceWord(r)),
    next: 1,
    alive: new Set<number>(),
    maxCosets,
  };
  // Coset 1 representa H.
  const h = newCoset(state);
  const queue: number[][] = [];

  try {
    // Aplicar generadores de H en el coset 1: τ(1, w) debe volver
    // a 1 para cada w ∈ subgroupGens.
    for (const w of subgroupGens) {
      scanAndFill(state, h, reduceWord(w), queue);
      processCoincidences(state, queue);
    }

    // Bucle principal: escanea relaciones en cada coset vivo
    // hasta que ya no haya cambios.
    let changed = true;
    while (changed) {
      changed = false;
      const alive = [...state.alive].sort((a, b) => a - b);
      for (const c of alive) {
        if (!state.alive.has(c)) continue;
        // Escaneamos cada relación.
        for (const r of state.relations) {
          if (r.length === 0) continue;
          const before = state.next;
          scanAndFill(state, c, r, queue);
          processCoincidences(state, queue);
          if (state.next !== before) changed = true;
        }
        // Y completamos las celdas vacías de este coset con
        // cosets nuevos (definition phase de HLT).
        if (!state.alive.has(c)) continue;
        const row = state.table.get(rep(state, c));
        if (!row) continue;
        for (const x of alphabet) {
          if (row.get(x) === undefined) {
            if (state.next > state.maxCosets) {
              throw new Error('MAX_COSETS');
            }
            const fresh = newCoset(state);
            setEdge(state, c, x, fresh, queue);
            processCoincidences(state, queue);
            changed = true;
            break; // re-escanear desde el principio
          }
        }
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'MAX_COSETS') {
      return 'incomplete';
    }
    throw e;
  }

  // Compacta los cosets vivos a 1..N.
  const aliveSorted = [...state.alive].sort((a, b) => a - b);
  const remap = new Map<number, number>();
  aliveSorted.forEach((c, i) => remap.set(c, i + 1));
  const outTable = new Map<number, Map<Generator, number>>();
  for (const c of aliveSorted) {
    const row = state.table.get(c);
    if (!row) continue;
    const newRow = new Map<Generator, number>();
    for (const [x, target] of row) {
      const rt = rep(state, target);
      const mapped = remap.get(rt);
      if (mapped !== undefined) newRow.set(x, mapped);
    }
    const mappedC = remap.get(c);
    if (mappedC !== undefined) outTable.set(mappedC, newRow);
  }

  return {
    numCosets: aliveSorted.length,
    generators: [...presentation.generators],
    table: outTable,
  };
}

// groupOrder: orden del grupo. Enumera cosets del subgrupo trivial.
// Devuelve número finito, 'infinite' si la conjetura por
// presentación libre es inmediata, o 'unknown' si Todd-Coxeter no
// terminó dentro del cap.
export function groupOrder(
  presentation: GroupPresentation,
  maxCosets = 4096,
): number | 'infinite' | 'unknown' {
  // Caso trivial: ⟨ | ⟩ es el grupo libre de rango 0, orden 1.
  if (presentation.generators.length === 0) {
    return presentation.relations.length === 0 ? 1 : 1;
  }
  // Heurística simple: si todas las relaciones se reducen
  // libremente a la palabra vacía, no aportan información y el
  // grupo es libre F_n (infinito para n ≥ 1).
  if (presentation.relations.every((r) => reduceWord(r).length === 0)) {
    return 'infinite';
  }
  const t = toddCoxeter(presentation, [], maxCosets);
  if (t === 'incomplete') return 'unknown';
  return t.numCosets;
}

// isInSubgroup: dado un Word `w` y una tabla de cosets del par
// (G, H), decide si w ∈ H comprobando si τ(1, w) = 1.
export function isInSubgroup(word: Word, table: CosetTable): boolean {
  const w = reduceWord(word);
  let cur = 1;
  for (const letter of w) {
    const row = table.table.get(cur);
    if (!row) return false;
    const next = row.get(letter);
    if (next === undefined) return false;
    cur = next;
  }
  return cur === 1;
}
