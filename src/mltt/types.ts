// ============================================================
// Martin-Löf Type Theory (MLTT) — Términos y tipos dependientes
// ============================================================
//
// Sistema base con:
//   - Universos jerárquicos:        Type 0 : Type 1 : Type 2 : ...
//   - Funciones dependientes:       Π (x : A). B(x)
//   - Pares dependientes:           Σ (x : A). B(x)
//   - Tipo identidad:               Id(A, a, b), constructor refl(a)
//   - Naturales como tipo base:     Nat, zero, succ
//
// En MLTT no hay distinción sintáctica entre términos y tipos:
// los tipos *son* términos (de algún universo). Por eso un solo
// constructor `MLTTTerm` cubre ambos roles.
//
// Convenciones:
//   - `bind` es el nombre del binder (Π, Σ, lam).
//   - `domain` es el tipo del binder.
//   - `codomain` (Π) y `second` (Σ) pueden depender de `bind`.
//   - α-equivalencia se trata vía sustitución capture-avoiding.

export type MLTTTerm =
  | { kind: 'var'; name: string }
  | { kind: 'universe'; level: number }
  | { kind: 'pi'; bind: string; domain: MLTTTerm; codomain: MLTTTerm }
  | { kind: 'lam'; bind: string; domain: MLTTTerm; body: MLTTTerm }
  | { kind: 'app'; fn: MLTTTerm; arg: MLTTTerm }
  | { kind: 'sigma'; bind: string; first: MLTTTerm; second: MLTTTerm }
  | { kind: 'pair'; fst: MLTTTerm; snd: MLTTTerm }
  | { kind: 'fst'; pair: MLTTTerm }
  | { kind: 'snd'; pair: MLTTTerm }
  | { kind: 'identity'; type: MLTTTerm; left: MLTTTerm; right: MLTTTerm }
  | { kind: 'refl'; term: MLTTTerm }
  | { kind: 'nat' }
  | { kind: 'zero' }
  | { kind: 'succ'; arg: MLTTTerm };

// ---------- Constructores convenientes ----------

export const mVar = (name: string): MLTTTerm => ({ kind: 'var', name });
export const mUniverse = (level = 0): MLTTTerm => ({ kind: 'universe', level });
export const mPi = (bind: string, domain: MLTTTerm, codomain: MLTTTerm): MLTTTerm => ({
  kind: 'pi',
  bind,
  domain,
  codomain,
});
export const mLam = (bind: string, domain: MLTTTerm, body: MLTTTerm): MLTTTerm => ({
  kind: 'lam',
  bind,
  domain,
  body,
});
export const mApp = (fn: MLTTTerm, arg: MLTTTerm): MLTTTerm => ({ kind: 'app', fn, arg });
export const mSigma = (bind: string, first: MLTTTerm, second: MLTTTerm): MLTTTerm => ({
  kind: 'sigma',
  bind,
  first,
  second,
});
export const mPair = (fst: MLTTTerm, snd: MLTTTerm): MLTTTerm => ({ kind: 'pair', fst, snd });
export const mFst = (pair: MLTTTerm): MLTTTerm => ({ kind: 'fst', pair });
export const mSnd = (pair: MLTTTerm): MLTTTerm => ({ kind: 'snd', pair });
export const mId = (type: MLTTTerm, left: MLTTTerm, right: MLTTTerm): MLTTTerm => ({
  kind: 'identity',
  type,
  left,
  right,
});
export const mRefl = (term: MLTTTerm): MLTTTerm => ({ kind: 'refl', term });
export const mNat = (): MLTTTerm => ({ kind: 'nat' });
export const mZero = (): MLTTTerm => ({ kind: 'zero' });
export const mSucc = (arg: MLTTTerm): MLTTTerm => ({ kind: 'succ', arg });

// Arrow no-dependiente: Π (_ : A). B  con B sin referencia a _.
export const mArrow = (from: MLTTTerm, to: MLTTTerm): MLTTTerm =>
  mPi('_', from, to);

// ---------- Helpers de inspección ----------

/** ¿`name` aparece libre en `term`? */
export function occursFree(name: string, term: MLTTTerm): boolean {
  switch (term.kind) {
    case 'var':
      return term.name === name;
    case 'universe':
    case 'nat':
    case 'zero':
      return false;
    case 'pi':
    case 'sigma': {
      const dom = term.kind === 'pi' ? term.domain : term.first;
      const cod = term.kind === 'pi' ? term.codomain : term.second;
      if (occursFree(name, dom)) return true;
      if (term.bind === name) return false;
      return occursFree(name, cod);
    }
    case 'lam':
      if (occursFree(name, term.domain)) return true;
      if (term.bind === name) return false;
      return occursFree(name, term.body);
    case 'app':
      return occursFree(name, term.fn) || occursFree(name, term.arg);
    case 'pair':
      return occursFree(name, term.fst) || occursFree(name, term.snd);
    case 'fst':
    case 'snd':
      return occursFree(name, term.pair);
    case 'identity':
      return (
        occursFree(name, term.type) ||
        occursFree(name, term.left) ||
        occursFree(name, term.right)
      );
    case 'refl':
      return occursFree(name, term.term);
    case 'succ':
      return occursFree(name, term.arg);
  }
}

/** Conjunto de variables libres. */
export function freeVars(term: MLTTTerm, acc: Set<string> = new Set()): Set<string> {
  switch (term.kind) {
    case 'var':
      acc.add(term.name);
      break;
    case 'universe':
    case 'nat':
    case 'zero':
      break;
    case 'pi':
    case 'sigma': {
      const dom = term.kind === 'pi' ? term.domain : term.first;
      const cod = term.kind === 'pi' ? term.codomain : term.second;
      freeVars(dom, acc);
      const inner = freeVars(cod);
      inner.delete(term.bind);
      for (const v of inner) acc.add(v);
      break;
    }
    case 'lam': {
      freeVars(term.domain, acc);
      const inner = freeVars(term.body);
      inner.delete(term.bind);
      for (const v of inner) acc.add(v);
      break;
    }
    case 'app':
      freeVars(term.fn, acc);
      freeVars(term.arg, acc);
      break;
    case 'pair':
      freeVars(term.fst, acc);
      freeVars(term.snd, acc);
      break;
    case 'fst':
    case 'snd':
      freeVars(term.pair, acc);
      break;
    case 'identity':
      freeVars(term.type, acc);
      freeVars(term.left, acc);
      freeVars(term.right, acc);
      break;
    case 'refl':
      freeVars(term.term, acc);
      break;
    case 'succ':
      freeVars(term.arg, acc);
      break;
  }
  return acc;
}

// ---------- Serialización legible ----------

export function termToString(t: MLTTTerm): string {
  switch (t.kind) {
    case 'var':
      return t.name;
    case 'universe':
      return t.level === 0 ? 'Type' : `Type ${t.level}`;
    case 'pi':
      if (t.bind === '_' || !occursFree(t.bind, t.codomain)) {
        return `(${termToString(t.domain)} → ${termToString(t.codomain)})`;
      }
      return `(Π (${t.bind} : ${termToString(t.domain)}). ${termToString(t.codomain)})`;
    case 'lam':
      return `(λ (${t.bind} : ${termToString(t.domain)}). ${termToString(t.body)})`;
    case 'app':
      return `(${termToString(t.fn)} ${termToString(t.arg)})`;
    case 'sigma':
      return `(Σ (${t.bind} : ${termToString(t.first)}). ${termToString(t.second)})`;
    case 'pair':
      return `⟨${termToString(t.fst)}, ${termToString(t.snd)}⟩`;
    case 'fst':
      return `fst(${termToString(t.pair)})`;
    case 'snd':
      return `snd(${termToString(t.pair)})`;
    case 'identity':
      return `Id(${termToString(t.type)}, ${termToString(t.left)}, ${termToString(t.right)})`;
    case 'refl':
      return `refl(${termToString(t.term)})`;
    case 'nat':
      return 'Nat';
    case 'zero':
      return 'zero';
    case 'succ':
      return `succ(${termToString(t.arg)})`;
  }
}
