// ============================================================
// Proof Nets — Criterio de corrección de Danos-Regnier
// ============================================================
//
// Un net MLL es correcto sii para toda elección de "switch" sobre
// los par-links (cada ⅋ elige una de sus dos premisas para
// conservar la arista hacia la conclusión, descartando la otra),
// el grafo resultante es:
//
//   - acíclico, y
//   - conexo.
//
// Los demás links contribuyen aristas de forma fija:
//   axiom  : una arista entre sus dos nodos.
//   cut    : una arista entre sus dos nodos.
//   tensor : dos aristas (premisa-izq — conclusión, premisa-der — conclusión).
//   par    : sólo UNA arista por switch (conclusión — premisa elegida).
//
// La validación enumera los 2^(#par) switches. Para MLL el número
// de par-links en una prueba típica es bajo; si fuera grande, el
// criterio se puede reformular en tiempo lineal (algoritmo de
// Guerrini), pero queda fuera del alcance educativo aquí.
//
// Además validamos consistencia local del net antes del criterio:
//   - ports de cada link existen.
//   - axiom/cut conectan fórmulas duales.
//   - tensor/par conectan {A, B, A⊗B} resp. {A, B, A⅋B}.
//   - cada nodo tiene la "valencia" correcta (los átomos terminan
//     en exactamente un axiom o cut; los compuestos son
//     premisa/conclusión de su link).

import { type MLLFormula, type ProofNet, dual, formulaEquals } from './types';

// ---------- Validación estructural ----------

interface NodeIndex {
  formula: MLLFormula;
}

function indexNodes(net: ProofNet): Map<number, NodeIndex> | null {
  const idx = new Map<number, NodeIndex>();
  for (const n of net.nodes) {
    if (idx.has(n.id)) return null; // ids duplicados
    idx.set(n.id, { formula: n.formula });
  }
  return idx;
}

function structurallyValid(net: ProofNet): boolean {
  const idx = indexNodes(net);
  if (!idx) return false;
  for (const link of net.links) {
    for (const p of link.ports) {
      if (!idx.has(p)) return false;
    }
    if (link.kind === 'axiom' || link.kind === 'cut') {
      if (link.ports.length !== 2) return false;
      const [a, b] = link.ports as [number, number];
      const fa = idx.get(a)!.formula;
      const fb = idx.get(b)!.formula;
      if (!formulaEquals(fa, dual(fb))) return false;
    } else {
      if (link.ports.length !== 3) return false;
      const [l, r, c] = link.ports as [number, number, number];
      const fc = idx.get(c)!.formula;
      const fl = idx.get(l)!.formula;
      const fr = idx.get(r)!.formula;
      if (fc.kind !== link.kind) return false;
      if (!formulaEquals(fc.left, fl) || !formulaEquals(fc.right, fr)) return false;
    }
  }

  // Valencia mínima: cada átomo debe ser hoja de un axiom o de un
  // cut. Sin esa condición un átomo "huérfano" pasaría el criterio
  // DR trivialmente (1 componente, sin ciclos) pero no representa
  // una prueba: lo rechazamos a nivel estructural.
  const conclusionsSet = new Set(net.conclusions);
  for (const node of net.nodes) {
    if (node.formula.kind !== 'atom') continue;
    let touches = 0;
    for (const link of net.links) {
      if ((link.kind === 'axiom' || link.kind === 'cut') && link.ports.includes(node.id)) {
        touches++;
      }
    }
    if (touches !== 1) {
      // Excepción didáctica: si el único uso restante es como
      // premisa de un tensor/par del cual es hoja, tampoco es
      // válido — debe terminar en axiom/cut.
      return false;
    }
  }
  // Suprimimos `conclusionsSet` (declarado por simetría con
  // futuras extensiones para validar conclusiones explícitas).
  void conclusionsSet;
  return true;
}

// ---------- Edges por link según switching ----------

type Edge = readonly [number, number];

function edgesForSwitching(net: ProofNet, switching: boolean[]): Edge[] {
  // `switching[i]` = elección del i-ésimo par-link (true = izquierda).
  const edges: Edge[] = [];
  let parIndex = 0;
  for (const link of net.links) {
    switch (link.kind) {
      case 'axiom':
      case 'cut': {
        const [a, b] = link.ports as [number, number];
        edges.push([a, b]);
        break;
      }
      case 'tensor': {
        const [l, r, c] = link.ports as [number, number, number];
        edges.push([l, c]);
        edges.push([r, c]);
        break;
      }
      case 'par': {
        const [l, r, c] = link.ports as [number, number, number];
        const chooseLeft = switching[parIndex++];
        edges.push([chooseLeft ? l : r, c]);
        break;
      }
    }
  }
  return edges;
}

// ---------- Acíclico + conexo por Union-Find ----------

class UnionFind {
  private parent: Map<number, number> = new Map();
  private rank: Map<number, number> = new Map();
  add(x: number) {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
  }
  find(x: number): number {
    let p = this.parent.get(x)!;
    if (p !== x) {
      p = this.find(p);
      this.parent.set(x, p);
    }
    return p;
  }
  // Devuelve `false` si los nodos ya estaban en la misma componente
  // (=> añadir la arista crearía un ciclo).
  union(x: number, y: number): boolean {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx === ry) return false;
    const rkx = this.rank.get(rx)!;
    const rky = this.rank.get(ry)!;
    if (rkx < rky) this.parent.set(rx, ry);
    else if (rkx > rky) this.parent.set(ry, rx);
    else {
      this.parent.set(ry, rx);
      this.rank.set(rx, rkx + 1);
    }
    return true;
  }
  components(): number {
    const roots = new Set<number>();
    for (const x of this.parent.keys()) roots.add(this.find(x));
    return roots.size;
  }
}

function switchingIsTree(net: ProofNet, edges: Edge[]): boolean {
  const uf = new UnionFind();
  for (const n of net.nodes) uf.add(n.id);
  for (const [a, b] of edges) {
    if (!uf.union(a, b)) return false; // ciclo
  }
  return uf.components() === 1;
}

// ---------- Enumeración de switchings ----------

function countParLinks(net: ProofNet): number {
  let n = 0;
  for (const l of net.links) if (l.kind === 'par') n++;
  return n;
}

export function isCorrect(net: ProofNet): boolean {
  if (!structurallyValid(net)) return false;

  // Net vacío: trivialmente correcto sólo si no tiene nodos.
  if (net.nodes.length === 0) return net.links.length === 0;

  const k = countParLinks(net);
  // 2^k switchings; protección anti-explosión para tests didácticos.
  // Con k>20 cualquier net razonable ya excede el alcance educativo.
  if (k > 20) return false;

  const total = 1 << k;
  for (let mask = 0; mask < total; mask++) {
    const switching: boolean[] = [];
    for (let i = 0; i < k; i++) switching.push(((mask >> i) & 1) === 1);
    const edges = edgesForSwitching(net, switching);
    if (!switchingIsTree(net, edges)) return false;
  }
  return true;
}
