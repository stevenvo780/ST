// ============================================================
// Bracket abstraction: λ-cálculo → SKI
// ============================================================
//
// Algoritmo clásico de Curry para eliminar λ-abstracciones, traducido
// como `lambda x . T  ≡  [x] T` con las reglas:
//
//   [x] x         = I
//   [x] M         = K M             si x ∉ FV(M)
//   [x] (M N)     = S ([x] M) ([x] N)
//
// Es el llamado "algoritmo (abc)" — simple, no optimizado: produce
// términos grandes pero correctos. Hay variantes que aprovechan
// patrones como `[x] (M x) = M` (η) o introducen B, C, W, T, K' para
// reducir tamaño; aquí elegimos la canónica por claridad pedagógica.
//
// `toLambda` hace el camino inverso: codifica S, K, I como las
// λ-abstracciones que los definen. No pretende invertir
// `abstractFromLambda` exactamente — el round-trip es semántico
// (alpha/beta-eta equivalente), no sintáctico.

import type { Term as LambdaTerm } from '../lambda-calc/types';
import { ap as lamAp, apN as lamApN, lam, v as lamVar } from '../lambda-calc/types';
import type { CTerm } from './types';
import { I, K, S, app, cvar, freeVars } from './types';

// Convierte un λ-término a SKI puro (sólo S, K, I y variables libres).
export function abstractFromLambda(t: LambdaTerm): CTerm {
  switch (t.kind) {
    case 'var':
      return cvar(t.name);
    case 'app':
      return { kind: 'app', fn: abstractFromLambda(t.fn), arg: abstractFromLambda(t.arg) };
    case 'abs': {
      // [param] body
      const inner = abstractFromLambda(t.body);
      return bracket(t.param, inner);
    }
  }
}

// [x] T  con T ya en SKI.
function bracket(x: string, t: CTerm): CTerm {
  // [x] x = I
  if (t.kind === 'var' && t.name === x) return I();
  // [x] M  = K M     si x ∉ FV(M)
  if (!freeVars(t).has(x)) return app(K(), t);
  // En este punto t es necesariamente una aplicación: si fuese una
  // constante S/K/I no tendría FV, y si fuese `var` su nombre ≠ x ya
  // habría caído en la rama K. Mantengo el switch para que TS
  // narrowee y queden cubiertas las ramas restantes.
  switch (t.kind) {
    case 'app':
      // [x] (M N) = S ([x] M) ([x] N)
      return app(S(), bracket(x, t.fn), bracket(x, t.arg));
    case 'var':
    case 'S':
    case 'K':
    case 'I':
      // Inalcanzable por las guardas previas; reproducimos K-rule
      // por defensa para no caer en undefined.
      return app(K(), t);
  }
}

// SKI → λ-cálculo. Codifica S, K, I como sus definiciones lambda
// canónicas y deja las variables libres como variables. Útil para
// round-trip: el resultado, normalizado en λ, debe ser
// alpha-equivalente al término original aplicado a los mismos
// argumentos (la equivalencia es semántica, no sintáctica).
export function toLambda(c: CTerm): LambdaTerm {
  switch (c.kind) {
    case 'I':
      // I = λx.x
      return lam('x', lamVar('x'));
    case 'K':
      // K = λx.λy.x
      return lam('x', lam('y', lamVar('x')));
    case 'S':
      // S = λx.λy.λz. x z (y z)
      return lam(
        'x',
        lam('y', lam('z', lamApN(lamVar('x'), lamVar('z'), lamAp(lamVar('y'), lamVar('z'))))),
      );
    case 'var':
      return lamVar(c.name);
    case 'app':
      return lamAp(toLambda(c.fn), toLambda(c.arg));
  }
}
