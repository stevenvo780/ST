import { describe, it, expect } from 'vitest';
import {
  proveIntuitionistically,
  verifyProof,
  kripkeCounterModel,
  isIPCValid,
  atom,
  bottom,
  not,
  and,
  or,
  implies,
  NJProof,
  ProofRule,
} from '../../../logic/profiles/intuitionistic-nj';

// --- Helpers ---

const P = atom('P');
const Q = atom('Q');
const R = atom('R');

function rules(tree: NJProof | null): Set<ProofRule> {
  const out = new Set<ProofRule>();
  const walk = (t: NJProof) => {
    out.add(t.rule);
    t.premises.forEach(walk);
  };
  if (tree) walk(tree);
  return out;
}

// --- Provable en NJ ---

describe('NJ — fórmulas demostrables intuicionistamente', () => {
  it('demuestra P → P (identidad)', () => {
    const proof = proveIntuitionistically([], implies(P, P));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(rules(proof).has('impI')).toBe(true);
    expect(rules(proof).has('assumption')).toBe(true);
  });

  it('demuestra (P ∧ Q) → P (proyección izquierda)', () => {
    const proof = proveIntuitionistically([], implies(and(P, Q), P));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra (P ∧ Q) → Q (proyección derecha)', () => {
    const proof = proveIntuitionistically([], implies(and(P, Q), Q));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra P → (Q → P) (estabilidad)', () => {
    const proof = proveIntuitionistically([], implies(P, implies(Q, P)));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra ((P → Q) ∧ P) → Q (modus ponens curry)', () => {
    const proof = proveIntuitionistically([], implies(and(implies(P, Q), P), Q));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(rules(proof).has('impE')).toBe(true);
  });

  it('demuestra ¬(P ∧ ¬P) (no-contradicción)', () => {
    const proof = proveIntuitionistically([], not(and(P, not(P))));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(rules(proof).has('notI')).toBe(true);
  });

  it('demuestra P → ¬¬P (introducción de doble negación)', () => {
    const proof = proveIntuitionistically([], implies(P, not(not(P))));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra ¬P → (P → ⊥) (definición de negación)', () => {
    const proof = proveIntuitionistically([], implies(not(P), implies(P, bottom())));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra (P → Q) → (¬Q → ¬P) (contraposición)', () => {
    const proof = proveIntuitionistically([], implies(implies(P, Q), implies(not(Q), not(P))));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra (P ∧ ¬P) → Q (ex falso vía contradicción)', () => {
    const proof = proveIntuitionistically([], implies(and(P, not(P)), Q));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra ⊥ → Q desde el contexto (ex falso quodlibet)', () => {
    const proof = proveIntuitionistically([bottom()], Q);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!, [bottom()])).toBe(true);
    expect(rules(proof).has('bottomE')).toBe(true);
  });

  it('demuestra (P ∨ Q) → (Q ∨ P) (commutatividad de ∨)', () => {
    const proof = proveIntuitionistically([], implies(or(P, Q), or(Q, P)));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(rules(proof).has('orE')).toBe(true);
  });

  it('demuestra P ∨ ¬P bajo la asunción de P (asunción directa)', () => {
    const proof = proveIntuitionistically([P], or(P, not(P)));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!, [P])).toBe(true);
  });

  it('demuestra modus ponens: {P, P→Q} ⊢ Q', () => {
    const proof = proveIntuitionistically([P, implies(P, Q)], Q);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!, [P, implies(P, Q)])).toBe(true);
    expect(rules(proof).has('impE')).toBe(true);
  });

  it('demuestra (P → Q) → ((Q → R) → (P → R)) (composición)', () => {
    const proof = proveIntuitionistically(
      [],
      implies(implies(P, Q), implies(implies(Q, R), implies(P, R))),
    );
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });
});

// --- No provable en NJ: contraejemplos clásicos ---

describe('NJ — fórmulas no demostrables intuicionistamente (counter-model Kripke)', () => {
  it('NO demuestra ¬¬P → P (DNE clásica)', () => {
    const proof = proveIntuitionistically([], implies(not(not(P)), P));
    expect(proof).toBeNull();
    const cm = kripkeCounterModel(implies(not(not(P)), P));
    expect(cm).not.toBeNull();
    expect(cm!.worlds.length).toBeGreaterThanOrEqual(2);
  });

  it('NO demuestra P ∨ ¬P (LEM)', () => {
    const proof = proveIntuitionistically([], or(P, not(P)));
    expect(proof).toBeNull();
    const cm = kripkeCounterModel(or(P, not(P)));
    expect(cm).not.toBeNull();
    // El counter-model típico: w0 no fuerza P pero algún w0 ≤ v fuerza P.
    expect(cm!.worlds.length).toBeGreaterThanOrEqual(2);
  });

  it('NO demuestra ((P → Q) → P) → P (ley de Peirce)', () => {
    const proof = proveIntuitionistically([], implies(implies(implies(P, Q), P), P));
    expect(proof).toBeNull();
    const cm = kripkeCounterModel(implies(implies(implies(P, Q), P), P));
    expect(cm).not.toBeNull();
  });

  it('NO demuestra ¬(P ∧ Q) → (¬P ∨ ¬Q) (De Morgan unilateral)', () => {
    const proof = proveIntuitionistically([], implies(not(and(P, Q)), or(not(P), not(Q))));
    expect(proof).toBeNull();
    const cm = kripkeCounterModel(implies(not(and(P, Q)), or(not(P), not(Q))));
    expect(cm).not.toBeNull();
  });

  it('SÍ demuestra (¬P ∨ ¬Q) → ¬(P ∧ Q) (De Morgan trivial)', () => {
    // El otro sentido de De Morgan SÍ es intuicionista — sanity check.
    const proof = proveIntuitionistically([], implies(or(not(P), not(Q)), not(and(P, Q))));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  // Regresión BUG-T1: el "dilema" (P→Q) ∨ (Q→R) ∨ (R→P) es clásicamente
  // válido pero NO intuicionista. Su menor contramodelo requiere >2 mundos,
  // y la cota anterior (2 mundos para ≥3 átomos) lo declaraba VÁLIDO por
  // error. La cota de filtración por subfórmulas lo refuta correctamente.
  it('NO demuestra (P→Q) ∨ (Q→R) ∨ (R→P) (dilema no-intuicionista)', () => {
    const dilemma = or(or(implies(P, Q), implies(Q, R)), implies(R, P));
    const proof = proveIntuitionistically([], dilemma);
    expect(proof).toBeNull();
    const cm = kripkeCounterModel(dilemma);
    expect(cm).not.toBeNull();
    expect(cm!.worlds.length).toBeGreaterThanOrEqual(3);
    expect(isIPCValid(dilemma)).toBe(false);
  });
});

// --- Cross-check prover vs Kripke ---

describe('NJ — coherencia entre prover y semántica Kripke', () => {
  it('toda fórmula demostrada NJ es válida en Kripke', () => {
    const provables = [
      implies(P, P),
      implies(and(P, Q), P),
      implies(P, implies(Q, P)),
      not(and(P, not(P))),
      implies(P, not(not(P))),
      implies(and(implies(P, Q), P), Q),
    ];
    for (const f of provables) {
      expect(proveIntuitionistically([], f), `prover should prove`).not.toBeNull();
      expect(isIPCValid(f), `kripke should validate`).toBe(true);
    }
  }, 30000);

  it('toda fórmula con counter-model NO es demostrable NJ', () => {
    const refutables = [
      implies(not(not(P)), P), // DNE
      or(P, not(P)), // LEM
      implies(implies(implies(P, Q), P), P), // Peirce
    ];
    for (const f of refutables) {
      expect(kripkeCounterModel(f), `counter-model exists`).not.toBeNull();
      expect(proveIntuitionistically([], f), `prover should fail`).toBeNull();
    }
  });

  it('counter-model LEM: w0 ⊮ P ∨ ¬P (estructura del modelo de Kripke)', () => {
    const cm = kripkeCounterModel(or(P, not(P)));
    expect(cm).not.toBeNull();
    // El modelo mínimo tiene dos mundos: w0 (sin P) y un w0 ≤ v (con P).
    // En w0, ¬P falla porque hay un futuro v con P; P falla porque w0 no lo fuerza.
    expect(cm!.worlds).toContain('w0');
    const allAtoms = new Set<string>();
    for (const set of cm!.forcing.values()) for (const a of set) allAtoms.add(a);
    expect(allAtoms.has('P')).toBe(true);
    expect(cm!.forcing.get('w0')?.has('P') ?? false).toBe(false);
  });
});

// --- Estructura del árbol NJ ---

describe('NJ — propiedades estructurales del árbol', () => {
  it('verifyProof rechaza un árbol mal formado', () => {
    const bad: NJProof = {
      conclusion: P,
      rule: 'assumption',
      premises: [],
    };
    // P no está en el contexto vacío.
    expect(verifyProof(bad, [])).toBe(false);
  });

  it('impI descarga el antecedente del contexto', () => {
    const proof = proveIntuitionistically([], implies(P, P));
    expect(proof).not.toBeNull();
    expect(proof!.rule).toBe('impI');
    expect(proof!.discharged?.length).toBe(1);
    expect(proof!.discharged![0].kind).toBe('atom');
  });

  it('notI deriva ⊥ desde la asunción descargada', () => {
    const proof = proveIntuitionistically([], not(and(P, not(P))));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    // La raíz es notI con discharge sobre P ∧ ¬P
    expect(proof!.rule).toBe('notI');
    expect(proof!.discharged?.length).toBe(1);
  });

  it('cada premisa de andI prueba la respectiva conjunción', () => {
    const proof = proveIntuitionistically([P, Q], and(P, Q));
    expect(proof).not.toBeNull();
    expect(proof!.rule).toBe('andI');
    expect(proof!.premises.length).toBe(2);
    expect(proof!.premises[0].conclusion.kind).toBe('atom');
    expect(proof!.premises[1].conclusion.kind).toBe('atom');
  });
});
