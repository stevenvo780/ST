// ============================================================
// ST TypeChecker — Tests unitarios
// ============================================================
//
// Cubre las 8 reglas TC001-TC008 + sugerencias Levenshtein.
// Cada test: parsea código ST, corre typeCheck, verifica errores.
// ============================================================

import { describe, it, expect } from 'vitest';
import { parse } from '../api';
import { typeCheck } from '../runtime/typecheck';
import { levenshtein, findClosest } from '../runtime/typecheck/levenshtein';
import type { TypeError } from '../runtime/typecheck';

// Helpers
function tc(source: string, profile = ''): TypeError[] {
  const result = parse(source, 'test.st');
  if (!result.ok || !result.program) return [];
  return typeCheck(result.program, profile, 'test.st');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- utilidad para debug, puede usarse en pruebas futuras
function codes(errors: TypeError[]): string[] {
  return errors.map((e) => e.code);
}

function hasCode(errors: TypeError[], code: string): boolean {
  return errors.some((e) => e.code === code);
}

// ── Levenshtein ───────────────────────────────────────────────

describe('levenshtein', () => {
  it('distancia 0 para strings iguales', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });

  it('distancia 1 para una inserción', () => {
    expect(levenshtein('abc', 'abcd')).toBe(1);
  });

  it('distancia 1 para una sustitución', () => {
    expect(levenshtein('abc', 'axc')).toBe(1);
  });

  it('distancia 1 para una eliminación', () => {
    expect(levenshtein('abcd', 'acd')).toBe(1);
  });

  it('distancia correcta para strings completamente distintos', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3);
  });

  it('maneja strings vacíos', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('', '')).toBe(0);
  });
});

describe('findClosest', () => {
  const candidates = ['axiomA', 'axiomB', 'myTheorem', 'alpha'];

  it('encuentra el más cercano con distancia ≤ 2', () => {
    expect(findClosest('axiomC', candidates)).toBe('axiomA');
  });

  it('devuelve undefined si no hay candidato cercano', () => {
    expect(findClosest('zzzzz', candidates)).toBeUndefined();
  });

  it('retorna el candidato exacto (distancia 0)', () => {
    expect(findClosest('alpha', candidates)).toBe('alpha');
  });

  it('typo de 1 letra sugiere correctamente', () => {
    expect(findClosest('alpa', candidates)).toBe('alpha');
  });
});

// ── Programa válido → 0 errores ────────────────────────────────

describe('programa válido', () => {
  it('propositional simple sin errores', () => {
    const errors = tc(`
      logic classical.propositional
      axiom a1 : P -> Q
      axiom a2 : P
      derive Q from a1, a2
    `);
    expect(errors).toHaveLength(0);
  });

  it('programa con fn y return sin errores', () => {
    const errors = tc(`
      logic classical.propositional
      fn doble(x) {
        return x
      }
    `);
    expect(errors.filter((e) => e.severity === 'error')).toHaveLength(0);
  });

  it('define_decl sin errores', () => {
    const errors = tc(`
      logic classical.propositional
      define IsHuman(x) := x
    `);
    expect(errors.filter((e) => e.severity === 'error')).toHaveLength(0);
  });
});

// ── TC001 — Predicate/name not declared ──────────────────────

describe('TC001 — nombre no declarado', () => {
  it('premisa no declarada en derive emite TC001', () => {
    const errors = tc(`
      logic classical.propositional
      axiom a1 : P -> Q
      derive Q from a1, a99
    `);
    expect(hasCode(errors, 'TC001')).toBe(true);
  });

  it('premisa no declarada en prove emite TC001', () => {
    const errors = tc(`
      logic classical.propositional
      axiom a1 : P -> Q
      prove Q from a1, wrongName
    `);
    expect(hasCode(errors, 'TC001')).toBe(true);
  });

  it('fn_call a función no declarada emite TC001', () => {
    const errors = tc(`logic classical.propositional\nfn miFn(x) {\n  return x\n}\nnoExiste(P)`);
    expect(hasCode(errors, 'TC001')).toBe(true);
  });
});

// ── TC001 — Sugerencia automática Levenshtein ─────────────────

describe('TC001 — sugerencias Levenshtein', () => {
  it('sugiere axioma cercano en premisa de derive', () => {
    const errors = tc(`
      logic classical.propositional
      axiom a1 : P -> Q
      axiom a2 : P
      derive Q from a1, a22
    `);
    const tc001 = errors.find((e) => e.code === 'TC001');
    expect(tc001).toBeDefined();
    expect(tc001?.suggestion).toMatch(/a2/);
  });

  it('no sugiere si el typo es muy diferente', () => {
    const errors = tc(`
      logic classical.propositional
      axiom a1 : P -> Q
      derive Q from a1, zzzzz
    `);
    const tc001 = errors.find((e) => e.code === 'TC001');
    expect(tc001).toBeDefined();
    expect(tc001?.suggestion).toBeUndefined();
  });
});

// ── TC002 — Arity mismatch ────────────────────────────────────

describe('TC002 — arity mismatch en fn_call', () => {
  it('fn declarada con 1 param llamada con 2 args emite TC002', () => {
    const errors = tc(`logic classical.propositional\nfn miFn(x) {\n  return x\n}\nmiFn(P, Q)`);
    expect(hasCode(errors, 'TC002')).toBe(true);
  });

  it('fn llamada con aridad correcta no emite TC002', () => {
    const errors = tc(`logic classical.propositional\nfn miFn(x) {\n  return x\n}\nmiFn(P)`);
    expect(hasCode(errors, 'TC002')).toBe(false);
  });
});

// ── TC004 — Modal en perfil no-modal ─────────────────────────

describe('TC004 — modalidad en perfil no-modal', () => {
  it('[] en classical.propositional emite TC004', () => {
    const errors = tc(`logic classical.propositional\ncheck valid ([] P)`);
    expect(hasCode(errors, 'TC004')).toBe(true);
  });

  it('<> en classical.propositional emite TC004', () => {
    const errors = tc(`logic classical.propositional\ncheck valid (<> P)`);
    expect(hasCode(errors, 'TC004')).toBe(true);
  });

  it('[] en modal.k no emite TC004', () => {
    const errors = tc(`logic modal.k\ncheck valid ([] P -> [] [] P)`, 'modal.k');
    expect(hasCode(errors, 'TC004')).toBe(false);
  });

  it('[] en epistemic.s5 no emite TC004', () => {
    const errors = tc(`logic epistemic.s5\ncheck valid ([] P)`, 'epistemic.s5');
    expect(hasCode(errors, 'TC004')).toBe(false);
  });
});

// ── TC005 — Incompatible types (aritmética en no-aritmético) ──

describe('TC005 — operación aritmética en perfil no-aritmético', () => {
  it('suma en classical.propositional emite TC005 (warning)', () => {
    const errors = tc(`logic classical.propositional\naxiom myA = 1 + 2`);
    const tc005 = errors.find((e) => e.code === 'TC005');
    expect(tc005).toBeDefined();
    expect(tc005?.severity).toBe('warning');
  });
});

// ── TC006 — Declaración duplicada ────────────────────────────

describe('TC006 — duplicate declaration', () => {
  it('axioma redeclarado emite TC006', () => {
    const errors = tc(`
      logic classical.propositional
      axiom myAx : P -> Q
      axiom myAx : Q -> R
    `);
    expect(hasCode(errors, 'TC006')).toBe(true);
  });

  it('teorema redeclarado emite TC006', () => {
    const errors = tc(`
      logic classical.propositional
      theorem myTh : P -> P
      theorem myTh : Q -> Q
    `);
    expect(hasCode(errors, 'TC006')).toBe(true);
  });

  it('axioma declarado una sola vez no emite TC006', () => {
    const errors = tc(`
      logic classical.propositional
      axiom uniq : P -> Q
    `);
    expect(hasCode(errors, 'TC006')).toBe(false);
  });
});

// ── TC007 — Circular import ───────────────────────────────────

describe('TC007 — importación circular', () => {
  it('import del propio archivo emite TC007', () => {
    const result = parse(
      `
      import "test.st"
      logic classical.propositional
    `,
      'test.st',
    );
    if (!result.ok || !result.program) return;
    const errors = typeCheck(result.program, '', 'test.st');
    expect(hasCode(errors, 'TC007')).toBe(true);
  });

  it('import duplicado emite TC007', () => {
    const errors = tc(`
      import "other.st"
      import "other.st"
      logic classical.propositional
    `);
    expect(hasCode(errors, 'TC007')).toBe(true);
  });

  it('import único no emite TC007', () => {
    const errors = tc(`
      import "other.st"
      logic classical.propositional
    `);
    expect(hasCode(errors, 'TC007')).toBe(false);
  });
});

// ── TC008 — return fuera de fn ────────────────────────────────

describe('TC008 — return fuera de fn', () => {
  it('return en top-level emite TC008', () => {
    const errors = tc(`
      logic classical.propositional
      return P
    `);
    expect(hasCode(errors, 'TC008')).toBe(true);
  });

  it('return dentro de fn no emite TC008', () => {
    const errors = tc(`
      logic classical.propositional
      fn test(x) {
        return x
      }
    `);
    expect(hasCode(errors, 'TC008')).toBe(false);
  });
});

// ── Profile-aware: modal en modal.k válido ────────────────────

describe('profile-aware', () => {
  it('deontic.standard acepta [] (necesidad deóntica)', () => {
    const errors = tc(`logic deontic.standard\ncheck valid ([] P)`, 'deontic.standard');
    expect(hasCode(errors, 'TC004')).toBe(false);
  });

  it('intuitionistic.propositional rechaza []', () => {
    const errors = tc(`logic intuitionistic.propositional\ncheck valid ([] P)`);
    expect(hasCode(errors, 'TC004')).toBe(true);
  });
});

// ── Integración: typeCheck desde api.ts ──────────────────────

describe('integración con api.ts typeCheck', () => {
  it('exporta typeCheck correctamente desde api', async () => {
    const { typeCheck: tc2, parse: p2 } = await import('../api');
    const r = p2(`
      logic classical.propositional
      axiom a1 : P -> Q
      derive Q from a1, missingPremise
    `);
    expect(r.program).not.toBeNull();
    const errs = tc2(r.program!, '');
    expect(errs.some((e) => e.code === 'TC001')).toBe(true);
  });

  it('programa limpio da [] desde api', async () => {
    const { typeCheck: tc2, parse: p2 } = await import('../api');
    const r = p2(`
      logic classical.propositional
      axiom a1 : P -> Q
      axiom a2 : P
    `);
    expect(r.program).not.toBeNull();
    const errs = tc2(r.program!, '');
    expect(errs.filter((e) => e.severity === 'error')).toHaveLength(0);
  });
});

// ── Formato de error ─────────────────────────────────────────

describe('formato de TypeError', () => {
  it('cada error tiene code, severity, message y location', () => {
    const errors = tc(`
      logic classical.propositional
      axiom dup : P
      axiom dup : Q
    `);
    const dup = errors.find((e) => e.code === 'TC006');
    expect(dup).toBeDefined();
    expect(dup?.code).toMatch(/^TC\d{3}$/);
    expect(['error', 'warning']).toContain(dup?.severity);
    expect(typeof dup?.message).toBe('string');
    expect(dup?.location).toBeDefined();
    expect(typeof dup?.location.line).toBe('number');
  });
});
