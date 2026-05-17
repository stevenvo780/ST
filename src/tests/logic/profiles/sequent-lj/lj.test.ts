import { describe, it, expect } from 'vitest';
import {
  LJFormula,
  LJProof,
  proveLJ,
  proveLJFormula,
  hasCut,
  eliminateCut,
  isValid,
  ljToLk,
  lkToLj,
  glivenkoEmbed,
} from '../../../../logic/profiles/sequent-lj';

// --- Helpers ---
const atom = (name: string): LJFormula => ({ kind: 'atom', name });
const not = (a: LJFormula): LJFormula => ({ kind: 'not', arg: a });
const and = (a: LJFormula, b: LJFormula): LJFormula => ({ kind: 'and', left: a, right: b });
const or = (a: LJFormula, b: LJFormula): LJFormula => ({ kind: 'or', left: a, right: b });
const imp = (a: LJFormula, b: LJFormula): LJFormula => ({ kind: 'implies', left: a, right: b });
const bot: LJFormula = { kind: 'bottom' };

const P = atom('P');
const Q = atom('Q');

function rulesOf(p: LJProof | null | undefined): string[] {
  if (!p) return [];
  const out: string[] = [p.rule];
  for (const sub of p.premises) out.push(...rulesOf(sub));
  return out;
}

describe('LJ — tautologias intuicionistas basicas', () => {
  it('demuestra ⊢ P → P', () => {
    const proof = proveLJFormula(imp(P, P));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
    expect(rulesOf(proof)).toContain('impR');
    expect(rulesOf(proof)).toContain('axiom');
  });

  it('demuestra ⊢ (P ∧ Q) → P', () => {
    const proof = proveLJFormula(imp(and(P, Q), P));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
    expect(rulesOf(proof)).toContain('andL');
  });

  it('demuestra ⊢ (P ∧ Q) → Q', () => {
    const proof = proveLJFormula(imp(and(P, Q), Q));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra ⊢ P → (Q → P)', () => {
    const proof = proveLJFormula(imp(P, imp(Q, P)));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra ⊢ P → (P ∨ Q) usando orR-l', () => {
    const proof = proveLJFormula(imp(P, or(P, Q)));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
    expect(rulesOf(proof)).toContain('orR-l');
  });

  it('demuestra ⊢ Q → (P ∨ Q) usando orR-r', () => {
    const proof = proveLJFormula(imp(Q, or(P, Q)));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
    expect(rulesOf(proof)).toContain('orR-r');
  });

  it('demuestra ¬(P ∧ ¬P) — no contradiccion (intuicionista)', () => {
    const proof = proveLJFormula(not(and(P, not(P))));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra ⊢ ¬¬¬P → ¬P (triple negacion → simple negacion)', () => {
    const proof = proveLJFormula(imp(not(not(not(P))), not(P)));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra ⊢ P → ¬¬P (introduccion de doble negacion)', () => {
    const proof = proveLJFormula(imp(P, not(not(P))));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });

  it('demuestra ⊥ ⊢ P via bottomL (ex falso)', () => {
    const proof = proveLJ({ left: [bot], right: P });
    expect(proof).not.toBeNull();
    expect(proof!.rule).toBe('bottomL');
    expect(isValid(proof!)).toBe(true);
  });
});

describe('LJ — rechaza tautologias clasicas no derivables intuicionistamente', () => {
  it('NO demuestra ⊢ ¬¬P → P (doble negacion clasica)', () => {
    const proof = proveLJFormula(imp(not(not(P)), P));
    expect(proof).toBeNull();
  });

  it('NO demuestra ⊢ P ∨ ¬P (tercio excluido)', () => {
    const proof = proveLJFormula(or(P, not(P)));
    expect(proof).toBeNull();
  });

  it('NO demuestra ley de Peirce: ((P → Q) → P) → P', () => {
    const proof = proveLJFormula(imp(imp(imp(P, Q), P), P));
    expect(proof).toBeNull();
  });

  it('NO demuestra De Morgan "fuerte": ¬(P ∧ Q) → (¬P ∨ ¬Q)', () => {
    // La direccion debil ¬P ∨ ¬Q → ¬(P ∧ Q) si es intuicionista, pero la
    // inversa requiere LEM. La forma clasica es no derivable en LJ.
    const proof = proveLJFormula(imp(not(and(P, Q)), or(not(P), not(Q))));
    expect(proof).toBeNull();
  });
});

describe('LJ — single succedent invariante', () => {
  it('demuestra P, Q ⊢ P ∧ Q via andR', () => {
    const proof = proveLJ({ left: [P, Q], right: and(P, Q) });
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
    expect(rulesOf(proof)).toContain('andR');
  });

  it('demuestra P → Q, P ⊢ Q via impL (modus ponens estructural)', () => {
    const proof = proveLJ({ left: [imp(P, Q), P], right: Q });
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
    expect(rulesOf(proof)).toContain('impL');
  });

  it('rechaza P ⊢ Q (sin relacion)', () => {
    const proof = proveLJ({ left: [P], right: Q });
    expect(proof).toBeNull();
  });

  it('P, ¬P ⊢ Q es derivable (explosion via notL)', () => {
    const proof = proveLJ({ left: [P, not(P)], right: Q });
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });
});

describe('LJ — Hauptsatz / cut elimination', () => {
  it('hasCut es false en pruebas cut-free producidas por proveLJ', () => {
    const proof = proveLJFormula(imp(P, P));
    expect(proof).not.toBeNull();
    expect(hasCut(proof!)).toBe(false);
  });

  it('detecta hasCut=true en una prueba con cut manual', () => {
    const fake: LJProof = {
      goal: { left: [P], right: P },
      rule: 'cut',
      cutFormula: P,
      premises: [
        { goal: { left: [P], right: P }, rule: 'axiom', premises: [], principalFormula: P },
        { goal: { left: [P], right: P }, rule: 'axiom', premises: [], principalFormula: P },
      ],
    };
    expect(hasCut(fake)).toBe(true);
  });

  it('eliminateCut sobre cut trivial (axiom-axiom) colapsa a axiom', () => {
    const ax1: LJProof = {
      goal: { left: [P], right: P },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const ax2: LJProof = {
      goal: { left: [P], right: P },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const withCut: LJProof = {
      goal: { left: [P], right: P },
      rule: 'cut',
      cutFormula: P,
      premises: [ax1, ax2],
    };
    expect(hasCut(withCut)).toBe(true);
    const elim = eliminateCut(withCut);
    expect(hasCut(elim)).toBe(false);
    expect(isValid(elim)).toBe(true);
    expect(elim.rule).toBe('axiom');
  });

  it('eliminateCut preserva la conclusion del secuente', () => {
    const ax1: LJProof = {
      goal: { left: [P], right: P },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const ax2: LJProof = {
      goal: { left: [P], right: P },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const withCut: LJProof = {
      goal: { left: [P], right: P },
      rule: 'cut',
      cutFormula: P,
      premises: [ax1, ax2],
    };
    const elim = eliminateCut(withCut);
    expect(elim.goal.left.length).toBe(1);
    expect(elim.goal.left[0]).toEqual(P);
    expect(elim.goal.right).toEqual(P);
  });

  it('cut sobre conectivo and: eliminateCut produce prueba cut-free valida', () => {
    // Objetivo: P, Q ⊢ P∧Q via cut sobre P∧Q
    // p1 (P, Q ⊢ P∧Q) via andR ; p2 (P∧Q ⊢ P∧Q) axiom
    const subAndL: LJProof = {
      goal: { left: [P, Q], right: P },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const subAndR: LJProof = {
      goal: { left: [P, Q], right: Q },
      rule: 'axiom',
      premises: [],
      principalFormula: Q,
    };
    const p1: LJProof = {
      goal: { left: [P, Q], right: and(P, Q) },
      rule: 'andR',
      premises: [subAndL, subAndR],
      principalFormula: and(P, Q),
    };
    const p2: LJProof = {
      goal: { left: [and(P, Q)], right: and(P, Q) },
      rule: 'axiom',
      premises: [],
      principalFormula: and(P, Q),
    };
    const withCut: LJProof = {
      goal: { left: [P, Q], right: and(P, Q) },
      rule: 'cut',
      cutFormula: and(P, Q),
      premises: [p1, p2],
    };
    expect(hasCut(withCut)).toBe(true);
    const elim = eliminateCut(withCut);
    expect(hasCut(elim)).toBe(false);
    expect(isValid(elim)).toBe(true);
  });

  it('eliminateCut sobre prueba ya cut-free es estable', () => {
    const proof = proveLJFormula(imp(P, imp(Q, P)));
    expect(proof).not.toBeNull();
    expect(hasCut(proof!)).toBe(false);
    const elim = eliminateCut(proof!);
    expect(hasCut(elim)).toBe(false);
    expect(isValid(elim)).toBe(true);
  });
});

describe('LJ — isValid sobre estructuras manuales', () => {
  it('isValid acepta axiom genuino', () => {
    const ax: LJProof = {
      goal: { left: [P, Q], right: P },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    expect(isValid(ax)).toBe(true);
  });

  it('isValid rechaza axiom sin formula compartida', () => {
    const bad: LJProof = {
      goal: { left: [P], right: Q },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    expect(isValid(bad)).toBe(false);
  });

  it('isValid acepta bottomL', () => {
    const ef: LJProof = {
      goal: { left: [bot, P], right: Q },
      rule: 'bottomL',
      premises: [],
    };
    expect(isValid(ef)).toBe(true);
  });

  it('isValid acepta impR construido a mano: ⊢ P → P', () => {
    const ax: LJProof = {
      goal: { left: [P], right: P },
      rule: 'axiom',
      premises: [],
      principalFormula: P,
    };
    const impR: LJProof = {
      goal: { left: [], right: imp(P, P) },
      rule: 'impR',
      premises: [ax],
      principalFormula: imp(P, P),
    };
    expect(isValid(impR)).toBe(true);
  });

  it('isValid valida proof generado por proveLJ', () => {
    const proof = proveLJFormula(imp(and(P, Q), P));
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });
});

describe('LJ ↔ LK conversion', () => {
  it('ljToLk no falla sobre derivacion LJ valida', () => {
    const proof = proveLJFormula(imp(P, P));
    expect(proof).not.toBeNull();
    const lk = ljToLk(proof!);
    expect(lk).toBeDefined();
    expect(lk).not.toBeNull();
    expect(typeof lk).toBe('object');
  });

  it('ljToLk traduce orR-l/orR-r → orR', () => {
    const proof = proveLJFormula(imp(P, or(P, Q)));
    expect(proof).not.toBeNull();
    const lk = ljToLk(proof!) as { rule: string; premises: { rule: string }[] };
    // Buscar la regla orR en el arbol convertido
    const flatRules = (node: { rule: string; premises: { rule: string }[] }): string[] => {
      const out = [node.rule];
      for (const p of node.premises) out.push(...flatRules(p as typeof node));
      return out;
    };
    expect(flatRules(lk as { rule: string; premises: { rule: string }[] })).toContain('orR');
  });

  it('ljToLk preserva conclusion (succedente unitario o vacio)', () => {
    const proof = proveLJFormula(imp(P, P));
    expect(proof).not.toBeNull();
    const lk = ljToLk(proof!) as { goal: { right: unknown[] } };
    expect(Array.isArray(lk.goal.right)).toBe(true);
    expect(lk.goal.right.length).toBe(1);
  });

  it('lkToLj acepta LK con succedente unitario', () => {
    const ljProof = proveLJFormula(imp(P, P));
    expect(ljProof).not.toBeNull();
    const lk = ljToLk(ljProof!);
    const roundTrip = lkToLj(lk);
    expect('rejected' in roundTrip).toBe(false);
    if (!('rejected' in roundTrip)) {
      expect(isValid(roundTrip)).toBe(true);
    }
  });

  it('lkToLj rechaza LK con succedente multiple (clasico)', () => {
    // Fabricamos un LKProof con multisuccedente: ⊢ P, ¬P (tercio excluido)
    const lkMultisucc = {
      goal: {
        left: [],
        right: [
          { kind: 'atom', name: 'P' },
          { kind: 'not', arg: { kind: 'atom', name: 'P' } },
        ],
      },
      rule: 'orR',
      premises: [
        {
          goal: { left: [{ kind: 'atom', name: 'P' }], right: [{ kind: 'atom', name: 'P' }] },
          rule: 'axiom',
          premises: [],
        },
      ],
    };
    const result = lkToLj(lkMultisucc);
    expect('rejected' in result).toBe(true);
    if ('rejected' in result) {
      expect(result.rejected).toMatch(/multisuccedente/);
    }
  });

  it('lkToLj rechaza reglas exclusivas LK (weakR)', () => {
    const lkWithWeakR = {
      goal: { left: [{ kind: 'atom', name: 'P' }], right: [{ kind: 'atom', name: 'P' }] },
      rule: 'weakR',
      premises: [
        {
          goal: { left: [{ kind: 'atom', name: 'P' }], right: [] },
          rule: 'axiom',
          premises: [],
        },
      ],
    };
    const result = lkToLj(lkWithWeakR);
    expect('rejected' in result).toBe(true);
  });
});

describe('LJ — Glivenko embedding', () => {
  it('glivenkoEmbed envuelve la formula en doble negacion', () => {
    const embedded = glivenkoEmbed(P);
    expect(embedded.kind).toBe('not');
    if (embedded.kind === 'not') {
      expect(embedded.arg.kind).toBe('not');
      if (embedded.arg.kind === 'not') {
        expect(embedded.arg.arg).toEqual(P);
      }
    }
  });

  it('Glivenko: aunque P ∨ ¬P NO es intuicionista, ¬¬(P ∨ ¬P) SI lo es', () => {
    // Glivenko: clasico ⊢ φ  sii  intuicionista ⊢ ¬¬φ.
    // P ∨ ¬P es tautologia clasica → su Glivenko-embedding ¬¬(P ∨ ¬P)
    // debe ser derivable en LJ.
    const lem = or(P, not(P));
    const directProof = proveLJFormula(lem);
    expect(directProof).toBeNull(); // LJ no demuestra LEM

    const embedded = glivenkoEmbed(lem);
    const embeddedProof = proveLJFormula(embedded);
    expect(embeddedProof).not.toBeNull();
    expect(isValid(embeddedProof!)).toBe(true);
  });

  it('Glivenko: ¬¬(¬¬P → P) es derivable intuicionistamente (DNE clasica)', () => {
    // ¬¬P → P es la doble negacion clasica (no derivable directamente en LJ).
    // Su Glivenko embedding ¬¬(¬¬P → P) si es derivable en LJ.
    const dne = imp(not(not(P)), P);
    const directProof = proveLJFormula(dne);
    expect(directProof).toBeNull();

    const embedded = glivenkoEmbed(dne);
    const proof = proveLJFormula(embedded);
    expect(proof).not.toBeNull();
    expect(isValid(proof!)).toBe(true);
  });
});
