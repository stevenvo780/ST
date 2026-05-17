// ============================================================
// Tests: ProvenanceLedger
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  ProvenanceLedger,
  auditTheorem,
  provenanceToCertificate,
} from '../../../tooling/provenance';
import type { ProvenanceMetadata, ProvenanceNode } from '../../../tooling/provenance';

function meta(overrides: Partial<ProvenanceMetadata> = {}): ProvenanceMetadata {
  return {
    provedAt: '2026-05-17T00:00:00.000Z',
    provedBy: 'tester',
    profile: 'classical.propositional',
    tool: 'manual',
    ...overrides,
  };
}

describe('ProvenanceLedger', () => {
  it('añade un axioma + lemma + theorem y resuelve dependencias', () => {
    const ledger = new ProvenanceLedger();
    const ax = ledger.add({
      statement: 'P -> (Q -> P)',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const lem = ledger.add({
      statement: 'P -> P',
      kind: 'lemma',
      dependencies: [ax],
      metadata: meta(),
      trust: 'verified',
    });
    const th = ledger.add({
      statement: 'P -> (P or Q)',
      kind: 'theorem',
      dependencies: [ax, lem],
      metadata: meta(),
      trust: 'verified',
    });

    expect(ledger.totalNodes()).toBe(3);
    expect(ledger.axiomCount()).toBe(1);

    const got = ledger.get(th);
    expect(got).toBeDefined();
    expect(got!.kind).toBe('theorem');
    expect(got!.dependencies).toEqual([ax, lem]);
  });

  it('los ids son determinísticos: mismo statement + deps → mismo id', () => {
    const a = new ProvenanceLedger();
    const b = new ProvenanceLedger();
    const idA = a.add({
      statement: 'P -> P',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const idB = b.add({
      statement: '  P  ->  P  ', // whitespace distinto, mismo statement canónico
      kind: 'axiom',
      dependencies: [],
      metadata: meta({ provedBy: 'otro' }),
      trust: 'admitted',
    });
    expect(idA).toBe(idB);
  });

  it('rechaza axiomas con dependencias y dependencias inexistentes', () => {
    const ledger = new ProvenanceLedger();
    expect(() =>
      ledger.add({
        statement: 'A',
        kind: 'axiom',
        dependencies: ['missing'],
        metadata: meta(),
        trust: 'verified',
      }),
    ).toThrow(/no puede tener dependencias/);

    expect(() =>
      ledger.add({
        statement: 'B',
        kind: 'lemma',
        dependencies: ['ghost-id'],
        metadata: meta(),
        trust: 'verified',
      }),
    ).toThrow(/dependencia inexistente/);
  });

  it('dependencyChain devuelve cierre en orden topológico (deps antes que el nodo)', () => {
    const ledger = new ProvenanceLedger();
    const a = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const b = ledger.add({
      statement: 'B',
      kind: 'lemma',
      dependencies: [a],
      metadata: meta(),
      trust: 'verified',
    });
    const c = ledger.add({
      statement: 'C',
      kind: 'theorem',
      dependencies: [a, b],
      metadata: meta(),
      trust: 'verified',
    });

    const chain = ledger.dependencyChain(c);
    const ids = chain.map((n) => n.id);
    expect(ids).toContain(a);
    expect(ids).toContain(b);
    expect(ids).toContain(c);
    // a aparece antes que b y c; b antes que c
    expect(ids.indexOf(a)).toBeLessThan(ids.indexOf(b));
    expect(ids.indexOf(b)).toBeLessThan(ids.indexOf(c));
  });

  it('ancestors y descendants son inversos sobre el grafo', () => {
    const ledger = new ProvenanceLedger();
    const a = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const b = ledger.add({
      statement: 'B',
      kind: 'lemma',
      dependencies: [a],
      metadata: meta(),
      trust: 'verified',
    });
    const c = ledger.add({
      statement: 'C',
      kind: 'theorem',
      dependencies: [b],
      metadata: meta(),
      trust: 'verified',
    });

    expect(ledger.ancestors(c)).toEqual(new Set([a, b]));
    expect(ledger.ancestors(a)).toEqual(new Set());
    expect(ledger.descendants(a)).toEqual(new Set([b, c]));
    expect(ledger.descendants(c)).toEqual(new Set());
  });

  it('axiomsUsed calcula el cierre y descarta lemas/teoremas', () => {
    const ledger = new ProvenanceLedger();
    const ax1 = ledger.add({
      statement: 'AX1',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const ax2 = ledger.add({
      statement: 'AX2',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const lem = ledger.add({
      statement: 'L',
      kind: 'lemma',
      dependencies: [ax1],
      metadata: meta(),
      trust: 'verified',
    });
    const th = ledger.add({
      statement: 'T',
      kind: 'theorem',
      dependencies: [lem, ax2],
      metadata: meta(),
      trust: 'verified',
    });
    expect(ledger.axiomsUsed(th)).toEqual(new Set([ax1, ax2]));
    expect(ledger.axiomsUsed(lem)).toEqual(new Set([ax1]));
  });

  it('isFullyVerified=true sólo si todo el cierre es verified', () => {
    const ledger = new ProvenanceLedger();
    const ax = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const lemOk = ledger.add({
      statement: 'L1',
      kind: 'lemma',
      dependencies: [ax],
      metadata: meta(),
      trust: 'verified',
    });
    const lemAdm = ledger.add({
      statement: 'L2',
      kind: 'lemma',
      dependencies: [ax],
      metadata: meta(),
      trust: 'admitted',
    });
    const thOk = ledger.add({
      statement: 'T1',
      kind: 'theorem',
      dependencies: [lemOk],
      metadata: meta(),
      trust: 'verified',
    });
    const thBad = ledger.add({
      statement: 'T2',
      kind: 'theorem',
      dependencies: [lemAdm],
      metadata: meta(),
      trust: 'verified',
    });

    expect(ledger.isFullyVerified(thOk)).toBe(true);
    expect(ledger.isFullyVerified(thBad)).toBe(false);
    expect(ledger.isFullyVerified('inexistente')).toBe(false);
  });

  it('trustChain cuenta verified/admitted/external en el cierre', () => {
    const ledger = new ProvenanceLedger();
    const ax = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const ext = ledger.add({
      statement: 'EXT',
      kind: 'lemma',
      dependencies: [ax],
      metadata: meta({ tool: 'lean4' }),
      trust: 'external',
    });
    const adm = ledger.add({
      statement: 'ADM',
      kind: 'lemma',
      dependencies: [ax],
      metadata: meta(),
      trust: 'admitted',
    });
    const th = ledger.add({
      statement: 'T',
      kind: 'theorem',
      dependencies: [ext, adm],
      metadata: meta(),
      trust: 'verified',
    });
    expect(ledger.trustChain(th)).toEqual({ verified: 2, admitted: 1, external: 1 });
  });

  it('findCircular devuelve [] en grafo construido vía add() (estructuralmente acíclico)', () => {
    const ledger = new ProvenanceLedger();
    const a = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const b = ledger.add({
      statement: 'B',
      kind: 'lemma',
      dependencies: [a],
      metadata: meta(),
      trust: 'verified',
    });
    ledger.add({
      statement: 'C',
      kind: 'theorem',
      dependencies: [a, b],
      metadata: meta(),
      trust: 'verified',
    });
    expect(ledger.findCircular()).toEqual([]);
  });

  it('findCircular detecta ciclo introducido por import malicioso', () => {
    const ledger = new ProvenanceLedger();
    // Construimos un JSON con ciclo a mano: x → y → x.
    const x: ProvenanceNode = {
      id: 'x',
      statement: 'X',
      kind: 'lemma',
      dependencies: ['y'],
      metadata: meta(),
      trust: 'verified',
    };
    const y: ProvenanceNode = {
      id: 'y',
      statement: 'Y',
      kind: 'lemma',
      dependencies: ['x'],
      metadata: meta(),
      trust: 'verified',
    };
    const evilJson = JSON.stringify({ version: '1.0', nodes: [x, y] });
    ledger.importLedger(evilJson);
    const cycles = ledger.findCircular();
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('longestChain mide la cadena de dependencias más profunda', () => {
    const ledger = new ProvenanceLedger();
    const a = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const b = ledger.add({
      statement: 'B',
      kind: 'lemma',
      dependencies: [a],
      metadata: meta(),
      trust: 'verified',
    });
    const c = ledger.add({
      statement: 'C',
      kind: 'lemma',
      dependencies: [b],
      metadata: meta(),
      trust: 'verified',
    });
    ledger.add({
      statement: 'D',
      kind: 'theorem',
      dependencies: [c],
      metadata: meta(),
      trust: 'verified',
    });
    expect(ledger.longestChain()).toBe(4);
  });

  it('round-trip export/import preserva el ledger', async () => {
    const ledger = new ProvenanceLedger();
    const ax = ledger.add({
      statement: 'AX',
      kind: 'axiom',
      dependencies: [],
      metadata: meta({ tool: 'manual', durationMs: 12 }),
      trust: 'verified',
    });
    ledger.add({
      statement: 'T',
      kind: 'theorem',
      dependencies: [ax],
      metadata: meta({ tool: 'st-prover@4.10.0', proofSize: 3 }),
      trust: 'verified',
      proof: { steps: ['axiom', 'qed'] },
    });

    const json = ledger.exportLedger();
    const restored = new ProvenanceLedger();
    restored.importLedger(json);

    expect(restored.totalNodes()).toBe(2);
    expect(await restored.hashLedger()).toBe(await ledger.hashLedger());
    expect(restored.exportLedger()).toBe(ledger.exportLedger());
  });

  it('hashLedger es determinístico e ignora orden de inserción', async () => {
    const a = new ProvenanceLedger();
    const b = new ProvenanceLedger();

    const idA1 = a.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const idA2 = a.add({
      statement: 'B',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    a.add({
      statement: 'C',
      kind: 'lemma',
      dependencies: [idA1, idA2],
      metadata: meta(),
      trust: 'verified',
    });

    // En `b` insertamos en otro orden
    const idB2 = b.add({
      statement: 'B',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const idB1 = b.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    b.add({
      statement: 'C',
      kind: 'lemma',
      dependencies: [idB1, idB2],
      metadata: meta(),
      trust: 'verified',
    });

    expect(await a.hashLedger()).toBe(await b.hashLedger());
  });

  it('auditTheorem clasifica risk=low cuando todo es verified', () => {
    const ledger = new ProvenanceLedger();
    const ax = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const th = ledger.add({
      statement: 'T',
      kind: 'theorem',
      dependencies: [ax],
      metadata: meta(),
      trust: 'verified',
    });
    const report = auditTheorem(th, ledger);
    expect(report.rootTheorem).toBe('T');
    expect(report.trustClassification.verified).toBe(2);
    expect(report.externalDependencies).toEqual([]);
    expect(report.admittedDependencies).toEqual([]);
    expect(report.axiomList.size).toBe(1);
    expect(report.estimatedRisk).toBe('low');
  });

  it('auditTheorem detecta risk=high cuando un axioma raíz es external', () => {
    const ledger = new ProvenanceLedger();
    const sketchyAx = ledger.add({
      statement: 'AX_EXT',
      kind: 'axiom',
      dependencies: [],
      metadata: meta({ tool: 'lean4', provedBy: 'lean-community' }),
      trust: 'external',
    });
    const th = ledger.add({
      statement: 'T',
      kind: 'theorem',
      dependencies: [sketchyAx],
      metadata: meta(),
      trust: 'verified',
    });
    const report = auditTheorem(th, ledger);
    expect(report.estimatedRisk).toBe('high');
    expect(report.externalDependencies.length).toBe(1);
    expect(report.externalDependencies[0].statement).toBe('AX_EXT');
  });

  it('auditTheorem da risk=medium cuando hay un admitted aislado sobre base verified', () => {
    const ledger = new ProvenanceLedger();
    // 10 axiomas verified + 1 lemma admitted + theorem verified → ratio ~1/12 = 8%
    const axIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      axIds.push(
        ledger.add({
          statement: `AX${i}`,
          kind: 'axiom',
          dependencies: [],
          metadata: meta(),
          trust: 'verified',
        }),
      );
    }
    const adm = ledger.add({
      statement: 'L_ADM',
      kind: 'lemma',
      dependencies: [axIds[0]],
      metadata: meta(),
      trust: 'admitted',
    });
    const th = ledger.add({
      statement: 'T',
      kind: 'theorem',
      dependencies: [adm, ...axIds],
      metadata: meta(),
      trust: 'verified',
    });
    const report = auditTheorem(th, ledger);
    expect(report.estimatedRisk).toBe('medium');
    expect(report.admittedDependencies.length).toBe(1);
  });

  it('auditTheorem lanza si el id no existe', () => {
    const ledger = new ProvenanceLedger();
    expect(() => auditTheorem('nope', ledger)).toThrow(/no encontrado/);
  });

  it('provenanceToCertificate produce payload con axiomas + chain + proveniencia', () => {
    const ledger = new ProvenanceLedger();
    const ax = ledger.add({
      statement: 'AX',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const thId = ledger.add({
      statement: 'TH',
      kind: 'theorem',
      dependencies: [ax],
      metadata: meta({ tool: 'st-prover@4.10.0' }),
      trust: 'verified',
    });
    const th = ledger.get(thId)!;
    const cert = provenanceToCertificate(th, ledger) as {
      goal: string;
      axioms: string[];
      provenance: { tool: string; chainLength: number; dependencies: unknown[] };
    };
    expect(cert.goal).toBe('TH');
    expect(cert.axioms).toEqual(['AX']);
    expect(cert.provenance.tool).toBe('st-prover@4.10.0');
    expect(cert.provenance.chainLength).toBe(2);
    expect(cert.provenance.dependencies.length).toBe(2);
  });

  it('add() es idempotente: re-añadir el mismo nodo no duplica', () => {
    const ledger = new ProvenanceLedger();
    const id1 = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const id2 = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta({ provedBy: 'otro' }),
      trust: 'admitted',
    });
    expect(id1).toBe(id2);
    expect(ledger.totalNodes()).toBe(1);
    // El primer trust gana — no se sobrescribe.
    expect(ledger.get(id1)!.trust).toBe('verified');
  });

  it('get devuelve copia defensiva: mutar el resultado no afecta el ledger', () => {
    const ledger = new ProvenanceLedger();
    const ax = ledger.add({
      statement: 'A',
      kind: 'axiom',
      dependencies: [],
      metadata: meta(),
      trust: 'verified',
    });
    const got = ledger.get(ax)!;
    got.dependencies.push('hack');
    got.metadata.provedBy = 'hacker';
    const fresh = ledger.get(ax)!;
    expect(fresh.dependencies).toEqual([]);
    expect(fresh.metadata.provedBy).toBe('tester');
  });
});
