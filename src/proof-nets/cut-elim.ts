// ============================================================
// Proof Nets — Eliminación de cortes
// ============================================================
//
// Para MLL la cut-elimination es local y confluente. Dos pasos
// fundamentales:
//
//   (axiom-cut)   axiom(a, a') + cut(a', b)
//                 ─────────────────────────
//                 las apariciones de a' se "atajan" hacia b:
//                 los links que tocaban a' tocan ahora a, y
//                 axiom + cut desaparecen.
//
//   (mult-cut)    tensor(l₁,r₁,c₁=A⊗B) + par(l₂,r₂,c₂=A⊥⅋B⊥) + cut(c₁,c₂)
//                 ──────────────────────────────────────────────────────
//                 dos cortes más pequeños: cut(l₁,l₂) y cut(r₁,r₂),
//                 desaparecen los links ⊗, ⅋ y el cut original.
//                 Los nodos c₁ y c₂ desaparecen.
//
// `reduceCut` aplica un paso (si existe alguno). `normalizeCuts`
// itera hasta normal form (sin cortes). Para MLL la terminación
// es trivial: cada paso reduce el número de conectivos en el
// borde del cut.

import { type ProofNet, type ProofNetLink, type ProofNetNode, dual, formulaEquals } from './types';

// ---------- Helpers ----------

function cloneNet(net: ProofNet): ProofNet {
  return {
    nodes: net.nodes.map((n) => ({ id: n.id, formula: n.formula })),
    links: net.links.map((l) => ({ kind: l.kind, ports: [...l.ports] })),
    conclusions: [...net.conclusions],
  };
}

function findLinkByPort(
  links: ProofNetLink[],
  port: number,
  exceptIndex: number,
): { index: number; link: ProofNetLink } | null {
  for (let i = 0; i < links.length; i++) {
    if (i === exceptIndex) continue;
    if (links[i].ports.includes(port)) return { index: i, link: links[i] };
  }
  return null;
}

function removeIndices<T>(arr: T[], indices: number[]): T[] {
  const drop = new Set(indices);
  return arr.filter((_, i) => !drop.has(i));
}

function removeNodesById(nodes: ProofNetNode[], ids: number[]): ProofNetNode[] {
  const drop = new Set(ids);
  return nodes.filter((n) => !drop.has(n.id));
}

// ---------- Pasos de reducción ----------

// Intenta aplicar UN paso de cut-elimination. Devuelve el nuevo
// net (mismo objeto si no había nada que reducir) y un boolean
// `reduced` indicando si efectivamente se redujo.
export function reduceCutStep(net: ProofNet): { net: ProofNet; reduced: boolean } {
  for (let i = 0; i < net.links.length; i++) {
    const cut = net.links[i];
    if (cut.kind !== 'cut') continue;
    const [a, b] = cut.ports as [number, number];
    const stepAB = tryReduceAt(net, i, a, b);
    if (stepAB) return { net: stepAB, reduced: true };
    const stepBA = tryReduceAt(net, i, b, a);
    if (stepBA) return { net: stepBA, reduced: true };
  }
  return { net, reduced: false };
}

function tryReduceAt(
  net: ProofNet,
  cutIndex: number,
  portOnAxiomSide: number,
  otherPort: number,
): ProofNet | null {
  // Caso 1: axiom-cut. El nodo `portOnAxiomSide` participa en un
  // axiom link.
  const ax = findLinkByPort(net.links, portOnAxiomSide, cutIndex);
  if (ax && ax.link.kind === 'axiom') {
    const [p, q] = ax.link.ports as [number, number];
    const other = p === portOnAxiomSide ? q : p;
    // Eliminamos axiom + cut. Cualquier link futuro que apuntara
    // a `portOnAxiomSide` ya no existe (era hoja del axiom). El
    // axiom ahora pasa a conectar `other` con `otherPort`: lo
    // representamos como un nuevo axiom link entre ambos (es
    // congruente con la semántica de "los duales quedan ligados").
    //
    // Sin embargo: si `otherPort` también es hoja de otro axiom,
    // entonces toda esta cadena se colapsa eventualmente. Aquí
    // hacemos sólo un paso: removemos cut, removemos axiom viejo,
    // creamos axiom nuevo (other, otherPort) si los formulas son
    // duales (deberían serlo por estructura del cut).
    const next = cloneNet(net);
    next.links = removeIndices(next.links, [cutIndex, ax.index]);
    next.links.push({ kind: 'axiom', ports: [other, otherPort] });
    // El nodo `portOnAxiomSide` queda huérfano; se elimina.
    // Si era una conclusión (no debería: era hoja axiom) la
    // quitamos también para mantener consistencia.
    next.nodes = removeNodesById(next.nodes, [portOnAxiomSide]);
    next.conclusions = next.conclusions.filter((c) => c !== portOnAxiomSide);
    return next;
  }

  // Caso 2: mult-cut. `portOnAxiomSide` es la conclusión de un
  // tensor link y `otherPort` la conclusión de un par link con
  // fórmula dual.
  const tensorLink = findLinkByPort(net.links, portOnAxiomSide, cutIndex);
  if (
    tensorLink &&
    tensorLink.link.kind === 'tensor' &&
    tensorLink.link.ports[2] === portOnAxiomSide
  ) {
    const parLink = findLinkByPort(net.links, otherPort, cutIndex);
    if (parLink && parLink.link.kind === 'par' && parLink.link.ports[2] === otherPort) {
      const tensorNode = net.nodes.find((n) => n.id === portOnAxiomSide);
      const parNode = net.nodes.find((n) => n.id === otherPort);
      if (
        tensorNode &&
        parNode &&
        tensorNode.formula.kind === 'tensor' &&
        parNode.formula.kind === 'par' &&
        formulaEquals(tensorNode.formula, dual(parNode.formula))
      ) {
        const [tL, tR] = tensorLink.link.ports as [number, number, number];
        const [pL, pR] = parLink.link.ports as [number, number, number];
        const next = cloneNet(net);
        next.links = removeIndices(next.links, [cutIndex, tensorLink.index, parLink.index]);
        next.links.push({ kind: 'cut', ports: [tL, pL] });
        next.links.push({ kind: 'cut', ports: [tR, pR] });
        next.nodes = removeNodesById(next.nodes, [portOnAxiomSide, otherPort]);
        next.conclusions = next.conclusions.filter((c) => c !== portOnAxiomSide && c !== otherPort);
        return next;
      }
    }
  }

  return null;
}

export function reduceCut(net: ProofNet): ProofNet {
  return reduceCutStep(net).net;
}

export function isCutFree(net: ProofNet): boolean {
  return !net.links.some((l) => l.kind === 'cut');
}

export function normalizeCuts(net: ProofNet, maxSteps = 1000): ProofNet {
  let current = net;
  for (let i = 0; i < maxSteps; i++) {
    const step = reduceCutStep(current);
    if (!step.reduced) return step.net;
    current = step.net;
  }
  return current;
}
