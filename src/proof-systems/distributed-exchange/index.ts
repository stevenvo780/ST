// ============================================================
// Distributed Proof Exchange — Simulated Gossip Protocol
// ============================================================
//
// Simula la dinámica de un protocolo P2P para intercambio de proofs:
// - Nodos con peers y proofs conocidas
// - Mensajes en cola que se procesan por tick()
// - Gossip: cuando un nodo aprende una proof, la anuncia a sus peers
// - Request/response para pedir proofs específicas
// - Revoke + blacklist para invalidación
// - Anti-entropy para sincronizar peers desconectados
//
// NO usa red real. Las firmas se modelan como strings opacos: la verificación
// criptográfica vive en `proof-exchange`. Aquí lo que importa es la
// orquestación de mensajes y el estado distribuido.

import type { ProofPackage } from '../proof-exchange';

export interface KnownProofRecord {
  proof: ProofPackage;
  signature: string;
  sourceId: string;
  receivedAt: string;
}

export interface PeerNode {
  id: string;
  publicKey: string;
  peers: Set<string>;
  knownProofs: Map<string, KnownProofRecord>;
  trustedKeys: Set<string>;
  blacklist: Set<string>;
  revoked: Map<string, string>;
}

export interface NetworkMessage {
  kind: 'announce' | 'request' | 'response' | 'revoke';
  from: string;
  to: string;
  payload: unknown;
  timestamp: string;
}

export interface AnnouncePayload {
  proofHash: string;
  proof: ProofPackage;
  signature: string;
  signerPublicKey: string;
}

export interface RequestPayload {
  proofHash: string;
}

export interface ResponsePayload {
  proofHash: string;
  proof: ProofPackage | null;
  signature: string | null;
  signerPublicKey: string | null;
}

export interface RevokePayload {
  proofHash: string;
  reason: string;
  signerPublicKey: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function hashStringSync(input: string): string {
  // Hash determinista no criptográfico (FNV-1a 64-bit-ish, hex). Sólo para
  // identificar proofs dentro de la simulación. La integridad real la dan
  // las firmas en `proof-exchange`.
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

export function proofHash(pkg: ProofPackage): string {
  // Versión síncrona pensada para la simulación. Usa un canonical-ish
  // simple: ordena claves de primer nivel + serializa proof.
  const canonical = JSON.stringify({
    formula: pkg.formula,
    metadata: pkg.metadata,
    profile: pkg.profile,
    proof: pkg.proof,
    version: pkg.version,
  });
  return hashStringSync(canonical);
}

export interface ProofConflict {
  proofHashA: string;
  proofHashB: string;
  statementsMatch: boolean;
}

export class GossipNetwork {
  private readonly nodes: Map<string, PeerNode> = new Map();
  private readonly queue: NetworkMessage[] = [];
  private droppedCount = 0;
  private deliveredCount = 0;

  addNode(node: PeerNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node already registered: ${node.id}`);
    }
    this.nodes.set(node.id, node);
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  getNode(id: string): PeerNode | undefined {
    return this.nodes.get(id);
  }

  listNodes(): PeerNode[] {
    return Array.from(this.nodes.values());
  }

  connect(nodeA: string, nodeB: string): void {
    const a = this.requireNode(nodeA);
    const b = this.requireNode(nodeB);
    if (a.id === b.id) return;
    a.peers.add(b.id);
    b.peers.add(a.id);
  }

  disconnect(nodeA: string, nodeB: string): void {
    const a = this.nodes.get(nodeA);
    const b = this.nodes.get(nodeB);
    if (a) a.peers.delete(nodeB);
    if (b) b.peers.delete(nodeA);
  }

  private requireNode(id: string): PeerNode {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Unknown node: ${id}`);
    return node;
  }

  private enqueue(msg: NetworkMessage): void {
    this.queue.push(msg);
  }

  publish(fromNode: string, proof: ProofPackage, signature: string): NetworkMessage[] {
    const source = this.requireNode(fromNode);
    const hash = proofHash(proof);
    if (!source.knownProofs.has(hash)) {
      source.knownProofs.set(hash, {
        proof,
        signature,
        sourceId: fromNode,
        receivedAt: nowIso(),
      });
    }
    const emitted: NetworkMessage[] = [];
    for (const peerId of source.peers) {
      const msg: NetworkMessage = {
        kind: 'announce',
        from: fromNode,
        to: peerId,
        payload: {
          proofHash: hash,
          proof,
          signature,
          signerPublicKey: source.publicKey,
        } satisfies AnnouncePayload,
        timestamp: nowIso(),
      };
      this.enqueue(msg);
      emitted.push(msg);
    }
    return emitted;
  }

  request(fromNode: string, hash: string): NetworkMessage[] {
    const source = this.requireNode(fromNode);
    const emitted: NetworkMessage[] = [];
    for (const peerId of source.peers) {
      const msg: NetworkMessage = {
        kind: 'request',
        from: fromNode,
        to: peerId,
        payload: { proofHash: hash } satisfies RequestPayload,
        timestamp: nowIso(),
      };
      this.enqueue(msg);
      emitted.push(msg);
    }
    return emitted;
  }

  revokeProof(fromNode: string, hash: string, reason: string): NetworkMessage[] {
    const source = this.requireNode(fromNode);
    source.revoked.set(hash, reason);
    source.knownProofs.delete(hash);
    const emitted: NetworkMessage[] = [];
    for (const peerId of source.peers) {
      const msg: NetworkMessage = {
        kind: 'revoke',
        from: fromNode,
        to: peerId,
        payload: {
          proofHash: hash,
          reason,
          signerPublicKey: source.publicKey,
        } satisfies RevokePayload,
        timestamp: nowIso(),
      };
      this.enqueue(msg);
      emitted.push(msg);
    }
    return emitted;
  }

  blacklistKey(nodeId: string, publicKey: string): void {
    const node = this.requireNode(nodeId);
    node.blacklist.add(publicKey);
    // Evict any known proofs originadas en esa key.
    for (const [hash, record] of node.knownProofs.entries()) {
      const sourceNode = this.nodes.get(record.sourceId);
      if (sourceNode && sourceNode.publicKey === publicKey) {
        node.knownProofs.delete(hash);
      }
    }
  }

  tick(): { delivered: number; dropped: number } {
    let delivered = 0;
    let dropped = 0;
    const pending = this.queue.splice(0, this.queue.length);
    // Mensajes generados durante la propagación de este tick van a una nueva
    // cola para el próximo tick (evita loops infinitos en un solo tick).
    for (const msg of pending) {
      const target = this.nodes.get(msg.to);
      const source = this.nodes.get(msg.from);
      if (!target || !source) {
        dropped++;
        continue;
      }
      // Conexión activa requerida para entrega.
      if (!target.peers.has(msg.from) || !source.peers.has(msg.to)) {
        dropped++;
        continue;
      }
      const ok = this.handleMessage(target, source, msg);
      if (ok) {
        delivered++;
      } else {
        dropped++;
      }
    }
    this.deliveredCount += delivered;
    this.droppedCount += dropped;
    return { delivered, dropped };
  }

  private handleMessage(target: PeerNode, source: PeerNode, msg: NetworkMessage): boolean {
    switch (msg.kind) {
      case 'announce':
        return this.handleAnnounce(target, source, msg.payload as AnnouncePayload);
      case 'request':
        return this.handleRequest(target, source, msg.payload as RequestPayload);
      case 'response':
        return this.handleResponse(target, source, msg.payload as ResponsePayload);
      case 'revoke':
        return this.handleRevoke(target, msg.payload as RevokePayload);
    }
  }

  private handleAnnounce(target: PeerNode, source: PeerNode, payload: AnnouncePayload): boolean {
    if (target.blacklist.has(payload.signerPublicKey)) return false;
    if (target.revoked.has(payload.proofHash)) return false;
    if (target.knownProofs.has(payload.proofHash)) {
      // Ya lo conozco: no re-gossip, pero sí lo cuento como entregado.
      return true;
    }
    target.knownProofs.set(payload.proofHash, {
      proof: payload.proof,
      signature: payload.signature,
      sourceId: source.id,
      receivedAt: nowIso(),
    });
    // Gossip a peers (excluye al emisor).
    for (const peerId of target.peers) {
      if (peerId === source.id) continue;
      this.enqueue({
        kind: 'announce',
        from: target.id,
        to: peerId,
        payload,
        timestamp: nowIso(),
      });
    }
    return true;
  }

  private handleRequest(target: PeerNode, source: PeerNode, payload: RequestPayload): boolean {
    const record = target.knownProofs.get(payload.proofHash);
    const signerNode = record ? this.nodes.get(record.sourceId) : undefined;
    const response: ResponsePayload = record
      ? {
          proofHash: payload.proofHash,
          proof: record.proof,
          signature: record.signature,
          signerPublicKey: signerNode ? signerNode.publicKey : null,
        }
      : { proofHash: payload.proofHash, proof: null, signature: null, signerPublicKey: null };
    this.enqueue({
      kind: 'response',
      from: target.id,
      to: source.id,
      payload: response,
      timestamp: nowIso(),
    });
    return true;
  }

  private handleResponse(target: PeerNode, source: PeerNode, payload: ResponsePayload): boolean {
    if (!payload.proof || !payload.signature || !payload.signerPublicKey) return true;
    if (target.blacklist.has(payload.signerPublicKey)) return false;
    if (target.revoked.has(payload.proofHash)) return false;
    if (target.knownProofs.has(payload.proofHash)) return true;
    target.knownProofs.set(payload.proofHash, {
      proof: payload.proof,
      signature: payload.signature,
      sourceId: source.id,
      receivedAt: nowIso(),
    });
    return true;
  }

  private handleRevoke(target: PeerNode, payload: RevokePayload): boolean {
    if (target.revoked.has(payload.proofHash)) return true;
    target.revoked.set(payload.proofHash, payload.reason);
    target.knownProofs.delete(payload.proofHash);
    // Propaga a peers (gossip de revocación).
    for (const peerId of target.peers) {
      this.enqueue({
        kind: 'revoke',
        from: target.id,
        to: peerId,
        payload,
        timestamp: nowIso(),
      });
    }
    return true;
  }

  proofPropagation(hash: string): { receivedBy: Set<string>; coverage: number } {
    const receivedBy = new Set<string>();
    for (const node of this.nodes.values()) {
      if (node.knownProofs.has(hash)) receivedBy.add(node.id);
    }
    const total = this.nodes.size;
    const coverage = total === 0 ? 0 : receivedBy.size / total;
    return { receivedBy, coverage };
  }

  // Drena la cola hasta que no haya más mensajes pendientes (o se alcance
  // el límite). Útil para tests; equivale a varias `tick()` consecutivas.
  drain(maxTicks = 100): { ticks: number; delivered: number; dropped: number } {
    let delivered = 0;
    let dropped = 0;
    let ticks = 0;
    while (this.queue.length > 0 && ticks < maxTicks) {
      const result = this.tick();
      delivered += result.delivered;
      dropped += result.dropped;
      ticks++;
    }
    return { ticks, delivered, dropped };
  }

  totals(): { delivered: number; dropped: number; pending: number } {
    return {
      delivered: this.deliveredCount,
      dropped: this.droppedCount,
      pending: this.queue.length,
    };
  }
}

export function createPeerNode(params: {
  id: string;
  publicKey: string;
  trustedKeys?: Iterable<string>;
}): PeerNode {
  return {
    id: params.id,
    publicKey: params.publicKey,
    peers: new Set(),
    knownProofs: new Map(),
    trustedKeys: new Set(params.trustedKeys ?? []),
    blacklist: new Set(),
    revoked: new Map(),
  };
}

export function detectConflicts(network: GossipNetwork): ProofConflict[] {
  // Conflicto = dos hashes distintos en nodos cualesquiera con el mismo
  // (formula, profile). Se reporta como par (A,B) con A<B lexicográfico.
  const byStatement = new Map<string, Map<string, ProofPackage>>();
  for (const node of network.listNodes()) {
    for (const [hash, record] of node.knownProofs.entries()) {
      const key = `${record.proof.profile}::${record.proof.formula}`;
      let bucket = byStatement.get(key);
      if (!bucket) {
        bucket = new Map();
        byStatement.set(key, bucket);
      }
      if (!bucket.has(hash)) bucket.set(hash, record.proof);
    }
  }
  const conflicts: ProofConflict[] = [];
  for (const bucket of byStatement.values()) {
    if (bucket.size < 2) continue;
    const hashes = Array.from(bucket.keys()).sort();
    for (let i = 0; i < hashes.length; i++) {
      for (let j = i + 1; j < hashes.length; j++) {
        const a = hashes[i];
        const b = hashes[j];
        if (!a || !b) continue;
        conflicts.push({ proofHashA: a, proofHashB: b, statementsMatch: true });
      }
    }
  }
  return conflicts;
}

export function syncPeers(
  network: GossipNetwork,
  nodeA: string,
  nodeB: string,
): { sentAtoB: number; sentBtoA: number } {
  const a = network.getNode(nodeA);
  const b = network.getNode(nodeB);
  if (!a || !b) throw new Error('syncPeers: unknown node');
  let sentAtoB = 0;
  let sentBtoA = 0;
  for (const [hash, record] of a.knownProofs.entries()) {
    if (b.revoked.has(hash)) continue;
    const signerNode = network.getNode(record.sourceId);
    if (signerNode && b.blacklist.has(signerNode.publicKey)) continue;
    if (!b.knownProofs.has(hash)) {
      b.knownProofs.set(hash, { ...record, receivedAt: nowIso() });
      sentAtoB++;
    }
  }
  for (const [hash, record] of b.knownProofs.entries()) {
    if (a.revoked.has(hash)) continue;
    const signerNode = network.getNode(record.sourceId);
    if (signerNode && a.blacklist.has(signerNode.publicKey)) continue;
    if (!a.knownProofs.has(hash)) {
      a.knownProofs.set(hash, { ...record, receivedAt: nowIso() });
      sentBtoA++;
    }
  }
  return { sentAtoB, sentBtoA };
}
