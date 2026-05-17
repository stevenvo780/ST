// ============================================================
// Paige-Tarjan — partition refinement para bisimulación fuerte.
// ============================================================
// Complejidad O(m log n) sobre LTS finitos, donde m = |→| y n = |S|.
//
// Idea:
//   - Comienza con la partición coarsest compatible con el labelling.
//   - Mantiene una cola de "splitters" (B, a): bloque B y acción a.
//   - Para cada splitter, particiona cada bloque X en
//        X₁ = { s ∈ X | ∃ s -a-> t, t ∈ B }
//        X₂ = X \ X₁
//     y si ambos son no vacíos, reemplaza X y agrega el bloque más pequeño
//     como nuevo splitter (heurística que da el factor log n).
//   - Termina cuando no quedan splitters útiles.
//
// La implementación usa un Map de aristas inversas por acción
//   inversa[a][to] = { from : ∃ from -a-> to }
// para que el split sea proporcional a |a-predecessors|.
// ============================================================

import type { LTS, BisimulationResult } from './types';

interface CompiledLTS {
  states: string[];
  actions: string[];
  /** inverse[action] : to -> Set<from>  ( ∃ from -action-> to ). */
  inverse: Map<string, Map<string, Set<string>>>;
  /** labelKey[state] : firma canónica del labelling (sirve para partición inicial). */
  labelKey: Map<string, string>;
}

function canonicalLabel(labels: Set<string> | undefined): string {
  if (!labels || labels.size === 0) return '∅';
  return [...labels].sort().join('|');
}

function compile(lts: LTS): CompiledLTS {
  const stateSet = new Set(lts.states);
  const actionSet = new Set<string>();
  const inverse = new Map<string, Map<string, Set<string>>>();
  for (const [from, action, to] of lts.transitions) {
    if (!stateSet.has(from)) {
      throw new Error(`Bisimulation: transición desde estado desconocido "${from}"`);
    }
    if (!stateSet.has(to)) {
      throw new Error(`Bisimulation: transición hacia estado desconocido "${to}"`);
    }
    actionSet.add(action);
    let invA = inverse.get(action);
    if (!invA) {
      invA = new Map<string, Set<string>>();
      inverse.set(action, invA);
    }
    let bucket = invA.get(to);
    if (!bucket) {
      bucket = new Set<string>();
      invA.set(to, bucket);
    }
    bucket.add(from);
  }
  const labelKey = new Map<string, string>();
  for (const s of lts.states) {
    labelKey.set(s, canonicalLabel(lts.labelling?.[s]));
  }
  return {
    states: [...lts.states],
    actions: [...actionSet],
    inverse,
    labelKey,
  };
}

/**
 * Calcula los `a-predecessors` de un conjunto target:
 *   pre_a(B) = { s | ∃ s -a-> t, t ∈ B }
 */
function preimage(compiled: CompiledLTS, action: string, target: Iterable<string>): Set<string> {
  const out = new Set<string>();
  const invA = compiled.inverse.get(action);
  if (!invA) return out;
  for (const to of target) {
    const froms = invA.get(to);
    if (!froms) continue;
    for (const f of froms) out.add(f);
  }
  return out;
}

interface Block {
  id: number;
  members: Set<string>;
}

/**
 * Particiona el LTS según bisimulación fuerte usando Paige-Tarjan.
 * Devuelve la partición canónica donde dos estados están en el mismo bloque
 * sii son fuertemente bisimilares.
 */
export function paigeTarjan(lts: LTS): BisimulationResult {
  const compiled = compile(lts);

  // Partición inicial por labelling (refinement compatible con la condición 1).
  const byLabel = new Map<string, Set<string>>();
  for (const s of compiled.states) {
    const k = compiled.labelKey.get(s) ?? '∅';
    let g = byLabel.get(k);
    if (!g) {
      g = new Set<string>();
      byLabel.set(k, g);
    }
    g.add(s);
  }

  const blocks: Block[] = [];
  const blockOf = new Map<string, number>();
  for (const members of byLabel.values()) {
    const id = blocks.length;
    blocks.push({ id, members });
    for (const s of members) blockOf.set(s, id);
  }

  // Cola de splitters: pares (blockId, action). Usamos una clave canónica para
  // evitar inserciones duplicadas en la cola.
  const pending: Array<[number, string]> = [];
  const pendingKey = new Set<string>();
  const enqueue = (bid: number, a: string) => {
    const k = `${bid}|${a}`;
    if (pendingKey.has(k)) return;
    pendingKey.add(k);
    pending.push([bid, a]);
  };

  // Sembrar la cola con todos los pares (bloque inicial, acción).
  for (const b of blocks) {
    for (const a of compiled.actions) enqueue(b.id, a);
  }

  let iterations = 0;
  const maxIter = compiled.states.length * compiled.actions.length * 4 + 16;
  while (pending.length > 0) {
    if (iterations++ > maxIter) {
      // Cinturón de seguridad; Paige-Tarjan termina en O(m log n).
      break;
    }
    const head = pending.shift();
    if (!head) break;
    const [splitterId, action] = head;
    pendingKey.delete(`${splitterId}|${action}`);
    const splitter = blocks[splitterId];
    if (!splitter) continue;

    // pre_action(splitter.members) — estados que pueden alcanzar el splitter
    // vía la acción dada.
    const pre = preimage(compiled, action, splitter.members);
    if (pre.size === 0) continue;

    // Agrupar los preimage por bloque actual (para saber qué bloques tocan).
    const touched = new Map<number, Set<string>>();
    for (const s of pre) {
      const bid = blockOf.get(s);
      if (bid === undefined) continue;
      let bucket = touched.get(bid);
      if (!bucket) {
        bucket = new Set<string>();
        touched.set(bid, bucket);
      }
      bucket.add(s);
    }

    for (const [bid, inPre] of touched) {
      const block = blocks[bid];
      if (!block) continue;
      if (inPre.size === block.members.size) continue; // splitter no separa este bloque.

      // Particionar block en (block ∩ pre, block \ pre).
      const outside = new Set<string>();
      for (const s of block.members) {
        if (!inPre.has(s)) outside.add(s);
      }

      // Nuevo bloque para `outside`; `block` se queda con `inPre`.
      const newId = blocks.length;
      blocks.push({ id: newId, members: outside });
      block.members = inPre;
      for (const s of outside) blockOf.set(s, newId);

      // Heurística Paige-Tarjan: encolar el bloque más pequeño como splitter.
      // El más grande "hereda" su antiguo rol en cola sin necesidad de reencolar.
      const smaller = block.members.size <= outside.size ? block.id : newId;
      for (const a of compiled.actions) enqueue(smaller, a);
    }
  }

  // Compactar: filtrar bloques no vacíos y renumerar.
  const finalBlocks: string[][] = [];
  const partition = new Map<string, number>();
  for (const b of blocks) {
    if (b.members.size === 0) continue;
    const idx = finalBlocks.length;
    finalBlocks.push([...b.members]);
    for (const s of b.members) partition.set(s, idx);
  }

  return {
    partition,
    blocks: finalBlocks,
    numBlocks: finalBlocks.length,
    iterations,
  };
}
