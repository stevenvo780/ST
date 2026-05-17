// ============================================================
// Renderers — Markdown / JSON / index.
//
// renderMarkdown devuelve Map<filePath, contenido>. La clave es
// relativa (`tooling/doc-gen.md`, `index.md`...) y se compone a
// partir del modulePath original (sin extensión `.ts`).
// ============================================================

import type { ApiDoc, ApiKind, DocModule } from './types';

const KIND_LABEL: Record<ApiKind, string> = {
  function: 'Function',
  class: 'Class',
  interface: 'Interface',
  type: 'Type',
  const: 'Const',
  enum: 'Enum',
  namespace: 'Namespace',
};

/**
 * Renderiza la documentación a Markdown. La salida es un Map en
 * el que la clave es la ruta del archivo `.md` correspondiente
 * (relativa) y el valor es su contenido textual.
 *
 * Además del archivo por módulo, se incluye `index.md` con el
 * overview generado por `renderIndex`.
 */
export function renderMarkdown(modules: DocModule[]): Map<string, string> {
  const files = new Map<string, string>();
  for (const mod of modules) {
    const outPath = toMarkdownPath(mod.path);
    files.set(outPath, renderModuleMarkdown(mod));
  }
  files.set('index.md', renderIndex(modules));
  return files;
}

/**
 * Serializa la estructura completa a JSON pretty-printed.
 *
 * Útil cuando el consumidor (otro generador, un buscador, un
 * sitio estático) prefiere consumir la data cruda.
 */
export function renderJSON(modules: DocModule[]): string {
  return JSON.stringify({ modules }, null, 2) + '\n';
}

/**
 * Construye un `index.md` resumen con:
 *  - conteo total de módulos y símbolos
 *  - tabla por módulo con # de exports y descripción opcional
 *  - sub-tablas por kind (functions, classes, etc.)
 */
export function renderIndex(modules: DocModule[]): string {
  const lines: string[] = [];
  const totalSymbols = modules.reduce((acc, m) => acc + m.exports.length, 0);

  lines.push('# API Reference');
  lines.push('');
  lines.push(`> Auto-generado por \`tooling/doc-gen\`.`);
  lines.push('');
  lines.push(`- **Modules**: ${modules.length}`);
  lines.push(`- **Symbols**: ${totalSymbols}`);
  lines.push('');

  // Conteo por kind
  const byKind = countByKind(modules);
  if (byKind.size > 0) {
    lines.push('## Symbols by kind');
    lines.push('');
    lines.push('| Kind | Count |');
    lines.push('| ---- | ----- |');
    for (const [kind, count] of byKind) {
      lines.push(`| ${KIND_LABEL[kind]} | ${count} |`);
    }
    lines.push('');
  }

  lines.push('## Modules');
  lines.push('');
  lines.push('| Module | Exports | Description |');
  lines.push('| ------ | ------- | ----------- |');
  for (const mod of modules) {
    const link = `[\`${mod.path}\`](./${toMarkdownPath(mod.path)})`;
    const desc = (mod.description ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
    lines.push(`| ${link} | ${mod.exports.length} | ${desc} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderModuleMarkdown(mod: DocModule): string {
  const lines: string[] = [];
  lines.push(`# \`${mod.path}\``);
  lines.push('');
  if (mod.description) {
    lines.push(mod.description);
    lines.push('');
  }
  // Index intra-módulo
  if (mod.exports.length > 1) {
    lines.push('## Contents');
    lines.push('');
    for (const sym of mod.exports) {
      const anchor = slugify(sym.name);
      const decoration = sym.deprecated ? ' _(deprecated)_' : '';
      lines.push(`- [\`${sym.name}\`](#${anchor}) — ${KIND_LABEL[sym.kind]}${decoration}`);
    }
    lines.push('');
  }
  for (const sym of mod.exports) {
    lines.push(renderSymbol(sym));
    lines.push('');
  }
  return lines.join('\n');
}

function renderSymbol(sym: ApiDoc): string {
  const lines: string[] = [];
  const deprecated = sym.deprecated ? ' ⚠️ DEPRECATED' : '';
  lines.push(`## \`${sym.name}\`${deprecated}`);
  lines.push('');
  lines.push(`> ${KIND_LABEL[sym.kind]} · \`${sym.module}:${sym.lineNumber}\``);
  lines.push('');

  if (sym.deprecated) {
    lines.push('> **Deprecated.** No usar en código nuevo.');
    lines.push('');
  }

  if (sym.description) {
    lines.push(sym.description);
    lines.push('');
  }

  if (sym.signature) {
    lines.push('```ts');
    lines.push(sym.signature);
    lines.push('```');
    lines.push('');
  }

  if (sym.parameters && sym.parameters.length > 0) {
    lines.push('### Parameters');
    lines.push('');
    lines.push('| Name | Type | Optional | Description |');
    lines.push('| ---- | ---- | -------- | ----------- |');
    for (const p of sym.parameters) {
      const desc = p.description.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
      lines.push(
        `| \`${p.name}\` | \`${escapeMd(p.type)}\` | ${p.optional ? 'yes' : 'no'} | ${desc} |`,
      );
    }
    lines.push('');
  }

  if (sym.returns) {
    lines.push('### Returns');
    lines.push('');
    lines.push(`\`${escapeMd(sym.returns.type)}\` — ${sym.returns.description}`);
    lines.push('');
  }

  if (sym.examples && sym.examples.length > 0) {
    lines.push('### Examples');
    lines.push('');
    for (const ex of sym.examples) {
      lines.push(renderExample(ex));
    }
  }

  if (sym.remarks) {
    lines.push('### Remarks');
    lines.push('');
    lines.push(sym.remarks);
    lines.push('');
  }

  if (sym.see && sym.see.length > 0) {
    lines.push('### See also');
    lines.push('');
    for (const s of sym.see) {
      lines.push(`- ${s}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function renderExample(ex: string): string {
  // Si el example ya viene con su propio fence, respétalo.
  if (/```/.test(ex)) {
    return ex.trim() + '\n';
  }
  return ['```ts', ex.trim(), '```', ''].join('\n');
}

function countByKind(modules: DocModule[]): Map<ApiKind, number> {
  const out = new Map<ApiKind, number>();
  for (const m of modules) {
    for (const sym of m.exports) {
      out.set(sym.kind, (out.get(sym.kind) ?? 0) + 1);
    }
  }
  return out;
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * `tooling/doc-gen/extract.ts` → `tooling/doc-gen/extract.md`.
 */
export function toMarkdownPath(modulePath: string): string {
  return modulePath.replace(/\.ts$/, '.md');
}
