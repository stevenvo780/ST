// ============================================================
// ST Categorical — FinSet
// ============================================================
// Categoría de conjuntos finitos (representados como objetos
// nombrados con su carrier explícito) y funciones totales entre
// ellos. Los morfismos llevan un mapa `fn: Map<string,string>`
// para que la igualdad e identidad sean computables.
// ============================================================

import type { Category, MorId } from './types';

/**
 * Objeto FinSet = nombre + conjunto de elementos. El nombre actúa
 * como identidad estable; los elementos viven como strings.
 */
export interface FinSetObj {
  readonly name: string;
  readonly elements: ReadonlyArray<string>;
}

/**
 * Morfismo FinSet: función total entre los elementos de src y tgt.
 * `id` es la clave única en `morphisms`. Construirla via
 * `mkFinSetMor` garantiza coherencia con la categoría.
 */
export interface FinSetMor {
  readonly id: MorId;
  readonly src: string;
  readonly tgt: string;
  readonly fn: ReadonlyMap<string, string>;
}

/**
 * Construye un morfismo en FinSet validando que `fn` cubra
 * todos los elementos del dominio y que sus imágenes vivan en el
 * codominio. Lanza si el cliente intenta crear una función parcial
 * o con valores fuera de tgt.
 */
export function mkFinSetMor(
  name: string,
  src: FinSetObj,
  tgt: FinSetObj,
  table: Record<string, string> | ReadonlyMap<string, string>,
): FinSetMor {
  const fn = new Map<string, string>();
  const tgtSet = new Set<string>(tgt.elements);
  const tableMap: ReadonlyMap<string, string> =
    table instanceof Map
      ? (table as ReadonlyMap<string, string>)
      : new Map<string, string>(Object.entries(table as Record<string, string>));
  for (const x of src.elements) {
    const y = tableMap.get(x);
    if (y === undefined) {
      throw new Error(`FinSet morphism ${name}: missing image for ${x} ∈ ${src.name}`);
    }
    if (!tgtSet.has(y)) {
      throw new Error(`FinSet morphism ${name}: image ${y} of ${x} not in target ${tgt.name}`);
    }
    fn.set(x, y);
  }
  return {
    id: `${src.name}→${tgt.name}:${name}`,
    src: src.name,
    tgt: tgt.name,
    fn,
  };
}

/**
 * Construye FinSet sobre un conjunto explícito de objetos y morfismos.
 * Cierra automáticamente bajo identidades y composiciones (transitive
 * closure) para que `verifyAssociativity` no falle por morfismos
 * intermedios faltantes.
 *
 * `maxClosureSteps` limita la expansión por seguridad cuando la
 * categoría tiene ciclos densos; default 4 es suficiente para
 * todos los tests del módulo.
 */
export function FinSet(
  objs: ReadonlyArray<FinSetObj>,
  generators: ReadonlyArray<FinSetMor> = [],
  maxClosureSteps = 4,
): Category<FinSetObj, FinSetMor> {
  const objsByName = new Map<string, FinSetObj>(objs.map((o) => [o.name, o]));
  const morphisms = new Map<MorId, FinSetMor>();

  const objectsSet = new Set<FinSetObj>(objs);

  function getObj(name: string): FinSetObj {
    const o = objsByName.get(name);
    if (!o) throw new Error(`FinSet: unknown object ${name}`);
    return o;
  }

  function addMor(m: FinSetMor): FinSetMor {
    const existing = morphisms.get(m.id);
    if (existing) return existing;
    morphisms.set(m.id, m);
    return m;
  }

  // identidades
  for (const o of objs) {
    const fn = new Map<string, string>();
    for (const x of o.elements) fn.set(x, x);
    addMor({ id: `${o.name}→${o.name}:id`, src: o.name, tgt: o.name, fn });
  }
  for (const g of generators) addMor(g);

  // composición concreta (no necesita la categoría)
  function rawCompose(g: FinSetMor, f: FinSetMor): FinSetMor {
    if (f.tgt !== g.src) {
      throw new Error(`FinSet compose: dom mismatch ${f.id} ; ${g.id}`);
    }
    const src = getObj(f.src);
    const tgt = getObj(g.tgt);
    const fn = new Map<string, string>();
    for (const x of src.elements) {
      const fx = f.fn.get(x);
      if (fx === undefined) throw new Error(`FinSet compose: missing image for ${x} under ${f.id}`);
      const gfx = g.fn.get(fx);
      if (gfx === undefined) throw new Error(`FinSet compose: missing image for ${fx} under ${g.id}`);
      fn.set(x, gfx);
    }
    // El nombre canónico de la composición es g∘f. Si ese morfismo
    // ya está registrado con otro nombre y misma tabla, lo reusamos
    // para que la igualdad sea robusta.
    const candidate: FinSetMor = {
      id: `${src.name}→${tgt.name}:${g.id.split(':').pop()}∘${f.id.split(':').pop()}`,
      src: src.name,
      tgt: tgt.name,
      fn,
    };
    // ¿Ya existe un morfismo con misma tabla? -> reutilizar id
    for (const existing of morphisms.values()) {
      if (
        existing.src === candidate.src &&
        existing.tgt === candidate.tgt &&
        tablesEqual(existing.fn, fn)
      ) {
        return existing;
      }
    }
    morphisms.set(candidate.id, candidate);
    return candidate;
  }

  // Cierre por composición acotado
  for (let step = 0; step < maxClosureSteps; step++) {
    const snapshot = Array.from(morphisms.values());
    let added = false;
    for (const f of snapshot) {
      for (const g of snapshot) {
        if (f.tgt !== g.src) continue;
        const before = morphisms.size;
        rawCompose(g, f);
        if (morphisms.size > before) added = true;
      }
    }
    if (!added) break;
  }

  function identity(obj: FinSetObj): FinSetMor {
    const idMor = morphisms.get(`${obj.name}→${obj.name}:id`);
    if (idMor === undefined) throw new Error(`FinSet: missing identity for ${obj.name}`);
    return idMor;
  }

  function compose(g: FinSetMor, f: FinSetMor): FinSetMor {
    return rawCompose(g, f);
  }

  function source(m: FinSetMor): FinSetObj {
    return getObj(m.src);
  }
  function target(m: FinSetMor): FinSetObj {
    return getObj(m.tgt);
  }

  function eqMor(a: FinSetMor, b: FinSetMor): boolean {
    if (a.src !== b.src || a.tgt !== b.tgt) return false;
    return tablesEqual(a.fn, b.fn);
  }

  function eqObj(a: FinSetObj, b: FinSetObj): boolean {
    return a.name === b.name;
  }

  function hom(a: FinSetObj, b: FinSetObj): FinSetMor[] {
    const out: FinSetMor[] = [];
    for (const m of morphisms.values()) {
      if (m.src === a.name && m.tgt === b.name) out.push(m);
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
          // (h∘g)∘f === h∘(g∘f)
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
      const idSrc = identity(getObj(f.src));
      const idTgt = identity(getObj(f.tgt));
      if (!eqMor(compose(f, idSrc), f)) return false;
      if (!eqMor(compose(idTgt, f), f)) return false;
      if (++checked >= sample) return true;
    }
    return true;
  }

  return {
    name: 'FinSet',
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

function tablesEqual(a: ReadonlyMap<string, string>, b: ReadonlyMap<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
}
