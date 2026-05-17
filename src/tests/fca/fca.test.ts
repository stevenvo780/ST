import { describe, it, expect } from 'vitest';
import {
  createContext,
  derivativeObjects,
  derivativeAttributes,
  isConcept,
  closeIntent,
  allConcepts,
  lattice,
  impliesAll,
} from '../../runtime/fca';
import type { FormalConcept } from '../../runtime/fca';

function set<T>(...xs: T[]): Set<T> {
  return new Set(xs);
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * Contexto "living beings" clásico de la literatura (Ganter & Wille, simplificado).
 * 4 objetos × 4 atributos:
 *               needs-water  lives-in-water  lives-on-land  has-leaves
 *   fish-leech      X             X
 *   bream           X             X
 *   reed            X             X              X            X
 *   bean            X                            X            X
 *
 * Conceptos esperados (clausuras de intents):
 *   ∅            (lectic 1st) → intent = closeIntent(∅) = {needs-water}
 *                                       (todos comparten needs-water)
 *   {fish-leech, bream, reed} → intent {needs-water, lives-in-water}
 *   {reed}                    → intent {needs-water, lives-in-water,
 *                                       lives-on-land, has-leaves}
 *   {reed, bean}              → intent {needs-water, lives-on-land, has-leaves}
 *   {fish-leech,bream,reed,bean} top → {needs-water}
 *   etc.
 * El número exacto se calcula vía allConcepts (lo verificamos con el código).
 */
function livingBeingsContext() {
  return createContext(
    ['fish-leech', 'bream', 'reed', 'bean'],
    ['needs-water', 'lives-in-water', 'lives-on-land', 'has-leaves'],
    [
      ['fish-leech', 'needs-water'],
      ['fish-leech', 'lives-in-water'],
      ['bream', 'needs-water'],
      ['bream', 'lives-in-water'],
      ['reed', 'needs-water'],
      ['reed', 'lives-in-water'],
      ['reed', 'lives-on-land'],
      ['reed', 'has-leaves'],
      ['bean', 'needs-water'],
      ['bean', 'lives-on-land'],
      ['bean', 'has-leaves'],
    ],
  );
}

describe('FCA — createContext y operadores polares de Galois', () => {
  it('rechaza identificadores con el separador reservado "|"', () => {
    expect(() => createContext(['a|b'], ['m'], [])).toThrow(/separador/);
    expect(() => createContext(['a'], ['m|n'], [])).toThrow(/separador/);
  });

  it('rechaza objetos o atributos duplicados', () => {
    expect(() => createContext(['a', 'a'], ['m'], [])).toThrow(/duplicado/);
    expect(() => createContext(['a'], ['m', 'm'], [])).toThrow(/duplicado/);
  });

  it('rechaza incidencias hacia objetos o atributos no declarados', () => {
    expect(() => createContext(['a'], ['m'], [['a', 'x']])).toThrow(/atributo/);
    expect(() => createContext(['a'], ['m'], [['z', 'm']])).toThrow(/objeto/);
  });

  it('derivativeObjects({}) = G (convención: ∀ trivial sobre conjunto vacío)', () => {
    const K = livingBeingsContext();
    const G = derivativeObjects(K, set<string>());
    expect(setsEqual(G, set('fish-leech', 'bream', 'reed', 'bean'))).toBe(true);
  });

  it('derivativeAttributes({}) = M', () => {
    const K = livingBeingsContext();
    const M = derivativeAttributes(K, set<string>());
    expect(setsEqual(M, set('needs-water', 'lives-in-water', 'lives-on-land', 'has-leaves'))).toBe(
      true,
    );
  });

  it('derivativeObjects: {lives-in-water} → {fish-leech, bream, reed}', () => {
    const K = livingBeingsContext();
    const r = derivativeObjects(K, set('lives-in-water'));
    expect(setsEqual(r, set('fish-leech', 'bream', 'reed'))).toBe(true);
  });

  it('derivativeAttributes: {reed, bean} → {needs-water, lives-on-land, has-leaves}', () => {
    const K = livingBeingsContext();
    const r = derivativeAttributes(K, set('reed', 'bean'));
    expect(setsEqual(r, set('needs-water', 'lives-on-land', 'has-leaves'))).toBe(true);
  });
});

describe('FCA — clausura Galois e isConcept', () => {
  it('closeIntent es idempotente: closure(closure(B)) = closure(B)', () => {
    const K = livingBeingsContext();
    const seeds: Array<Set<string>> = [
      set(),
      set('needs-water'),
      set('lives-in-water'),
      set('has-leaves'),
      set('lives-on-land', 'has-leaves'),
      set('needs-water', 'lives-in-water', 'lives-on-land', 'has-leaves'),
    ];
    for (const s of seeds) {
      const c1 = closeIntent(K, s);
      const c2 = closeIntent(K, c1);
      expect(setsEqual(c1, c2)).toBe(true);
    }
  });

  it('closeIntent extiende el seed (B ⊆ B" siempre)', () => {
    const K = livingBeingsContext();
    const seed = set('lives-in-water');
    const closed = closeIntent(K, seed);
    for (const m of seed) expect(closed.has(m)).toBe(true);
  });

  it('isConcept reconoce ({reed}, {needs-water, lives-in-water, lives-on-land, has-leaves})', () => {
    const K = livingBeingsContext();
    expect(
      isConcept(
        K,
        set('reed'),
        set('needs-water', 'lives-in-water', 'lives-on-land', 'has-leaves'),
      ),
    ).toBe(true);
  });

  it('isConcept rechaza pares no-cerrados', () => {
    const K = livingBeingsContext();
    // intent incompleto: {reed} en realidad determina los 4 atributos, no 1.
    expect(isConcept(K, set('reed'), set('needs-water'))).toBe(false);
    // extent incompleto: {needs-water, lives-in-water}' = {fish-leech, bream, reed},
    // no {fish-leech} solo.
    expect(isConcept(K, set('fish-leech'), set('needs-water', 'lives-in-water'))).toBe(false);
  });
});

describe('FCA — allConcepts (Next Closure, Ganter)', () => {
  it('contexto living-beings: genera los conceptos esperados sin duplicados', () => {
    const K = livingBeingsContext();
    const cs = allConcepts(K);

    // Sin duplicados (intents únicos como firma).
    const intentSignatures = new Set(cs.map((c) => [...c.intent].sort().join(',')));
    expect(intentSignatures.size).toBe(cs.length);

    // Cada par devuelto cumple A' = B y B' = A.
    for (const c of cs) {
      expect(isConcept(K, c.extent, c.intent)).toBe(true);
    }

    // Top concept (extent = G) presente: intent = atributos comunes a todos = {needs-water}.
    const top = cs.find((c) => c.extent.size === 4);
    expect(top).toBeDefined();
    expect(setsEqual(top!.intent, set('needs-water'))).toBe(true);

    // Bottom concept (intent = M = los 4 atrs) presente:
    // como `reed` posee los 4 atributos, su extent es {reed}, no ∅.
    const bottom = cs.find((c) => c.intent.size === 4);
    expect(bottom).toBeDefined();
    expect(setsEqual(bottom!.extent, set('reed'))).toBe(true);

    // Concepto ({reed}, los 4 atrs) ES el bottom: lo verificamos por separado
    // mirando que es el único concepto con extent={reed}.
    const reedOnly = cs.find((c) => c.extent.size === 1 && c.extent.has('reed'));
    expect(reedOnly).toBeDefined();
    expect(reedOnly!.intent.size).toBe(4);

    // Enumeración manual del lattice:
    //   1. (G,                     {needs-water})                        — top
    //   2. ({fl, br, reed},        {needs-water, lives-in-water})
    //   3. ({reed, bean},          {needs-water, lives-on-land, has-leaves})
    //   4. ({reed},                M)                                    — bottom
    // Más: ({bean}, {nw, lol, hl})? No: {bean}' = {nw, lol, hl}, pero
    //   {nw, lol, hl}' = {reed, bean}, no {bean} — no es concepto.
    // 4 conceptos cerrados en este lattice (top + 2 intermedios + bottom).
    expect(cs.length).toBe(4);
  });

  it('contexto trivial vacío (sin objetos ni atributos): exactamente 1 concepto (∅, ∅)', () => {
    const K = createContext([], [], []);
    const cs = allConcepts(K);
    expect(cs.length).toBe(1);
    expect(cs[0].extent.size).toBe(0);
    expect(cs[0].intent.size).toBe(0);
  });

  it('contexto con un objeto sin atributos: 2 conceptos (top y bottom degenerados)', () => {
    const K = createContext(['solo'], ['m'], []);
    const cs = allConcepts(K);
    // closeIntent(∅) = ∅'' = ({solo})' = ∅  (solo no tiene atributos)
    //   → concepto top: ({solo}, ∅).
    // Siguiente: closeIntent({m}) = {m}'' = (∅)' = {m}
    //   → concepto bottom: (∅, {m}).
    expect(cs.length).toBe(2);
    const top = cs.find((c) => c.extent.size === 1)!;
    const bot = cs.find((c) => c.extent.size === 0)!;
    expect(setsEqual(top.extent, set('solo'))).toBe(true);
    expect(top.intent.size).toBe(0);
    expect(setsEqual(bot.intent, set('m'))).toBe(true);
  });

  it('contexto discreto (identidad): los closed-intents son {∅, {A}, {B}, {C}, M} → 5 conceptos', () => {
    // n=3: G = {a,b,c}, M = {A,B,C}, I = {(a,A),(b,B),(c,C)}.
    // Cualquier subconjunto de objetos de tamaño ≥ 2 comparte 0 atributos,
    // luego su intent común es ∅, que cierra a ∅ ó a M según el operador
    // doble. Los conjuntos cerrados de atributos son: ∅, {A}, {B}, {C}, M.
    // Esto da 5 conceptos (no 2^3=8: el lattice NO es boolean porque los
    // singletons en M son atómicos y no hay combinaciones intermedias).
    const K = createContext(
      ['a', 'b', 'c'],
      ['A', 'B', 'C'],
      [
        ['a', 'A'],
        ['b', 'B'],
        ['c', 'C'],
      ],
    );
    const cs = allConcepts(K);
    expect(cs.length).toBe(5);
    // Sin duplicados.
    const sigs = new Set(cs.map((c) => [...c.intent].sort().join(',')));
    expect(sigs.size).toBe(5);
  });
});

describe('FCA — lattice (Hasse) y orden por inclusión de extents', () => {
  it('aristas conectan conceptos con extent estrictamente incluido', () => {
    const K = livingBeingsContext();
    const cs = allConcepts(K);
    const H = lattice(cs);

    for (const [i, j] of H.edges) {
      const ci = cs[i];
      const cj = cs[j];
      // Subconjunto estricto: ci.extent ⊊ cj.extent.
      expect(ci.extent.size).toBeLessThan(cj.extent.size);
      for (const o of ci.extent) expect(cj.extent.has(o)).toBe(true);
    }
  });

  it('no hay aristas de cobertura "saltadas" (orden de Hasse mínimo)', () => {
    const K = livingBeingsContext();
    const cs = allConcepts(K);
    const H = lattice(cs);

    // Para cada arista (i, j), no debe existir k distinto con extent_i ⊊ extent_k ⊊ extent_j.
    for (const [i, j] of H.edges) {
      const ei = cs[i].extent;
      const ej = cs[j].extent;
      for (let k = 0; k < cs.length; k++) {
        if (k === i || k === j) continue;
        const ek = cs[k].extent;
        const ekStrictGtEi = ek.size > ei.size && [...ei].every((x) => ek.has(x));
        const ejStrictGtEk = ej.size > ek.size && [...ek].every((x) => ej.has(x));
        expect(ekStrictGtEi && ejStrictGtEk).toBe(false);
      }
    }
  });

  it('lattice del contexto discreto-3: estrella con 6 aristas de cobertura', () => {
    // 5 conceptos: bottom (intent=M, extent=∅) — 3 átomos ({g},{Attr_g}) — top (G,∅).
    // Hasse: bottom cubre los 3 átomos (3 aristas) y los 3 átomos están
    // cubiertos por top (3 aristas). Total = 6.
    const K = createContext(
      ['a', 'b', 'c'],
      ['A', 'B', 'C'],
      [
        ['a', 'A'],
        ['b', 'B'],
        ['c', 'C'],
      ],
    );
    const cs = allConcepts(K);
    const H = lattice(cs);
    expect(H.edges.length).toBe(6);
  });
});

describe('FCA — implicaciones de atributos', () => {
  it('impliesAll: {has-leaves} → {lives-on-land} es válida en living-beings', () => {
    // Todos los objetos con has-leaves (reed, bean) viven en tierra.
    const K = livingBeingsContext();
    expect(impliesAll(K, set('has-leaves'), set('lives-on-land'))).toBe(true);
  });

  it('impliesAll: {lives-in-water} → {has-leaves} es inválida (fish-leech contraejemplo)', () => {
    const K = livingBeingsContext();
    expect(impliesAll(K, set('lives-in-water'), set('has-leaves'))).toBe(false);
  });

  it('impliesAll: {} → {needs-water} es válida (atributo común a todos)', () => {
    const K = livingBeingsContext();
    expect(impliesAll(K, set<string>(), set('needs-water'))).toBe(true);
  });

  it('impliesAll vacua: cualquier premisa → ∅ es válida', () => {
    const K = livingBeingsContext();
    expect(impliesAll(K, set('lives-on-land'), set<string>())).toBe(true);
  });

  it("caracterización extensional: a → b sii a' ⊆ b'", () => {
    const K = livingBeingsContext();
    // a = {lives-on-land}, b = {has-leaves}: ambos tienen extent {reed, bean}.
    // Luego a' = b' y la implicación va en ambos sentidos.
    expect(impliesAll(K, set('lives-on-land'), set('has-leaves'))).toBe(true);
    expect(impliesAll(K, set('has-leaves'), set('lives-on-land'))).toBe(true);

    // Comprobación equivalente con derivativeObjects.
    const aPrime = derivativeObjects(K, set('lives-on-land'));
    const bPrime = derivativeObjects(K, set('has-leaves'));
    expect(setsEqual(aPrime, bPrime)).toBe(true);
  });
});

describe('FCA — concept lattice como retículo completo', () => {
  it('Top concept tiene extent = G y intent = atributos comunes a todos', () => {
    const K = livingBeingsContext();
    const cs = allConcepts(K);
    const top = cs.find((c) => c.extent.size === 4)!;
    expect(setsEqual(top.extent, set('fish-leech', 'bream', 'reed', 'bean'))).toBe(true);
    // En este contexto: needs-water es el único atributo común.
    expect(setsEqual(top.intent, set('needs-water'))).toBe(true);
  });

  it('Bottom concept tiene intent = M; extent = ∅ sólo si ningún objeto los tiene todos', () => {
    // En living-beings, "reed" posee los 4 atributos → bottom = ({reed}, M).
    const K = livingBeingsContext();
    const cs = allConcepts(K);
    const bottom = cs.find((c) => c.intent.size === 4)!;
    expect(setsEqual(bottom.extent, set('reed'))).toBe(true);
    expect(
      setsEqual(bottom.intent, set('needs-water', 'lives-in-water', 'lives-on-land', 'has-leaves')),
    ).toBe(true);

    // Contexto adicional donde nadie tiene todos: ahora sí el extent del bottom es ∅.
    const K2 = createContext(
      ['x', 'y'],
      ['p', 'q'],
      [
        ['x', 'p'],
        ['y', 'q'],
      ],
    );
    const cs2 = allConcepts(K2);
    const bot2 = cs2.find((c) => c.intent.size === 2)!;
    expect(bot2.extent.size).toBe(0);
  });

  it('todos los conceptos son cerrados (verificación cruzada con isConcept)', () => {
    const K = livingBeingsContext();
    const cs: FormalConcept[] = allConcepts(K);
    for (const c of cs) expect(isConcept(K, c.extent, c.intent)).toBe(true);
  });

  it('un objeto pertenece al extent de un concepto sii su intent ⊇ intent del concepto', () => {
    const K = livingBeingsContext();
    const cs = allConcepts(K);
    for (const c of cs) {
      for (const g of c.extent) {
        // Atributos del objeto g: {g}'.
        const gAttrs = derivativeAttributes(K, set(g));
        for (const m of c.intent) expect(gAttrs.has(m)).toBe(true);
      }
    }
  });
});
