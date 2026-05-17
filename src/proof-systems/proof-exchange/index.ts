import type { Proof } from '../../types';

export interface ProofPackage {
  version: '1.0';
  formula: string;
  profile: string;
  proof: Proof;
  metadata: {
    author?: string;
    timestamp: string;
    tags?: string[];
  };
}

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

function canonicalizeValue(value: JsonValue): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!isFinite(value)) throw new Error(`Non-finite number in proof package: ${value}`);
    if (Object.is(value, -0)) return '0';
    return String(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalizeValue).join(',') + ']';
  }
  const sortedKeys = Object.keys(value).sort();
  const pairs = sortedKeys
    .filter((k) => value[k] !== undefined)
    .map((k) => JSON.stringify(k) + ':' + canonicalizeValue(value[k]));
  return '{' + pairs.join(',') + '}';
}

export function canonicalize(pkg: ProofPackage): string {
  return canonicalizeValue(pkg as unknown as JsonObject);
}

const subtle: SubtleCrypto = globalThis.crypto.subtle;

export async function hashProof(pkg: ProofPackage): Promise<string> {
  const canonical = canonicalize(pkg);
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateKeyPair(): Promise<{
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}> {
  try {
    const pair = await subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ] as KeyUsage[]);
    return {
      publicKey: (pair as CryptoKeyPair).publicKey,
      privateKey: (pair as CryptoKeyPair).privateKey,
    };
  } catch {
    const key = await subtle.generateKey({ name: 'HMAC', hash: 'SHA-256', length: 256 }, true, [
      'sign',
      'verify',
    ] as KeyUsage[]);
    return { publicKey: key, privateKey: key };
  }
}

export async function signProof(
  pkg: ProofPackage,
  privateKey: CryptoKey,
): Promise<{ signature: string; algorithm: 'Ed25519' | 'HMAC-SHA256' }> {
  const canonical = canonicalize(pkg);
  const data = new TextEncoder().encode(canonical);
  const algorithm = privateKey.algorithm.name === 'Ed25519' ? 'Ed25519' : 'HMAC-SHA256';
  const algoParam: AlgorithmIdentifier = algorithm === 'Ed25519' ? 'Ed25519' : 'HMAC';
  const sigBuffer = await subtle.sign(algoParam, privateKey, data);
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const signature = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return { signature, algorithm };
}

function hexToUint8Array(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

export async function verifyProof(
  pkg: ProofPackage,
  signature: string,
  publicKey: CryptoKey | string,
): Promise<boolean> {
  try {
    const canonical = canonicalize(pkg);
    const data = new TextEncoder().encode(canonical);
    const sigBytes = hexToUint8Array(signature);

    if (typeof publicKey === 'string') {
      const keyBytes = hexToUint8Array(publicKey);
      const importedKey = await subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      return await subtle.verify('HMAC', importedKey, sigBytes, data);
    }

    const algoName = publicKey.algorithm.name;
    const algoParam: AlgorithmIdentifier = algoName === 'Ed25519' ? 'Ed25519' : 'HMAC';
    return await subtle.verify(algoParam, publicKey, sigBytes, data);
  } catch {
    return false;
  }
}
