// ============================================================
// π-calculus — congruencia estructural ≡.
// ============================================================
// Axiomas estándar:
//   P | 0 ≡ P                    (nil unitario de |)
//   P | Q ≡ Q | P                (conmutatividad de |)
//   (P | Q) | R ≡ P | (Q | R)    (asociatividad de |)
//   P + 0 ≡ P
//   P + Q ≡ Q + P
//   (P + Q) + R ≡ P + (Q + R)
//   (νc)(νd) P ≡ (νd)(νc) P      (intercambio de scopes)
//   (νc) 0 ≡ 0                   (canal vacío sin uso)
//   (νc) (P | Q) ≡ P | (νc) Q    si c ∉ fn(P)   (scope extrusion)
//   !P ≡ P | !P                  (unfold de replicación, lo dejamos como opcional)
//   α-conversion sobre binders
//
// Implementación: normalizamos ambos procesos a una "forma canónica"
// (flatten de paralelas y sumas + ordenamiento estructural + drop de
// `0` unitarios) y luego comparamos por igualdad sintáctica módulo
// α-renaming sobre binders.
//
// No es decisión completa de ≡ (la equivalencia es indecidible en
// general en presencia de replicación), pero cubre los axiomas
// básicos suficientes para los tests y propiedades esperadas.
// ============================================================

import type { PiProcess } from './types';
import { alphaRename, freeNames, freshName } from './names';

/**
 * Normaliza un proceso a forma canónica para comparar ≡.
 *
 *  - Aplana `parallel` y `choice` asociativos en listas, descarta `0`s.
 *  - Ordena las listas con un orden estructural total y reconstruye en
 *    forma asociativa derecha canónica.
 *  - Refresca nombres ligados a una secuencia determinista
 *    (`#bn0`, `#bn1`, ...) en post-orden para que α-equivalentes
 *    colapsen.
 */
function canonical(p: PiProcess, counter: { n: number }): PiProcess {
  // 1. α-normalizar binders en post-orden.
  const renamed = renameBindersCanonical(p, counter);
  // 2. flatten + sort + drop nil.
  return normalize(renamed);
}

function renameBindersCanonical(p: PiProcess, counter: { n: number }): PiProcess {
  switch (p.kind) {
    case 'nil':
      return p;
    case 'input': {
      const cont = renameBindersCanonical(p.cont, counter);
      const fresh = `#bn${counter.n++}`;
      const renamed = alphaRename(cont, p.bind, fresh);
      return { kind: 'input', channel: p.channel, bind: fresh, cont: renamed };
    }
    case 'output':
      return {
        kind: 'output',
        channel: p.channel,
        value: p.value,
        cont: renameBindersCanonical(p.cont, counter),
      };
    case 'parallel':
      return {
        kind: 'parallel',
        left: renameBindersCanonical(p.left, counter),
        right: renameBindersCanonical(p.right, counter),
      };
    case 'choice':
      return {
        kind: 'choice',
        left: renameBindersCanonical(p.left, counter),
        right: renameBindersCanonical(p.right, counter),
      };
    case 'new': {
      const body = renameBindersCanonical(p.body, counter);
      const fresh = `#bn${counter.n++}`;
      const renamed = alphaRename(body, p.channel, fresh);
      return { kind: 'new', channel: fresh, body: renamed };
    }
    case 'replication':
      return { kind: 'replication', body: renameBindersCanonical(p.body, counter) };
    case 'match':
      return {
        kind: 'match',
        left: p.left,
        right: p.right,
        cont: renameBindersCanonical(p.cont, counter),
      };
  }
}

function normalize(p: PiProcess): PiProcess {
  switch (p.kind) {
    case 'nil':
      return p;
    case 'input':
      return { kind: 'input', channel: p.channel, bind: p.bind, cont: normalize(p.cont) };
    case 'output':
      return {
        kind: 'output',
        channel: p.channel,
        value: p.value,
        cont: normalize(p.cont),
      };
    case 'parallel': {
      const parts = flattenParallel(p)
        .map(normalize)
        .filter((q) => q.kind !== 'nil');
      if (parts.length === 0) return { kind: 'nil' };
      if (parts.length === 1) return parts[0]!;
      parts.sort((a, b) => structKey(a).localeCompare(structKey(b)));
      return parts.reduceRight((acc, q) => ({ kind: 'parallel', left: q, right: acc }));
    }
    case 'choice': {
      const parts = flattenChoice(p)
        .map(normalize)
        .filter((q) => q.kind !== 'nil');
      if (parts.length === 0) return { kind: 'nil' };
      if (parts.length === 1) return parts[0]!;
      parts.sort((a, b) => structKey(a).localeCompare(structKey(b)));
      return parts.reduceRight((acc, q) => ({ kind: 'choice', left: q, right: acc }));
    }
    case 'new': {
      const body = normalize(p.body);
      // (νc) 0 ≡ 0
      if (body.kind === 'nil') return { kind: 'nil' };
      return { kind: 'new', channel: p.channel, body };
    }
    case 'replication':
      return { kind: 'replication', body: normalize(p.body) };
    case 'match':
      return {
        kind: 'match',
        left: p.left,
        right: p.right,
        cont: normalize(p.cont),
      };
  }
}

function flattenParallel(p: PiProcess): PiProcess[] {
  if (p.kind !== 'parallel') return [p];
  return [...flattenParallel(p.left), ...flattenParallel(p.right)];
}

function flattenChoice(p: PiProcess): PiProcess[] {
  if (p.kind !== 'choice') return [p];
  return [...flattenChoice(p.left), ...flattenChoice(p.right)];
}

/**
 * Serialización estructural estable para usar como clave de
 * ordenamiento. Determinista bajo igualdad sintáctica.
 */
function structKey(p: PiProcess): string {
  switch (p.kind) {
    case 'nil':
      return '0';
    case 'input':
      return `in(${p.channel},${p.bind},${structKey(p.cont)})`;
    case 'output':
      return `out(${p.channel},${p.value},${structKey(p.cont)})`;
    case 'parallel':
      return `par(${structKey(p.left)},${structKey(p.right)})`;
    case 'choice':
      return `sum(${structKey(p.left)},${structKey(p.right)})`;
    case 'new':
      return `new(${p.channel},${structKey(p.body)})`;
    case 'replication':
      return `rep(${structKey(p.body)})`;
    case 'match':
      return `mat(${p.left},${p.right},${structKey(p.cont)})`;
  }
}

/**
 * Decide si dos procesos son estructuralmente congruentes (módulo los
 * axiomas listados arriba + α-equivalencia).
 *
 * Cobertura intencional:
 *   - Conmutatividad/asociatividad/nil de | y +.
 *   - Renaming de binders.
 *   - `(νc) 0 ≡ 0`.
 * Cobertura intencionalmente limitada (excede el scope mínimo del runtime):
 *   - Scope extrusion `(νc)(P|Q) ≡ P | (νc) Q`.
 *   - Unfold de replicación.
 */
export function structuralCongruence(a: PiProcess, b: PiProcess): boolean {
  // Aplicamos scope extrusion repetidamente como pre-paso, después
  // normalizamos y comparamos por structKey.
  const A = canonical(extrudeScopes(a), { n: 0 });
  const B = canonical(extrudeScopes(b), { n: 0 });
  return structKey(A) === structKey(B);
}

/**
 * Aplica scope extrusion donde sea posible: `(νc)(P|Q) ≡ P | (νc) Q`
 * cuando `c ∉ fn(P)`. No es óptimo pero alcanza para los axiomas.
 */
function extrudeScopes(p: PiProcess): PiProcess {
  switch (p.kind) {
    case 'nil':
      return p;
    case 'input':
      return { kind: 'input', channel: p.channel, bind: p.bind, cont: extrudeScopes(p.cont) };
    case 'output':
      return {
        kind: 'output',
        channel: p.channel,
        value: p.value,
        cont: extrudeScopes(p.cont),
      };
    case 'parallel':
      return {
        kind: 'parallel',
        left: extrudeScopes(p.left),
        right: extrudeScopes(p.right),
      };
    case 'choice':
      return {
        kind: 'choice',
        left: extrudeScopes(p.left),
        right: extrudeScopes(p.right),
      };
    case 'new': {
      const body = extrudeScopes(p.body);
      if (body.kind === 'parallel') {
        const fnL = freeNames(body.left);
        const fnR = freeNames(body.right);
        const leftFree = !fnL.has(p.channel);
        const rightFree = !fnR.has(p.channel);
        if (leftFree && rightFree) {
          // Canal restringido pero no usado en ninguna rama: descártalo.
          return { kind: 'parallel', left: body.left, right: body.right };
        }
        if (leftFree) {
          // Empujar (νc) hacia la rama derecha.
          return {
            kind: 'parallel',
            left: body.left,
            right: extrudeScopes({ kind: 'new', channel: p.channel, body: body.right }),
          };
        }
        if (rightFree) {
          return {
            kind: 'parallel',
            left: extrudeScopes({ kind: 'new', channel: p.channel, body: body.left }),
            right: body.right,
          };
        }
      }
      // Caso especial: (νc) que liga un canal nunca usado en el cuerpo.
      if (!freeNames(body).has(p.channel)) {
        return body;
      }
      return { kind: 'new', channel: p.channel, body };
    }
    case 'replication':
      return { kind: 'replication', body: extrudeScopes(p.body) };
    case 'match':
      return {
        kind: 'match',
        left: p.left,
        right: p.right,
        cont: extrudeScopes(p.cont),
      };
  }
}
