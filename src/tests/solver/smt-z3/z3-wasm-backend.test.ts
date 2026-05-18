// ============================================================
// ST SMT-Z3 Tests — Z3WasmBackend (in-process WASM)
// ============================================================

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Z3WasmBackend, detectAvailableSMT, isZ3Available } from '../../../solver/smt-z3';

// Detección sincronizada: `describe.skipIf(!flag)` necesita boolean inmediato.
// Evitamos top-level await (incompatible con CommonJS) usando `require.resolve`
// para verificar que la dependencia está instalada. El boot WASM real ocurre
// dentro de los tests (en `beforeAll` o `Z3WasmBackend.create()`); si la dep
// está instalada y carga ahí falla, vitest reporta el fallo limpiamente.
function z3PackageInstalled(): boolean {
  try {
    require.resolve('z3-solver');
    return true;
  } catch {
    return false;
  }
}
const z3Available = z3PackageInstalled();

describe('isZ3Available / detectAvailableSMT', () => {
  it('isZ3Available devuelve boolean sin throw', async () => {
    const v = await isZ3Available();
    expect(typeof v).toBe('boolean');
  });

  it('detectAvailableSMT devuelve un runtime conocido', async () => {
    const runtime = await detectAvailableSMT();
    expect(['z3-wasm', 'z3-subprocess', 'cvc5-subprocess', 'none']).toContain(runtime);
  });

  it('cuando z3-wasm carga, detectAvailableSMT prefiere z3-wasm', async () => {
    if (!z3Available) {
      // Si WASM no cargó, el detector puede caer a subprocess o none —
      // ambos casos son válidos.
      return;
    }
    const runtime = await detectAvailableSMT();
    expect(runtime).toBe('z3-wasm');
  });
});

describe.skipIf(!z3Available)('Z3WasmBackend — sat/unsat básicos', () => {
  let backend: Z3WasmBackend;

  beforeAll(async () => {
    backend = await Z3WasmBackend.create();
  });

  afterAll(() => {
    backend.close();
  });

  it('LIA: x > 5 → sat con model', async () => {
    backend.reset();
    backend.declareConst('x', 'Int');
    backend.assertFormula('(> x 5)');
    const result = await backend.checkSat();
    expect(result).toBe('sat');
    const model = backend.getModel();
    expect(model).toBeDefined();
    if (model) {
      expect(typeof model.x).toBe('number');
      expect(Number(model.x)).toBeGreaterThan(5);
    }
  });

  it('LIA: x = 5 ∧ x = 6 → unsat', async () => {
    backend.reset();
    backend.declareConst('x', 'Int');
    backend.assertFormula('(= x 5)');
    backend.assertFormula('(= x 6)');
    const result = await backend.checkSat();
    expect(result).toBe('unsat');
    expect(backend.getModel()).toBeUndefined();
  });

  it('LRA: x > 5 ∧ x < 3 → unsat', async () => {
    backend.reset();
    backend.declareConst('x', 'Real');
    backend.assertFormula('(> x 5.0)');
    backend.assertFormula('(< x 3.0)');
    const result = await backend.checkSat();
    expect(result).toBe('unsat');
  });

  it('LRA: x > 0 ∧ x < 1 → sat con racional fraccionario', async () => {
    backend.reset();
    backend.declareConst('x', 'Real');
    backend.assertFormula('(> x 0.0)');
    backend.assertFormula('(< x 1.0)');
    const result = await backend.checkSat();
    expect(result).toBe('sat');
    const model = backend.getModel();
    expect(model).toBeDefined();
    if (model && typeof model.x === 'number') {
      expect(model.x).toBeGreaterThan(0);
      expect(model.x).toBeLessThan(1);
    }
  });

  it('Bool: P ∧ ¬P → unsat', async () => {
    backend.reset();
    backend.declareConst('P', 'Bool');
    backend.assertFormula('(and P (not P))');
    const result = await backend.checkSat();
    expect(result).toBe('unsat');
  });

  it('Bool: P ∨ ¬P → sat', async () => {
    backend.reset();
    backend.declareConst('P', 'Bool');
    backend.assertFormula('(or P (not P))');
    expect(await backend.checkSat()).toBe('sat');
  });
});

describe.skipIf(!z3Available)('Z3WasmBackend — BitVec', () => {
  it('BV8: x = #x05 → sat con model x=5', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'BitVec', 8);
      backend.assertFormula('(= x #x05)');
      const result = await backend.checkSat();
      expect(result).toBe('sat');
      const model = backend.getModel();
      expect(model).toBeDefined();
      if (model) {
        // El decoder normaliza #x05 → 5.
        expect(model.x).toBe(5);
      }
    } finally {
      backend.close();
    }
  });

  it('BV8: x = 5 ∧ x = 10 → unsat', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'BitVec', 8);
      backend.assertFormula('(= x #x05)');
      backend.assertFormula('(= x #x0a)');
      expect(await backend.checkSat()).toBe('unsat');
    } finally {
      backend.close();
    }
  });

  it('BV con bvWidth default (32 bits)', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'BitVec');
      backend.assertFormula('(bvult x #x00000010)');
      expect(await backend.checkSat()).toBe('sat');
    } finally {
      backend.close();
    }
  });
});

describe.skipIf(!z3Available)('Z3WasmBackend — push/pop', () => {
  it('pop restaura sat tras conflict en scope', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(> x 0)');
      expect(await backend.checkSat()).toBe('sat');

      backend.push();
      backend.assertFormula('(< x 0)');
      expect(await backend.checkSat()).toBe('unsat');

      backend.pop();
      expect(await backend.checkSat()).toBe('sat');
    } finally {
      backend.close();
    }
  });

  it('pop con levels=2 baja dos scopes', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(>= x 0)');
      backend.push();
      backend.assertFormula('(>= x 5)');
      backend.push();
      backend.assertFormula('(<= x 3)');
      expect(await backend.checkSat()).toBe('unsat');
      backend.pop(2);
      // Tras pop(2) sólo queda (>= x 0)
      expect(await backend.checkSat()).toBe('sat');
    } finally {
      backend.close();
    }
  });

  it('pop sin push no rompe el solver', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(>= x 0)');
      backend.pop(5); // intento de underflow
      expect(await backend.checkSat()).toBe('sat');
    } finally {
      backend.close();
    }
  });
});

describe.skipIf(!z3Available)('Z3WasmBackend — unsat core', () => {
  it('reporta core de assertions nombradas inconsistentes', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertNamed('c1', '(> x 5)');
      backend.assertNamed('c2', '(< x 3)');
      backend.assertNamed('c3', '(>= x -100)');
      const result = await backend.checkSat();
      expect(result).toBe('unsat');
      const core = backend.getUnsatCore();
      // El core debe contener al menos c1 y c2 (los que se contradicen).
      expect(core).toContain('c1');
      expect(core).toContain('c2');
      // c3 es satisfiable y no debería estar en el core.
      expect(core).not.toContain('c3');
    } finally {
      backend.close();
    }
  });

  it('core vacío cuando todo es satisfiable', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertNamed('c1', '(>= x 0)');
      backend.assertNamed('c2', '(<= x 100)');
      const result = await backend.checkSat();
      expect(result).toBe('sat');
      expect(backend.getUnsatCore()).toEqual([]);
    } finally {
      backend.close();
    }
  });

  it('assertNamed con mismo nombre dos veces tira error', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertNamed('c1', '(> x 0)');
      expect(() => backend.assertNamed('c1', '(> x 1)')).toThrow(/ya fue usado/i);
    } finally {
      backend.close();
    }
  });
});

describe.skipIf(!z3Available)('Z3WasmBackend — opciones y stats', () => {
  it('setOption("timeout", N) no rompe checkSat trivial', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.setOption('timeout', 1000);
      backend.declareConst('x', 'Int');
      backend.assertFormula('(> x 0)');
      const result = await backend.checkSat();
      expect(result).toBe('sat');
    } finally {
      backend.close();
    }
  });

  it('create con timeoutMs en options', async () => {
    const backend = await Z3WasmBackend.create({ timeoutMs: 5000 });
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(> x 0)');
      expect(await backend.checkSat()).toBe('sat');
    } finally {
      backend.close();
    }
  });

  it('getStatistics devuelve un mapa numérico tras checkSat', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(> x 0)');
      await backend.checkSat();
      const stats = backend.getStatistics();
      expect(typeof stats).toBe('object');
      // Z3 reporta al menos algunas métricas tras un check.
      for (const v of Object.values(stats)) {
        expect(typeof v).toBe('number');
      }
    } finally {
      backend.close();
    }
  });
});

describe.skipIf(!z3Available)('Z3WasmBackend — varios', () => {
  it('reset limpia decls y asserts', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(= x 5)');
      backend.assertFormula('(= x 6)');
      expect(await backend.checkSat()).toBe('unsat');

      backend.reset();
      backend.declareConst('y', 'Int');
      backend.assertFormula('(= y 7)');
      const result = await backend.checkSat();
      expect(result).toBe('sat');
      const model = backend.getModel();
      expect(model?.y).toBe(7);
    } finally {
      backend.close();
    }
  });

  it('create con SMTLogic (QF_LIA) acepta el preset', async () => {
    const backend = await Z3WasmBackend.create('QF_LIA');
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(> x 100)');
      expect(await backend.checkSat()).toBe('sat');
    } finally {
      backend.close();
    }
  });

  it('combinación LIA con varias variables (x + y = 10, x - y = 2)', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.declareConst('y', 'Int');
      backend.assertFormula('(= (+ x y) 10)');
      backend.assertFormula('(= (- x y) 2)');
      const result = await backend.checkSat();
      expect(result).toBe('sat');
      const model = backend.getModel();
      expect(model).toBeDefined();
      if (model) {
        expect(model.x).toBe(6);
        expect(model.y).toBe(4);
      }
    } finally {
      backend.close();
    }
  });

  it('name del backend es "z3-wasm"', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      expect(backend.name).toBe('z3-wasm');
    } finally {
      backend.close();
    }
  });

  it('getModel devuelve copia (mutaciones del caller no afectan estado interno)', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(= x 42)');
      await backend.checkSat();
      const m1 = backend.getModel();
      expect(m1).toBeDefined();
      if (m1) {
        m1.x = 999;
        const m2 = backend.getModel();
        expect(m2?.x).toBe(42);
      }
    } finally {
      backend.close();
    }
  });

  it('assertFormula vacío es no-op', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('   '); // whitespace
      backend.assertFormula('(>= x 0)');
      expect(await backend.checkSat()).toBe('sat');
    } finally {
      backend.close();
    }
  });

  it('checkSat puede ejecutarse múltiples veces sin reset', async () => {
    const backend = await Z3WasmBackend.create();
    try {
      backend.declareConst('x', 'Int');
      backend.assertFormula('(>= x 0)');
      const r1 = await backend.checkSat();
      const r2 = await backend.checkSat();
      expect(r1).toBe('sat');
      expect(r2).toBe('sat');
    } finally {
      backend.close();
    }
  });
});
