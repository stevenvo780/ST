// ============================================================
// FCA — construcción del contexto y operadores polares de Galois.
// ============================================================
// Aquí viven las primitivas de bajo nivel: construir K = (G, M, I) y
// computar las dos derivaciones A → A' y B → B' que sustentan toda la
// teoría (definición de concepto, clausura, implicación).
//
// Notación interna: codificamos un par (g, m) ∈ I como la cadena
// "g|m". El delimitador '|' es seguro porque obligamos que ningún
// identificador lo contenga (createContext lo valida); de lo contrario
// usaríamos un Map<string, Set<string>>.
// ============================================================

import type { FormalContext } from './types';

const SEP = '|';

function encode(obj: string, attr: string): string {
  return `${obj}${SEP}${attr}`;
}

/**
 * Construye un contexto formal a partir de listas de objetos, atributos y
 * la lista bruta de incidencias.
 *
 * Valida:
 *  - Los identificadores no pueden contener el separador '|'.
 *  - No se admiten objetos o atributos duplicados.
 *  - Cada incidencia [g, m] debe referirse a objetos/atributos declarados.
 */
export function createContext(
  objects: string[],
  attributes: string[],
  incidence: Array<[string, string]>,
): FormalContext {
  const objSet = new Set<string>();
  for (const o of objects) {
    if (o.includes(SEP)) {
      throw new Error(`createContext: objeto "${o}" contiene el separador reservado "${SEP}"`);
    }
    if (objSet.has(o)) {
      throw new Error(`createContext: objeto duplicado "${o}"`);
    }
    objSet.add(o);
  }
  const attrSet = new Set<string>();
  for (const a of attributes) {
    if (a.includes(SEP)) {
      throw new Error(`createContext: atributo "${a}" contiene el separador reservado "${SEP}"`);
    }
    if (attrSet.has(a)) {
      throw new Error(`createContext: atributo duplicado "${a}"`);
    }
    attrSet.add(a);
  }

  const inc = new Set<string>();
  for (const [g, m] of incidence) {
    if (!objSet.has(g)) {
      throw new Error(`createContext: incidencia refiere objeto desconocido "${g}"`);
    }
    if (!attrSet.has(m)) {
      throw new Error(`createContext: incidencia refiere atributo desconocido "${m}"`);
    }
    inc.add(encode(g, m));
  }

  return {
    objects: [...objects],
    attributes: [...attributes],
    incidence: inc,
  };
}

/**
 * Indica si el objeto `g` tiene el atributo `m` en el contexto.
 * O(1) gracias a la representación como Set de pares codificados.
 */
export function hasIncidence(ctx: FormalContext, g: string, m: string): boolean {
  return ctx.incidence.has(encode(g, m));
}

/**
 * Operador polar B → B'  (atributos → objetos).
 * Devuelve el conjunto de objetos que poseen TODOS los atributos de `attrs`.
 * Si `attrs` es vacío, el resultado es G (convención: ∀ trivialmente cierto).
 */
export function derivativeObjects(ctx: FormalContext, attrs: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const g of ctx.objects) {
    let ok = true;
    for (const m of attrs) {
      if (!hasIncidence(ctx, g, m)) {
        ok = false;
        break;
      }
    }
    if (ok) out.add(g);
  }
  return out;
}

/**
 * Operador polar A → A'  (objetos → atributos).
 * Devuelve los atributos compartidos por TODOS los objetos de `objs`.
 * Si `objs` es vacío, el resultado es M.
 */
export function derivativeAttributes(ctx: FormalContext, objs: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const m of ctx.attributes) {
    let ok = true;
    for (const g of objs) {
      if (!hasIncidence(ctx, g, m)) {
        ok = false;
        break;
      }
    }
    if (ok) out.add(m);
  }
  return out;
}

/**
 * Verifica si (extent, intent) es un concepto formal en `ctx`:
 *   extent' = intent  y  intent' = extent.
 *
 * Equivale a verificar la doble clausura, pero se computa directo desde la
 * relación de incidencia, sin acumular intermedios.
 */
export function isConcept(ctx: FormalContext, extent: Set<string>, intent: Set<string>): boolean {
  const intentFromExtent = derivativeAttributes(ctx, extent);
  const extentFromIntent = derivativeObjects(ctx, intent);
  return setsEqual(intentFromExtent, intent) && setsEqual(extentFromIntent, extent);
}

/**
 * Clausura de Galois sobre intents:  B → B'' = (B')'.
 * Idempotente: closeIntent(closeIntent(B)) = closeIntent(B).
 */
export function closeIntent(ctx: FormalContext, intent: Set<string>): Set<string> {
  return derivativeAttributes(ctx, derivativeObjects(ctx, intent));
}

/**
 * Clausura sobre extents:  A → A'' = (A')'.
 */
export function closeExtent(ctx: FormalContext, extent: Set<string>): Set<string> {
  return derivativeObjects(ctx, derivativeAttributes(ctx, extent));
}

// ----------------------------------------------------------------
// helpers
// ----------------------------------------------------------------

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}
