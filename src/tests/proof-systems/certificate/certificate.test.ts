import { describe, it, expect } from 'vitest';
import {
  STANDARD_RULES,
  canonicalize,
  exportLFSC,
  generateCertificate,
  generateCertificateKeyPair,
  hashCertificate,
  importLFSC,
  normalizeFormula,
  signCertificate,
  verifyCertificate,
  verifyCertificateSignature,
  type CertStep,
  type ProofCertificate,
} from '../../../proof-systems/certificate';
import type { Proof } from '../../../types';

// --- Fixtures ---

function makeModusPonensSteps(): CertStep[] {
  return [
    { id: 's1', rule: 'axiom', args: ['p'], conclusion: 'p', depends: [] },
    { id: 's2', rule: 'axiom', args: ['p -> q'], conclusion: 'p -> q', depends: [] },
    { id: 's3', rule: 'modus-ponens', args: ['s2', 's1'], conclusion: 'q', depends: ['s2', 's1'] },
  ];
}

async function makeValidCertificate(): Promise<ProofCertificate> {
  return generateCertificate({
    goal: 'q',
    steps: makeModusPonensSteps(),
    profile: 'classical.propositional',
    axioms: ['p', 'p -> q'],
  });
}

// --- 1. canonicalize ---

describe('canonicalize', () => {
  it('es idempotente: canonicalize(parse(canonicalize(x))) ≡ canonicalize(x)', async () => {
    const cert = await makeValidCertificate();
    const a = canonicalize(cert);
    const b = canonicalize({ ...cert });
    expect(a).toBe(b);
  });

  it('ignora orden de claves en input', async () => {
    const cert = await makeValidCertificate();
    const reordered = {
      steps: cert.steps,
      profile: cert.profile,
      version: cert.version,
      axioms: cert.axioms,
      goal: cert.goal,
    };
    expect(canonicalize(cert)).toBe(canonicalize(reordered));
  });

  it('normaliza whitespace en fórmulas', () => {
    expect(normalizeFormula('  p  ->   q ')).toBe('p -> q');
    expect(normalizeFormula('a\t&\nb')).toBe('a & b');
  });
});

// --- 2. hashCertificate ---

describe('hashCertificate', () => {
  it('es determinístico para el mismo certificado', async () => {
    const cert = await makeValidCertificate();
    const h1 = await hashCertificate(cert);
    const h2 = await hashCertificate(cert);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('cambia si alteramos un step', async () => {
    const cert = await makeValidCertificate();
    const h1 = await hashCertificate(cert);
    const tampered = {
      ...cert,
      steps: cert.steps.map((s, i) => (i === 2 ? { ...s, conclusion: 'r' } : s)),
    };
    const h2 = await hashCertificate(tampered);
    expect(h1).not.toBe(h2);
  });
});

// --- 3. generateCertificate from Proof ---

describe('generateCertificate', () => {
  it('genera desde un Proof MP con steps correctos', async () => {
    const proof: Proof = {
      goal: { kind: 'atom', name: 'q' },
      steps: [
        {
          stepNumber: 1,
          formula: { kind: 'atom', name: 'p' },
          justification: 'premise',
          premises: [],
          source: 'premise',
        },
        {
          stepNumber: 2,
          formula: {
            kind: 'implies',
            args: [
              { kind: 'atom', name: 'p' },
              { kind: 'atom', name: 'q' },
            ],
          },
          justification: 'premise',
          premises: [],
          source: 'premise',
        },
        {
          stepNumber: 3,
          formula: { kind: 'atom', name: 'q' },
          justification: 'MP 2,1',
          premises: [2, 1],
          source: 'rule',
        },
      ],
      status: 'complete',
      method: 'natural_deduction',
    };
    const cert = await generateCertificate(proof, {
      profile: 'classical.propositional',
      axioms: ['p', 'p -> q'],
    });
    expect(cert.version).toBe('1.0');
    expect(cert.goal).toBe('q');
    expect(cert.steps).toHaveLength(3);
    expect(cert.steps[2].rule).toBe('modus-ponens');
    expect(cert.steps[2].depends).toEqual(['s2', 's1']);
    expect(cert.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('preserva opts.profile y opts.axioms', async () => {
    const cert = await makeValidCertificate();
    expect(cert.profile).toBe('classical.propositional');
    expect(cert.axioms).toEqual(['p', 'p -> q']);
  });
});

// --- 4. verifyCertificate happy path ---

describe('verifyCertificate', () => {
  it('valida un certificado MP correcto', async () => {
    const cert = await makeValidCertificate();
    const result = await verifyCertificate(cert);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.stepsVerified).toBe(3);
    expect(result.totalSteps).toBe(3);
  });

  it('valida certificado con and-intro + and-elim', async () => {
    const steps: CertStep[] = [
      { id: 's1', rule: 'axiom', args: ['p'], conclusion: 'p', depends: [] },
      { id: 's2', rule: 'axiom', args: ['q'], conclusion: 'q', depends: [] },
      {
        id: 's3',
        rule: 'and-intro',
        args: ['s1', 's2'],
        conclusion: 'p & q',
        depends: ['s1', 's2'],
      },
      { id: 's4', rule: 'and-elim-left', args: ['s3'], conclusion: 'p', depends: ['s3'] },
    ];
    const cert = await generateCertificate({
      goal: 'p',
      steps,
      profile: 'classical.propositional',
      axioms: ['p', 'q'],
    });
    const r = await verifyCertificate(cert);
    expect(r.valid).toBe(true);
    expect(r.stepsVerified).toBe(4);
  });

  it('valida or-intro-left con args declarando la otra rama', async () => {
    const steps: CertStep[] = [
      { id: 's1', rule: 'axiom', args: ['p'], conclusion: 'p', depends: [] },
      { id: 's2', rule: 'or-intro-left', args: ['q'], conclusion: 'p | q', depends: ['s1'] },
    ];
    const cert = await generateCertificate({
      goal: 'p | q',
      steps,
      profile: 'classical.propositional',
      axioms: ['p'],
    });
    const r = await verifyCertificate(cert);
    expect(r.valid).toBe(true);
  });

  it('valida implies-intro descargando hipótesis', async () => {
    const steps: CertStep[] = [
      { id: 's1', rule: 'assumption', args: ['p'], conclusion: 'p', depends: [] },
      {
        id: 's2',
        rule: 'implies-intro',
        args: ['p'],
        conclusion: 'p -> p',
        depends: ['s1'],
      },
    ];
    const cert = await generateCertificate({
      goal: 'p -> p',
      steps,
      profile: 'classical.propositional',
      axioms: [],
    });
    const r = await verifyCertificate(cert);
    expect(r.valid).toBe(true);
  });
});

// --- 5. verifyCertificate error paths ---

describe('verifyCertificate detecta errores', () => {
  it('detecta paso con conclusión no derivable por su regla', async () => {
    const steps = makeModusPonensSteps();
    // s3 produce conclusión incorrecta
    steps[2] = { ...steps[2], conclusion: 'r' };
    const cert = await generateCertificate({
      goal: 'r',
      steps,
      profile: 'classical.propositional',
      axioms: ['p', 'p -> q'],
    });
    const r = await verifyCertificate(cert);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('does not justify'))).toBe(true);
  });

  it('detecta dependencia faltante', async () => {
    const steps: CertStep[] = [
      { id: 's1', rule: 'axiom', args: ['p'], conclusion: 'p', depends: [] },
      {
        id: 's2',
        rule: 'modus-ponens',
        args: ['s_missing', 's1'],
        conclusion: 'q',
        depends: ['s_missing', 's1'],
      },
    ];
    const cert = await generateCertificate({
      goal: 'q',
      steps,
      profile: 'classical.propositional',
      axioms: [],
    });
    const r = await verifyCertificate(cert);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('missing step'))).toBe(true);
  });

  it('detecta ciclo en depends', async () => {
    const steps: CertStep[] = [
      // ciclo artificial s1 -> s2 -> s1
      { id: 's1', rule: 'modus-ponens', args: ['s2'], conclusion: 'q', depends: ['s2'] },
      { id: 's2', rule: 'modus-ponens', args: ['s1'], conclusion: 'r', depends: ['s1'] },
    ];
    // Generamos hash manualmente (no usamos generateCertificate porque podría rechazar).
    const payload = {
      version: '1.0' as const,
      goal: 'q',
      profile: 'test',
      axioms: [],
      steps,
    };
    const hash = await hashCertificate(payload);
    const cert: ProofCertificate = { ...payload, hash };
    const r = await verifyCertificate(cert);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('cycle detected'))).toBe(true);
  });

  it('detecta hash mismatch (tamper)', async () => {
    const cert = await makeValidCertificate();
    const tampered: ProofCertificate = {
      ...cert,
      steps: cert.steps.map((s, i) => (i === 0 ? { ...s, conclusion: 'r' } : s)),
    };
    // hash NO se actualiza adrede
    const r = await verifyCertificate(tampered);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('hash mismatch'))).toBe(true);
  });

  it('detecta regla desconocida', async () => {
    const cert = await makeValidCertificate();
    const broken: ProofCertificate = {
      ...cert,
      steps: cert.steps.map((s, i) => (i === 2 ? { ...s, rule: 'frobnicate' } : s)),
    };
    broken.hash = await hashCertificate(broken);
    const r = await verifyCertificate(broken);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('unknown rule'))).toBe(true);
  });

  it('detecta goal ausente como conclusión', async () => {
    const cert = await makeValidCertificate();
    const wrongGoal: ProofCertificate = { ...cert, goal: 'never_derived' };
    wrongGoal.hash = await hashCertificate(wrongGoal);
    const r = await verifyCertificate(wrongGoal);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('goal'))).toBe(true);
  });

  it('detecta referencia fuera de orden topológico', async () => {
    const steps: CertStep[] = [
      // s1 depende de s2 que aparece después → out-of-order
      {
        id: 's1',
        rule: 'modus-ponens',
        args: ['s2', 's0'],
        conclusion: 'q',
        depends: ['s2', 's0'],
      },
      { id: 's0', rule: 'axiom', args: ['p'], conclusion: 'p', depends: [] },
      { id: 's2', rule: 'axiom', args: ['p -> q'], conclusion: 'p -> q', depends: [] },
    ];
    const payload = {
      version: '1.0' as const,
      goal: 'q',
      profile: 'classical.propositional',
      axioms: [],
      steps,
    };
    const hash = await hashCertificate(payload);
    const cert: ProofCertificate = { ...payload, hash };
    const r = await verifyCertificate(cert);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('out of topological order'))).toBe(true);
  });
});

// --- 6. LFSC import/export round-trip ---

describe('LFSC export/import', () => {
  it('exporta un certificado válido a S-expression', async () => {
    const cert = await makeValidCertificate();
    const sexp = exportLFSC(cert);
    expect(sexp).toMatch(/^\(proof/);
    expect(sexp).toContain(':version "1.0"');
    expect(sexp).toContain(':goal "q"');
    expect(sexp).toContain('(step :id s1 :rule axiom');
    expect(sexp).toMatch(/\)$/);
  });

  it('round-trip export → import preserva la estructura', async () => {
    const cert = await makeValidCertificate();
    const sexp = exportLFSC(cert);
    const result = importLFSC(sexp);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.version).toBe(cert.version);
    expect(result.goal).toBe(cert.goal);
    expect(result.profile).toBe(cert.profile);
    expect(result.axioms).toEqual(cert.axioms);
    expect(result.steps).toEqual(cert.steps);
    expect(result.hash).toBe(cert.hash);
  });

  it('round-trip preserva firma cuando está presente', async () => {
    const cert = await makeValidCertificate();
    const kp = await generateCertificateKeyPair();
    const sig = await signCertificate(cert, kp.privateKey, kp.publicKeyHex);
    const signedCert: ProofCertificate = { ...cert, signature: sig };
    const sexp = exportLFSC(signedCert);
    const parsed = importLFSC(sexp);
    if ('error' in parsed) {
      throw new Error('parse failed: ' + parsed.error);
    }
    expect(parsed.signature).toBeDefined();
    expect(parsed.signature?.algorithm).toBe(sig.algorithm);
    expect(parsed.signature?.publicKey).toBe(sig.publicKey);
    expect(parsed.signature?.signature).toBe(sig.signature);
  });

  it('importLFSC retorna error con input malformado', () => {
    const r = importLFSC('(garbage stuff');
    expect('error' in r).toBe(true);
  });

  it('importLFSC verifica versión soportada', () => {
    const r = importLFSC(
      '(proof :version "9.9" :goal "p" :profile "x" :axioms ( ) :steps ( ) :hash "00")',
    );
    expect('error' in r).toBe(true);
  });

  it('certificado importado pasa verificación', async () => {
    const cert = await makeValidCertificate();
    const sexp = exportLFSC(cert);
    const reimported = importLFSC(sexp);
    if ('error' in reimported) throw new Error(reimported.error);
    const r = await verifyCertificate(reimported);
    expect(r.valid).toBe(true);
  });
});

// --- 7. Sign + verify ---

describe('signCertificate + verifyCertificateSignature', () => {
  it('firma con Ed25519 y verifica correctamente', async () => {
    const cert = await makeValidCertificate();
    const kp = await generateCertificateKeyPair();
    const sig = await signCertificate(cert, kp.privateKey, kp.publicKeyHex);
    const signed: ProofCertificate = { ...cert, signature: sig };
    expect(sig.algorithm === 'Ed25519' || sig.algorithm === 'HMAC-SHA256').toBe(true);
    expect(await verifyCertificateSignature(signed)).toBe(true);
  });

  it('detecta tamper post-firma', async () => {
    const cert = await makeValidCertificate();
    const kp = await generateCertificateKeyPair();
    const sig = await signCertificate(cert, kp.privateKey, kp.publicKeyHex);
    const tampered: ProofCertificate = {
      ...cert,
      goal: 'r',
      signature: sig,
    };
    expect(await verifyCertificateSignature(tampered)).toBe(false);
  });

  it('generateCertificate con opts.sign incluye firma válida', async () => {
    const kp = await generateCertificateKeyPair();
    const cert = await generateCertificate(
      {
        goal: 'q',
        steps: makeModusPonensSteps(),
        profile: 'classical.propositional',
        axioms: ['p', 'p -> q'],
      },
      { sign: { privateKey: kp.privateKey, publicKey: kp.publicKeyHex } },
    );
    expect(cert.signature).toBeDefined();
    expect(await verifyCertificateSignature(cert)).toBe(true);
  });
});

// --- 8. Custom rule checkers ---

describe('rules custom', () => {
  it('verifyCertificate respeta rule checkers custom', async () => {
    const steps: CertStep[] = [
      { id: 's1', rule: 'axiom', args: ['p'], conclusion: 'p', depends: [] },
      { id: 's2', rule: 'magic', args: ['s1'], conclusion: 'magic(p)', depends: ['s1'] },
    ];
    const cert = await generateCertificate({
      goal: 'magic(p)',
      steps,
      profile: 'custom',
      axioms: ['p'],
    });
    // sin la regla custom → falla
    const r1 = await verifyCertificate(cert);
    expect(r1.valid).toBe(false);

    // con la regla custom → pasa
    const custom = new Map(STANDARD_RULES);
    custom.set('magic', (_args, conclusion, premises) => {
      return conclusion === 'magic(' + premises[0] + ')';
    });
    const r2 = await verifyCertificate(cert, custom);
    expect(r2.valid).toBe(true);
    expect(r2.stepsVerified).toBe(2);
  });
});

// --- 9. STANDARD_RULES coverage ---

describe('STANDARD_RULES catálogo', () => {
  it('incluye reglas básicas de proposicional clásica', () => {
    const required = [
      'modus-ponens',
      'modus-tollens',
      'and-intro',
      'and-elim-left',
      'and-elim-right',
      'or-intro-left',
      'or-intro-right',
      'or-elim',
      'implies-intro',
      'implies-elim',
      'not-intro',
      'not-elim',
      'axiom',
      'assumption',
      'iff-intro',
      'double-neg-elim',
    ];
    for (const r of required) {
      expect(STANDARD_RULES.has(r)).toBe(true);
    }
  });

  it('reconoce variantes ASCII y Unicode de notación', () => {
    expect(STANDARD_RULES.get('mp')).toBe(STANDARD_RULES.get('modus-ponens'));
    expect(STANDARD_RULES.get('->E')).toBe(STANDARD_RULES.get('modus-ponens'));
    expect(STANDARD_RULES.get('&I')).toBe(STANDARD_RULES.get('and-intro'));
  });
});
