// ============================================================
// ST Proof Certificate — Generación + firma
// ============================================================

import type { Proof, ProofStep, Formula } from '../../types';
import { canonicalize, hashCertificate, normalizeFormula } from './canonical';
import type { CertSignature, CertStep, ProofCertificate } from './types';

interface GenerateOptions {
  profile?: string;
  axioms?: string[];
  sign?: { privateKey: CryptoKey; publicKey: string };
}

interface InputCertificate {
  goal: string;
  profile?: string;
  axioms?: string[];
  steps: CertStep[];
}

// --- helpers para Formula → string canonical ---

function formulaToCanonical(f: Formula): string {
  // representación textual simple respetando paréntesis para
  // operadores binarios. No depende del perfil — sólo necesitamos
  // round-tripable string canónica para el certificado.
  const args = f.args ?? [];
  switch (f.kind) {
    case 'atom':
      return f.name ?? '_';
    case 'not':
      return '~' + (args[0] ? wrap(args[0]) : '_');
    case 'and':
      return binOp(args, '&');
    case 'or':
      return binOp(args, '|');
    case 'implies':
      return binOp(args, '->');
    case 'biconditional':
      return binOp(args, '<->');
    case 'forall':
      return 'forall ' + (f.variable ?? '_') + '. ' + (args[0] ? wrap(args[0]) : '_');
    case 'exists':
      return 'exists ' + (f.variable ?? '_') + '. ' + (args[0] ? wrap(args[0]) : '_');
    case 'predicate':
      return (f.name ?? '_') + '(' + args.map(formulaToCanonical).join(', ') + ')';
    case 'equals':
      return (
        (args[0] ? formulaToCanonical(args[0]) : '_') +
        ' = ' +
        (args[1] ? formulaToCanonical(args[1]) : '_')
      );
    case 'modal_necessity':
      return '[]' + (args[0] ? wrap(args[0]) : '_');
    case 'modal_possibility':
      return '<>' + (args[0] ? wrap(args[0]) : '_');
    case 'list':
      return '[' + args.map(formulaToCanonical).join(' ') + ']';
    default:
      return JSON.stringify(f);
  }
}

function binOp(args: Formula[], op: string): string {
  const left = args[0] ? wrap(args[0]) : '_';
  const right = args[1] ? wrap(args[1]) : '_';
  return left + ' ' + op + ' ' + right;
}

function wrap(f: Formula): string {
  const inner = formulaToCanonical(f);
  if (f.kind === 'atom' || f.kind === 'predicate' || f.kind === 'not') return inner;
  return '(' + inner + ')';
}

// --- detección de regla a partir de la justification ---

function ruleFromJustification(just: string): string {
  const j = just.toLowerCase().trim();
  if (j === 'premise' || j === 'axiom') return 'axiom';
  if (j === 'assumption' || j === 'hypothesis') return 'assumption';
  if (j.includes('mp') || j.includes('modus ponens') || j.includes('->e') || j.includes('→e')) {
    return 'modus-ponens';
  }
  if (j.includes('modus tollens') || j.includes('mt')) return 'modus-tollens';
  if (j.includes('->i') || j.includes('→i') || j.includes('implies-intro')) return 'implies-intro';
  if (j.includes('&i') || j.includes('and-intro') || j.includes('∧i')) return 'and-intro';
  if (j.includes('&el') || j.includes('and-elim-left') || j.includes('∧e1')) return 'and-elim-left';
  if (j.includes('&er') || j.includes('and-elim-right') || j.includes('∧e2'))
    return 'and-elim-right';
  if (j.includes('|il') || j.includes('or-intro-left') || j.includes('∨i1')) return 'or-intro-left';
  if (j.includes('|ir') || j.includes('or-intro-right') || j.includes('∨i2'))
    return 'or-intro-right';
  if (j.includes('|e') || j.includes('or-elim') || j.includes('∨e')) return 'or-elim';
  if (j.includes('~i') || j.includes('not-intro')) return 'not-intro';
  if (j.includes('~e') || j.includes('not-elim')) return 'not-elim';
  if (j.includes('reit')) return 'reiteration';
  if (j.includes('efq') || j.includes('ex falso')) return 'ex-falso';
  return just; // se pasa tal cual si no reconocemos — el verifier reportará si no existe
}

/**
 * Convierte un `Proof` interno de ST en un certificado portable.
 *
 * Acepta también un "input certificate" plano (sin hash ni firma)
 * para flujos donde los pasos ya vienen construidos manualmente.
 */
export async function generateCertificate(
  proof: Proof | InputCertificate,
  opts: GenerateOptions = {},
): Promise<ProofCertificate> {
  let goal: string;
  let steps: CertStep[];
  let inputAxioms: string[] | undefined;
  let inputProfile: string | undefined;

  if (
    'steps' in proof &&
    Array.isArray(proof.steps) &&
    proof.steps.length > 0 &&
    'rule' in proof.steps[0]
  ) {
    // InputCertificate path
    const input = proof as InputCertificate;
    goal = input.goal;
    inputAxioms = input.axioms;
    inputProfile = input.profile;
    steps = input.steps.map((s) => ({
      id: s.id,
      rule: s.rule,
      args: s.args.slice(),
      conclusion: normalizeFormula(s.conclusion),
      depends: s.depends.slice(),
    }));
  } else {
    // Proof path
    const p = proof as Proof;
    goal = formulaToCanonical(p.goal);
    steps = p.steps.map((s: ProofStep) => {
      const id = 's' + String(s.stepNumber);
      const depends = s.premises.map((n) => 's' + String(n));
      const rule = ruleFromJustification(s.justification);
      const conclusion = formulaToCanonical(s.formula);
      const args: string[] = rule === 'axiom' ? [conclusion] : depends.slice();
      return { id, rule, args, conclusion, depends };
    });
  }

  const profile = opts.profile ?? inputProfile ?? 'classical.propositional';
  const axiomsSource = opts.axioms ?? inputAxioms ?? [];
  const axioms = axiomsSource.map(normalizeFormula);

  const payload = {
    version: '1.0' as const,
    goal: normalizeFormula(goal),
    profile,
    axioms,
    steps,
  };
  const hash = await hashCertificate(payload);

  const cert: ProofCertificate = { ...payload, hash };

  if (opts.sign) {
    const signature = await signCertificate(cert, opts.sign.privateKey, opts.sign.publicKey);
    cert.signature = signature;
  }
  return cert;
}

function getSubtle(): SubtleCrypto {
  const g = globalThis as { crypto?: { subtle?: SubtleCrypto } };
  if (!g.crypto?.subtle) throw new Error('WebCrypto SubtleCrypto no disponible');
  return g.crypto.subtle;
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) throw new Error('invalid hex length');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
}

function bytesToHex(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let out = '';
  for (const b of arr) out += b.toString(16).padStart(2, '0');
  return out;
}

/**
 * Genera un par de claves para firmar certificados. Intenta
 * Ed25519 vía WebCrypto y cae a HMAC-SHA256 si el runtime no lo
 * soporta. El `publicKey` se devuelve también como hex para
 * embedderlo dentro del certificado.
 */
export async function generateCertificateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyHex: string;
  algorithm: 'Ed25519' | 'HMAC-SHA256';
}> {
  const subtle = getSubtle();
  try {
    const pair = (await subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ] as KeyUsage[])) as CryptoKeyPair;
    const raw = await subtle.exportKey('raw', pair.publicKey);
    return {
      privateKey: pair.privateKey,
      publicKey: pair.publicKey,
      publicKeyHex: bytesToHex(raw),
      algorithm: 'Ed25519',
    };
  } catch {
    const key = await subtle.generateKey({ name: 'HMAC', hash: 'SHA-256', length: 256 }, true, [
      'sign',
      'verify',
    ] as KeyUsage[]);
    const raw = await subtle.exportKey('raw', key);
    return {
      privateKey: key,
      publicKey: key,
      publicKeyHex: bytesToHex(raw),
      algorithm: 'HMAC-SHA256',
    };
  }
}

export async function signCertificate(
  cert: Omit<ProofCertificate, 'signature'>,
  privateKey: CryptoKey,
  publicKeyHex: string,
): Promise<CertSignature> {
  const subtle = getSubtle();
  const canonical = canonicalize({
    version: cert.version,
    goal: cert.goal,
    profile: cert.profile,
    axioms: cert.axioms,
    steps: cert.steps,
  });
  const data = new TextEncoder().encode(canonical);
  const algoName = privateKey.algorithm.name;
  const algorithm: 'Ed25519' | 'HMAC-SHA256' = algoName === 'Ed25519' ? 'Ed25519' : 'HMAC-SHA256';
  const algoParam: AlgorithmIdentifier = algorithm === 'Ed25519' ? 'Ed25519' : 'HMAC';
  const sigBuf = await subtle.sign(algoParam, privateKey, data);
  return {
    algorithm,
    publicKey: publicKeyHex,
    signature: bytesToHex(sigBuf),
  };
}

export async function verifyCertificateSignature(cert: ProofCertificate): Promise<boolean> {
  if (!cert.signature) return false;
  const subtle = getSubtle();
  try {
    const canonical = canonicalize({
      version: cert.version,
      goal: cert.goal,
      profile: cert.profile,
      axioms: cert.axioms,
      steps: cert.steps,
    });
    const data = new TextEncoder().encode(canonical);
    const sig = hexToBytes(cert.signature.signature);
    const keyBytes = hexToBytes(cert.signature.publicKey);

    if (cert.signature.algorithm === 'HMAC-SHA256') {
      const key = await subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      return await subtle.verify('HMAC', key, sig, data);
    }
    const key = await subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, false, ['verify']);
    return await subtle.verify('Ed25519', key, sig, data);
  } catch {
    return false;
  }
}
