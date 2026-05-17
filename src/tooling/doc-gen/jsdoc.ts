// ============================================================
// JSDoc/TSDoc parser ligero.
//
// Tomamos el rawText de un JSDoc (incluyendo `/** ... */`) o el
// cuerpo limpio que ya entrega ts.getJSDocCommentRanges, y lo
// partimos en `description` + lista de `tags`.
//
// Soporta tags comunes: @param, @returns/@return, @example,
// @remarks, @see, @deprecated, @internal, @public, @beta,
// @experimental.
// ============================================================

import type { JSDocTag, ParsedJSDoc } from './types';

/**
 * Quita los marcadores `/**`, `*\/` y el `*` líder de cada línea
 * para dejar el contenido textual del comentario.
 */
export function stripCommentMarkers(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('/**')) s = s.slice(3);
  else if (s.startsWith('/*')) s = s.slice(2);
  if (s.endsWith('*/')) s = s.slice(0, -2);
  // Quita el `*` líder por línea (con el espacio opcional).
  const lines = s.split('\n').map((line) => {
    const m = /^\s*\*\s?(.*)$/.exec(line);
    return m ? (m[1] ?? '') : line;
  });
  // Trim final pero preservando saltos internos.
  return lines
    .join('\n')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '');
}

/**
 * Parsea un comentario JSDoc/TSDoc en `description` + `tags`.
 * Acepta tanto el raw con `/** ... *\/` como el contenido ya limpio.
 *
 * Cada tag se reconoce con la heurística clásica de TypeDoc/TSDoc:
 * una línea que empieza con `@<word>` abre un nuevo tag y consume
 * todas las líneas siguientes hasta el próximo `@<word>` o EOF.
 */
export function parseJSDoc(comment: string): ParsedJSDoc {
  const cleaned = comment.includes('/*') ? stripCommentMarkers(comment) : comment;
  const lines = cleaned.split('\n');

  const descLines: string[] = [];
  const tags: JSDocTag[] = [];
  let current: JSDocTag | null = null;

  const tagOpen = /^@([A-Za-z][A-Za-z0-9_-]*)\s*(.*)$/;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    const trimmed = line.trimStart();
    const m = tagOpen.exec(trimmed);
    if (m) {
      if (current) tags.push(finalizeTag(current));
      current = { tag: m[1] ?? '', content: m[2] ?? '' };
    } else if (current) {
      current.content += (current.content.length > 0 ? '\n' : '') + line;
    } else {
      descLines.push(line);
    }
  }
  if (current) tags.push(finalizeTag(current));

  return {
    description: descLines.join('\n').trim(),
    tags,
  };
}

function finalizeTag(tag: JSDocTag): JSDocTag {
  return {
    tag: tag.tag,
    content: tag.content.replace(/\s+$/, '').trim(),
  };
}

/**
 * `@param name description` → { name, description, optional }.
 *
 * También soporta el formato con tipo `@param {Type} name desc` aunque
 * los tipos reales los tomamos del compilador, no del JSDoc.
 */
export function parseParamTag(
  content: string,
): { name: string; description: string; optional: boolean } | null {
  // Formato: [{Type}] name[?] - description    (el `-` es opcional)
  let s = content.trim();
  // Drop opcional `{Type}` líder.
  if (s.startsWith('{')) {
    const end = s.indexOf('}');
    if (end > 0) s = s.slice(end + 1).trim();
  }
  const m = /^(\[?[A-Za-z_$][A-Za-z0-9_$.[\]?=]*\]?)\s*[-:]?\s*([\s\S]*)$/.exec(s);
  if (!m) return null;
  const rawName = m[1] ?? '';
  let name = rawName;
  let optional = false;
  if (name.startsWith('[') && name.endsWith(']')) {
    name = name.slice(1, -1);
    optional = true;
  }
  if (name.endsWith('?')) {
    name = name.slice(0, -1);
    optional = true;
  }
  // `name=default` → name only
  const eq = name.indexOf('=');
  if (eq >= 0) {
    name = name.slice(0, eq);
    optional = true;
  }
  return {
    name: name.trim(),
    description: (m[2] ?? '').trim(),
    optional,
  };
}

/**
 * `@returns description` → description string.
 */
export function parseReturnsTag(content: string): string {
  let s = content.trim();
  if (s.startsWith('{')) {
    const end = s.indexOf('}');
    if (end > 0) s = s.slice(end + 1).trim();
  }
  if (s.startsWith('-')) s = s.slice(1).trim();
  return s;
}
