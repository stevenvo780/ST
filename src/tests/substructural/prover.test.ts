import { describe, it, expect } from 'vitest';
import { LinearFormula, LinearProof, proveLinear, proveAffine } from '../../profiles/substructural';

// --- Helpers de construccion ---

const atom = (name: string): LinearFormula => ({ kind: 'atom', name });
const tensor = (a: LinearFormula, b: LinearFormula): LinearFormula => ({
  kind: 'tensor',
  left: a,
  right: b,
});
const lolli = (a: LinearFormula, b: LinearFormula): LinearFormula => ({
  kind: 'lollipop',
  left: a,
  right: b,
});
const wWith = (a: LinearFormula, b: LinearFormula): LinearFormula => ({
  kind: 'with',
  left: a,
  right: b,
});
const plus = (a: LinearFormula, b: LinearFormula): LinearFormula => ({
  kind: 'plus',
  left: a,
  right: b,
});
const bang = (a: LinearFormula): LinearFormula => ({ kind: 'bang', arg: a });
const ONE: LinearFormula = { kind: 'one' };

const A = atom('A');
const B = atom('B');
const C = atom('C');

function rules(tree: LinearProof | null): string[] {
  if (!tree) return [];
  const out: string[] = [tree.rule];
  for (const p of tree.premises) out.push(...rules(p));
  return out;
}

// ============================================================
// LINEAR LOGIC
// ============================================================

describe('Linear logic — fragmento basico', () => {
  it('demuestra A ⊸ A (identidad)', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, A)] });
    expect(proof).not.toBeNull();
    expect(rules(proof)).toContain('lollipopR');
    expect(rules(proof)).toContain('axiom');
  });

  it('demuestra ⊢ 1 (unit)', () => {
    const proof = proveLinear({ left: [], right: [ONE] });
    expect(proof).not.toBeNull();
    expect(proof?.rule).toBe('oneR');
  });

  it('demuestra A ⊸ (1 ⊸ A) (curry trivial con 1)', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, lolli(ONE, A))] });
    expect(proof).not.toBeNull();
  });
});

describe('Linear logic — multiplicativos (⊗, ⊸)', () => {
  it('demuestra conmutatividad: A ⊗ B ⊸ B ⊗ A', () => {
    const proof = proveLinear({
      left: [],
      right: [lolli(tensor(A, B), tensor(B, A))],
    });
    expect(proof).not.toBeNull();
    const r = rules(proof);
    expect(r).toContain('lollipopR');
    expect(r).toContain('tensorL');
    expect(r).toContain('tensorR');
  });

  it('demuestra asociatividad: A ⊗ (B ⊗ C) ⊸ (A ⊗ B) ⊗ C', () => {
    const proof = proveLinear({
      left: [],
      right: [lolli(tensor(A, tensor(B, C)), tensor(tensor(A, B), C))],
    });
    expect(proof).not.toBeNull();
  });

  it('NO demuestra A ⊸ A ⊗ A (no contraction)', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, tensor(A, A))] });
    expect(proof).toBeNull();
  });

  it('NO demuestra A ⊗ B ⊸ A (no weakening en linear)', () => {
    const proof = proveLinear({ left: [], right: [lolli(tensor(A, B), A)] });
    expect(proof).toBeNull();
  });

  it('demuestra modus ponens lineal: A ⊗ (A ⊸ B) ⊸ B', () => {
    const proof = proveLinear({
      left: [],
      right: [lolli(tensor(A, lolli(A, B)), B)],
    });
    expect(proof).not.toBeNull();
  });

  it('demuestra composicion: (A ⊸ B) ⊗ (B ⊸ C) ⊸ (A ⊸ C)', () => {
    const proof = proveLinear({
      left: [],
      right: [lolli(tensor(lolli(A, B), lolli(B, C)), lolli(A, C))],
    });
    expect(proof).not.toBeNull();
  });
});

describe('Linear logic — aditivos (&, ⊕)', () => {
  it('demuestra A & B ⊸ A (proyeccion 1, with permite descartar uno)', () => {
    const proof = proveLinear({ left: [], right: [lolli(wWith(A, B), A)] });
    expect(proof).not.toBeNull();
    expect(rules(proof)).toContain('withL1');
  });

  it('demuestra A & B ⊸ B (proyeccion 2)', () => {
    const proof = proveLinear({ left: [], right: [lolli(wWith(A, B), B)] });
    expect(proof).not.toBeNull();
    expect(rules(proof)).toContain('withL2');
  });

  it('demuestra A ⊸ A ⊕ B (inyeccion 1)', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, plus(A, B))] });
    expect(proof).not.toBeNull();
    expect(rules(proof)).toContain('plusR1');
  });

  it('demuestra A ⊸ B ⊕ A (inyeccion 2)', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, plus(B, A))] });
    expect(proof).not.toBeNull();
    expect(rules(proof)).toContain('plusR2');
  });

  it('NO demuestra A ⊕ B ⊸ A (sin info de cual lado del plus)', () => {
    const proof = proveLinear({ left: [], right: [lolli(plus(A, B), A)] });
    expect(proof).toBeNull();
  });

  it('NO demuestra A ⊸ A & B (B no es derivable de A)', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, wWith(A, B))] });
    expect(proof).toBeNull();
  });
});

describe('Linear logic — exponencial bang (!)', () => {
  it('demuestra !A ⊸ A (dereliction)', () => {
    const proof = proveLinear({ left: [], right: [lolli(bang(A), A)] });
    expect(proof).not.toBeNull();
    // El prover usa la zona unrestricted: bangL promueve a Σ, luego
    // axioma desde Σ. Cualquier ruta correcta cuenta.
    const r = rules(proof);
    expect(r).toContain('bangL');
    expect(r).toContain('axiom');
  });

  it('demuestra !A ⊸ A ⊗ A (contraction via bang)', () => {
    const proof = proveLinear({ left: [], right: [lolli(bang(A), tensor(A, A))] });
    expect(proof).not.toBeNull();
    // La "contraction" se realiza implicitamente al copiar dos veces
    // desde la zona unrestricted Σ via derelictionL.
    const r = rules(proof);
    expect(r).toContain('bangL');
    expect(r).toContain('tensorR');
    // Dos copias de A desde Σ:
    const derelicts = r.filter((x) => x === 'derelictionL').length;
    const axioms = r.filter((x) => x === 'axiom').length;
    expect(derelicts + axioms).toBeGreaterThanOrEqual(2);
  });

  it('demuestra !A ⊸ 1 (weakening via bang)', () => {
    const proof = proveLinear({ left: [], right: [lolli(bang(A), ONE)] });
    expect(proof).not.toBeNull();
  });

  it('demuestra !A ⊗ !B ⊸ !B ⊗ !A (conmutatividad sobre !)', () => {
    const proof = proveLinear({
      left: [],
      right: [lolli(tensor(bang(A), bang(B)), tensor(bang(B), bang(A)))],
    });
    expect(proof).not.toBeNull();
  });

  it('NO demuestra A ⊸ !A (no se puede promover sin contexto bang)', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, bang(A))] });
    expect(proof).toBeNull();
  });
});

// ============================================================
// AFFINE LOGIC
// ============================================================

describe('Affine logic — weakening permitido', () => {
  it('demuestra A ⊗ B ⊸ A (weakening descarta B)', () => {
    const proof = proveAffine({ left: [], right: [lolli(tensor(A, B), A)] });
    expect(proof).not.toBeNull();
    expect(rules(proof)).toContain('weakening');
  });

  it('demuestra A ⊗ B ⊸ B (weakening descarta A)', () => {
    const proof = proveAffine({ left: [], right: [lolli(tensor(A, B), B)] });
    expect(proof).not.toBeNull();
  });

  it('demuestra A ⊸ 1 (todo es descartable en afin)', () => {
    const proof = proveAffine({ left: [], right: [lolli(A, ONE)] });
    expect(proof).not.toBeNull();
  });

  it('demuestra A ⊗ B ⊗ C ⊸ A (multi-weakening)', () => {
    const proof = proveAffine({
      left: [],
      right: [lolli(tensor(A, tensor(B, C)), A)],
    });
    expect(proof).not.toBeNull();
  });

  it('preserva validez lineal: A ⊸ A es valido en afin', () => {
    const proof = proveAffine({ left: [], right: [lolli(A, A)] });
    expect(proof).not.toBeNull();
  });
});

describe('Affine logic — contraction sigue prohibida', () => {
  it('NO demuestra A ⊸ A ⊗ A (no contraction en afin)', () => {
    const proof = proveAffine({ left: [], right: [lolli(A, tensor(A, A))] });
    expect(proof).toBeNull();
  });

  it('NO demuestra A ⊸ A & A si A es atomo (no, with si admite)', () => {
    // Trampa: A ⊸ A & A SI es valido en afin/linear porque
    // with usa el MISMO contexto en ambas ramas (no duplica).
    const proof = proveAffine({ left: [], right: [lolli(A, wWith(A, A))] });
    expect(proof).not.toBeNull();
  });

  it('SI demuestra (!A) ⊸ A ⊗ A en afin (bang permite contraction)', () => {
    const proof = proveAffine({ left: [], right: [lolli(bang(A), tensor(A, A))] });
    expect(proof).not.toBeNull();
  });
});

// ============================================================
// LINEAR vs AFFINE — discriminacion
// ============================================================

describe('Discriminacion entre linear y afin', () => {
  it('A ⊗ B ⊸ A: NO en linear, SI en afin', () => {
    const seq = { left: [], right: [lolli(tensor(A, B), A)] };
    expect(proveLinear(seq)).toBeNull();
    expect(proveAffine(seq)).not.toBeNull();
  });

  it('A ⊸ A ⊗ A: NO en linear, NO en afin', () => {
    const seq = { left: [], right: [lolli(A, tensor(A, A))] };
    expect(proveLinear(seq)).toBeNull();
    expect(proveAffine(seq)).toBeNull();
  });

  it('A ⊸ A: SI en linear, SI en afin', () => {
    const seq = { left: [], right: [lolli(A, A)] };
    expect(proveLinear(seq)).not.toBeNull();
    expect(proveAffine(seq)).not.toBeNull();
  });
});

// ============================================================
// Estructura de la prueba
// ============================================================

describe('Forma de las pruebas', () => {
  it('la conclusion de la prueba coincide con el secuente pedido', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, A)] });
    expect(proof).not.toBeNull();
    if (!proof) return;
    expect(proof.conclusion.left.length).toBe(0);
    expect(proof.conclusion.right.length).toBe(1);
    const first = proof.conclusion.right[0];
    expect(first?.kind).toBe('lollipop');
  });

  it('axiom tiene cero premisas', () => {
    const proof = proveLinear({ left: [A], right: [A] });
    expect(proof).not.toBeNull();
    expect(proof?.rule).toBe('axiom');
    expect(proof?.premises.length).toBe(0);
  });

  it('lollipopR tiene exactamente una premisa', () => {
    const proof = proveLinear({ left: [], right: [lolli(A, A)] });
    const lolliNode = proof?.rule === 'lollipopR' ? proof : null;
    expect(lolliNode).not.toBeNull();
    expect(lolliNode?.premises.length).toBe(1);
  });

  it('tensorR ramifica en 2 premisas', () => {
    const proof = proveLinear({ left: [A, B], right: [tensor(A, B)] });
    expect(proof).not.toBeNull();
    if (!proof) return;
    expect(proof.rule).toBe('tensorR');
    expect(proof.premises.length).toBe(2);
  });
});
