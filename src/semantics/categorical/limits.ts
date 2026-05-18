// ============================================================
// ST Categorical — Límites y colímites
// ============================================================
// Construcciones universales en FinSet (las más usadas):
//   • product(a, b)    — producto binario A×B
//   • coproduct(a, b)  — coproducto binario A⊔B
//   • equalizer(f, g)  — igualador de un par paralelo
//
// Para casos generales también exponemos `isLimit` que recibe un
// diagrama y un cono y verifica la propiedad universal por
// muestreo sobre los conos candidatos del diagrama.
// ============================================================

import type { Category, Cone, Diagram } from './types';
import { FinSet, mkFinSetMor, type FinSetMor, type FinSetObj } from './fin-set';

/**
 * Verifica que `cone` sea un cono sobre `diagram` en `cat`:
 * para cada arista `e: i→j` del diagrama, `e ∘ leg(i) = leg(j)`.
 */
export function isCone<O, M>(
  cat: Category<O, M>,
  diagram: Diagram<O, M>,
  cone: Cone<O, M>,
): boolean {
  for (const v of diagram.vertices.keys()) {
    if (!cone.legs.has(v)) return false;
  }
  for (const { from, to, mor } of diagram.edges) {
    const legFrom = cone.legs.get(from);
    const legTo = cone.legs.get(to);
    if (!legFrom || !legTo) return false;
    const composed = cat.compose(mor, legFrom);
    if (!cat.eqMor(composed, legTo)) return false;
  }
  return true;
}

/**
 * Comprueba si `cone` es límite del diagrama: para cada otro cono
 * candidato sobre el diagrama, existe un único morfismo `u : apex' → apex`
 * que conmuta con las patas. La búsqueda es por enumeración sobre
 * los morfismos registrados en `cat`; sirve bien para categorías finitas
 * pequeñas (FinSet con objetos chicos).
 */
export function isLimit<O, M>(
  cat: Category<O, M>,
  diagram: Diagram<O, M>,
  cone: Cone<O, M>,
): boolean {
  if (!isCone(cat, diagram, cone)) return false;
  // Enumerar otros conos candidatos: para cada objeto X en cat,
  // todos los tuples de morfismos X→vertices que respeten edges.
  for (const X of cat.objects) {
    const candidates = enumerateCones(cat, diagram, X);
    for (const cand of candidates) {
      // Buscar u : X → apex tal que ∀ v: leg(v) ∘ u = cand.legs(v)
      const candidatesU = cat.hom(X, cone.apex);
      let found = 0;
      for (const u of candidatesU) {
        let ok = true;
        for (const [v, leg] of cone.legs) {
          const composed = cat.compose(leg, u);
          const expected = cand.legs.get(v);
          if (expected === undefined) { ok = false; break; }
          if (!cat.eqMor(composed, expected)) {
            ok = false;
            break;
          }
        }
        if (ok) found++;
        if (found > 1) return false; // no único
      }
      if (found !== 1) return false;
    }
  }
  return true;
}

function enumerateCones<O, M>(cat: Category<O, M>, diagram: Diagram<O, M>, apex: O): Cone<O, M>[] {
  const vNames = Array.from(diagram.vertices.keys());
  // Para cada vértice, lista de posibles legs apex→vertice.
  const optionsPerVertex: Array<Array<{ vName: string; leg: M }>> = vNames.map((v) => {
    const obj = diagram.vertices.get(v);
    if (obj === undefined) return [];
    return cat.hom(apex, obj).map((leg) => ({ vName: v, leg }));
  });
  // Producto cartesiano. Para diagramas pequeños es manejable.
  let combos: Array<Map<string, M>> = [new Map<string, M>()];
  for (const opts of optionsPerVertex) {
    const next: Array<Map<string, M>> = [];
    for (const partial of combos) {
      for (const o of opts) {
        const nm = new Map<string, M>(partial);
        nm.set(o.vName, o.leg);
        next.push(nm);
      }
    }
    combos = next;
  }
  const out: Cone<O, M>[] = [];
  for (const legs of combos) {
    const cand: Cone<O, M> = { apex, legs };
    if (isCone(cat, diagram, cand)) out.push(cand);
  }
  return out;
}

// ── Construcciones concretas en FinSet ───────────────────────

/**
 * Producto binario en FinSet: A×B con proyecciones π1, π2.
 * Construye el objeto producto como un nuevo `FinSetObj` con
 * elementos `(a,b)` codificados como `"a∥b"` y lo registra en `cat`.
 *
 * Devuelve `null` si los objetos no pertenecen a la categoría.
 *
 * Nota: la categoría `cat` debe poder admitir nuevos objetos. Para
 * nuestro uso pedimos que sea una `FinSet`-categoría construida con
 * los carriers explícitos. En lugar de mutar `cat`, esta función
 * regresa el producto + las proyecciones y deja al cliente
 * reconstruir una categoría extendida si lo necesita.
 */
export function product(
  cat: Category<FinSetObj, FinSetMor>,
  a: FinSetObj,
  b: FinSetObj,
): { obj: FinSetObj; pi1: FinSetMor; pi2: FinSetMor; cat: Category<FinSetObj, FinSetMor> } | null {
  if (!cat.objects.has(a) || !cat.objects.has(b)) return null;
  const sep = '∥';
  const elements: string[] = [];
  const pi1Table: Record<string, string> = {};
  const pi2Table: Record<string, string> = {};
  for (const x of a.elements) {
    for (const y of b.elements) {
      const tag = `${x}${sep}${y}`;
      elements.push(tag);
      pi1Table[tag] = x;
      pi2Table[tag] = y;
    }
  }
  const prod: FinSetObj = { name: `${a.name}×${b.name}`, elements };
  const extendedObjs = [...cat.objects, prod];
  // Construimos categoría extendida con los morfismos previos como
  // generadores + π1, π2.
  const oldGens = Array.from(cat.morphisms.values()).filter((m) => !m.id.endsWith(':id'));
  const pi1 = mkFinSetMor('π1', prod, a, pi1Table);
  const pi2 = mkFinSetMor('π2', prod, b, pi2Table);
  const newCat = FinSet(extendedObjs, [...oldGens, pi1, pi2]);
  return { obj: prod, pi1, pi2, cat: newCat };
}

/**
 * Coproducto binario en FinSet: unión disjunta A⊔B. Usa prefijos
 * `L:` y `R:` para tag-ear los elementos y produce las inyecciones
 * canónicas in1, in2.
 */
export function coproduct(
  cat: Category<FinSetObj, FinSetMor>,
  a: FinSetObj,
  b: FinSetObj,
): { obj: FinSetObj; in1: FinSetMor; in2: FinSetMor; cat: Category<FinSetObj, FinSetMor> } | null {
  if (!cat.objects.has(a) || !cat.objects.has(b)) return null;
  const elements: string[] = [];
  const in1Table: Record<string, string> = {};
  const in2Table: Record<string, string> = {};
  for (const x of a.elements) {
    const tag = `L:${x}`;
    elements.push(tag);
    in1Table[x] = tag;
  }
  for (const y of b.elements) {
    const tag = `R:${y}`;
    elements.push(tag);
    in2Table[y] = tag;
  }
  const cop: FinSetObj = { name: `${a.name}⊔${b.name}`, elements };
  const extendedObjs = [...cat.objects, cop];
  const oldGens = Array.from(cat.morphisms.values()).filter((m) => !m.id.endsWith(':id'));
  const in1 = mkFinSetMor('in1', a, cop, in1Table);
  const in2 = mkFinSetMor('in2', b, cop, in2Table);
  const newCat = FinSet(extendedObjs, [...oldGens, in1, in2]);
  return { obj: cop, in1, in2, cat: newCat };
}

/**
 * Igualador en FinSet de un par paralelo `f, g : A → B`. El igualador
 * es el subconjunto `E = { x ∈ A | f(x) = g(x) }` con inclusión `eq : E ↪ A`.
 */
export function equalizer(
  cat: Category<FinSetObj, FinSetMor>,
  f: FinSetMor,
  g: FinSetMor,
): { obj: FinSetObj; eq: FinSetMor; cat: Category<FinSetObj, FinSetMor> } | null {
  if (f.src !== g.src || f.tgt !== g.tgt) return null;
  const aObj = Array.from(cat.objects).find((o) => o.name === f.src);
  if (!aObj) return null;
  const elements: string[] = [];
  const eqTable: Record<string, string> = {};
  for (const x of aObj.elements) {
    if (f.fn.get(x) === g.fn.get(x)) {
      elements.push(x);
      eqTable[x] = x;
    }
  }
  const eObj: FinSetObj = { name: `Eq(${f.id},${g.id})`, elements };
  const extendedObjs = [...cat.objects, eObj];
  const oldGens = Array.from(cat.morphisms.values()).filter((m) => !m.id.endsWith(':id'));
  const eq = mkFinSetMor('eq', eObj, aObj, eqTable);
  const newCat = FinSet(extendedObjs, [...oldGens, eq]);
  return { obj: eObj, eq, cat: newCat };
}

/**
 * Coigualador (colimite dual): cociente A/~ donde x ~ y si existe
 * z ∈ S con f(z)=x ∧ g(z)=y (cierre transitivo-simétrico).
 */
export function coequalizer(
  cat: Category<FinSetObj, FinSetMor>,
  f: FinSetMor,
  g: FinSetMor,
): { obj: FinSetObj; q: FinSetMor; cat: Category<FinSetObj, FinSetMor> } | null {
  if (f.src !== g.src || f.tgt !== g.tgt) return null;
  const aObj = Array.from(cat.objects).find((o) => o.name === f.src);
  const bObj = Array.from(cat.objects).find((o) => o.name === f.tgt);
  if (!aObj || !bObj) return null;
  // Union-find sobre elementos de B
  const parent = new Map<string, string>();
  for (const y of bObj.elements) parent.set(y, y);
  function find(x: string): string {
    let p = parent.get(x) ?? x;
    while (parent.get(p) !== undefined && p !== parent.get(p)) p = parent.get(p) ?? p;
    parent.set(x, p);
    return p;
  }
  function union(x: string, y: string): void {
    const px = find(x);
    const py = find(y);
    if (px !== py) parent.set(px, py);
  }
  for (const z of aObj.elements) {
    const fz = f.fn.get(z);
    const gz = g.fn.get(z);
    if (fz !== undefined && gz !== undefined) union(fz, gz);
  }
  // Clases canónicas
  const reps = new Set<string>();
  for (const y of bObj.elements) reps.add(find(y));
  const elements = Array.from(reps).sort();
  const qTable: Record<string, string> = {};
  for (const y of bObj.elements) qTable[y] = find(y);
  const cObj: FinSetObj = { name: `Coeq(${f.id},${g.id})`, elements };
  const extendedObjs = [...cat.objects, cObj];
  const oldGens = Array.from(cat.morphisms.values()).filter((m) => !m.id.endsWith(':id'));
  const q = mkFinSetMor('q', bObj, cObj, qTable);
  const newCat = FinSet(extendedObjs, [...oldGens, q]);
  return { obj: cObj, q, cat: newCat };
}
