import { describe, it, expect } from 'vitest';
import { renderHTML } from '../renderer-html';
import { renderMarkdown } from '../renderer-markdown';
import type { Notebook } from '../types';

const DEMO_NOTEBOOK: Notebook = {
  version: '1.0',
  kernel: 'st-lang',
  kernelVersion: '4.14',
  metadata: {
    title: 'Renderer Demo',
    author: 'Test Author',
    profile: 'classical.propositional',
    createdAt: '2026-05-18T00:00:00.000Z',
    updatedAt: '2026-05-18T00:00:00.000Z',
  },
  cells: [
    {
      id: 'md-1',
      type: 'markdown',
      source: '# Intro\n\nEsta es una prueba $p \\to p$',
    },
    {
      id: 'code-1',
      type: 'code',
      source: 'check valid P -> P',
      outputs: [
        {
          type: 'result',
          data: { valid: true, stdout: '✓ valid' },
          metadata: { executionTime: 5 },
        },
      ],
    },
    {
      id: 'code-err',
      type: 'code',
      source: 'invalid',
      outputs: [
        {
          type: 'error',
          data: { valid: false, message: 'Syntax error' },
          metadata: { executionTime: 2 },
        },
      ],
    },
  ],
};

describe('renderHTML', () => {
  it('produces a valid HTML document', () => {
    const html = renderHTML(DEMO_NOTEBOOK);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('includes the notebook title', () => {
    const html = renderHTML(DEMO_NOTEBOOK);
    expect(html).toContain('Renderer Demo');
  });

  it('includes KaTeX script tags', () => {
    const html = renderHTML(DEMO_NOTEBOOK);
    expect(html).toContain('katex');
  });

  it('renders markdown cells', () => {
    const html = renderHTML(DEMO_NOTEBOOK);
    expect(html).toContain('cell-markdown');
  });

  it('renders code cells with source', () => {
    const html = renderHTML(DEMO_NOTEBOOK);
    expect(html).toContain('cell-code');
    expect(html).toContain('check valid P -&gt; P');
  });

  it('marks successful outputs with ok class', () => {
    const html = renderHTML(DEMO_NOTEBOOK);
    expect(html).toContain('output-ok');
  });

  it('marks error outputs with err class', () => {
    const html = renderHTML(DEMO_NOTEBOOK);
    expect(html).toContain('output-err');
  });
});

describe('renderMarkdown', () => {
  it('starts with the notebook title', () => {
    const md = renderMarkdown(DEMO_NOTEBOOK);
    expect(md.startsWith('# Renderer Demo')).toBe(true);
  });

  it('includes kernel metadata', () => {
    const md = renderMarkdown(DEMO_NOTEBOOK);
    expect(md).toContain('st-lang');
  });

  it('renders code cells as fenced st blocks', () => {
    const md = renderMarkdown(DEMO_NOTEBOOK);
    expect(md).toContain('```st');
    expect(md).toContain('check valid P -> P');
  });

  it('renders outputs as table or code block', () => {
    const md = renderMarkdown(DEMO_NOTEBOOK);
    expect(md).toContain('| Estado |');
  });

  it('includes markdown cell content verbatim', () => {
    const md = renderMarkdown(DEMO_NOTEBOOK);
    expect(md).toContain('# Intro');
  });

  it('renders error outputs with error marker', () => {
    const md = renderMarkdown(DEMO_NOTEBOOK);
    expect(md).toContain('Error');
  });
});
