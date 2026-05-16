/**
 * Text Layer Benchmarks
 * ---------------------
 * Mide rendimiento de formalización de texto: registro de pasajes,
 * anchors, claims y evaluación via ProtocolHandler.
 */
import { bench, describe } from 'vitest';
import { ProtocolHandler } from '../src/protocol/handler';
import { createTextLayerState, registerPassage } from '../src/text-layer/compiler';
import { Interpreter } from '../src/runtime/interpreter';

// ── Helpers ──────────────────────────────────────────────────

function run(source: string) {
  return new Interpreter().execute(source, '<bench-text>');
}

// ── Protocol Handler ──────────────────────────────────────────

describe('Text Layer: ProtocolHandler round-trips', () => {
  bench('parse via protocol (short program)', () => {
    const h = new ProtocolHandler();
    h.handle({
      id: 1,
      method: 'parse',
      params: { source: 'logic classical.propositional\ncheck valid (P -> P)' },
    });
  });

  bench('run via protocol (axiom + derive)', () => {
    const h = new ProtocolHandler();
    h.handle({
      id: 2,
      method: 'run',
      params: {
        source: `
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = Q -> R
derive (P -> R) from {a1, a2}
`,
      },
    });
  });

  bench('hover via protocol', () => {
    const h = new ProtocolHandler();
    h.handle({
      id: 3,
      method: 'hover',
      params: {
        source: 'logic classical.propositional\naxiom a1 = P -> Q\ncheck valid (P -> Q)',
        line: 3,
        column: 12,
      },
    });
  });

  bench('symbols via protocol', () => {
    const h = new ProtocolHandler();
    h.handle({
      id: 4,
      method: 'symbols',
      params: {
        source: `
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = Q -> R
axiom a3 = R -> S
define Hyp := (P & Q)
`,
      },
    });
  });
});

describe('Text Layer: anchor state operations', () => {
  bench('createTextLayerState (fresh)', () => {
    createTextLayerState();
  });

  bench('registerPassage x10 (distinct anchors)', () => {
    const state = createTextLayerState();
    for (let i = 0; i < 10; i++) {
      registerPassage(state, `p${i}`, `doc${i}.md#h2-section${i}`);
    }
  });

  bench('registerPassage x50 (distinct anchors)', () => {
    const state = createTextLayerState();
    for (let i = 0; i < 50; i++) {
      registerPassage(state, `passage${i}`, `chapter${i}.md#p${i}`);
    }
  });
});

describe('Text Layer: formalization via ST source', () => {
  bench('claim + support in classical', () => {
    run(`
logic classical.propositional
axiom premises = (P & (P -> Q))
claim conclusion = Q
support conclusion from {premises}
`);
  });

  bench('define + render (markdown output)', () => {
    run(`
logic classical.propositional
define Hyp := (P & Q)
define Conc := R
render Hyp
`);
  });

  bench('10 claims with confidence', () => {
    const lines = ['logic classical.propositional'];
    for (let i = 0; i < 10; i++) {
      lines.push(`axiom h${i} = A${i} -> B${i}`);
      lines.push(`claim c${i} = B${i}`);
      lines.push(`confidence c${i} = 0.${(i + 1).toString().padStart(2, '0')}`);
    }
    run(lines.join('\n'));
  });
});
