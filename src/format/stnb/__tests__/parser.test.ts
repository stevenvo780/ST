import { describe, it, expect } from 'vitest';
import { parseNotebook, ParseError } from '../parser';
import type { Notebook } from '../types';

const VALID_NOTEBOOK: Notebook = {
  version: '1.0',
  kernel: 'st-lang',
  kernelVersion: '4.14',
  metadata: {
    title: 'Test',
    profile: 'classical.propositional',
    createdAt: '2026-05-18T00:00:00.000Z',
    updatedAt: '2026-05-18T00:00:00.000Z',
  },
  cells: [],
};

function makeJson(overrides: Partial<Record<string, unknown>> = {}): string {
  return JSON.stringify({ ...VALID_NOTEBOOK, ...overrides });
}

describe('parseNotebook', () => {
  it('parses a minimal valid notebook', () => {
    const nb = parseNotebook(makeJson());
    expect(nb.version).toBe('1.0');
    expect(nb.kernel).toBe('st-lang');
    expect(nb.cells).toHaveLength(0);
  });

  it('parses notebook with markdown and code cells', () => {
    const json = JSON.stringify({
      ...VALID_NOTEBOOK,
      cells: [
        { id: 'md-1', type: 'markdown', source: '# Hello' },
        { id: 'code-1', type: 'code', source: 'check valid P -> P', outputs: [] },
      ],
    });
    const nb = parseNotebook(json);
    expect(nb.cells).toHaveLength(2);
    expect(nb.cells[0]!.type).toBe('markdown');
    expect(nb.cells[1]!.type).toBe('code');
  });

  it('parses code cell with outputs', () => {
    const json = JSON.stringify({
      ...VALID_NOTEBOOK,
      cells: [
        {
          id: 'c1',
          type: 'code',
          source: 'check valid P',
          outputs: [
            {
              type: 'result',
              data: { valid: true, stdout: 'ok' },
              metadata: { executionTime: 10 },
            },
          ],
        },
      ],
    });
    const nb = parseNotebook(json);
    const cell = nb.cells[0];
    expect(cell?.type).toBe('code');
    if (cell?.type === 'code') {
      expect(cell.outputs).toHaveLength(1);
      expect(cell.outputs[0]!.type).toBe('result');
      expect(cell.outputs[0]!.metadata?.executionTime).toBe(10);
    }
  });

  it('throws ParseError for invalid JSON', () => {
    expect(() => parseNotebook('not json')).toThrow(ParseError);
    expect(() => parseNotebook('not json')).toThrow('Invalid JSON');
  });

  it('throws ParseError when version is missing', () => {
    const json = makeJson({ version: undefined });
    expect(() => parseNotebook(json)).toThrow(ParseError);
  });

  it('throws ParseError for unsupported version', () => {
    expect(() => parseNotebook(makeJson({ version: '2.0' }))).toThrow(ParseError);
    expect(() => parseNotebook(makeJson({ version: '2.0' }))).toThrow(
      'Unsupported notebook version'
    );
  });

  it('throws ParseError for invalid cell type', () => {
    const json = JSON.stringify({
      ...VALID_NOTEBOOK,
      cells: [{ id: 'x', type: 'invalid', source: '' }],
    });
    expect(() => parseNotebook(json)).toThrow(ParseError);
    expect(() => parseNotebook(json)).toThrow('invalid type');
  });

  it('parses code cell with per-cell profile override', () => {
    const json = JSON.stringify({
      ...VALID_NOTEBOOK,
      cells: [
        {
          id: 'c1',
          type: 'code',
          source: 'check valid []P -> P',
          profile: 'modal.s4',
          outputs: [],
        },
      ],
    });
    const nb = parseNotebook(json);
    const cell = nb.cells[0];
    if (cell?.type === 'code') {
      expect(cell.profile).toBe('modal.s4');
    }
  });

  it('preserves extra metadata fields', () => {
    const json = JSON.stringify({
      ...VALID_NOTEBOOK,
      metadata: {
        ...VALID_NOTEBOOK.metadata,
        customField: 'custom-value',
        tags: ['logic', 'intro'],
      },
    });
    const nb = parseNotebook(json);
    expect((nb.metadata as { customField?: string }).customField).toBe('custom-value');
  });
});
