import { describe, it, expect } from 'vitest';
import {
  inverse,
  reduceWord,
  multiplyWords,
  invertWord,
  wordEquals,
  isReduced,
  parseWord,
  wordToString,
  toddCoxeter,
  groupOrder,
  isInSubgroup,
  cyclicGroupZn,
  dihedralGroupDn,
  freeGroupFn,
  symmetricGroupSn,
  cayleyGraph,
} from '../../../reasoning/group-presentation';

describe('Group Presentation — palabras y reducción libre', () => {
  it('inverse intercambia caja a↔A, r↔R', () => {
    expect(inverse('a')).toBe('A');
    expect(inverse('A')).toBe('a');
    expect(inverse('r')).toBe('R');
    expect(inverse('R')).toBe('r');
  });

  it('reduceWord cancela pares adyacentes inverso-mutuos', () => {
    expect(reduceWord(['a', 'b', 'B', 'a'])).toEqual(['a', 'a']);
    expect(reduceWord(['A', 'a', 'b'])).toEqual(['b']);
    expect(reduceWord(['a', 'A'])).toEqual([]);
    expect(reduceWord([])).toEqual([]);
  });

  it('reduceWord es idempotente y elimina cascadas', () => {
    // a b B A → ε (cancelaciones encadenadas)
    expect(reduceWord(['a', 'b', 'B', 'A'])).toEqual([]);
    // a a b B A A → ε  (a²b · b⁻¹ · a⁻² )
    expect(reduceWord(['a', 'a', 'b', 'B', 'A', 'A'])).toEqual([]);
  });

  it('multiplyWords concatena y reduce', () => {
    expect(multiplyWords(['a', 'b'], ['B', 'a'])).toEqual(['a', 'a']);
    expect(multiplyWords([], ['a'])).toEqual(['a']);
    expect(multiplyWords(['a'], ['A'])).toEqual([]);
  });

  it('invertWord invierte y aplica inverso a cada letra', () => {
    expect(invertWord(['a', 'b', 'A'])).toEqual(['a', 'B', 'A']);
    expect(invertWord([])).toEqual([]);
    // (w · w⁻¹) reduce a ε
    const w = ['a', 'b', 'c', 'A'];
    expect(multiplyWords(w, invertWord(w))).toEqual([]);
  });

  it('wordEquals compara sintácticamente', () => {
    expect(wordEquals(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(wordEquals(['a', 'b'], ['a', 'B'])).toBe(false);
    expect(wordEquals([], [])).toBe(true);
    expect(wordEquals(['a'], ['a', 'b'])).toBe(false);
  });

  it('isReduced detecta y rechaza cancelaciones pendientes', () => {
    expect(isReduced(['a', 'b'])).toBe(true);
    expect(isReduced(['a', 'A'])).toBe(false);
    expect(isReduced(['a', 'b', 'B'])).toBe(false);
    expect(isReduced([])).toBe(true);
  });

  it('parseWord y wordToString son inversas', () => {
    expect(parseWord('abAb')).toEqual(['a', 'b', 'A', 'b']);
    expect(wordToString(['a', 'b', 'A', 'b'])).toBe('abAb');
    expect(wordToString([])).toBe('1');
  });
});

describe('Group Presentation — Todd-Coxeter coset enumeration', () => {
  it('cyclicGroupZn(5) tiene orden 5', () => {
    expect(groupOrder(cyclicGroupZn(5))).toBe(5);
  });

  it('cyclicGroupZn(1) es trivial: orden 1', () => {
    expect(groupOrder(cyclicGroupZn(1))).toBe(1);
  });

  it('cyclicGroupZn(7) — primo: orden 7', () => {
    expect(groupOrder(cyclicGroupZn(7))).toBe(7);
  });

  it('dihedralGroupDn(3) tiene orden 6 (≅ S_3)', () => {
    expect(groupOrder(dihedralGroupDn(3))).toBe(6);
  });

  it('dihedralGroupDn(4) tiene orden 8', () => {
    expect(groupOrder(dihedralGroupDn(4))).toBe(8);
  });

  it('dihedralGroupDn(5) tiene orden 10', () => {
    expect(groupOrder(dihedralGroupDn(5))).toBe(10);
  });

  it('grupo libre F_2 tiene orden infinito', () => {
    expect(groupOrder(freeGroupFn(2))).toBe('infinite');
  });

  it('grupo libre F_1 tiene orden infinito', () => {
    expect(groupOrder(freeGroupFn(1))).toBe('infinite');
  });

  it('grupo trivial ⟨ | ⟩ tiene orden 1', () => {
    expect(groupOrder({ generators: [], relations: [] })).toBe(1);
  });

  it('S_3 vía symmetricGroupSn(3) tiene orden 6', () => {
    expect(groupOrder(symmetricGroupSn(3))).toBe(6);
  });

  it('S_4 vía symmetricGroupSn(4) tiene orden 24', () => {
    expect(groupOrder(symmetricGroupSn(4), 256)).toBe(24);
  });

  it('Klein four-group ⟨a,b | a², b², (ab)²⟩ tiene orden 4', () => {
    const klein = {
      generators: ['a', 'b'],
      relations: [
        ['a', 'a'],
        ['b', 'b'],
        ['a', 'b', 'a', 'b'],
      ],
    };
    expect(groupOrder(klein)).toBe(4);
  });

  it('cap maxCosets demasiado bajo en F_2 devuelve unknown', () => {
    // F_2 es infinito; con maxCosets=10, Todd-Coxeter no termina,
    // aunque la rama 'infinite' lo detecta antes por ausencia de
    // relaciones. Forzamos relación trivial para evitar el shortcut.
    const almostFree = {
      generators: ['a', 'b'],
      relations: [['a', 'A']], // relación trivialmente reducible a vacío
    };
    // Como la relación reduce a ε, sigue siendo libre → 'infinite' por shortcut.
    // Para forzar 'unknown' añadimos una relación no-trivial que no acote rápido:
    const slow = {
      generators: ['a', 'b'],
      relations: [['a', 'b', 'A', 'B']], // commutator → Z²; con cap chico no termina
    };
    // Z² es infinito; cap pequeño da 'unknown'.
    expect(groupOrder(slow, 8)).toBe('unknown');
    // El caso almostFree mantiene la rama 'infinite'.
    expect(groupOrder(almostFree)).toBe('infinite');
  });
});

describe('Group Presentation — tabla de cosets y subgrupos', () => {
  it('toddCoxeter sobre Z_6 produce 6 cosets', () => {
    const t = toddCoxeter(cyclicGroupZn(6));
    expect(t).not.toBe('incomplete');
    if (t === 'incomplete') return;
    expect(t.numCosets).toBe(6);
  });

  it('isInSubgroup: ⟨a²⟩ en Z_6 tiene índice 2 (Lagrange: |Z_6|/|⟨a²⟩|=6/3=2)', () => {
    const z6 = cyclicGroupZn(6);
    const t = toddCoxeter(z6, [['a', 'a']]);
    expect(t).not.toBe('incomplete');
    if (t === 'incomplete') return;
    expect(t.numCosets).toBe(2);
    // a² ∈ ⟨a²⟩
    expect(isInSubgroup(['a', 'a'], t)).toBe(true);
    // a ∉ ⟨a²⟩
    expect(isInSubgroup(['a'], t)).toBe(false);
    // a⁴ ∈ ⟨a²⟩
    expect(isInSubgroup(['a', 'a', 'a', 'a'], t)).toBe(true);
  });

  it('isInSubgroup: ⟨a³⟩ en Z_6 tiene índice 3 (Lagrange: 6/2=3)', () => {
    const z6 = cyclicGroupZn(6);
    const t = toddCoxeter(z6, [['a', 'a', 'a']]);
    expect(t).not.toBe('incomplete');
    if (t === 'incomplete') return;
    expect(t.numCosets).toBe(3);
    // a³ ∈ ⟨a³⟩
    expect(isInSubgroup(['a', 'a', 'a'], t)).toBe(true);
    // a ∉ ⟨a³⟩
    expect(isInSubgroup(['a'], t)).toBe(false);
  });

  it('isInSubgroup: ε siempre está en cualquier subgrupo', () => {
    const t = toddCoxeter(cyclicGroupZn(4));
    expect(t).not.toBe('incomplete');
    if (t === 'incomplete') return;
    expect(isInSubgroup([], t)).toBe(true);
  });
});

describe('Group Presentation — Cayley graph', () => {
  it('grafo de Cayley de Z_4 tiene 4 vértices y 4 aristas con un generador', () => {
    const t = toddCoxeter(cyclicGroupZn(4));
    expect(t).not.toBe('incomplete');
    if (t === 'incomplete') return;
    const g = cayleyGraph(t);
    expect(g.vertices.length).toBe(4);
    expect(g.edges.length).toBe(4); // solo el generador positivo 'a'
    // Cada vértice tiene exactamente una arista saliente con 'a'.
    const out = new Map<number, number>();
    for (const [v, ,] of g.edges) {
      out.set(v, (out.get(v) ?? 0) + 1);
    }
    for (const v of g.vertices) {
      expect(out.get(v)).toBe(1);
    }
  });

  it('grafo de Cayley de D_3 tiene 6 vértices y 12 aristas (2 generadores)', () => {
    const t = toddCoxeter(dihedralGroupDn(3));
    expect(t).not.toBe('incomplete');
    if (t === 'incomplete') return;
    const g = cayleyGraph(t);
    expect(g.vertices.length).toBe(6);
    expect(g.edges.length).toBe(12); // 6 vértices × 2 generadores positivos
  });

  it('grafo de Cayley del grupo trivial tiene 1 vértice', () => {
    const t = toddCoxeter({ generators: ['a'], relations: [['a']] });
    expect(t).not.toBe('incomplete');
    if (t === 'incomplete') return;
    const g = cayleyGraph(t);
    expect(g.vertices.length).toBe(1);
    // El bucle a: 1 → 1 cuenta como una arista.
    expect(g.edges.length).toBe(1);
  });
});

describe('Group Presentation — más familias clásicas', () => {
  it('Z_2 × Z_2 (Klein) usando otra presentación', () => {
    // ⟨a, b | a², b², ab=ba⟩  ↔  conmutador [a,b]=1
    const v4 = {
      generators: ['a', 'b'],
      relations: [
        ['a', 'a'],
        ['b', 'b'],
        ['a', 'b', 'A', 'B'], // [a,b] = 1
      ],
    };
    expect(groupOrder(v4)).toBe(4);
  });

  it('grupo cuaternio Q_8: ⟨a,b | a⁴, a²b⁻², bab⁻¹a⟩ tiene orden 8', () => {
    // Presentación clásica: a^4 = 1, a^2 = b^2, b a b^{-1} = a^{-1}
    // → relaciones a^4, a^2 b^{-2}, b a b^{-1} a
    const q8 = {
      generators: ['a', 'b'],
      relations: [
        ['a', 'a', 'a', 'a'],
        ['a', 'a', 'B', 'B'],
        ['b', 'a', 'B', 'a'],
      ],
    };
    expect(groupOrder(q8, 128)).toBe(8);
  });

  it('D_2 = Z_2 × Z_2 (Klein) tiene orden 4', () => {
    expect(groupOrder(dihedralGroupDn(2))).toBe(4);
  });
});
