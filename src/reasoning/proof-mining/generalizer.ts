// ============================================================
// ST Proof Mining — Generalización de lemmas vía anti-unification
// ============================================================
//
// Después de extraer sub-trees con la misma forma estructural (la
// clave canónica los agrupa), queremos producir UN statement
// generalizado que represente al grupo.
//
// Ejemplo concreto:
//   - Proof A contiene sub-tree concluyendo  `P -> P`
//   - Proof B contiene sub-tree concluyendo  `Q -> Q`
//   - Proof C contiene sub-tree concluyendo  `R -> R`
// El statement generalizado debería ser `?x -> ?x` (reflexividad
// de la implicación, instancia del lemma “identity”).
//
// Para términos de primer orden (e.g. árboles AST), usamos el
// algoritmo de Plotkin del módulo runtime/anti-unification.
//
// Para strings (caso conclusión sin parser), aproximamos el lgg
// posicional: tokenizamos por whitespace + tokens-básicos, alineamos
// el array y reemplazamos los desacuerdos por placeholders fresh.
// Es una aproximación pragmática suficiente para conclusiones de
// fórmulas; quien quiera lgg sobre árboles AST puede ir directo a
// `antiUnifyMany` del runtime y feedearlo.

import { antiUnifyMany, defaultFreshSupply } from '../../runtime/anti-unification';
import type { Term, FreshSupply } from '../../runtime/anti-unification';

/**
 * Resultado de generalización: el statement (puede ser string con
 * placeholders fresh), el conteo de variables abstractas
 * introducidas y un flag de si la generalización es no-trivial
 * (e.g. produjo placeholders).
 */
export interface GeneralizationResult {
  statement: string;
  abstractionLevel: number;
  nonTrivial: boolean;
}

/**
 * Generaliza una lista de instancias concretas vía anti-unification
 * sobre términos. Útil cuando el caller ya parsea fórmulas a un AST
 * `Term`.
 */
export function generalizeTerms(instances: Term[], freshSupply?: FreshSupply): GeneralizationResult {
  if (instances.length === 0) {
    return { statement: '', abstractionLevel: 0, nonTrivial: false };
  }
  if (instances.length === 1) {
    const t = instances[0];
    if (t === undefined) {
      return { statement: '', abstractionLevel: 0, nonTrivial: false };
    }
    return { statement: termToReadable(t), abstractionLevel: 0, nonTrivial: false };
  }
  const supply = freshSupply ?? defaultFreshSupply('?');
  const result = antiUnifyMany(instances, supply);
  return {
    statement: termToReadable(result.generalization),
    abstractionLevel: result.variables.length,
    nonTrivial: result.variables.length > 0,
  };
}

/**
 * Render legible de un Term (compatible con la convención de
 * lemma-synthesis: var/const → name, func → name(args)).
 */
function termToReadable(t: Term): string {
  if (t.kind === 'var') return t.name;
  if (t.kind === 'const') return t.name;
  const args = t.args ?? [];
  if (args.length === 0) return t.name;
  // Operadores binarios infijos
  if (args.length === 2 && /^[+\-*/^∧∨↔→=<>≤≥&|]+$/.test(t.name)) {
    const a0 = args[0];
    const a1 = args[1];
    if (a0 === undefined || a1 === undefined) return t.name;
    return `(${termToReadable(a0)} ${t.name} ${termToReadable(a1)})`;
  }
  return `${t.name}(${args.map(termToReadable).join(', ')})`;
}

// ── Generalización por tokens (sin parsear AST) ─────────────────

/**
 * Tokeniza una fórmula para alineamiento posicional. Mantiene los
 * operadores como tokens propios.
 */
function tokenize(s: string): string[] {
  // Separa identificadores y operadores; ignora whitespace.
  const out: string[] = [];
  const re = /[A-Za-z_][A-Za-z0-9_]*|->|→|<->|↔|\(|\)|,|[¬∧∨∀∃⊤⊥=]|[^\sA-Za-z0-9_(),→↔¬∧∨∀∃⊤⊥=]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    out.push(m[0]);
  }
  return out;
}

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED = new Set([
  'not',
  'and',
  'or',
  'implies',
  'iff',
  'forall',
  'exists',
  'true',
  'false',
]);

/**
 * Generaliza una lista de fórmulas string. Tokeniza, alinea
 * posicionalmente, y donde haya desacuerdo introduce un placeholder
 * fresh. Si la tokenización produce arrays de distinta longitud, no
 * intenta align: devuelve el primer string y nonTrivial = false.
 *
 * Tabla de desacuerdos: si el mismo par (a, b) reaparece, recibe el
 * mismo placeholder (consistencia, propiedad LGG).
 *
 * Para igualar reservadas (operadores, paréntesis) en todas las
 * instancias, esas posiciones se mantienen literales. Solo los
 * tokens-identificador se generalizan.
 */
export function generalizeFormulas(instances: string[]): GeneralizationResult {
  if (instances.length === 0) {
    return { statement: '', abstractionLevel: 0, nonTrivial: false };
  }
  if (instances.length === 1) {
    const s = instances[0];
    return { statement: s ?? '', abstractionLevel: 0, nonTrivial: false };
  }

  const tokenized = instances.map(tokenize);
  const len = tokenized[0]?.length ?? 0;
  for (const t of tokenized) {
    if (t.length !== len) {
      // No alineable: caemos al canonical string como aproximación.
      return {
        statement: instances[0] ?? '',
        abstractionLevel: 0,
        nonTrivial: false,
      };
    }
  }

  // Tabla de desacuerdos: clave = tupla de tokens en cada lado en
  // esa posición. Usamos JSON.stringify para clave estable.
  const table = new Map<string, string>();
  let freshCounter = 0;
  const fresh = () => `?${freshCounter++}`;
  const variables: string[] = [];

  const outTokens: string[] = [];
  for (let i = 0; i < len; i++) {
    const slice = tokenized.map((t) => t[i] ?? '');
    const allEqual = slice.every((tok) => tok === slice[0]);
    if (allEqual) {
      outTokens.push(slice[0] ?? '');
      continue;
    }
    // Solo abstraemos posiciones identificadoras (no operadores).
    const allIdent = slice.every((tok) => IDENT_RE.test(tok) && !RESERVED.has(tok));
    if (!allIdent) {
      // Desacuerdo en operador o palabra reservada → no alineable.
      return {
        statement: instances[0] ?? '',
        abstractionLevel: 0,
        nonTrivial: false,
      };
    }
    const key = JSON.stringify(slice);
    let v = table.get(key);
    if (v === undefined) {
      v = fresh();
      table.set(key, v);
      variables.push(v);
    }
    outTokens.push(v);
  }

  return {
    statement: outTokens.join(' '),
    abstractionLevel: variables.length,
    nonTrivial: variables.length > 0,
  };
}

/**
 * Generaliza un grupo (lista de strings de conclusión, repetida
 * tantas veces como instancias haya), opcionalmente capeando el
 * abstractionLevel máximo.
 *
 * Si `preserveSemantic` está activo y la generalización no es
 * instanciable de vuelta para cubrir todas las instancias, devuelve
 * el literal de la primera instancia con abstractionLevel = 0.
 */
export function generalizeLemma(
  conclusions: string[],
  options?: { maxAbstractionLevel?: number; preserveSemantic?: boolean },
): GeneralizationResult {
  const max = options?.maxAbstractionLevel ?? 3;
  const preserve = options?.preserveSemantic ?? true;
  const result = generalizeFormulas(conclusions);
  if (result.abstractionLevel > max) {
    // Si abstrajimos demasiado, retornamos el literal.
    return {
      statement: conclusions[0] ?? '',
      abstractionLevel: 0,
      nonTrivial: false,
    };
  }
  if (preserve && result.nonTrivial) {
    // Sanity check: verificar que el pattern instanciado en cada
    // posición produce las conclusiones originales. Por construcción
    // del algoritmo posicional, esto siempre se cumple si todos los
    // tokens-identificador coinciden con los slots. Hacemos chequeo
    // explícito para defender contra cambios futuros.
    if (!verifyPatternCoversAll(result.statement, conclusions)) {
      return {
        statement: conclusions[0] ?? '',
        abstractionLevel: 0,
        nonTrivial: false,
      };
    }
  }
  return result;
}

/**
 * Verifica que el pattern (con placeholders `?0`, `?1`, …) sea
 * instanciable para todas las conclusiones del grupo. Es un check
 * defensivo: para el algoritmo posicional, esto siempre se cumple
 * por construcción.
 */
function verifyPatternCoversAll(pattern: string, conclusions: string[]): boolean {
  const patTokens = tokenize(pattern);
  for (const c of conclusions) {
    const cTokens = tokenize(c);
    if (cTokens.length !== patTokens.length) return false;
    const bindings = new Map<string, string>();
    for (let i = 0; i < patTokens.length; i++) {
      const p = patTokens[i] ?? '';
      const cc = cTokens[i] ?? '';
      if (p.startsWith('?')) {
        const prev = bindings.get(p);
        if (prev === undefined) {
          bindings.set(p, cc);
        } else if (prev !== cc) {
          return false;
        }
      } else if (p !== cc) {
        return false;
      }
    }
  }
  return true;
}
