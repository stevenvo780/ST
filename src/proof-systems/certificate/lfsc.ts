// ============================================================
// ST Proof Certificate — LFSC-style import/export
// ============================================================
//
// LFSC (Logical Framework with Side Conditions) usa sintaxis
// S-expression. Aquí hacemos un subset adaptado al certificado:
//
//   (proof :version "1.0"
//     :goal "<formula>"
//     :profile "<profile>"
//     :axioms ( "<axiom1>" "<axiom2>" )
//     :steps (
//       (step :id s1 :rule axiom :args ( "p" ) :conclusion "p" :depends ( ))
//       ...
//     )
//     :hash "<hex>"
//     [:signature (sig :algorithm Ed25519 :public-key "<hex>" :signature "<hex>")]
//   )
//
// El round-trip (export → import) preserva la estructura literal;
// no se re-hashea ni se reordena.

import type { CertSignature, CertStep, ProofCertificate } from './types';

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function emitString(s: string): string {
  return '"' + escapeString(s) + '"';
}

function emitStringList(xs: string[]): string {
  if (xs.length === 0) return '( )';
  return '( ' + xs.map(emitString).join(' ') + ' )';
}

function emitIdentList(xs: string[]): string {
  if (xs.length === 0) return '( )';
  return '( ' + xs.join(' ') + ' )';
}

function emitStep(step: CertStep): string {
  const parts = [
    ':id ' + step.id,
    ':rule ' + step.rule,
    ':args ' + emitStringList(step.args),
    ':conclusion ' + emitString(step.conclusion),
    ':depends ' + emitIdentList(step.depends),
  ];
  return '    (step ' + parts.join(' ') + ')';
}

function emitSignature(sig: CertSignature): string {
  return (
    '  :signature (sig :algorithm ' +
    sig.algorithm +
    ' :public-key ' +
    emitString(sig.publicKey) +
    ' :signature ' +
    emitString(sig.signature) +
    ')'
  );
}

/**
 * Exporta un certificado al subset LFSC. La salida es texto
 * S-expression con keywords `:foo` para los campos.
 */
export function exportLFSC(cert: ProofCertificate): string {
  const lines: string[] = [];
  lines.push('(proof');
  lines.push('  :version ' + emitString(cert.version));
  lines.push('  :goal ' + emitString(cert.goal));
  lines.push('  :profile ' + emitString(cert.profile));
  lines.push('  :axioms ' + emitStringList(cert.axioms));
  lines.push('  :steps (');
  for (const s of cert.steps) lines.push(emitStep(s));
  lines.push('  )');
  lines.push('  :hash ' + emitString(cert.hash));
  if (cert.signature) lines.push(emitSignature(cert.signature));
  lines.push(')');
  return lines.join('\n');
}

// ---- Parser ----

type Token =
  | { kind: 'lparen' | 'rparen'; value: '(' | ')' }
  | { kind: 'string' | 'symbol'; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (c === ';') {
      // comentario hasta fin de línea
      while (i < input.length && input[i] !== '\n') i++;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '(') {
      tokens.push({ kind: 'lparen', value: '(' });
      i++;
      continue;
    }
    if (c === ')') {
      tokens.push({ kind: 'rparen', value: ')' });
      i++;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let buf = '';
      while (j < input.length && input[j] !== '"') {
        if (input[j] === '\\' && j + 1 < input.length) {
          const next = input[j + 1];
          if (next === 'n') buf += '\n';
          else if (next === 't') buf += '\t';
          else if (next === 'r') buf += '\r';
          else buf += next;
          j += 2;
        } else {
          buf += input[j];
          j++;
        }
      }
      if (j >= input.length) {
        throw new Error('unterminated string literal');
      }
      tokens.push({ kind: 'string', value: buf });
      i = j + 1;
      continue;
    }
    // symbol — incluye keywords con `:` prefix
    let j = i;
    while (j < input.length && !/[\s()"]/.test(input[j])) j++;
    tokens.push({ kind: 'symbol', value: input.slice(i, j) });
    i = j;
  }
  return tokens;
}

interface Cursor {
  toks: Token[];
  pos: number;
}

function peek(c: Cursor): Token | null {
  return c.pos < c.toks.length ? c.toks[c.pos] : null;
}

function next(c: Cursor): Token {
  if (c.pos >= c.toks.length) throw new Error('unexpected end of input');
  return c.toks[c.pos++];
}

function expect(c: Cursor, kind: Token['kind'], value?: string): Token {
  const t = next(c);
  if (t.kind !== kind) throw new Error(`expected ${kind}, got ${t.kind}:${t.value}`);
  if (value !== undefined && t.value !== value) {
    throw new Error(`expected ${value}, got ${t.value}`);
  }
  return t;
}

function parseStringList(c: Cursor): string[] {
  expect(c, 'lparen');
  const out: string[] = [];
  while (true) {
    const t = peek(c);
    if (!t) throw new Error('unexpected end in string list');
    if (t.kind === 'rparen') {
      next(c);
      return out;
    }
    if (t.kind !== 'string') throw new Error(`expected string in list, got ${t.kind}`);
    out.push(t.value);
    next(c);
  }
}

function parseIdentList(c: Cursor): string[] {
  expect(c, 'lparen');
  const out: string[] = [];
  while (true) {
    const t = peek(c);
    if (!t) throw new Error('unexpected end in ident list');
    if (t.kind === 'rparen') {
      next(c);
      return out;
    }
    if (t.kind !== 'symbol') throw new Error(`expected symbol in list, got ${t.kind}`);
    out.push(t.value);
    next(c);
  }
}

function parseStep(c: Cursor): CertStep {
  expect(c, 'lparen');
  const head = expect(c, 'symbol');
  if (head.value !== 'step') throw new Error(`expected "step", got "${head.value}"`);
  let id: string | null = null;
  let rule: string | null = null;
  let args: string[] = [];
  let conclusion: string | null = null;
  let depends: string[] = [];

  while (true) {
    const t = peek(c);
    if (!t) throw new Error('unexpected end in step');
    if (t.kind === 'rparen') {
      next(c);
      break;
    }
    if (t.kind !== 'symbol' || !t.value.startsWith(':')) {
      throw new Error(`expected keyword in step, got ${t.kind}:${t.value}`);
    }
    next(c);
    switch (t.value) {
      case ':id': {
        const v = expect(c, 'symbol');
        id = v.value;
        break;
      }
      case ':rule': {
        const v = expect(c, 'symbol');
        rule = v.value;
        break;
      }
      case ':args':
        args = parseStringList(c);
        break;
      case ':conclusion': {
        const v = expect(c, 'string');
        conclusion = v.value;
        break;
      }
      case ':depends':
        depends = parseIdentList(c);
        break;
      default:
        throw new Error(`unknown step keyword: ${t.value}`);
    }
  }

  if (id === null || rule === null || conclusion === null) {
    throw new Error('step missing required fields');
  }
  return { id, rule, args, conclusion, depends };
}

function parseSignature(c: Cursor): CertSignature {
  expect(c, 'lparen');
  const head = expect(c, 'symbol');
  if (head.value !== 'sig') throw new Error(`expected "sig", got "${head.value}"`);
  let algorithm: CertSignature['algorithm'] | null = null;
  let publicKey: string | null = null;
  let signature: string | null = null;
  while (true) {
    const t = peek(c);
    if (!t) throw new Error('unexpected end in signature');
    if (t.kind === 'rparen') {
      next(c);
      break;
    }
    if (t.kind !== 'symbol' || !t.value.startsWith(':')) {
      throw new Error(`expected keyword in signature, got ${t.kind}:${t.value}`);
    }
    next(c);
    switch (t.value) {
      case ':algorithm': {
        const v = expect(c, 'symbol');
        if (v.value !== 'Ed25519' && v.value !== 'HMAC-SHA256') {
          throw new Error(`unknown signature algorithm: ${v.value}`);
        }
        algorithm = v.value;
        break;
      }
      case ':public-key': {
        const v = expect(c, 'string');
        publicKey = v.value;
        break;
      }
      case ':signature': {
        const v = expect(c, 'string');
        signature = v.value;
        break;
      }
      default:
        throw new Error(`unknown signature keyword: ${t.value}`);
    }
  }
  if (algorithm === null || publicKey === null || signature === null) {
    throw new Error('signature missing required fields');
  }
  return { algorithm, publicKey, signature };
}

/**
 * Importa un certificado desde su forma LFSC. Devuelve `{ error }`
 * en caso de fallo de parseo en lugar de lanzar — para que el
 * caller decida.
 */
export function importLFSC(input: string): ProofCertificate | { error: string } {
  try {
    const toks = tokenize(input);
    const c: Cursor = { toks, pos: 0 };
    expect(c, 'lparen');
    const head = expect(c, 'symbol');
    if (head.value !== 'proof') {
      return { error: `expected "proof", got "${head.value}"` };
    }
    let version: '1.0' | null = null;
    let goal: string | null = null;
    let profile: string | null = null;
    let axioms: string[] = [];
    const steps: CertStep[] = [];
    let hash: string | null = null;
    let signature: CertSignature | undefined;

    while (true) {
      const t = peek(c);
      if (!t) return { error: 'unexpected end of input in proof' };
      if (t.kind === 'rparen') {
        next(c);
        break;
      }
      if (t.kind !== 'symbol' || !t.value.startsWith(':')) {
        return { error: `expected keyword, got ${t.kind}:${t.value}` };
      }
      next(c);
      switch (t.value) {
        case ':version': {
          const v = expect(c, 'string');
          if (v.value !== '1.0') return { error: `unsupported version: ${v.value}` };
          version = '1.0';
          break;
        }
        case ':goal': {
          const v = expect(c, 'string');
          goal = v.value;
          break;
        }
        case ':profile': {
          const v = expect(c, 'string');
          profile = v.value;
          break;
        }
        case ':axioms':
          axioms = parseStringList(c);
          break;
        case ':steps': {
          expect(c, 'lparen');
          while (true) {
            const t2 = peek(c);
            if (!t2) return { error: 'unexpected end in steps' };
            if (t2.kind === 'rparen') {
              next(c);
              break;
            }
            steps.push(parseStep(c));
          }
          break;
        }
        case ':hash': {
          const v = expect(c, 'string');
          hash = v.value;
          break;
        }
        case ':signature':
          signature = parseSignature(c);
          break;
        default:
          return { error: `unknown proof keyword: ${t.value}` };
      }
    }

    if (version === null || goal === null || profile === null || hash === null) {
      return { error: 'proof missing required fields' };
    }
    const cert: ProofCertificate = {
      version,
      goal,
      profile,
      axioms,
      steps,
      hash,
    };
    if (signature) cert.signature = signature;
    return cert;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
