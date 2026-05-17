// ============================================================
// π-calculus — nombres libres / ligados y α-renaming.
// ============================================================
// Definiciones estándar (Milner, "Communicating and Mobile Systems"):
//
//   fn(0)          = ∅
//   fn(c(x).P)     = {c} ∪ (fn(P) \ {x})         x está ligado en P
//   fn(c̄⟨v⟩.P)    = {c, v} ∪ fn(P)
//   fn(P|Q)        = fn(P) ∪ fn(Q)
//   fn((νc) P)     = fn(P) \ {c}                  c está ligado en P
//   fn(!P)         = fn(P)
//   fn(P+Q)        = fn(P) ∪ fn(Q)
//   fn([x=y].P)    = {x, y} ∪ fn(P)
//
//   bn(0)          = ∅
//   bn(c(x).P)     = {x} ∪ bn(P)
//   bn((νc) P)     = {c} ∪ bn(P)
//   (resto = unión de los hijos)
// ============================================================

import type { PiProcess } from './types';

/**
 * Conjunto de nombres libres de un proceso π. Un nombre es "libre" si
 * aparece referenciado pero no está bajo el alcance de un binder
 * (input `c(x)` liga `x`; new `(νc)` liga `c`).
 */
export function freeNames(p: PiProcess): Set<string> {
  switch (p.kind) {
    case 'nil':
      return new Set();
    case 'input': {
      const fnCont = freeNames(p.cont);
      fnCont.delete(p.bind);
      fnCont.add(p.channel);
      return fnCont;
    }
    case 'output': {
      const fnCont = freeNames(p.cont);
      fnCont.add(p.channel);
      fnCont.add(p.value);
      return fnCont;
    }
    case 'parallel':
    case 'choice':
      return union(freeNames(p.left), freeNames(p.right));
    case 'new': {
      const fnBody = freeNames(p.body);
      fnBody.delete(p.channel);
      return fnBody;
    }
    case 'replication':
      return freeNames(p.body);
    case 'match': {
      const fnCont = freeNames(p.cont);
      fnCont.add(p.left);
      fnCont.add(p.right);
      return fnCont;
    }
  }
}

/**
 * Conjunto de nombres ligados (introducidos por algún binder en el
 * subárbol). Útil para detectar shadowing y evitar capturas.
 */
export function boundNames(p: PiProcess): Set<string> {
  switch (p.kind) {
    case 'nil':
      return new Set();
    case 'input': {
      const bn = boundNames(p.cont);
      bn.add(p.bind);
      return bn;
    }
    case 'output':
      return boundNames(p.cont);
    case 'parallel':
    case 'choice':
      return union(boundNames(p.left), boundNames(p.right));
    case 'new': {
      const bn = boundNames(p.body);
      bn.add(p.channel);
      return bn;
    }
    case 'replication':
      return boundNames(p.body);
    case 'match':
      return boundNames(p.cont);
  }
}

/**
 * α-renaming: renombrar un nombre en todo el AST. Útil para:
 *   - Refrescar nombres ligados antes de sustituir (evitar capturas).
 *   - Normalizar canales restringidos al testear congruencia estructural.
 *
 * No diferencia entre nombres libres y ligados: simplemente reemplaza
 * cada ocurrencia de `oldN` por `newN`. La diferenciación libre/ligado
 * se hace en `substitute`, que usa `alphaRename` como utility.
 */
export function alphaRename(p: PiProcess, oldN: string, newN: string): PiProcess {
  if (oldN === newN) return p;
  switch (p.kind) {
    case 'nil':
      return p;
    case 'input': {
      const newChannel = p.channel === oldN ? newN : p.channel;
      // Si el binder mismo es `oldN`, la sustitución se detiene en él:
      // el cuerpo `cont` ya no ve `oldN` como referencia al exterior.
      if (p.bind === oldN) {
        return { kind: 'input', channel: newChannel, bind: p.bind, cont: p.cont };
      }
      return {
        kind: 'input',
        channel: newChannel,
        bind: p.bind,
        cont: alphaRename(p.cont, oldN, newN),
      };
    }
    case 'output':
      return {
        kind: 'output',
        channel: p.channel === oldN ? newN : p.channel,
        value: p.value === oldN ? newN : p.value,
        cont: alphaRename(p.cont, oldN, newN),
      };
    case 'parallel':
      return {
        kind: 'parallel',
        left: alphaRename(p.left, oldN, newN),
        right: alphaRename(p.right, oldN, newN),
      };
    case 'choice':
      return {
        kind: 'choice',
        left: alphaRename(p.left, oldN, newN),
        right: alphaRename(p.right, oldN, newN),
      };
    case 'new': {
      // Mismo principio que en input: el binder atrapa el nombre.
      if (p.channel === oldN) {
        return p;
      }
      return {
        kind: 'new',
        channel: p.channel,
        body: alphaRename(p.body, oldN, newN),
      };
    }
    case 'replication':
      return { kind: 'replication', body: alphaRename(p.body, oldN, newN) };
    case 'match':
      return {
        kind: 'match',
        left: p.left === oldN ? newN : p.left,
        right: p.right === oldN ? newN : p.right,
        cont: alphaRename(p.cont, oldN, newN),
      };
  }
}

/**
 * Genera un nombre fresco que no aparece en ninguno de los conjuntos
 * `avoid`. Estrategia simple: base + sufijo numérico incremental.
 */
export function freshName(base: string, avoid: ReadonlySet<string>): string {
  if (!avoid.has(base)) return base;
  let i = 0;
  while (avoid.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  const out = new Set(a);
  for (const x of b) out.add(x);
  return out;
}
