// ============================================================
// ST Datalog — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  applySubstitution,
  evaluateBottomUp,
  evaluateStratified,
  isGround,
  isVariable,
  magicSets,
  parseAtom,
  parseRule,
  pathReachability,
  querySLD,
  transitiveClosure,
  unifyAtoms,
  type DatalogAtom,
  type DatalogProgram,
  type StratifiedRule,
} from '../../../reasoning/datalog';

// ── Helpers de tests ─────────────────────────────────────────

function atomKey(a: DatalogAtom): string {
  return `${a.predicate}(${a.args.join(',')})`;
}

function hasAtom(list: DatalogAtom[], pred: string, args: string[]): boolean {
  const key = `${pred}(${args.join(',')})`;
  return list.some((a) => atomKey(a) === key);
}

// ── Parser ──────────────────────────────────────────────────

describe('datalog — parser', () => {
  it('parseAtom: "parent(alice, bob)" → predicate y args correctos', () => {
    const a = parseAtom('parent(alice, bob)');
    expect(a).not.toBeNull();
    expect(a?.predicate).toBe('parent');
    expect(a?.args).toEqual(['alice', 'bob']);
  });

  it('parseAtom: predicado con variable mayúscula', () => {
    const a = parseAtom('ancestor(X, Y)');
    expect(a).not.toBeNull();
    expect(a?.args).toEqual(['X', 'Y']);
    expect(isVariable('X')).toBe(true);
    expect(isVariable('alice')).toBe(false);
  });

  it('parseAtom: sintaxis inválida devuelve null', () => {
    expect(parseAtom('parent(')).toBeNull();
    expect(parseAtom('parent(a,)')).toBeNull();
    expect(parseAtom('123pred(a)')).toBeNull();
  });

  it('parseRule: "ancestor(X, Y) :- parent(X, Y)." → regla', () => {
    const r = parseRule('ancestor(X, Y) :- parent(X, Y).');
    expect(r).not.toBeNull();
    expect(r?.head.predicate).toBe('ancestor');
    expect(r?.body).toHaveLength(1);
    expect(r?.body[0]?.predicate).toBe('parent');
  });

  it('parseRule: regla recursiva con dos literales en body', () => {
    const r = parseRule('ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).');
    expect(r).not.toBeNull();
    expect(r?.body).toHaveLength(2);
    expect(r?.body[0]?.predicate).toBe('parent');
    expect(r?.body[1]?.predicate).toBe('ancestor');
  });

  it('parseRule: hecho (sin :-) devuelve regla con body vacío', () => {
    const r = parseRule('parent(alice, bob).');
    expect(r).not.toBeNull();
    expect(r?.body).toEqual([]);
    expect(r?.head.args).toEqual(['alice', 'bob']);
  });
});

// ── Unificación ─────────────────────────────────────────────

describe('datalog — unificación', () => {
  it('unifyAtoms: variables con constantes', () => {
    const a: DatalogAtom = { predicate: 'p', args: ['X', 'Y'] };
    const b: DatalogAtom = { predicate: 'p', args: ['alice', 'bob'] };
    const s = unifyAtoms(a, b);
    expect(s).not.toBeNull();
    expect(s?.X).toBe('alice');
    expect(s?.Y).toBe('bob');
  });

  it('unifyAtoms: predicados distintos → null', () => {
    const a: DatalogAtom = { predicate: 'p', args: ['X'] };
    const b: DatalogAtom = { predicate: 'q', args: ['alice'] };
    expect(unifyAtoms(a, b)).toBeNull();
  });

  it('unifyAtoms: aridades distintas → null', () => {
    const a: DatalogAtom = { predicate: 'p', args: ['X', 'Y'] };
    const b: DatalogAtom = { predicate: 'p', args: ['alice'] };
    expect(unifyAtoms(a, b)).toBeNull();
  });

  it('unifyAtoms: constantes distintas → null', () => {
    const a: DatalogAtom = { predicate: 'p', args: ['alice'] };
    const b: DatalogAtom = { predicate: 'p', args: ['bob'] };
    expect(unifyAtoms(a, b)).toBeNull();
  });

  it('unifyAtoms: misma variable repetida fuerza igualdad', () => {
    const a: DatalogAtom = { predicate: 'p', args: ['X', 'X'] };
    const b: DatalogAtom = { predicate: 'p', args: ['alice', 'alice'] };
    expect(unifyAtoms(a, b)).not.toBeNull();
    const c: DatalogAtom = { predicate: 'p', args: ['alice', 'bob'] };
    expect(unifyAtoms(a, c)).toBeNull();
  });

  it('applySubstitution: sustituye variables, deja constantes', () => {
    const atom: DatalogAtom = { predicate: 'p', args: ['X', 'alice', 'Y'] };
    const out = applySubstitution(atom, { X: 'bob', Y: 'carol' });
    expect(out.args).toEqual(['bob', 'alice', 'carol']);
  });

  it('isGround: detecta átomos ground correctamente', () => {
    expect(isGround({ predicate: 'p', args: ['alice', 'bob'] })).toBe(true);
    expect(isGround({ predicate: 'p', args: ['alice', 'X'] })).toBe(false);
  });
});

// ── Bottom-up: transitive closure ───────────────────────────

describe('datalog — bottom-up transitive closure', () => {
  it('3 parent facts derivan los 3 ancestor directos + 3 transitivos', () => {
    const p = transitiveClosure();
    const result = evaluateBottomUp(p);
    // Hechos parent originales: 3.
    // Hechos ancestor derivados: 3 directos + 3 transitivos
    //   ancestor(alice,bob), ancestor(bob,carol), ancestor(carol,dave)
    //   ancestor(alice,carol) [via bob],
    //   ancestor(bob,dave)    [via carol],
    //   ancestor(alice,dave)  [via bob+carol].
    const ancestors = result.facts.filter((f) => f.predicate === 'ancestor');
    expect(ancestors.length).toBe(6);
    expect(hasAtom(result.facts, 'ancestor', ['alice', 'bob'])).toBe(true);
    expect(hasAtom(result.facts, 'ancestor', ['alice', 'carol'])).toBe(true);
    expect(hasAtom(result.facts, 'ancestor', ['alice', 'dave'])).toBe(true);
    expect(hasAtom(result.facts, 'ancestor', ['bob', 'dave'])).toBe(true);
  });

  it('terminates con iterations finitas (idempotencia tras fixpoint)', () => {
    const p = transitiveClosure();
    const result = evaluateBottomUp(p);
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.iterations).toBeLessThan(20);
    // Re-evaluación da el mismo conteo de facts (idempotente).
    const result2 = evaluateBottomUp(p);
    expect(result2.facts.length).toBe(result.facts.length);
  });
});

// ── Bottom-up: path reachability ────────────────────────────

describe('datalog — bottom-up path reachability', () => {
  it('grafo de 4 nodos deriva todas las conexiones alcanzables', () => {
    const p = pathReachability();
    const result = evaluateBottomUp(p);
    // edges: n1→n2, n2→n3, n3→n4, n1→n3.
    // reach esperado:
    //   directos: (n1,n2), (n2,n3), (n3,n4), (n1,n3)
    //   transitivos: (n1,n4) via n2-n3-n4 o n1-n3-n4, (n2,n4) via n3.
    const reaches = result.facts.filter((f) => f.predicate === 'reach');
    expect(reaches.length).toBe(6);
    expect(hasAtom(result.facts, 'reach', ['n1', 'n4'])).toBe(true);
    expect(hasAtom(result.facts, 'reach', ['n2', 'n4'])).toBe(true);
    expect(hasAtom(result.facts, 'reach', ['n1', 'n3'])).toBe(true);
  });
});

// ── Uniqueness y terminación ────────────────────────────────

describe('datalog — uniqueness y terminación', () => {
  it('no produce facts duplicados (set semantics)', () => {
    const p = transitiveClosure();
    const result = evaluateBottomUp(p);
    const keys = result.facts.map((a) => atomKey(a));
    const uniq = new Set(keys);
    expect(uniq.size).toBe(keys.length);
  });

  it('ciclo en grafo no genera bucle infinito', () => {
    // grafo cíclico: a→b, b→a.
    const p: DatalogProgram = {
      facts: [
        { predicate: 'edge', args: ['a', 'b'] },
        { predicate: 'edge', args: ['b', 'a'] },
      ],
      rules: [
        {
          head: { predicate: 'reach', args: ['X', 'Y'] },
          body: [{ predicate: 'edge', args: ['X', 'Y'] }],
        },
        {
          head: { predicate: 'reach', args: ['X', 'Y'] },
          body: [
            { predicate: 'edge', args: ['X', 'Z'] },
            { predicate: 'reach', args: ['Z', 'Y'] },
          ],
        },
      ],
    };
    const result = evaluateBottomUp(p, { maxIterations: 50 });
    // Debe terminar y derivar: (a,b), (b,a), (a,a), (b,b).
    const reaches = result.facts.filter((f) => f.predicate === 'reach');
    expect(reaches.length).toBe(4);
    expect(hasAtom(result.facts, 'reach', ['a', 'a'])).toBe(true);
    expect(hasAtom(result.facts, 'reach', ['b', 'b'])).toBe(true);
  });
});

// ── querySLD ────────────────────────────────────────────────

describe('datalog — querySLD top-down con memoización', () => {
  it('query ancestor(alice, Y) devuelve todos los descendientes de alice', () => {
    const p = transitiveClosure();
    const results = querySLD(p, {
      predicate: 'ancestor',
      args: ['alice', 'Y'],
    });
    expect(results.length).toBe(3);
    expect(hasAtom(results, 'ancestor', ['alice', 'bob'])).toBe(true);
    expect(hasAtom(results, 'ancestor', ['alice', 'carol'])).toBe(true);
    expect(hasAtom(results, 'ancestor', ['alice', 'dave'])).toBe(true);
  });

  it('query ground exacto devuelve [match] o []', () => {
    const p = transitiveClosure();
    const hit = querySLD(p, {
      predicate: 'ancestor',
      args: ['alice', 'dave'],
    });
    expect(hit.length).toBe(1);
    const miss = querySLD(p, {
      predicate: 'ancestor',
      args: ['dave', 'alice'],
    });
    expect(miss.length).toBe(0);
  });
});

// ── Negación estratificada ──────────────────────────────────

describe('datalog — negación estratificada', () => {
  it('orphan(X) :- person(X), ¬hasParent(X)', () => {
    // person(alice). person(bob). person(carol).
    // hasParent(alice). hasParent(bob).
    // orphan(X) :- person(X), ¬hasParent(X).
    // Esperado: orphan(carol).
    const rules: StratifiedRule[] = [
      {
        head: { predicate: 'orphan', args: ['X'] },
        body: [{ predicate: 'person', args: ['X'] }],
        negBody: [{ predicate: 'hasParent', args: ['X'] }],
      },
    ];
    const program = {
      facts: [
        { predicate: 'person', args: ['alice'] },
        { predicate: 'person', args: ['bob'] },
        { predicate: 'person', args: ['carol'] },
        { predicate: 'hasParent', args: ['alice'] },
        { predicate: 'hasParent', args: ['bob'] },
      ],
      rules,
    };
    const result = evaluateStratified(program);
    const orphans = result.facts.filter((f) => f.predicate === 'orphan');
    expect(orphans.length).toBe(1);
    expect(hasAtom(result.facts, 'orphan', ['carol'])).toBe(true);
  });

  it('estratificación: predicado negado se evalúa antes del predicado que lo niega', () => {
    // p(a). p(b). q(X) :- p(X). r(X) :- p(X), ¬q(X).
    // r debería estar vacío porque q tiene los mismos elementos que p.
    const rules: StratifiedRule[] = [
      {
        head: { predicate: 'q', args: ['X'] },
        body: [{ predicate: 'p', args: ['X'] }],
        negBody: [],
      },
      {
        head: { predicate: 'r', args: ['X'] },
        body: [{ predicate: 'p', args: ['X'] }],
        negBody: [{ predicate: 'q', args: ['X'] }],
      },
    ];
    const program = {
      facts: [
        { predicate: 'p', args: ['a'] },
        { predicate: 'p', args: ['b'] },
      ],
      rules,
    };
    const result = evaluateStratified(program);
    const rs = result.facts.filter((f) => f.predicate === 'r');
    expect(rs.length).toBe(0);
    const qs = result.facts.filter((f) => f.predicate === 'q');
    expect(qs.length).toBe(2);
  });
});

// ── Magic sets ──────────────────────────────────────────────

describe('datalog — magic sets', () => {
  it('magic sets preserva resultados del query bajo bottom-up', () => {
    const p = transitiveClosure();
    const query: DatalogAtom = {
      predicate: 'ancestor',
      args: ['alice', 'Y'],
    };
    const transformed = magicSets(p, query);
    const result = evaluateBottomUp(transformed);
    // El programa transformado debe seguir derivando los ancestor
    // que el query pide (alice → bob, carol, dave).
    const ancestorsFromAlice = result.facts.filter(
      (f) => f.predicate === 'ancestor' && f.args[0] === 'alice',
    );
    expect(ancestorsFromAlice.length).toBeGreaterThanOrEqual(3);
    expect(hasAtom(result.facts, 'ancestor', ['alice', 'dave'])).toBe(true);
  });

  it('magic sets agrega seed magic_<pred> al programa', () => {
    const p = transitiveClosure();
    const query: DatalogAtom = {
      predicate: 'ancestor',
      args: ['alice', 'Y'],
    };
    const transformed = magicSets(p, query);
    const hasMagicSeed = transformed.facts.some((f) => f.predicate === 'magic_ancestor');
    expect(hasMagicSeed).toBe(true);
  });

  it('magic sets sobre query totalmente variable devuelve programa equivalente', () => {
    const p = transitiveClosure();
    const query: DatalogAtom = {
      predicate: 'ancestor',
      args: ['X', 'Y'],
    };
    const transformed = magicSets(p, query);
    // No hay args ground → no se introduce magic, programa equivalente.
    const result = evaluateBottomUp(transformed);
    const ancestors = result.facts.filter((f) => f.predicate === 'ancestor');
    expect(ancestors.length).toBe(6);
  });
});

// ── End-to-end con parser ───────────────────────────────────

describe('datalog — end-to-end parse + evaluate', () => {
  it('programa parseado y evaluado da los mismos resultados que construido a mano', () => {
    const ruleStrs = [
      'parent(alice, bob).',
      'parent(bob, carol).',
      'parent(carol, dave).',
      'ancestor(X, Y) :- parent(X, Y).',
      'ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).',
    ];
    const parsedRules = ruleStrs.map((s) => parseRule(s));
    expect(parsedRules.every((r) => r !== null)).toBe(true);
    const facts: DatalogAtom[] = [];
    const rules = [];
    for (const r of parsedRules) {
      if (!r) continue;
      if (r.body.length === 0) facts.push(r.head);
      else rules.push(r);
    }
    const program: DatalogProgram = { facts, rules };
    const result = evaluateBottomUp(program);
    const ancestors = result.facts.filter((f) => f.predicate === 'ancestor');
    expect(ancestors.length).toBe(6);
  });
});
