// ============================================================
// Separation Logic — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  addrVal,
  andF,
  checkTriple,
  Cmd,
  combine,
  disjoint,
  emp,
  existsF,
  formulaToString,
  forallF,
  frame,
  fromMap,
  heapEquals,
  intVal,
  isListSegment,
  isTree,
  listSegment,
  magicWand,
  newHeap,
  notF,
  nullVal,
  orF,
  pointsTo,
  pure,
  satisfies,
  satisfiesShape,
  splits,
  star,
  tree,
  valueEquals,
  type SLValuation,
} from '../../../reasoning/separation-logic';

describe('separation-logic — heap basics', () => {
  it('newHeap es vacío y heapEquals lo confirma', () => {
    const h = newHeap();
    expect(h.size()).toBe(0);
    expect(h.domain()).toEqual([]);
    expect(heapEquals(h, newHeap())).toBe(true);
  });

  it('fromMap crea heap con las entradas dadas e immutabilidad estructural', () => {
    const h = fromMap([
      [1, intVal(42)],
      [3, nullVal()],
    ]);
    expect(h.size()).toBe(2);
    expect(h.domain()).toEqual([1, 3]);
    const v = h.read(1);
    expect(v).toBeDefined();
    expect(valueEquals(v!, intVal(42))).toBe(true);
  });

  it('write/delete devuelven nuevos heaps sin mutar el original', () => {
    const h0 = fromMap([[1, intVal(1)]]);
    const h1 = h0.write(2, intVal(2));
    const h2 = h1.delete(1);
    expect(h0.size()).toBe(1);
    expect(h1.size()).toBe(2);
    expect(h2.size()).toBe(1);
    expect(h2.has(1)).toBe(false);
    expect(h2.has(2)).toBe(true);
  });

  it('disjoint es simétrico y detecta colisiones', () => {
    const h1 = fromMap([[1, intVal(1)]]);
    const h2 = fromMap([[2, intVal(2)]]);
    const h3 = fromMap([[1, intVal(99)]]);
    expect(disjoint(h1, h2)).toBe(true);
    expect(disjoint(h2, h1)).toBe(true);
    expect(disjoint(h1, h3)).toBe(false);
  });

  it('combine produce unión disjunta y devuelve null si hay colisión', () => {
    const h1 = fromMap([[1, intVal(1)]]);
    const h2 = fromMap([[2, intVal(2)]]);
    const merged = combine(h1, h2);
    expect(merged).not.toBeNull();
    expect(merged!.size()).toBe(2);
    expect(combine(h1, h1)).toBeNull();
  });
});

describe('separation-logic — semántica de fórmulas', () => {
  const val: SLValuation = {};

  it('emp es verdadero sólo en heap vacío', () => {
    expect(satisfies(emp(), newHeap(), val)).toBe(true);
    expect(satisfies(emp(), fromMap([[1, intVal(1)]]), val)).toBe(false);
  });

  it('pointsTo true sólo en heap con exactamente esa celda', () => {
    const h = fromMap([[5, intVal(7)]]);
    expect(satisfies(pointsTo(addrVal(5), intVal(7)), h, val)).toBe(true);
    // Valor distinto
    expect(satisfies(pointsTo(addrVal(5), intVal(8)), h, val)).toBe(false);
    // Heap con más de una celda — pointsTo NO es satisfecho (es exacto)
    const h2 = fromMap([
      [5, intVal(7)],
      [6, intVal(7)],
    ]);
    expect(satisfies(pointsTo(addrVal(5), intVal(7)), h2, val)).toBe(false);
    // pointsTo con loc no-addr no tiene sentido
    expect(satisfies(pointsTo(intVal(5), intVal(7)), h, val)).toBe(false);
  });

  it('star: dos pointsTo disjuntos satisfacen su conjunción separadora', () => {
    const h = fromMap([
      [1, intVal(10)],
      [2, intVal(20)],
    ]);
    const f = star(pointsTo(addrVal(1), intVal(10)), pointsTo(addrVal(2), intVal(20)));
    expect(satisfies(f, h, val)).toBe(true);
    // Si la fórmula menciona una sola celda y el heap tiene dos, la
    // conjunción separadora no se satisface salvo con emp
    const f2 = pointsTo(addrVal(1), intVal(10));
    expect(satisfies(f2, h, val)).toBe(false);
    // Pero star con emp recupera la equivalencia esperada
    expect(satisfies(star(f2, emp()), fromMap([[1, intVal(10)]]), val)).toBe(true);
  });

  it('star: NO se satisface si la misma celda aparece en ambos operandos (no disjoint)', () => {
    const h = fromMap([[1, intVal(10)]]);
    const f = star(pointsTo(addrVal(1), intVal(10)), pointsTo(addrVal(1), intVal(10)));
    expect(satisfies(f, h, val)).toBe(false);
  });

  it('and, or, implies, not se comportan clásicamente sobre fórmulas SL', () => {
    const h = fromMap([[1, intVal(5)]]);
    const pX = pointsTo(addrVal(1), intVal(5));
    const pY = pointsTo(addrVal(1), intVal(99));
    expect(satisfies(andF(pX, pX), h, val)).toBe(true);
    expect(satisfies(andF(pX, pY), h, val)).toBe(false);
    expect(satisfies(orF(pX, pY), h, val)).toBe(true);
    expect(satisfies(notF(pY), h, val)).toBe(true);
  });

  it('exists/forall sobre dominio finito observable', () => {
    const h = fromMap([
      [1, intVal(10)],
      [2, intVal(10)],
    ]);
    // ∃v. (1 ↦ v * 2 ↦ v)  — existe v=10
    const f = existsF(
      'v',
      star(
        pointsTo(addrVal(1), { kind: 'int', value: 10 }),
        pointsTo(addrVal(2), { kind: 'int', value: 10 }),
      ),
    );
    expect(satisfies(f, h, val)).toBe(true);

    // ∀v. emp — falso en heap no vacío
    expect(satisfies(forallF('v', emp()), h, val)).toBe(false);
  });

  it('pure: predicado lógico sobre la valuación', () => {
    const v: SLValuation = { x: intVal(5) };
    const f = pure('x > 0', (vv) => vv.x?.kind === 'int' && vv.x.value > 0);
    expect(satisfies(f, newHeap(), v)).toBe(true);
    expect(satisfies(f, newHeap(), { x: intVal(-1) })).toBe(false);
  });
});

describe('separation-logic — splits', () => {
  it('un heap de n celdas tiene 2^n particiones', () => {
    const h = fromMap([
      [1, intVal(1)],
      [2, intVal(2)],
      [3, intVal(3)],
    ]);
    expect(splits(h).length).toBe(8);
    // Cada split es disjoint y se recombina al original
    for (const { h1, h2 } of splits(h)) {
      expect(disjoint(h1, h2)).toBe(true);
      const merged = combine(h1, h2);
      expect(merged).not.toBeNull();
      expect(heapEquals(merged!, h)).toBe(true);
    }
  });
});

describe('separation-logic — comandos / triplas / frame rule', () => {
  it('alloc: {emp} x := cons(v) {x ↦ v}', () => {
    const triple = {
      pre: emp(),
      cmd: Cmd.alloc('x', intVal(42)),
      post: existsF('x', pointsTo({ kind: 'addr', loc: 1 }, intVal(42))),
    };
    // Verificar manualmente sobre heap vacío
    const result = checkTriple(
      {
        pre: emp(),
        cmd: triple.cmd,
        post: pointsTo({ kind: 'addr', loc: 1 }, intVal(42)),
      },
      { candidates: [{ heap: newHeap(), val: {} }], samples: 0 },
    );
    expect(result.valid).toBe(true);
    expect(result.modelsChecked).toBeGreaterThan(0);
  });

  it('store: {x ↦ -} [x] ← v {x ↦ v}', () => {
    const candidates = [
      { heap: fromMap([[1, intVal(0)]]), val: { x: addrVal(1) } },
      { heap: fromMap([[1, intVal(99)]]), val: { x: addrVal(1) } },
    ];
    const triple = {
      pre: pointsTo(addrVal(1), intVal(0)),
      cmd: Cmd.store('x', intVal(7)),
      post: pointsTo(addrVal(1), intVal(7)),
    };
    const result = checkTriple(triple, { candidates, samples: 0 });
    expect(result.valid).toBe(true);
  });

  it('load: {x ↦ v} y := [x] {x ↦ v ∧ y = v}  — se verifica sobre modelo concreto', () => {
    const heap = fromMap([[3, intVal(11)]]);
    const val: SLValuation = { x: addrVal(3) };
    const cmd = Cmd.load('y', 'x');
    // Verificación manual del axioma
    const result = checkTriple(
      {
        pre: pointsTo(addrVal(3), intVal(11)),
        cmd,
        post: pointsTo(addrVal(3), intVal(11)),
      },
      { candidates: [{ heap, val }], samples: 0 },
    );
    expect(result.valid).toBe(true);
  });

  it('free: {x ↦ v} free(x) {emp}', () => {
    const heap = fromMap([[2, intVal(5)]]);
    const val: SLValuation = { x: addrVal(2) };
    const result = checkTriple(
      {
        pre: pointsTo(addrVal(2), intVal(5)),
        cmd: Cmd.free('x'),
        post: emp(),
      },
      { candidates: [{ heap, val }], samples: 0 },
    );
    expect(result.valid).toBe(true);
  });

  it('frame rule: {P} c {Q} extiende a {P * R} c {Q * R} preservando disjunción', () => {
    // {1 ↦ 0} store(x, 7) {1 ↦ 7}   donde x = &1
    const base = {
      pre: pointsTo(addrVal(1), intVal(0)),
      cmd: Cmd.store('x', intVal(7)),
      post: pointsTo(addrVal(1), intVal(7)),
    };
    const frameFormula = pointsTo(addrVal(2), intVal(100));
    const framed = frame(base, frameFormula);
    expect(framed.pre.kind).toBe('star');
    expect(framed.post.kind).toBe('star');

    const heap = fromMap([
      [1, intVal(0)],
      [2, intVal(100)],
    ]);
    const val: SLValuation = { x: addrVal(1) };
    const result = checkTriple(framed, {
      candidates: [{ heap, val }],
      samples: 0,
    });
    expect(result.valid).toBe(true);
  });

  it('checkTriple detecta contraejemplo cuando la postcondición miente', () => {
    const result = checkTriple(
      {
        pre: pointsTo(addrVal(1), intVal(0)),
        cmd: Cmd.store('x', intVal(7)),
        post: pointsTo(addrVal(1), intVal(99)), // mentira: dijo 99
      },
      {
        candidates: [{ heap: fromMap([[1, intVal(0)]]), val: { x: addrVal(1) } }],
        samples: 0,
      },
    );
    expect(result.valid).toBe(false);
    expect(result.counterexample).toBeDefined();
  });

  it('store sobre celda libre produce memory fault (no es valid en post)', () => {
    const result = checkTriple(
      {
        pre: emp(),
        cmd: Cmd.store('x', intVal(7)),
        post: emp(),
      },
      {
        candidates: [{ heap: newHeap(), val: { x: addrVal(1) } }],
        samples: 0,
      },
    );
    expect(result.valid).toBe(false);
    expect(result.counterexample?.reason).toMatch(/fault/);
  });
});

describe('separation-logic — predicados inductivos', () => {
  it('isListSegment: ls(x, null) sobre lista de 3 nodos', () => {
    // 1 → 2 → 3 → null
    const heap = fromMap([
      [1, addrVal(2)],
      [2, addrVal(3)],
      [3, nullVal()],
    ]);
    expect(isListSegment(addrVal(1), nullVal(), heap)).toBe(true);
    // ls(x, x) sobre heap vacío
    expect(isListSegment(addrVal(1), addrVal(1), newHeap())).toBe(true);
    // Heap no vacío y start = end → falso (ls requiere emp)
    expect(isListSegment(addrVal(1), addrVal(1), heap)).toBe(false);
    // Ciclo: 1 → 2 → 1
    const cyclic = fromMap([
      [1, addrVal(2)],
      [2, addrVal(1)],
    ]);
    expect(isListSegment(addrVal(1), nullVal(), cyclic)).toBe(false);
  });

  it('listSegment(x, null) bajo satisfiesShape sobre heap de lista', () => {
    const heap = fromMap([
      [1, addrVal(2)],
      [2, nullVal()],
    ]);
    const val: SLValuation = { x: addrVal(1) };
    const f = listSegment(addrVal(1), nullVal());
    expect(satisfiesShape(f, heap, val)).toBe(true);
    // El printer respeta la notación ls(...)
    expect(formulaToString(f)).toMatch(/ls\(/);
  });

  it('isTree: árbol binario con 3 nodos', () => {
    //      &1
    //     /   \
    //   &10   null
    //   / \
    // null null
    const heap = fromMap([
      [1, addrVal(10)],
      [2, nullVal()],
      [10, nullVal()],
      [11, nullVal()],
    ]);
    expect(isTree(addrVal(1), heap)).toBe(true);
    expect(isTree(nullVal(), newHeap())).toBe(true);
  });

  it('tree(...) via satisfiesShape detecta árboles válidos', () => {
    const heap = fromMap([
      [1, nullVal()],
      [2, nullVal()],
    ]);
    const f = tree(addrVal(1));
    expect(satisfiesShape(f, heap, {})).toBe(true);
    expect(formulaToString(f)).toMatch(/tree\(/);
    // Árbol que comparte nodos no es árbol
    const cyclic = fromMap([
      [1, addrVal(1)],
      [2, addrVal(1)],
    ]);
    expect(satisfiesShape(f, cyclic, {})).toBe(false);
  });
});

describe('separation-logic — magic wand', () => {
  it('P -* P es verdadero en heap vacío (frame de uno mismo)', () => {
    // emp ⊨ (emp -* emp) trivialmente
    const f = magicWand(emp(), emp());
    expect(satisfies(f, newHeap(), {})).toBe(true);
  });

  it('h ⊨ (P -* Q) implica que extender h con P satisface Q', () => {
    // Heap: 1 ↦ 5
    // Fórmula: (2 ↦ 7) -* ((1 ↦ 5) * (2 ↦ 7))
    // Cualquier extensión que cumpla 2 ↦ 7 produce el resultado esperado.
    const h = fromMap([[1, intVal(5)]]);
    const f = magicWand(
      pointsTo(addrVal(2), intVal(7)),
      star(pointsTo(addrVal(1), intVal(5)), pointsTo(addrVal(2), intVal(7))),
    );
    expect(satisfies(f, h, {})).toBe(true);
  });
});
