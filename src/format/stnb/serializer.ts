/**
 * Serializer del formato .stnb — Notebook → JSON string
 */

import type { Notebook } from './types';

/**
 * Serializa un Notebook a JSON string con indentación de 2 espacios.
 * El output es válido para parseNotebook().
 */
export function serializeNotebook(notebook: Notebook): string {
  return JSON.stringify(notebook, null, 2);
}

/**
 * Serializa a JSON compacto (sin indentación) para almacenamiento eficiente.
 */
export function serializeNotebookCompact(notebook: Notebook): string {
  return JSON.stringify(notebook);
}
