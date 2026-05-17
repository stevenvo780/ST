import { describe, it, expect } from 'vitest';
import {
  canonicalize,
  hashProof,
  signProof,
  verifyProof,
  generateKeyPair,
  type ProofPackage,
} from '../../../proof-systems/proof-exchange';
import type { Proof } from '../../../types';

function makeProof(): Proof {
  return {
    goal: { kind: 'atom', name: 'p' },
    steps: [
      {
        stepNumber: 1,
        formula: { kind: 'atom', name: 'p' },
        justification: 'premise',
        premises: [],
        source: 'premise',
      },
    ],
    status: 'complete',
    method: 'natural_deduction',
  };
}

function makePackage(overrides?: Partial<ProofPackage>): ProofPackage {
  return {
    version: '1.0',
    formula: 'p -> p',
    profile: 'classical.propositional',
    proof: makeProof(),
    metadata: {
      author: 'test-author',
      timestamp: '2026-01-01T00:00:00.000Z',
      tags: ['logic', 'test'],
    },
    ...overrides,
  };
}

describe('canonicalize', () => {
  it('produces the same string regardless of input key insertion order', () => {
    const pkg1 = makePackage();
    const pkg2: ProofPackage = {
      metadata: pkg1.metadata,
      proof: pkg1.proof,
      profile: pkg1.profile,
      formula: pkg1.formula,
      version: pkg1.version,
    };
    expect(canonicalize(pkg1)).toBe(canonicalize(pkg2));
  });

  it('sorts object keys alphabetically at every nesting level', () => {
    const pkg = makePackage();
    const json = canonicalize(pkg);
    const firstFormula = json.indexOf('"formula"');
    const firstMetadata = json.indexOf('"metadata"');
    const firstProfile = json.indexOf('"profile"');
    const firstProof = json.indexOf('"proof"');
    const firstVersion = json.indexOf('"version"');
    expect(firstFormula).toBeLessThan(firstMetadata);
    expect(firstMetadata).toBeLessThan(firstProfile);
    expect(firstProfile).toBeLessThan(firstProof);
    expect(firstProof).toBeLessThan(firstVersion);
  });

  it('produces output without whitespace between JSON tokens', () => {
    const pkg = makePackage();
    const json = canonicalize(pkg);
    expect(json).not.toMatch(/[}\],:][  \t\n\r]/);
    expect(json).not.toMatch(/[  \t\n\r][{[]/);
    expect(json.includes('\n')).toBe(false);
    expect(json.includes('\r')).toBe(false);
    expect(json.includes('\t')).toBe(false);
  });

  it('is deterministic across multiple calls', () => {
    const pkg = makePackage();
    const results = Array.from({ length: 5 }, () => canonicalize(pkg));
    expect(new Set(results).size).toBe(1);
  });
});

describe('hashProof', () => {
  it('returns a 64-character hex SHA-256 string', async () => {
    const pkg = makePackage();
    const hash = await hashProof(pkg);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is stable: two identical packages produce the same hash', async () => {
    const pkg1 = makePackage();
    const pkg2 = makePackage();
    const [h1, h2] = await Promise.all([hashProof(pkg1), hashProof(pkg2)]);
    expect(h1).toBe(h2);
  });

  it('changes when the package content changes', async () => {
    const pkg1 = makePackage();
    const pkg2 = makePackage({ formula: 'q -> q' });
    const [h1, h2] = await Promise.all([hashProof(pkg1), hashProof(pkg2)]);
    expect(h1).not.toBe(h2);
  });

  it('changes when only metadata changes', async () => {
    const pkg1 = makePackage();
    const pkg2 = makePackage({ metadata: { ...pkg1.metadata, author: 'other-author' } });
    const [h1, h2] = await Promise.all([hashProof(pkg1), hashProof(pkg2)]);
    expect(h1).not.toBe(h2);
  });
});

describe('generateKeyPair', () => {
  it('returns a publicKey and privateKey', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();
  });
});

describe('signProof + verifyProof (round-trip)', () => {
  it('Ed25519 keypair: verifyProof returns true for valid signature', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const pkg = makePackage();
    const { signature } = await signProof(pkg, privateKey);
    const valid = await verifyProof(pkg, signature, publicKey);
    expect(valid).toBe(true);
  });

  it('verifyProof returns false when the formula field is tampered', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const pkg = makePackage();
    const { signature } = await signProof(pkg, privateKey);
    const tampered = makePackage({ formula: 'q -> r' });
    const valid = await verifyProof(tampered, signature, publicKey);
    expect(valid).toBe(false);
  });

  it('verifyProof returns false when the profile field is tampered', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const pkg = makePackage();
    const { signature } = await signProof(pkg, privateKey);
    const tampered = makePackage({ profile: 'intuitionistic' });
    const valid = await verifyProof(tampered, signature, publicKey);
    expect(valid).toBe(false);
  });

  it('verifyProof returns false when a proof step is tampered', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const pkg = makePackage();
    const { signature } = await signProof(pkg, privateKey);
    const originalStep = pkg.proof.steps[0];
    if (!originalStep) throw new Error('Expected at least one proof step');
    const tamperedProof: Proof = {
      ...pkg.proof,
      steps: [{ ...originalStep, justification: 'hacked' }],
    };
    const tampered = makePackage({ proof: tamperedProof });
    const valid = await verifyProof(tampered, signature, publicKey);
    expect(valid).toBe(false);
  });

  it('verifyProof returns false for a corrupted signature (single bit flip)', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const pkg = makePackage();
    const { signature } = await signProof(pkg, privateKey);
    const corruptedSig = signature.slice(0, -2) + (signature.endsWith('00') ? 'ff' : '00');
    const valid = await verifyProof(pkg, corruptedSig, publicKey);
    expect(valid).toBe(false);
  });

  it('signProof returns algorithm label Ed25519 or HMAC-SHA256', async () => {
    const { privateKey } = await generateKeyPair();
    const pkg = makePackage();
    const { algorithm } = await signProof(pkg, privateKey);
    expect(['Ed25519', 'HMAC-SHA256']).toContain(algorithm);
  });
});
