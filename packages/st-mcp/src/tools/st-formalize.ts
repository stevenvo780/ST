import { evaluate, type STEvalResult } from '@stevenvo780/st-lang/api';
import type { FormalizeInputT } from '../schemas.js';

export interface FormalizeResult {
  ok: boolean;
  profile: string;
  text: string;
  formula: string;
  anchor: string;
  summary: string;
  diagnostics: STEvalResult['diagnostics'];
  stdout: string;
  stderr: string;
}

const DEFAULT_ANCHOR = 'mcp.input#p1';

// Covers CR, LF, and the two Unicode line-terminator code points (U+2028 LINE
// SEPARATOR, U+2029 PARAGRAPH SEPARATOR).  Literal U+2028/U+2029 cannot appear
// inside a regex literal in TypeScript (they are treated as line endings by the
// spec), so we use RegExp() with unicode escapes.
const LINE_TERM_RE = new RegExp('[\r\n\u2028\u2029]', 'g');

/**
 * Construye un programa ST que registra un pasaje (text-layer) y
 * lo formaliza con la fórmula propuesta. El runtime de st-lang
 * valida la sintaxis de la fórmula y produce un registro
 * `passage / formalize`.
 *
 * Nota: ST no infiere la fórmula a partir del texto natural — esa
 * tarea sigue siendo del LLM. Esta tool sirve para *registrar* la
 * formalización propuesta validándola contra el perfil lógico, lo
 * que captura los typos y errores de sintaxis temprano.
 */
export function runFormalize(input: FormalizeInputT): FormalizeResult {
  const { text, formula, profile } = input;
  const rawAnchor = input.anchor && input.anchor.length > 0 ? input.anchor : DEFAULT_ANCHOR;
  // El anchor va crudo dentro de passage([[ ... ]]). Quitamos line-terminators y
  // corchetes: sin `]` no se puede cerrar el scan `[[...]]` antes de tiempo, lo
  // que cierra la inyección de tokens; un anchor normal (ruta#fragmento) no los usa.
  const anchor = rawAnchor.replace(LINE_TERM_RE, ' ').replace(/[[\]]/g, '');
  const safeText = text.replace(LINE_TERM_RE, ' ').slice(0, 500);
  // Strip line-terminators from the formula: it is placed after "formalize p1 as"
  // with no further structural quoting, so any injected newline would open a new
  // ST statement.
  const safeFormula = formula.replace(LINE_TERM_RE, ' ');
  const source = [
    `logic ${profile}`,
    `// ${safeText}`,
    `let p1 = passage([[${anchor}]])`,
    `let f1 = formalize p1 as ${safeFormula}`,
  ].join('\n');
  const r = evaluate(source, '<st-mcp:formalize>');
  const summary = r.ok
    ? `Pasaje "${anchor}" formalizado como ${formula} bajo ${profile}.`
    : `No se pudo formalizar: ${r.stderr || 'error desconocido'}`;
  return {
    ok: r.ok,
    profile,
    text,
    formula,
    anchor,
    summary,
    diagnostics: r.diagnostics,
    stdout: r.stdout,
    stderr: r.stderr,
  };
}
