import { describe, it, expect } from 'vitest';
import {
  GossipNetwork,
  createPeerNode,
  detectConflicts,
  proofHash,
  syncPeers,
  type PeerNode,
} from '../../../proof-systems/distributed-exchange';
import type { ProofPackage } from '../../../proof-systems/proof-exchange';
import type { Proof } from '../../../types';

function makeProof(name = 'p'): Proof {
  return {
    goal: { kind: 'atom', name },
    steps: [
      {
        stepNumber: 1,
        formula: { kind: 'atom', name },
        justification: 'premise',
        premises: [],
        source: 'premise',
      },
    ],
    status: 'complete',
    method: 'natural_deduction',
  };
}

function makePackage(overrides?: Partial<ProofPackage>): ProofPackage {
  return {
    version: '1.0',
    formula: 'p -> p',
    profile: 'classical.propositional',
    proof: makeProof(),
    metadata: {
      author: 'alice',
      timestamp: '2026-01-01T00:00:00.000Z',
      tags: ['logic'],
    },
    ...overrides,
  };
}

function setupTriangle(): { net: GossipNetwork; a: PeerNode; b: PeerNode; c: PeerNode } {
  const net = new GossipNetwork();
  const a = createPeerNode({ id: 'A', publicKey: 'pkA' });
  const b = createPeerNode({ id: 'B', publicKey: 'pkB' });
  const c = createPeerNode({ id: 'C', publicKey: 'pkC' });
  net.addNode(a);
  net.addNode(b);
  net.addNode(c);
  net.connect('A', 'B');
  net.connect('B', 'C');
  net.connect('A', 'C');
  return { net, a, b, c };
}

describe('GossipNetwork.publish + tick', () => {
  it('3 nodos triangulares: A publica y B y C reciben tras drain()', () => {
    const { net, a } = setupTriangle();
    const pkg = makePackage();
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig-A');
    expect(a.knownProofs.has(hash)).toBe(true);
    const result = net.drain();
    expect(result.delivered).toBeGreaterThan(0);
    const prop = net.proofPropagation(hash);
    expect(prop.receivedBy.has('A')).toBe(true);
    expect(prop.receivedBy.has('B')).toBe(true);
    expect(prop.receivedBy.has('C')).toBe(true);
    expect(prop.coverage).toBe(1);
  });

  it('un único tick entrega a peers directos; segundo tick propaga el gossip', () => {
    const { net } = setupTriangle();
    // Para verificar propagación multi-hop, desconectamos A-C: C sólo
    // puede recibir vía B.
    net.disconnect('A', 'C');
    const pkg = makePackage({ formula: 'q -> q' });
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig-A');
    net.tick();
    let prop = net.proofPropagation(hash);
    expect(prop.receivedBy.has('B')).toBe(true);
    expect(prop.receivedBy.has('C')).toBe(false);
    net.tick();
    prop = net.proofPropagation(hash);
    expect(prop.receivedBy.has('C')).toBe(true);
  });
});

describe('GossipNetwork.disconnect', () => {
  it('disconnect interrumpe gossip entre 2 nodos', () => {
    const net = new GossipNetwork();
    net.addNode(createPeerNode({ id: 'A', publicKey: 'pkA' }));
    net.addNode(createPeerNode({ id: 'B', publicKey: 'pkB' }));
    net.connect('A', 'B');
    net.disconnect('A', 'B');
    const pkg = makePackage();
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig-A');
    net.drain();
    const prop = net.proofPropagation(hash);
    expect(prop.receivedBy.has('B')).toBe(false);
    expect(prop.coverage).toBe(0.5);
  });

  it('drop counter aumenta cuando se publica a una arista cortada', () => {
    const net = new GossipNetwork();
    net.addNode(createPeerNode({ id: 'A', publicKey: 'pkA' }));
    net.addNode(createPeerNode({ id: 'B', publicKey: 'pkB' }));
    net.connect('A', 'B');
    const pkg = makePackage();
    net.publish('A', pkg, 'sig-A');
    // El mensaje está en cola: si desconectamos antes del tick, debería caer.
    net.disconnect('A', 'B');
    const { delivered, dropped } = net.tick();
    expect(delivered).toBe(0);
    expect(dropped).toBe(1);
  });
});

describe('GossipNetwork.request', () => {
  it('request explícito devuelve la proof desde un peer que la tiene', () => {
    const { net, b } = setupTriangle();
    const pkg = makePackage({ formula: 'request-test' });
    const hash = proofHash(pkg);
    // B ya tiene la proof; A no.
    b.knownProofs.set(hash, {
      proof: pkg,
      signature: 'sig-orig',
      sourceId: 'B',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });
    net.request('A', hash);
    net.drain();
    const prop = net.proofPropagation(hash);
    expect(prop.receivedBy.has('A')).toBe(true);
  });

  it('request que no encuentra la proof no propaga nada nuevo', () => {
    const { net } = setupTriangle();
    const ghostHash = 'no-such-hash';
    net.request('A', ghostHash);
    net.drain();
    const prop = net.proofPropagation(ghostHash);
    expect(prop.receivedBy.size).toBe(0);
  });
});

describe('GossipNetwork.revokeProof', () => {
  it('revoke propaga rechazo y elimina la proof de todos los nodos', () => {
    const { net } = setupTriangle();
    const pkg = makePackage({ formula: 'revoke-target' });
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig-A');
    net.drain();
    expect(net.proofPropagation(hash).coverage).toBe(1);

    net.revokeProof('A', hash, 'bug en la derivación');
    net.drain();
    const after = net.proofPropagation(hash);
    expect(after.coverage).toBe(0);
    expect(net.getNode('B')?.revoked.get(hash)).toBe('bug en la derivación');
    expect(net.getNode('C')?.revoked.get(hash)).toBe('bug en la derivación');
  });

  it('una proof revocada no se vuelve a aceptar si alguien la re-anuncia', () => {
    const { net } = setupTriangle();
    const pkg = makePackage({ formula: 'persistent-revoke' });
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig-A');
    net.drain();
    net.revokeProof('A', hash, 'razón');
    net.drain();
    // Forzamos que B intente reanunciar (estado simulando un fork).
    net.publish('B', pkg, 'sig-A');
    net.drain();
    // B había revocado, así que su propio publish lo re-introduce localmente
    // pero los demás nodos siguen con la revocación activa.
    expect(net.getNode('A')?.revoked.has(hash)).toBe(true);
    expect(net.getNode('C')?.revoked.has(hash)).toBe(true);
    expect(net.getNode('A')?.knownProofs.has(hash)).toBe(false);
    expect(net.getNode('C')?.knownProofs.has(hash)).toBe(false);
  });
});

describe('GossipNetwork.blacklistKey', () => {
  it('blacklist bloquea proofs futuras firmadas con esa key', () => {
    const { net, b } = setupTriangle();
    b.blacklist.add('pkA');
    const pkg = makePackage({ formula: 'blocked' });
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig-A');
    net.drain();
    expect(net.getNode('B')?.knownProofs.has(hash)).toBe(false);
    // C sigue recibiendo (no tiene a A en blacklist).
    expect(net.getNode('C')?.knownProofs.has(hash)).toBe(true);
  });

  it('blacklistKey() también evicta proofs ya conocidas de esa key', () => {
    const { net } = setupTriangle();
    const pkg = makePackage({ formula: 'evict-me' });
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig-A');
    net.drain();
    expect(net.getNode('B')?.knownProofs.has(hash)).toBe(true);
    net.blacklistKey('B', 'pkA');
    expect(net.getNode('B')?.knownProofs.has(hash)).toBe(false);
  });
});

describe('detectConflicts', () => {
  it('detecta conflicto cuando 2 nodos tienen distintas versiones para mismo (profile, formula)', () => {
    const { net, a, b } = setupTriangle();
    const pkgV1 = makePackage({
      formula: 'p',
      metadata: { author: 'alice', timestamp: '2026-01-01T00:00:00.000Z' },
    });
    const pkgV2 = makePackage({
      formula: 'p',
      metadata: { author: 'bob', timestamp: '2026-02-02T00:00:00.000Z' },
    });
    a.knownProofs.set(proofHash(pkgV1), {
      proof: pkgV1,
      signature: 'sigA',
      sourceId: 'A',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });
    b.knownProofs.set(proofHash(pkgV2), {
      proof: pkgV2,
      signature: 'sigB',
      sourceId: 'B',
      receivedAt: '2026-02-02T00:00:00.000Z',
    });
    const conflicts = detectConflicts(net);
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
    expect(conflicts[0]?.statementsMatch).toBe(true);
  });

  it('no reporta conflicto cuando todos los nodos tienen la misma versión', () => {
    const { net } = setupTriangle();
    const pkg = makePackage({ formula: 'consensus' });
    net.publish('A', pkg, 'sig-A');
    net.drain();
    const conflicts = detectConflicts(net);
    expect(conflicts).toEqual([]);
  });
});

describe('syncPeers (anti-entropy)', () => {
  it('anti-entropy iguala estado entre 2 nodos desconectados', () => {
    const net = new GossipNetwork();
    net.addNode(createPeerNode({ id: 'A', publicKey: 'pkA' }));
    net.addNode(createPeerNode({ id: 'B', publicKey: 'pkB' }));
    // No los conectamos. Mismo problema, conocimiento divergente.
    const pkgA = makePackage({ formula: 'only-in-A' });
    const pkgB = makePackage({ formula: 'only-in-B' });
    net.publish('A', pkgA, 'sigA');
    net.publish('B', pkgB, 'sigB');
    net.drain();
    expect(net.getNode('A')?.knownProofs.size).toBe(1);
    expect(net.getNode('B')?.knownProofs.size).toBe(1);

    const result = syncPeers(net, 'A', 'B');
    expect(result.sentAtoB).toBe(1);
    expect(result.sentBtoA).toBe(1);
    expect(net.getNode('A')?.knownProofs.size).toBe(2);
    expect(net.getNode('B')?.knownProofs.size).toBe(2);
  });

  it('syncPeers respeta blacklist: no copia proofs de keys vetadas', () => {
    const net = new GossipNetwork();
    const a = createPeerNode({ id: 'A', publicKey: 'pkA' });
    const b = createPeerNode({ id: 'B', publicKey: 'pkB' });
    net.addNode(a);
    net.addNode(b);
    b.blacklist.add('pkA');
    const pkg = makePackage({ formula: 'sync-blocked' });
    const hash = proofHash(pkg);
    a.knownProofs.set(hash, {
      proof: pkg,
      signature: 'sig',
      sourceId: 'A',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });
    const result = syncPeers(net, 'A', 'B');
    expect(result.sentAtoB).toBe(0);
    expect(b.knownProofs.has(hash)).toBe(false);
  });

  it('syncPeers respeta revoked: no copia proofs revocadas', () => {
    const net = new GossipNetwork();
    const a = createPeerNode({ id: 'A', publicKey: 'pkA' });
    const b = createPeerNode({ id: 'B', publicKey: 'pkB' });
    net.addNode(a);
    net.addNode(b);
    const pkg = makePackage({ formula: 'revoked-in-B' });
    const hash = proofHash(pkg);
    a.knownProofs.set(hash, {
      proof: pkg,
      signature: 'sig',
      sourceId: 'A',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });
    b.revoked.set(hash, 'B no la quiere');
    const result = syncPeers(net, 'A', 'B');
    expect(result.sentAtoB).toBe(0);
    expect(b.knownProofs.has(hash)).toBe(false);
  });
});

describe('proofPropagation (coverage stat)', () => {
  it('coverage es proporcional a nodos que conocen la proof', () => {
    const net = new GossipNetwork();
    for (const id of ['A', 'B', 'C', 'D']) {
      net.addNode(createPeerNode({ id, publicKey: `pk${id}` }));
    }
    // Sólo A-B conectados; C y D aislados.
    net.connect('A', 'B');
    const pkg = makePackage({ formula: 'partial-coverage' });
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig');
    net.drain();
    const prop = net.proofPropagation(hash);
    expect(prop.receivedBy.size).toBe(2);
    expect(prop.coverage).toBe(0.5);
  });

  it('coverage 1.0 cuando todos los nodos están conectados y vivos', () => {
    const { net } = setupTriangle();
    const pkg = makePackage({ formula: 'full-coverage' });
    const hash = proofHash(pkg);
    net.publish('A', pkg, 'sig');
    net.drain();
    const prop = net.proofPropagation(hash);
    expect(prop.coverage).toBe(1);
  });
});

describe('GossipNetwork sanity', () => {
  it('addNode dos veces con el mismo id falla', () => {
    const net = new GossipNetwork();
    net.addNode(createPeerNode({ id: 'A', publicKey: 'pkA' }));
    expect(() => net.addNode(createPeerNode({ id: 'A', publicKey: 'pkX' }))).toThrow();
  });

  it('totals() refleja delivered/dropped acumulados', () => {
    const { net } = setupTriangle();
    const pkg = makePackage({ formula: 'totals-test' });
    net.publish('A', pkg, 'sig');
    net.drain();
    const totals = net.totals();
    expect(totals.delivered).toBeGreaterThan(0);
    expect(totals.pending).toBe(0);
  });
});
