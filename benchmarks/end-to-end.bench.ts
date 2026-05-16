/**
 * End-to-End Benchmarks — Workspace Simulation
 * --------------------------------------------
 * Simula un workspace Agora típico: teorías con N axiomas,
 * derivaciones encadenadas, multi-perfil y overhead de interpreter.
 * Usa la API pública (evaluate / createInterpreter) igual que AgoraFront.
 */
import { bench, describe } from 'vitest';
import { evaluate, createInterpreter } from '../src/api';
import { Interpreter } from '../src/runtime/interpreter';

// ── Helpers ──────────────────────────────────────────────────

function run(source: string) {
  return new Interpreter().execute(source, '<bench-e2e>');
}

// ── Pre-built programs ────────────────────────────────────────

/** Workspace mínimo: 5 axiomas + check */
const WORKSPACE_SMALL = `
logic classical.propositional
axiom a0 = A0 -> A1
axiom a1 = A1 -> A2
axiom a2 = A2 -> A3
axiom a3 = A3 -> A4
axiom base = A0
derive A4 from {a0, a1, a2, a3, base}
check valid (A0 -> A4)
`;

/** Workspace mediano: 15 axiomas + derivaciones + glossary */
const WORKSPACE_MEDIUM = (() => {
  const lines = ['logic classical.propositional'];
  for (let i = 0; i < 15; i++) {
    lines.push(`axiom a${i} = T${i} -> T${i + 1}`);
  }
  lines.push('axiom base = T0');
  const names = Array.from({ length: 16 }, (_, i) => (i < 15 ? `a${i}` : 'base')).join(', ');
  lines.push(`derive T15 from {${names}}`);
  lines.push('check valid (T0 -> T15)');
  lines.push('glossary');
  return lines.join('\n');
})();

/** Workspace grande: 30 axiomas + truth table + varios checks */
const WORKSPACE_LARGE = (() => {
  const lines = ['logic classical.propositional'];
  for (let i = 0; i < 30; i++) {
    lines.push(`axiom ax${i} = (X${i} & Y${i}) -> Z${i}`);
  }
  for (let i = 0; i < 5; i++) {
    lines.push(`check valid (X${i} -> X${i})`);
  }
  lines.push('table (P & (P -> Q))');
  lines.push('countermodel (P & Q & !P)');
  return lines.join('\n');
})();

/** Workspace multi-perfil: switch de perfiles dentro de una sesión */
const WORKSPACE_MULTI_PROFILE = `
logic classical.propositional
check valid (P | !P)
check satisfiable (P & Q)

logic modal.k
check valid ([](P -> Q) -> ([]P -> []Q))
check satisfiable <>(P)

logic arithmetic
fn sum(n) {
  if valid n <= 0 { return 0 }
  let prev = n - 1
  let rest = sum(prev)
  return n + rest
}
let result = sum(10)
print result
`;

/** Agora workspace: teoría filosófica con claims y soporte */
const WORKSPACE_AGORA_PHILOSOPHY = `
logic classical.propositional
axiom modus_ponens = (P & (P -> Q)) -> Q
axiom hypothetical_syllogism = ((P -> Q) & (Q -> R)) -> (P -> R)
axiom disjunctive_syllogism = ((P | Q) & !P) -> Q
axiom a1 = A -> B
axiom a2 = B -> C
axiom a3 = C -> D
axiom premise = A
claim conclusion1 = B
claim conclusion2 = C
claim conclusion3 = D
support conclusion1 from {a1, premise}
support conclusion2 from {a2, conclusion1}
support conclusion3 from {a3, conclusion2}
derive D from {a1, a2, a3, premise}
`;

/** Stress SAT via interpreter (propositional solver path) */
const WORKSPACE_SAT_STRESS = (() => {
  // 20-var implication chain → satisfiability check
  const atoms = Array.from({ length: 20 }, (_, i) => `W${i}`);
  const implications = [];
  for (let i = 0; i < atoms.length - 1; i++) {
    implications.push(`(${atoms[i]} -> ${atoms[i + 1]})`);
  }
  return `
logic classical.propositional
check satisfiable ${implications.join(' & ')}
check valid (W0 -> W0)
countermodel (W0 & !W0)
`;
})();

// ── Benchmarks ────────────────────────────────────────────────

describe('E2E: API pública (evaluate)', () => {
  bench('evaluate short program via API', () => {
    evaluate('logic classical.propositional\ncheck valid (P -> P)');
  });

  bench('evaluate workspace small via API', () => {
    evaluate(WORKSPACE_SMALL);
  });

  bench('evaluate workspace medium via API', () => {
    evaluate(WORKSPACE_MEDIUM);
  });
});

describe('E2E: createInterpreter (stateful)', () => {
  bench('createInterpreter + exec small', () => {
    const st = createInterpreter();
    st.exec('logic classical.propositional\ncheck valid (P | !P)');
  });

  bench('createInterpreter + exec multi-step', () => {
    const st = createInterpreter();
    st.exec(WORKSPACE_AGORA_PHILOSOPHY);
  });
});

describe('E2E: workspace simulation (Interpreter direct)', () => {
  bench('workspace small (5 axioms + derive + check)', () => {
    run(WORKSPACE_SMALL);
  });

  bench('workspace medium (15 axioms + derive + check + glossary)', () => {
    run(WORKSPACE_MEDIUM);
  });

  bench('workspace large (30 axioms + checks + table + countermodel)', () => {
    run(WORKSPACE_LARGE);
  });

  bench('workspace multi-profile (propositional + modal + arithmetic)', () => {
    run(WORKSPACE_MULTI_PROFILE);
  });

  bench('workspace agora philosophy (theory + claims + support + derive)', () => {
    run(WORKSPACE_AGORA_PHILOSOPHY);
  });

  bench('workspace SAT stress (20-var implication + 3 queries)', () => {
    run(WORKSPACE_SAT_STRESS);
  });
});

describe('E2E: interpreter cold-start cost', () => {
  bench('new Interpreter() creation', () => {
    new Interpreter();
  });

  bench('createInterpreter() API creation', () => {
    createInterpreter();
  });
});
