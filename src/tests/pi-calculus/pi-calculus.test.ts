import { describe, it, expect } from 'vitest';
import {
  freeNames,
  boundNames,
  alphaRename,
  substitute,
  reduce,
  isDeadlocked,
  trace,
  structuralCongruence,
} from '../../runtime/pi-calculus';
import type { PiProcess } from '../../runtime/pi-calculus';

// ------------------------------------------------------------
// Constructores cómodos para escribir procesos en los tests.
// ------------------------------------------------------------

const nil: PiProcess = { kind: 'nil' };

function inp(channel: string, bind: string, cont: PiProcess = nil): PiProcess {
  return { kind: 'input', channel, bind, cont };
}

function out(channel: string, value: string, cont: PiProcess = nil): PiProcess {
  return { kind: 'output', channel, value, cont };
}

function par(left: PiProcess, right: PiProcess): PiProcess {
  return { kind: 'parallel', left, right };
}

function nu(channel: string, body: PiProcess): PiProcess {
  return { kind: 'new', channel, body };
}

function rep(body: PiProcess): PiProcess {
  return { kind: 'replication', body };
}

function sum(left: PiProcess, right: PiProcess): PiProcess {
  return { kind: 'choice', left, right };
}

function match(left: string, right: string, cont: PiProcess): PiProcess {
  return { kind: 'match', left, right, cont };
}

// ------------------------------------------------------------
// Helpers de assertion semántico.
// ------------------------------------------------------------

function setEq<T>(a: Set<T>, b: Iterable<T>): boolean {
  const bs = new Set(b);
  if (a.size !== bs.size) return false;
  for (const x of a) if (!bs.has(x)) return false;
  return true;
}

// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('π-calculus — nombres libres y ligados', () => {
  it('fn(0) = ∅', () => {
    expect(freeNames(nil).size).toBe(0);
    expect(boundNames(nil).size).toBe(0);
  });

  it('fn(c̄⟨v⟩.0) = {c, v}', () => {
    const p = out('c', 'v');
    expect(setEq(freeNames(p), ['c', 'v'])).toBe(true);
  });

  it('fn(c(x).x̄⟨a⟩.0) = {c, a}; bn = {x}', () => {
    // x es ligado por el input, no aparece libre.
    const p = inp('c', 'x', out('x', 'a'));
    expect(setEq(freeNames(p), ['c', 'a'])).toBe(true);
    expect(setEq(boundNames(p), ['x'])).toBe(true);
  });

  it('(νc) c̄⟨v⟩.0 — c ligado, v libre', () => {
    const p = nu('c', out('c', 'v'));
    expect(setEq(freeNames(p), ['v'])).toBe(true);
    expect(setEq(boundNames(p), ['c'])).toBe(true);
  });
});

describe('π-calculus — α-renaming preserva semántica', () => {
  it('renombrar un nombre libre mantiene la estructura', () => {
    const p = par(out('c', 'a'), inp('c', 'x', out('x', 'b')));
    const q = alphaRename(p, 'b', 'B');
    expect(setEq(freeNames(q), ['c', 'a', 'B'])).toBe(true);
  });

  it('renombrar un binder de input es inocuo si elegimos un fresco', () => {
    // c(x).x̄⟨a⟩.0  =α=  c(y).ȳ⟨a⟩.0
    const innerCont = out('x', 'a');
    const p: PiProcess = { kind: 'input', channel: 'c', bind: 'x', cont: innerCont };
    const renamedBody = alphaRename(innerCont, 'x', 'y');
    const q: PiProcess = { kind: 'input', channel: 'c', bind: 'y', cont: renamedBody };
    expect(structuralCongruence(p, q)).toBe(true);
  });

  it('alphaRename no captura: no toca apariciones bajo binder homónimo', () => {
    // En c(x).x̄⟨a⟩.0, "x" interno está ligado y NO debe renombrarse
    // si la sustitución parte del exterior.
    const p = inp('c', 'x', out('x', 'a'));
    const q = alphaRename(p, 'x', 'Z');
    // El cuerpo sigue usando "x" porque el binder lo atrapa.
    expect(q).toEqual(inp('c', 'x', out('x', 'a')));
  });
});

describe('π-calculus — sustitución capture-avoiding', () => {
  it('P[x := v] cuando x no aparece libre devuelve P intacto', () => {
    const p = out('c', 'd');
    expect(substitute(p, 'x', 'v')).toEqual(p);
  });

  it('c̄⟨x⟩.0 [x := a] = c̄⟨a⟩.0', () => {
    expect(substitute(out('c', 'x'), 'x', 'a')).toEqual(out('c', 'a'));
  });

  it('evita captura: c(v).v̄⟨w⟩.0 [w := v] α-refresca v', () => {
    // El binder v capturaría la v que viene de afuera.
    const p = inp('c', 'v', out('v', 'w'));
    const r = substitute(p, 'w', 'v');
    expect(r.kind).toBe('input');
    if (r.kind !== 'input') return;
    // El binder fue refrescado.
    expect(r.bind).not.toBe('v');
    // Las apariciones internas de "v" originales no se confunden con
    // la "v" que reemplazó a "w".
    expect(freeNames(r).has('v')).toBe(true);
  });
});

describe('π-calculus — reducción COMM', () => {
  it('c̄⟨a⟩.0 | c(x).0 → 0 | 0', () => {
    const p = par(out('c', 'a'), inp('c', 'x'));
    const next = reduce(p);
    expect(next.length).toBeGreaterThanOrEqual(1);
    const head = next[0]!;
    expect(structuralCongruence(head, par(nil, nil))).toBe(true);
  });

  it('c̄⟨a⟩.0 | c(x).P sustituye x por a en P', () => {
    // P = x̄⟨b⟩.0 — tras COMM debería quedar ā⟨b⟩.0
    const p = par(out('c', 'a'), inp('c', 'x', out('x', 'b')));
    const next = reduce(p);
    const found = next.some((q) => structuralCongruence(q, par(nil, out('a', 'b'))));
    expect(found).toBe(true);
  });

  it('(νc)(c̄⟨a⟩.0 | c(x).x̄⟨b⟩.0) reduce y expone comunicación', () => {
    // Canal restringido + comunicación interna: COMM atraviesa (νc).
    const p = nu('c', par(out('c', 'a'), inp('c', 'x', out('x', 'b'))));
    const next = reduce(p);
    expect(next.length).toBeGreaterThan(0);
    // El resultado debe contener un output a^⟨b⟩.0 visible (ya que x ↦ a).
    const reduced = next[0]!;
    // (νc)(0 | ā⟨b⟩.0) — c ya no aparece libre dentro, pero seguimos
    // teniendo ā⟨b⟩.0 visible bajo el scope.
    const expected = nu('c', par(nil, out('a', 'b')));
    expect(structuralCongruence(reduced, expected)).toBe(true);
  });

  it('!c̄⟨a⟩.0 | c(x).0 | c(x).0 permite ≥ 2 reducciones distintas', () => {
    // La replicación produce copias del output; los dos inputs pueden
    // consumir cada uno una copia.
    const p = par(par(rep(out('c', 'a')), inp('c', 'x')), inp('c', 'x'));
    const next = reduce(p);
    // Hay múltiples pares input/output posibles → varios sucesores.
    expect(next.length).toBeGreaterThanOrEqual(2);
  });

  it('canales distintos no comunican: a(x).0 | b̄⟨v⟩.0 no reduce', () => {
    const p = par(inp('a', 'x'), out('b', 'v'));
    expect(reduce(p)).toEqual([]);
    expect(isDeadlocked(p)).toBe(true);
  });
});

describe('π-calculus — deadlock', () => {
  it('0 está deadlocked', () => {
    expect(isDeadlocked(nil)).toBe(true);
  });

  it('0 | 0 está deadlocked', () => {
    expect(isDeadlocked(par(nil, nil))).toBe(true);
  });

  it('input sin output complementario está deadlocked', () => {
    expect(isDeadlocked(inp('c', 'x'))).toBe(true);
  });

  it('output sin input complementario está deadlocked', () => {
    expect(isDeadlocked(out('c', 'v'))).toBe(true);
  });
});

describe('π-calculus — match / replicación / choice', () => {
  it('[x = x].P reduce a P', () => {
    const inner = out('c', 'v');
    const p = match('x', 'x', inner);
    const next = reduce(p);
    expect(next.length).toBeGreaterThanOrEqual(1);
    expect(structuralCongruence(next[0]!, inner)).toBe(true);
  });

  it('[x = y].P no reduce si x ≠ y', () => {
    const p = match('x', 'y', out('c', 'v'));
    expect(reduce(p)).toEqual([]);
  });

  it('choice: c̄⟨a⟩.0 + d̄⟨b⟩.0 | c(x).0 → 0 (rama c elegida, d descartada)', () => {
    const p = par(sum(out('c', 'a'), out('d', 'b')), inp('c', 'x'));
    const next = reduce(p);
    // Al menos un sucesor que es ≡ 0 | 0 (la rama c̄⟨a⟩ se consume, d̄⟨b⟩
    // se descarta por la regla SUM).
    const reduced = next.some((q) => structuralCongruence(q, par(nil, nil)));
    expect(reduced).toBe(true);
  });

  it('replicación produce comunicaciones repetibles', () => {
    // !c(x).0 | c̄⟨a⟩.0  → !c(x).0 | 0  (la copia consumida queda libre
    // y la replicación sigue disponible para más outputs futuros).
    const p = par(rep(inp('c', 'x')), out('c', 'a'));
    const next = reduce(p);
    expect(next.length).toBeGreaterThan(0);
    // Confirmamos que sigue habiendo una replicación en el sucesor.
    const stillReplicates = next.some((q) => containsReplication(q));
    expect(stillReplicates).toBe(true);
  });
});

describe('π-calculus — congruencia estructural', () => {
  it('P | 0 ≡ P', () => {
    const P = out('c', 'a');
    expect(structuralCongruence(par(P, nil), P)).toBe(true);
  });

  it('P | Q ≡ Q | P (conmutatividad)', () => {
    const P = out('c', 'a');
    const Q = out('d', 'b');
    expect(structuralCongruence(par(P, Q), par(Q, P))).toBe(true);
  });

  it('(P | Q) | R ≡ P | (Q | R) (asociatividad)', () => {
    const P = out('c', 'a');
    const Q = out('d', 'b');
    const R = out('e', 'f');
    expect(structuralCongruence(par(par(P, Q), R), par(P, par(Q, R)))).toBe(true);
  });

  it('(νc) 0 ≡ 0', () => {
    expect(structuralCongruence(nu('c', nil), nil)).toBe(true);
  });

  it('(νc)(νd) P ≡ (νd)(νc) P (intercambio de scopes)', () => {
    const P = par(out('c', 'a'), inp('d', 'x'));
    expect(structuralCongruence(nu('c', nu('d', P)), nu('d', nu('c', P)))).toBe(true);
  });

  it('α-equivalencia: c(x).x̄⟨a⟩.0 ≡ c(y).ȳ⟨a⟩.0', () => {
    const p = inp('c', 'x', out('x', 'a'));
    const q = inp('c', 'y', out('y', 'a'));
    expect(structuralCongruence(p, q)).toBe(true);
  });

  it('procesos distintos no son congruentes', () => {
    expect(structuralCongruence(out('c', 'a'), out('d', 'a'))).toBe(false);
    expect(structuralCongruence(out('c', 'a'), inp('c', 'a'))).toBe(false);
  });

  it('scope extrusion: (νc)(P | Q) ≡ P | (νc) Q cuando c ∉ fn(P)', () => {
    // P = ā⟨b⟩.0 no menciona c; Q = c̄⟨b⟩.0 sí.
    const P = out('a', 'b');
    const Q = out('c', 'b');
    expect(structuralCongruence(nu('c', par(P, Q)), par(P, nu('c', Q)))).toBe(true);
  });
});

describe('π-calculus — trace', () => {
  it('trace de proceso terminal solo tiene el inicio', () => {
    expect(trace(nil).length).toBe(1);
  });

  it('trace de proceso reducible avanza ≥ 1 paso', () => {
    const p = par(out('c', 'a'), inp('c', 'x', out('x', 'b')));
    const tr = trace(p, 5);
    expect(tr.length).toBeGreaterThanOrEqual(2);
  });

  it('trace respeta maxSteps', () => {
    // Replicación + emisor único produce trazas potencialmente largas;
    // capamos a 3 pasos.
    const p = par(rep(inp('c', 'x')), par(out('c', 'a'), out('c', 'b')));
    const tr = trace(p, 3);
    expect(tr.length).toBeLessThanOrEqual(4); // estado inicial + ≤3 pasos
  });
});

// ------------------------------------------------------------
// Aux
// ------------------------------------------------------------

function containsReplication(p: PiProcess): boolean {
  switch (p.kind) {
    case 'replication':
      return true;
    case 'parallel':
    case 'choice':
      return containsReplication(p.left) || containsReplication(p.right);
    case 'new':
      return containsReplication(p.body);
    case 'input':
    case 'output':
    case 'match':
      return containsReplication(p.cont);
    case 'nil':
      return false;
  }
}
