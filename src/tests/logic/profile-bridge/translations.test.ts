// ============================================================
// ST Profile Bridge — Tests
// ============================================================
// Cubre: Glivenko ¬¬-translation, Gödel-McKinsey-Tarski □-embedding,
// LTL→CTL, CTL→LTL, findTranslationPath, translateFormula round-trip.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  glivenkoTranslation,
  godelTranslation,
  ltlToCTL,
  ctlToLTL,
  findTranslationPath,
  translateFormula,
  TRANSLATIONS,
} from '../../../logic/profile-bridge';
import type { Formula } from '../../../types';
import type { LTLFormula } from '../../../logic/profiles/ltl-sat/types';
import type { CTLFormula } from '../../../logic/profiles/ctl/types';

// ── Helpers ──────────────────────────────────────────────────

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (...args: Formula[]): Formula => ({ kind: 'not', args });
const and = (...args: Formula[]): Formula => ({ kind: 'and', args });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const _box = (f: Formula): Formula => ({ kind: 'modal_necessity', args: [f] });

const ltlAtom = (name: string): LTLFormula => ({ kind: 'atom', name });
const ltlNot = (arg: LTLFormula): LTLFormula => ({ kind: 'not', arg });
const ltlAnd = (...args: LTLFormula[]): LTLFormula => ({ kind: 'and', args });
const _ltlOr = (...args: LTLFormula[]): LTLFormula => ({ kind: 'or', args });
const ltlX = (arg: LTLFormula): LTLFormula => ({ kind: 'X', arg });
const ltlF = (arg: LTLFormula): LTLFormula => ({ kind: 'F', arg });
const ltlG = (arg: LTLFormula): LTLFormula => ({ kind: 'G', arg });
const ltlU = (l: LTLFormula, r: LTLFormula): LTLFormula => ({ kind: 'U', left: l, right: r });
const ltlR = (l: LTLFormula, r: LTLFormula): LTLFormula => ({ kind: 'R', left: l, right: r });

const ctlAtom = (name: string): CTLFormula => ({ kind: 'atom', name });
const _ctlNot = (arg: CTLFormula): CTLFormula => ({ kind: 'not', arg });
const ctlEX = (arg: CTLFormula): CTLFormula => ({ kind: 'EX', arg });
const ctlAF = (arg: CTLFormula): CTLFormula => ({ kind: 'AF', arg });
const ctlEG = (arg: CTLFormula): CTLFormula => ({ kind: 'EG', arg });
const ctlAU = (l: CTLFormula, r: CTLFormula): CTLFormula => ({ kind: 'AU', left: l, right: r });

// ── Glivenko ¬¬-translation ───────────────────────────────────

describe('Glivenko — ¬¬-translation (intuitionistic → classical)', () => {
  it('P → ¬¬P: átomo se envuelve en doble negación', () => {
    const result = glivenkoTranslation(atom('P'));
    // átomo P → ¬¬P
    expect(result.kind).toBe('not');
    const outer = result.args?.[0];
    expect(outer?.kind).toBe('not');
    expect(outer?.args?.[0]?.kind).toBe('atom');
    expect(outer?.args?.[0]?.name).toBe('P');
  });

  it('¬P → ¬P: negación no acumula dobles negaciones adicionales', () => {
    const result = glivenkoTranslation(not(atom('P')));
    // ¬P → ¬(glivenko(P)) = ¬(¬¬P)
    expect(result.kind).toBe('not');
    const inner = result.args?.[0];
    // inner es la traducción de P = ¬¬P
    expect(inner?.kind).toBe('not');
  });

  it('(P→Q) → ¬¬(¬¬P → ¬¬Q): implicación queda bajo ¬¬', () => {
    const result = glivenkoTranslation(implies(atom('P'), atom('Q')));
    // implies se envuelve en ¬¬
    expect(result.kind).toBe('not');
    const level1 = result.args?.[0];
    expect(level1?.kind).toBe('not');
    const level2 = level1?.args?.[0];
    // el contenido es implies con args traducidos
    expect(level2?.kind).toBe('implies');
  });

  it('⊤ permanece sin cambios', () => {
    const result = glivenkoTranslation({ kind: 'true' } as Formula);
    expect(result.kind).toBe('true');
  });

  it('⊥ permanece sin cambios', () => {
    const result = glivenkoTranslation({ kind: 'false' } as Formula);
    expect(result.kind).toBe('false');
  });

  it('P∧Q → ¬¬(¬¬P ∧ ¬¬Q): conjunción bajo ¬¬', () => {
    const result = glivenkoTranslation(and(atom('P'), atom('Q')));
    expect(result.kind).toBe('not');
    const inner = result.args?.[0];
    expect(inner?.kind).toBe('not');
    const content = inner?.args?.[0];
    expect(content?.kind).toBe('and');
    expect(content?.args).toHaveLength(2);
    // cada arg es ¬¬atom
    expect(content?.args?.[0]?.kind).toBe('not');
    expect(content?.args?.[1]?.kind).toBe('not');
  });
});

// ── Gödel-McKinsey-Tarski □-embedding ────────────────────────

describe('Gödel-McKinsey-Tarski — □-embedding (classical → S4)', () => {
  it('P → □P: átomo se envuelve en □', () => {
    const result = godelTranslation(atom('P'));
    expect(result.kind).toBe('modal_necessity');
    expect(result.args?.[0]?.kind).toBe('atom');
    expect(result.args?.[0]?.name).toBe('P');
  });

  it('¬P → □¬□P: negación queda bajo □', () => {
    const result = godelTranslation(not(atom('P')));
    // ¬P → □¬(□P)
    expect(result.kind).toBe('modal_necessity');
    const inner = result.args?.[0];
    expect(inner?.kind).toBe('not');
    const doubleBoxed = inner?.args?.[0];
    expect(doubleBoxed?.kind).toBe('modal_necessity');
  });

  it('P→Q → □(□P → □Q): implicación se empotra bajo □', () => {
    const result = godelTranslation(implies(atom('P'), atom('Q')));
    expect(result.kind).toBe('modal_necessity');
    const inner = result.args?.[0];
    expect(inner?.kind).toBe('implies');
    // ambos lados también son □
    expect(inner?.args?.[0]?.kind).toBe('modal_necessity');
    expect(inner?.args?.[1]?.kind).toBe('modal_necessity');
  });

  it('⊤ permanece sin cambios', () => {
    const result = godelTranslation({ kind: 'true' } as Formula);
    expect(result.kind).toBe('true');
  });

  it('P∧Q → □P ∧ □Q: conjunción distribuye sin □ extra', () => {
    const result = godelTranslation(and(atom('P'), atom('Q')));
    // and no añade □ extra en la raíz
    expect(result.kind).toBe('and');
    expect(result.args?.[0]?.kind).toBe('modal_necessity');
    expect(result.args?.[1]?.kind).toBe('modal_necessity');
  });
});

// ── LTL → CTL ────────────────────────────────────────────────

describe('LTL → CTL — embedding existencial', () => {
  it('X p → EX p', () => {
    const result = ltlToCTL(ltlX(ltlAtom('p')));
    expect(result.kind).toBe('EX');
    const inner = result as { kind: 'EX'; arg: CTLFormula };
    expect(inner.arg.kind).toBe('atom');
  });

  it('F p → EF p', () => {
    const result = ltlToCTL(ltlF(ltlAtom('p')));
    expect(result.kind).toBe('EF');
  });

  it('G p → EG p', () => {
    const result = ltlToCTL(ltlG(ltlAtom('p')));
    expect(result.kind).toBe('EG');
  });

  it('p U q → E[p U q]', () => {
    const result = ltlToCTL(ltlU(ltlAtom('p'), ltlAtom('q')));
    expect(result.kind).toBe('EU');
  });

  it('p R q → ¬E[¬q U ¬p] (dualidad de release)', () => {
    const result = ltlToCTL(ltlR(ltlAtom('p'), ltlAtom('q')));
    // ¬E[¬q U ¬p]
    expect(result.kind).toBe('not');
    const inner = result as { kind: 'not'; arg: CTLFormula };
    expect(inner.arg.kind).toBe('EU');
  });

  it('¬p ∧ (X q) → CTL equivalente', () => {
    const ltlF = ltlAnd(ltlNot(ltlAtom('p')), ltlX(ltlAtom('q')));
    const result = ltlToCTL(ltlF);
    expect(result.kind).toBe('and');
    const r = result as { kind: 'and'; args: CTLFormula[] };
    expect(r.args[0]?.kind).toBe('not');
    expect(r.args[1]?.kind).toBe('EX');
  });
});

// ── CTL → LTL ────────────────────────────────────────────────

describe('CTL → LTL — aproximación lineal (partial)', () => {
  it('EX p → X p', () => {
    const result = ctlToLTL(ctlEX(ctlAtom('p')));
    expect(result.kind).toBe('X');
  });

  it('AF p → F p (A-operators se aproximan como E)', () => {
    const result = ctlToLTL(ctlAF(ctlAtom('p')));
    expect(result.kind).toBe('F');
  });

  it('EG p → G p', () => {
    const result = ctlToLTL(ctlEG(ctlAtom('p')));
    expect(result.kind).toBe('G');
  });

  it('A[p U q] → p U q', () => {
    const result = ctlToLTL(ctlAU(ctlAtom('p'), ctlAtom('q')));
    expect(result.kind).toBe('U');
  });
});

// ── findTranslationPath ───────────────────────────────────────

describe('findTranslationPath — BFS sobre grafo de traducciones', () => {
  it('intuitionistic → classical: ruta directa [intuit, classical]', () => {
    const path = findTranslationPath('intuitionistic', 'classical');
    expect(path).toEqual(['intuitionistic', 'classical']);
  });

  it('intuitionistic → S4: ruta directa disponible', () => {
    const path = findTranslationPath('intuitionistic', 'S4');
    expect(path).not.toBeNull();
    expect(path![0]).toBe('intuitionistic');
    expect(path![path!.length - 1]).toBe('S4');
  });

  it('classical → S4: ruta directa [classical, S4]', () => {
    const path = findTranslationPath('classical', 'S4');
    expect(path).toEqual(['classical', 'S4']);
  });

  it('LTL → CTL: ruta directa [LTL, CTL]', () => {
    const path = findTranslationPath('LTL', 'CTL');
    expect(path).toEqual(['LTL', 'CTL']);
  });

  it('mismo perfil devuelve [perfil] sin traducciones', () => {
    expect(findTranslationPath('classical', 'classical')).toEqual(['classical']);
    expect(findTranslationPath('LTL', 'LTL')).toEqual(['LTL']);
  });

  it('S4 → intuitionistic: no hay ruta disponible → null', () => {
    const path = findTranslationPath('S4', 'intuitionistic');
    expect(path).toBeNull();
  });
});

// ── translateFormula (API de alto nivel) ──────────────────────

describe('translateFormula — traducción de alto nivel', () => {
  it('traduce átomo intuicionista → clásico (Glivenko)', () => {
    const result = translateFormula({ profile: 'intuitionistic', ast: atom('P') }, 'classical');
    expect(result).not.toBeNull();
    expect(result!.profile).toBe('classical');
    // resultado es ¬¬P
    expect((result!.ast as Formula).kind).toBe('not');
  });

  it('traduce átomo clásico → S4 (Gödel)', () => {
    const result = translateFormula({ profile: 'classical', ast: atom('P') }, 'S4');
    expect(result).not.toBeNull();
    expect(result!.profile).toBe('S4');
    expect((result!.ast as Formula).kind).toBe('modal_necessity');
  });

  it('traduce fórmula LTL → CTL', () => {
    const f: LTLFormula = ltlF(ltlAtom('goal'));
    const result = translateFormula({ profile: 'LTL', ast: f }, 'CTL');
    expect(result).not.toBeNull();
    expect(result!.profile).toBe('CTL');
    expect((result!.ast as CTLFormula).kind).toBe('EF');
  });

  it('devuelve null si no hay ruta disponible', () => {
    const result = translateFormula({ profile: 'S4', ast: atom('X') }, 'fuzzy');
    expect(result).toBeNull();
  });

  it('mismo perfil → devuelve fórmula sin modificar', () => {
    const f = atom('P');
    const result = translateFormula({ profile: 'classical', ast: f }, 'classical');
    expect(result).not.toBeNull();
    expect(result!.ast).toBe(f);
  });
});

// ── TRANSLATIONS registro ─────────────────────────────────────

describe('TRANSLATIONS — estructura del registro', () => {
  it('contiene al menos 5 traducciones registradas', () => {
    expect(TRANSLATIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('todas las entradas tienen source, target, translate y validity', () => {
    for (const t of TRANSLATIONS) {
      expect(t.source).toBeTruthy();
      expect(t.target).toBeTruthy();
      expect(typeof t.translate).toBe('function');
      expect(['preserved', 'one-way', 'partial']).toContain(t.validity);
    }
  });

  it('intuitionistic→classical está marcada como preserved', () => {
    const t = TRANSLATIONS.find((x) => x.source === 'intuitionistic' && x.target === 'classical');
    expect(t).toBeDefined();
    expect(t!.validity).toBe('preserved');
  });

  it('CTL→LTL está marcada como partial', () => {
    const t = TRANSLATIONS.find((x) => x.source === 'CTL' && x.target === 'LTL');
    expect(t).toBeDefined();
    expect(t!.validity).toBe('partial');
  });

  it('LTL→CTL está marcada como one-way', () => {
    const t = TRANSLATIONS.find((x) => x.source === 'LTL' && x.target === 'CTL');
    expect(t).toBeDefined();
    expect(t!.validity).toBe('one-way');
  });
});
