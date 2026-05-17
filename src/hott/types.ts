// ============================================================
// HoTT — Homotopy Type Theory: términos y constructores
// ============================================================
//
// Extiende MLTT (Π, Σ, Universe, Nat) con la lectura homotópica
// del tipo identidad: Path A x y es el espacio de caminos entre
// x e y en A, no una proposición trivial. Esto habilita:
//
//   - refl(x)            : Path A x x         (camino constante)
//   - p⁻¹ = sym p        : Path A y x          (inverso)
//   - p · q              : Path A x z          (concatenación)
//   - ap f p             : Path B (f x) (f y) (functorialidad)
//   - transport P p e    : P y                (transporte a lo largo)
//   - J(motive, base, p) : motive y p          (eliminador inductivo)
//
// Tipos inductivos superiores incluidos (subconjunto pedagógico):
//   - S¹    con base, loop : Path S¹ base base
//   - Σ A   suspensión con north, south, meridian a : Path north south
//
// La univalence se trata como axioma (no computacional):
// dada una equivalencia e : A ≃ B, postulamos un path ua(e) :
// Path U A B. La computación de transport sobre ua(e) NO se
// implementa (eso requiere modelos cúbicos); la consistencia
// sintáctica sí.

export type HoTTTerm =
  // ── MLTT base ────────────────────────────────────────────
  | { kind: 'var'; name: string }
  | { kind: 'universe'; level: number }
  | { kind: 'pi'; bind: string; domain: HoTTTerm; codomain: HoTTTerm }
  | { kind: 'lam'; bind: string; domain: HoTTTerm; body: HoTTTerm }
  | { kind: 'app'; fn: HoTTTerm; arg: HoTTTerm }
  | { kind: 'sigma'; bind: string; first: HoTTTerm; second: HoTTTerm }
  | { kind: 'pair'; fst: HoTTTerm; snd: HoTTTerm }
  | { kind: 'fst'; pair: HoTTTerm }
  | { kind: 'snd'; pair: HoTTTerm }
  | { kind: 'nat' }
  | { kind: 'zero' }
  | { kind: 'succ'; arg: HoTTTerm }
  // ── Tipos identidad como espacios ────────────────────────
  | { kind: 'path'; type: HoTTTerm; left: HoTTTerm; right: HoTTTerm }
  | { kind: 'refl'; term: HoTTTerm }
  // ── Operaciones sobre caminos ────────────────────────────
  | { kind: 'transport'; family: HoTTTerm; path: HoTTTerm; term: HoTTTerm }
  | { kind: 'pathSym'; path: HoTTTerm }
  | { kind: 'pathConcat'; left: HoTTTerm; right: HoTTTerm }
  | { kind: 'ap'; fn: HoTTTerm; path: HoTTTerm }
  | { kind: 'jElim'; motive: HoTTTerm; baseCase: HoTTTerm; path: HoTTTerm }
  // ── HITs (subconjunto) ───────────────────────────────────
  | { kind: 'circle' }
  | { kind: 'baseOfCircle' }
  | { kind: 'loopOfCircle' }
  | { kind: 'suspension'; type: HoTTTerm }
  | { kind: 'north'; type: HoTTTerm }
  | { kind: 'south'; type: HoTTTerm }
  | { kind: 'meridian'; type: HoTTTerm; point: HoTTTerm }
  // ── Univalence (axioma, no computacional) ────────────────
  | { kind: 'ua'; equiv: HoTTTerm }; // postula path A B desde A ≃ B

// ── Constructores convenientes ──────────────────────────────

export const hVar = (name: string): HoTTTerm => ({ kind: 'var', name });
export const hUniverse = (level = 0): HoTTTerm => ({ kind: 'universe', level });
export const hPi = (bind: string, domain: HoTTTerm, codomain: HoTTTerm): HoTTTerm => ({
  kind: 'pi',
  bind,
  domain,
  codomain,
});
export const hLam = (bind: string, domain: HoTTTerm, body: HoTTTerm): HoTTTerm => ({
  kind: 'lam',
  bind,
  domain,
  body,
});
export const hApp = (fn: HoTTTerm, arg: HoTTTerm): HoTTTerm => ({ kind: 'app', fn, arg });
export const hSigma = (bind: string, first: HoTTTerm, second: HoTTTerm): HoTTTerm => ({
  kind: 'sigma',
  bind,
  first,
  second,
});
export const hPair = (fst: HoTTTerm, snd: HoTTTerm): HoTTTerm => ({ kind: 'pair', fst, snd });
export const hFst = (pair: HoTTTerm): HoTTTerm => ({ kind: 'fst', pair });
export const hSnd = (pair: HoTTTerm): HoTTTerm => ({ kind: 'snd', pair });
export const hNat = (): HoTTTerm => ({ kind: 'nat' });
export const hZero = (): HoTTTerm => ({ kind: 'zero' });
export const hSucc = (arg: HoTTTerm): HoTTTerm => ({ kind: 'succ', arg });

export const hPath = (type: HoTTTerm, left: HoTTTerm, right: HoTTTerm): HoTTTerm => ({
  kind: 'path',
  type,
  left,
  right,
});
export const hRefl = (term: HoTTTerm): HoTTTerm => ({ kind: 'refl', term });
export const hTransport = (family: HoTTTerm, path: HoTTTerm, term: HoTTTerm): HoTTTerm => ({
  kind: 'transport',
  family,
  path,
  term,
});
export const hPathSym = (path: HoTTTerm): HoTTTerm => ({ kind: 'pathSym', path });
export const hPathConcat = (left: HoTTTerm, right: HoTTTerm): HoTTTerm => ({
  kind: 'pathConcat',
  left,
  right,
});
export const hAp = (fn: HoTTTerm, path: HoTTTerm): HoTTTerm => ({ kind: 'ap', fn, path });
export const hJElim = (motive: HoTTTerm, baseCase: HoTTTerm, path: HoTTTerm): HoTTTerm => ({
  kind: 'jElim',
  motive,
  baseCase,
  path,
});

export const hCircle = (): HoTTTerm => ({ kind: 'circle' });
export const hBaseOfCircle = (): HoTTTerm => ({ kind: 'baseOfCircle' });
export const hLoopOfCircle = (): HoTTTerm => ({ kind: 'loopOfCircle' });
export const hSuspension = (type: HoTTTerm): HoTTTerm => ({ kind: 'suspension', type });
export const hNorth = (type: HoTTTerm): HoTTTerm => ({ kind: 'north', type });
export const hSouth = (type: HoTTTerm): HoTTTerm => ({ kind: 'south', type });
export const hMeridian = (type: HoTTTerm, point: HoTTTerm): HoTTTerm => ({
  kind: 'meridian',
  type,
  point,
});

export const hUa = (equiv: HoTTTerm): HoTTTerm => ({ kind: 'ua', equiv });

// Arrow no-dependiente
export const hArrow = (from: HoTTTerm, to: HoTTTerm): HoTTTerm => hPi('_', from, to);

// ── Inspección estructural ───────────────────────────────────

export function occursFreeHoTT(name: string, term: HoTTTerm): boolean {
  switch (term.kind) {
    case 'var':
      return term.name === name;
    case 'universe':
    case 'nat':
    case 'zero':
    case 'circle':
    case 'baseOfCircle':
    case 'loopOfCircle':
      return false;
    case 'pi':
    case 'sigma': {
      const dom = term.kind === 'pi' ? term.domain : term.first;
      const cod = term.kind === 'pi' ? term.codomain : term.second;
      if (occursFreeHoTT(name, dom)) return true;
      if (term.bind === name) return false;
      return occursFreeHoTT(name, cod);
    }
    case 'lam':
      if (occursFreeHoTT(name, term.domain)) return true;
      if (term.bind === name) return false;
      return occursFreeHoTT(name, term.body);
    case 'app':
      return occursFreeHoTT(name, term.fn) || occursFreeHoTT(name, term.arg);
    case 'pair':
      return occursFreeHoTT(name, term.fst) || occursFreeHoTT(name, term.snd);
    case 'fst':
    case 'snd':
      return occursFreeHoTT(name, term.pair);
    case 'path':
      return (
        occursFreeHoTT(name, term.type) ||
        occursFreeHoTT(name, term.left) ||
        occursFreeHoTT(name, term.right)
      );
    case 'refl':
      return occursFreeHoTT(name, term.term);
    case 'succ':
      return occursFreeHoTT(name, term.arg);
    case 'transport':
      return (
        occursFreeHoTT(name, term.family) ||
        occursFreeHoTT(name, term.path) ||
        occursFreeHoTT(name, term.term)
      );
    case 'pathSym':
      return occursFreeHoTT(name, term.path);
    case 'pathConcat':
      return occursFreeHoTT(name, term.left) || occursFreeHoTT(name, term.right);
    case 'ap':
      return occursFreeHoTT(name, term.fn) || occursFreeHoTT(name, term.path);
    case 'jElim':
      return (
        occursFreeHoTT(name, term.motive) ||
        occursFreeHoTT(name, term.baseCase) ||
        occursFreeHoTT(name, term.path)
      );
    case 'suspension':
    case 'north':
    case 'south':
      return occursFreeHoTT(name, term.type);
    case 'meridian':
      return occursFreeHoTT(name, term.type) || occursFreeHoTT(name, term.point);
    case 'ua':
      return occursFreeHoTT(name, term.equiv);
  }
}

export function freeVarsHoTT(term: HoTTTerm, acc: Set<string> = new Set()): Set<string> {
  switch (term.kind) {
    case 'var':
      acc.add(term.name);
      break;
    case 'universe':
    case 'nat':
    case 'zero':
    case 'circle':
    case 'baseOfCircle':
    case 'loopOfCircle':
      break;
    case 'pi':
    case 'sigma': {
      const dom = term.kind === 'pi' ? term.domain : term.first;
      const cod = term.kind === 'pi' ? term.codomain : term.second;
      freeVarsHoTT(dom, acc);
      const inner = freeVarsHoTT(cod);
      inner.delete(term.bind);
      for (const v of inner) acc.add(v);
      break;
    }
    case 'lam': {
      freeVarsHoTT(term.domain, acc);
      const inner = freeVarsHoTT(term.body);
      inner.delete(term.bind);
      for (const v of inner) acc.add(v);
      break;
    }
    case 'app':
      freeVarsHoTT(term.fn, acc);
      freeVarsHoTT(term.arg, acc);
      break;
    case 'pair':
      freeVarsHoTT(term.fst, acc);
      freeVarsHoTT(term.snd, acc);
      break;
    case 'fst':
    case 'snd':
      freeVarsHoTT(term.pair, acc);
      break;
    case 'path':
      freeVarsHoTT(term.type, acc);
      freeVarsHoTT(term.left, acc);
      freeVarsHoTT(term.right, acc);
      break;
    case 'refl':
      freeVarsHoTT(term.term, acc);
      break;
    case 'succ':
      freeVarsHoTT(term.arg, acc);
      break;
    case 'transport':
      freeVarsHoTT(term.family, acc);
      freeVarsHoTT(term.path, acc);
      freeVarsHoTT(term.term, acc);
      break;
    case 'pathSym':
      freeVarsHoTT(term.path, acc);
      break;
    case 'pathConcat':
      freeVarsHoTT(term.left, acc);
      freeVarsHoTT(term.right, acc);
      break;
    case 'ap':
      freeVarsHoTT(term.fn, acc);
      freeVarsHoTT(term.path, acc);
      break;
    case 'jElim':
      freeVarsHoTT(term.motive, acc);
      freeVarsHoTT(term.baseCase, acc);
      freeVarsHoTT(term.path, acc);
      break;
    case 'suspension':
    case 'north':
    case 'south':
      freeVarsHoTT(term.type, acc);
      break;
    case 'meridian':
      freeVarsHoTT(term.type, acc);
      freeVarsHoTT(term.point, acc);
      break;
    case 'ua':
      freeVarsHoTT(term.equiv, acc);
      break;
  }
  return acc;
}

// ── Serialización ────────────────────────────────────────────

export function termToStringHoTT(t: HoTTTerm): string {
  switch (t.kind) {
    case 'var':
      return t.name;
    case 'universe':
      return t.level === 0 ? 'Type' : `Type ${t.level}`;
    case 'pi':
      if (t.bind === '_' || !occursFreeHoTT(t.bind, t.codomain)) {
        return `(${termToStringHoTT(t.domain)} → ${termToStringHoTT(t.codomain)})`;
      }
      return `(Π (${t.bind} : ${termToStringHoTT(t.domain)}). ${termToStringHoTT(t.codomain)})`;
    case 'lam':
      return `(λ (${t.bind} : ${termToStringHoTT(t.domain)}). ${termToStringHoTT(t.body)})`;
    case 'app':
      return `(${termToStringHoTT(t.fn)} ${termToStringHoTT(t.arg)})`;
    case 'sigma':
      return `(Σ (${t.bind} : ${termToStringHoTT(t.first)}). ${termToStringHoTT(t.second)})`;
    case 'pair':
      return `⟨${termToStringHoTT(t.fst)}, ${termToStringHoTT(t.snd)}⟩`;
    case 'fst':
      return `fst(${termToStringHoTT(t.pair)})`;
    case 'snd':
      return `snd(${termToStringHoTT(t.pair)})`;
    case 'path':
      return `Path(${termToStringHoTT(t.type)}, ${termToStringHoTT(t.left)}, ${termToStringHoTT(t.right)})`;
    case 'refl':
      return `refl(${termToStringHoTT(t.term)})`;
    case 'nat':
      return 'Nat';
    case 'zero':
      return 'zero';
    case 'succ':
      return `succ(${termToStringHoTT(t.arg)})`;
    case 'transport':
      return `transport(${termToStringHoTT(t.family)}, ${termToStringHoTT(t.path)}, ${termToStringHoTT(t.term)})`;
    case 'pathSym':
      return `(${termToStringHoTT(t.path)})⁻¹`;
    case 'pathConcat':
      return `(${termToStringHoTT(t.left)} · ${termToStringHoTT(t.right)})`;
    case 'ap':
      return `ap(${termToStringHoTT(t.fn)}, ${termToStringHoTT(t.path)})`;
    case 'jElim':
      return `J(${termToStringHoTT(t.motive)}, ${termToStringHoTT(t.baseCase)}, ${termToStringHoTT(t.path)})`;
    case 'circle':
      return 'S¹';
    case 'baseOfCircle':
      return 'base';
    case 'loopOfCircle':
      return 'loop';
    case 'suspension':
      return `Σ-susp(${termToStringHoTT(t.type)})`;
    case 'north':
      return `north[${termToStringHoTT(t.type)}]`;
    case 'south':
      return `south[${termToStringHoTT(t.type)}]`;
    case 'meridian':
      return `meridian[${termToStringHoTT(t.type)}](${termToStringHoTT(t.point)})`;
    case 'ua':
      return `ua(${termToStringHoTT(t.equiv)})`;
  }
}
