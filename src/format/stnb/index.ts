/**
 * ST Notebook Format (.stnb)
 * Análogo a Jupyter .ipynb pero para proofs ST.
 *
 * API pública:
 *   parseNotebook(source)     — JSON string → Notebook
 *   serializeNotebook(nb)     — Notebook → JSON string (pretty, 2 spaces)
 *   executeNotebook(nb, opts) — ejecuta cells code, captura outputs
 *   renderHTML(nb)            — Notebook → HTML standalone (KaTeX)
 *   renderMarkdown(nb)        — Notebook → Markdown export
 */

export { parseNotebook, ParseError } from './parser';
export { serializeNotebook, serializeNotebookCompact } from './serializer';
export { executeNotebook, executeCell } from './executor';
export type { ExecuteOptions, ExecuteResult } from './executor';
export { renderHTML } from './renderer-html';
export { renderMarkdown } from './renderer-markdown';
export type {
  Notebook,
  Cell,
  CodeCell,
  MarkdownCell,
  CellOutput,
  CellOutputMetadata,
  CellType,
  OutputType,
  NotebookMetadata,
} from './types';
