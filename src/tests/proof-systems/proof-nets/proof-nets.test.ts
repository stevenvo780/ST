import { describe, it, expect } from 'vitest';
import {
  atomPos,
  atomNeg,
  tensor,
  par,
  dual,
  formulaEquals,
  formulaToString,
  constructFromSequent,
  isCorrect,
  reduceCut,
  reduceCutStep,
  normalizeCuts,
  isCutFree,
  type ProofNet,
} from '../../../proof-systems/proof-nets';

describe('Proof Nets / fórmulas y dualidad', () => {
  it('dualidad es involutiva sobre átomos', () => {
    const A = atomPos('A');
    expect(formulaEquals(dual(dual(A)), A)).toBe(true);
  });

  it('De Morgan: (A ⊗ B)⊥ = A⊥ ⅋ B⊥', () => {
    const A = atomPos('A');
    const B = atomPos('B');
    const lhs = dual(tensor(A, B));
    const rhs = par(dual(A), dual(B));
    expect(formulaEquals(lhs, rhs)).toBe(true);
  });

  it('formulaToString muestra ⊥ en átomos negativos', () => {
    expect(formulaToString(atomNeg('A'))).toBe('A⊥');
    expect(formulaToString(tensor(atomPos('A'), atomNeg('B')))).toBe('(A ⊗ B⊥)');
    expect(formulaToString(par(atomPos('A'), atomNeg('B')))).toBe('(A ⅋ B⊥)');
  });
});

describe('Proof Nets / construcción y corrección Danos-Regnier', () => {
  it('axiom link A, A⊥ es correcto', () => {
    const net = constructFromSequent([atomPos('A'), atomNeg('A')]);
    expect(net.nodes).toHaveLength(2);
    expect(net.links).toHaveLength(1);
    expect(net.links[0].kind).toBe('axiom');
    expect(isCorrect(net)).toBe(true);
  });

  it('secuente ⊢ A⊥, A (orden invertido) sigue siendo correcto', () => {
    const net = constructFromSequent([atomNeg('A'), atomPos('A')]);
    expect(isCorrect(net)).toBe(true);
  });

  it('⊢ A⊥, B⊥, A ⊗ B es correcto (intro de tensor)', () => {
    const net = constructFromSequent([
      atomNeg('A'),
      atomNeg('B'),
      tensor(atomPos('A'), atomPos('B')),
    ]);
    expect(net.links.some((l) => l.kind === 'tensor')).toBe(true);
    expect(net.links.filter((l) => l.kind === 'axiom')).toHaveLength(2);
    expect(isCorrect(net)).toBe(true);
  });

  it('⊢ A⊥ ⅋ B⊥, A ⊗ B es correcto (forma normal)', () => {
    const net = constructFromSequent([
      par(atomNeg('A'), atomNeg('B')),
      tensor(atomPos('A'), atomPos('B')),
    ]);
    expect(net.links.some((l) => l.kind === 'tensor')).toBe(true);
    expect(net.links.some((l) => l.kind === 'par')).toBe(true);
    expect(isCorrect(net)).toBe(true);
  });

  it('⊢ A, A⊥ ⅋ B, B⊥ NO es correcto: ⊢ A, A⊥, B, B⊥ no es probable en MLL puro (sin mix)', () => {
    // Aunque ingenuamente uno emparejaría (A,A⊥) y (B,B⊥), bajo el
    // switching del ⅋ que descarta la premisa "interna" B, el átomo
    // se queda sin conexión con el resto del net. Esto refleja que
    // MLL sin "mix" no prueba este secuente: las dos cadenas
    // axioma-axioma viven en componentes desconexas.
    const net = constructFromSequent([atomPos('A'), par(atomNeg('A'), atomPos('B')), atomNeg('B')]);
    expect(isCorrect(net)).toBe(false);
  });

  it('⊢ (A ⊗ B), (A⊥ ⅋ B⊥) sí es correcto (De Morgan)', () => {
    const net = constructFromSequent([
      tensor(atomPos('A'), atomPos('B')),
      par(atomNeg('A'), atomNeg('B')),
    ]);
    expect(isCorrect(net)).toBe(true);
  });

  it('secuente vacío produce net trivialmente correcto', () => {
    const net = constructFromSequent([]);
    expect(net.nodes).toHaveLength(0);
    expect(net.links).toHaveLength(0);
    expect(isCorrect(net)).toBe(true);
  });

  it('⊢ A solo (sin dual) NO es correcto: hay nodo aislado', () => {
    const net = constructFromSequent([atomPos('A')]);
    // No hay con quién emparejar => sin axiom link, componente
    // desconexa de tamaño 1 sin aristas.
    expect(isCorrect(net)).toBe(false);
  });

  it('⊢ A ⊗ A⊥ NO es correcto: tensor con cut interno crearía ciclo', () => {
    // Esta es la trampa clásica: con un solo átomo en cada lado del
    // tensor no se puede cerrar el net respetando la conexidad bajo
    // todos los switchings.
    const net = constructFromSequent([tensor(atomPos('A'), atomNeg('A'))]);
    // Construye: dos hojas A, A⊥, un tensor link, y un axiom link
    // entre A y A⊥. Bajo el único switching (no hay par) el grafo
    // tiene un ciclo a—tensor—a⊥—axiom—a, así que es incorrecto.
    expect(isCorrect(net)).toBe(false);
  });

  it('⊢ A ⅋ A⊥ SÍ es correcto: par "abre" el ciclo bajo switching', () => {
    const net = constructFromSequent([par(atomPos('A'), atomNeg('A'))]);
    expect(isCorrect(net)).toBe(true);
  });

  it('net manualmente desconexo es rechazado', () => {
    // Dos axiom links independientes y nada que los conecte.
    const net: ProofNet = {
      nodes: [
        { id: 0, formula: atomPos('A') },
        { id: 1, formula: atomNeg('A') },
        { id: 2, formula: atomPos('B') },
        { id: 3, formula: atomNeg('B') },
      ],
      links: [
        { kind: 'axiom', ports: [0, 1] },
        { kind: 'axiom', ports: [2, 3] },
      ],
      conclusions: [0, 1, 2, 3],
    };
    expect(isCorrect(net)).toBe(false);
  });

  it('net con port inexistente es rechazado', () => {
    const net: ProofNet = {
      nodes: [{ id: 0, formula: atomPos('A') }],
      links: [{ kind: 'axiom', ports: [0, 99] }],
      conclusions: [0],
    };
    expect(isCorrect(net)).toBe(false);
  });

  it('axiom entre fórmulas NO duales es rechazado', () => {
    const net: ProofNet = {
      nodes: [
        { id: 0, formula: atomPos('A') },
        { id: 1, formula: atomPos('B') },
      ],
      links: [{ kind: 'axiom', ports: [0, 1] }],
      conclusions: [0, 1],
    };
    expect(isCorrect(net)).toBe(false);
  });
});

describe('Proof Nets / eliminación de cortes', () => {
  it('axiom-cut: reduceCutStep simplifica un paso', () => {
    // Net: axiom(0:A, 1:A⊥), cut(1:A⊥, 2:A), conclusion 2.
    // El cut está entre `1` (premisa axiom) y `2` (átomo libre).
    // Tras reducir esperamos un axiom(0, 2) y desaparición de `1`.
    const net: ProofNet = {
      nodes: [
        { id: 0, formula: atomPos('A') },
        { id: 1, formula: atomNeg('A') },
        { id: 2, formula: atomPos('A') },
      ],
      links: [
        { kind: 'axiom', ports: [0, 1] },
        { kind: 'cut', ports: [1, 2] },
      ],
      conclusions: [0, 2],
    };
    expect(isCutFree(net)).toBe(false);
    const step = reduceCutStep(net);
    expect(step.reduced).toBe(true);
    expect(isCutFree(step.net)).toBe(true);
    expect(step.net.links).toHaveLength(1);
    expect(step.net.links[0].kind).toBe('axiom');
    expect(new Set(step.net.links[0].ports)).toEqual(new Set([0, 2]));
    expect(step.net.nodes.find((n) => n.id === 1)).toBeUndefined();
  });

  it('mult-cut: tensor vs par reduce a dos cortes más pequeños', () => {
    // Construimos manualmente:
    //   nodos: a:A, b:B, a':A⊥, b':B⊥, t:A⊗B, p:A⊥⅋B⊥
    //   links: tensor(a,b,t), par(a',b',p), cut(t,p)
    const A = atomPos('A');
    const Anot = atomNeg('A');
    const B = atomPos('B');
    const Bnot = atomNeg('B');
    const net: ProofNet = {
      nodes: [
        { id: 0, formula: A },
        { id: 1, formula: B },
        { id: 2, formula: Anot },
        { id: 3, formula: Bnot },
        { id: 4, formula: tensor(A, B) },
        { id: 5, formula: par(Anot, Bnot) },
      ],
      links: [
        { kind: 'tensor', ports: [0, 1, 4] },
        { kind: 'par', ports: [2, 3, 5] },
        { kind: 'cut', ports: [4, 5] },
      ],
      conclusions: [],
    };
    const step = reduceCutStep(net);
    expect(step.reduced).toBe(true);
    const cuts = step.net.links.filter((l) => l.kind === 'cut');
    expect(cuts).toHaveLength(2);
    // Los dos cortes deben conectar átomos duales.
    const cutPortSets = cuts.map((c) => new Set(c.ports));
    expect(cutPortSets).toContainEqual(new Set([0, 2]));
    expect(cutPortSets).toContainEqual(new Set([1, 3]));
    // Tensor y par originales deben haber desaparecido.
    expect(step.net.links.some((l) => l.kind === 'tensor')).toBe(false);
    expect(step.net.links.some((l) => l.kind === 'par')).toBe(false);
  });

  it('normalizeCuts converge a un net cut-free', () => {
    // Cadena: axiom(0,1) + axiom(2,3) + cut(1,2) reduce a axiom(0,3).
    const net: ProofNet = {
      nodes: [
        { id: 0, formula: atomPos('A') },
        { id: 1, formula: atomNeg('A') },
        { id: 2, formula: atomPos('A') },
        { id: 3, formula: atomNeg('A') },
      ],
      links: [
        { kind: 'axiom', ports: [0, 1] },
        { kind: 'axiom', ports: [2, 3] },
        { kind: 'cut', ports: [1, 2] },
      ],
      conclusions: [0, 3],
    };
    const norm = normalizeCuts(net);
    expect(isCutFree(norm)).toBe(true);
    // Algún axiom debería terminar conectando 0 con 3 (mod nodos
    // intermedios reabsorbidos en una segunda pasada de axiom-cut).
    expect(norm.links.length).toBeGreaterThanOrEqual(1);
  });

  it('reduceCut sobre net sin cortes es idempotente', () => {
    const net = constructFromSequent([atomPos('A'), atomNeg('A')]);
    expect(isCutFree(net)).toBe(true);
    const step = reduceCutStep(net);
    expect(step.reduced).toBe(false);
    expect(step.net).toBe(net);
    expect(reduceCut(net)).toBe(net);
  });

  it('mult-cut compuesto: (A⊗B) vs (A⊥⅋B⊥) cierra a axioms tras normalize', () => {
    const A = atomPos('A');
    const Anot = atomNeg('A');
    const B = atomPos('B');
    const Bnot = atomNeg('B');
    const net: ProofNet = {
      nodes: [
        { id: 0, formula: A },
        { id: 1, formula: Anot }, // será emparejado luego
        { id: 2, formula: B },
        { id: 3, formula: Bnot }, // será emparejado luego
        { id: 4, formula: Anot }, // hoja del par
        { id: 5, formula: Bnot }, // hoja del par
        { id: 6, formula: A }, // hoja externa
        { id: 7, formula: B }, // hoja externa
        { id: 8, formula: tensor(A, B) },
        { id: 9, formula: par(Anot, Bnot) },
      ],
      links: [
        // axioms: vinculamos los átomos externos con los del par/tensor
        { kind: 'axiom', ports: [6, 4] },
        { kind: 'axiom', ports: [7, 5] },
        { kind: 'axiom', ports: [0, 1] },
        { kind: 'axiom', ports: [2, 3] },
        { kind: 'tensor', ports: [0, 2, 8] }, // construye A⊗B desde 0 y 2
        { kind: 'par', ports: [4, 5, 9] }, // construye A⊥⅋B⊥
        { kind: 'cut', ports: [8, 9] },
      ],
      conclusions: [6, 7, 1, 3],
    };
    const norm = normalizeCuts(net);
    expect(isCutFree(norm)).toBe(true);
    // Tras toda la cascada deben quedar solo axiom links.
    for (const l of norm.links) {
      expect(l.kind).toBe('axiom');
    }
  });
});
