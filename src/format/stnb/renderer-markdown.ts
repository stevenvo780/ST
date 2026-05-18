/**
 * Renderer Markdown para notebooks .stnb
 * Exporta a Markdown con fenced blocks para code cells y tablas para outputs.
 */

import type { Notebook, Cell, CodeCell, CellOutput } from './types';

function renderOutputAsTable(output: CellOutput): string {
  if (output.type === 'result') {
    const stdout =
      typeof output.data['stdout'] === 'string' ? output.data['stdout'] : '';
    const valid = output.data['valid'] === true ? '✓' : '✗';
    const time =
      output.metadata?.executionTime !== undefined
        ? `${output.metadata.executionTime}ms`
        : '-';

    return [
      '',
      '| Campo | Valor |',
      '|-------|-------|',
      `| Estado | ${valid} |`,
      `| Tiempo | ${time} |`,
      stdout
        ? `\n\`\`\`\n${stdout.trim()}\n\`\`\``
        : '',
    ].join('\n');
  }

  if (output.type === 'error') {
    const message =
      typeof output.data['message'] === 'string'
        ? output.data['message']
        : JSON.stringify(output.data);
    const time =
      output.metadata?.executionTime !== undefined
        ? `${output.metadata.executionTime}ms`
        : '-';

    return [
      '',
      '| Campo | Valor |',
      '|-------|-------|',
      `| Estado | ✗ Error |`,
      `| Tiempo | ${time} |`,
      `\n> **Error:** ${message.split('\n')[0] ?? message}`,
    ].join('\n');
  }

  if (output.type === 'stream') {
    const text =
      typeof output.data['text'] === 'string'
        ? output.data['text']
        : JSON.stringify(output.data);
    return `\n\`\`\`\n${text.trim()}\n\`\`\``;
  }

  return '';
}

function renderCellMd(cell: Cell): string {
  if (cell.type === 'markdown') {
    return cell.source;
  }

  const codeCell = cell as CodeCell;
  const profileTag = codeCell.profile ? ` <!-- profile: ${codeCell.profile} -->` : '';

  const parts: string[] = [
    `\`\`\`st${profileTag}`,
    codeCell.source.trim(),
    '```',
  ];

  if (codeCell.outputs.length > 0) {
    parts.push('\n**Outputs:**');
    for (const output of codeCell.outputs) {
      parts.push(renderOutputAsTable(output));
    }
  }

  return parts.join('\n');
}

/**
 * Exporta un Notebook a Markdown.
 * - cells markdown → contenido directo
 * - cells code → fenced blocks ```st ... ```
 * - outputs → tablas Markdown
 */
export function renderMarkdown(notebook: Notebook): string {
  const header = [
    `# ${notebook.metadata.title}`,
    '',
    notebook.metadata.author ? `**Autor:** ${notebook.metadata.author}` : '',
    `**Kernel:** ${notebook.kernel} ${notebook.kernelVersion}`,
    `**Profile:** ${notebook.metadata.profile}`,
    `**Versión:** ${notebook.version}`,
    '',
    '---',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  const cells = notebook.cells.map(renderCellMd).join('\n\n---\n\n');

  return header + cells + '\n';
}
