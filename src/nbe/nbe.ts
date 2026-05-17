// ============================================================
// NbE — Normalization by Evaluation para STLC
// ============================================================
//
// Idea:
//   - evaluate :: Term × Env → Value
//       interpreta el término en el dominio semántico, donde las
//       variables libres y aplicaciones atascadas viven como
//       "neutrales" y las λ se vuelven clausuras nativas de TS.
//   - reify :: Value × Type → Term
//       baja un valor a un término en β-normal forma η-larga,
//       guiándose por el tipo. La η-expansión emerge de "aplicar"
//       el valor a una variable fresca cuando el tipo es flecha.
//   - normalize = reify ∘ evaluate
//
// Resultado: forma normal única (β-corta η-larga) por término bien
// tipado, sin enumerar reducciones explícitas.

import {
  type Env,
  type Neutral,
  type Term,
  type Type,
  type Value,
  vClosure,
  vNeutral,
  vNeutralVar,
} from './types';

// ---------- Generador de nombres frescos ----------
// Generador determinístico: dado el mismo input, mismo output.
// El estado vive en el closure devuelto.
export function makeFreshSupply(prefix = '_x'): () => string {
  let n = 0;
  return () => `${prefix}${n++}`;
}

// ---------- Aplicación semántica ----------
// Aplica un Value a otro Value. Si la cabeza es una clausura,
// β-reduce ahora mismo (extiende el entorno). Si es un neutral,
// queda atascado como aplicación neutral.
export function apply(fn: Value, arg: Value): Value {
  if (fn.kind === 'closure') {
    const newEnv = new Map(fn.env);
    newEnv.set(fn.param, arg);
    return evaluate(fn.body, newEnv);
  }
  // fn.kind === 'neutral'
  const head: Neutral = { kind: 'app', head: fn.head, arg };
  return vNeutral(head);
}

// ---------- Evaluador ----------
export function evaluate(t: Term, env: Env): Value {
  switch (t.kind) {
    case 'var': {
      const bound = env.get(t.name);
      // Variable libre → neutral. Variable ligada → valor del entorno.
      if (bound === undefined) return vNeutralVar(t.name);
      return bound;
    }
    case 'abs':
      // Captura del entorno en clausura — la β-reducción se hará al aplicar.
      return vClosure(env, t.param, t.paramType, t.body);
    case 'app': {
      const fnV = evaluate(t.fn, env);
      const argV = evaluate(t.arg, env);
      return apply(fnV, argV);
    }
  }
}

// ---------- Reificación ----------
// Trae el valor de vuelta a la sintaxis en forma normal η-larga.
// El tipo dirige la reificación: en cada arrow type η-expandimos.
export function reify(value: Value, type: Type, freshSupply: () => string): Term {
  if (type.kind === 'arrow') {
    // η-expansión: λy:A. reify (apply value (var y)) : B
    const y = freshSupply();
    const body = reify(apply(value, vNeutralVar(y)), type.to, freshSupply);
    return { kind: 'abs', param: y, paramType: type.from, body };
  }
  // type.kind === 'base'
  if (value.kind === 'neutral') {
    return reifyNeutral(value.head, freshSupply);
  }
  // Inalcanzable bajo tipado correcto: una clausura debería tener
  // tipo flecha. Si esto pasa, el caller pasó un tipo equivocado.
  throw new Error(
    'NbE.reify: clausura encontrada en tipo base — el tipo no corresponde al término',
  );
}

function reifyNeutral(n: Neutral, freshSupply: () => string): Term {
  if (n.kind === 'var') return { kind: 'var', name: n.name };
  // Aplicación neutral: el argumento se reifica sin saber su tipo
  // exacto, pero como construimos siempre desde apply(...) sobre
  // valores η-largos, basta con bajar recursivamente.
  return {
    kind: 'app',
    fn: reifyNeutral(n.head, freshSupply),
    arg: reifyValueUntyped(n.arg, freshSupply),
  };
}

// Reificación sin tipo, usada dentro de spines neutrales donde el
// argumento ya está en forma normal por construcción (vino de
// evaluar un subtérmino y de aplicarse a neutrales). En el peor caso
// devuelve la forma "honesta" del valor.
function reifyValueUntyped(value: Value, freshSupply: () => string): Term {
  if (value.kind === 'neutral') return reifyNeutral(value.head, freshSupply);
  // Clausura sin tipo conocido: la bajamos β-normal honestamente
  // aplicándola a una variable fresca (η-1 expansión local).
  const y = freshSupply();
  const body = reifyValueUntyped(apply(value, vNeutralVar(y)), freshSupply);
  return { kind: 'abs', param: y, paramType: value.paramType, body };
}

// ---------- Normalización ----------
// NbE clásico: evalúa, luego reifica al tipo objetivo.
// Si no se pasa supply, se crea uno determinístico fresco por llamada.
export function normalize(t: Term, type: Type, freshSupply?: () => string): Term {
  const supply = freshSupply ?? makeFreshSupply();
  const v = evaluate(t, new Map());
  return reify(v, type, supply);
}
