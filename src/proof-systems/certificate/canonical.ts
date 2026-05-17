// ============================================================
// ST Proof Certificate — Canonicalization & hashing
// ============================================================

import type { ProofCertificate } from './types';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];

function canonicalizeValue(value: JsonValue): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!isFinite(value)) {
      throw new Error(`Non-finite number in certificate: ${String(value)}`);
    }
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

/**
 * Normaliza una fórmula textual: trim + colapsar whitespace
 * interno a un solo espacio. Idempotente.
 */
export function normalizeFormula(formula: string): string {
  return formula.trim().replace(/\s+/g, ' ');
}

/**
 * Serializa el certificado a su forma canónica determinística
 * (JSON con claves ordenadas alfabéticamente y sin whitespace).
 * Excluye `hash` y `signature` para permitir calcular el hash y
 * la firma sobre exactamente la misma representación.
 */
export function canonicalize(cert: Omit<ProofCertificate, 'hash' | 'signature'>): string {
  const payload: JsonObject = {
    version: cert.version,
    goal: normalizeFormula(cert.goal),
    profile: cert.profile,
    axioms: cert.axioms.map(normalizeFormula),
    steps: cert.steps.map((s) => ({
      id: s.id,
      rule: s.rule,
      args: s.args.slice(),
      conclusion: normalizeFormula(s.conclusion),
      depends: s.depends.slice(),
    })),
  };
  return canonicalizeValue(payload);
}

function getSubtle(): SubtleCrypto {
  const g = globalThis as { crypto?: { subtle?: SubtleCrypto } };
  if (!g.crypto || !g.crypto.subtle) {
    throw new Error('WebCrypto SubtleCrypto no disponible en este runtime');
  }
  return g.crypto.subtle;
}

/**
 * SHA-256 hex del certificado canonicalizado (sin hash ni firma).
 */
export async function hashCertificate(
  cert: Omit<ProofCertificate, 'hash' | 'signature'>,
): Promise<string> {
  const canonical = canonicalize(cert);
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await getSubtle().digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
