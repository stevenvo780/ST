import { describe, it, expect } from 'vitest';
import {
  alphaBetaEq,
  alphaEq,
  checkType,
  hArrow,
  hAp,
  hBaseOfCircle,
  hCircle,
  hJElim,
  hLam,
  hLoopOfCircle,
  hMeridian,
  hNat,
  hNorth,
  hPath,
  hPathConcat,
  hPathSym,
  hRefl,
  hSouth,
  hSucc,
  hSuspension,
  hTransport,
  hUa,
  hUniverse,
  hVar,
  hZero,
  inferType,
  isInferErrorHoTT,
  normalize,
  pathCompose,
  pathInverse,
  refl,
  termToString,
  univalence,
  univalenceWitness,
  type HoTTTerm,
} from '../../../type-theory/hott';

function unwrap(r: ReturnType<typeof inferType>): HoTTTerm {
  if (isInferErrorHoTT(r)) throw new Error(`unexpected error: ${r.error}`);
  return r;
}

describe('HoTT / identity types as path spaces', () => {
  it('refl(zero) : Path Nat zero zero', () => {
    const t = unwrap(inferType(hRefl(hZero())));
    expect(t.kind).toBe('path');
    if (t.kind !== 'path') throw new Error('expected path');
    expect(t.type.kind).toBe('nat');
    expect(alphaEq(t.left, hZero())).toBe(true);
    expect(alphaEq(t.right, hZero())).toBe(true);
  });

  it('Path Nat zero zero : Type 0', () => {
    const t = unwrap(inferType(hPath(hNat(), hZero(), hZero())));
    expect(t.kind === 'universe' && t.level === 0).toBe(true);
  });

  it('refl(zero) chequea como Path Nat zero zero', () => {
    expect(checkType(hRefl(hZero()), hPath(hNat(), hZero(), hZero()))).toBe(true);
  });

  it('rechaza Path con lados de tipos incompatibles', () => {
    const bad = hPath(hNat(), hZero(), hUniverse(0));
    expect(isInferErrorHoTT(inferType(bad))).toBe(true);
  });
});

describe('HoTT / transport β-reduces along refl', () => {
  it('transport(λ_.Nat, refl(zero), succ(zero)) ≡ succ(zero) (reducción β)', () => {
    // La β-rule actúa estructuralmente: transport sobre refl ↦ term.
    // No exige tipado correcto para reducir sintácticamente.
    const fam = hLam('_', hNat(), hNat());
    const t = hTransport(fam, hRefl(hZero()), hSucc(hZero()));
    expect(alphaEq(normalize(t), hSucc(hZero()))).toBe(true);
  });

  it('transport tipa: family Nat→Type=λ_.Nat, path refl zero, term Type 0 → resultado Type 0', () => {
    // El tipo de family (λ_:Nat.Nat) es Π(_:Nat).Type 0 — porque Nat:Type 0.
    // Por tanto transport espera term : Type 0 (no valor de Nat).
    const famType = hLam('_', hNat(), hNat());
    // term : Type 0 — pasamos Nat mismo (Nat : Type 0).
    const term = hTransport(famType, hRefl(hZero()), hNat());
    const inferred = unwrap(inferType(term));
    expect(inferred.kind === 'universe' && inferred.level === 0).toBe(true);
  });
});

describe('HoTT / path inverse (sym)', () => {
  it('sym(refl x) ≡ refl x', () => {
    const t = pathInverse(hRefl(hZero()));
    expect(alphaEq(normalize(t), hRefl(hZero()))).toBe(true);
  });

  it('sym(sym p) ≡ p (involutividad)', () => {
    const p = hVar('p');
    const t = pathInverse(pathInverse(p));
    expect(alphaEq(t, p)).toBe(true);
  });

  it('sym sobre Path A x y produce Path A y x (tipo)', () => {
    // Bajo contexto: p : Path Nat zero (succ zero)
    const ctx = new Map<string, HoTTTerm>([['p', hPath(hNat(), hZero(), hSucc(hZero()))]]);
    const t = unwrap(inferType(hPathSym(hVar('p')), ctx));
    expect(t.kind).toBe('path');
    if (t.kind !== 'path') throw new Error('expected path');
    expect(alphaEq(t.left, hSucc(hZero()))).toBe(true);
    expect(alphaEq(t.right, hZero())).toBe(true);
  });
});

describe('HoTT / path concatenation', () => {
  it('refl · p ≡ p (identidad izquierda)', () => {
    const p = hVar('p');
    const composed = pathCompose(refl(hZero()), p);
    expect(alphaEq(composed, p)).toBe(true);
  });

  it('p · refl ≡ p (identidad derecha)', () => {
    const p = hVar('p');
    const composed = pathCompose(p, refl(hZero()));
    expect(alphaEq(composed, p)).toBe(true);
  });

  it('pathConcat(refl x, refl x) normaliza a refl x vía reglas β', () => {
    const t = hPathConcat(hRefl(hZero()), hRefl(hZero()));
    expect(alphaEq(normalize(t), hRefl(hZero()))).toBe(true);
  });

  it('concatenación tipa: Path x y · Path y z = Path x z', () => {
    const ctx = new Map<string, HoTTTerm>([
      ['p', hPath(hNat(), hZero(), hSucc(hZero()))],
      ['q', hPath(hNat(), hSucc(hZero()), hSucc(hSucc(hZero())))],
    ]);
    const t = unwrap(inferType(hPathConcat(hVar('p'), hVar('q')), ctx));
    expect(t.kind).toBe('path');
    if (t.kind !== 'path') throw new Error('expected path');
    expect(alphaEq(t.left, hZero())).toBe(true);
    expect(alphaEq(t.right, hSucc(hSucc(hZero())))).toBe(true);
  });

  it('concat rechaza endpoints incompatibles', () => {
    const ctx = new Map<string, HoTTTerm>([
      ['p', hPath(hNat(), hZero(), hSucc(hZero()))],
      ['q', hPath(hNat(), hZero(), hSucc(hZero()))],
    ]);
    // p termina en succ zero, q empieza en zero → no concatenable
    const r = inferType(hPathConcat(hVar('p'), hVar('q')), ctx);
    expect(isInferErrorHoTT(r)).toBe(true);
  });
});

describe('HoTT / J-eliminator computes on refl', () => {
  it('J(motive, base, refl x) ≡ base', () => {
    const motive = hLam('y', hNat(), hLam('q', hPath(hNat(), hZero(), hVar('y')), hNat()));
    const base = hZero();
    const t = hJElim(motive, base, hRefl(hZero()));
    expect(alphaEq(normalize(t), hZero())).toBe(true);
  });

  it('J infiere tipo motive y p para path no-trivial (estructural)', () => {
    // Sin computar, sólo verificamos que no levante error con tipos coherentes.
    const ctx = new Map<string, HoTTTerm>([['p', hPath(hNat(), hZero(), hSucc(hZero()))]]);
    const motive = hLam('y', hNat(), hLam('q', hPath(hNat(), hZero(), hVar('y')), hNat()));
    const base = hZero();
    const r = inferType(hJElim(motive, base, hVar('p')), ctx);
    expect(isInferErrorHoTT(r)).toBe(false);
  });
});

describe('HoTT / ap (functorial action on paths)', () => {
  it('ap(f, refl x) ≡ refl(f x)', () => {
    // f = succ : Nat → Nat
    const f = hLam('n', hNat(), hSucc(hVar('n')));
    const t = hAp(f, hRefl(hZero()));
    const nf = normalize(t);
    expect(nf.kind).toBe('refl');
  });

  it('ap tipa: f : A → B, p : Path A x y → ap f p : Path B (f x) (f y)', () => {
    const f = hLam('n', hNat(), hSucc(hVar('n')));
    const ctx = new Map<string, HoTTTerm>([['p', hPath(hNat(), hZero(), hSucc(hZero()))]]);
    const t = unwrap(inferType(hAp(f, hVar('p')), ctx));
    expect(t.kind).toBe('path');
    if (t.kind !== 'path') throw new Error('expected path');
    expect(t.type.kind).toBe('nat');
  });
});

describe('HoTT / circle S¹', () => {
  it('S¹ : Type 0', () => {
    const t = unwrap(inferType(hCircle()));
    expect(t.kind === 'universe' && t.level === 0).toBe(true);
  });

  it('base : S¹', () => {
    const t = unwrap(inferType(hBaseOfCircle()));
    expect(t.kind).toBe('circle');
  });

  it('loop : Path S¹ base base', () => {
    const t = unwrap(inferType(hLoopOfCircle()));
    expect(t.kind).toBe('path');
    if (t.kind !== 'path') throw new Error('expected path');
    expect(t.type.kind).toBe('circle');
    expect(t.left.kind).toBe('baseOfCircle');
    expect(t.right.kind).toBe('baseOfCircle');
  });

  it('loop NO es sintácticamente refl base (no trivialidad estructural)', () => {
    // Esto es lo que distingue HoTT de UIP: loop y refl base tienen el
    // mismo tipo pero NO son iguales sintácticamente. La no-trivialidad
    // semántica requiere axiomas adicionales (loop ≠ refl en U).
    const loop = hLoopOfCircle();
    const reflBase = hRefl(hBaseOfCircle());
    expect(alphaEq(loop, reflBase)).toBe(false);
  });
});

describe('HoTT / suspension', () => {
  it('Σ Nat : Type 0', () => {
    const t = unwrap(inferType(hSuspension(hNat())));
    expect(t.kind === 'universe' && t.level === 0).toBe(true);
  });

  it('north[Nat] : Σ Nat', () => {
    const t = unwrap(inferType(hNorth(hNat())));
    expect(t.kind).toBe('suspension');
  });

  it('south[Nat] : Σ Nat', () => {
    const t = unwrap(inferType(hSouth(hNat())));
    expect(t.kind).toBe('suspension');
  });

  it('meridian(zero) : Path (Σ Nat) north south', () => {
    const t = unwrap(inferType(hMeridian(hNat(), hZero())));
    expect(t.kind).toBe('path');
    if (t.kind !== 'path') throw new Error('expected path');
    expect(t.type.kind).toBe('suspension');
    expect(t.left.kind).toBe('north');
    expect(t.right.kind).toBe('south');
  });

  it('meridian rechaza punto con tipo incorrecto', () => {
    // pasar succ zero como `point` cuando type=Universe debería fallar
    const r = inferType(hMeridian(hUniverse(0), hZero()));
    expect(isInferErrorHoTT(r)).toBe(true);
  });
});

describe('HoTT / path algebra normalization', () => {
  it('asociatividad sintáctica via normalize: (refl · p) · q ≡ p · q', () => {
    const p = hVar('p');
    const q = hVar('q');
    const left = hPathConcat(hPathConcat(hRefl(hZero()), p), q);
    const right = hPathConcat(p, q);
    expect(alphaEq(normalize(left), normalize(right))).toBe(true);
  });

  it('p · (refl · q) ≡ p · q tras normalize', () => {
    const p = hVar('p');
    const q = hVar('q');
    const left = hPathConcat(p, hPathConcat(hRefl(hZero()), q));
    const right = hPathConcat(p, q);
    expect(alphaEq(normalize(left), normalize(right))).toBe(true);
  });

  it('sym preserva refl tras normalize encadenado', () => {
    const t = hPathSym(hPathSym(hPathSym(hRefl(hZero()))));
    // sym(sym(sym refl)) = sym(refl) = refl
    expect(alphaEq(normalize(t), hRefl(hZero()))).toBe(true);
  });
});

describe('HoTT / univalence axiom (no computacional)', () => {
  it('univalence(e) construye un término ua(e)', () => {
    const e = hVar('e');
    const t = univalence(e);
    expect(t.kind).toBe('ua');
  });

  it('univalenceWitness empaqueta equiv + path', () => {
    const e = hVar('e');
    const w = univalenceWitness(e);
    expect(w.equiv).toBe(e);
    expect(w.path.kind).toBe('ua');
  });

  it('ua sobre ⟨A, B⟩ : Σ Type. Type produce Path Type A B', () => {
    // No verificamos isEquiv — el axioma lo asume.
    const ctx = new Map<string, HoTTTerm>([
      ['e', { kind: 'sigma', bind: '_', first: hNat(), second: hNat() }],
    ]);
    const t = unwrap(inferType(hUa(hVar('e')), ctx));
    expect(t.kind).toBe('path');
  });

  it('transport sobre ua NO reduce (consistencia pre-cubical)', () => {
    // transport(P, ua(e), x) no debe reducir a x — eso sería incorrecto
    // sin estructura cúbica adicional.
    const fam = hLam('_', hUniverse(0), hUniverse(0));
    const e = hVar('e');
    const x = hVar('x');
    const t = hTransport(fam, hUa(e), x);
    const nf = normalize(t);
    // El término normalizado sigue conteniendo transport con ua, NO se reduce.
    expect(nf.kind).toBe('transport');
  });
});

describe('HoTT / serialización', () => {
  it('termToString para Path Nat zero zero', () => {
    const s = termToString(hPath(hNat(), hZero(), hZero()));
    expect(s).toBe('Path(Nat, zero, zero)');
  });

  it('termToString para loop : Path S¹ base base', () => {
    const s = termToString(hLoopOfCircle());
    expect(s).toBe('loop');
  });

  it('termToString para meridian', () => {
    const s = termToString(hMeridian(hNat(), hZero()));
    expect(s).toBe('meridian[Nat](zero)');
  });

  it('alphaBetaEq distingue loop y refl base', () => {
    expect(alphaBetaEq(hLoopOfCircle(), hRefl(hBaseOfCircle()))).toBe(false);
  });

  it('arrow desazucara: hArrow(Nat, Nat) = Π (_:Nat). Nat', () => {
    const arrow = hArrow(hNat(), hNat());
    expect(termToString(arrow)).toBe('(Nat → Nat)');
  });
});
