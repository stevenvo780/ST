import { describe, it, expect } from 'vitest';
import {
  deriveWithCitations,
  explainProof,
  type CitedClaim,
  type CitationDerivation,
  type Evaluator,
} from '../../citation-reasoning';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Evaluador simple de modus ponens para fórmulas con la forma "P -> Q". */
function modusPonensEvaluator(): Evaluator {
  return (premises, goal) => {
    // Si premises contiene "P -> Q" y "P", y goal es "Q" → válido.
    for (const p of premises) {
      const match = /^(.+?)\s*->\s*(.+)$/.exec(p.trim());
      if (!match) continue;
      const antecedent = match[1].trim();
      const consequent = match[2].trim();
      if (consequent === goal.trim() && premises.includes(antecedent)) {
        return Promise.resolve({
          valid: true,
          proof: {
            steps: [{ formula: antecedent }, { formula: p }, { formula: goal }],
          },
        });
      }
    }
    return Promise.resolve({ valid: false });
  };
}

/** Evaluador que siempre falla (para probar casos negativos). */
const alwaysInvalidEvaluator: Evaluator = () => Promise.resolve({ valid: false });

/** Evaluador que siempre tiene éxito (para probar derivación local pura). */
const alwaysValidEvaluator: Evaluator = (_premises, goal) =>
  Promise.resolve({
    valid: true,
    proof: { steps: [{ formula: goal }] },
  });

// ---------------------------------------------------------------------------
// Test 1: 2 citas + 1 premisa local → goal Q via modus ponens
// ---------------------------------------------------------------------------

describe('deriveWithCitations — modus ponens con premisas citadas', () => {
  it('derivación válida: 2 citations + 1 premisa local producen el goal', async () => {
    const citations: CitedClaim[] = [
      {
        id: 'thm-01',
        docId: 'doc-filosofia',
        formula: 'P -> Q',
        profile: 'classical.propositional',
        weight: 2,
      },
      {
        id: 'ax-01',
        docId: 'doc-logica',
        formula: 'A -> B',
        profile: 'classical.propositional',
        weight: 1,
      },
    ];

    const derivation: CitationDerivation = {
      goal: 'Q',
      citations,
      localPremises: ['P'],
    };

    const result = await deriveWithCitations(derivation, modusPonensEvaluator());

    expect(result.valid).toBe(true);

    // Traza debe incluir pasos de citas, premisa local y conclusión.
    const citeSteps = result.trace.filter((s) => s.cite !== undefined);
    expect(citeSteps).toHaveLength(2);

    const localSteps = result.trace.filter((s) => s.step.startsWith('premisa local:'));
    expect(localSteps).toHaveLength(1);

    const conclusionStep = result.trace.find((s) => s.step.includes('(válida)'));
    expect(conclusionStep).toBeDefined();

    // El paso de cita para thm-01 debe referenciar el docId correcto.
    const thm01Step = result.trace.find((s) => s.cite === 'doc-filosofia#thm-01');
    expect(thm01Step).toBeDefined();
    expect(thm01Step!.step).toContain('P -> Q');

    // La explicación menciona el resultado válido.
    expect(result.explanation).toContain('VÁLIDO');
  });

  it('citas se ordenan por peso descendente antes de pasarlas al evaluador', async () => {
    const callLog: string[][] = [];
    const recordingEvaluator: Evaluator = (premises, goal, profile) => {
      callLog.push([...premises]);
      return alwaysInvalidEvaluator(premises, goal, profile);
    };

    const citations: CitedClaim[] = [
      { id: 'c1', docId: 'docA', formula: 'low', profile: 'classical.propositional', weight: 1 },
      { id: 'c2', docId: 'docB', formula: 'high', profile: 'classical.propositional', weight: 5 },
      { id: 'c3', docId: 'docC', formula: 'mid', profile: 'classical.propositional', weight: 3 },
    ];

    await deriveWithCitations({ goal: 'X', citations, localPremises: [] }, recordingEvaluator);

    // Primera llamada: premisas ordenadas high(5) > mid(3) > low(1).
    const firstCall = callLog[0];
    expect(firstCall).toBeDefined();
    expect(firstCall[0]).toBe('high');
    expect(firstCall[1]).toBe('mid');
    expect(firstCall[2]).toBe('low');
  });
});

// ---------------------------------------------------------------------------
// Test 2: Citation no probada → marca explicación con warning
// ---------------------------------------------------------------------------

describe('deriveWithCitations — citation no probada', () => {
  it('devuelve valid=false y la explicación incluye ADVERTENCIA sobre citas', async () => {
    const citations: CitedClaim[] = [
      {
        id: 'thm-99',
        docId: 'doc-desconocido',
        formula: 'X -> Y',
        profile: 'classical.propositional',
      },
    ];

    const derivation: CitationDerivation = {
      goal: 'Z', // Z no se puede derivar de X->Y sin premisa X.
      citations,
      localPremises: [],
    };

    const result = await deriveWithCitations(derivation, alwaysInvalidEvaluator);

    expect(result.valid).toBe(false);

    // La explicación debe advertir sobre premisas citadas no provadas.
    expect(result.explanation).toMatch(/ADVERTENCIA/);
    expect(result.explanation).toContain('NO VÁLIDO');

    // La traza refleja el intento.
    const conclusionStep = result.trace.find((s) => s.step.includes('no derivable'));
    expect(conclusionStep).toBeDefined();
  });

  it('cita con weight=0 provoca ADVERTENCIA de peso nulo', async () => {
    const citations: CitedClaim[] = [
      {
        id: 'weak-01',
        docId: 'doc-débil',
        formula: 'P',
        profile: 'classical.propositional',
        weight: 0,
      },
    ];

    const result = await deriveWithCitations(
      { goal: 'Q', citations, localPremises: [] },
      alwaysInvalidEvaluator,
    );

    expect(result.valid).toBe(false);
    expect(result.explanation).toContain('peso 0');
  });
});

// ---------------------------------------------------------------------------
// Test 3: Sin citaciones → fallback a derivación local
// ---------------------------------------------------------------------------

describe('deriveWithCitations — sin citaciones (derivación local)', () => {
  it('derivación puramente local: sin citas, el evaluador local decide', async () => {
    const derivation: CitationDerivation = {
      goal: 'P -> P',
      citations: [],
      localPremises: ['P -> P'],
    };

    const result = await deriveWithCitations(derivation, alwaysValidEvaluator);

    expect(result.valid).toBe(true);

    // No debe haber pasos de cita.
    const citeSteps = result.trace.filter((s) => s.cite !== undefined);
    expect(citeSteps).toHaveLength(0);

    // Debe haber un paso local.
    const localSteps = result.trace.filter((s) => s.step.startsWith('premisa local:'));
    expect(localSteps).toHaveLength(1);

    // La explicación menciona derivación puramente local.
    expect(result.explanation).toContain('puramente local');
  });

  it('sin citas ni premisas locales → inválido con mensaje descriptivo', async () => {
    const derivation: CitationDerivation = {
      goal: 'P',
      citations: [],
      localPremises: [],
    };

    const result = await deriveWithCitations(derivation, alwaysInvalidEvaluator);

    expect(result.valid).toBe(false);
    expect(result.explanation).toContain('No se proveyeron premisas');
  });
});

// ---------------------------------------------------------------------------
// Test 4: explainProof
// ---------------------------------------------------------------------------

describe('explainProof', () => {
  it('con proof=undefined devuelve mensaje genérico', () => {
    const msg = explainProof(undefined, []);
    expect(msg).toContain('No hay prueba formal');
  });

  it('con proof=null devuelve mensaje genérico', () => {
    const msg = explainProof(null, []);
    expect(msg).toContain('No hay prueba formal');
  });

  it('con proof con steps los lista', () => {
    const proof = {
      steps: [{ formula: 'P' }, { formula: 'P -> Q' }, { formula: 'Q' }],
    };
    const citations: CitedClaim[] = [
      { id: 'thm-01', docId: 'doc-x', formula: 'P -> Q', profile: 'classical.propositional' },
    ];
    const msg = explainProof(proof, citations);
    expect(msg).toContain('doc-x#thm-01');
    expect(msg).toContain('P -> Q');
    expect(msg).toContain('1.');
    expect(msg).toContain('3.');
  });

  it('sin citas menciona derivación local', () => {
    const proof = { steps: [{ formula: 'P' }] };
    const msg = explainProof(proof, []);
    expect(msg).toContain('No se utilizaron premisas externas');
  });

  it('con proof no estructurado serializa como JSON', () => {
    const proof = 'proof-opaque-string';
    const msg = explainProof(proof, []);
    expect(msg).toContain('proof-opaque-string');
  });
});

// ---------------------------------------------------------------------------
// Test 5: Perfil dominante
// ---------------------------------------------------------------------------

describe('deriveWithCitations — perfil lógico dominante', () => {
  it('todas las citas con el mismo perfil → ese perfil se pasa al evaluador', async () => {
    const capturedProfiles: string[] = [];
    const capturingEvaluator: Evaluator = (_premises, _goal, profile) => {
      capturedProfiles.push(profile);
      return Promise.resolve({ valid: false });
    };

    const citations: CitedClaim[] = [
      { id: 'a', docId: 'doc1', formula: 'X', profile: 'modal.k', weight: 1 },
      { id: 'b', docId: 'doc2', formula: 'Y', profile: 'modal.k', weight: 1 },
    ];

    await deriveWithCitations({ goal: 'Z', citations, localPremises: [] }, capturingEvaluator);

    expect(capturedProfiles[0]).toBe('modal.k');
  });

  it('citas con perfiles mixtos → fallback a classical.propositional', async () => {
    const capturedProfiles: string[] = [];
    const capturingEvaluator: Evaluator = (_premises, _goal, profile) => {
      capturedProfiles.push(profile);
      return Promise.resolve({ valid: false });
    };

    const citations: CitedClaim[] = [
      { id: 'a', docId: 'doc1', formula: 'X', profile: 'modal.k' },
      { id: 'b', docId: 'doc2', formula: 'Y', profile: 'intuitionistic' },
    ];

    await deriveWithCitations({ goal: 'Z', citations, localPremises: [] }, capturingEvaluator);

    expect(capturedProfiles[0]).toBe('classical.propositional');
  });
});
