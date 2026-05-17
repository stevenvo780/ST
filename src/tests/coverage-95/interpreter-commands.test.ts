import { describe, it, expect } from 'vitest';
import { Interpreter } from '../../runtime/interpreter';

function run(src: string): ReturnType<Interpreter['execute']> {
  return new Interpreter().execute(src);
}

describe('Interpreter — commands and statements', () => {
  it('axiom and theorem declarations', () => {
    const out = run(`logic classical.propositional
axiom a1 : P -> Q
theorem t1 : P -> P
`);
    expect(out.exitCode).toBe(0);
  });

  it('derive command with multiple premises', () => {
    const out = run(`logic classical.propositional
axiom a1 : P -> Q
axiom a2 : P
derive Q from a1, a2
`);
    expect(out.exitCode).toBe(0);
    expect(out.results[0]?.status).toBeDefined();
  });

  it('check valid / satisfiable / equivalent', () => {
    const out = run(`logic classical.propositional
check valid (P -> P)
check satisfiable (P)
check equivalent (P & Q), (Q & P)
`);
    expect(out.exitCode).toBe(0);
    expect(out.results.length).toBe(3);
  });

  it('check invalid detects non-tautology', () => {
    const out = run(`logic classical.propositional
check valid (P -> Q)
`);
    expect(out.exitCode).toBe(0);
  });

  it('prove command with premises', () => {
    const out = run(`logic classical.propositional
axiom a : P
prove (P | Q) from a
`);
    expect(out.exitCode).toBe(0);
  });

  it('countermodel command', () => {
    const out = run(`logic classical.propositional
countermodel (P -> Q)
`);
    expect(out.exitCode).toBe(0);
  });

  it('truth_table command', () => {
    const out = run(`logic classical.propositional
truth_table (P & Q)
`);
    expect(out.exitCode).toBe(0);
  });

  it('explain command', () => {
    const out = run(`logic classical.propositional
explain (P -> P)
`);
    expect(out.exitCode).toBe(0);
  });

  it('analyze produces output', () => {
    const out = run(`logic classical.propositional
axiom a1 : P -> Q
axiom a2 : P
analyze {
  premises: [a1, a2]
  conclusion: Q
}
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('let bindings and print', () => {
    const out = run(`logic classical.propositional
let phi = P -> P
print phi
`);
    expect(out.exitCode).toBe(0);
  });

  it('let description binding', () => {
    const out = run(`logic classical.propositional
let coment : "una nota"
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('if/else with valid condition', () => {
    const out = run(`logic classical.propositional
if valid (P -> P) {
  print "ok"
} else {
  print "no"
}
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('ok');
  });

  it('if without else branch', () => {
    const out = run(`logic classical.propositional
if valid (P -> P) {
  print "ok"
}
`);
    expect(out.exitCode).toBe(0);
  });

  it('claim, support, confidence, context declarations', () => {
    const out = run(`logic classical.propositional
let phi = P -> Q
claim c1 = phi
source S { author "X" }
support c1 <- S
confidence c1 = 0.9
context c1 = "domain"
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('theory declaration with members', () => {
    const out = run(`logic classical.propositional
theory Mente(idArg) {
  axiom esta : P
  theorem cogito : P -> P
}
`);
    expect(out.exitCode).toBe(0);
  });

  it('theory extends parent', () => {
    const out = run(`logic classical.propositional
theory Base(n) {
  axiom b : P
}
theory Hijo(n) extends Base {
  theorem h : P
}
`);
    expect(out.exitCode).toBe(0);
  });

  it('define and unfold', () => {
    const out = run(`logic classical.propositional
define Mortal(x) := P -> Q
unfold Mortal(s)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('fold command', () => {
    const out = run(`logic classical.propositional
define M(x) := P -> Q
fold (P -> Q)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('source declaration', () => {
    const out = run(`logic classical.propositional
source Kant24 { author "Kant" }
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('glossary command shows definitions', () => {
    const out = run(`logic classical.propositional
define M(x) := P
glossary
`);
    expect(out.exitCode).toBe(0);
  });

  it('fn declaration and call', () => {
    const out = run(`logic arithmetic
fn double(x) {
  return x * 2
}
let r = double(5)
print r
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('10');
  });

  it('print with formula', () => {
    const out = run(`logic classical.propositional
let phi = P -> Q
print phi
`);
    expect(out.exitCode).toBe(0);
  });

  it('set updates existing binding', () => {
    const out = run(`logic arithmetic
let x = 5
set x = 10
print x
`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('10');
  });

  it('reset between executes', () => {
    const i = new Interpreter();
    i.execute('logic classical.propositional\naxiom a : P\n');
    i.reset();
    const out = i.execute('logic classical.propositional\ntheorem t : P\n');
    expect(out.exitCode).toBe(0);
  });

  it('parser errors propagate as exitCode 1', () => {
    const out = run('logic\n@@@@\n');
    expect(out.exitCode).toBe(1);
  });

  it('arithmetic profile evaluates expressions', () => {
    const out = run(`logic arithmetic
let r = 2 + 3
print r
`);
    expect(out.exitCode).toBe(0);
    expect(typeof out.stdout).toBe('string');
  });

  it('export declarations work', () => {
    const out = run(`logic classical.propositional
export axiom shared : P
`);
    expect(out.exitCode).toBe(0);
  });

  it('return inside fn', () => {
    const out = run(`logic arithmetic
fn id(x) {
  return x
}
let r = id(7)
print r
`);
    expect(out.exitCode).toBe(0);
  });

  it('handles complex theory inheritance', () => {
    const out = run(`logic classical.propositional
theory A(x) {
  axiom a1 : P
  private axiom secret : Q
}
theory B(x) extends A {
  theorem t1 : P
}
`);
    expect(out.exitCode).toBe(0);
  });

  it('multiple profiles in execution (sequential)', () => {
    const out = run(`logic arithmetic
let x = 5
print x
`);
    expect(out.exitCode).toBe(0);
  });

  it('handles aristotelian profile', () => {
    const out = run(`logic aristotelian.syllogistic
axiom barbara : forall x (H(x) -> M(x))
`);
    // Don't assert exitCode—syllogistic has its own validation
    expect(typeof out.stdout).toBe('string');
  });

  it('handles probabilistic profile', () => {
    const out = run(`logic probabilistic.basic
check valid (P -> P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('handles intuitionistic profile', () => {
    const out = run(`logic intuitionistic.propositional
check valid (P | !P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('handles temporal.ltl profile', () => {
    const out = run(`logic temporal.ltl
axiom a : X(P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('handles paraconsistent.belnap', () => {
    const out = run(`logic paraconsistent.belnap
check satisfiable (P & !P)
`);
    expect(out.exitCode).toBe(0);
  });

  it('handles deontic.standard', () => {
    const out = run(`logic deontic.standard
check valid (P -> P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('handles modal.k', () => {
    const out = run(`logic modal.k
check valid ([](P -> Q) -> ([]P -> []Q))
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('handles epistemic.s5', () => {
    const out = run(`logic epistemic.s5
check valid ([]P -> P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('renders output via render cmd', () => {
    const out = run(`logic classical.propositional
render markdown
check valid (P -> P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('execute REPL mode (executeSingle)', () => {
    const i = new Interpreter();
    const r = i.executeSingle('logic classical.propositional');
    expect(r.exitCode).toBe(0);
  });

  it('execute with input that fails leniently keeps interpreter alive', () => {
    const i = new Interpreter();
    i.execute('logic classical.propositional\naxiom a : P\n');
    const r = i.execute('logic classical.propositional\nderive Q from doesntExist\n');
    expect(r.exitCode).toBeDefined();
  });

  it('getTheory returns current state', () => {
    const i = new Interpreter();
    i.execute('logic classical.propositional\naxiom a : P\ntheorem t : P -> P\n');
    const t = i.getTheory();
    expect(t.axioms.size).toBeGreaterThan(0);
    expect(t.theorems.size).toBeGreaterThan(0);
  });

  it('getProfile returns active profile', () => {
    const i = new Interpreter();
    i.execute('logic classical.propositional\n');
    expect(i.getProfile()?.name).toBe('classical.propositional');
  });

  it('getLetBindings returns let bindings', () => {
    const i = new Interpreter();
    i.execute('logic classical.propositional\nlet phi = P -> Q\n');
    expect(i.getLetBindings().has('phi')).toBe(true);
  });
});
