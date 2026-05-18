# `proof-systems/distributed-exchange/index.ts`

============================================================ Distributed Proof Exchange — Simulated Gossip Protocol ============================================================ Simula la dinámica de un protocolo P2P para intercambio de proofs: - Nodos con peers y proofs conocidas - Mensajes en cola que se procesan por tick() - Gossip: cuando un nodo aprende una proof, la anuncia a sus peers - Request/response para pedir proofs específicas - Revoke + blacklist para invalidación - Anti-entropy para sincronizar peers desconectados NO usa red real. Las firmas se modelan como strings opacos: la verificación criptográfica vive en `proof-exchange`. Aquí lo que importa es la orquestación de mensajes y el estado distribuido.

## Contents

- [`KnownProofRecord`](#knownproofrecord) — Interface
- [`PeerNode`](#peernode) — Interface
- [`NetworkMessage`](#networkmessage) — Interface
- [`AnnouncePayload`](#announcepayload) — Interface
- [`RequestPayload`](#requestpayload) — Interface
- [`ResponsePayload`](#responsepayload) — Interface
- [`RevokePayload`](#revokepayload) — Interface
- [`proofHash`](#proofhash) — Function
- [`ProofConflict`](#proofconflict) — Interface
- [`GossipNetwork`](#gossipnetwork) — Class
- [`createPeerNode`](#createpeernode) — Function
- [`detectConflicts`](#detectconflicts) — Function
- [`syncPeers`](#syncpeers) — Function

## `KnownProofRecord`

> Interface · `proof-systems/distributed-exchange/index.ts:20`

A proof known by a peer node, including its origin and reception time.

```ts
export interface KnownProofRecord
```


## `PeerNode`

> Interface · `proof-systems/distributed-exchange/index.ts:31`

A simulated P2P node in the gossip network.
Tracks its peers, the proofs it has received, trusted keys, and revocations.

```ts
export interface PeerNode
```


## `NetworkMessage`

> Interface · `proof-systems/distributed-exchange/index.ts:42`

A message queued for delivery between two nodes in the simulated network.

```ts
export interface NetworkMessage
```


## `AnnouncePayload`

> Interface · `proof-systems/distributed-exchange/index.ts:51`

Payload for an `announce` message: broadcasts a proof to a peer.

```ts
export interface AnnouncePayload
```


## `RequestPayload`

> Interface · `proof-systems/distributed-exchange/index.ts:59`

Payload for a `request` message: asks a peer for a specific proof by hash.

```ts
export interface RequestPayload
```


## `ResponsePayload`

> Interface · `proof-systems/distributed-exchange/index.ts:64`

Payload for a `response` message: delivers (or declines) a requested proof.

```ts
export interface ResponsePayload
```


## `RevokePayload`

> Interface · `proof-systems/distributed-exchange/index.ts:72`

Payload for a `revoke` message: invalidates a proof network-wide.

```ts
export interface RevokePayload
```


## `proofHash`

> Function · `proof-systems/distributed-exchange/index.ts:101`

Computes a deterministic (non-cryptographic) hash for a `ProofPackage`,
used as the network-level identifier within the simulation.
Cryptographic integrity is provided by the signatures in `proof-exchange`.

```ts
export function proofHash(pkg: ProofPackage): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `pkg` | `ProofPackage` | no |  |

### Returns

`string` — 


## `ProofConflict`

> Interface · `proof-systems/distributed-exchange/index.ts:115`

Describes two proofs with the same statement but different hashes — a network conflict.

```ts
export interface ProofConflict
```


## `GossipNetwork`

> Class · `proof-systems/distributed-exchange/index.ts:121`

```ts
export class GossipNetwork
```


## `createPeerNode`

> Function · `proof-systems/distributed-exchange/index.ts:414`

Creates a new `PeerNode` with empty peer, proof, blacklist, and revocation sets.

```ts
export function createPeerNode(params:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `params` | `{   id: string;   publicKey: string;   trustedKeys?: Iterable<string>; }` | no |  |

### Returns

`PeerNode` — 


## `detectConflicts`

> Function · `proof-systems/distributed-exchange/index.ts:434`

Scans all nodes in the network for proofs with the same `(formula, profile)` but
different hashes, and returns them as conflict pairs sorted lexicographically.

```ts
export function detectConflicts(network: GossipNetwork): ProofConflict[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `network` | `GossipNetwork` | no |  |

### Returns

`ProofConflict[]` — 


## `syncPeers`

> Function · `proof-systems/distributed-exchange/index.ts:470`

Performs a direct anti-entropy sync between two nodes, transferring all proofs
each is missing from the other (respecting blacklists and revocations).

```ts
export function syncPeers( network: GossipNetwork, nodeA: string, nodeB: string, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `network` | `GossipNetwork` | no |  |
| `nodeA` | `string` | no |  |
| `nodeB` | `string` | no |  |

### Returns

`{ sentAtoB: number; sentBtoA: number }` — The number of proofs sent in each direction.

