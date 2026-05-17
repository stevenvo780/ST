// ============================================================
// Cubical Type Theory (CTT-Lite) — términos y constructores
// ============================================================
//
// Subset pedagógico de Cubical Type Theory. La diferencia esencial
// con HoTT (homotopy type theory) es que aquí univalence pasa a ser
// COMPUTACIONAL via:
//
//   - Un intervalo formal I con dos extremos i0, i1 y conexiones
//     (∧ min, ∨ max) más involutiva (1 - i).
//   - PathP A x y = caminos con familia dependiente sobre I.
//   - Path-abstracción y aplicación (λi. t) @ i con reducción por
//     sustitución de la variable de intervalo.
//   - Glue como precursor sintáctico de transport sobre ua.
//
// Re-empaquetamos las construcciones MLTT mínimas que el subset
// necesita (Π, λ, app, var, universo). Para evitar conflictos de
// tipos con HoTT, este módulo es autocontenido: CubicalTerm vive en
// su propio universo de tipos.
//
// API mínima compatible con MLTT/HoTT:
//   inferType / normalize / isIntervalExpr / evalInterval

export type CubicalTerm =
  // ── Intervalo I ──────────────────────────────────────────
  | { kind: 'i0' }
  | { kind: 'i1' }
  | { kind: 'iVar'; name: string }
  | { kind: 'iMin'; left: CubicalTerm; right: CubicalTerm }
  | { kind: 'iMax'; left: CubicalTerm; right: CubicalTerm }
  | { kind: 'iNeg'; arg: CubicalTerm }
  // ── PathP, abstracción y aplicación de path ──────────────
  | { kind: 'pathP'; family: CubicalTerm; left: CubicalTerm; right: CubicalTerm }
  | { kind: 'pLam'; bind: string; body: CubicalTerm }
  | { kind: 'pApp'; path: CubicalTerm; arg: CubicalTerm }
  // ── Glue (univalence computacional precursora) ───────────
  | { kind: 'glue'; equiv: CubicalTerm; partial: CubicalTerm }
  // ── MLTT base ────────────────────────────────────────────
  | { kind: 'var'; name: string }
  | { kind: 'universe'; level: number }
  | { kind: 'pi'; bind: string; domain: CubicalTerm; codomain: CubicalTerm }
  | { kind: 'lam'; bind: string; domain: CubicalTerm; body: CubicalTerm }
  | { kind: 'app'; fn: CubicalTerm; arg: CubicalTerm };

// ── Constructores convenientes ──────────────────────────────

export const cI0 = (): CubicalTerm => ({ kind: 'i0' });
export const cI1 = (): CubicalTerm => ({ kind: 'i1' });
export const cIVar = (name: string): CubicalTerm => ({ kind: 'iVar', name });
export const cIMin = (left: CubicalTerm, right: CubicalTerm): CubicalTerm => ({
  kind: 'iMin',
  left,
  right,
});
export const cIMax = (left: CubicalTerm, right: CubicalTerm): CubicalTerm => ({
  kind: 'iMax',
  left,
  right,
});
export const cINeg = (arg: CubicalTerm): CubicalTerm => ({ kind: 'iNeg', arg });

export const cPathP = (
  family: CubicalTerm,
  left: CubicalTerm,
  right: CubicalTerm,
): CubicalTerm => ({
  kind: 'pathP',
  family,
  left,
  right,
});
export const cPLam = (bind: string, body: CubicalTerm): CubicalTerm => ({
  kind: 'pLam',
  bind,
  body,
});
export const cPApp = (path: CubicalTerm, arg: CubicalTerm): CubicalTerm => ({
  kind: 'pApp',
  path,
  arg,
});

export const cGlue = (equiv: CubicalTerm, partial: CubicalTerm): CubicalTerm => ({
  kind: 'glue',
  equiv,
  partial,
});

export const cVar = (name: string): CubicalTerm => ({ kind: 'var', name });
export const cUniverse = (level = 0): CubicalTerm => ({ kind: 'universe', level });
export const cPi = (bind: string, domain: CubicalTerm, codomain: CubicalTerm): CubicalTerm => ({
  kind: 'pi',
  bind,
  domain,
  codomain,
});
export const cLam = (bind: string, domain: CubicalTerm, body: CubicalTerm): CubicalTerm => ({
  kind: 'lam',
  bind,
  domain,
  body,
});
export const cApp = (fn: CubicalTerm, arg: CubicalTerm): CubicalTerm => ({ kind: 'app', fn, arg });
export const cArrow = (from: CubicalTerm, to: CubicalTerm): CubicalTerm => cPi('_', from, to);

// ── Discriminador de fragmentos del intervalo ───────────────

export function isIntervalExpr(t: CubicalTerm): boolean {
  switch (t.kind) {
    case 'i0':
    case 'i1':
    case 'iVar':
      return true;
    case 'iMin':
    case 'iMax':
      return isIntervalExpr(t.left) && isIntervalExpr(t.right);
    case 'iNeg':
      return isIntervalExpr(t.arg);
    default:
      return false;
  }
}

// ── Inspección estructural ───────────────────────────────────

export function occursFreeCubical(name: string, term: CubicalTerm): boolean {
  switch (term.kind) {
    case 'i0':
    case 'i1':
    case 'universe':
      return false;
    case 'var':
    case 'iVar':
      return term.name === name;
    case 'iMin':
    case 'iMax':
      return occursFreeCubical(name, term.left) || occursFreeCubical(name, term.right);
    case 'iNeg':
      return occursFreeCubical(name, term.arg);
    case 'pathP':
      return (
        occursFreeCubical(name, term.family) ||
        occursFreeCubical(name, term.left) ||
        occursFreeCubical(name, term.right)
      );
    case 'pLam':
      if (term.bind === name) return false;
      return occursFreeCubical(name, term.body);
    case 'pApp':
      return occursFreeCubical(name, term.path) || occursFreeCubical(name, term.arg);
    case 'glue':
      return occursFreeCubical(name, term.equiv) || occursFreeCubical(name, term.partial);
    case 'pi': {
      if (occursFreeCubical(name, term.domain)) return true;
      if (term.bind === name) return false;
      return occursFreeCubical(name, term.codomain);
    }
    case 'lam': {
      if (occursFreeCubical(name, term.domain)) return true;
      if (term.bind === name) return false;
      return occursFreeCubical(name, term.body);
    }
    case 'app':
      return occursFreeCubical(name, term.fn) || occursFreeCubical(name, term.arg);
  }
}

export function freeVarsCubical(term: CubicalTerm, acc: Set<string> = new Set()): Set<string> {
  switch (term.kind) {
    case 'i0':
    case 'i1':
    case 'universe':
      break;
    case 'var':
    case 'iVar':
      acc.add(term.name);
      break;
    case 'iMin':
    case 'iMax':
      freeVarsCubical(term.left, acc);
      freeVarsCubical(term.right, acc);
      break;
    case 'iNeg':
      freeVarsCubical(term.arg, acc);
      break;
    case 'pathP':
      freeVarsCubical(term.family, acc);
      freeVarsCubical(term.left, acc);
      freeVarsCubical(term.right, acc);
      break;
    case 'pLam': {
      const inner = freeVarsCubical(term.body);
      inner.delete(term.bind);
      for (const v of inner) acc.add(v);
      break;
    }
    case 'pApp':
      freeVarsCubical(term.path, acc);
      freeVarsCubical(term.arg, acc);
      break;
    case 'glue':
      freeVarsCubical(term.equiv, acc);
      freeVarsCubical(term.partial, acc);
      break;
    case 'pi': {
      freeVarsCubical(term.domain, acc);
      const inner = freeVarsCubical(term.codomain);
      inner.delete(term.bind);
      for (const v of inner) acc.add(v);
      break;
    }
    case 'lam': {
      freeVarsCubical(term.domain, acc);
      const inner = freeVarsCubical(term.body);
      inner.delete(term.bind);
      for (const v of inner) acc.add(v);
      break;
    }
    case 'app':
      freeVarsCubical(term.fn, acc);
      freeVarsCubical(term.arg, acc);
      break;
  }
  return acc;
}

// ── Serialización ────────────────────────────────────────────

export function termToStringCubical(t: CubicalTerm): string {
  switch (t.kind) {
    case 'i0':
      return 'i0';
    case 'i1':
      return 'i1';
    case 'iVar':
      return t.name;
    case 'iMin':
      return `(${termToStringCubical(t.left)} ∧ ${termToStringCubical(t.right)})`;
    case 'iMax':
      return `(${termToStringCubical(t.left)} ∨ ${termToStringCubical(t.right)})`;
    case 'iNeg':
      return `~${termToStringCubical(t.arg)}`;
    case 'pathP':
      return `PathP(${termToStringCubical(t.family)}, ${termToStringCubical(t.left)}, ${termToStringCubical(t.right)})`;
    case 'pLam':
      return `(λi:I. ${t.bind} → ${termToStringCubical(t.body)})`;
    case 'pApp':
      return `(${termToStringCubical(t.path)} @ ${termToStringCubical(t.arg)})`;
    case 'glue':
      return `glue(${termToStringCubical(t.equiv)}, ${termToStringCubical(t.partial)})`;
    case 'var':
      return t.name;
    case 'universe':
      return t.level === 0 ? 'Type' : `Type ${t.level}`;
    case 'pi':
      if (t.bind === '_' || !occursFreeCubical(t.bind, t.codomain)) {
        return `(${termToStringCubical(t.domain)} → ${termToStringCubical(t.codomain)})`;
      }
      return `(Π (${t.bind} : ${termToStringCubical(t.domain)}). ${termToStringCubical(t.codomain)})`;
    case 'lam':
      return `(λ (${t.bind} : ${termToStringCubical(t.domain)}). ${termToStringCubical(t.body)})`;
    case 'app':
      return `(${termToStringCubical(t.fn)} ${termToStringCubical(t.arg)})`;
  }
}
