import { describe, it, expect } from 'vitest';
import { parseNotebook } from '../parser';
import { serializeNotebook } from '../serializer';
import type { Notebook } from '../types';

function roundtrip(nb: Notebook): Notebook {
  return parseNotebook(serializeNotebook(nb));
}

const FULL_NOTEBOOK: Notebook = {
  version: '1.0',
  kernel: 'st-lang',
  kernelVersion: '4.14',
  metadata: {
    title: 'Roundtrip Test',
    author: 'Test Author',
    profile: 'classical.propositional',
    createdAt: '2026-05-18T00:00:00.000Z',
    updatedAt: '2026-05-18T00:00:00.000Z',
  },
  cells: [
    { id: 'md-1', type: 'markdown', source: '# Hello $p \\to p$' },
    {
      id: 'code-1',
      type: 'code',
      source: 'check valid P -> P',
      outputs: [
        {
          type: 'result',
          data: { valid: true, stdout: '✓ valid' },
          metadata: { executionTime: 10 },
        },
      ],
    },
    {
      id: 'code-modal',
      type: 'code',
      source: 'check valid []P -> P',
      profile: 'modal.s4',
      outputs: [],
    },
  ],
};

describe('roundtrip parse → serialize → parse', () => {
  it('produces structurally identical notebooks', () => {
    const rt = roundtrip(FULL_NOTEBOOK);
    expect(rt.version).toBe(FULL_NOTEBOOK.version);
    expect(rt.kernel).toBe(FULL_NOTEBOOK.kernel);
    expect(rt.kernelVersion).toBe(FULL_NOTEBOOK.kernelVersion);
    expect(rt.metadata.title).toBe(FULL_NOTEBOOK.metadata.title);
    expect(rt.cells).toHaveLength(FULL_NOTEBOOK.cells.length);
  });

  it('preserves cell ids and types', () => {
    const rt = roundtrip(FULL_NOTEBOOK);
    for (let i = 0; i < FULL_NOTEBOOK.cells.length; i++) {
      expect(rt.cells[i]!.id).toBe(FULL_NOTEBOOK.cells[i]!.id);
      expect(rt.cells[i]!.type).toBe(FULL_NOTEBOOK.cells[i]!.type);
    }
  });

  it('is idempotent: double roundtrip equals single roundtrip', () => {
    const once = serializeNotebook(roundtrip(FULL_NOTEBOOK));
    const twice = serializeNotebook(roundtrip(roundtrip(FULL_NOTEBOOK)));
    expect(once).toBe(twice);
  });

  it('preserves code cell outputs through roundtrip', () => {
    const rt = roundtrip(FULL_NOTEBOOK);
    const codeCell = rt.cells.find((c) => c.id === 'code-1');
    expect(codeCell?.type).toBe('code');
    if (codeCell?.type === 'code') {
      expect(codeCell.outputs).toHaveLength(1);
      expect(codeCell.outputs[0]!.type).toBe('result');
      expect(codeCell.outputs[0]!.metadata?.executionTime).toBe(10);
    }
  });

  it('handles empty notebooks in roundtrip', () => {
    const empty: Notebook = {
      version: '1.0',
      kernel: 'st-lang',
      kernelVersion: '4.14',
      metadata: {
        title: 'Empty',
        profile: 'classical.propositional',
        createdAt: '2026-05-18T00:00:00.000Z',
        updatedAt: '2026-05-18T00:00:00.000Z',
      },
      cells: [],
    };
    const rt = roundtrip(empty);
    expect(rt.cells).toHaveLength(0);
  });
});
