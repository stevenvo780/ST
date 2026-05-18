// ============================================================
// ST Topology — Complejos simpliciales y homología
// ============================================================
//
// Implementa complejos simpliciales abstractos y el cómputo de su
// homología sobre coeficientes en Z/2 y en Z. Calcula característica
// de Euler, números de Betti y factores invariantes (torsión).
//
// Convenciones:
//   • Un simplex se representa como una lista ordenada estrictamente
//     creciente de vértices (índices enteros no negativos). La clave
//     canónica es `v0,v1,...,vk`.
//   • Un complejo es cerrado bajo caras: `addSimplex(K, s)` añade `s`
//     y todas sus subcaras al complejo.
//   • Orientación inducida: la orientación canónica del k-simplex
//     `[v_0,...,v_k]` es la dada por el orden creciente. La cara
//     que omite el vértice i-ésimo tiene signo `(-1)^i` (coeficientes Z)
//     y se usa el conteo de paridad de inversiones para reordenar.
//   • Sobre Z/2 los signos no importan y el operador borde es lineal
//     mod 2.
//
// Resultados clásicos verificados en tests:
//   • Triángulo (1-borde): χ = 0.
//   • Esfera S^2 (borde de tetraedro): β = [1,0,1], χ = 2.
//   • Toro T²: β_{Z/2} = [1,2,1], χ = 0.
//   • Plano proyectivo RP²: β_{Z/2} = [1,1,1], β_Z = [1,0,0]
//     con torsión Z/2 en dimensión 1.

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------

/** Simplex abstracto: lista ordenada ascendente de vértices (enteros). */
export type Simplex = number[];

/** Simplex con signo orientado, usado por el operador borde ∂ sobre Z. */
export interface SignedSimplex {
  sign: 1 | -1;
  simplex: Simplex;
}

/**
 * Complejo simplicial abstracto.
 * Internamente los simplices se indexan por dimensión (`k = |s|-1`) y se
 * almacenan por su clave canónica `v0,v1,...,vk`.
 */
export interface SimplicialComplex {
  vertices: number[];
  simplices: Map<number, Set<string>>;
  dim: number;
}

/**
 * Resultado de un cómputo de homología sobre un complejo simplicial.
 * Incluye números de Betti, característica de Euler y, cuando se trabaja
 * sobre Z, la torsión por dimensión.
 */
export interface HomologyResult {
  dim: number;
  bettiNumbers: number[];
  eulerChar: number;
  torsion?: Record<number, number[]>;
}

// ------------------------------------------------------------
// Utilidades de claves y normalización
// ------------------------------------------------------------

// Clave canónica `v0,v1,...,vk` para un simplex previamente ordenado.
function key(s: Simplex): string {
  return s.join(',');
}

// Decodifica una clave canónica a la lista de vértices.
function parseKey(k: string): Simplex {
  if (k === '') return [];
  return k.split(',').map((x) => Number(x));
}

// Devuelve una copia del simplex ordenada ascendentemente. No muta.
function normalize(s: Simplex): Simplex {
  const out = s.slice();
  out.sort((a, b) => a - b);
  // Eliminar duplicados — un "simplex" con vértices repetidos no es válido.
  for (let i = 1; i < out.length; i++) {
    if (out[i] === out[i - 1]) {
      throw new Error(`simplex con vértices repetidos: ${s.join(',')}`);
    }
  }
  return out;
}

// ------------------------------------------------------------
// API de construcción
// ------------------------------------------------------------

/** Crea un complejo simplicial vacío (sin vértices ni simplices). */
export function makeComplex(): SimplicialComplex {
  return {
    vertices: [],
    simplices: new Map(),
    dim: -1,
  };
}

/**
 * Añade un simplex `s` y todas sus caras al complejo `K` (cierre hacia abajo).
 * El simplex se normaliza a orden creciente antes de insertarse.
 * @throws si `s` contiene vértices repetidos.
 */
export function addSimplex(K: SimplicialComplex, s: Simplex): void {
  const sorted = normalize(s);
  const k = sorted.length - 1;
  if (k < 0) return; // simplex vacío: nada que añadir

  // Añadir todos los subsimplices (powerset no vacío).
  const n = sorted.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const sub: Simplex = [];
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        const v = sorted[i];
        if (v !== undefined) sub.push(v);
      }
    }
    const dim = sub.length - 1;
    const kk = key(sub);
    let bucket = K.simplices.get(dim);
    if (!bucket) {
      bucket = new Set<string>();
      K.simplices.set(dim, bucket);
    }
    bucket.add(kk);
    if (dim === 0) {
      const v = sub[0];
      if (v !== undefined && !K.vertices.includes(v)) {
        K.vertices.push(v);
      }
    }
  }

  if (k > K.dim) K.dim = k;
}

// ------------------------------------------------------------
// Caras y operador borde
// ------------------------------------------------------------

/**
 * Devuelve las caras directas (codimensión 1) del k-simplex `s`.
 * Un k-simplex tiene exactamente k+1 caras. Devuelve `[]` para 0-simplices.
 */
export function faces(s: Simplex): Simplex[] {
  if (s.length <= 1) return [];
  const out: Simplex[] = [];
  for (let i = 0; i < s.length; i++) {
    const face: Simplex = [];
    for (let j = 0; j < s.length; j++) {
      if (j !== i) {
        const v = s[j];
        if (v !== undefined) face.push(v);
      }
    }
    out.push(face);
  }
  return out;
}

/** Operador borde ∂ sobre Z/2 (coeficientes en F₂): lista de caras sin signos. */
export function boundaryZ2(simplex: Simplex): Simplex[] {
  return faces(simplex);
}

/**
 * Operador borde ∂ sobre Z: devuelve cada cara con signo `(-1)^i`, donde `i`
 * es el índice del vértice omitido en el orden canónico del simplex.
 */
export function boundaryZ(simplex: Simplex): SignedSimplex[] {
  if (simplex.length <= 1) return [];
  const out: SignedSimplex[] = [];
  for (let i = 0; i < simplex.length; i++) {
    const face: Simplex = [];
    for (let j = 0; j < simplex.length; j++) {
      if (j !== i) {
        const v = simplex[j];
        if (v !== undefined) face.push(v);
      }
    }
    const sign: 1 | -1 = i % 2 === 0 ? 1 : -1;
    out.push({ sign, simplex: face });
  }
  return out;
}

// ------------------------------------------------------------
// Invariantes elementales
// ------------------------------------------------------------

/** Dimensión del complejo simplicial (el mayor k tal que K contiene un k-simplex, o -1 si está vacío). */
export function dimension(K: SimplicialComplex): number {
  return K.dim;
}

/**
 * f-vector del complejo: `f[i]` = número de i-simplices, para i = 0..dim.
 * @example fVector(nSimplex(2)) // [3, 3, 1] (triángulo lleno)
 */
export function fVector(K: SimplicialComplex): number[] {
  const out: number[] = [];
  for (let i = 0; i <= K.dim; i++) {
    out.push(K.simplices.get(i)?.size ?? 0);
  }
  return out;
}

/**
 * Característica de Euler: χ = ∑ (-1)^i f_i.
 * Invariante topológico (S² → 2, T² → 0, RP² → 1).
 */
export function eulerCharacteristic(K: SimplicialComplex): number {
  const f = fVector(K);
  let chi = 0;
  for (let i = 0; i < f.length; i++) {
    const fi = f[i];
    if (fi === undefined) continue;
    chi += (i % 2 === 0 ? 1 : -1) * fi;
  }
  return chi;
}

// ------------------------------------------------------------
// Matriz borde y rango sobre F_2
// ------------------------------------------------------------

// Lista ordenada (estable) de los simplices de dimensión `d`.
function orderedSimplices(K: SimplicialComplex, d: number): string[] {
  const bucket = K.simplices.get(d);
  if (!bucket) return [];
  const arr = Array.from(bucket);
  arr.sort();
  return arr;
}

// Construye la matriz del operador ∂_d : C_d → C_{d-1} sobre Z/2.
// Filas = simplices de dim d-1, columnas = simplices de dim d.
function boundaryMatrixZ2(K: SimplicialComplex, d: number): number[][] {
  if (d <= 0) return [];
  const cols = orderedSimplices(K, d);
  const rows = orderedSimplices(K, d - 1);
  const rowIndex = new Map<string, number>();
  rows.forEach((k, i) => rowIndex.set(k, i));

  const M: number[][] = Array.from({ length: rows.length }, () =>
    new Array<number>(cols.length).fill(0),
  );
  for (let c = 0; c < cols.length; c++) {
    const colKey = cols[c];
    if (colKey === undefined) continue;
    const simplex = parseKey(colKey);
    for (const f of faces(simplex)) {
      const idx = rowIndex.get(key(f));
      if (idx !== undefined) {
        const row = M[idx];
        if (row) row[c] ^= 1;
      }
    }
  }
  return M;
}

// Rango sobre F_2 vía eliminación gaussiana mod 2.
function rankF2(M: number[][]): number {
  const rows = M.length;
  if (rows === 0) return 0;
  const first = M[0];
  const cols = first ? first.length : 0;
  if (cols === 0) return 0;

  // Copia mutable.
  const A: number[][] = M.map((r) => r.slice());
  let rank = 0;
  let col = 0;
  for (let r = 0; r < rows && col < cols; col++) {
    // Buscar pivote en columna `col` a partir de fila `r`.
    let pivot = -1;
    for (let i = r; i < rows; i++) {
      const rowA = A[i];
      if (rowA && rowA[col] === 1) {
        pivot = i;
        break;
      }
    }
    if (pivot === -1) continue;
    // Swap.
    if (pivot !== r) {
      const tmp = A[r];
      const piv = A[pivot];
      if (tmp && piv) {
        A[r] = piv;
        A[pivot] = tmp;
      }
    }
    // Eliminar abajo Y arriba (forma reducida no es necesaria para rango,
    // pero limpiar arriba simplifica razonar).
    const pivotRow = A[r];
    if (!pivotRow) continue;
    for (let i = 0; i < rows; i++) {
      if (i === r) continue;
      const rowI = A[i];
      if (rowI && rowI[col] === 1) {
        for (let j = col; j < cols; j++) {
          const pv = pivotRow[j] ?? 0;
          rowI[j] = (rowI[j] ?? 0) ^ pv;
        }
      }
    }
    r++;
    rank++;
  }
  return rank;
}

/** Rango del operador borde ∂_d : C_d → C_{d-1} sobre F₂. */
export function rankBoundaryZ2(K: SimplicialComplex, dim: number): number {
  if (dim <= 0) return 0;
  const M = boundaryMatrixZ2(K, dim);
  return rankF2(M);
}

/**
 * Número de Betti β_d sobre Z/2 (F₂).
 * β_d = dim ker ∂_d − dim im ∂_{d+1} = n_d − rank ∂_d − rank ∂_{d+1}.
 */
export function bettiNumberZ2(K: SimplicialComplex, dim: number): number {
  if (dim < 0) return 0;
  const nd = K.simplices.get(dim)?.size ?? 0;
  const rankD = rankBoundaryZ2(K, dim);
  const rankD1 = rankBoundaryZ2(K, dim + 1);
  return nd - rankD - rankD1;
}

// ------------------------------------------------------------
// Smith Normal Form sobre Z
// ------------------------------------------------------------

// Matriz borde ∂_d sobre Z (con signos). Filas = simplices dim d-1,
// columnas = simplices dim d.
function boundaryMatrixZ(K: SimplicialComplex, d: number): number[][] {
  if (d <= 0) return [];
  const cols = orderedSimplices(K, d);
  const rows = orderedSimplices(K, d - 1);
  const rowIndex = new Map<string, number>();
  rows.forEach((k, i) => rowIndex.set(k, i));

  const M: number[][] = Array.from({ length: rows.length }, () =>
    new Array<number>(cols.length).fill(0),
  );
  for (let c = 0; c < cols.length; c++) {
    const colKey = cols[c];
    if (colKey === undefined) continue;
    const simplex = parseKey(colKey);
    for (const { sign, simplex: f } of boundaryZ(simplex)) {
      const idx = rowIndex.get(key(f));
      if (idx !== undefined) {
        const row = M[idx];
        if (row) row[c] = (row[c] ?? 0) + sign;
      }
    }
  }
  return M;
}

function absGcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Forma Normal de Smith sobre Z para una matriz entera.
 * Devuelve la SNF (diagonal con factores invariantes d₁ | d₂ | … | dᵣ, resto ceros),
 * el rango (número de pivotes no nulos) y la dimensión del kernel (cols − rankIm).
 * Algoritmo: reducción iterativa estilo Bareiss/Euclídea sobre filas y columnas.
 */
export function smithNormalForm(matrix: number[][]): {
  snf: number[][];
  rankIm: number;
  rankKer: number;
  invariants: number[];
} {
  const rows = matrix.length;
  const firstRow = matrix[0];
  const cols = firstRow ? firstRow.length : 0;

  // Copia profunda.
  const A: number[][] = matrix.map((r) => r.slice());
  if (rows === 0 || cols === 0) {
    return {
      snf: A,
      rankIm: 0,
      rankKer: cols,
      invariants: [],
    };
  }

  const rowSwap = (i: number, j: number): void => {
    if (i === j) return;
    const ri = A[i];
    const rj = A[j];
    if (ri && rj) {
      A[i] = rj;
      A[j] = ri;
    }
  };
  const colSwap = (i: number, j: number): void => {
    if (i === j) return;
    for (let r = 0; r < rows; r++) {
      const row = A[r];
      if (!row) continue;
      const tmp = row[i] ?? 0;
      row[i] = row[j] ?? 0;
      row[j] = tmp;
    }
  };
  const rowMulNeg = (i: number): void => {
    const row = A[i];
    if (!row) return;
    for (let c = 0; c < cols; c++) row[c] = -(row[c] ?? 0);
  };
  const rowAddMul = (target: number, source: number, k: number): void => {
    // A[target] += k * A[source]
    const rt = A[target];
    const rs = A[source];
    if (!rt || !rs) return;
    for (let c = 0; c < cols; c++) rt[c] = (rt[c] ?? 0) + k * (rs[c] ?? 0);
  };
  const colAddMul = (target: number, source: number, k: number): void => {
    // A[:, target] += k * A[:, source]
    for (let r = 0; r < rows; r++) {
      const row = A[r];
      if (!row) continue;
      row[target] = (row[target] ?? 0) + k * (row[source] ?? 0);
    }
  };

  let pivot = 0;
  while (pivot < Math.min(rows, cols)) {
    // 1) Encontrar entrada no nula en el bloque [pivot..rows-1, pivot..cols-1]
    let found = false;
    let pi = pivot;
    let pj = pivot;
    let best = Infinity;
    for (let i = pivot; i < rows; i++) {
      const row = A[i];
      if (!row) continue;
      for (let j = pivot; j < cols; j++) {
        const v = row[j] ?? 0;
        if (v !== 0) {
          const av = Math.abs(v);
          if (av < best) {
            best = av;
            pi = i;
            pj = j;
            found = true;
          }
        }
      }
    }
    if (!found) break;

    rowSwap(pivot, pi);
    colSwap(pivot, pj);

    // 2) Reducir entrada por entrada en la fila y columna del pivote
    //    hasta que sólo quede el pivote en su cruz.
    let changed = true;
    while (changed) {
      changed = false;
      const rowP = A[pivot];
      if (!rowP) break;
      const piv = rowP[pivot] ?? 0;
      if (piv === 0) break;

      // Limpiar columna del pivote (debajo y arriba).
      for (let i = 0; i < rows; i++) {
        if (i === pivot) continue;
        const row = A[i];
        if (!row) continue;
        const v = row[pivot] ?? 0;
        if (v === 0) continue;
        const q = Math.trunc(v / piv);
        if (q !== 0) {
          rowAddMul(i, pivot, -q);
        }
        const rem = row[pivot] ?? 0;
        if (rem !== 0) {
          // swap y volver a iterar para hacer Euclides en columna.
          rowSwap(i, pivot);
          changed = true;
          break;
        }
      }
      if (changed) continue;

      // Limpiar fila del pivote (derecha e izquierda).
      const pivRow2 = A[pivot];
      if (!pivRow2) break;
      const piv2 = pivRow2[pivot] ?? 0;
      if (piv2 === 0) break;
      for (let j = 0; j < cols; j++) {
        if (j === pivot) continue;
        const v = pivRow2[j] ?? 0;
        if (v === 0) continue;
        const q = Math.trunc(v / piv2);
        if (q !== 0) {
          colAddMul(j, pivot, -q);
        }
        const rem = pivRow2[j] ?? 0;
        if (rem !== 0) {
          colSwap(j, pivot);
          changed = true;
          break;
        }
      }
      if (changed) continue;

      // 3) Asegurar que el pivote divide a todas las entradas restantes.
      //    Si no, sumar la fila ofensiva al pivote para reducir el pivote
      //    a un gcd más chico y volver a iterar.
      const pivVal = A[pivot]?.[pivot] ?? 0;
      if (pivVal === 0) break;
      const absPiv = Math.abs(pivVal);
      let divides = true;
      outer: for (let i = pivot + 1; i < rows; i++) {
        const row = A[i];
        if (!row) continue;
        for (let j = pivot + 1; j < cols; j++) {
          const v = row[j] ?? 0;
          if (v !== 0 && v % absPiv !== 0) {
            // Llevar esa fila a la del pivote y reiniciar.
            rowAddMul(pivot, i, 1);
            divides = false;
            break outer;
          }
        }
      }
      if (!divides) {
        changed = true;
        continue;
      }
    }

    // Asegurar signo no negativo del pivote (convención positiva).
    const pivVal = A[pivot]?.[pivot] ?? 0;
    if (pivVal < 0) rowMulNeg(pivot);

    pivot++;
  }

  // Recoger factores invariantes en la diagonal.
  const invariants: number[] = [];
  const limit = Math.min(rows, cols);
  for (let i = 0; i < limit; i++) {
    const v = A[i]?.[i] ?? 0;
    if (v !== 0) invariants.push(Math.abs(v));
  }
  // Por construcción ya quedan en orden de divisibilidad creciente,
  // pero re-canonicalizamos: sort y luego ajustamos divisibilidad si
  // fuera necesario (no debería).
  invariants.sort((a, b) => a - b);
  // Asegurar divisibilidad d_i | d_{i+1}. Si no, "propagar" via gcd/lcm
  // — caso raro, pero blindamos.
  for (let i = 0; i < invariants.length - 1; i++) {
    const a = invariants[i] ?? 0;
    const b = invariants[i + 1] ?? 0;
    const g = absGcd(a, b);
    if (g !== a) {
      const l = (a * b) / g;
      invariants[i] = g;
      invariants[i + 1] = l;
    }
  }

  return {
    snf: A,
    rankIm: invariants.length,
    rankKer: cols - invariants.length,
    invariants,
  };
}

// ------------------------------------------------------------
// Homología sobre Z
// ------------------------------------------------------------

/**
 * Número de Betti β_d sobre Z (parte libre de la homología H_d).
 * β_d = rank ker ∂_d − rank im ∂_{d+1}, equivalente a contar copias de Z en H_d.
 */
export function bettiNumberZ(K: SimplicialComplex, dim: number): number {
  if (dim < 0) return 0;
  const nd = K.simplices.get(dim)?.size ?? 0;
  const Md = boundaryMatrixZ(K, dim);
  const Md1 = boundaryMatrixZ(K, dim + 1);
  const rankD = Md.length === 0 ? 0 : smithNormalForm(Md).rankIm;
  const rankD1 = Md1.length === 0 ? 0 : smithNormalForm(Md1).rankIm;
  // ker ∂_d = nd - rankD
  return nd - rankD - rankD1;
}

/**
 * Factores invariantes (> 1) de la torsión de H_d sobre Z.
 * H_d = Z^{β_d} ⊕ ⊕ᵢ Z/dᵢ, con d₁ | d₂ | … | dₖ, dᵢ > 1.
 * Ejemplo: RP² tiene torsión [2] en dimensión 1.
 */
export function torsionZ(K: SimplicialComplex, dim: number): number[] {
  if (dim < 0) return [];
  const M = boundaryMatrixZ(K, dim + 1);
  if (M.length === 0) return [];
  const { invariants } = smithNormalForm(M);
  return invariants.filter((d) => d > 1);
}

// ------------------------------------------------------------
// Complejos estándar
// ------------------------------------------------------------

/**
 * Complejo del n-simplex completo: todos los subconjuntos no vacíos de {0,…,n}.
 * `nSimplex(2)` da un triángulo relleno (2-cara incluida), no solo su borde.
 */
export function nSimplex(n: number): SimplicialComplex {
  const K = makeComplex();
  if (n < 0) return K;
  const verts: number[] = [];
  for (let i = 0; i <= n; i++) verts.push(i);
  addSimplex(K, verts);
  return K;
}

/**
 * Triangulación canónica de la esfera S^n (frontera del (n+1)-simplex).
 * `spheres(2)` = borde del tetraedro: 4 vértices, 6 aristas, 4 triángulos; χ = 2.
 */
export function spheres(n: number): SimplicialComplex {
  const K = makeComplex();
  if (n < 0) {
    // S^{-1} = ∅ por convención de algunos textos; aquí devolvemos vacío.
    return K;
  }
  // Vértices 0..n+1.
  const verts: number[] = [];
  for (let i = 0; i <= n + 1; i++) verts.push(i);
  // Añadir todos los subsimplices de tamaño n+1 (es decir, dimensión n).
  // Cada uno es el complemento de un vértice.
  for (let omit = 0; omit < verts.length; omit++) {
    const face = verts.filter((_, i) => i !== omit);
    addSimplex(K, face);
  }
  return K;
}

/**
 * Triangulación del toro T² (cuadrado 3×3 con identificaciones a b a⁻¹ b⁻¹).
 * 9 vértices, 27 aristas, 18 triángulos. χ = 0, β_{Z/2} = [1,2,1].
 */
export function torus2(): SimplicialComplex {
  const K = makeComplex();
  // Mapeo (i, j) ∈ Z₃ × Z₃ → índice 3*i + j ∈ {0..8}
  const v = (i: number, j: number): number => 3 * (((i % 3) + 3) % 3) + (((j % 3) + 3) % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const a = v(i, j);
      const b = v(i + 1, j);
      const c = v(i, j + 1);
      const d = v(i + 1, j + 1);
      // Dos triángulos por celda: (a,b,d) y (a,d,c).
      addSimplex(K, [a, b, d]);
      addSimplex(K, [a, d, c]);
    }
  }
  return K;
}

/**
 * Triangulación mínima del plano proyectivo real RP² (6 vértices, 15 aristas, 10 triángulos).
 * β_Z = [1,0,0] con torsión Z/2 en dimensión 1; β_{Z/2} = [1,1,1]; χ = 1.
 */
export function projectivePlane(): SimplicialComplex {
  const K = makeComplex();
  const triangles: Simplex[] = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 5],
    [0, 1, 5],
    [1, 2, 4],
    [2, 3, 5],
    [1, 3, 4],
    [1, 3, 5],
    [2, 4, 5],
  ];
  for (const t of triangles) addSimplex(K, t);
  return K;
}

/**
 * Triangulación de la botella de Klein (cuadrado 3×3 con identificaciones a b a b⁻¹).
 * 9 vértices; χ = 0; β_Z = [1,1,0]; torsión Z/2 en dim 1.
 */
export function kleinBottle(): SimplicialComplex {
  const K = makeComplex();
  // v(i, j) representa el vértice (i mod 3, j mod 3) con flip al cruzar
  // la dirección i: (3, j) ↦ (0, 2 - j).
  const v = (i: number, j: number): number => {
    let ii = i;
    let jj = j;
    // Reducir i a [0,3): cada vez que i cruza el borde superior,
    // se invierte la coordenada j (flip).
    while (ii >= 3) {
      ii -= 3;
      jj = 2 - jj;
    }
    while (ii < 0) {
      ii += 3;
      jj = 2 - jj;
    }
    jj = ((jj % 3) + 3) % 3;
    return 3 * ii + jj;
  };
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const a = v(i, j);
      const b = v(i + 1, j);
      const c = v(i, j + 1);
      const d = v(i + 1, j + 1);
      addSimplex(K, [a, b, d]);
      addSimplex(K, [a, d, c]);
    }
  }
  return K;
}

// ------------------------------------------------------------
// Cómputo completo de homología
// ------------------------------------------------------------

/**
 * Cómputo completo de homología de `K` con coeficientes en Z/2 o Z.
 * Devuelve números de Betti, característica de Euler y (si Z) la torsión por dimensión.
 * @param coefficients `'Z2'` para F₂ (defecto) o `'Z'` para coeficientes enteros.
 */
export function computeHomology(
  K: SimplicialComplex,
  coefficients: 'Z2' | 'Z' = 'Z2',
): HomologyResult {
  const d = K.dim;
  const bettiNumbers: number[] = [];
  if (coefficients === 'Z2') {
    for (let i = 0; i <= d; i++) bettiNumbers.push(bettiNumberZ2(K, i));
    return {
      dim: d,
      bettiNumbers,
      eulerChar: eulerCharacteristic(K),
    };
  }
  // Z
  const torsion: Record<number, number[]> = {};
  for (let i = 0; i <= d; i++) {
    bettiNumbers.push(bettiNumberZ(K, i));
    const t = torsionZ(K, i);
    if (t.length > 0) torsion[i] = t;
  }
  return {
    dim: d,
    bettiNumbers,
    eulerChar: eulerCharacteristic(K),
    torsion,
  };
}
