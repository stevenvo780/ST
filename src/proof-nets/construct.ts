// ============================================================
// Proof Nets — Construcción a partir de un secuente
// ============================================================
//
// Dado ⊢ Γ con Γ una lista de fórmulas MLL, esta construcción
// produce un net candidato:
//
//   1. Para cada fórmula F_i de Γ se construye recursivamente su
//      "árbol de descomposición": cada nodo interno se cablea con
//      el link correspondiente (⊗ o ⅋), terminando en hojas que
//      son átomos.
//   2. Los átomos hoja se emparejan por pares duales (A con A⊥)
//      vía axiom links. El pairing es greedy: para cada átomo
//      libre busca su primer dual libre.
//
// El net producido puede o no ser correcto: si Γ no es probable
// en MLL la correctitud Danos-Regnier fallará. Las conclusiones
// son las raíces de los árboles de descomposición.

import {
  type MLLFormula,
  type ProofNet,
  type ProofNetLink,
  type ProofNetNode,
  dual,
  formulaEquals,
} from './types';

interface Builder {
  nodes: ProofNetNode[];
  links: ProofNetLink[];
  nextId: number;
}

function freshNode(b: Builder, formula: MLLFormula): number {
  const id = b.nextId++;
  b.nodes.push({ id, formula });
  return id;
}

// Construye el árbol de descomposición de `f`. Devuelve el id del
// nodo raíz y la lista de ids de las hojas-átomo en orden de
// recorrido en profundidad por la izquierda.
function buildFormulaTree(b: Builder, f: MLLFormula): { root: number; atomLeaves: number[] } {
  if (f.kind === 'atom') {
    const id = freshNode(b, f);
    return { root: id, atomLeaves: [id] };
  }
  const left = buildFormulaTree(b, f.left);
  const right = buildFormulaTree(b, f.right);
  const root = freshNode(b, f);
  b.links.push({
    kind: f.kind === 'tensor' ? 'tensor' : 'par',
    ports: [left.root, right.root, root],
  });
  return {
    root,
    atomLeaves: [...left.atomLeaves, ...right.atomLeaves],
  };
}

export function constructFromSequent(formulas: MLLFormula[]): ProofNet {
  const b: Builder = { nodes: [], links: [], nextId: 0 };
  const conclusions: number[] = [];
  const atomLeaves: number[] = [];

  for (const f of formulas) {
    const tree = buildFormulaTree(b, f);
    conclusions.push(tree.root);
    atomLeaves.push(...tree.atomLeaves);
  }

  // Pairing greedy: para cada hoja sin asignar, busca la primera
  // hoja dual sin asignar y crea un axiom link entre ambas.
  const taken = new Set<number>();
  for (const i of atomLeaves) {
    if (taken.has(i)) continue;
    const fi = b.nodes[i].formula;
    let partner: number | null = null;
    for (const j of atomLeaves) {
      if (j === i || taken.has(j)) continue;
      const fj = b.nodes[j].formula;
      if (formulaEquals(fj, dual(fi))) {
        partner = j;
        break;
      }
    }
    if (partner === null) {
      // Átomo sin par: se deja libre. El criterio de corrección
      // detectará la inconsistencia (componente desconexa).
      continue;
    }
    taken.add(i);
    taken.add(partner);
    b.links.push({ kind: 'axiom', ports: [i, partner] });
  }

  return { nodes: b.nodes, links: b.links, conclusions };
}
