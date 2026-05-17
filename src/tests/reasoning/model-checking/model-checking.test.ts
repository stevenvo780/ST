// ============================================================
// ST Model Checking — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  bmc,
  checkAlwaysEventually,
  checkEventuallyAlways,
  checkInvariant,
  checkSafety,
  diningPhilosophersSpace,
  hasDeadlock,
  mutualExclusionSpace,
  reachableStates,
  readerWriterSpace,
  type StateSpace,
} from '../../../reasoning/model-checking';

// ── Helpers de fixtures ──────────────────────────────────────

/** Cadena lineal 0 → 1 → 2 → ... → n-1 (sin sucesores en n-1). */
function chainSpace(n: number): StateSpace<number> {
  return {
    initial: [0],
    successors: (s) => (s + 1 < n ? [s + 1] : []),
    labels: (s) => new Set<string>([`s${s}`]),
    equals: (a, b) => a === b,
    hash: (s) => `${s}`,
  };
}

/** Contador cíclico mod n: 0 → 1 → ... → n-1 → 0 → ... */
function cyclicCounterSpace(n: number): StateSpace<number> {
  return {
    initial: [0],
    successors: (s) => [(s + 1) % n],
    labels: (s) => new Set<string>([`s${s}`]),
    equals: (a, b) => a === b,
    hash: (s) => `${s}`,
  };
}

/** Doble bucle disjunto: 0 → 1 → 0  y  0 → 2 → 3 → 2 (uno con p, otro sin p). */
function branchedLoopSpace(): StateSpace<number> {
  return {
    initial: [0],
    successors: (s) => {
      if (s === 0) return [1, 2];
      if (s === 1) return [0];
      if (s === 2) return [3];
      if (s === 3) return [2];
      return [];
    },
    labels: () => new Set<string>(),
    equals: (a, b) => a === b,
    hash: (s) => `${s}`,
  };
}

// ── Reachability ─────────────────────────────────────────────

describe('model-checking — reachability', () => {
  it('cadena lineal n=10 alcanza 10 estados', () => {
    const r = reachableStates(chainSpace(10));
    expect(r.explored).toBe(10);
    expect(r.states.length).toBe(10);
    expect(r.truncated).toBe(false);
  });

  it('respeta maxStates y marca truncated', () => {
    const r = reachableStates(chainSpace(1000), { maxStates: 50 });
    expect(r.explored).toBeLessThanOrEqual(50);
    expect(r.truncated).toBe(true);
  });

  it('contador cíclico n=7 alcanza exactamente 7 estados', () => {
    const r = reachableStates(cyclicCounterSpace(7));
    expect(r.explored).toBe(7);
    expect(r.truncated).toBe(false);
  });
});

// ── Safety / Invariantes ─────────────────────────────────────

describe('model-checking — safety', () => {
  it('safety holds: cadena n=10, predicado s<10', () => {
    const r = checkSafety(chainSpace(10), (s) => s < 10);
    expect(r.safe).toBe(true);
    expect(r.trace).toBeUndefined();
  });

  it('safety violation detected con traza completa', () => {
    const r = checkSafety(chainSpace(10), (s) => s < 5);
    expect(r.safe).toBe(false);
    expect(r.violatingState).toBe(5);
    expect(r.trace).toBeDefined();
    const trace = r.trace as number[];
    expect(trace[0]).toBe(0);
    expect(trace[trace.length - 1]).toBe(5);
    // La traza debe ser un camino real: pasos sucesivos +1.
    for (let i = 1; i < trace.length; i += 1) {
      expect(trace[i]).toBe(trace[i - 1] + 1);
    }
  });

  it('invariant holds en chain cuando es trivialmente verdadero', () => {
    const r = checkInvariant(chainSpace(20), () => true);
    expect(r.safe).toBe(true);
  });

  it('safety detecta violación en estado inicial', () => {
    const r = checkSafety(chainSpace(3), (s) => s !== 0);
    expect(r.safe).toBe(false);
    expect(r.violatingState).toBe(0);
    expect(r.trace).toEqual([0]);
  });
});

// ── BMC ──────────────────────────────────────────────────────

describe('model-checking — bounded model checking', () => {
  it('bmc depth=5 encuentra contraejemplo en chain con p:s<3', () => {
    const r = bmc(chainSpace(100), (s) => s < 3, 5);
    expect(r.safe).toBe(false);
    expect(r.violatingState).toBe(3);
    const trace = r.trace as number[];
    expect(trace[0]).toBe(0);
    expect(trace[trace.length - 1]).toBe(3);
  });

  it('bmc depth=2 NO encuentra contraejemplo más profundo', () => {
    // El primer s con s>=5 es 5, profundidad 5; con depth=2 no lo ve.
    const r = bmc(chainSpace(100), (s) => s < 5, 2);
    expect(r.safe).toBe(true);
  });

  it('bmc depth=0 solo evalúa estados iniciales', () => {
    const r = bmc(chainSpace(10), (s) => s !== 0, 0);
    expect(r.safe).toBe(false);
    expect(r.violatingState).toBe(0);
  });
});

// ── Liveness: GF p (always eventually) ──────────────────────

describe('model-checking — GF p (always eventually)', () => {
  it('GF p holds en contador cíclico donde p={s==3}', () => {
    const r = checkAlwaysEventually(cyclicCounterSpace(5), (s) => s === 3);
    expect(r.holds).toBe(true);
  });

  it('GF p falla cuando hay SCC accesible sin p', () => {
    // branchedLoop: SCC {2,3} no contiene p; SCC {0,1} sí contiene p.
    // GF p exige que toda SCC accesible contenga p.
    const r = checkAlwaysEventually(branchedLoopSpace(), (s) => s === 0 || s === 1);
    expect(r.holds).toBe(false);
    expect(r.lasso).toBeDefined();
    const lasso = r.lasso as { stem: number[]; loop: number[] };
    // El loop debe estar en {2,3}, sin estados con p.
    for (const s of lasso.loop) {
      expect(s === 2 || s === 3).toBe(true);
    }
  });
});

// ── Liveness: FG p (eventually always) ──────────────────────

describe('model-checking — FG p (eventually always)', () => {
  it('FG p holds si hay ciclo donde p siempre vale', () => {
    // En cyclicCounter(5), tomamos p=true en TODOS los estados.
    const r = checkEventuallyAlways(cyclicCounterSpace(5), () => true);
    expect(r.holds).toBe(true);
    expect(r.lasso).toBeDefined();
  });

  it('FG p NO holds si no hay ciclo enteramente en p', () => {
    // branchedLoop: p={s==0}; no hay ciclo enteramente en {0} (el ciclo es 0↔1).
    const r = checkEventuallyAlways(branchedLoopSpace(), (s) => s === 0);
    expect(r.holds).toBe(false);
  });
});

// ── Deadlock ────────────────────────────────────────────────

describe('model-checking — deadlock', () => {
  it('chain tiene deadlock en el último estado', () => {
    const r = hasDeadlock(chainSpace(5));
    expect(r.deadlocked).toBe(true);
    expect(r.state).toBe(4);
    const trace = r.trace as number[];
    expect(trace[0]).toBe(0);
    expect(trace[trace.length - 1]).toBe(4);
  });

  it('contador cíclico no tiene deadlock', () => {
    const r = hasDeadlock(cyclicCounterSpace(5));
    expect(r.deadlocked).toBe(false);
  });
});

// ── Ejemplos clásicos ───────────────────────────────────────

describe('model-checking — mutex Peterson-like', () => {
  it('reachable states es finito y razonable', () => {
    const space = mutualExclusionSpace();
    const r = reachableStates(space);
    expect(r.explored).toBeGreaterThan(0);
    expect(r.truncated).toBe(false);
  });

  it('mutex: NUNCA ambos procesos en critical simultáneamente', () => {
    const space = mutualExclusionSpace();
    const r = checkSafety(space, (s) => !(s.p1 === 'critical' && s.p2 === 'critical'));
    expect(r.safe).toBe(true);
  });

  it('mutex: detecta violación con predicado inverso (control)', () => {
    // Como control, comprobamos que SÍ existe algún estado con p1==critical.
    // Si invertimos el invariant (p1 nunca critical), debe fallar.
    const space = mutualExclusionSpace();
    const r = checkSafety(space, (s) => s.p1 !== 'critical');
    expect(r.safe).toBe(false);
    expect(r.violatingState?.p1).toBe('critical');
  });
});

describe('model-checking — dining philosophers', () => {
  it('n=2 alcanza un conjunto finito y no se cuelga', () => {
    const space = diningPhilosophersSpace(2);
    const r = reachableStates(space, { maxStates: 1000 });
    expect(r.explored).toBeGreaterThan(0);
    expect(r.truncated).toBe(false);
  });

  it('n=2: dos filósofos pueden comer pero no ambos a la vez (comparten ambos tenedores)', () => {
    // Con n=2: hay solo 2 tenedores. left(0)=0,right(0)=1; left(1)=1,right(1)=0.
    // Ambos comparten todos los tenedores → no pueden comer simultáneamente.
    const space = diningPhilosophersSpace(2);
    const r = checkSafety(space, (s) => !(s.phils[0] === 'eating' && s.phils[1] === 'eating'));
    expect(r.safe).toBe(true);
  });
});

describe('model-checking — reader-writer', () => {
  it('nunca hay readers y writer simultáneamente', () => {
    const space = readerWriterSpace(3);
    const r = checkSafety(space, (s) => !(s.writer && s.readers > 0));
    expect(r.safe).toBe(true);
  });

  it('writer no coexiste con otro writer (mutex de escritor)', () => {
    // El modelo solo tiene un flag writer boolean, así que estructural.
    const space = readerWriterSpace(2);
    const r = reachableStates(space);
    for (const s of r.states) {
      // Con writer=true, readers debe ser 0.
      if (s.writer) expect(s.readers).toBe(0);
    }
  });
});
