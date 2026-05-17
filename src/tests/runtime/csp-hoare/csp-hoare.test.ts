// ============================================================
// CSP Hoare — Tests de semántica operacional + trazas + failures
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  STOP,
  SKIP,
  prefix,
  choice,
  internal,
  parallel,
  interleave,
  sequence,
  hide,
  rename,
  recursion,
  processVar,
  alphabet,
  nextEvents,
  step,
  traces,
  failures,
  isDeadlocked,
  isLiveLocked,
  refinesTraces,
  refinesFailures,
  vendingMachine,
  vendingMachineLoop,
  diningPhilosophers,
  TICK,
} from '../../../runtime/csp-hoare';
import type { Event, Trace } from '../../../runtime/csp-hoare';

// ── Helpers ──────────────────────────────────────────────────

function tracesAsStrings(t: Trace[]): string[] {
  return t.map((tr) => tr.join(','));
}

// ── 1. Procesos triviales ────────────────────────────────────

describe('CSP Hoare — STOP / SKIP', () => {
  it('STOP está en deadlock y no ofrece eventos', () => {
    expect(isDeadlocked(STOP)).toBe(true);
    expect(nextEvents(STOP).size).toBe(0);
    expect(step(STOP, 'a')).toBeNull();
  });

  it('SKIP ofrece el tick ✓ y termina', () => {
    expect(nextEvents(SKIP).has(TICK)).toBe(true);
    expect(step(SKIP, TICK)).not.toBeNull();
    expect(isDeadlocked(SKIP)).toBe(false);
  });

  it('traces(STOP) = [[]] (solo traza vacía)', () => {
    const ts = traces(STOP, 5);
    expect(ts.length).toBe(1);
    expect(ts[0]).toEqual([]);
  });
});

// ── 2. Prefijo ───────────────────────────────────────────────

describe('CSP Hoare — Prefijo a → P', () => {
  it('a → STOP tiene trazas [[], [a]]', () => {
    const p = prefix('a', STOP);
    const ts = tracesAsStrings(traces(p, 5));
    expect(ts).toContain('');
    expect(ts).toContain('a');
    expect(ts.length).toBe(2);
  });

  it('a → b → STOP da exactamente las trazas vacía, [a], [a,b]', () => {
    const p = prefix('a', prefix('b', STOP));
    const ts = tracesAsStrings(traces(p, 5));
    expect(ts.sort()).toEqual(['', 'a', 'a,b']);
  });

  it('step(a → P, a) = P; step(a → P, b) = null', () => {
    const cont = prefix('x', STOP);
    const p = prefix('a', cont);
    expect(step(p, 'a')).toEqual(cont);
    expect(step(p, 'b')).toBeNull();
  });
});

// ── 3. Elección externa □ ────────────────────────────────────

describe('CSP Hoare — Elección externa □', () => {
  it('(a → STOP) □ (b → STOP) ofrece tanto a como b', () => {
    const p = choice(prefix('a', STOP), prefix('b', STOP));
    const init = nextEvents(p);
    expect(init.has('a')).toBe(true);
    expect(init.has('b')).toBe(true);
  });

  it('trazas de (a → STOP) □ (b → STOP) son {[], [a], [b]}', () => {
    const p = choice(prefix('a', STOP), prefix('b', STOP));
    const ts = tracesAsStrings(traces(p, 5));
    expect(ts.sort()).toEqual(['', 'a', 'b']);
  });
});

// ── 4. Elección interna ⊓ ────────────────────────────────────

describe('CSP Hoare — Elección interna ⊓', () => {
  it('(a → STOP) ⊓ (b → STOP) tiene refusal {b} en una resolución y {a} en otra', () => {
    const p = internal(prefix('a', STOP), prefix('b', STOP));
    const fs = failures(p, 1);
    // Hay al menos un failure con traza vacía donde se rehúsa `a`,
    // y otro donde se rehúsa `b` (porque la rama interna elegida fijó la opción).
    const empties = fs.filter((f) => f.trace.length === 0);
    const refusedA = empties.some((f) => f.refusal.has('a'));
    const refusedB = empties.some((f) => f.refusal.has('b'));
    expect(refusedA).toBe(true);
    expect(refusedB).toBe(true);
  });

  it('externa (a □ b) NUNCA rehúsa a ni b en la traza vacía', () => {
    const p = choice(prefix('a', STOP), prefix('b', STOP));
    const fs = failures(p, 1);
    const empties = fs.filter((f) => f.trace.length === 0);
    for (const f of empties) {
      expect(f.refusal.has('a')).toBe(false);
      expect(f.refusal.has('b')).toBe(false);
    }
  });
});

// ── 5. Máquina expendedora ───────────────────────────────────

describe('CSP Hoare — Vending machine', () => {
  it('vendingMachine ofrece coin como único evento inicial', () => {
    const vm = vendingMachine();
    const init = nextEvents(vm);
    expect(init.has('coin')).toBe(true);
    expect(init.size).toBe(1);
  });

  it('vendingMachine produce trazas [coin, tea] y [coin, coffee]', () => {
    const vm = vendingMachine();
    const ts = tracesAsStrings(traces(vm, 5));
    expect(ts).toContain('coin,tea');
    expect(ts).toContain('coin,coffee');
  });

  it('vendingMachineLoop tiene comportamiento cíclico (acepta secuencias largas)', () => {
    const vm = vendingMachineLoop();
    const ts = tracesAsStrings(traces(vm, 6));
    // Tras coin/tea o coin/coffee, vuelve y acepta otro coin.
    expect(ts.some((s) => s.startsWith('coin,tea,coin'))).toBe(true);
    expect(ts.some((s) => s.startsWith('coin,coffee,coin'))).toBe(true);
  });
});

// ── 6. Entrelazado ||| y paralelo |[A]| ──────────────────────

describe('CSP Hoare — Paralelo / interleave', () => {
  it('(a → STOP) ||| (b → STOP): traces [a,b] y [b,a]', () => {
    const p = interleave(prefix('a', STOP), prefix('b', STOP));
    const ts = tracesAsStrings(traces(p, 4));
    expect(ts).toContain('a,b');
    expect(ts).toContain('b,a');
  });

  it('(a → STOP) |[{a}]| (a → STOP): sincroniza, traces incluyen [a]', () => {
    const p = parallel(prefix('a', STOP), prefix('a', STOP), ['a']);
    const ts = tracesAsStrings(traces(p, 4));
    expect(ts).toContain('a');
    // No hay [a,a] porque ambos lados solo ofrecen `a` una vez.
    expect(ts).not.toContain('a,a');
  });

  it('(a → STOP) |[{a}]| (b → STOP) DEADLOCKS: a requiere ambos, b solo izq', () => {
    // Como `a` solo está en el izq y está en el alfabeto sync, el derecho
    // debe ofrecerlo también — pero no lo hace. Y `b` no está sincronizado,
    // así que el derecho sí puede hacer su b.
    const p = parallel(prefix('a', STOP), prefix('b', STOP), ['a']);
    const ts = tracesAsStrings(traces(p, 4));
    // Solo trazas: [] y [b] (porque a está bloqueado).
    expect(ts).toContain('b');
    expect(ts).not.toContain('a');
  });
});

// ── 7. Composición secuencial ──────────────────────────────-

describe('CSP Hoare — Composición secuencial ;', () => {
  it('SKIP ; (a → STOP) ≡ a → STOP en trazas', () => {
    const lhs = sequence(SKIP, prefix('a', STOP));
    const rhs = prefix('a', STOP);
    const tsLhs = tracesAsStrings(traces(lhs, 4)).sort();
    const tsRhs = tracesAsStrings(traces(rhs, 4)).sort();
    expect(tsLhs).toEqual(tsRhs);
  });

  it('(a → SKIP) ; (b → STOP) tiene la traza [a, b]', () => {
    const p = sequence(prefix('a', SKIP), prefix('b', STOP));
    const ts = tracesAsStrings(traces(p, 4));
    expect(ts).toContain('a,b');
  });
});

// ── 8. Hide \ A ──────────────────────────────────────────────

describe('CSP Hoare — Ocultación \\', () => {
  it('(a → b → STOP) \\ {a} ≡ b → STOP en trazas', () => {
    const p = hide(prefix('a', prefix('b', STOP)), ['a']);
    const ts = tracesAsStrings(traces(p, 4)).sort();
    // a queda oculto (τ silencioso), así que solo observamos `b`.
    expect(ts).toEqual(['', 'b']);
  });

  it('hide no introduce eventos nuevos: alphabet shrink', () => {
    const inner = prefix('a', prefix('b', STOP));
    const p = hide(inner, ['a']);
    const alpha = alphabet(p);
    expect(alpha.has('a')).toBe(false);
    expect(alpha.has('b')).toBe(true);
  });
});

// ── 9. Renaming P[f] ────────────────────────────────────────-

describe('CSP Hoare — Renaming', () => {
  it('rename a↦x en (a → STOP) produce trazas [[], [x]]', () => {
    const m = new Map<Event, Event>([['a', 'x']]);
    const p = rename(prefix('a', STOP), m);
    const ts = tracesAsStrings(traces(p, 3)).sort();
    expect(ts).toEqual(['', 'x']);
  });
});

// ── 10. Refinamiento ────────────────────────────────────────-

describe('CSP Hoare — Refinement', () => {
  it('STOP ⊑_T (a → STOP)? NO: a → STOP tiene traza [a] que STOP no acepta', () => {
    // STOP solo tiene la traza vacía. (a → STOP) tiene también [a].
    // En refinesTraces(spec, impl): impl_traces ⊆ spec_traces.
    // STOP es el spec más restrictivo (solo []), así que (a → STOP) NO lo refina.
    expect(refinesTraces(STOP, prefix('a', STOP))).toBe(false);
  });

  it('(a → STOP) ⊑_T STOP: STOP refina trivialmente todo (en trazas)', () => {
    // Cualquier traza de STOP (solo []) está en (a → STOP).
    expect(refinesTraces(prefix('a', STOP), STOP)).toBe(true);
  });

  it('Externa □ ⊑_F Interna ⊓ (con mismas trazas)', () => {
    // El cliente prefiere la externa: si la interna refina la externa en
    // failures, está bien — interna es "menos determinista", externa "más"
    // → refinesFailures(externa_como_spec, interna_como_impl) DEBERÍA fallar
    // porque interna agrega refusals.
    // Es decir: la versión interna NO refina a la externa.
    const ext = choice(prefix('a', STOP), prefix('b', STOP));
    const int = internal(prefix('a', STOP), prefix('b', STOP));
    expect(refinesFailures(ext, int, 2)).toBe(false);
  });

  it('Externa ⊑_F Externa (auto-refinamiento)', () => {
    const p = choice(prefix('a', STOP), prefix('b', STOP));
    expect(refinesFailures(p, p, 2)).toBe(true);
  });
});

// ── 11. Filósofos cenando: deadlock ─────────────────────────-

describe('CSP Hoare — Dining philosophers', () => {
  it('diningPhilosophers(2) puede llegar a estado bloqueado por contención de tenedores', () => {
    // Con 2 filósofos compartiendo 2 tenedores, si ambos toman su L
    // primero, nadie tiene R libre — eso aparece como una resolución
    // alcanzable cuyo nextEvents queda vacío.
    const dp = diningPhilosophers(2);
    // Buscamos en el árbol de estados una resolución sin eventos.
    let foundDeadlock = false;
    const visit = (q: typeof dp, depth: number): void => {
      if (depth > 6 || foundDeadlock) return;
      if (isDeadlocked(q)) {
        // STOP global (todas las resoluciones sin eventos) cuenta;
        // pero nos interesa "deadlock no-trivial" (con alguna traza ejecutada).
        foundDeadlock = true;
        return;
      }
      const init = nextEvents(q);
      for (const e of init) {
        const next = step(q, e);
        if (next) visit(next, depth + 1);
      }
    };
    visit(dp, 0);
    expect(foundDeadlock).toBe(true);
  });

  it('diningPhilosophers exige n ≥ 2', () => {
    expect(() => diningPhilosophers(1)).toThrow();
  });
});

// ── 12. Recursión y guardas ─────────────────────────────────-

describe('CSP Hoare — Recursión', () => {
  it('μX. a → X produce trazas con repetidos de a', () => {
    const p = recursion('X', prefix('a', processVar('X')));
    const ts = tracesAsStrings(traces(p, 4)).sort();
    expect(ts).toContain('a');
    expect(ts).toContain('a,a');
    expect(ts).toContain('a,a,a');
  });

  it('μX. X (sin guarda) es livelock', () => {
    const p = recursion('X', processVar('X'));
    expect(isLiveLocked(p, 4)).toBe(true);
  });

  it('μX. a → X (con guarda) NO es livelock', () => {
    const p = recursion('X', prefix('a', processVar('X')));
    expect(isLiveLocked(p, 4)).toBe(false);
  });
});

// ── 13. Alphabet ─────────────────────────────────────────────

describe('CSP Hoare — Alphabet sintáctico', () => {
  it('alphabet(a → b → STOP) = {a, b}', () => {
    const p = prefix('a', prefix('b', STOP));
    const a = alphabet(p);
    expect(a.has('a')).toBe(true);
    expect(a.has('b')).toBe(true);
    expect(a.size).toBe(2);
  });

  it('alphabet aplica renaming', () => {
    const m = new Map<Event, Event>([['a', 'x']]);
    const p = rename(prefix('a', prefix('b', STOP)), m);
    const a = alphabet(p);
    expect(a.has('x')).toBe(true);
    expect(a.has('b')).toBe(true);
    expect(a.has('a')).toBe(false);
  });
});

// ── 14. Failures: STOP rehúsa todo ──────────────────────────-

describe('CSP Hoare — Failures de STOP', () => {
  it('Tras a → STOP consumir [a], el estado STOP rehúsa todos los eventos visibles', () => {
    // Tras la traza [a], el continuante es STOP: debe aparecer un failure
    // con traza [a] cuyo refusal contenga el alfabeto visible (acá: {a}).
    const p = prefix('a', STOP);
    const fs = failures(p, 2);
    const afterA = fs.find((f) => f.trace.length === 1 && f.trace[0] === 'a');
    expect(afterA).toBeDefined();
    expect(afterA!.refusal.has('a')).toBe(true);
  });
});

// ── 15. Determinismo: traces() es determinista (mismo input → mismo output) ──

describe('CSP Hoare — Determinismo del análisis', () => {
  it('traces() es determinista bajo el mismo proceso', () => {
    const p = choice(prefix('a', prefix('b', STOP)), prefix('c', STOP));
    const t1 = tracesAsStrings(traces(p, 4));
    const t2 = tracesAsStrings(traces(p, 4));
    expect(t1).toEqual(t2);
  });

  it('failures() es determinista (mismo número de fallas, mismas trazas)', () => {
    const p = internal(prefix('a', STOP), prefix('b', STOP));
    const f1 = failures(p, 2);
    const f2 = failures(p, 2);
    expect(f1.length).toBe(f2.length);
  });
});

// ── 16. Composición: paralelo asociativo en trazas ──────────-

describe('CSP Hoare — Propiedades algebraicas', () => {
  it('(a → STOP) ||| STOP ≡ a → STOP en trazas', () => {
    const lhs = interleave(prefix('a', STOP), STOP);
    const ts = tracesAsStrings(traces(lhs, 3)).sort();
    expect(ts).toEqual(['', 'a']);
  });

  it('STOP □ P ofrece exactamente lo de P (en eventos iniciales)', () => {
    const p = prefix('a', STOP);
    const ext = choice(STOP, p);
    const init = nextEvents(ext);
    expect(init.has('a')).toBe(true);
    expect(init.size).toBe(1);
  });
});
