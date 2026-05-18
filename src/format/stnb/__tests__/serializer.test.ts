import { describe, it, expect } from 'vitest';
import { serializeNotebook, serializeNotebookCompact } from '../serializer';
import type { Notebook } from '../types';

const BASE_NOTEBOOK: Notebook = {
  version: '1.0',
  kernel: 'st-lang',
  kernelVersion: '4.14',
  metadata: {
    title: 'Serializer Test',
    author: 'Test',
    profile: 'classical.propositional',
    createdAt: '2026-05-18T00:00:00.000Z',
    updatedAt: '2026-05-18T00:00:00.000Z',
  },
  cells: [
    { id: 'md-1', type: 'markdown', source: '# Title' },
    {
      id: 'code-1',
      type: 'code',
      source: 'check valid P -> P',
      outputs: [],
    },
  ],
};

describe('serializeNotebook', () => {
  it('produces valid JSON', () => {
    const json = serializeNotebook(BASE_NOTEBOOK);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('uses 2-space indentation', () => {
    const json = serializeNotebook(BASE_NOTEBOOK);
    expect(json).toContain('  "version"');
  });

  it('preserves all top-level fields', () => {
    const json = serializeNotebook(BASE_NOTEBOOK);
    const parsed = JSON.parse(json) as Notebook;
    expect(parsed.version).toBe('1.0');
    expect(parsed.kernel).toBe('st-lang');
    expect(parsed.kernelVersion).toBe('4.14');
  });

  it('preserves cells array', () => {
    const json = serializeNotebook(BASE_NOTEBOOK);
    const parsed = JSON.parse(json) as Notebook;
    expect(parsed.cells).toHaveLength(2);
  });

  it('preserves metadata fields', () => {
    const json = serializeNotebook(BASE_NOTEBOOK);
    const parsed = JSON.parse(json) as Notebook;
    expect(parsed.metadata.title).toBe('Serializer Test');
    expect(parsed.metadata.author).toBe('Test');
  });

  it('produces different output from compact', () => {
    const pretty = serializeNotebook(BASE_NOTEBOOK);
    const compact = serializeNotebookCompact(BASE_NOTEBOOK);
    expect(pretty.length).toBeGreaterThan(compact.length);
    expect(compact).not.toContain('\n');
  });
});
