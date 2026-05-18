// ============================================================
// ST Categorical — Categoría libre sobre un grafo
// ============================================================
// Dado un grafo dirigido (vertices + aristas con nombres),
// construye la categoría libre cuyos morfismos son paths
// (cadenas de aristas componibles), módulo la equivalencia
// asociativa con la identidad como path vacío.
// ============================================================

import type { Category, MorId } from './types';

/**
 * Morfismo de la categoría libre = path. Representamos un path
 * como la lista de nombres de aristas (o vacío para la identidad)
 * junto con su origen y destino.
 */
export interface FreeMor {
  readonly id: MorId;
  readonly src: string;
  readonly tgt: string;
  readonly path: ReadonlyArray<string>; // nombres de aristas, vacío = id
}

/**
 * Construye la categoría libre. `generators` es una lista de tripletas
 * `[from, to, name]` donde `name` debe ser único globalmente.
 *
 * `maxLength` acota la longitud máxima de paths considerados al
 * "materializar" la categoría como `Map<MorId, FreeMor>`. Esto es
 * inevitable: la categoría libre sobre un grafo con ciclos es
 * infinita. Para tests usamos `maxLength=3`.
 */
export function Free(
  vertices: ReadonlyArray<string>,
  generators: ReadonlyArray<readonly [string, string, string]>,
  maxLength = 3,
): Category<string, FreeMor> {
  const edgesByName = new Map<string, { from: string; to: string }>();
  const edgesByFrom = new Map<string, Array<{ name: string; to: string }>>();
  for (const v of vertices) edgesByFrom.set(v, []);
  for (const [from, to, name] of generators) {
    if (edgesByName.has(name)) throw new Error(`Free: duplicate edge name ${name}`);
    edgesByName.set(name, { from, to });
    if (!edgesByFrom.has(from)) edgesByFrom.set(from, []);
    const fromEdges = edgesByFrom.get(from);
    if (fromEdges === undefined) throw new Error(`Free: missing edge list for vertex ${from}`);
    fromEdges.push({ name, to });
  }

  const morphisms = new Map<MorId, FreeMor>();
  const objectsSet = new Set<string>(vertices);

  function pathId(src: string, tgt: string, path: ReadonlyArray<string>): MorId {
    return `${src}→${tgt}:[${path.join(',')}]`;
  }

  // Identidades
  for (const v of vertices) {
    const id = pathId(v, v, []);
    morphisms.set(id, { id, src: v, tgt: v, path: [] });
  }
  // Generadores
  for (const [from, to, name] of generators) {
    const id = pathId(from, to, [name]);
    morphisms.set(id, { id, src: from, tgt: to, path: [name] });
  }
  // Composiciones acotadas (paths hasta maxLength)
  function enumerate(from: string, length: number): Array<{ to: string; path: string[] }> {
    if (length === 0) return [{ to: from, path: [] }];
    const out: Array<{ to: string; path: string[] }> = [];
    for (const { name, to } of edgesByFrom.get(from) ?? []) {
      for (const rest of enumerate(to, length - 1)) {
        out.push({ to: rest.to, path: [name, ...rest.path] });
      }
    }
    return out;
  }
  for (const v of vertices) {
    for (let len = 2; len <= maxLength; len++) {
      for (const { to, path } of enumerate(v, len)) {
        const id = pathId(v, to, path);
        if (!morphisms.has(id)) {
          morphisms.set(id, { id, src: v, tgt: to, path });
        }
      }
    }
  }

  function identity(obj: string): FreeMor {
    const idMor = morphisms.get(pathId(obj, obj, []));
    if (idMor === undefined) throw new Error(`Free: missing identity for ${obj}`);
    return idMor;
  }
  function compose(g: FreeMor, f: FreeMor): FreeMor {
    if (f.tgt !== g.src) {
      throw new Error(`Free compose: dom mismatch ${f.id} ; ${g.id}`);
    }
    const path = [...f.path, ...g.path];
    const id = pathId(f.src, g.tgt, path);
    const cached = morphisms.get(id);
    if (cached) return cached;
    // Si excede maxLength, lo registramos on-demand para que la
    // categoría se comporte cerrada bajo composición; el cliente
    // que pase tests pesados puede subir maxLength.
    const m: FreeMor = { id, src: f.src, tgt: g.tgt, path };
    morphisms.set(id, m);
    return m;
  }
  function source(m: FreeMor): string {
    return m.src;
  }
  function target(m: FreeMor): string {
    return m.tgt;
  }
  function eqMor(a: FreeMor, b: FreeMor): boolean {
    if (a.src !== b.src || a.tgt !== b.tgt) return false;
    if (a.path.length !== b.path.length) return false;
    for (let i = 0; i < a.path.length; i++) if (a.path[i] !== b.path[i]) return false;
    return true;
  }
  function eqObj(a: string, b: string): boolean {
    return a === b;
  }
  function hom(a: string, b: string): FreeMor[] {
    const out: FreeMor[] = [];
    for (const m of morphisms.values()) {
      if (m.src === a && m.tgt === b) out.push(m);
    }
    return out;
  }
  function verifyAssociativity(sample = 50): boolean {
    const ms = Array.from(morphisms.values());
    let checked = 0;
    for (const f of ms) {
      for (const g of ms) {
        if (g.src !== f.tgt) continue;
        for (const h of ms) {
          if (h.src !== g.tgt) continue;
          const left = compose(compose(h, g), f);
          const right = compose(h, compose(g, f));
          if (!eqMor(left, right)) return false;
          if (++checked >= sample) return true;
        }
      }
    }
    return true;
  }
  function verifyIdentity(sample = 50): boolean {
    const ms = Array.from(morphisms.values());
    let checked = 0;
    for (const f of ms) {
      const idSrc = identity(f.src);
      const idTgt = identity(f.tgt);
      if (!eqMor(compose(f, idSrc), f)) return false;
      if (!eqMor(compose(idTgt, f), f)) return false;
      if (++checked >= sample) return true;
    }
    return true;
  }

  return {
    name: 'Free',
    objects: objectsSet,
    morphisms,
    identity,
    compose,
    source,
    target,
    eqMor,
    eqObj,
    hom,
    verifyAssociativity,
    verifyIdentity,
  };
}
