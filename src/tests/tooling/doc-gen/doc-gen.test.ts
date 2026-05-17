// ============================================================
// Tests — tooling/doc-gen
// Cubre: parseJSDoc, extractDocs (sobre fixtures temp), renderers
// y generateDocs end-to-end con outputDir descartable.
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  extractDocs,
  generateDocs,
  parseJSDoc,
  parseParamTag,
  parseReturnsTag,
  renderIndex,
  renderJSON,
  renderMarkdown,
  stripCommentMarkers,
  toMarkdownPath,
} from '../../../tooling/doc-gen';

// --- fixtures helper ----------------------------------------

function mkdtemp(prefix = 'doc-gen-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFile(dir: string, rel: string, content: string): void {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

// fixture compartida con un function documentado, una class, un type,
// un const, una interface, un enum y un export sin JSDoc.
function buildFixtureRoot(): string {
  const root = mkdtemp();
  writeFile(
    root,
    'math.ts',
    [
      '/**',
      ' * Suma dos enteros.',
      ' *',
      ' * @param a primer sumando',
      ' * @param b segundo sumando',
      ' * @returns la suma `a + b`',
      ' * @example',
      ' * sum(1, 2) // 3',
      ' */',
      'export function sum(a: number, b: number): number {',
      '  return a + b;',
      '}',
      '',
      '/**',
      ' * @deprecated usar `sum`',
      ' */',
      'export function add(a: number, b: number): number {',
      '  return sum(a, b);',
      '}',
      '',
      'export function undocumented(x: number): number { return x; }',
      '',
    ].join('\n'),
  );
  writeFile(
    root,
    'shapes.ts',
    [
      '/**',
      ' * Clase con métodos.',
      ' */',
      'export class Box {',
      '  constructor(public w: number, public h: number) {}',
      '  /** Área del box. */',
      '  area(): number { return this.w * this.h; }',
      '}',
      '',
      '/** Punto en 2D. */',
      'export interface Point { x: number; y: number; }',
      '',
      '/** Alias de Point. */',
      'export type P = Point;',
      '',
      '/** Constante con tipo. */',
      'export const ORIGIN: Point = { x: 0, y: 0 };',
      '',
      '/** Direcciones. */',
      'export enum Dir { N, S, E, W }',
      '',
    ].join('\n'),
  );
  writeFile(
    root,
    'internal.ts',
    [
      '/**',
      ' * @internal helper interno',
      ' */',
      'export function helper(): void {}',
      '',
      'function notExported(): void {}',
      '// referencia para que notExported no sea "unused" syntácticamente',
      'export const ref = notExported;',
      '',
    ].join('\n'),
  );
  writeFile(
    root,
    'nested/sub.ts',
    [
      '/**',
      ' * @fileoverview módulo nested.sub para probar paths con carpetas.',
      ' */',
      'export function nestedFn(): number { return 1; }',
      '',
    ].join('\n'),
  );
  // archivos que deben ser ignorados
  writeFile(root, 'foo.test.ts', 'export function shouldSkip(): void {}');
  writeFile(root, 'tests/bar.ts', 'export function alsoSkip(): void {}');
  writeFile(root, 'node_modules/pkg/index.ts', 'export const ignored = 1;');
  return root;
}

// --- parseJSDoc / helpers ------------------------------------

describe('parseJSDoc', () => {
  it('parsea description + @param + @returns + @example + @deprecated', () => {
    const raw = [
      '/**',
      ' * Hace algo.',
      ' *',
      ' * @param a desc-a',
      ' * @param b desc-b',
      ' * @returns la suma',
      ' * @example',
      ' * foo(1, 2)',
      ' * @deprecated',
      ' */',
    ].join('\n');
    const parsed = parseJSDoc(raw);
    expect(parsed.description).toBe('Hace algo.');
    expect(parsed.tags.map((t) => t.tag)).toEqual([
      'param',
      'param',
      'returns',
      'example',
      'deprecated',
    ]);
    const example = parsed.tags.find((t) => t.tag === 'example');
    expect(example?.content).toBe('foo(1, 2)');
  });

  it('stripCommentMarkers limpia /** y * líderes', () => {
    const raw = '/**\n * line A\n * line B\n */';
    expect(stripCommentMarkers(raw)).toBe('line A\nline B');
  });

  it('parseParamTag soporta `name desc` y `[name] desc`', () => {
    expect(parseParamTag('a primer sumando')).toEqual({
      name: 'a',
      description: 'primer sumando',
      optional: false,
    });
    expect(parseParamTag('[verbose] flag verbose')).toEqual({
      name: 'verbose',
      description: 'flag verbose',
      optional: true,
    });
    expect(parseParamTag('cfg? configuración')).toEqual({
      name: 'cfg',
      description: 'configuración',
      optional: true,
    });
  });

  it('parseReturnsTag descarta tipo entre llaves y el guion líder', () => {
    expect(parseReturnsTag('{number} - la suma')).toBe('la suma');
    expect(parseReturnsTag('la suma')).toBe('la suma');
  });
});

// --- extractDocs --------------------------------------------

describe('extractDocs', () => {
  let root: string;
  beforeAll(() => {
    root = buildFixtureRoot();
  });
  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('extrae función documentada con @param y @returns', () => {
    const modules = extractDocs(root);
    const math = modules.find((m) => m.path === 'math.ts');
    expect(math, 'math.ts module').toBeTruthy();
    const sum = math?.exports.find((e) => e.name === 'sum');
    expect(sum?.kind).toBe('function');
    expect(sum?.description).toBe('Suma dos enteros.');
    expect(sum?.parameters?.map((p) => p.name)).toEqual(['a', 'b']);
    expect(sum?.parameters?.[0]?.type).toBe('number');
    expect(sum?.parameters?.[0]?.description).toBe('primer sumando');
    expect(sum?.returns?.type).toBe('number');
    expect(sum?.returns?.description).toBe('la suma `a + b`');
    expect(sum?.examples?.length).toBeGreaterThan(0);
    expect(sum?.deprecated).toBeUndefined();
    expect(sum?.exported).toBe(true);
  });

  it('detecta @deprecated', () => {
    const modules = extractDocs(root);
    const math = modules.find((m) => m.path === 'math.ts');
    const add = math?.exports.find((e) => e.name === 'add');
    expect(add?.deprecated).toBe(true);
  });

  it('captura class + interface + type + const + enum', () => {
    const modules = extractDocs(root);
    const shapes = modules.find((m) => m.path === 'shapes.ts');
    expect(shapes).toBeTruthy();
    const kinds = new Map(shapes!.exports.map((e) => [e.name, e.kind]));
    expect(kinds.get('Box')).toBe('class');
    expect(kinds.get('Point')).toBe('interface');
    expect(kinds.get('P')).toBe('type');
    expect(kinds.get('ORIGIN')).toBe('const');
    expect(kinds.get('Dir')).toBe('enum');
  });

  it('@internal se oculta por defecto y aparece con includeInternal', () => {
    const def = extractDocs(root);
    const internalMod = def.find((m) => m.path === 'internal.ts');
    expect(internalMod?.exports.find((e) => e.name === 'helper')).toBeUndefined();

    const incl = extractDocs(root, { includeInternal: true });
    const internalMod2 = incl.find((m) => m.path === 'internal.ts');
    expect(internalMod2?.exports.find((e) => e.name === 'helper')).toBeTruthy();
    // notExported (sin export) también aparece cuando includeInternal=true
    expect(internalMod2?.exports.find((e) => e.name === 'notExported')).toBeTruthy();
  });

  it('ignora *.test.ts, carpetas tests/ y node_modules/', () => {
    const modules = extractDocs(root);
    const paths = modules.map((m) => m.path);
    expect(paths).not.toContain('foo.test.ts');
    expect(paths.every((p) => !p.startsWith('tests/'))).toBe(true);
    expect(paths.every((p) => !p.includes('node_modules'))).toBe(true);
  });

  it('captura description a nivel de archivo via @fileoverview', () => {
    const modules = extractDocs(root);
    const nested = modules.find((m) => m.path === 'nested/sub.ts');
    expect(nested?.description).toContain('nested.sub');
  });
});

// --- renderers ----------------------------------------------

describe('renderers', () => {
  let root: string;
  beforeAll(() => {
    root = buildFixtureRoot();
  });
  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('renderMarkdown produce un .md por módulo y un index.md', () => {
    const modules = extractDocs(root);
    const files = renderMarkdown(modules);
    expect(files.has('index.md')).toBe(true);
    expect(files.has('math.md')).toBe(true);
    expect(files.has('shapes.md')).toBe(true);
    expect(files.has('nested/sub.md')).toBe(true);
    const mathMd = files.get('math.md') ?? '';
    expect(mathMd).toContain('## `sum`');
    expect(mathMd).toContain('### Parameters');
    expect(mathMd).toContain('### Returns');
    expect(mathMd).toContain('### Examples');
    // Deprecated señalizado
    expect(mathMd).toContain('DEPRECATED');
  });

  it('renderIndex conteo de módulos y símbolos', () => {
    const modules = extractDocs(root);
    const idx = renderIndex(modules);
    expect(idx).toContain('# API Reference');
    expect(idx).toMatch(/\*\*Modules\*\*:\s+\d+/);
    expect(idx).toMatch(/\*\*Symbols\*\*:\s+\d+/);
    expect(idx).toContain('## Modules');
    // Tabla por kind presente
    expect(idx).toContain('## Symbols by kind');
    expect(idx).toContain('| Function |');
  });

  it('renderJSON parsea de vuelta sin pérdida', () => {
    const modules = extractDocs(root);
    const raw = renderJSON(modules);
    const parsed = JSON.parse(raw) as { modules: typeof modules };
    expect(parsed.modules.length).toBe(modules.length);
    expect(parsed.modules.map((m) => m.path)).toEqual(modules.map((m) => m.path));
  });

  it('toMarkdownPath cambia .ts → .md preservando subpath', () => {
    expect(toMarkdownPath('a/b/c.ts')).toBe('a/b/c.md');
    expect(toMarkdownPath('foo.ts')).toBe('foo.md');
  });
});

// --- generateDocs end-to-end --------------------------------

describe('generateDocs', () => {
  let root: string;
  beforeAll(() => {
    root = buildFixtureRoot();
  });
  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('genera archivos markdown a outputDir y reporta warnings de symbols sin desc', async () => {
    const out = mkdtemp('doc-out-');
    try {
      const res = await generateDocs({ rootDir: root, outputDir: out, template: 'markdown' });
      expect(res.filesWritten.length).toBeGreaterThan(0);
      // index + por lo menos uno
      const filenames = res.filesWritten.map((p) => path.basename(p)).sort();
      expect(filenames).toContain('index.md');
      expect(filenames).toContain('math.md');
      // warning sobre `undocumented`
      expect(res.warnings.some((w) => w.includes('undocumented'))).toBe(true);
      const mathContent = fs.readFileSync(path.join(out, 'math.md'), 'utf8');
      expect(mathContent).toContain('Suma dos enteros');
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  it('genera api.json cuando template=json', async () => {
    const out = mkdtemp('doc-out-');
    try {
      const res = await generateDocs({ rootDir: root, outputDir: out, template: 'json' });
      const jsonFile = res.filesWritten.find((f) => f.endsWith('api.json'));
      expect(jsonFile).toBeTruthy();
      const content = fs.readFileSync(jsonFile as string, 'utf8');
      const parsed = JSON.parse(content) as { modules: unknown[] };
      expect(Array.isArray(parsed.modules)).toBe(true);
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  it('genera index.html cuando template=html-minimal', async () => {
    const out = mkdtemp('doc-out-');
    try {
      const res = await generateDocs({ rootDir: root, outputDir: out, template: 'html-minimal' });
      expect(res.filesWritten.some((f) => f.endsWith('index.html'))).toBe(true);
      const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('API Reference');
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });
});
