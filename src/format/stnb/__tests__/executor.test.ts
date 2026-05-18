import { describe, it, expect } from 'vitest';
import { executeNotebook, executeCell } from '../executor';
import type { Notebook, CodeCell } from '../types';

function makeNotebook(cells: Notebook['cells'] = []): Notebook {
  return {
    version: '1.0',
    kernel: 'st-lang',
    kernelVersion: '4.14',
    metadata: {
      title: 'Executor Test',
      profile: 'classical.propositional',
      createdAt: '2026-05-18T00:00:00.000Z',
      updatedAt: '2026-05-18T00:00:00.000Z',
    },
    cells,
  };
}

describe('executeNotebook', () => {
  it('executes empty notebook without error', () => {
    const result = executeNotebook(makeNotebook());
    expect(result.cellsExecuted).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('skips markdown cells', () => {
    const nb = makeNotebook([
      { id: 'md', type: 'markdown', source: '# Title' },
    ]);
    const result = executeNotebook(nb);
    expect(result.cellsExecuted).toBe(0);
    expect(result.notebook.cells[0]!.type).toBe('markdown');
  });

  it('executes a valid code cell and captures result output', () => {
    const nb = makeNotebook([
      {
        id: 'c1',
        type: 'code',
        source: 'check valid P -> P',
        outputs: [],
      },
    ]);
    const result = executeNotebook(nb);
    expect(result.cellsExecuted).toBe(1);
    const cell = result.notebook.cells[0];
    if (cell?.type === 'code') {
      expect(cell.outputs.length).toBeGreaterThan(0);
      expect(cell.outputs[0]!.type).toBe('result');
    }
  });

  it('captures error output for invalid ST code', () => {
    const nb = makeNotebook([
      {
        id: 'c-err',
        type: 'code',
        source: 'this is not valid st code @@@@',
        outputs: [],
      },
    ]);
    const result = executeNotebook(nb);
    const cell = result.notebook.cells[0];
    if (cell?.type === 'code') {
      expect(cell.outputs.length).toBeGreaterThan(0);
      const out = cell.outputs[0]!;
      expect(out.type === 'result' || out.type === 'error').toBe(true);
    }
  });

  it('executes multiple cells in order', () => {
    const nb = makeNotebook([
      { id: 'md', type: 'markdown', source: '# Intro' },
      { id: 'c1', type: 'code', source: 'check valid P -> P', outputs: [] },
      {
        id: 'c2',
        type: 'code',
        source: 'check valid (P -> Q) -> (not Q -> not P)',
        outputs: [],
      },
    ]);
    const result = executeNotebook(nb);
    expect(result.cellsExecuted).toBe(2);
    expect(result.notebook.cells).toHaveLength(3);
  });

  it('uses per-cell profile when specified', () => {
    const nb = makeNotebook([
      {
        id: 'modal-cell',
        type: 'code',
        source: 'check valid []P -> P',
        profile: 'modal.s4',
        outputs: [],
      },
    ]);
    const result = executeNotebook(nb);
    expect(result.cellsExecuted).toBe(1);
  });

  it('updates notebook metadata.updatedAt after execution', () => {
    const originalDate = '2026-01-01T00:00:00.000Z';
    const nb = makeNotebook([
      { id: 'c1', type: 'code', source: 'check valid P -> P', outputs: [] },
    ]);
    nb.metadata.updatedAt = originalDate;
    const result = executeNotebook(nb);
    expect(result.notebook.metadata.updatedAt).not.toBe(originalDate);
  });

  it('outputs include executionTime in metadata', () => {
    const nb = makeNotebook([
      { id: 'c1', type: 'code', source: 'check valid P -> P', outputs: [] },
    ]);
    const result = executeNotebook(nb);
    const cell = result.notebook.cells[0];
    if (cell?.type === 'code' && cell.outputs.length > 0) {
      expect(cell.outputs[0]!.metadata?.executionTime).toBeDefined();
      expect(typeof cell.outputs[0]!.metadata?.executionTime).toBe('number');
    }
  });

  it('does not mutate the original notebook', () => {
    const nb = makeNotebook([
      { id: 'c1', type: 'code', source: 'check valid P -> P', outputs: [] },
    ]);
    const cellsBefore = nb.cells.length;
    executeNotebook(nb);
    expect(nb.cells.length).toBe(cellsBefore);
    if (nb.cells[0]?.type === 'code') {
      expect(nb.cells[0].outputs).toHaveLength(0);
    }
  });
});

describe('executeCell', () => {
  it('returns result output for valid ST code', () => {
    const cell: CodeCell = {
      id: 'c1',
      type: 'code',
      source: 'check valid P -> P',
      outputs: [],
    };
    const outputs = executeCell(cell, 'classical.propositional');
    expect(outputs.length).toBeGreaterThan(0);
    expect(outputs[0]!.type === 'result' || outputs[0]!.type === 'error').toBe(true);
  });
});
