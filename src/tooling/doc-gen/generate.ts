// ============================================================
// generateDocs — glue.
//
// extractDocs → render(markdown|json|html-minimal) → escribe a
// outputDir, devolviendo lista de archivos y warnings detectados
// durante el proceso (símbolos sin descripción, etc.).
// ============================================================

import * as fs from 'fs/promises';
import * as path from 'path';

import { extractDocs } from './extract';
import { renderJSON, renderMarkdown, renderIndex } from './render';
import type { DocModule, DocOptions, GenerateResult } from './types';

/**
 * Genera documentación a disco según `opts.template`. Crea
 * `outputDir` y subdirectorios necesarios.
 *
 * El default cuando `template` no se especifica es `'markdown'`.
 */
export async function generateDocs(opts: DocOptions): Promise<GenerateResult> {
  const includeInternal = opts.includeInternal === true;
  const modules = extractDocs(opts.rootDir, { includeInternal });
  const template = opts.template ?? 'markdown';

  const warnings = collectWarnings(modules);
  const filesWritten: string[] = [];

  await fs.mkdir(opts.outputDir, { recursive: true });

  if (template === 'markdown') {
    const files = renderMarkdown(modules);
    for (const [relPath, content] of files) {
      const abs = path.join(opts.outputDir, relPath);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, content, 'utf8');
      filesWritten.push(abs);
    }
  } else if (template === 'json') {
    const abs = path.join(opts.outputDir, 'api.json');
    await fs.writeFile(abs, renderJSON(modules), 'utf8');
    filesWritten.push(abs);
  } else if (template === 'html-minimal') {
    const indexHtml = renderHtmlMinimal(modules);
    const abs = path.join(opts.outputDir, 'index.html');
    await fs.writeFile(abs, indexHtml, 'utf8');
    filesWritten.push(abs);
  }

  return { filesWritten, warnings };
}

function collectWarnings(modules: DocModule[]): string[] {
  const out: string[] = [];
  for (const mod of modules) {
    for (const sym of mod.exports) {
      if (!sym.description) {
        out.push(`${mod.path}:${sym.lineNumber}: ${sym.kind} \`${sym.name}\` sin descripción`);
      }
    }
  }
  return out;
}

function renderHtmlMinimal(modules: DocModule[]): string {
  const md = renderIndex(modules);
  // Minimal HTML que embebe el index como <pre>. Útil para preview
  // rápida sin pipeline de Markdown.
  const escaped = md.replace(/[&<>]/g, (c) => {
    if (c === '&') return '&amp;';
    if (c === '<') return '&lt;';
    return '&gt;';
  });
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>API Reference</title></head>',
    '<body><pre style="font:14px/1.4 monospace">',
    escaped,
    '</pre></body>',
    '</html>',
    '',
  ].join('\n');
}
