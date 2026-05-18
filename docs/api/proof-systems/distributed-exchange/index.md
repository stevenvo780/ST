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

> Interface · `proof-systems/distributed-exchange/index.ts:19`

```ts
export interface KnownProofRecord
```


## `PeerNode`

> Interface · `proof-systems/distributed-exchange/index.ts:26`

```ts
export interface PeerNode
```


## `NetworkMessage`

> Interface · `proof-systems/distributed-exchange/index.ts:36`

```ts
export interface NetworkMessage
```


## `AnnouncePayload`

> Interface · `proof-systems/distributed-exchange/index.ts:44`

```ts
export interface AnnouncePayload
```


## `RequestPayload`

> Interface · `proof-systems/distributed-exchange/index.ts:51`

```ts
export interface RequestPayload
```


## `ResponsePayload`

> Interface · `proof-systems/distributed-exchange/index.ts:55`

```ts
export interface ResponsePayload
```


## `RevokePayload`

> Interface · `proof-systems/distributed-exchange/index.ts:62`

```ts
export interface RevokePayload
```


## `proofHash`

> Function · `proof-systems/distributed-exchange/index.ts:86`

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

> Interface · `proof-systems/distributed-exchange/index.ts:99`

```ts
export interface ProofConflict
```


## `GossipNetwork`

> Class · `proof-systems/distributed-exchange/index.ts:105`

```ts
export class GossipNetwork
```


## `createPeerNode`

> Function · `proof-systems/distributed-exchange/index.ts:394`

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

> Function · `proof-systems/distributed-exchange/index.ts:410`

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

> Function · `proof-systems/distributed-exchange/index.ts:441`

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

`{ sentAtoB: number; sentBtoA: number }` — 

