/**
 * Renderer HTML para notebooks .stnb
 * Produce HTML standalone con KaTeX para $...$ y $$...$$
 */

import type { Notebook, Cell, CodeCell, CellOutput } from './types';

const KATEX_CDN =
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convierte markdown básico a HTML:
 * - Headers #, ##, ###
 * - Bold **text**
 * - Italic *text*
 * - Inline code `code`
 * - Preserve $...$ and $$...$$ for KaTeX
 */
function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const result: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.*)/);
    const h2 = trimmed.match(/^##\s+(.*)/);
    const h1 = trimmed.match(/^#\s+(.*)/);

    if (h1 ?? h2 ?? h3) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      const level = h3 ? 3 : h2 ? 2 : 1;
      const text = (h3 ?? h2 ?? h1)![1] ?? '';
      result.push(`<h${level}>${inlineFormat(text)}</h${level}>`);
    } else {
      if (!inParagraph) {
        result.push('<p>');
        inParagraph = true;
      }
      result.push(inlineFormat(trimmed));
    }
  }

  if (inParagraph) {
    result.push('</p>');
  }

  return result.join('\n');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function renderOutput(output: CellOutput): string {
  const execTime =
    output.metadata?.executionTime !== undefined
      ? `<span class="exec-time">${output.metadata.executionTime}ms</span>`
      : '';

  if (output.type === 'result') {
    const stdout = typeof output.data['stdout'] === 'string' ? output.data['stdout'] : '';
    const valid = output.data['valid'] === true;
    const statusClass = valid ? 'output-ok' : 'output-err';
    return `<div class="cell-output ${statusClass}">
  <div class="output-header">Result ${execTime}</div>
  <pre class="output-text">${escapeHtml(stdout)}</pre>
</div>`;
  }

  if (output.type === 'error') {
    const message =
      typeof output.data['message'] === 'string' ? output.data['message'] : JSON.stringify(output.data);
    return `<div class="cell-output output-err">
  <div class="output-header">Error ${execTime}</div>
  <pre class="output-text">${escapeHtml(message)}</pre>
</div>`;
  }

  if (output.type === 'stream') {
    const text = typeof output.data['text'] === 'string' ? output.data['text'] : JSON.stringify(output.data);
    return `<div class="cell-output output-stream">
  <div class="output-header">Stream ${execTime}</div>
  <pre class="output-text">${escapeHtml(text)}</pre>
</div>`;
  }

  return '';
}

function renderCell(cell: Cell, index: number): string {
  if (cell.type === 'markdown') {
    return `<div class="cell cell-markdown" data-id="${escapeHtml(cell.id)}" data-index="${index}">
  <div class="cell-content markdown-body">${markdownToHtml(cell.source)}</div>
</div>`;
  }

  const codeCell = cell as CodeCell;
  const profile = codeCell.profile ? ` <span class="cell-profile">${escapeHtml(codeCell.profile)}</span>` : '';
  const outputsHtml = codeCell.outputs.map(renderOutput).join('\n');

  return `<div class="cell cell-code" data-id="${escapeHtml(cell.id)}" data-index="${index}">
  <div class="cell-header">Code${profile}</div>
  <pre class="cell-source"><code class="language-st">${escapeHtml(codeCell.source)}</code></pre>
${outputsHtml}
</div>`;
}

/**
 * Renderiza un Notebook a HTML standalone.
 * Incluye KaTeX desde CDN para renderizar LaTeX inline ($...$) y display ($$...$$).
 */
export function renderHTML(notebook: Notebook): string {
  const cellsHtml = notebook.cells
    .map((cell, idx) => renderCell(cell, idx))
    .join('\n');

  const title = escapeHtml(notebook.metadata.title);
  const author = notebook.metadata.author
    ? `<div class="nb-author">${escapeHtml(notebook.metadata.author)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="${KATEX_CDN}katex.min.css" />
  <script defer src="${KATEX_CDN}katex.min.js"></script>
  <script defer src="${KATEX_CDN}contrib/auto-render.min.js"
    onload="renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });"></script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; }
    .nb-header { border-bottom: 2px solid #ddd; margin-bottom: 2rem; padding-bottom: 1rem; }
    .nb-title { font-size: 2rem; margin: 0 0 0.25rem 0; }
    .nb-author { color: #666; font-size: 0.9rem; }
    .nb-meta { color: #888; font-size: 0.8rem; margin-top: 0.5rem; }
    .cell { margin: 1rem 0; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
    .cell-markdown { padding: 1rem 1.5rem; background: #fff; }
    .cell-code { background: #fafafa; }
    .cell-header { padding: 0.3rem 1rem; background: #f0f0f0; font-size: 0.75rem; color: #555; }
    .cell-profile { background: #d4e8ff; padding: 0.1rem 0.4rem; border-radius: 3px; }
    .cell-source { margin: 0; padding: 1rem; background: #f8f8f8; overflow-x: auto; font-size: 0.9rem; }
    .cell-output { border-top: 1px solid #e8e8e8; }
    .output-header { padding: 0.2rem 1rem; font-size: 0.7rem; color: #777; background: #f5f5f5; }
    .output-ok .output-header { background: #f0fff0; color: #3a7d44; }
    .output-err .output-header { background: #fff0f0; color: #c0392b; }
    .output-stream .output-header { background: #fffbf0; color: #856404; }
    .output-text { margin: 0; padding: 0.75rem 1rem; font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap; }
    .exec-time { float: right; opacity: 0.6; }
    .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 0.5rem; }
    code { background: #f0f0f0; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.9em; }
    pre code { background: transparent; padding: 0; }
  </style>
</head>
<body>
  <div class="nb-header">
    <h1 class="nb-title">${title}</h1>
    ${author}
    <div class="nb-meta">
      Kernel: ${escapeHtml(notebook.kernel)} ${escapeHtml(notebook.kernelVersion)} &bull;
      Profile: ${escapeHtml(notebook.metadata.profile)} &bull;
      Version: ${escapeHtml(notebook.version)}
    </div>
  </div>
  <div class="notebook-cells">
${cellsHtml}
  </div>
</body>
</html>`;
}
