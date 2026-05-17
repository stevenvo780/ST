// ============================================================
// ST Categorical — Tests
// ============================================================
// Cubre:
//   • FinSet: identidad, asociatividad, hom-sets.
//   • Poset: clausura reflexivo-transitiva y categoricidad.
//   • Free: paths como morfismos, asociatividad.
//   • Functor: identidad y composición; preservación de leyes.
//   • NaturalTransformation: naturalidad estricta y trivial (id).
//   • Limits: product, coproduct, equalizer (FinSet binarios).
//   • Monoidal: unitores y asociador estructurales.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  FinSet,
  mkFinSetMor,
  Poset,
  Free,
  mkFunctor,
  identityFunctor,
  composeFunctors,
  mkNaturalTransformation,
  identityNT,
  isCone,
  isLimit,
  product,
  coproduct,
  equalizer,
  coequalizer,
  FinSetMonoidal,
  type FinSetObj,
  type FinSetMor,
  type Diagram,
  type Cone,
} from '../../categorical';

// Reutilizamos estos objetos en varios tests.
const A: FinSetObj = { name: 'A', elements: ['a0', 'a1'] };
const B: FinSetObj = { name: 'B', elements: ['b0', 'b1', 'b2'] };
const C: FinSetObj = { name: 'C', elements: ['c0'] };

describe('FinSet — categoría', () => {
  it('FinSet con 2 objetos verifica identity', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const cat = FinSet([A, B], [f]);
    expect(cat.verifyIdentity()).toBe(true);
  });

  it('FinSet con 2 objetos verifica associativity', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const g = mkFinSetMor('g', B, C, { b0: 'c0', b1: 'c0', b2: 'c0' });
    const cat = FinSet([A, B, C], [f, g]);
    expect(cat.verifyAssociativity()).toBe(true);
  });

  it('hom-set hom(A, B) contiene a f', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const cat = FinSet([A, B], [f]);
    const homs = cat.hom(A, B);
    expect(homs.some((m) => cat.eqMor(m, f))).toBe(true);
  });

  it('mkFinSetMor rechaza imagen fuera del codominio', () => {
    expect(() => mkFinSetMor('bad', A, B, { a0: 'b0', a1: 'zzz' })).toThrow(/not in target/);
  });

  it('compose en FinSet aplica funciones correctamente', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const g = mkFinSetMor('g', B, C, { b0: 'c0', b1: 'c0', b2: 'c0' });
    const cat = FinSet([A, B, C], [f, g]);
    const gf = cat.compose(g, f);
    expect(gf.fn.get('a0')).toBe('c0');
    expect(gf.fn.get('a1')).toBe('c0');
  });
});

describe('Poset — categoría', () => {
  it('Poset [1≤2≤3] forma categoría válida', () => {
    const cat = Poset(
      ['1', '2', '3'],
      [
        ['1', '2'],
        ['2', '3'],
      ],
    );
    // Debe haber el morfismo transitivo 1→3
    expect(cat.hom('1', '3').length).toBe(1);
    expect(cat.verifyIdentity()).toBe(true);
    expect(cat.verifyAssociativity()).toBe(true);
  });

  it('Poset reflexividad: cada objeto tiene identidad', () => {
    const cat = Poset(['x', 'y'], [['x', 'y']]);
    expect(cat.hom('x', 'x').length).toBe(1);
    expect(cat.hom('y', 'y').length).toBe(1);
  });

  it('Poset sin relaciones es discreto', () => {
    const cat = Poset(['p', 'q'], []);
    expect(cat.hom('p', 'q').length).toBe(0);
    expect(cat.hom('p', 'p').length).toBe(1);
  });
});

describe('Free — categoría libre sobre grafo', () => {
  it('Free con 1 edge produce path de longitud 1', () => {
    const cat = Free(['x', 'y'], [['x', 'y', 'e']]);
    const homs = cat.hom('x', 'y');
    expect(homs.length).toBeGreaterThanOrEqual(1);
    expect(homs.some((m) => m.path.length === 1 && m.path[0] === 'e')).toBe(true);
  });

  it('Free verifica asociatividad', () => {
    const cat = Free(
      ['x', 'y', 'z'],
      [
        ['x', 'y', 'e1'],
        ['y', 'z', 'e2'],
      ],
    );
    expect(cat.verifyAssociativity()).toBe(true);
  });

  it('Free verifica identity laws', () => {
    const cat = Free(['x', 'y'], [['x', 'y', 'e']]);
    expect(cat.verifyIdentity()).toBe(true);
  });
});

describe('Functor', () => {
  it('Functor identidad pasa preservation e identity laws', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const cat = FinSet([A, B], [f]);
    const Id = identityFunctor(cat);
    expect(Id.verifyIdentityPreservation()).toBe(true);
    expect(Id.verifyComposition()).toBe(true);
  });

  it('Functor constante a un objeto verifica leyes', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const cat = FinSet([A, B], [f]);
    const Const = mkFunctor({
      name: 'Const_C',
      source: cat,
      target: cat,
      onObjects: () => B,
      onMorphisms: () => cat.identity(B),
    });
    expect(Const.verifyIdentityPreservation()).toBe(true);
    expect(Const.verifyComposition()).toBe(true);
  });

  it('Functor Free → FinSet preserve composition (estructura discreta)', () => {
    // Free sobre un vertice solo (sólo identidades).
    const free = Free(['v'], []);
    const cat = FinSet([A], []);
    const F = mkFunctor({
      name: 'F',
      source: free,
      target: cat,
      onObjects: () => A,
      onMorphisms: () => cat.identity(A),
    });
    expect(F.verifyIdentityPreservation()).toBe(true);
    expect(F.verifyComposition()).toBe(true);
  });

  it('Composición de dos functores produce un functor válido', () => {
    const cat = FinSet([A, B], [mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' })]);
    const Id = identityFunctor(cat);
    const IdId = composeFunctors(Id, Id);
    expect(IdId.verifyIdentityPreservation()).toBe(true);
    expect(IdId.verifyComposition()).toBe(true);
  });
});

describe('NaturalTransformation', () => {
  it('Identity natural transformation id_F satisfies naturality', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const cat = FinSet([A, B], [f]);
    const Id = identityFunctor(cat);
    const idNT = identityNT(Id);
    expect(idNT.verifyNaturality()).toBe(true);
  });

  it('NT entre 2 functores constantes (mismo objeto) es natural trivialmente', () => {
    const cat = FinSet([A, B], [mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' })]);
    const ConstA = mkFunctor({
      name: 'KA',
      source: cat,
      target: cat,
      onObjects: () => A,
      onMorphisms: () => cat.identity(A),
    });
    const ConstB = mkFunctor({
      name: 'KB',
      source: cat,
      target: cat,
      onObjects: () => B,
      onMorphisms: () => cat.identity(B),
    });
    const f = cat.hom(A, B)[0];
    const nt = mkNaturalTransformation({
      name: 'k',
      source: ConstA,
      target: ConstB,
      component: () => f,
    });
    expect(nt.verifyNaturality()).toBe(true);
  });

  it('NT mal definida es rechazada por verifyNaturality', () => {
    // Construimos dos functores: Id y Const_{B}. La transformación
    // natural "constante a f" no satisface naturalidad cuando hay
    // varios morfismos f con dom/cod compatibles. Aquí montamos un
    // contraejemplo concreto.
    const swapA: FinSetObj = { name: 'A', elements: ['a0', 'a1'] };
    const f = mkFinSetMor('swap', swapA, swapA, { a0: 'a1', a1: 'a0' });
    const cat = FinSet([swapA], [f]);
    const Id = identityFunctor(cat);
    const Const = mkFunctor({
      name: 'KA',
      source: cat,
      target: cat,
      onObjects: () => swapA,
      onMorphisms: () => cat.identity(swapA),
    });
    // η_a = swap : Id(a)=a → Const(a)=a. Naturalidad pide
    // Const(swap) ∘ η_a = η_a ∘ Id(swap), i.e. id ∘ swap = swap ∘ swap,
    // i.e. swap = id ⇒ FALSO.
    const bad = mkNaturalTransformation({
      name: 'bad',
      source: Id,
      target: Const,
      component: () => f,
    });
    expect(bad.verifyNaturality()).toBe(false);
  });
});

describe('Limits/Colimits — FinSet', () => {
  it('product A×B construible en FinSet', () => {
    const cat = FinSet([A, B], []);
    const p = product(cat, A, B);
    expect(p).not.toBeNull();
    if (!p) return;
    expect(p.obj.elements.length).toBe(A.elements.length * B.elements.length);
    expect(p.pi1.src).toBe(p.obj.name);
    expect(p.pi1.tgt).toBe(A.name);
    expect(p.pi2.tgt).toBe(B.name);
  });

  it('coproduct A⊔B construible en FinSet', () => {
    const cat = FinSet([A, B], []);
    const c = coproduct(cat, A, B);
    expect(c).not.toBeNull();
    if (!c) return;
    expect(c.obj.elements.length).toBe(A.elements.length + B.elements.length);
    expect(c.in1.src).toBe(A.name);
    expect(c.in1.tgt).toBe(c.obj.name);
  });

  it('equalizer trivial: f = g ⇒ equalizer es el dominio entero', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const cat = FinSet([A, B], [f]);
    const e = equalizer(cat, f, f);
    expect(e).not.toBeNull();
    if (!e) return;
    expect(e.obj.elements.length).toBe(A.elements.length);
  });

  it('equalizer no trivial: solo elementos donde f y g coinciden', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const g = mkFinSetMor('g', A, B, { a0: 'b0', a1: 'b2' });
    const cat = FinSet([A, B], [f, g]);
    const e = equalizer(cat, f, g);
    expect(e).not.toBeNull();
    if (!e) return;
    expect(e.obj.elements).toEqual(['a0']);
  });

  it('coequalizer colapsa elementos relacionados por f, g', () => {
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const g = mkFinSetMor('g', A, B, { a0: 'b1', a1: 'b1' });
    const cat = FinSet([A, B], [f, g]);
    const ce = coequalizer(cat, f, g);
    expect(ce).not.toBeNull();
    if (!ce) return;
    // b0 y b1 se colapsan (via a0), b2 queda solo.
    expect(ce.obj.elements.length).toBe(2);
  });

  it('isCone valida correctamente un cono trivial', () => {
    const cat = FinSet([A, B], [mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' })]);
    const diagram: Diagram<FinSetObj, FinSetMor> = {
      vertices: new Map([['v', A]]),
      edges: [],
    };
    const cone: Cone<FinSetObj, FinSetMor> = {
      apex: A,
      legs: new Map([['v', cat.identity(A)]]),
    };
    expect(isCone(cat, diagram, cone)).toBe(true);
  });

  it('isLimit verifica límite trivial (1 vértice = ese vértice)', () => {
    const cat = FinSet([A], []);
    const diagram: Diagram<FinSetObj, FinSetMor> = {
      vertices: new Map([['v', A]]),
      edges: [],
    };
    const cone: Cone<FinSetObj, FinSetMor> = {
      apex: A,
      legs: new Map([['v', cat.identity(A)]]),
    };
    expect(isLimit(cat, diagram, cone)).toBe(true);
  });
});

describe('Monoidal (FinSet, ×, 1)', () => {
  it('verifica unitor izquierdo: 1⊗A ≅ A', () => {
    const mc = FinSetMonoidal([A, B]);
    expect(mc.verifyLeftUnitor()).toBe(true);
  });

  it('verifica unitor derecho: A⊗1 ≅ A', () => {
    const mc = FinSetMonoidal([A, B]);
    expect(mc.verifyRightUnitor()).toBe(true);
  });

  it('verifica asociador: (A⊗B)⊗C ≅ A⊗(B⊗C)', () => {
    const mc = FinSetMonoidal([A, B, C]);
    expect(mc.verifyAssociator()).toBe(true);
  });

  it('tensor de objetos tiene cardinal producto', () => {
    const mc = FinSetMonoidal([A, B]);
    const AxB = mc.tensor(A, B);
    expect(AxB.elements.length).toBe(A.elements.length * B.elements.length);
  });

  it('tensor de morfismos f×g aplica componentes', () => {
    const mc = FinSetMonoidal([A, B]);
    const f = mkFinSetMor('f', A, B, { a0: 'b0', a1: 'b1' });
    const g = mkFinSetMor('g', B, A, { b0: 'a0', b1: 'a1', b2: 'a0' });
    const fxg = mc.tensorMor(f, g);
    expect(fxg.fn.get('a0∥b0')).toBe('b0∥a0');
    expect(fxg.fn.get('a1∥b1')).toBe('b1∥a1');
  });
});
