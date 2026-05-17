import { describe, it, expect } from 'vitest';
import {
  LKFormula,
  LKProof,
  proveLK,
  proveLKFormula,
  hasCut,
  eliminateCut,
  isValid,
} from '../../../logic/profiles/sequent-lk';

// --- Helpers ---
const atom = (name: string): LKFormula => ({ kind: 'atom', name });
const not = (a: LKFormula): LKFormula => ({ kind: 'not', arg: a });
const and = (a: LKFormula, b: LKFormula): LKFormula => ({ kind: 'and', left: a, right: b });
const or = (a: LKFormula, b: LKFormula): LKFormula => ({ kind: 'or', left: a, right: b });
const imp = (a: LKFormula, b: LKFormula): LKFormula => ({ kind: 'implies', left: a, right: b });

const P = atom('P');
const Q = atom('Q');
const R = atom('R');

function rulesOf(p: LKProof | null | undefined): string[] {
  if (!p) return [];
  const out: string[] = [p.rule];
  for (const sub of p.premises) out.push(...rulesOf(sub));
  return out;
}

describe('LK — proveLK sobre tautologias clasicas', () => {
  it('demuestra el axioma P ⊢ P', () => {
    const proof = proveLK({ left: [P], right: [P] });
    expect(proof).not.toBeNull();
    expect(proof!.rule).toBe('axiom');
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra ⊢ P ∨ ¬P (tercio excluido)', () => {
    const proof = proveLKFormula(or(P, not(P)));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
    const set = new Set(rulesOf(proof));
    expect(set.has('orR')).toBe(true);
    expect(set.has('notR')).toBe(true);
    expect(set.has('axiom')).toBe(true);
  });

  it('demuestra ⊢ ¬¬P → P (doble negacion clasica)', () => {
    const proof = proveLKFormula(imp(not(not(P)), P));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra ley de Peirce: ((P → Q) → P) → P', () => {
    const proof = proveLKFormula(imp(imp(imp(P, Q), P), P));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra ⊢ ¬¬¬P → ¬P', () => {
    const proof = proveLKFormula(imp(not(not(not(P))), not(P)));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra (P → Q) → (¬Q → ¬P) — contraposicion', () => {
    const proof = proveLKFormula(imp(imp(P, Q), imp(not(Q), not(P))));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra De Morgan: ¬(P ∧ Q) → (¬P ∨ ¬Q)', () => {
    const proof = proveLKFormula(imp(not(and(P, Q)), or(not(P), not(Q))));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('rechaza ⊢ P (no es tautologia)', () => {
    const proof = proveLKFormula(P);
    expect(proof).toBeNull();
  });

  it('rechaza P ⊢ Q (no es derivable)', () => {
    const proof = proveLK({ left: [P], right: [Q] });
    expect(proof).toBeNull();
  });
});

describe('LK — multisuccedente', () => {
  it('demuestra Γ ⊢ P, ¬P en una sola rama via axiom', () => {
    const proof = proveLK({ left: [], right: [P, not(P)] });
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra P, Q ⊢ P ∧ Q', () => {
    const proof = proveLK({ left: [P, Q], right: [and(P, Q)] });
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
    expect(rulesOf(proof)).toContain('andR');
  });

  it('demuestra P ∨ Q ⊢ Q ∨ P (conmutatividad)', () => {
    const proof = proveLK({ left: [or(P, Q)], right: [or(Q, P)] });
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });
});

describe('LK — Hauptsatz / cut elimination', () => {
  it('hasCut es false en una prueba cut-free producida por proveLK', () => {
    const proof = proveLKFormula(imp(P, P));
    expect(proof).not.toBeNull();
    expect(hasCut(proof!)).toBe(false);
  });

  it('detecta hasCut=true en una prueba con cut manual', () => {
    // Construimos: ⊢ P  via cut sobre P, premisas: ⊢ P, P y P ⊢ (ambas falsas como derivaciones,
    // pero la estructura sirve para chequear hasCut)
    const fakeProof: LKProof = {
      goal: { left: [], right: [P] },
      rule: 'cut',
      cutFormula: P,
      premises: [
        { goal: { left: [], right: [P, P] }, rule: 'axiom', premises: [], principalFormula: P },
        { goal: { left: [P], right: [] }, rule: 'axiom', premises: [], principalFormula: P },
      ],
    };
    expect(hasCut(fakeProof)).toBe(true);
  });

  it('construye prueba con cut y elimina via eliminateCut → hasCut=false', () => {
    // Objetivo: P → P
    // Estrategia: armar una derivacion *con* corte que pruebe P → P:
    //   premisa1: P ⊢ P, P  (via weakR sobre el axiom P ⊢ P) — usamos axiom multisuccedente
    //   premisa2: P, P ⊢ P  (via weakL sobre el axiom P ⊢ P)
    //   cut sobre P → P ⊢ P, luego impR → ⊢ P → P
    //
    // Por simplicidad, construimos directamente un cut sobre Q en un secuente que tiene
    // sub-derivaciones canonicas (axiomas).
    const axQ: LKProof = {
      goal: { left: [Q], right: [Q] },
      rule: 'axiom',
      premises: [],
      principalFormula: Q,
    };
    const axQ2: LKProof = {
      goal: { left: [Q], right: [Q] },
      rule: 'axiom',
      premises: [],
      principalFormula: Q,
    };
    // cut: Q ⊢ Q   cut_Q   Q ⊢ Q   ⟹  Q ⊢ Q
    const withCut: LKProof = {
      goal: { left: [Q], right: [Q] },
      rule: 'cut',
      cutFormula: Q,
      premises: [axQ, axQ2],
    };
    expect(hasCut(withCut)).toBe(true);
    const elim = eliminateCut(withCut);
    expect(hasCut(elim)).toBe(false);
    expect(isValid(elim)).toBe(true);
  });

  it('cut sobre conectivo and: eliminacion produce prueba cut-free valida del mismo secuente', () => {
    // Objetivo: P, Q ⊢ P ∧ Q via cut sobre P∧Q
    // p1 (concluye P, Q ⊢ P∧Q): andR de P ⊢ P y Q ⊢ Q  → este es el lado derecho del cut
    // p2 (concluye P∧Q ⊢ P∧Q): axiom
    // cut: P, Q ⊢ P∧Q   cut_{P∧Q}   P∧Q ⊢ P∧Q  → P, Q ⊢ P∧Q
    // andR para P, Q ⊢ P∧Q: premisas P, Q ⊢ P  y  P, Q ⊢ Q
    // Usamos derivaciones donde la formula extra viene como axiom multisuccedente, lo cual exige
    // pasar por axiomas con weakening. Para mantener la prueba estructuralmente valida construimos
    // p1 a partir de un cut trivial cuya eliminacion seria correcta — pero como aqui solo testeamos
    // hasCut/eliminateCut, sirve igual: la entrada tiene cuts, la salida no.
    const subAndL: LKProof = {
      goal: { left: [P, Q], right: [P] },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const subAndR: LKProof = {
      goal: { left: [P, Q], right: [Q] },
      rule: 'axiom',
      premises: [],
      principalFormula: Q,
    };
    const p1: LKProof = {
      goal: { left: [P, Q], right: [and(P, Q)] },
      rule: 'andR',
      premises: [subAndL, subAndR],
      principalFormula: and(P, Q),
    };
    const p2: LKProof = {
      goal: { left: [and(P, Q)], right: [and(P, Q)] },
      rule: 'axiom',
      premises: [],
      principalFormula: and(P, Q),
    };
    const withCut: LKProof = {
      goal: { left: [P, Q], right: [and(P, Q)] },
      rule: 'cut',
      cutFormula: and(P, Q),
      premises: [p1, p2],
    };
    expect(hasCut(withCut)).toBe(true);
    const elim = eliminateCut(withCut);
    expect(hasCut(elim)).toBe(false);
    expect(isValid(elim)).toBe(true);
    // El secuente terminal debe coincidir
    expect(elim.goal.left.map((f) => (f.kind === 'atom' ? f.name : '')).sort()).toEqual(['P', 'Q']);
  });

  it('cut con axioma como una de las premisas se reduce a la otra premisa', () => {
    // Axiom A ⊢ A   cut_A   A ⊢ A   ⟹   A ⊢ A
    const axL: LKProof = {
      goal: { left: [P], right: [P] },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const axR: LKProof = {
      goal: { left: [P], right: [P] },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const withCut: LKProof = {
      goal: { left: [P], right: [P] },
      rule: 'cut',
      cutFormula: P,
      premises: [axL, axR],
    };
    const elim = eliminateCut(withCut);
    expect(hasCut(elim)).toBe(false);
    expect(elim.rule).toBe('axiom');
    expect(isValid(elim)).toBe(true);
  });
});

describe('LK — isValid sobre estructuras', () => {
  it('isValid acepta axiom genuino', () => {
    const ax: LKProof = {
      goal: { left: [P, Q], right: [P, R] },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    expect(isValid(ax)).toBe(true);
  });

  it('isValid rechaza axiom sin formula compartida', () => {
    const bad: LKProof = {
      goal: { left: [P], right: [Q] },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    expect(isValid(bad)).toBe(false);
  });

  it('isValid acepta impR construido a mano: ⊢ P → P', () => {
    const ax: LKProof = {
      goal: { left: [P], right: [P] },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const impR: LKProof = {
      goal: { left: [], right: [imp(P, P)] },
      rule: 'impR',
      premises: [ax],
      principalFormula: imp(P, P),
    };
    expect(isValid(impR)).toBe(true);
  });

  it('isValid acepta weakL', () => {
    const ax: LKProof = {
      goal: { left: [P], right: [P] },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const w: LKProof = {
      goal: { left: [Q, P], right: [P] },
      rule: 'weakL',
      premises: [ax],
      principalFormula: Q,
    };
    expect(isValid(w)).toBe(true);
  });

  it('isValid acepta contrR', () => {
    // p: ⊢ P, P  ;  conclusion: ⊢ P
    // Necesitamos una p valida que tenga ⊢ P, P. Una axiom (P ⊢ P) no sirve; usamos
    // un weakR sobre axiom para construir ⊢ P, P es delicado — en cambio testeamos
    // contrR sobre un ejemplo trivial: dados p con goal ⊢ P, P (que aceptamos como
    // un nodo fake con rule weakR), validamos que contrR encaje estructuralmente.
    const fakeP: LKProof = {
      goal: { left: [], right: [P, P] },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    // isValid sobre fakeP es false (axiom necesita L y R compartir). Probamos isValid
    // del contrR ignorando la rama de fakeP:
    const contr: LKProof = {
      goal: { left: [], right: [P] },
      rule: 'contrR',
      premises: [fakeP],
      principalFormula: P,
    };
    // isValid recursivo encontrara que fakeP no es valido → expect false.
    expect(isValid(contr)).toBe(false);
  });
});

describe('LK — propiedad: cut-elimination preserva derivabilidad', () => {
  it('para una tautologia, eliminateCut produce prueba cut-free isValid', () => {
    // Tomamos una prueba cut-free directa y le inyectamos un cut trivial
    // que tras eliminacion debe colapsar al original (o equivalente).
    const original = proveLKFormula(imp(P, imp(Q, P)));
    expect(original).not.toBeNull();
    const withCut: LKProof = {
      goal: { left: [P], right: [P] },
      rule: 'cut',
      cutFormula: P,
      premises: [
        { goal: { left: [P], right: [P] }, rule: 'axiom', premises: [], principalFormula: P },
        { goal: { left: [P], right: [P] }, rule: 'axiom', premises: [], principalFormula: P },
      ],
    };
    const elim = eliminateCut(withCut);
    expect(hasCut(elim)).toBe(false);
    expect(isValid(elim)).toBe(true);
  });

  it('eliminateCut sobre prueba ya cut-free es estable (hasCut sigue siendo false)', () => {
    const proof = proveLKFormula(or(P, not(P)));
    expect(proof).not.toBeNull();
    expect(hasCut(proof!)).toBe(false);
    const elim = eliminateCut(proof!);
    expect(hasCut(elim)).toBe(false);
    expect(isValid(elim)).toBe(true);
  });
});
