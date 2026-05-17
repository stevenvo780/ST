// ============================================================
// ST Provenance Ledger — DAG de teoremas/lemas/axiomas + auditoría
//
// Determinístico, in-memory. La identidad de un nodo se deriva de
// (statement, dependencies, kind) — el mismo enunciado con las
// mismas deps recibe siempre el mismo id, lo que permite usar el
// ledger como tabla de contenido compartible.
// ============================================================

import { createHash } from 'crypto';
import type {
  AuditReport,
  ProvenanceKind,
  ProvenanceMetadata,
  ProvenanceNode,
  TrustLevel,
} from './types';

interface SerializedLedger {
  version: '1.0';
  nodes: ProvenanceNode[];
}

/**
 * Normaliza el statement antes de hashear: trim + colapsar whitespace.
 * Asegura que "P -> Q" y "P  ->  Q" produzcan el mismo id.
 */
function normalize(statement: string): string {
  return statement.trim().replace(/\s+/g, ' ');
}

/**
 * Calcula el id determinístico del nodo. Incluye kind para evitar
 * colisiones entre, por ejemplo, una `definition` y un `axiom` con
 * la misma cadena.
 */
function computeId(statement: string, kind: ProvenanceKind, dependencies: string[]): string {
  const canonical = JSON.stringify({
    statement: normalize(statement),
    kind,
    dependencies: [...dependencies].sort(),
  });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

export class ProvenanceLedger {
  private readonly nodes = new Map<string, ProvenanceNode>();

  /**
   * Añade un nodo al ledger. Devuelve el id determinístico.
   *
   * Si el id ya existe se preserva el nodo previo y se devuelve el
   * mismo id (idempotente). Falla si una dependencia no existe.
   */
  add(node: Omit<ProvenanceNode, 'id'>): string {
    if (node.kind === 'axiom' && node.dependencies.length > 0) {
      throw new Error(`axiom "${node.statement}" no puede tener dependencias`);
    }
    for (const dep of node.dependencies) {
      if (!this.nodes.has(dep)) {
        throw new Error(`dependencia inexistente: ${dep}`);
      }
    }
    const id = computeId(node.statement, node.kind, node.dependencies);
    if (this.nodes.has(id)) {
      return id;
    }
    this.nodes.set(id, {
      id,
      statement: normalize(node.statement),
      kind: node.kind,
      dependencies: [...node.dependencies],
      metadata: { ...node.metadata },
      proof: node.proof,
      trust: node.trust,
    });
    return id;
  }

  get(id: string): ProvenanceNode | undefined {
    const n = this.nodes.get(id);
    if (!n) return undefined;
    // Devolvemos copia defensiva para que el caller no mute el ledger.
    return {
      ...n,
      dependencies: [...n.dependencies],
      metadata: { ...n.metadata },
    };
  }

  // --- Auditoría --------------------------------------------------

  /**
   * Walk recursivo de dependencias. Devuelve los nodos en orden
   * topológico (deps antes que el nodo). Cada nodo aparece una sola
   * vez aunque sea alcanzado por múltiples caminos.
   */
  dependencyChain(id: string): ProvenanceNode[] {
    const root = this.nodes.get(id);
    if (!root) return [];
    const visited = new Set<string>();
    const out: ProvenanceNode[] = [];
    const walk = (curr: string): void => {
      if (visited.has(curr)) return;
      visited.add(curr);
      const node = this.nodes.get(curr);
      if (!node) return;
      for (const dep of node.dependencies) walk(dep);
      out.push({ ...node, dependencies: [...node.dependencies], metadata: { ...node.metadata } });
    };
    walk(id);
    return out;
  }

  /**
   * Cuenta trust por categoría sobre el cierre transitivo (incluye al root).
   */
  trustChain(id: string): { verified: number; admitted: number; external: number } {
    const chain = this.dependencyChain(id);
    const acc = { verified: 0, admitted: 0, external: 0 };
    for (const node of chain) {
      acc[node.trust]++;
    }
    return acc;
  }

  /**
   * Conjunto de IDs de axiomas alcanzables desde `id` (cierre).
   * Útil para "¿qué postulados base sostienen este teorema?".
   */
  axiomsUsed(id: string): Set<string> {
    const chain = this.dependencyChain(id);
    const out = new Set<string>();
    for (const node of chain) {
      if (node.kind === 'axiom') out.add(node.id);
    }
    return out;
  }

  /**
   * true sólo si todos los nodos del cierre transitivo (incluido el root)
   * tienen trust='verified'. Un solo `admitted` o `external` lo descalifica.
   */
  isFullyVerified(id: string): boolean {
    const chain = this.dependencyChain(id);
    if (chain.length === 0) return false;
    return chain.every((n) => n.trust === 'verified');
  }

  // --- Queries de grafo -------------------------------------------

  /** Cierre transitivo de ancestros (deps directas + indirectas), sin el propio nodo. */
  ancestors(id: string): Set<string> {
    const out = new Set<string>();
    const root = this.nodes.get(id);
    if (!root) return out;
    const walk = (curr: string): void => {
      const node = this.nodes.get(curr);
      if (!node) return;
      for (const dep of node.dependencies) {
        if (!out.has(dep)) {
          out.add(dep);
          walk(dep);
        }
      }
    };
    walk(id);
    return out;
  }

  /** Cierre transitivo de descendientes (quien depende de este nodo), sin el propio nodo. */
  descendants(id: string): Set<string> {
    const out = new Set<string>();
    if (!this.nodes.has(id)) return out;
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of this.nodes.values()) {
        if (out.has(node.id) || node.id === id) continue;
        for (const dep of node.dependencies) {
          if (dep === id || out.has(dep)) {
            out.add(node.id);
            changed = true;
            break;
          }
        }
      }
    }
    return out;
  }

  /**
   * Detecta ciclos. Devuelve la lista de ciclos como arrays de IDs.
   *
   * Bajo construcción normal `add()` impide ciclos (toda dep debe existir
   * antes), pero la importación cruda de un ledger podría introducirlos
   * — esta función lo verifica explícitamente.
   */
  findCircular(): string[][] {
    const cycles: string[][] = [];
    const WHITE = 0,
      GRAY = 1,
      BLACK = 2;
    const color = new Map<string, number>();
    const stack: string[] = [];

    const dfs = (curr: string): void => {
      color.set(curr, GRAY);
      stack.push(curr);
      const node = this.nodes.get(curr);
      if (node) {
        for (const dep of node.dependencies) {
          const c = color.get(dep) ?? WHITE;
          if (c === GRAY) {
            const idx = stack.indexOf(dep);
            if (idx >= 0) cycles.push(stack.slice(idx).concat(dep));
          } else if (c === WHITE) {
            dfs(dep);
          }
        }
      }
      stack.pop();
      color.set(curr, BLACK);
    };

    for (const id of this.nodes.keys()) {
      if ((color.get(id) ?? WHITE) === WHITE) dfs(id);
    }
    return cycles;
  }

  // --- Estadísticas -----------------------------------------------

  totalNodes(): number {
    return this.nodes.size;
  }

  axiomCount(): number {
    let n = 0;
    for (const node of this.nodes.values()) if (node.kind === 'axiom') n++;
    return n;
  }

  /** Longitud (en nodos) de la cadena más larga de dependencias. */
  longestChain(): number {
    const memo = new Map<string, number>();
    const depth = (curr: string): number => {
      const cached = memo.get(curr);
      if (cached !== undefined) return cached;
      const node = this.nodes.get(curr);
      if (!node || node.dependencies.length === 0) {
        memo.set(curr, 1);
        return 1;
      }
      let best = 0;
      for (const dep of node.dependencies) {
        const d = depth(dep);
        if (d > best) best = d;
      }
      const result = best + 1;
      memo.set(curr, result);
      return result;
    };
    let max = 0;
    for (const id of this.nodes.keys()) {
      const d = depth(id);
      if (d > max) max = d;
    }
    return max;
  }

  // --- Serialización ---------------------------------------------

  /**
   * Exporta el ledger a JSON determinístico (claves ordenadas, nodos
   * ordenados por id). Apto para hashing y para diff.
   */
  exportLedger(): string {
    const ordered = Array.from(this.nodes.values()).sort((a, b) => (a.id < b.id ? -1 : 1));
    const serializable: ProvenanceNode[] = ordered.map((n) => ({
      id: n.id,
      statement: n.statement,
      kind: n.kind,
      dependencies: [...n.dependencies].sort(),
      metadata: n.metadata,
      proof: n.proof,
      trust: n.trust,
    }));
    const payload: SerializedLedger = { version: '1.0', nodes: serializable };
    return canonicalJson(payload);
  }

  /**
   * Reemplaza el contenido del ledger por el contenido del JSON.
   * Tolera reordenamiento de nodos: hace dos pasadas para resolver
   * dependencias forward (en caso de que el JSON no esté topológicamente
   * ordenado, aunque exportLedger siempre lo deja así).
   */
  importLedger(json: string): void {
    const parsed = JSON.parse(json) as SerializedLedger;
    if (!parsed || parsed.version !== '1.0' || !Array.isArray(parsed.nodes)) {
      throw new Error('formato de ledger inválido');
    }
    this.nodes.clear();
    const pending = [...parsed.nodes];
    let progress = true;
    while (pending.length > 0 && progress) {
      progress = false;
      for (let i = pending.length - 1; i >= 0; i--) {
        const node = pending[i];
        if (!node) continue;
        if (node.dependencies.every((d) => this.nodes.has(d))) {
          this.nodes.set(node.id, {
            ...node,
            dependencies: [...node.dependencies],
            metadata: { ...node.metadata },
          });
          pending.splice(i, 1);
          progress = true;
        }
      }
    }
    if (pending.length > 0) {
      // Restauramos los pendientes tal cual; las dependencias huérfanas o
      // ciclos se detectarán con findCircular() o get() del consumidor.
      for (const node of pending) {
        this.nodes.set(node.id, {
          ...node,
          dependencies: [...node.dependencies],
          metadata: { ...node.metadata },
        });
      }
    }
  }

  /**
   * Hash SHA-256 del ledger canonicalizado. Si dos ledgers tienen el
   * mismo hash, son idénticos en contenido. Devuelve Promise para
   * dejar la puerta abierta a un hash async (WebCrypto) en runtime
   * sin Node `crypto` — la implementación actual es síncrona.
   */
  hashLedger(): Promise<string> {
    const canonical = this.exportLedger();
    return Promise.resolve(createHash('sha256').update(canonical).digest('hex'));
  }
}

// --- helpers privados -------------------------------------------

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | { [k: string]: JsonValue } | JsonValue[];

function canonicalJson(value: unknown): string {
  return stringify(value as JsonValue);
}

function stringify(value: JsonValue): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!isFinite(value)) throw new Error('non-finite number in ledger');
    return String(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stringify).join(',') + ']';
  if (typeof value === 'object') {
    const obj = value as { [k: string]: JsonValue };
    const keys = Object.keys(obj).sort();
    const pairs: string[] = [];
    for (const k of keys) {
      const v = obj[k];
      if (v === undefined) continue;
      pairs.push(JSON.stringify(k) + ':' + stringify(v));
    }
    return '{' + pairs.join(',') + '}';
  }
  return 'null';
}

// --- auditoría a nivel de teorema -------------------------------

/**
 * Genera un reporte humano-legible sobre la confianza en `theoremId`.
 *
 * Estimación de riesgo:
 * - `low`: 100% verified.
 * - `medium`: al menos 1 admitted o external pero <30% del DAG.
 * - `high`: >=30% admitted+external, o un axioma fundamental marcado como external.
 */
export function auditTheorem(theoremId: string, ledger: ProvenanceLedger): AuditReport {
  const root = ledger.get(theoremId);
  if (!root) {
    throw new Error(`teorema no encontrado en el ledger: ${theoremId}`);
  }
  const chain = ledger.dependencyChain(theoremId);
  const trustClassification = ledger.trustChain(theoremId);

  const externalDependencies = chain.filter((n) => n.trust === 'external');
  const admittedDependencies = chain.filter((n) => n.trust === 'admitted');
  const axiomList = ledger.axiomsUsed(theoremId);
  const totalNodes = chain.length;

  const unverified = trustClassification.admitted + trustClassification.external;
  const ratio = totalNodes > 0 ? unverified / totalNodes : 0;

  let estimatedRisk: 'low' | 'medium' | 'high';
  if (unverified === 0) {
    estimatedRisk = 'low';
  } else if (ratio >= 0.3) {
    estimatedRisk = 'high';
  } else {
    // Si un axioma raíz es external/admitted la confianza es estructuralmente baja.
    const hasUntrustedAxiom = chain.some(
      (n) => n.kind === 'axiom' && (n.trust === 'external' || n.trust === 'admitted'),
    );
    estimatedRisk = hasUntrustedAxiom ? 'high' : 'medium';
  }

  return {
    rootTheorem: root.statement,
    trustClassification,
    externalDependencies,
    admittedDependencies,
    axiomList,
    totalNodes,
    estimatedRisk,
  };
}

// --- bridge con el formato `ProofCertificate` -------------------

/**
 * Convierte un nodo + su cadena a una forma compatible con el
 * certificado de prueba existente. No reemplaza al generador real:
 * sirve para que el agente pueda exportar el contexto de proveniencia
 * cuando publica un teorema.
 */
export function provenanceToCertificate(node: ProvenanceNode, ledger: ProvenanceLedger): unknown {
  const chain = ledger.dependencyChain(node.id);
  return {
    version: '1.0' as const,
    goal: node.statement,
    profile: node.metadata.profile,
    axioms: chain.filter((n) => n.kind === 'axiom').map((n) => n.statement),
    provenance: {
      kind: node.kind,
      trust: node.trust,
      provedBy: node.metadata.provedBy,
      provedAt: node.metadata.provedAt,
      tool: node.metadata.tool,
      chainLength: chain.length,
      dependencies: chain.map((n) => ({
        id: n.id,
        statement: n.statement,
        kind: n.kind,
        trust: n.trust,
      })),
    },
  };
}

// Re-exporta tipos para que el index del módulo los exponga limpio.
export type { ProvenanceMetadata, TrustLevel };
