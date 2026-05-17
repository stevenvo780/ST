import { describe, it, expect } from 'vitest';
import {
  addEdge,
  addVertex,
  areIsomorphic,
  articulationPoints,
  bellmanFord,
  bfs,
  bipartiteMaximumMatching,
  bridges,
  chromaticNumber,
  connectedComponents,
  dfs,
  dijkstra,
  findIsomorphism,
  floydWarshall,
  greedyColoring,
  hopcroftKarp,
  inDegree,
  isConnected,
  kruskal,
  makeGraph,
  neighbors,
  outDegree,
  prim,
  stronglyConnectedComponents,
  topologicalSort,
  type Graph,
} from '../../../reasoning/graph-theory';

// Helpers
function pathGraph(n: number, directed = false): Graph<number> {
  const G = makeGraph<number>(directed);
  for (let i = 0; i < n; i++) addVertex(G, i);
  for (let i = 0; i < n - 1; i++) addEdge(G, { from: i, to: i + 1, weight: 1 });
  return G;
}

function cycleGraph(n: number, directed = false): Graph<number> {
  const G = makeGraph<number>(directed);
  for (let i = 0; i < n; i++) addVertex(G, i);
  for (let i = 0; i < n; i++) addEdge(G, { from: i, to: (i + 1) % n, weight: 1 });
  return G;
}

function completeGraph(n: number): Graph<number> {
  const G = makeGraph<number>(false);
  for (let i = 0; i < n; i++) addVertex(G, i);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      addEdge(G, { from: i, to: j, weight: 1 });
    }
  }
  return G;
}

// ------------------------------------------------------------
// 1. Construcción
// ------------------------------------------------------------
describe('graph-theory / construcción', () => {
  it('makeGraph inicializa vacío', () => {
    const G = makeGraph<string>();
    expect(G.vertices.size).toBe(0);
    expect(G.edges.length).toBe(0);
    expect(G.directed).toBe(false);
  });

  it('addEdge añade extremos como vértices', () => {
    const G = makeGraph<string>();
    addEdge(G, { from: 'a', to: 'b', weight: 2 });
    expect(G.vertices.has('a')).toBe(true);
    expect(G.vertices.has('b')).toBe(true);
    expect(G.edges.length).toBe(1);
  });

  it('neighbors respeta dirección', () => {
    const G = makeGraph<number>(true);
    addEdge(G, { from: 1, to: 2 });
    expect(neighbors(G, 1)).toEqual([2]);
    expect(neighbors(G, 2)).toEqual([]);
  });

  it('inDegree/outDegree en grafo dirigido', () => {
    const G = makeGraph<number>(true);
    addEdge(G, { from: 1, to: 2 });
    addEdge(G, { from: 3, to: 2 });
    expect(inDegree(G, 2)).toBe(2);
    expect(outDegree(G, 2)).toBe(0);
    expect(outDegree(G, 1)).toBe(1);
  });
});

// ------------------------------------------------------------
// 2. Recorridos
// ------------------------------------------------------------
describe('graph-theory / recorridos', () => {
  it('BFS visita en orden de niveles', () => {
    // Grafo:  0 - 1 - 3
    //         |   |
    //         2 - 4
    const G = makeGraph<number>();
    addEdge(G, { from: 0, to: 1 });
    addEdge(G, { from: 0, to: 2 });
    addEdge(G, { from: 1, to: 3 });
    addEdge(G, { from: 1, to: 4 });
    addEdge(G, { from: 2, to: 4 });
    const order = bfs(G, 0);
    expect(order[0]).toBe(0);
    // Nivel 1 debe ser {1, 2} antes que {3, 4}.
    const idx = new Map(order.map((v, i) => [v, i] as const));
    expect(idx.get(1)!).toBeLessThan(idx.get(3)!);
    expect(idx.get(2)!).toBeLessThan(idx.get(3)!);
    expect(idx.get(1)!).toBeLessThan(idx.get(4)!);
  });

  it('DFS recorre en profundidad', () => {
    const G = pathGraph(5);
    const order = dfs(G, 0);
    // Path 0-1-2-3-4: DFS desde 0 debe visitar todos en orden creciente.
    expect(order).toEqual([0, 1, 2, 3, 4]);
  });

  it('topologicalSort en DAG válido', () => {
    const G = makeGraph<number>(true);
    addEdge(G, { from: 1, to: 2 });
    addEdge(G, { from: 1, to: 3 });
    addEdge(G, { from: 2, to: 4 });
    addEdge(G, { from: 3, to: 4 });
    const order = topologicalSort(G);
    expect(order).not.toBe('has-cycle');
    if (order === 'has-cycle') return;
    const idx = new Map(order.map((v, i) => [v, i] as const));
    expect(idx.get(1)!).toBeLessThan(idx.get(2)!);
    expect(idx.get(1)!).toBeLessThan(idx.get(3)!);
    expect(idx.get(2)!).toBeLessThan(idx.get(4)!);
    expect(idx.get(3)!).toBeLessThan(idx.get(4)!);
  });

  it('topologicalSort detecta ciclo', () => {
    const G = makeGraph<number>(true);
    addEdge(G, { from: 1, to: 2 });
    addEdge(G, { from: 2, to: 3 });
    addEdge(G, { from: 3, to: 1 });
    expect(topologicalSort(G)).toBe('has-cycle');
  });
});

// ------------------------------------------------------------
// 3. Conectividad
// ------------------------------------------------------------
describe('graph-theory / conectividad', () => {
  it('connectedComponents identifica 2 componentes', () => {
    const G = makeGraph<number>();
    addEdge(G, { from: 1, to: 2 });
    addEdge(G, { from: 3, to: 4 });
    addVertex(G, 5);
    const comps = connectedComponents(G);
    expect(comps.length).toBe(3);
    const sizes = comps.map((c) => c.length).sort((a, b) => a - b);
    expect(sizes).toEqual([1, 2, 2]);
  });

  it('isConnected en path', () => {
    expect(isConnected(pathGraph(5))).toBe(true);
  });

  it('SCC de Tarjan con 2 SCC en grafo dirigido', () => {
    // SCC 1: {1, 2, 3} (ciclo) ; SCC 2: {4} ; arista 3 -> 4 no fuerte.
    const G = makeGraph<number>(true);
    addEdge(G, { from: 1, to: 2 });
    addEdge(G, { from: 2, to: 3 });
    addEdge(G, { from: 3, to: 1 });
    addEdge(G, { from: 3, to: 4 });
    const sccs = stronglyConnectedComponents(G);
    expect(sccs.length).toBe(2);
    const sizes = sccs.map((c) => c.length).sort((a, b) => a - b);
    expect(sizes).toEqual([1, 3]);
  });

  it('articulationPoints en cadena lineal', () => {
    // Path 0-1-2-3-4: los puntos de articulación son 1, 2, 3.
    const G = pathGraph(5);
    const arts = articulationPoints(G).sort((a, b) => a - b);
    expect(arts).toEqual([1, 2, 3]);
  });

  it('bridges en cadena lineal', () => {
    const G = pathGraph(4);
    const br = bridges(G);
    // Todo edge de un árbol es puente.
    expect(br.length).toBe(3);
  });

  it('bridges: ciclo no tiene puentes', () => {
    const G = cycleGraph(5);
    expect(bridges(G).length).toBe(0);
  });
});

// ------------------------------------------------------------
// 4. Caminos mínimos
// ------------------------------------------------------------
describe('graph-theory / caminos mínimos', () => {
  it('dijkstra en grafo 5-vertex weighted', () => {
    // Grafo clásico:
    //   0 --(7)-- 1 --(1)-- 4
    //   |\        |
    //  (1)(5)   (2)
    //   |   \    |
    //   2 --(2)- 3
    const G = makeGraph<number>();
    addEdge(G, { from: 0, to: 1, weight: 7 });
    addEdge(G, { from: 0, to: 2, weight: 1 });
    addEdge(G, { from: 0, to: 3, weight: 5 });
    addEdge(G, { from: 1, to: 3, weight: 2 });
    addEdge(G, { from: 1, to: 4, weight: 1 });
    addEdge(G, { from: 2, to: 3, weight: 2 });
    const { distances } = dijkstra(G, 0);
    expect(distances.get(0)).toBe(0);
    expect(distances.get(1)).toBe(5); // 0->2->3->1 = 1+2+2 = 5
    expect(distances.get(2)).toBe(1);
    expect(distances.get(3)).toBe(3); // 0->2->3 = 3
    expect(distances.get(4)).toBe(6); // 0->2->3->1->4 = 6
  });

  it('dijkstra rechaza pesos negativos', () => {
    const G = makeGraph<number>();
    addEdge(G, { from: 0, to: 1, weight: -1 });
    expect(() => dijkstra(G, 0)).toThrow();
  });

  it('bellmanFord detecta ciclo negativo', () => {
    const G = makeGraph<number>(true);
    addEdge(G, { from: 1, to: 2, weight: 1 });
    addEdge(G, { from: 2, to: 3, weight: -3 });
    addEdge(G, { from: 3, to: 1, weight: 1 });
    const r = bellmanFord(G, 1);
    expect(r.negativeCycle).toBe(true);
  });

  it('bellmanFord en grafo sin ciclos negativos', () => {
    const G = makeGraph<number>(true);
    addEdge(G, { from: 1, to: 2, weight: 4 });
    addEdge(G, { from: 1, to: 3, weight: 1 });
    addEdge(G, { from: 3, to: 2, weight: 2 });
    const r = bellmanFord(G, 1);
    expect(r.negativeCycle).toBe(false);
    expect(r.distances.get(2)).toBe(3); // 1->3->2 = 3
  });

  it('floydWarshall coincide con dijkstra en pesos positivos', () => {
    const G = makeGraph<number>();
    addEdge(G, { from: 0, to: 1, weight: 4 });
    addEdge(G, { from: 0, to: 2, weight: 1 });
    addEdge(G, { from: 1, to: 2, weight: 2 });
    addEdge(G, { from: 1, to: 3, weight: 1 });
    addEdge(G, { from: 2, to: 3, weight: 5 });
    const fw = floydWarshall(G);
    const dj = dijkstra(G, 0);
    for (const v of G.vertices) {
      expect(fw.get(0)?.get(v)).toBe(dj.distances.get(v));
    }
  });
});

// ------------------------------------------------------------
// 5. MST
// ------------------------------------------------------------
describe('graph-theory / MST', () => {
  it('kruskal MST en grafo simple', () => {
    // Grafo de 4 nodos con pesos:
    // 1-2(1), 2-3(2), 3-4(3), 1-4(10), 1-3(5)
    const G = makeGraph<number>();
    addEdge(G, { from: 1, to: 2, weight: 1 });
    addEdge(G, { from: 2, to: 3, weight: 2 });
    addEdge(G, { from: 3, to: 4, weight: 3 });
    addEdge(G, { from: 1, to: 4, weight: 10 });
    addEdge(G, { from: 1, to: 3, weight: 5 });
    const mst = kruskal(G);
    expect(mst.totalWeight).toBe(6); // 1 + 2 + 3
    expect(mst.edges.length).toBe(3);
  });

  it('prim MST coincide con kruskal en weight', () => {
    const G = makeGraph<number>();
    addEdge(G, { from: 0, to: 1, weight: 4 });
    addEdge(G, { from: 0, to: 2, weight: 3 });
    addEdge(G, { from: 1, to: 2, weight: 1 });
    addEdge(G, { from: 1, to: 3, weight: 2 });
    addEdge(G, { from: 2, to: 3, weight: 4 });
    addEdge(G, { from: 3, to: 4, weight: 2 });
    addEdge(G, { from: 2, to: 4, weight: 7 });
    const kw = kruskal(G).totalWeight;
    const pw = prim(G).totalWeight;
    expect(pw).toBe(kw);
  });

  it('prim en grafo desconectado cubre solo su componente', () => {
    const G = makeGraph<number>();
    addEdge(G, { from: 0, to: 1, weight: 1 });
    addEdge(G, { from: 2, to: 3, weight: 1 });
    const r = prim(G, 0);
    expect(r.edges.length).toBe(1);
  });
});

// ------------------------------------------------------------
// 6. Bipartite matching
// ------------------------------------------------------------
describe('graph-theory / matching bipartito', () => {
  it('bipartiteMaximumMatching: 3 + 3 con 4 edges, max 3', () => {
    // Lado izquierdo: L1, L2, L3 ; derecho: R1, R2, R3
    // L1-R1, L1-R2, L2-R2, L3-R3
    const G = makeGraph<string>();
    const left = new Set(['L1', 'L2', 'L3']);
    addEdge(G, { from: 'L1', to: 'R1' });
    addEdge(G, { from: 'L1', to: 'R2' });
    addEdge(G, { from: 'L2', to: 'R2' });
    addEdge(G, { from: 'L3', to: 'R3' });
    const m = bipartiteMaximumMatching(G, left);
    expect(m.length).toBe(3);
  });

  it('hopcroftKarp coincide en tamaño con Kuhn', () => {
    const G = makeGraph<string>();
    const left = new Set(['L1', 'L2', 'L3', 'L4']);
    addEdge(G, { from: 'L1', to: 'R1' });
    addEdge(G, { from: 'L1', to: 'R2' });
    addEdge(G, { from: 'L2', to: 'R1' });
    addEdge(G, { from: 'L3', to: 'R2' });
    addEdge(G, { from: 'L3', to: 'R3' });
    addEdge(G, { from: 'L4', to: 'R3' });
    const k = bipartiteMaximumMatching(G, left).length;
    const h = hopcroftKarp(G, left).length;
    expect(h).toBe(k);
    expect(h).toBe(3);
  });
});

// ------------------------------------------------------------
// 7. Coloreo
// ------------------------------------------------------------
describe('graph-theory / coloreo', () => {
  it('chromaticNumber de K4 = 4', () => {
    expect(chromaticNumber(completeGraph(4))).toBe(4);
  });

  it('chromaticNumber de bipartito completo K_{3,3} = 2', () => {
    const G = makeGraph<string>();
    const left = ['l1', 'l2', 'l3'];
    const right = ['r1', 'r2', 'r3'];
    for (const l of left) for (const r of right) addEdge(G, { from: l, to: r });
    expect(chromaticNumber(G)).toBe(2);
  });

  it('chromaticNumber de C5 (impar) = 3', () => {
    expect(chromaticNumber(cycleGraph(5))).toBe(3);
  });

  it('greedyColoring no asigna mismo color a vecinos', () => {
    const G = completeGraph(5);
    const color = greedyColoring(G);
    for (const e of G.edges) {
      expect(color.get(e.from)).not.toBe(color.get(e.to));
    }
  });
});

// ------------------------------------------------------------
// 8. Isomorfismo
// ------------------------------------------------------------
describe('graph-theory / isomorfismo', () => {
  it('dos C5 son isomorfos', () => {
    const G1 = cycleGraph(5);
    const G2 = makeGraph<string>();
    const labels = ['a', 'b', 'c', 'd', 'e'];
    for (const l of labels) addVertex(G2, l);
    for (let i = 0; i < labels.length; i++) {
      addEdge(G2, { from: labels[i], to: labels[(i + 1) % labels.length] });
    }
    expect(areIsomorphic(G1, G2)).toBe(true);
  });

  it('C5 y C6 no son isomorfos', () => {
    expect(areIsomorphic(cycleGraph(5), cycleGraph(6))).toBe(false);
  });

  it('K4 y C4 no son isomorfos (mismo |V| distinto |E|)', () => {
    expect(areIsomorphic(completeGraph(4), cycleGraph(4))).toBe(false);
  });

  it('findIsomorphism devuelve mapeo válido', () => {
    const G1 = pathGraph(4);
    const G2 = makeGraph<string>();
    const labels = ['w', 'x', 'y', 'z'];
    for (const l of labels) addVertex(G2, l);
    for (let i = 0; i < labels.length - 1; i++) {
      addEdge(G2, { from: labels[i], to: labels[i + 1] });
    }
    const m = findIsomorphism(G1, G2);
    expect(m).not.toBeNull();
    if (!m) return;
    // Verificar que las aristas se preservan.
    for (const e of G1.edges) {
      const f = m.get(e.from) as string;
      const t = m.get(e.to) as string;
      const found = G2.edges.some(
        (e2) => (e2.from === f && e2.to === t) || (e2.from === t && e2.to === f),
      );
      expect(found).toBe(true);
    }
  });
});
