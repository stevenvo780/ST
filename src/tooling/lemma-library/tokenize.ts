// ============================================================
// Tokenización compartida — biblioteca de lemas
//
// Mezcla léxica (palabras) + estructural (símbolos lógicos),
// con stopwords mínimos para que la búsqueda de operadores
// (∧, ∨, →, ↔, ¬, □, ◇, ∀, ∃, =, ∈, ⊆, +, ·, …) sea efectiva.
// ============================================================

const LOGIC_SYMBOLS = new Set([
  '∧',
  '∨',
  '¬',
  '→',
  '↔',
  '⊥',
  '⊤',
  '∀',
  '∃',
  '□',
  '◇',
  '⊢',
  '⇒',
  '=',
  '≠',
  '≤',
  '<',
  '>',
  '∈',
  '∉',
  '⊆',
  '⊂',
  '∪',
  '∩',
  '∅',
  '·',
  '+',
  'ᶜ',
]);

// Stopwords con ≥3 letras: queremos preservar metavars de 1 letra
// (P, Q, A, n, x, …) y separadores cortos (en/un/la) NO se filtran
// para no colisionar con identificadores.
const STOPWORDS = new Set(['the', 'and', 'with', 'for', 'los', 'las']);

// Separadores adicionales que NO son símbolos lógicos pero rompen
// tokens (paréntesis, espacios, comas, hyphens en kebab-case tags…).
const SEPARATOR_RE = /[\s\-.,;:!?()[\]{}'"`]/;

export function tokenize(text: string): string[] {
  const out: string[] = [];
  let current = '';
  const flush = (): void => {
    if (current.length > 0) {
      const norm = current.toLowerCase();
      if (!STOPWORDS.has(norm)) out.push(norm);
    }
    current = '';
  };
  for (const ch of text) {
    if (LOGIC_SYMBOLS.has(ch)) {
      flush();
      out.push(ch);
    } else if (SEPARATOR_RE.test(ch)) {
      flush();
    } else {
      current += ch;
    }
  }
  flush();
  return out;
}
