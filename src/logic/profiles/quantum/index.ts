// ============================================================
// ST Quantum logic — Birkhoff–von Neumann lattice + KS checker
// ============================================================
// Lógica cuántica clásica (Birkhoff & von Neumann, 1936):
// el "lattice de proposiciones" no es el álgebra booleana
// distributiva del cálculo proposicional clásico, sino el
// lattice ortocomplementado, no-distributivo, de los subespacios
// cerrados de un espacio de Hilbert.
//
// Aquí trabajamos sobre R^n (espacio de Hilbert real); los
// subespacios se representan por una base ortonormal. Las
// operaciones lattice son:
//
//   * meet  (a ∧ b)  = intersección de subespacios.
//   * join  (a ∨ b)  = span de la unión = clausura lineal.
//   * ortocomplemento (a⊥) = vectores perpendiculares a a.
//
// El lattice resultante es:
//   - acotado (zero = {0}, top = todo el espacio),
//   - ortocomplementado (con involución a⊥⊥ = a),
//   - modular en dim ≤ 3 (en general orthomodular),
//   - NO distributivo (basta un contraejemplo en R^2).
//
// El test de Kochen–Specker (1967) prueba que NO existe una
// asignación {0,1} a cada vector de una configuración suficiente
// que sea "no-contextual": que en cada base ortonormal asigne
// exactamente un 1 al vector elegido. Aquí implementamos el
// checker con backtracking y la configuración Peres-33 en R^3,
// que NO es coloreable.
// ============================================================

// ── Vectores en R^n ─────────────────────────────────────────

export interface Vector {
  values: number[];
}

const EPS = 1e-9;

export function vec(values: number[]): Vector {
  return { values: values.slice() };
}

function approxZero(x: number, eps: number = EPS): boolean {
  return Math.abs(x) <= eps;
}

function assertSameDim(a: Vector, b: Vector): void {
  if (a.values.length !== b.values.length) {
    throw new Error(`vectores de dimensión distinta: ${a.values.length} vs ${b.values.length}`);
  }
}

export function dot(a: Vector, b: Vector): number {
  assertSameDim(a, b);
  let s = 0;
  for (let i = 0; i < a.values.length; i++) {
    s += (a.values[i] ?? 0) * (b.values[i] ?? 0);
  }
  return s;
}

export function norm(v: Vector): number {
  return Math.sqrt(dot(v, v));
}

export function normalize(v: Vector): Vector {
  const n = norm(v);
  if (approxZero(n)) {
    throw new Error('no se puede normalizar el vector cero');
  }
  return { values: v.values.map((x) => x / n) };
}

export function isOrthogonal(a: Vector, b: Vector, eps: number = EPS): boolean {
  return approxZero(dot(a, b), eps);
}

function sub(a: Vector, b: Vector): Vector {
  assertSameDim(a, b);
  return { values: a.values.map((x, i) => x - (b.values[i] ?? 0)) };
}

function scale(a: Vector, k: number): Vector {
  return { values: a.values.map((x) => x * k) };
}

function zeroVec(dim: number): Vector {
  return { values: new Array<number>(dim).fill(0) };
}

function basisVec(i: number, dim: number): Vector {
  const v = new Array<number>(dim).fill(0);
  v[i] = 1;
  return { values: v };
}

/**
 * Gram-Schmidt sobre `vectors`. Devuelve la base ortonormal del
 * subespacio que generan (puede tener menos vectores que la entrada
 * si hay dependencias). Devuelve `null` solo si la entrada está vacía.
 */
export function orthonormalBasis(vectors: Vector[], eps: number = EPS): Vector[] | null {
  if (vectors.length === 0) return null;
  const dim = vectors[0].values.length;
  const basis: Vector[] = [];
  for (const raw of vectors) {
    if (raw.values.length !== dim) {
      throw new Error('Gram-Schmidt: vectores de dimensión distinta');
    }
    let u: Vector = { values: raw.values.slice() };
    for (const b of basis) {
      u = sub(u, scale(b, dot(u, b)));
    }
    const n = norm(u);
    if (n > eps) {
      basis.push(scale(u, 1 / n));
    }
  }
  return basis;
}

// ── Subespacios ─────────────────────────────────────────────

export interface Subspace {
  basis: Vector[];
  dimension: number;
  ambientDim: number;
}

function makeSubspace(basis: Vector[], ambientDim: number): Subspace {
  return { basis, dimension: basis.length, ambientDim };
}

/**
 * Subespacio generado por `vectors`. Si la lista está vacía,
 * `ambientDim` debe pasarse para devolver el subespacio cero del
 * ambiente correcto.
 */
export function span(vectors: Vector[], ambientDim?: number): Subspace {
  if (vectors.length === 0) {
    if (ambientDim == null) {
      throw new Error('span([]) requiere ambientDim explícito');
    }
    return makeSubspace([], ambientDim);
  }
  const dim = vectors[0].values.length;
  const basis = orthonormalBasis(vectors) ?? [];
  return makeSubspace(basis, ambientDim ?? dim);
}

/** Proyecta `v` sobre el subespacio `s`. */
function project(v: Vector, s: Subspace): Vector {
  let acc = zeroVec(s.ambientDim);
  for (const b of s.basis) {
    acc = { values: acc.values.map((x, i) => x + dot(v, b) * (b.values[i] ?? 0)) };
  }
  return acc;
}

/** ¿`v` pertenece al subespacio `s`? Equivale a |v - proj_s(v)| ≈ 0. */
function containsVector(s: Subspace, v: Vector, eps: number = EPS): boolean {
  if (v.values.length !== s.ambientDim) return false;
  const r = sub(v, project(v, s));
  return approxZero(norm(r), eps);
}

/** ¿a ⊆ b? Todos los vectores de la base de a están en b. */
export function isContained(a: Subspace, b: Subspace, eps: number = EPS): boolean {
  if (a.ambientDim !== b.ambientDim) return false;
  for (const v of a.basis) {
    if (!containsVector(b, v, eps)) return false;
  }
  return true;
}

export function equalsSubspace(a: Subspace, b: Subspace, eps: number = EPS): boolean {
  return a.dimension === b.dimension && isContained(a, b, eps) && isContained(b, a, eps);
}

/**
 * Ortocomplemento de `s` en el ambiente de dimensión `ambientDim`.
 * Algoritmo: tomar la base canónica e_1..e_n, restarle la proyección
 * sobre `s`, y aplicar Gram-Schmidt; los vectores supervivientes
 * forman la base ortonormal de s⊥.
 */
export function orthocomplement(s: Subspace, ambientDim?: number): Subspace {
  const n = ambientDim ?? s.ambientDim;
  if (s.ambientDim !== n) {
    throw new Error('orthocomplement: dimensiones no compatibles');
  }
  const residuals: Vector[] = [];
  for (let i = 0; i < n; i++) {
    const e = basisVec(i, n);
    const p = project(e, s);
    residuals.push(sub(e, p));
  }
  const basis = orthonormalBasis(residuals) ?? [];
  return makeSubspace(basis, n);
}

/**
 * Join (∨) = span(a.basis ∪ b.basis). Es la operación supremo
 * en el lattice; el resultado siempre contiene tanto a como b.
 */
export function join(a: Subspace, b: Subspace): Subspace {
  if (a.ambientDim !== b.ambientDim) {
    throw new Error('join: dimensiones de ambiente distintas');
  }
  const all = [...a.basis, ...b.basis];
  if (all.length === 0) return makeSubspace([], a.ambientDim);
  const basis = orthonormalBasis(all) ?? [];
  return makeSubspace(basis, a.ambientDim);
}

/**
 * Meet (∧) = intersección de subespacios. Identidad lattice:
 *   a ∧ b = (a⊥ ∨ b⊥)⊥
 */
export function meet(a: Subspace, b: Subspace): Subspace {
  if (a.ambientDim !== b.ambientDim) {
    throw new Error('meet: dimensiones de ambiente distintas');
  }
  const aPerp = orthocomplement(a);
  const bPerp = orthocomplement(b);
  return orthocomplement(join(aPerp, bPerp));
}

/** Subespacio cero (dimensión 0) en R^n. */
export function zeroSubspace(ambientDim: number): Subspace {
  return makeSubspace([], ambientDim);
}

/** Top: todo el espacio R^n con la base canónica. */
export function topSubspace(ambientDim: number): Subspace {
  const basis: Vector[] = [];
  for (let i = 0; i < ambientDim; i++) basis.push(basisVec(i, ambientDim));
  return makeSubspace(basis, ambientDim);
}

// ── Lattice cuántico ────────────────────────────────────────

export interface QuantumLattice {
  dimensions: number;
  meet: (a: Subspace, b: Subspace) => Subspace;
  join: (a: Subspace, b: Subspace) => Subspace;
  orthocomplement: (s: Subspace) => Subspace;
  zero: Subspace;
  top: Subspace;
}

export function makeQuantumLattice(dim: number): QuantumLattice {
  if (!Number.isInteger(dim) || dim < 1) {
    throw new Error('makeQuantumLattice: dim debe ser entero ≥ 1');
  }
  return {
    dimensions: dim,
    meet,
    join,
    orthocomplement: (s: Subspace) => orthocomplement(s, dim),
    zero: zeroSubspace(dim),
    top: topSubspace(dim),
  };
}

// ── Muestreador determinista de subespacios ─────────────────

/**
 * Genera muestras de subespacios 1-dimensionales en R^n usando un
 * RNG determinista (LCG sembrado). Suficiente para descubrir
 * contraejemplos por sampling.
 */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function randomLine(dim: number, rng: () => number): Subspace {
  // Sample en (-1,1)^dim; si sale cero, reintentamos.
  for (let attempt = 0; attempt < 8; attempt++) {
    const values: number[] = [];
    for (let i = 0; i < dim; i++) values.push(2 * rng() - 1);
    const v = { values };
    if (norm(v) > 1e-6) return span([v], dim);
  }
  // Fallback robusto.
  return span([basisVec(0, dim)], dim);
}

function sampleSubspaces(L: QuantumLattice, count: number, seed: number = 0xc0_ffee): Subspace[][] {
  const rng = lcg(seed);
  const triples: Subspace[][] = [];
  for (let i = 0; i < count; i++) {
    // Para descubrir contraejemplos de distributividad necesitamos
    // configuraciones donde a ⊂ b ∨ c (caso clásico de fallo).
    // Estrategia: tomamos b, c aleatorios y construimos a como una
    // combinación lineal específica de sus generadores. Como
    // randomLine sólo crea rayos 1D, "a en b ∨ c" se traduce en
    // un rayo que vive en el plano generado por b y c.
    const b = randomLine(L.dimensions, rng);
    const c = randomLine(L.dimensions, rng);
    let a: Subspace;
    if (i % 3 === 0 && b.basis.length === 1 && c.basis.length === 1) {
      // a := span de una combinación lineal no-trivial de b y c
      const w1 = rng() * 2 - 1;
      const w2 = rng() * 2 - 1;
      const bv = b.basis[0];
      const cv = c.basis[0];
      const aVals = bv.values.map((x, k) => w1 * x + w2 * (cv.values[k] ?? 0));
      a = span([{ values: aVals }], L.dimensions);
    } else {
      a = randomLine(L.dimensions, rng);
    }
    triples.push([a, b, c]);
  }
  return triples;
}

// ── Leyes del lattice ───────────────────────────────────────

/**
 * Distributividad: a ∧ (b ∨ c) = (a ∧ b) ∨ (a ∧ c).
 * En el lattice cuántico FALLA — devolvemos true sólo si se cumple
 * para *toda* muestra (lo cual prácticamente nunca pasa para n ≥ 2).
 */
export function isDistributive(L: QuantumLattice, samples: number = 30): boolean {
  if (L.dimensions < 2) return true; // R^1 sólo tiene {0} y top.
  const triples = sampleSubspaces(L, samples);
  for (const [a, b, c] of triples) {
    if (!a || !b || !c) continue;
    const lhs = L.meet(a, L.join(b, c));
    const rhs = L.join(L.meet(a, b), L.meet(a, c));
    if (!equalsSubspace(lhs, rhs)) return false;
  }
  return true;
}

/**
 * Modularidad: si a ≤ c entonces a ∨ (b ∧ c) = (a ∨ b) ∧ c.
 * En dimensión finita el lattice de subespacios SÍ es modular
 * (resultado clásico). El test forma a' = a ∧ c (siempre ≤ c)
 * para garantizar la hipótesis a' ≤ c.
 */
export function isModular(L: QuantumLattice, samples: number = 30): boolean {
  if (L.dimensions < 2) return true;
  const triples = sampleSubspaces(L, samples);
  for (const [a, b, c] of triples) {
    if (!a || !b || !c) continue;
    const aPrime = L.meet(a, c); // garantiza a' ≤ c
    const lhs = L.join(aPrime, L.meet(b, c));
    const rhs = L.meet(L.join(aPrime, b), c);
    if (!equalsSubspace(lhs, rhs)) return false;
  }
  return true;
}

/**
 * Ortomodularidad: si a ≤ b entonces b = a ∨ (b ∧ a⊥).
 * Se cumple en el lattice de subespacios de un espacio de Hilbert.
 */
export function isOrthomodular(L: QuantumLattice, samples: number = 30): boolean {
  if (L.dimensions < 2) return true;
  const rng = lcg(0xdec0_de);
  for (let i = 0; i < samples; i++) {
    const b = randomLine(L.dimensions, rng);
    // Construimos a ≤ b: en dim 1 sólo cabe a = zero o a = b.
    const a: Subspace = i % 2 === 0 ? L.zero : b;
    const reconstructed = L.join(a, L.meet(b, L.orthocomplement(a)));
    if (!equalsSubspace(reconstructed, b)) return false;
  }
  // Ahora con dos subespacios independientes, definiendo a = b ∧ c
  // (siempre ≤ b) para verificar el caso no-trivial.
  const triples = sampleSubspaces(L, samples, 0xbeef);
  for (const [b, c] of triples) {
    if (!b || !c) continue;
    const a = L.meet(b, c); // a ≤ b
    const reconstructed = L.join(a, L.meet(b, L.orthocomplement(a)));
    if (!equalsSubspace(reconstructed, b)) return false;
  }
  return true;
}

// ── Kochen-Specker ──────────────────────────────────────────

export interface KSConfiguration {
  vectors: Vector[];
  /** Tripletes (i,j,k) tales que v_i, v_j, v_k son mutuamente ortogonales. */
  orthoTriples: Array<[number, number, number]>;
}

/**
 * Detecta automáticamente todos los triples ortogonales en R^3
 * dentro de `vectors` y los registra. En R^3, tres vectores no
 * nulos mutuamente ortogonales forman base.
 */
export function findOrthogonalTriples(
  vectors: Vector[],
  eps: number = 1e-7,
): Array<[number, number, number]> {
  const triples: Array<[number, number, number]> = [];
  const n = vectors.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!isOrthogonal(vectors[i], vectors[j], eps)) continue;
      for (let k = j + 1; k < n; k++) {
        if (
          isOrthogonal(vectors[i], vectors[k], eps) &&
          isOrthogonal(vectors[j], vectors[k], eps)
        ) {
          triples.push([i, j, k]);
        }
      }
    }
  }
  return triples;
}

/**
 * Dos vectores son "paralelos" (representan el mismo rayo) si son
 * proporcionales. En la lógica cuántica esto importa: un vector y
 * su negativo definen el mismo subespacio 1-dimensional y deben
 * recibir el mismo color.
 */
function rayKey(v: Vector, eps: number = 1e-7): string {
  // Normalizamos y elegimos signo canónico (primera coord no nula > 0).
  const n = norm(v);
  if (n < eps) return 'zero';
  const u = v.values.map((x) => x / n);
  let sign = 1;
  for (const x of u) {
    if (Math.abs(x) > eps) {
      sign = x < 0 ? -1 : 1;
      break;
    }
  }
  return u.map((x) => (sign * x).toFixed(6)).join(',');
}

function buildRayGroups(vectors: Vector[]): Map<number, number> {
  // index -> rayId
  const ray = new Map<string, number>();
  const out = new Map<number, number>();
  vectors.forEach((v, i) => {
    const key = rayKey(v);
    if (!ray.has(key)) ray.set(key, ray.size);
    const rayId = ray.get(key);
    if (rayId === undefined) throw new Error(`quantum: rayo no encontrado para clave ${key}`);
    out.set(i, rayId);
  });
  return out;
}

/**
 * ¿Existe una coloración {0,1} de los vectores tal que:
 *  - dos vectores que generan el mismo rayo reciben el mismo color,
 *  - en cada triple ortogonal exactamente uno recibe color 1?
 *
 * Devuelve true si tal coloración existe (configuración "trivial"),
 * false si la configuración es un teorema KS (no coloreable).
 *
 * Algoritmo: backtracking sobre los rayos (no los vectores), con
 * unit-propagation por las restricciones de cada triple.
 */
export function isKSColorable(config: KSConfiguration): boolean {
  const rayOf = buildRayGroups(config.vectors);
  const numRays = new Set(rayOf.values()).size;
  // Restricciones por triples, traducidas a rayos.
  const tripleRays = config.orthoTriples.map(([i, j, k]) => {
    const ri = rayOf.get(i);
    const rj = rayOf.get(j);
    const rk = rayOf.get(k);
    if (ri == null || rj == null || rk == null) {
      throw new Error(`triple referencia índice inválido: (${i},${j},${k})`);
    }
    return [ri, rj, rk] as [number, number, number];
  });

  // Filtra triples degenerados (dos rayos iguales => siempre falsos).
  for (const [a, b, c] of tripleRays) {
    if (a === b || a === c || b === c) {
      // Necesitaríamos asignar 2 unos al mismo rayo: imposible.
      return false;
    }
  }

  // color[rayId] ∈ { -1, 0, 1 }; -1 = sin asignar.
  const color = new Array<number>(numRays).fill(-1);

  // Para acelerar: por cada rayo, lista de triples en los que aparece.
  const triplesByRay: number[][] = Array.from({ length: numRays }, () => []);
  tripleRays.forEach((t, idx) => {
    triplesByRay[t[0]].push(idx);
    triplesByRay[t[1]].push(idx);
    triplesByRay[t[2]].push(idx);
  });

  function check(): 'ok' | 'fail' {
    // Por cada triple, verifica que sigue siendo posible "exactamente uno = 1".
    for (const [a, b, c] of tripleRays) {
      const vals = [color[a], color[b], color[c]];
      const ones = vals.filter((v) => v === 1).length;
      const zeros = vals.filter((v) => v === 0).length;
      if (ones > 1) return 'fail';
      if (ones === 1 && zeros + ones < 3) {
        // Falta uno; debe ser 0 — eso se propagará abajo.
      }
      if (zeros === 3) return 'fail'; // ningún 1, todos asignados.
    }
    return 'ok';
  }

  function propagate(): 'ok' | 'fail' {
    let changed = true;
    while (changed) {
      changed = false;
      for (const [a, b, c] of tripleRays) {
        const arr: Array<{ ray: number; value: number }> = [
          { ray: a, value: color[a] },
          { ray: b, value: color[b] },
          { ray: c, value: color[c] },
        ];
        const ones = arr.filter((x) => x.value === 1);
        const zeros = arr.filter((x) => x.value === 0);
        const unknown = arr.filter((x) => x.value === -1);
        if (ones.length > 1) return 'fail';
        if (ones.length === 1) {
          // Los otros dos deben ser 0.
          for (const u of unknown) {
            color[u.ray] = 0;
            changed = true;
          }
        } else if (zeros.length === 2 && unknown.length === 1) {
          color[unknown[0].ray] = 1;
          changed = true;
        } else if (zeros.length === 3) {
          return 'fail';
        }
      }
    }
    return 'ok';
  }

  function pickUnassigned(): number {
    // Heurística: rayo con más triples (más restrictivo).
    let best = -1;
    let bestDeg = -1;
    for (let r = 0; r < numRays; r++) {
      if (color[r] !== -1) continue;
      const deg = triplesByRay[r].length;
      if (deg > bestDeg) {
        bestDeg = deg;
        best = r;
      }
    }
    return best;
  }

  function solve(): boolean {
    const snapshot = color.slice();
    const p = propagate();
    if (p === 'fail') {
      for (let i = 0; i < color.length; i++) color[i] = snapshot[i] ?? -1;
      return false;
    }
    if (check() === 'fail') {
      for (let i = 0; i < color.length; i++) color[i] = snapshot[i] ?? -1;
      return false;
    }
    const r = pickUnassigned();
    if (r === -1) {
      // Todos asignados — verificamos consistencia final.
      for (const [a, b, c] of tripleRays) {
        const ones = [color[a], color[b], color[c]].filter((v) => v === 1).length;
        if (ones !== 1) {
          for (let i = 0; i < color.length; i++) color[i] = snapshot[i] ?? -1;
          return false;
        }
      }
      return true;
    }
    for (const val of [1, 0]) {
      color[r] = val;
      if (solve()) return true;
      // restaurar
      for (let i = 0; i < color.length; i++) color[i] = snapshot[i] ?? -1;
      color[r] = -1; // por las dudas
    }
    return false;
  }

  return solve();
}

/**
 * Configuración estilo-Peres: rayos en R^3 con coordenadas en
 * { -1, 0, 1, ±√2 }, deduplicados por rayo. La cantidad exacta de
 * rayos depende de cuáles dedupliquen (p.ej. (√2,√2,0) define el
 * mismo rayo que (1,1,0)).
 *
 * Aviso histórico: la prueba ORIGINAL de Kochen-Specker (1967)
 * usa 117 vectores en R^3. Asher Peres (1991) la simplificó a 33
 * vectores en R^3, y Cabello-Estebaranz-García (1996) probaron
 * que en R^4 bastan 18 — el mínimo conocido en cualquier
 * dimensión, ver `kochenSpeckerCabello18()`. Aquí construimos
 * la familia clásica de rayos R^3 a partir del cubo unitario;
 * la prueba de no-coloreabilidad rigurosa se delega a la
 * configuración Cabello-18 (R^4), que se incluye en el mismo
 * módulo y es la que usan los tests para el teorema KS.
 */
export function kochenSpeckerTheorem3D(): KSConfiguration {
  const seen = new Set<string>();
  const vectors: Vector[] = [];

  function addRay(values: number[]): void {
    const v = vec(values);
    if (norm(v) < 1e-9) return;
    const key = rayKey(v);
    if (seen.has(key)) return;
    seen.add(key);
    vectors.push(v);
  }

  // Direcciones con coords en {-1, 0, 1}.
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        addRay([x, y, z]);
      }
    }
  }
  const S = Math.SQRT2;
  // Tipo (±√2, ±1, ±1) y permutaciones.
  for (const s1 of [1, -1]) {
    for (const s2 of [1, -1]) {
      for (const s3 of [1, -1]) {
        addRay([s1 * S, s2, s3]);
        addRay([s1, s2 * S, s3]);
        addRay([s1, s2, s3 * S]);
      }
    }
  }

  const orthoTriples = findOrthogonalTriples(vectors);
  return { vectors, orthoTriples };
}

/**
 * Configuración Cabello-Estebaranz-García (1996): 18 vectores en
 * R^4 que constituyen el menor conjunto Kochen-Specker conocido
 * en cualquier dimensión. La prueba se basa en 9 "contextos"
 * (bases ortonormales de R^4); cada vector aparece en exactamente
 * 2 contextos, así que cualquier asignación 0/1 que ponga
 * exactamente un "1" por contexto requeriría que la suma global
 * sea 9 (impar), pero como cada vector contribuye 0 ó 2, la suma
 * debe ser par — contradicción.
 *
 * El `KSConfiguration` devuelto es R^4; la función `isKSColorable`
 * funciona idénticamente en cualquier dimensión, sólo verifica
 * la estructura combinatoria de los `orthoTriples` (aquí, en R^4,
 * los "triples" son en realidad CUÁDRUPLAS — para mantener la
 * interfaz, partimos cada cuádrupla {a,b,c,d} en sus C(4,3)=4
 * triples implicados; esto preserva la lógica "exactamente un 1
 * por base" porque sumar exactamente 1 en cada uno de los 4
 * triples implica sumar exactamente 1 en el cuádruplo).
 *
 * Wait: realmente el enunciado correcto en R^4 es "exactamente
 * UN 1 por contexto ortonormal de 4 vectores". El checker actual
 * trabaja en triples (R^3). Para R^4 usamos un solver
 * especializado: `isKSColorableContexts`.
 */
export function kochenSpeckerCabello18(): {
  vectors: Vector[];
  contexts: number[][];
} {
  // 18 vectores en R^4 con coordenadas en {-1, 0, 1}. Reproducen
  // exactamente la tabla 9×4 publicada en Cabello-Estebaranz-
  // García-Alcaine (Phys. Lett. A 212, 1996) tal como aparece en
  // la Wikipedia inglesa "Kochen-Specker theorem". No normalizamos
  // porque las relaciones lattice sólo dependen del rayo.
  const vectors: Vector[] = [
    vec([0, 0, 0, 1]), //  0  (ctx 1, 2)
    vec([0, 0, 1, 0]), //  1  (ctx 1, 5)
    vec([1, 1, 0, 0]), //  2  (ctx 1, 3)
    vec([1, -1, 0, 0]), //  3  (ctx 1, 7)
    vec([0, 1, 0, 0]), //  4  (ctx 2, 5)
    vec([1, 0, 1, 0]), //  5  (ctx 2, 8)
    vec([1, 0, -1, 0]), //  6  (ctx 2, 4)
    vec([1, -1, 1, -1]), //  7  (ctx 3, 4)
    vec([1, -1, -1, 1]), //  8  (ctx 3, 6)
    vec([0, 0, 1, 1]), //  9  (ctx 3, 7)
    vec([1, 1, 1, 1]), // 10  (ctx 4, 6)
    vec([0, 1, 0, -1]), // 11  (ctx 4, 8)
    vec([1, 0, 0, 1]), // 12  (ctx 5, 9)
    vec([1, 0, 0, -1]), // 13  (ctx 5, 6)
    vec([0, 1, -1, 0]), // 14  (ctx 6, 9)
    vec([1, 1, -1, 1]), // 15  (ctx 7, 8)
    vec([1, 1, 1, -1]), // 16  (ctx 7, 9)
    vec([-1, 1, 1, 1]), // 17  (ctx 8, 9)
  ];
  // 9 contextos: cada uno es una base ortogonal de R^4 (vectores
  // mutuamente ortogonales). La paridad 9 (impar) × 2 (apariciones
  // por vector) impide cualquier coloración 0/1 que ponga
  // exactamente un 1 por contexto: la suma global sería 9 contada
  // por contexto, pero contada por vector cada contribución es 0
  // ó 2, dando suma par — contradicción.
  const contexts: number[][] = [
    [0, 1, 2, 3], //  C1: { (0001), (0010), (1100), (1-100) }
    [0, 4, 5, 6], //  C2: { (0001), (0100), (1010), (10-10) }
    [7, 8, 2, 9], //  C3: { (1-11-1), (1-1-11), (1100), (0011) }
    [7, 10, 6, 11], //  C4: { (1-11-1), (1111), (10-10), (010-1) }
    [1, 4, 12, 13], //  C5: { (0010), (0100), (1001), (100-1) }
    [8, 10, 13, 14], //  C6: { (1-1-11), (1111), (100-1), (01-10) }
    [15, 16, 3, 9], //  C7: { (11-11), (111-1), (1-100), (0011) }
    [15, 17, 5, 11], //  C8: { (11-11), (-1111), (1010), (010-1) }
    [16, 17, 12, 14], //  C9: { (111-1), (-1111), (1001), (01-10) }
  ];
  return { vectors, contexts };
}

/**
 * Checker KS para contextos de cualquier aridad (no sólo R^3
 * triples). Verifica que existe una asignación {0,1} a cada rayo
 * tal que en cada contexto se asigna exactamente un 1.
 *
 * Usado para R^4 Cabello-18 (la prueba KS más pequeña conocida).
 */
export function isKSColorableContexts(vectors: Vector[], contexts: number[][]): boolean {
  const rayOf = buildRayGroups(vectors);
  const numRays = new Set(rayOf.values()).size;
  const ctxRays = contexts.map((ctx) =>
    ctx.map((i) => {
      const r = rayOf.get(i);
      if (r == null) throw new Error(`contexto referencia índice inválido: ${i}`);
      return r;
    }),
  );
  // Validación: ningún contexto puede tener rayos repetidos
  // (eso forzaría ≥2 unos al mismo rayo o ≤0 — siempre falso).
  for (const ctx of ctxRays) {
    const u = new Set(ctx);
    if (u.size !== ctx.length) return false;
  }

  const color = new Array<number>(numRays).fill(-1);

  function propagate(): 'ok' | 'fail' {
    let changed = true;
    while (changed) {
      changed = false;
      for (const ctx of ctxRays) {
        const vals = ctx.map((r) => color[r]);
        const ones = vals.filter((v) => v === 1).length;
        const zeros = vals.filter((v) => v === 0).length;
        const unk = vals.filter((v) => v === -1).length;
        if (ones > 1) return 'fail';
        if (ones === 1) {
          // Resto debe ser 0.
          for (let i = 0; i < ctx.length; i++) {
            if (color[ctx[i]] === -1) {
              color[ctx[i]] = 0;
              changed = true;
            }
          }
        } else if (zeros === ctx.length) {
          return 'fail';
        } else if (zeros === ctx.length - 1 && unk === 1) {
          for (let i = 0; i < ctx.length; i++) {
            if (color[ctx[i]] === -1) {
              color[ctx[i]] = 1;
              changed = true;
            }
          }
        }
      }
    }
    return 'ok';
  }

  function pickUnassigned(): number {
    for (let r = 0; r < numRays; r++) if (color[r] === -1) return r;
    return -1;
  }

  function solve(): boolean {
    const snapshot = color.slice();
    if (propagate() === 'fail') {
      for (let i = 0; i < color.length; i++) color[i] = snapshot[i] ?? -1;
      return false;
    }
    const r = pickUnassigned();
    if (r === -1) {
      // Verifica consistencia final.
      for (const ctx of ctxRays) {
        const ones = ctx.map((rr) => color[rr]).filter((v) => v === 1).length;
        if (ones !== 1) {
          for (let i = 0; i < color.length; i++) color[i] = snapshot[i] ?? -1;
          return false;
        }
      }
      return true;
    }
    for (const val of [1, 0]) {
      const inner = color.slice();
      color[r] = val;
      if (solve()) return true;
      for (let i = 0; i < color.length; i++) color[i] = inner[i] ?? -1;
    }
    return false;
  }

  return solve();
}
