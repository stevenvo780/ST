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
  const anchor = input.anchor && input.anchor.length > 0 ? input.anchor : DEFAULT_ANCHOR;
  // El parser de st-lang acepta `passage([[ruta#seccion]])` como anchor.
  // Comentamos el texto natural en línea para que quede en el programa
  // como evidencia documental sin afectar la semántica.
  const safeText = text.replace(/\r?\n/g, ' ').slice(0, 500);
  const source = [
    `logic ${profile}`,
    `// ${safeText}`,
    `let p1 = passage([[${anchor}]])`,
    `let f1 = formalize p1 as ${formula}`,
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
