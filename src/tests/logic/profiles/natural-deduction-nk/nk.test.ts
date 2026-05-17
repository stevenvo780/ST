import { describe, it, expect } from 'vitest';
import {
  proveClassically,
  proveIntuitOnly,
  verifyProof,
  provedPeirce,
  provedDNE,
  provedLEM,
  nkToNJ,
  atom,
  bottom,
  not,
  and,
  or,
  implies,
  NKProof,
  NKRule,
  CLASSICAL_ONLY_RULES,
} from '../../../../logic/profiles/natural-deduction-nk';

// --- Helpers ---

const P = atom('P');
const Q = atom('Q');

function rules(tree: NKProof | null): Set<NKRule> {
  const out = new Set<NKRule>();
  const walk = (t: NKProof) => {
    out.add(t.rule);
    t.premises.forEach(walk);
  };
  if (tree) walk(tree);
  return out;
}

// --- Provable en NK (fragmento intuicionista) ---

describe('NK — fragmento intuicionista (debe seguir siendo demostrable)', () => {
  it('demuestra P → P (identidad)', () => {
    const proof = proveClassically([], implies(P, P));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(rules(proof).has('impI')).toBe(true);
  });

  it('demuestra (P ∧ Q) → P (proyección izquierda)', () => {
    const proof = proveClassically([], implies(and(P, Q), P));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra (P ∧ Q) → Q (proyección derecha)', () => {
    const proof = proveClassically([], implies(and(P, Q), Q));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra modus ponens: {P, P→Q} ⊢ Q', () => {
    const proof = proveClassically([P, implies(P, Q)], Q);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!, [P, implies(P, Q)])).toBe(true);
    expect(rules(proof).has('impE')).toBe(true);
  });

  it('demuestra ¬(P ∧ ¬P) (no-contradicción)', () => {
    const proof = proveClassically([], not(and(P, not(P))));
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(rules(proof).has('notI')).toBe(true);
  });
});

// --- Provable en NK pero NO en NJ (clásicas) ---

describe('NK — teoremas clásicos (no demostrables en NJ)', () => {
  it('demuestra ¬¬P → P (DNE)', () => {
    const goal = implies(not(not(P)), P);
    const proof = proveClassically([], goal);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    // El fragmento NJ no la prueba.
    expect(proveIntuitOnly([], goal)).toBeNull();
  });

  it('demuestra P ∨ ¬P (LEM)', () => {
    const goal = or(P, not(P));
    const proof = proveClassically([], goal);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(proveIntuitOnly([], goal)).toBeNull();
  });

  it('demuestra ((P → Q) → P) → P (ley de Peirce)', () => {
    const goal = implies(implies(implies(P, Q), P), P);
    const proof = proveClassically([], goal);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(proveIntuitOnly([], goal)).toBeNull();
  });

  it('demuestra modus tollens clásico: ((P→Q) ∧ ¬Q) → ¬P', () => {
    const goal = implies(and(implies(P, Q), not(Q)), not(P));
    const proof = proveClassically([], goal);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
  });

  it('demuestra De Morgan clásico: ¬(P ∧ Q) → (¬P ∨ ¬Q)', () => {
    const goal = implies(not(and(P, Q)), or(not(P), not(Q)));
    const proof = proveClassically([], goal);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(proveIntuitOnly([], goal)).toBeNull();
  });

  it('demuestra contraposición clásica completa: (¬Q → ¬P) → (P → Q)', () => {
    // El sentido "no intuicionista" de la contraposición.
    const goal = implies(implies(not(Q), not(P)), implies(P, Q));
    const proof = proveClassically([], goal);
    expect(proof).not.toBeNull();
    expect(verifyProof(proof!)).toBe(true);
    expect(proveIntuitOnly([], goal)).toBeNull();
  });
});

// --- Estructura y verificación ---

describe('NK — verifyProof y axiomas derivados', () => {
  it('verifyProof rechaza un árbol mal formado (asunción fuera de contexto)', () => {
    const bad: NKProof = {
      conclusion: P,
      rule: 'assumption',
      premises: [],
    };
    expect(verifyProof(bad, [])).toBe(false);
  });

  it('verifyProof valida LEM axiomático estructuralmente', () => {
    const lem: NKProof = {
      conclusion: or(P, not(P)),
      rule: 'LEM',
      premises: [],
    };
    expect(verifyProof(lem)).toBe(true);
  });

  it('verifyProof rechaza LEM con disyunción inválida', () => {
    const fakeLem: NKProof = {
      conclusion: or(P, not(Q)), // ¡no es P ∨ ¬P!
      rule: 'LEM',
      premises: [],
    };
    expect(verifyProof(fakeLem)).toBe(false);
  });

  it('verifyProof valida doubleNegE estructuralmente', () => {
    const dne: NKProof = {
      conclusion: P,
      rule: 'doubleNegE',
      premises: [{ conclusion: not(not(P)), rule: 'assumption', premises: [] }],
    };
    expect(verifyProof(dne, [not(not(P))])).toBe(true);
  });

  it('verifyProof valida rAA estructuralmente', () => {
    // Demostramos P a partir de P (trivial) vía rAA: asume ¬P, deriva ⊥
    // por contradicción con P (que asumimos en el contexto externo).
    const raa: NKProof = {
      conclusion: P,
      rule: 'rAA',
      premises: [
        {
          conclusion: bottom(),
          rule: 'notE',
          premises: [
            { conclusion: not(P), rule: 'assumption', premises: [] },
            { conclusion: P, rule: 'assumption', premises: [] },
          ],
        },
      ],
      discharged: [not(P)],
    };
    expect(verifyProof(raa, [P])).toBe(true);
  });

  it('verifyProof valida la prueba canónica de Peirce', () => {
    const proof = provedPeirce();
    expect(verifyProof(proof)).toBe(true);
  });

  it('verifyProof valida la prueba canónica de DNE', () => {
    const proof = provedDNE();
    expect(verifyProof(proof)).toBe(true);
  });

  it('verifyProof valida la prueba canónica de LEM', () => {
    const proof = provedLEM();
    expect(verifyProof(proof)).toBe(true);
  });
});

// --- Traducción NK → NJ ---

describe('NK → NJ — detección de pruebas clásicas', () => {
  it('nkToNJ acepta una prueba puramente intuicionista (P → P)', () => {
    const proof = proveClassically([], implies(P, P));
    expect(proof).not.toBeNull();
    const result = nkToNJ(proof!);
    expect(result.converted).toBeDefined();
    expect(result.reason).toBeUndefined();
  });

  it('nkToNJ rechaza una prueba que usa LEM/rAA/Peirce/DNE', () => {
    const proof = proveClassically([], or(P, not(P)));
    expect(proof).not.toBeNull();
    const result = nkToNJ(proof!);
    expect(result.converted).toBeUndefined();
    expect(result.reason).toBeDefined();
    // Debe mencionar alguna regla clásica.
    const mentionsClassical = CLASSICAL_ONLY_RULES.some((r) => result.reason!.includes(r));
    expect(mentionsClassical).toBe(true);
  });

  it('nkToNJ rechaza la prueba clásica de DNE', () => {
    const proof = proveClassically([], implies(not(not(P)), P));
    expect(proof).not.toBeNull();
    const result = nkToNJ(proof!);
    expect(result.reason).toBeDefined();
  });

  it('nkToNJ rechaza una prueba que contiene rAA explícita en una hoja interna', () => {
    // Construimos manualmente una prueba híbrida: usa rAA en el interior
    // pero concluye una fórmula que NJ también probaría.
    const hybrid: NKProof = {
      conclusion: implies(P, P),
      rule: 'impI',
      premises: [
        {
          conclusion: P,
          rule: 'rAA',
          premises: [
            {
              conclusion: bottom(),
              rule: 'notE',
              premises: [
                { conclusion: not(P), rule: 'assumption', premises: [] },
                { conclusion: P, rule: 'assumption', premises: [] },
              ],
            },
          ],
          discharged: [not(P)],
        },
      ],
      discharged: [P],
    };
    // Esta prueba es válida estructuralmente.
    expect(verifyProof(hybrid)).toBe(true);
    // Pero usa rAA, así que nkToNJ no la traduce.
    const result = nkToNJ(hybrid);
    expect(result.reason).toBeDefined();
    expect(result.reason!.includes('rAA')).toBe(true);
  });
});

// --- Estructura del árbol NK ---

describe('NK — propiedades estructurales del árbol', () => {
  it('rAA descarga la negación de la meta', () => {
    // Pedimos algo que requiere clásica: ¬¬P → P.
    const proof = proveClassically([], implies(not(not(P)), P));
    expect(proof).not.toBeNull();
    // En alguna parte de la prueba debe aparecer rAA o doubleNegE.
    const r = rules(proof);
    const usesClassical = ['rAA', 'doubleNegE', 'LEM', 'pierce'].some((x) => r.has(x as NKRule));
    expect(usesClassical).toBe(true);
  });

  it('impI descarga el antecedente del contexto', () => {
    const proof = proveClassically([], implies(P, P));
    expect(proof).not.toBeNull();
    expect(proof!.rule).toBe('impI');
    expect(proof!.discharged?.length).toBe(1);
  });

  it('cada premisa de andI prueba la respectiva conjunción', () => {
    const proof = proveClassically([P, Q], and(P, Q));
    expect(proof).not.toBeNull();
    expect(proof!.rule).toBe('andI');
    expect(proof!.premises.length).toBe(2);
  });

  it('CLASSICAL_ONLY_RULES contiene exactamente las 4 reglas clásicas', () => {
    expect(CLASSICAL_ONLY_RULES).toContain('doubleNegE');
    expect(CLASSICAL_ONLY_RULES).toContain('LEM');
    expect(CLASSICAL_ONLY_RULES).toContain('pierce');
    expect(CLASSICAL_ONLY_RULES).toContain('rAA');
    expect(CLASSICAL_ONLY_RULES.length).toBe(4);
  });
});

// --- Sanidad: no demuestra falsedades ---

describe('NK — el sistema no demuestra falsedades', () => {
  it('NO demuestra ⊥ desde el contexto vacío', () => {
    const proof = proveClassically([], bottom());
    expect(proof).toBeNull();
  });

  it('NO demuestra P desde el contexto vacío (atómico no derivable)', () => {
    const proof = proveClassically([], P);
    expect(proof).toBeNull();
  });

  it('NO demuestra P ∧ Q sin tener ambos', () => {
    const proof = proveClassically([P], and(P, Q));
    expect(proof).toBeNull();
  });

  it('NO demuestra Q desde {P} (sin enlace alguno)', () => {
    const proof = proveClassically([P], Q);
    expect(proof).toBeNull();
  });

  it('rechaza rAA con discharged incorrecto', () => {
    const bad: NKProof = {
      conclusion: P,
      rule: 'rAA',
      premises: [
        {
          conclusion: bottom(),
          rule: 'notE',
          premises: [
            { conclusion: not(P), rule: 'assumption', premises: [] },
            { conclusion: P, rule: 'assumption', premises: [] },
          ],
        },
      ],
      discharged: [not(Q)], // ¡debería ser ¬P!
    };
    expect(verifyProof(bad, [P])).toBe(false);
  });
});
