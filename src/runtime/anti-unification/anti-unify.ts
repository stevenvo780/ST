// ============================================================
// ST Anti-Unification — Algoritmo de Plotkin (lgg)
// ============================================================
//
// Algoritmo (Plotkin 1970):
//
//   au(t1, t2, table):
//     si t1 ≡ t2 estructuralmente:
//       return t1
//     si ambos son func/const con mismo nombre y misma aridad:
//       return func(name, [au(t1.args[i], t2.args[i]) for i])
//     // desacuerdo: introducimos fresh var, reusando si ya existe
//     // una asignada al MISMO par (t1, t2) — esto es clave para que
//     // la generalización sea LEAST (most specific).
//     si table tiene (t1, t2) → v entonces return v
//     v := freshSupply()
//     table[(t1, t2)] := v
//     return v
//
// La tabla de correspondencias se mantiene globalmente durante la
// recursión para que múltiples ocurrencias del mismo desacuerdo
// reciban la misma fresh var. Sin esta tabla obtendríamos una
// generalización menos específica (e.g., au(p(a,a), p(b,b)) daría
// p(X, Y) en vez de p(X, X)).

import type { AntiUnificationResult, FreshSupply, Term } from './types';
import { termEquals, termKey } from './term-utils';

/**
 * Fuente default de variables frescas: _g0, _g1, _g2, …
 *
 * Se devuelve una NUEVA instancia por llamada para evitar estado
 * compartido entre invocaciones de antiUnify.
 */
export function defaultFreshSupply(prefix: string = '_g'): FreshSupply {
  let counter = 0;
  return () => `${prefix}${counter++}`;
}

/**
 * Anti-unification de dos términos.
 *
 * Devuelve el lgg (least general generalization) junto con las
 * sustituciones de izquierda y derecha que reconstruyen los
 * términos originales.
 *
 * Complejidad: O(|t1| + |t2|) tiempo si la tabla se implementa con
 * hashing O(1). Usamos `termKey` que serializa, así que es
 * O((|t1| + |t2|)·k) donde k es el tamaño del subtérmino más grande
 * que aparezca en un desacuerdo.
 */
export function antiUnify(t1: Term, t2: Term, freshSupply?: FreshSupply): AntiUnificationResult {
  const supply = freshSupply ?? defaultFreshSupply();
  // Tabla de desacuerdos: clave canónica "t1║t2" → nombre de var fresca.
  const table = new Map<string, string>();
  // Sustituciones de salida: para cada fresh var, qué término iba en
  // cada lado.
  const substLeft = new Map<string, Term>();
  const substRight = new Map<string, Term>();
  // Orden de introducción de las fresh vars (para `variables`).
  const variables: string[] = [];

  const generalization = antiUnifyAux(t1, t2, table, substLeft, substRight, variables, supply);

  return { generalization, substLeft, substRight, variables };
}

/**
 * Núcleo recursivo del algoritmo. Se mantiene recursivo (no iterativo)
 * porque la mayoría de términos en la práctica son superficiales y la
 * recursión sigue la estructura del término más pequeño.
 *
 * Si en algún momento aparecen términos patológicamente profundos,
 * habría que reescribirlo con un stack explícito siguiendo el patrón
 * de `mapTerm` en term-rewriting/term-utils.ts.
 */
function antiUnifyAux(
  t1: Term,
  t2: Term,
  table: Map<string, string>,
  substLeft: Map<string, Term>,
  substRight: Map<string, Term>,
  variables: string[],
  supply: FreshSupply,
): Term {
  // Caso base: estructuralmente iguales → la generalización es el
  // término mismo, sin nuevas variables.
  if (termEquals(t1, t2)) return t1;

  // Misma "cabeza" (mismo símbolo, misma aridad, mismo kind func/const)
  // → recursamos argumento a argumento.
  if (sameHead(t1, t2)) {
    const args1 = t1.args ?? [];
    const args2 = t2.args ?? [];
    // sameHead garantiza aridad igual.
    const newArgs: Term[] = new Array<Term>(args1.length);
    for (let i = 0; i < args1.length; i++) {
      const a1 = args1[i];
      const a2 = args2[i];
      if (a1 === undefined || a2 === undefined) {
        // Imposible si sameHead pasó, pero el chequeo apacigua a TS
        // bajo noUncheckedIndexedAccess.
        throw new Error('antiUnify: aridad inconsistente tras sameHead check');
      }
      newArgs[i] = antiUnifyAux(a1, a2, table, substLeft, substRight, variables, supply);
    }
    if (t1.kind === 'const') {
      // const con args=[] ya cayó en termEquals; si llegamos aquí con
      // kind=const es porque ambos tienen mismo nombre y 0 args, lo
      // que ya implicaría termEquals=true. Defensa por si llega un
      // const con args>0 mal construido.
      return { kind: 'const', name: t1.name };
    }
    return { kind: 'func', name: t1.name, args: newArgs };
  }

  // Desacuerdo: pares distintos. Reutilizamos la fresh var si ya
  // habíamos visto este par; de lo contrario generamos una nueva.
  const key = pairKey(t1, t2);
  const existing = table.get(key);
  if (existing !== undefined) {
    return { kind: 'var', name: existing };
  }
  const fresh = supply();
  table.set(key, fresh);
  substLeft.set(fresh, t1);
  substRight.set(fresh, t2);
  variables.push(fresh);
  return { kind: 'var', name: fresh };
}

/**
 * ¿t1 y t2 comparten la misma "cabeza" (símbolo + aridad + kind no-var)?
 *
 * Variables NUNCA tienen cabeza común con otra cosa: el caso `var, var`
 * con mismos nombres ya lo absorbe `termEquals` arriba; con nombres
 * distintos es un desacuerdo legítimo. Un `var` contra `func/const`
 * también es desacuerdo (la variable es más general).
 */
function sameHead(t1: Term, t2: Term): boolean {
  if (t1.kind === 'var' || t2.kind === 'var') return false;
  // Tratamos const como func(name, []) para comparar aridad.
  if (t1.name !== t2.name) return false;
  const a1 = t1.args ?? [];
  const a2 = t2.args ?? [];
  if (a1.length !== a2.length) return false;
  // Si los kinds difieren (func vs const) pero la aridad es 0 y los
  // nombres coinciden, todavía lo aceptamos como "misma cabeza" para
  // ser tolerantes con clientes que mezclen ambas convenciones.
  // Pero antes de aceptar, exigimos que si difieren los kinds, la
  // aridad sea 0 — un `const` con args no debería existir.
  if (t1.kind !== t2.kind && a1.length > 0) return false;
  return true;
}

/**
 * Clave canónica para un par (t1, t2) usada en la tabla de
 * desacuerdos. Usamos un separador que no puede aparecer en
 * `termKey` para evitar colisiones.
 */
function pairKey(t1: Term, t2: Term): string {
  return `${termKey(t1)}║${termKey(t2)}`;
}
