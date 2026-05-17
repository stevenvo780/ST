// ============================================================
// ST Proof Minification — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  minifyProof,
  compactModusPonensChain,
  removeUnusedSubproofs,
  type GenericProofNode,
} from '../../../proof-systems/proof-minify';

// ── Helpers de construcción ──────────────────────────────────

function ax(conclusion: string): GenericProofNode {
  return { conclusion, rule: 'axiom', premises: [] };
}
function hyp(conclusion: string): GenericProofNode {
  return { conclusion, rule: 'hypothesis', premises: [] };
}
function mp(conclusion: string, ant: GenericProofNode, impl: GenericProofNode): GenericProofNode {
  return { conclusion, rule: 'MP', premises: [ant, impl] };
}
function andI(left: GenericProofNode, right: GenericProofNode): GenericProofNode {
  return {
    conclusion: `${left.conclusion} ∧ ${right.conclusion}`,
    rule: '∧I',
    premises: [left, right],
  };
}
function andE1(conjunct: string, conj: GenericProofNode): GenericProofNode {
  return { conclusion: conjunct, rule: '∧E1', premises: [conj] };
}
function cut(
  conclusion: string,
  left: GenericProofNode,
  right: GenericProofNode,
): GenericProofNode {
  return { conclusion, rule: 'cut', premises: [left, right] };
}
function weaken(conclusion: string, ...premises: GenericProofNode[]): GenericProofNode {
  return { conclusion, rule: 'weakening', premises };
}

// ── Tests ────────────────────────────────────────────────────

describe('proof-minify: counts y depth', () => {
  it('countNodes/depth funcionan correctamente sobre un árbol simple', () => {
    const proof = mp('B', ax('A'), ax('A → B'));
    const result = minifyProof(proof, { rules: [] }); // no aplicar reglas
    expect(result.original.nodes).toBe(3);
    expect(result.original.depth).toBe(1);
  });
});

describe('proof-minify: detrivialize ∧I/∧E', () => {
  it('colapsa ∧E1 ∘ ∧I al sub-árbol correspondiente', () => {
    // (A ∧ B) introducido y luego eliminado a A.
    const intro = andI(ax('A'), ax('B'));
    const elim = andE1('A', intro);
    const result = minifyProof(elim);
    expect(result.minified.conclusion).toBe('A');
    expect(result.minified.rule).toBe('axiom');
    expect(result.minified.premises).toHaveLength(0);
    expect(result.reduction.nodesRemoved).toBeGreaterThanOrEqual(2);
  });

  it('detrivializa anidados: ∧E1 ∘ ∧I ∘ ∧E1 ∘ ∧I', () => {
    // Construimos: (((A ∧ B) ∧ C) , extracción de A vía dos eliminaciones)
    const innerIntro = andI(ax('A'), ax('B'));
    const elim1 = andE1('A', innerIntro);
    const outerIntro = andI(elim1, ax('C'));
    const elim2 = andE1('A', outerIntro);
    const result = minifyProof(elim2);
    expect(result.minified.rule).toBe('axiom');
    expect(result.minified.conclusion).toBe('A');
  });
});

describe('proof-minify: compact MP chains', () => {
  it('compacta una cadena de 5 MPs en un único MP*', () => {
    // A, A→B, B→C, C→D, D→E, E→F ⊢ F
    const step1 = mp('B', ax('A'), ax('A → B'));
    const step2 = mp('C', step1, ax('B → C'));
    const step3 = mp('D', step2, ax('C → D'));
    const step4 = mp('E', step3, ax('D → E'));
    const step5 = mp('F', step4, ax('E → F'));

    const result = minifyProof(step5, { rules: ['compact-mp'] });
    expect(result.minified.rule).toBe('MP*');
    expect(result.minified.conclusion).toBe('F');
    expect(result.minified.metadata?.chain).toBeDefined();
    expect((result.minified.metadata!.chain as string[]).length).toBeGreaterThanOrEqual(5);
    // Profundidad debe haberse reducido drásticamente.
    expect(result.reduction.depthDelta).toBeGreaterThan(0);
  });

  it('no compacta cadenas ambiguas (sin → en las premisas)', () => {
    const fake1 = mp('X', ax('Y'), ax('Z'));
    const fake2 = mp('A', fake1, ax('W'));
    const result = compactModusPonensChain(fake2);
    // Como no detecta antecedente vs implicación, no compacta.
    expect(result.rule).toBe('MP');
  });

  it('cadenas de exactamente 1 MP no se compactan', () => {
    const proof = mp('B', ax('A'), ax('A → B'));
    const result = compactModusPonensChain(proof);
    expect(result.rule).toBe('MP');
  });
});

describe('proof-minify: local cut elimination', () => {
  it('elimina cut cuando una rama es hoja-identidad', () => {
    // cut sobre conclusión A: una rama es la hipótesis A, la otra deriva A.
    const derivacionA = andE1('A', andI(ax('A'), ax('B')));
    const proofWithCut = cut('A', hyp('A'), derivacionA);
    const result = minifyProof(proofWithCut, { rules: ['cut-elimination-local'] });
    // El cut se reemplaza por la derivación que realmente concluyó A.
    expect(result.minified.rule).not.toBe('cut');
  });

  it('mantiene cut cuando ninguna rama es hoja-identidad', () => {
    const left = mp('A', ax('X'), ax('X → A'));
    const right = mp('B', ax('A'), ax('A → B'));
    const proof = cut('B', left, right);
    const result = minifyProof(proof, { rules: ['cut-elimination-local'] });
    expect(result.minified.rule).toBe('cut');
  });
});

describe('proof-minify: remove unused subproofs', () => {
  it('recorta premisas irrelevantes en weakening', () => {
    // Weakening: la conclusion es A. Sólo una premisa contiene A.
    const irrelevante1 = ax('Z');
    const irrelevante2 = ax('W');
    const relevante = ax('A');
    const proof = weaken('A', irrelevante1, irrelevante2, relevante);
    const result = removeUnusedSubproofs(proof);
    expect(result.premises.length).toBeLessThan(3);
    // La premisa que sobrevive debe contener A.
    expect(result.premises.some((p) => p.conclusion === 'A')).toBe(true);
  });

  it('no toca nodos con sólo 1 premisa', () => {
    const proof: GenericProofNode = {
      conclusion: 'A',
      rule: '∧E1',
      premises: [andI(ax('A'), ax('B'))],
    };
    const result = removeUnusedSubproofs(proof);
    expect(result.premises).toHaveLength(1);
  });
});

describe('proof-minify: estadística general', () => {
  it('reduce un árbol con 10 nodos y 2 redundantes a ≤ 8 nodos', () => {
    // Construimos un árbol con 2 ∧I/∧E1 redundantes.
    // Layout:
    //  A_intro = (A ∧ B), elim1 = A
    //  B_intro = (B ∧ C), elim2 = B
    //  raíz = (elim1 ∧ elim2)
    const aIntro = andI(ax('A'), ax('B')); // 3 nodos
    const aElim = andE1('A', aIntro); // +1 = 4
    const bIntro = andI(ax('B'), ax('C')); // +3 = 7
    const bElim = andE1('B', bIntro); // +1 = 8
    const root = andI(aElim, bElim); // +1 = 9
    // Añadimos un dead-weight: el árbol original.
    const proof: GenericProofNode = {
      conclusion: root.conclusion,
      rule: root.rule,
      premises: [...root.premises, ax('Q')], // +1 hojas dead = 10
    };
    const result = minifyProof(proof);
    expect(result.original.nodes).toBe(10);
    // Tras detrivialize, aElim → ax('A'), bElim → ax('B'). Nodos: 10-4 = 6.
    expect(result.minified.conclusion).toBe(proof.conclusion);
    expect(result.reduction.nodesRemoved).toBeGreaterThanOrEqual(2);
    expect(result.minified.premises.length).toBeLessThanOrEqual(2);
  });
});

describe('proof-minify: preservación de la raíz', () => {
  it('la conclusion de la raíz nunca cambia', () => {
    const proof = mp('Q', ax('P'), ax('P → Q'));
    const result = minifyProof(proof);
    expect(result.minified.conclusion).toBe('Q');
  });

  it('una hoja se devuelve sin cambios', () => {
    const leaf = ax('Hello');
    const result = minifyProof(leaf);
    expect(result.minified).toEqual(leaf);
    expect(result.reduction.nodesRemoved).toBe(0);
    expect(result.reduction.percentage).toBe(0);
  });
});

describe('proof-minify: idempotencia', () => {
  it('minify(minify(p)) tiene la misma estructura que minify(p)', () => {
    const aIntro = andI(ax('A'), ax('B'));
    const aElim = andE1('A', aIntro);
    const proof = andI(aElim, ax('C'));
    const once = minifyProof(proof);
    const twice = minifyProof(once.minified);
    // Las claves canónicas deben coincidir.
    const keyOnce = JSON.stringify(once.minified);
    const keyTwice = JSON.stringify(twice.minified);
    expect(keyOnce).toBe(keyTwice);
    expect(twice.reduction.nodesRemoved).toBe(0);
  });

  it('idempotencia en cadena MP compactada', () => {
    const s1 = mp('B', ax('A'), ax('A → B'));
    const s2 = mp('C', s1, ax('B → C'));
    const s3 = mp('D', s2, ax('C → D'));
    const once = minifyProof(s3);
    const twice = minifyProof(once.minified);
    expect(JSON.stringify(once.minified)).toBe(JSON.stringify(twice.minified));
  });

  it('idempotencia sobre prueba ya minimal', () => {
    const leaf = ax('A');
    const r1 = minifyProof(leaf);
    const r2 = minifyProof(r1.minified);
    expect(r2.iterations).toBeLessThanOrEqual(2);
    expect(r2.reduction.nodesRemoved).toBe(0);
  });
});

describe('proof-minify: opciones', () => {
  it('rules=[] no aplica ninguna reducción', () => {
    const aElim = andE1('A', andI(ax('A'), ax('B')));
    const result = minifyProof(aElim, { rules: [] });
    expect(result.reduction.nodesRemoved).toBe(0);
    expect(result.minified.rule).toBe('∧E1');
  });

  it('maxIterations=1 limita las pasadas globales', () => {
    const aElim = andE1('A', andI(ax('A'), ax('B')));
    const result = minifyProof(aElim, { maxIterations: 1 });
    expect(result.iterations).toBe(1);
  });

  it('rules selectivo: sólo compact-mp no afecta árboles sin MP', () => {
    const proof = andI(ax('A'), ax('B'));
    const result = minifyProof(proof, { rules: ['compact-mp'] });
    expect(result.reduction.nodesRemoved).toBe(0);
  });

  it('rules selectivo: sólo detrivialize en árbol con ∧I/∧E', () => {
    const proof = andE1('A', andI(ax('A'), ax('B')));
    const result = minifyProof(proof, { rules: ['detrivialize'] });
    expect(result.minified.rule).toBe('axiom');
  });
});

describe('proof-minify: dedup de premisas', () => {
  it('elimina premisas duplicadas estructurales', () => {
    // ∧I con dos premisas idénticas (caso degenerado pero válido).
    const dup: GenericProofNode = {
      conclusion: 'A ∧ A',
      rule: '∧I',
      premises: [ax('A'), ax('A')],
    };
    const result = minifyProof(dup, { rules: ['detrivialize'] });
    expect(result.minified.premises).toHaveLength(1);
  });
});

describe('proof-minify: input no se muta', () => {
  it('el árbol original queda intacto', () => {
    const original = andE1('A', andI(ax('A'), ax('B')));
    const snapshot = JSON.stringify(original);
    minifyProof(original);
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});

describe('proof-minify: integración multi-regla', () => {
  it('combina detrivialize + compact-mp + remove-unused', () => {
    // Construye: weaken con premisas extras, cadena MP dentro, ∧E∘∧I.
    const aElim = andE1('A', andI(ax('A'), ax('B')));
    const s1 = mp('B', aElim, ax('A → B'));
    const s2 = mp('C', s1, ax('B → C'));
    const root = weaken('C', s2, ax('IRRELEVANTE_Z'));
    const result = minifyProof(root);
    expect(result.minified.conclusion).toBe('C');
    // La premisa irrelevante debe haberse podado.
    expect(result.reduction.nodesRemoved).toBeGreaterThan(0);
  });

  it('punto fijo alcanzado antes de maxIterations', () => {
    const proof = mp('B', ax('A'), ax('A → B'));
    const result = minifyProof(proof, { maxIterations: 100 });
    expect(result.iterations).toBeLessThanOrEqual(2);
  });
});

describe('proof-minify: métricas', () => {
  it('percentage es 0 para una hoja', () => {
    const result = minifyProof(ax('X'));
    expect(result.reduction.percentage).toBe(0);
  });

  it('percentage > 0 cuando hay reducción', () => {
    const aElim = andE1('A', andI(ax('A'), ax('B')));
    const result = minifyProof(aElim);
    expect(result.reduction.percentage).toBeGreaterThan(0);
  });

  it('depthDelta > 0 al compactar cadena MP', () => {
    const s1 = mp('B', ax('A'), ax('A → B'));
    const s2 = mp('C', s1, ax('B → C'));
    const s3 = mp('D', s2, ax('C → D'));
    const result = minifyProof(s3);
    expect(result.reduction.depthDelta).toBeGreaterThan(0);
  });
});
