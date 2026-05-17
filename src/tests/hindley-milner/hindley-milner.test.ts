import { describe, it, expect, beforeEach } from 'vitest';
import {
  algorithmW,
  applySubst,
  composeSubsts,
  eApp,
  eAppN,
  eIf,
  eLam,
  eLet,
  eLetRec,
  eLit,
  eVar,
  freshTypeVar,
  generalize,
  infer,
  inferScheme,
  initialEnv,
  instantiate,
  isInferError,
  isUnifyError,
  mono,
  normalizeScheme,
  occursIn,
  resetFreshSupply,
  scheme,
  schemeToString,
  tApp,
  tArrow,
  tConst,
  tVar,
  TBool,
  TInt,
  TStr,
  type InferOutcome,
  type Substitution,
  TypeEnv,
  typeToString,
  unify,
} from '../../hindley-milner';

beforeEach(() => {
  resetFreshSupply();
});

function unwrap(r: InferOutcome) {
  if (isInferError(r)) throw new Error(`unexpected inference error: ${r.error}`);
  return r;
}

function principalTypeStr(expr: Parameters<typeof infer>[0]): string {
  const r = inferScheme(expr);
  if ('error' in r) throw new Error(`inference failed: ${r.error}`);
  return schemeToString(normalizeScheme(r.scheme));
}

// =============================================================
// 1. Unificación
// =============================================================
describe('Hindley-Milner / unify', () => {
  it('unifica una tvar con cualquier tipo (binding directo)', () => {
    const r = unify(tVar('a'), TInt);
    expect(isUnifyError(r)).toBe(false);
    if (isUnifyError(r)) return;
    expect(applySubst(tVar('a'), r)).toEqual(TInt);
  });

  it('unifica dos tvars distintas creando un alias', () => {
    const r = unify(tVar('a'), tVar('b'));
    expect(isUnifyError(r)).toBe(false);
    if (isUnifyError(r)) return;
    // tras la unif, a y b son el mismo (uno apunta al otro).
    expect(applySubst(tVar('a'), r)).toEqual(applySubst(tVar('b'), r));
  });

  it('unifica dos type-constructors iguales con args compatibles', () => {
    const r = unify(tApp('List', tVar('a')), tApp('List', TInt));
    if (isUnifyError(r)) throw new Error(r.error);
    expect(applySubst(tVar('a'), r)).toEqual(TInt);
  });

  it('falla al unificar constructores distintos', () => {
    const r = unify(tConst('Int'), tConst('Bool'));
    expect(isUnifyError(r)).toBe(true);
    if (!isUnifyError(r)) return;
    expect(r.error).toMatch(/Int.*Bool|Bool.*Int/);
  });

  it('falla con arity mismatch en tapp', () => {
    const r = unify(tApp('Pair', tVar('a'), tVar('b')), tApp('Pair', TInt));
    expect(isUnifyError(r)).toBe(true);
  });

  it('detecta occurs check (tipo infinito) en α = α → α', () => {
    const r = unify(tVar('a'), tArrow(tVar('a'), tVar('a')));
    expect(isUnifyError(r)).toBe(true);
    if (!isUnifyError(r)) return;
    expect(r.error.toLowerCase()).toContain('occurs');
  });

  it('unifica arrows recursivamente y propaga sustituciones', () => {
    // (a -> Int)  ≡  (Bool -> b)  ⇒  a := Bool, b := Int
    const r = unify(tArrow(tVar('a'), TInt), tArrow(TBool, tVar('b')));
    if (isUnifyError(r)) throw new Error(r.error);
    expect(applySubst(tVar('a'), r)).toEqual(TBool);
    expect(applySubst(tVar('b'), r)).toEqual(TInt);
  });

  it('composeSubsts mantiene transitividad: {a→b} ∘ {b→Int} ⇒ a→Int', () => {
    const s1: Substitution = new Map([['a', tVar('b')]]);
    const s2: Substitution = new Map([['b', TInt]]);
    // composeSubsts(s, t) = primero t, luego s. Queremos primero s1 (a→b)
    // luego s2 (b→Int): composeSubsts(s2, s1).
    const c = composeSubsts(s2, s1);
    expect(applySubst(tVar('a'), c)).toEqual(TInt);
  });

  it('occursIn detecta variable dentro de un tapp', () => {
    expect(occursIn('a', tApp('List', tArrow(tVar('a'), TInt)))).toBe(true);
    expect(occursIn('a', tApp('List', TInt))).toBe(false);
  });
});

// =============================================================
// 2. Algoritmo W — casos canónicos
// =============================================================
describe('Hindley-Milner / inferencia', () => {
  it('identidad: λx. x  infiere  ∀a. a -> a', () => {
    const expr = eLam('x', eVar('x'));
    expect(principalTypeStr(expr)).toBe('forall a. a -> a');
  });

  it('K combinator: λx. λy. x  infiere  ∀a b. a -> b -> a', () => {
    const expr = eLam('x', eLam('y', eVar('x')));
    expect(principalTypeStr(expr)).toBe('forall a b. a -> b -> a');
  });

  it('S combinator: λf. λg. λx. f x (g x)  infiere correctamente', () => {
    // tipo principal: (a -> b -> c) -> (a -> b) -> a -> c
    const expr = eLam(
      'f',
      eLam('g', eLam('x', eApp(eApp(eVar('f'), eVar('x')), eApp(eVar('g'), eVar('x'))))),
    );
    expect(principalTypeStr(expr)).toBe('forall a b c. (a -> b -> c) -> (a -> b) -> a -> c');
  });

  it('let-poly: let id = λx. x in id 5  infiere  Int', () => {
    const expr = eLet('id', eLam('x', eVar('x')), eApp(eVar('id'), eLit(5)));
    const r = unwrap(infer(expr));
    expect(applySubst(r.type, r.subst)).toEqual(TInt);
  });

  it('let-poly: id usado en dos tipos en el mismo cuerpo', () => {
    // let id = λx.x in pair (id 5) (id true)  ⇒  Pair Int Bool
    const expr = eLet(
      'id',
      eLam('x', eVar('x')),
      eAppN(eVar('pair'), eApp(eVar('id'), eLit(5)), eApp(eVar('id'), eVar('true'))),
    );
    expect(principalTypeStr(expr)).toBe('Pair Int Bool');
  });

  it('SIN let-poly el mismo programa NO tipa con λ: (λid. ...) (λx.x)', () => {
    // Esto NO funcionaría con let-poly desactivado:
    //   (λid. pair (id 5) (id true)) (λx.x)
    // porque el parámetro id es monomórfico (un λ no generaliza).
    // Comprueba que efectivamente falla.
    const expr = eApp(
      eLam('id', eAppN(eVar('pair'), eApp(eVar('id'), eLit(5)), eApp(eVar('id'), eVar('true')))),
      eLam('x', eVar('x')),
    );
    const r = infer(expr);
    expect(isInferError(r)).toBe(true);
  });

  it('aritmética: 5 + 3  infiere  Int', () => {
    const expr = eAppN(eVar('+'), eLit(5), eLit(3));
    const r = unwrap(infer(expr));
    expect(applySubst(r.type, r.subst)).toEqual(TInt);
  });

  it('aritmética sobre booleano falla: true + 1', () => {
    const expr = eAppN(eVar('+'), eVar('true'), eLit(1));
    const r = infer(expr);
    expect(isInferError(r)).toBe(true);
  });

  it('comparador polimórfico: λa. a == a  infiere  ∀α. α -> Bool', () => {
    const expr = eLam('x', eAppN(eVar('=='), eVar('x'), eVar('x')));
    expect(principalTypeStr(expr)).toBe('forall a. a -> Bool');
  });

  it('if booleano: if true then 1 else 2  infiere  Int', () => {
    const expr = eIf(eVar('true'), eLit(1), eLit(2));
    const r = unwrap(infer(expr));
    expect(applySubst(r.type, r.subst)).toEqual(TInt);
  });

  it('if con condición no-booleana falla', () => {
    const expr = eIf(eLit(1), eLit(1), eLit(2));
    const r = infer(expr);
    expect(isInferError(r)).toBe(true);
    if (!isInferError(r)) return;
    expect(r.error.toLowerCase()).toContain('bool');
  });

  it('if con ramas de tipos distintos falla', () => {
    const expr = eIf(eVar('true'), eLit(1), eVar('true'));
    const r = infer(expr);
    expect(isInferError(r)).toBe(true);
    if (!isInferError(r)) return;
    expect(r.error.toLowerCase()).toMatch(/branches|cannot unify/);
  });

  it('aplicación parcial: (+) 5  infiere  Int -> Int', () => {
    const expr = eApp(eVar('+'), eLit(5));
    const r = unwrap(infer(expr));
    expect(typeToString(applySubst(r.type, r.subst))).toBe('Int -> Int');
  });
});

// =============================================================
// 3. Errores: variable libre, ocurrencia, etc.
// =============================================================
describe('Hindley-Milner / errores', () => {
  it('variable no ligada falla con mensaje claro', () => {
    const expr = eVar('xyz');
    const r = infer(expr);
    expect(isInferError(r)).toBe(true);
    if (!isInferError(r)) return;
    expect(r.error).toContain('xyz');
  });

  it('occurs-check vía λx. x x rechaza el término', () => {
    const expr = eLam('x', eApp(eVar('x'), eVar('x')));
    const r = infer(expr);
    expect(isInferError(r)).toBe(true);
    if (!isInferError(r)) return;
    expect(r.error.toLowerCase()).toMatch(/occurs|infinite|cannot unify/);
  });

  it('omega = (λx. x x) (λx. x x) rechaza por occurs', () => {
    const omega = eApp(
      eLam('x', eApp(eVar('x'), eVar('x'))),
      eLam('x', eApp(eVar('x'), eVar('x'))),
    );
    const r = infer(omega);
    expect(isInferError(r)).toBe(true);
  });

  it('aplicación a no-función falla', () => {
    const expr = eApp(eLit(5), eLit(3));
    const r = infer(expr);
    expect(isInferError(r)).toBe(true);
  });
});

// =============================================================
// 4. letRec — definiciones recursivas y mutuamente recursivas
// =============================================================
describe('Hindley-Milner / letRec', () => {
  it('factorial recursivo via letRec: fact 5 tipea como Int', () => {
    // letRec fact = λn. if n == 0 then 1 else n * (fact (n - 1)) in fact 5
    const fact = eLam(
      'n',
      eIf(
        eAppN(eVar('=='), eVar('n'), eLit(0)),
        eLit(1),
        eAppN(eVar('*'), eVar('n'), eApp(eVar('fact'), eAppN(eVar('-'), eVar('n'), eLit(1)))),
      ),
    );
    const program = eLetRec([{ name: 'fact', body: fact }], eApp(eVar('fact'), eLit(5)));
    const r = unwrap(infer(program));
    expect(applySubst(r.type, r.subst)).toEqual(TInt);
  });

  it('letRec con función genérica de listas: length tipea  ∀a. List a -> Int', () => {
    // letRec length = λxs. if isEmpty xs then 0 else 1 + length (tail xs)
    const length = eLam(
      'xs',
      eIf(
        eApp(eVar('isEmpty'), eVar('xs')),
        eLit(0),
        eAppN(eVar('+'), eLit(1), eApp(eVar('length'), eApp(eVar('tail'), eVar('xs')))),
      ),
    );
    const program = eLetRec([{ name: 'length', body: length }], eVar('length'));
    expect(principalTypeStr(program)).toBe('forall a. List a -> Int');
  });

  it('letRec mutuamente recursivo: even/odd tipean Int -> Bool', () => {
    const even = eLam(
      'n',
      eIf(
        eAppN(eVar('=='), eVar('n'), eLit(0)),
        eVar('true'),
        eApp(eVar('odd'), eAppN(eVar('-'), eVar('n'), eLit(1))),
      ),
    );
    const odd = eLam(
      'n',
      eIf(
        eAppN(eVar('=='), eVar('n'), eLit(0)),
        eVar('false'),
        eApp(eVar('even'), eAppN(eVar('-'), eVar('n'), eLit(1))),
      ),
    );
    const program = eLetRec(
      [
        { name: 'even', body: even },
        { name: 'odd', body: odd },
      ],
      eApp(eVar('even'), eLit(10)),
    );
    const r = unwrap(infer(program));
    expect(applySubst(r.type, r.subst)).toEqual(TBool);
  });
});

// =============================================================
// 5. generalize / instantiate — semánticamente correctos
// =============================================================
describe('Hindley-Milner / generalize & instantiate', () => {
  it('generalize cuantifica solo lo que no está en el entorno', () => {
    // Entorno: { x : a }   (a aparece libre).
    // Tipo a generalizar: a -> b.
    // Esperamos: ∀b. a -> b (la `a` queda libre).
    const env = new TypeEnv(new Map([['x', mono(tVar('a'))]]));
    const sc = generalize(env.freeVars(), tArrow(tVar('a'), tVar('b')));
    expect(sc.forall).toEqual(['b']);
  });

  it('instantiate produce variables frescas distintas a las del esquema', () => {
    resetFreshSupply();
    const sc = scheme(['a'], tArrow(tVar('a'), tVar('a')));
    const t1 = instantiate(sc);
    const t2 = instantiate(sc);
    // Dos instanciaciones distintas → tvars distintas.
    expect(t1).not.toEqual(t2);
    // Pero ambas siguen siendo "α → α" para alguna α.
    if (t1.kind !== 'arrow' || t1.from.kind !== 'tvar') throw new Error('shape');
    expect(t1.from).toEqual(t1.to);
  });

  it('preserva principalidad: id usado dos veces produce el mismo esquema interno', () => {
    // Damas-Milner: si el tipo principal de `λx.x` es ∀a. a→a, instanciar dos
    // veces y unificar con Int y Bool no debe contaminar la otra instancia.
    const expr = eLet(
      'id',
      eLam('x', eVar('x')),
      eAppN(eVar('pair'), eApp(eVar('id'), eLit(5)), eApp(eVar('id'), eVar('true'))),
    );
    expect(principalTypeStr(expr)).toBe('Pair Int Bool');
  });
});

// =============================================================
// 6. Tipos compuestos: pair, listas
// =============================================================
describe('Hindley-Milner / tipos compuestos', () => {
  it('pair 1 true  infiere  Pair Int Bool', () => {
    const expr = eAppN(eVar('pair'), eLit(1), eVar('true'));
    expect(principalTypeStr(expr)).toBe('Pair Int Bool');
  });

  it('cons 1 nil  infiere  List Int', () => {
    const expr = eAppN(eVar('cons'), eLit(1), eVar('nil'));
    expect(principalTypeStr(expr)).toBe('List Int');
  });

  it('mezclar tipos de lista falla: cons 1 (cons true nil)', () => {
    const expr = eAppN(eVar('cons'), eLit(1), eAppN(eVar('cons'), eVar('true'), eVar('nil')));
    const r = infer(expr);
    expect(isInferError(r)).toBe(true);
  });

  it('fst (pair 1 true)  infiere  Int', () => {
    const expr = eApp(eVar('fst'), eAppN(eVar('pair'), eLit(1), eVar('true')));
    const r = unwrap(infer(expr));
    expect(applySubst(r.type, r.subst)).toEqual(TInt);
  });

  it('literales producen sus tipos primitivos', () => {
    expect(unwrap(infer(eLit(1))).type).toEqual(TInt);
    expect(unwrap(infer(eLit(true))).type).toEqual(TBool);
    expect(unwrap(infer(eLit('hello'))).type).toEqual(TStr);
  });
});

// =============================================================
// 7. Sustituciones — propiedades
// =============================================================
describe('Hindley-Milner / sustituciones', () => {
  it('applySubst es identidad sobre tipos cerrados', () => {
    const s: Substitution = new Map([['unused', TInt]]);
    const t = tArrow(TBool, tApp('List', TInt));
    expect(applySubst(t, s)).toEqual(t);
  });

  it('composeSubsts no permite que s2 sobrescriba claves de s1', () => {
    const s1: Substitution = new Map([['a', TInt]]);
    const s2: Substitution = new Map([['a', TBool]]);
    // composeSubsts(s1, s2): primero s2 (a→Bool), luego s1 (a→Int aplicado a Bool).
    // Bool no contiene `a`, así que queda Bool. La entrada de s1 que NO sobrescribe.
    const c = composeSubsts(s1, s2);
    expect(applySubst(tVar('a'), c)).toEqual(TBool);
  });

  it('freshTypeVar produce nombres únicos consecutivos', () => {
    resetFreshSupply();
    const a = freshTypeVar('t');
    const b = freshTypeVar('t');
    expect(a).not.toEqual(b);
    if (a.kind !== 'tvar' || b.kind !== 'tvar') throw new Error('shape');
    expect(a.name).toBe('t0');
    expect(b.name).toBe('t1');
  });
});

// =============================================================
// 8. Algoritmo W — propiedades a bajo nivel
// =============================================================
describe('Hindley-Milner / algorithmW directo', () => {
  it('produce sustitución vacía para literales', () => {
    const r = algorithmW(eLit(42), initialEnv());
    expect(isInferError(r)).toBe(false);
    if (isInferError(r)) return;
    expect(r.subst.size).toBe(0);
    expect(r.type).toEqual(TInt);
  });

  it('aplicar la sustitución al tipo de salida no cambia el resultado', () => {
    // Algoritmo W: el `type` devuelto ya está bajo `subst`. Aplicar
    // subst otra vez debería ser idempotente.
    resetFreshSupply();
    const expr = eApp(eLam('x', eVar('x')), eLit(5));
    const r = unwrap(infer(expr));
    expect(applySubst(applySubst(r.type, r.subst), r.subst)).toEqual(applySubst(r.type, r.subst));
  });
});
