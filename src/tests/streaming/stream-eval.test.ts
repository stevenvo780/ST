// ============================================================
// ST Streaming Tests — streamEval() con AsyncIterable y AbortSignal
// ============================================================

import { describe, it, expect } from 'vitest';
import { streamEval } from '../../runtime/streaming/stream-eval';
import type { StreamEvent } from '../../runtime/streaming/types';
import type { Formula } from '../../types';

// ── Helpers de fórmula ────────────────────────────────────────

function atom(name: string): Formula {
  return { kind: 'atom', name };
}

function implies(a: Formula, b: Formula): Formula {
  return { kind: 'implies', args: [a, b] };
}

function and(a: Formula, b: Formula): Formula {
  return { kind: 'and', args: [a, b] };
}

function not(f: Formula): Formula {
  return { kind: 'not', args: [f] };
}

/** Consume todos los eventos del iterable y los devuelve en orden. */
async function collectEvents(iter: AsyncIterable<StreamEvent>): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const ev of iter) {
    events.push(ev);
  }
  return events;
}

// ── Suite principal ───────────────────────────────────────────

describe('streamEval', () => {
  it('emite start → ... → done en orden', async () => {
    const formula = implies(atom('P'), atom('P'));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const kinds = events.map((e) => e.kind);

    expect(kinds[0]).toBe('start');
    expect(kinds[kinds.length - 1]).toBe('done');
    expect(kinds.includes('error')).toBe(false);
  });

  it('el evento start incluye la representación string de la fórmula', async () => {
    const formula = implies(atom('P'), atom('P'));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const startEvt = events.find((e) => e.kind === 'start');
    expect(startEvt).toBeDefined();
    if (startEvt?.kind === 'start') {
      expect(typeof startEvt.formula).toBe('string');
      expect(startEvt.formula.length).toBeGreaterThan(0);
    }
  });

  it('el evento done contiene el resultado final y totalMs >= 0', async () => {
    const formula = implies(atom('P'), atom('P'));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const doneEvt = events.find((e) => e.kind === 'done');
    expect(doneEvt).toBeDefined();
    if (doneEvt?.kind === 'done') {
      expect(doneEvt.result).toBeDefined();
      expect(typeof doneEvt.result.status).toBe('string');
      expect(doneEvt.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('emite eventos subproof para fórmulas con sub-nodos', async () => {
    const formula = and(implies(atom('P'), atom('Q')), atom('P'));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const subproofs = events.filter((e) => e.kind === 'subproof');
    expect(subproofs.length).toBeGreaterThan(0);
    for (const ev of subproofs) {
      if (ev.kind === 'subproof') {
        expect(typeof ev.node).toBe('string');
        expect(['T', 'F', 'both', 'neither', 'unknown']).toContain(ev.result);
      }
    }
  });

  it('emite eventos progress con ratio en [0, 1]', async () => {
    const formula = and(implies(atom('A'), atom('B')), implies(atom('B'), atom('C')));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const progresses = events.filter((e) => e.kind === 'progress');
    expect(progresses.length).toBeGreaterThan(0);
    for (const ev of progresses) {
      if (ev.kind === 'progress') {
        expect(ev.ratio).toBeGreaterThanOrEqual(0);
        expect(ev.ratio).toBeLessThanOrEqual(1);
      }
    }
  });

  it('emite evento partial antes de done', async () => {
    const formula = implies(atom('P'), atom('P'));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const partialIdx = events.findIndex((e) => e.kind === 'partial');
    const doneIdx = events.findIndex((e) => e.kind === 'done');

    expect(partialIdx).toBeGreaterThanOrEqual(0);
    expect(doneIdx).toBeGreaterThanOrEqual(0);
    expect(partialIdx).toBeLessThan(doneIdx);
  });

  it('el evento partial contiene un resultado coherente con done', async () => {
    const formula = implies(atom('P'), atom('P'));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const partialEvt = events.find((e) => e.kind === 'partial');
    const doneEvt = events.find((e) => e.kind === 'done');

    if (partialEvt?.kind === 'partial' && doneEvt?.kind === 'done') {
      expect(partialEvt.result.status).toBe(doneEvt.result.status);
    }
  });

  it('AbortSignal cancela: emite evento error y termina el iterable', async () => {
    const controller = new AbortController();
    const formula = and(
      and(implies(atom('P'), atom('Q')), implies(atom('Q'), atom('R'))),
      implies(atom('R'), atom('S')),
    );

    controller.abort();

    const events = await collectEvents(
      streamEval(formula, 'classical.propositional', {
        abortSignal: controller.signal,
      }),
    );

    const errorEvt = events.find((e) => e.kind === 'error');
    expect(errorEvt).toBeDefined();
    if (errorEvt?.kind === 'error') {
      expect(errorEvt.error).toContain('cancelad');
    }

    const doneEvt = events.find((e) => e.kind === 'done');
    expect(doneEvt).toBeUndefined();
  });

  it('perfil desconocido emite error (no throw)', async () => {
    const formula = atom('P');
    const events = await collectEvents(streamEval(formula, 'nonexistent.profile'));

    const errorEvt = events.find((e) => e.kind === 'error');
    expect(errorEvt).toBeDefined();
    if (errorEvt?.kind === 'error') {
      expect(errorEvt.error).toContain('nonexistent.profile');
    }

    expect(events.find((e) => e.kind === 'done')).toBeUndefined();
  });

  it('error en evaluación produce evento error, no throw', async () => {
    const formula = atom('P');
    const events: StreamEvent[] = [];
    let threw = false;

    try {
      for await (const ev of streamEval(formula, 'nonexistent.profile')) {
        events.push(ev);
      }
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(events.some((e) => e.kind === 'error')).toBe(true);
  });

  it('funciona con perfil paraconsistent.belnap', async () => {
    const formula = implies(atom('P'), atom('P'));
    const events = await collectEvents(streamEval(formula, 'paraconsistent.belnap'));

    const kinds = events.map((e) => e.kind);
    expect(kinds[0]).toBe('start');
    expect(kinds[kinds.length - 1]).toBe('done');
  });

  it('funciona con fórmula atómica simple (sin sub-nodos)', async () => {
    const formula = atom('P');
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const kinds = events.map((e) => e.kind);
    expect(kinds[0]).toBe('start');
    expect(kinds[kinds.length - 1]).toBe('done');
    expect(kinds.includes('error')).toBe(false);
  });

  it('start siempre es el primer evento', async () => {
    const formula = not(and(atom('P'), not(atom('P'))));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    expect(events.length).toBeGreaterThan(0);
    expect(events[0]?.kind).toBe('start');
  });

  it('done siempre es el último evento (sin cancelación)', async () => {
    const formula = not(and(atom('P'), not(atom('P'))));
    const events = await collectEvents(streamEval(formula, 'classical.propositional'));

    const last = events[events.length - 1];
    expect(last?.kind).toBe('done');
  });
});
