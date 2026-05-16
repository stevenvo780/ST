// ============================================================
// Normalización de respuestas — comparar strings textuales
// ============================================================

export function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

const STATUS_SYNONYMS: Record<string, string[]> = {
  valid: [
    'valid',
    'valida',
    'válida',
    'tautologia',
    'tautología',
    'true',
    'verdadero',
    'si',
    'sí',
    'yes',
  ],
  invalid: [
    'invalid',
    'invalida',
    'inválida',
    'no',
    'falso',
    'false',
    'not valid',
    'no valida',
    'no válida',
  ],
  satisfiable: ['satisfiable', 'sat', 'consistente', 'satisfacible'],
  unsatisfiable: [
    'unsatisfiable',
    'unsat',
    'inconsistente',
    'contradiccion',
    'contradicción',
    'insatisfacible',
  ],
  provable: ['provable', 'derivable', 'demostrable', 'se deriva', 'si', 'sí'],
  refutable: ['refutable', 'no derivable', 'no se deriva'],
};

export function matchesStatus(answer: string, expected: string): boolean {
  const normalized = normalizeText(answer);
  const synonyms = STATUS_SYNONYMS[expected];
  if (!synonyms) return normalized === normalizeText(expected);
  return synonyms.some((s) => normalizeText(s) === normalized);
}

const SYMBOL_NORMALIZATIONS: Array<[RegExp, string]> = [
  [/[→⇒]/g, '->'],
  [/[↔⇔≡]/g, '<->'],
  [/[¬!~]/g, '~'],
  [/[∧]/g, '&'],
  [/[∨]/g, '|'],
  [/[⊤]/g, 'true'],
  [/[⊥]/g, 'false'],
];

export function normalizeFormula(s: string): string {
  let out = s;
  for (const [re, rep] of SYMBOL_NORMALIZATIONS) {
    out = out.replace(re, rep);
  }
  out = out
    .replace(/\s+/g, '')
    .replace(/\band\b/gi, '&')
    .replace(/\bor\b/gi, '|')
    .replace(/\bnot\b/gi, '~')
    .replace(/\bimplies\b/gi, '->')
    .replace(/\biff\b/gi, '<->');
  return out.toLowerCase();
}

export function formulasEqualText(a: string, b: string): boolean {
  return normalizeFormula(a) === normalizeFormula(b);
}

export function parseValuation(raw: string): Record<string, boolean> | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const out: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'boolean') {
          out[k.toUpperCase()] = v;
        } else if (typeof v === 'number') {
          out[k.toUpperCase()] = v !== 0;
        } else if (typeof v === 'string') {
          out[k.toUpperCase()] = matchesStatus(v, 'valid') || /^(t|true|1)$/i.test(v);
        }
      }
      return out;
    } catch {
      return null;
    }
  }
  const out: Record<string, boolean> = {};
  const parts = trimmed.split(/[;,\n]+/);
  let foundAny = false;
  for (const part of parts) {
    const m = part.match(/([A-Za-z][A-Za-z0-9_]*)\s*[:=]\s*([A-Za-z01]+)/);
    if (!m) continue;
    const name = (m[1] ?? '').toUpperCase();
    const valRaw = (m[2] ?? '').toLowerCase();
    const truthy = valRaw === 't' || valRaw === 'true' || valRaw === '1' || valRaw === 'v';
    const falsy = valRaw === 'f' || valRaw === 'false' || valRaw === '0';
    if (!truthy && !falsy) continue;
    out[name] = truthy;
    foundAny = true;
  }
  return foundAny ? out : null;
}
