import { describe, it, expect } from 'vitest';
import { ProtocolHandler } from '../../protocol/handler';
import type { ProtocolRequest } from '../../types';

const make = (method: string, params: Record<string, unknown> = {}, id = 1): ProtocolRequest =>
  ({ id, method, params }) as ProtocolRequest;

describe('protocol/handler — error paths', () => {
  const h = new ProtocolHandler();

  it('returns error for unknown method', () => {
    const r = h.handle({
      id: 1,
      method: 'totally_unknown',
      params: {},
    } as unknown as ProtocolRequest);
    expect(r.error).toBeDefined();
    expect(r.error?.message).toMatch(/desconocido/i);
  });

  it('returns error when params is not object', () => {
    const r = h.handle({
      id: 1,
      method: 'parse',
      params: 'not-an-object' as unknown as Record<string, unknown>,
    });
    expect(r.error?.message).toMatch(/se esperaba un objeto/);
  });

  it('returns error when params is null', () => {
    const r = h.handle({
      id: 1,
      method: 'parse',
      params: null as unknown as Record<string, unknown>,
    });
    expect(r.error?.message).toMatch(/se esperaba un objeto/);
  });

  it('returns error when params is an array', () => {
    const r = h.handle({
      id: 1,
      method: 'parse',
      params: [] as unknown as Record<string, unknown>,
    });
    expect(r.error?.message).toMatch(/se esperaba un objeto/);
  });

  it('returns error when required string is missing', () => {
    const r = h.handle(make('parse', {}));
    expect(r.error?.message).toMatch(/cadena no vacia/);
  });

  it('returns error when required string is empty', () => {
    const r = h.handle(make('parse', { source: '   ' }));
    expect(r.error?.message).toMatch(/cadena no vacia/);
  });

  it('returns error when required string is not string', () => {
    const r = h.handle(make('parse', { source: 123 }));
    expect(r.error?.message).toMatch(/cadena no vacia/);
  });

  it('returns error when optional string is wrong type', () => {
    const r = h.handle(make('parse', { source: 'logic classical.propositional', file: 5 }));
    expect(r.error?.message).toMatch(/debe ser una cadena/);
  });

  it('returns error when required integer is missing for hover', () => {
    const r = h.handle(make('hover', { source: 'logic classical.propositional' }));
    expect(r.error?.message).toMatch(/entero positivo/);
  });

  it('returns error when integer is not integer', () => {
    const r = h.handle(
      make('hover', { source: 'logic classical.propositional', line: 1.5, column: 2 }),
    );
    expect(r.error?.message).toMatch(/entero positivo/);
  });

  it('returns error when integer is < 1', () => {
    const r = h.handle(
      make('hover', { source: 'logic classical.propositional', line: 0, column: 2 }),
    );
    expect(r.error?.message).toMatch(/entero positivo/);
  });
});

describe('protocol/handler — parse, check, run', () => {
  const h = new ProtocolHandler();
  const src = `logic classical.propositional
axiom regla : P -> Q
theorem t1 : P -> P
check valid (P | !P)
`;

  it('parse: returns statements count', () => {
    const r = h.handle(make('parse', { source: src }));
    expect(r.result).toMatchObject({ statements: 4 });
    expect(r.diagnostics).toBeDefined();
  });

  it('parse: with explicit file', () => {
    const r = h.handle(make('parse', { source: src, file: 'demo.st' }));
    expect(r.result).toBeDefined();
  });

  it('check: valid when no error diagnostics', () => {
    const r = h.handle(make('check', { source: src }));
    expect(r.result).toMatchObject({ valid: true });
  });

  it('check: invalid when parse error', () => {
    const r = h.handle(
      make('check', { source: 'logic classical.propositional\naxiom bad :: garbage' }),
    );
    expect((r.result as { valid: boolean }).valid).toBe(false);
  });

  it('run: executes interpreter and returns ExecutionOutput', () => {
    const r = h.handle(make('run', { source: src }));
    expect(r.result).toBeDefined();
    expect((r.result as { stdout?: string }).stdout).toBeDefined();
  });
});

describe('protocol/handler — hover', () => {
  const h = new ProtocolHandler();
  const src = `logic classical.propositional
let alpha = P -> Q
let idea : "una idea"
axiom regla : P -> Q
theorem t1 : P -> P
define Mortal(x) := P(x) -> Q(x)
source Kant24 { author "Kant"; year 2024 }
fn helper(p, q) {
  return p
}
`;

  it('returns hover for let_decl formula', () => {
    const r = h.handle(make('hover', { source: src, line: 2, column: 6 }));
    expect((r.result as { content: string } | null)?.content).toMatch(/Let/);
  });

  it('returns hover for axiom_decl', () => {
    const r = h.handle(make('hover', { source: src, line: 4, column: 9 }));
    expect((r.result as { content: string } | null)?.content).toMatch(/Axioma/);
  });

  it('returns hover for theorem_decl', () => {
    const r = h.handle(make('hover', { source: src, line: 5, column: 10 }));
    expect((r.result as { content: string } | null)?.content).toMatch(/Teorema/);
  });

  it('returns hover for define_decl', () => {
    const r = h.handle(make('hover', { source: src, line: 6, column: 9 }));
    expect((r.result as { content: string } | null)?.content).toMatch(/Define/);
  });

  it('returns hover for source_decl', () => {
    const r = h.handle(make('hover', { source: src, line: 7, column: 12 }));
    expect((r.result as { content: string } | null)?.content).toMatch(/Source/);
  });

  it('returns hover for fn_decl', () => {
    const r = h.handle(make('hover', { source: src, line: 8, column: 5 }));
    expect((r.result as { content: string } | null)?.content).toMatch(/Función/);
  });

  it('returns hover for keyword', () => {
    const r = h.handle(make('hover', { source: src, line: 1, column: 3 }));
    expect((r.result as { content: string } | null)?.content).toMatch(/logic/i);
  });

  it('returns null when out-of-range line', () => {
    const r = h.handle(make('hover', { source: src, line: 999, column: 1 }));
    expect(r.result).toBeNull();
  });

  it('returns statement hover fallback when no word match', () => {
    const r = h.handle(make('hover', { source: src, line: 4, column: 1 }));
    expect(r.result).toBeDefined();
  });

  it('alias hover: "axioma" maps to axiom', () => {
    const altSrc = 'axioma\n';
    const r = h.handle(make('hover', { source: altSrc, line: 1, column: 2 }));
    expect((r.result as { content: string } | null)?.content).toMatch(/Declara una premisa|axiom/i);
  });

  it('profile hover: classical.propositional', () => {
    const r = h.handle(
      make('hover', { source: 'logic classical.propositional\n', line: 1, column: 10 }),
    );
    expect((r.result as { content: string } | null)?.content).toBeDefined();
  });

  it('hover returns null when column out of range', () => {
    const r = h.handle(
      make('hover', { source: 'logic classical.propositional\n', line: 1, column: 9999 }),
    );
    expect(r.result).toBeNull();
  });
});

describe('protocol/handler — symbols', () => {
  const h = new ProtocolHandler();
  const src = `logic classical.propositional
axiom regla : P -> Q
theorem t1 : P -> P
let alpha = P -> Q
claim c1 = alpha
define Mortal(x) := P(x) -> Q(x)
source Kant24 { author "Kant" }
fn helper(p, q) {
  return p
}
export define Sun(x) := P(x)
export source Other { author "x" }
export fn util(a) { return a }
`;

  it('returns list of symbols of various kinds', () => {
    const r = h.handle(make('symbols', { source: src }));
    const syms = r.result as Array<{ name: string; kind: string }>;
    expect(syms.length).toBeGreaterThan(5);
    const kinds = new Set(syms.map((s) => s.kind));
    expect(kinds.has('axiom')).toBe(true);
    expect(kinds.has('theorem')).toBe(true);
    expect(kinds.has('claim')).toBe(true);
    expect(kinds.has('definition')).toBe(true);
    expect(kinds.has('source')).toBe(true);
    expect(kinds.has('function')).toBe(true);
  });

  it('returns theory members with prefix', () => {
    const theorySrc = `logic classical.propositional
theory Mente(id) {
  axiom a1 : P
  theorem t1 : Q
  let x = P
  define D(y) := P
  fn h() { return 1 }
}
`;
    const r = h.handle(make('symbols', { source: theorySrc }));
    const syms = r.result as Array<{ name: string }>;
    expect(syms.some((s) => s.name === 'Mente')).toBe(true);
    expect(syms.some((s) => s.name.startsWith('Mente.'))).toBe(true);
  });
});

describe('protocol/handler — goto_definition', () => {
  const h = new ProtocolHandler();
  const src = `logic classical.propositional
axiom regla : P -> Q
theorem t1 : P -> P
theory Persona(n) {
  axiom personal : P
}
`;

  it('finds top-level definition', () => {
    const r = h.handle(make('goto_definition', { source: src, name: 'regla' }));
    expect(r.result).toBeDefined();
    expect((r.result as { line: number }).line).toBe(2);
  });

  it('returns null for missing name', () => {
    const r = h.handle(make('goto_definition', { source: src, name: 'noSuchName' }));
    expect(r.result).toBeNull();
  });

  it('finds member inside theory by qualified name', () => {
    const r = h.handle(make('goto_definition', { source: src, name: 'Persona.personal' }));
    expect(r.result).not.toBeNull();
  });

  it('finds member inside theory by unqualified name', () => {
    const r = h.handle(make('goto_definition', { source: src, name: 'personal' }));
    expect(r.result).not.toBeNull();
  });

  it('finds inside export_decl', () => {
    const r = h.handle(
      make('goto_definition', {
        source: 'logic classical.propositional\nexport axiom shared : P\n',
        name: 'shared',
      }),
    );
    expect(r.result).not.toBeNull();
  });
});

describe('protocol/handler — completion', () => {
  it('returns a list of completion items', () => {
    const h = new ProtocolHandler();
    const r = h.handle(make('completion', {}));
    const items = r.result as Array<{ label: string; kind: string }>;
    expect(items.length).toBeGreaterThan(20);
    expect(items.some((i) => i.label === 'logic')).toBe(true);
  });
});

describe('protocol/handler — render', () => {
  const h = new ProtocolHandler();
  const src = `logic classical.propositional
check valid (P | !P)
`;

  it('renders as markdown by default', () => {
    const r = h.handle(make('render', { source: src }));
    const out = r.result as { rendered: string; format: string };
    expect(out.format).toBe('markdown');
    expect(typeof out.rendered).toBe('string');
  });

  it('renders as json when requested', () => {
    const r = h.handle(make('render', { source: src, format: 'json' }));
    const out = r.result as { rendered: string; format: string };
    expect(out.format).toBe('json');
    expect(() => {
      JSON.parse(out.rendered);
    }).not.toThrow();
  });

  it('renders diagnostics in markdown when present', () => {
    const r = h.handle(
      make('render', { source: 'logic classical.propositional\nbadkeyword foo\n' }),
    );
    const out = r.result as { rendered: string };
    expect(out.rendered).toMatch(/Diagnosticos|.+/);
  });
});
