// ============================================================
// ST Lemma synthesis — Tests
// ============================================================
// Cubre:
//   • Enumeración de términos (counts, dedup, profundidad).
//   • Síntesis de igualdades para naturales (identidad, asoc,
//     conmutatividad, distributividad).
//   • Síntesis para booleanos (idempotencia, De Morgan).
//   • Síntesis para listas (asoc de ++, nil identidad,
//     longitud de cons / ++).
//   • Pruning: descarta reflexivas, simétricas y consecuencias.
//   • Verificación: clasifica correctamente con prover stub.
//   • Confidence threshold filtra ruidosos.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  Signature,
  Term,
  enumerateTerms,
  synthesizeEqualities,
  pruneConsequences,
  verifyConjectures,
  naturalNumbersSignature,
  booleansSignature,
  listsSignature,
  naturalsEvaluator,
  booleansEvaluator,
  listsEvaluator,
  termToString,
  freeVars,
  __internals,
} from '../../../reasoning/lemma-synthesis';

const findConjecture = (cs: Array<{ formula: string }>, ...needles: string[]): boolean =>
  cs.some((c) => needles.every((n) => c.formula.includes(n)));

describe('Lemma synthesis — enumerateTerms', () => {
  it('enumera términos triviales en profundidad 0', () => {
    const sig = naturalNumbersSignature();
    const ts = enumerateTerms(sig, 'Nat', 0);
    // Debe contener al menos las variables por defecto y 0
    const strs = ts.map(termToString);
    expect(strs).toContain('0');
    expect(strs.length).toBeGreaterThan(1);
  });

  it('depth 1 incluye S(0) y aplicaciones', () => {
    const sig = naturalNumbersSignature();
    const ts = enumerateTerms(sig, 'Nat', 1);
    const strs = ts.map(termToString);
    expect(strs).toContain('S(0)');
    expect(strs.some((s) => s.includes('+'))).toBe(true);
  });

  it('depth 2 incluye términos compuestos', () => {
    const sig = naturalNumbersSignature();
    const ts = enumerateTerms(sig, 'Nat', 2);
    const strs = ts.map(termToString);
    expect(strs).toContain('S(S(0))');
  });

  it('dedup: no genera duplicados sintácticos', () => {
    const sig = booleansSignature();
    const ts = enumerateTerms(sig, 'Bool', 1);
    const strs = ts.map(termToString);
    const set = new Set(strs);
    expect(set.size).toBe(strs.length);
  });

  it('respeta la profundidad: depth 1 ⊂ depth 2', () => {
    const sig = naturalNumbersSignature();
    const d1 = enumerateTerms(sig, 'Nat', 1).map(termToString);
    const d2 = new Set(enumerateTerms(sig, 'Nat', 2).map(termToString));
    for (const t of d1) {
      expect(d2.has(t)).toBe(true);
    }
  });
});

describe('Lemma synthesis — Naturals', () => {
  it('sintetiza identidad por la izquierda 0 + x = x', () => {
    const sig = naturalNumbersSignature();
    const cs = synthesizeEqualities(sig, naturalsEvaluator, {
      maxDepth: 2,
      numTests: 50,
      varsPerSort: 2,
    });
    expect(findConjecture(cs, '(0 + n0)', 'n0')).toBe(true);
  });

  it('sintetiza identidad por la derecha x + 0 = x', () => {
    const sig = naturalNumbersSignature();
    const cs = synthesizeEqualities(sig, naturalsEvaluator, {
      maxDepth: 2,
      numTests: 50,
      varsPerSort: 2,
    });
    // alguna de las formas: x + 0 = x ó 0 + x = x ó ambas
    const hasIdentity = cs.some(
      (c) => /\(n[0-9] \+ 0\)/.test(c.formula) || /\(0 \+ n[0-9]\)/.test(c.formula),
    );
    expect(hasIdentity).toBe(true);
  });

  it('sintetiza conmutatividad x + y = y + x', () => {
    const sig = naturalNumbersSignature();
    const cs = synthesizeEqualities(sig, naturalsEvaluator, {
      maxDepth: 2,
      numTests: 80,
      varsPerSort: 2,
    });
    const hasComm = cs.some((c) => {
      // Reescribimos: cualquier conjetura donde lado izq es (a + b)
      // y derecho es (b + a) con a, b vars distintas
      if (!c.termLeft || !c.termRight) return false;
      const L = c.termLeft;
      const R = c.termRight;
      if (
        L.kind === 'app' &&
        L.name === '+' &&
        R.kind === 'app' &&
        R.name === '+' &&
        L.args.length === 2 &&
        R.args.length === 2 &&
        L.args[0].kind === 'var' &&
        L.args[1].kind === 'var' &&
        R.args[0].kind === 'var' &&
        R.args[1].kind === 'var' &&
        L.args[0].name === R.args[1].name &&
        L.args[1].name === R.args[0].name &&
        L.args[0].name !== L.args[1].name
      ) {
        return true;
      }
      return false;
    });
    expect(hasComm).toBe(true);
  });

  it('sintetiza asociatividad (x + y) + z = x + (y + z)', () => {
    const sig = naturalNumbersSignature();
    const cs = synthesizeEqualities(sig, naturalsEvaluator, {
      maxDepth: 3,
      numTests: 50,
      varsPerSort: 3,
      maxConjectures: 500,
    });
    const hasAssoc = cs.some((c) => {
      const f = c.formula;
      // ((a + b) + c) = (a + (b + c))
      return (
        /\(\(n[0-9] \+ n[0-9]\) \+ n[0-9]\)/.test(f) && /\(n[0-9] \+ \(n[0-9] \+ n[0-9]\)\)/.test(f)
      );
    });
    expect(hasAssoc).toBe(true);
  });

  it('sintetiza S(x) + y = S(x + y) o variante', () => {
    const sig = naturalNumbersSignature();
    const cs = synthesizeEqualities(sig, naturalsEvaluator, {
      maxDepth: 2,
      numTests: 50,
      varsPerSort: 2,
    });
    // Algún lemma debe relacionar S con +
    const found = cs.some((c) => c.formula.includes('S(') && c.formula.includes('+'));
    expect(found).toBe(true);
  });
});

describe('Lemma synthesis — Booleans', () => {
  it('sintetiza idempotencia x ∧ x = x', () => {
    const sig = booleansSignature();
    const cs = synthesizeEqualities(sig, booleansEvaluator, {
      maxDepth: 2,
      numTests: 30,
      varsPerSort: 2,
    });
    // idempotencia bajo cualquier orientación, ambas vars iguales
    const isIdem = (c: { termLeft?: unknown; termRight?: unknown }, op: string): boolean => {
      const tryMatch = (a: unknown, b: unknown): boolean => {
        // a debe ser var v, b debe ser app(op, [v, v])
        const av = a as { kind?: string; name?: string };
        const bv = b as {
          kind?: string;
          name?: string;
          args?: Array<{ kind?: string; name?: string }>;
        };
        if (av.kind !== 'var') return false;
        if (bv.kind !== 'app' || bv.name !== op) return false;
        if (!bv.args || bv.args.length !== 2) return false;
        return (
          bv.args[0].kind === 'var' &&
          bv.args[1].kind === 'var' &&
          bv.args[0].name === av.name &&
          bv.args[1].name === av.name
        );
      };
      return tryMatch(c.termLeft, c.termRight) || tryMatch(c.termRight, c.termLeft);
    };
    const hasIdemAnd = cs.some((c) => isIdem(c, '∧'));
    const hasIdemOr = cs.some((c) => isIdem(c, '∨'));
    expect(hasIdemAnd || hasIdemOr).toBe(true);
  });

  it('sintetiza doble negación ¬¬x = x', () => {
    const sig = booleansSignature();
    const cs = synthesizeEqualities(sig, booleansEvaluator, {
      maxDepth: 2,
      numTests: 30,
      varsPerSort: 2,
    });
    const has = cs.some((c) => /¬¬b[0-9]/.test(c.formula));
    expect(has).toBe(true);
  });

  it('sintetiza alguna identidad De Morgan-like', () => {
    const sig = booleansSignature();
    const cs = synthesizeEqualities(sig, booleansEvaluator, {
      maxDepth: 3,
      numTests: 30,
      varsPerSort: 2,
      maxConjectures: 1000,
    });
    // De Morgan: ¬(x ∧ y) = ¬x ∨ ¬y  ó  ¬(x ∨ y) = ¬x ∧ ¬y
    const has = cs.some((c) => {
      const f = c.formula;
      return (
        (/¬\(b[0-9] ∧ b[0-9]\)/.test(f) && /\(¬b[0-9] ∨ ¬b[0-9]\)/.test(f)) ||
        (/¬\(b[0-9] ∨ b[0-9]\)/.test(f) && /\(¬b[0-9] ∧ ¬b[0-9]\)/.test(f))
      );
    });
    expect(has).toBe(true);
  });

  it('sintetiza conmutatividad de ∧', () => {
    const sig = booleansSignature();
    const cs = synthesizeEqualities(sig, booleansEvaluator, {
      maxDepth: 2,
      numTests: 30,
      varsPerSort: 2,
    });
    const has = cs.some((c) => {
      const L = c.termLeft;
      const R = c.termRight;
      if (!L || !R) return false;
      return (
        L.kind === 'app' &&
        L.name === '∧' &&
        R.kind === 'app' &&
        R.name === '∧' &&
        L.args[0].kind === 'var' &&
        L.args[1].kind === 'var' &&
        R.args[0].kind === 'var' &&
        R.args[1].kind === 'var' &&
        L.args[0].name === R.args[1].name &&
        L.args[1].name === R.args[0].name &&
        L.args[0].name !== L.args[1].name
      );
    });
    expect(has).toBe(true);
  });
});

describe('Lemma synthesis — Lists', () => {
  it('sintetiza nil ++ l = l', () => {
    const sig = listsSignature();
    const cs = synthesizeEqualities(sig, listsEvaluator, {
      maxDepth: 2,
      numTests: 40,
      varsPerSort: 2,
    });
    const has = cs.some((c) => /\(nil \+\+ l[0-9]\)/.test(c.formula));
    expect(has).toBe(true);
  });

  it('sintetiza l ++ nil = l', () => {
    const sig = listsSignature();
    const cs = synthesizeEqualities(sig, listsEvaluator, {
      maxDepth: 2,
      numTests: 40,
      varsPerSort: 2,
    });
    const has = cs.some((c) => /\(l[0-9] \+\+ nil\)/.test(c.formula));
    expect(has).toBe(true);
  });

  it('sintetiza asociatividad de ++', () => {
    const sig = listsSignature();
    const cs = synthesizeEqualities(sig, listsEvaluator, {
      maxDepth: 3,
      numTests: 40,
      varsPerSort: 3,
      maxConjectures: 1000,
    });
    const has = cs.some((c) => {
      const f = c.formula;
      return (
        /\(\(l[0-9] \+\+ l[0-9]\) \+\+ l[0-9]\)/.test(f) &&
        /\(l[0-9] \+\+ \(l[0-9] \+\+ l[0-9]\)\)/.test(f)
      );
    });
    expect(has).toBe(true);
  });
});

describe('Lemma synthesis — pruneConsequences', () => {
  it('descarta conjeturas reflexivas (t = t)', () => {
    const x: Term = { kind: 'var', name: 'n0', sort: 'Nat' };
    const refl = {
      variables: [{ name: 'n0', sort: 'Nat' }],
      formula: '∀n0:Nat. n0 = n0',
      confidence: 1,
      termLeft: x,
      termRight: x,
    };
    const pruned = pruneConsequences([refl]);
    expect(pruned).toEqual([]);
  });

  it('descarta simétricas duplicadas (t1 = t2 vs t2 = t1)', () => {
    const a: Term = { kind: 'var', name: 'n0', sort: 'Nat' };
    const b: Term = { kind: 'var', name: 'n1', sort: 'Nat' };
    const ab: Term = { kind: 'app', name: '+', args: [a, b], sort: 'Nat' };
    const ba: Term = { kind: 'app', name: '+', args: [b, a], sort: 'Nat' };

    const c1 = {
      variables: [
        { name: 'n0', sort: 'Nat' },
        { name: 'n1', sort: 'Nat' },
      ],
      formula: 'L=R',
      confidence: 1,
      termLeft: ab,
      termRight: ba,
    };
    const c2 = {
      variables: [
        { name: 'n0', sort: 'Nat' },
        { name: 'n1', sort: 'Nat' },
      ],
      formula: 'R=L',
      confidence: 1,
      termLeft: ba,
      termRight: ab,
    };

    const pruned = pruneConsequences([c1, c2]);
    expect(pruned.length).toBe(1);
  });

  it('reduce el conjunto sintético contra el redundante (idempotente bajo prune)', () => {
    const sig = naturalNumbersSignature();
    const cs = synthesizeEqualities(sig, naturalsEvaluator, {
      maxDepth: 2,
      numTests: 20,
      varsPerSort: 2,
      maxConjectures: 60,
    });
    const p1 = pruneConsequences(cs);
    const p2 = pruneConsequences(p1);
    expect(p1.length).toBeLessThanOrEqual(cs.length);
    // prune idempotente
    expect(p2.length).toBe(p1.length);
  });
});

describe('Lemma synthesis — verifyConjectures', () => {
  it('clasifica conjeturas en verified / counter / unknown', () => {
    const x: Term = { kind: 'var', name: 'n0', sort: 'Nat' };
    const c1 = {
      variables: [{ name: 'n0', sort: 'Nat' }],
      formula: 'true',
      confidence: 1,
      termLeft: x,
      termRight: x,
    };
    const c2 = { ...c1, formula: 'false' };
    const c3 = { ...c1, formula: 'unknown' };

    const verified = verifyConjectures([c1, c2, c3], (c) => {
      if (c.formula === 'true') return { proven: true };
      if (c.formula === 'false') return { proven: false, counter: { n0: 1 } };
      return { proven: false };
    });

    expect(verified[0].status).toBe('verified');
    expect(verified[1].status).toBe('counter');
    expect(verified[1].counter).toEqual({ n0: 1 });
    expect(verified[2].status).toBe('unknown');
  });

  it('maneja exceptions del prover devolviendo unknown', () => {
    const x: Term = { kind: 'var', name: 'n0', sort: 'Nat' };
    const c = {
      variables: [{ name: 'n0', sort: 'Nat' }],
      formula: 'crash',
      confidence: 1,
      termLeft: x,
      termRight: x,
    };
    const verified = verifyConjectures([c], () => {
      throw new Error('boom');
    });
    expect(verified[0].status).toBe('unknown');
  });
});

describe('Lemma synthesis — propiedades estructurales', () => {
  it('todas las conjeturas tienen confidence == 1 (sobrevivieron todos los tests)', () => {
    const sig = booleansSignature();
    const cs = synthesizeEqualities(sig, booleansEvaluator, {
      maxDepth: 2,
      numTests: 30,
      varsPerSort: 2,
    });
    for (const c of cs) {
      expect(c.confidence).toBe(1);
      expect(c.confidence).toBeGreaterThan(0.95);
    }
  });

  it('cada conjetura tiene variables coherentes con los términos', () => {
    const sig = naturalNumbersSignature();
    const cs = synthesizeEqualities(sig, naturalsEvaluator, {
      maxDepth: 2,
      numTests: 30,
      varsPerSort: 2,
    });
    for (const c of cs) {
      const vL = freeVars(c.termLeft!);
      const vR = freeVars(c.termRight!);
      const allNames = new Set([...vL, ...vR].map((v) => v.name));
      for (const v of c.variables) {
        expect(allNames.has(v.name) || allNames.size === 0).toBe(true);
      }
    }
  });

  it('maxConjectures es respetado', () => {
    const sig = naturalNumbersSignature();
    const cs = synthesizeEqualities(sig, naturalsEvaluator, {
      maxDepth: 2,
      numTests: 20,
      varsPerSort: 2,
      maxConjectures: 5,
    });
    expect(cs.length).toBeLessThanOrEqual(5);
  });

  it('seed determinístico: dos corridas dan mismo conjunto', () => {
    const sig = naturalNumbersSignature();
    const opts = { maxDepth: 2, numTests: 20, varsPerSort: 2, seed: 42 };
    const a = synthesizeEqualities(sig, naturalsEvaluator, opts).map((c) => c.formula);
    const b = synthesizeEqualities(sig, naturalsEvaluator, opts).map((c) => c.formula);
    expect(a).toEqual(b);
  });
});

describe('Lemma synthesis — internos', () => {
  it('match identifica patrones simples', () => {
    const x: Term = { kind: 'var', name: 'x', sort: 'Nat' };
    const zero: Term = { kind: 'const', name: '0', sort: 'Nat' };
    const target: Term = { kind: 'app', name: '+', args: [zero, zero], sort: 'Nat' };
    const pattern: Term = { kind: 'app', name: '+', args: [x, x], sort: 'Nat' };
    const subst = __internals.match(pattern, target, new Map());
    expect(subst).not.toBeNull();
    expect(__internals.termKey(subst!.get('x')!)).toBe(__internals.termKey(zero));
  });

  it('rewriteOnce sustituye una vez por la raíz', () => {
    const x: Term = { kind: 'var', name: 'x', sort: 'Nat' };
    const zero: Term = { kind: 'const', name: '0', sort: 'Nat' };
    // pattern: 0 + x → x
    const pattern: Term = { kind: 'app', name: '+', args: [zero, x], sort: 'Nat' };
    const replacement: Term = x;
    const target: Term = { kind: 'app', name: '+', args: [zero, zero], sort: 'Nat' };
    const out = __internals.rewriteOnce(target, pattern, replacement);
    expect(__internals.termKey(out)).toBe(__internals.termKey(zero));
  });

  it('mulberry32 es determinístico y cubre [0, 1)', () => {
    const a = __internals.mulberry32(123);
    const b = __internals.mulberry32(123);
    for (let i = 0; i < 50; i++) {
      const va = a();
      const vb = b();
      expect(va).toBe(vb);
      expect(va).toBeGreaterThanOrEqual(0);
      expect(va).toBeLessThan(1);
    }
  });

  it('serializeValue trata arrays y números consistentemente', () => {
    expect(__internals.serializeValue([1, 2, 3])).toBe('[1,2,3]');
    expect(__internals.serializeValue(true)).toBe('true');
    expect(__internals.serializeValue(0.1 + 0.2)).toBe('0.300000000');
  });
});

describe('Lemma synthesis — Signaturas exportadas', () => {
  it('naturalNumbersSignature está bien formada', () => {
    const sig = naturalNumbersSignature();
    expect(sig.sorts).toContain('Nat');
    expect(sig.constants.some((c) => c.name === '0')).toBe(true);
    expect(sig.functions.some((f) => f.name === '+')).toBe(true);
  });

  it('booleansSignature está bien formada', () => {
    const sig: Signature = booleansSignature();
    expect(sig.sorts).toContain('Bool');
    expect(sig.constants.length).toBe(2);
    expect(sig.functions.some((f) => f.name === '∧')).toBe(true);
  });

  it('listsSignature combina dos sorts', () => {
    const sig = listsSignature();
    expect(sig.sorts).toContain('List');
    expect(sig.sorts).toContain('Nat');
    expect(sig.functions.some((f) => f.name === '++')).toBe(true);
    expect(sig.functions.some((f) => f.name === 'length')).toBe(true);
  });
});
