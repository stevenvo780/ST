// ============================================================
// π-calculus — sustitución capture-avoiding P[x := v].
// ============================================================
// Reemplaza ocurrencias libres de `x` por `v` en P. Si `v` cae bajo un
// binder que lo capturaría (input o new que liga el mismo nombre `v`),
// se α-renombra el binder con un nombre fresco antes de descender.
// ============================================================

import type { PiProcess } from './types';
import { freeNames, alphaRename, freshName } from './names';

/**
 * Sustitución `p[x := v]` capture-avoiding.
 *
 *  - Si `x === v` o `x` no aparece libre, devuelve `p` sin cambios
 *    estructurales (pero retorna un AST nuevo solo donde fue necesario).
 *  - En binders (input, new) verifica que el nombre ligado no capture
 *    `v`: si lo hiciera, refresca el binder con `freshName`.
 */
export function substitute(p: PiProcess, x: string, v: string): PiProcess {
  if (x === v) return p;
  switch (p.kind) {
    case 'nil':
      return p;
    case 'input': {
      const newChannel = p.channel === x ? v : p.channel;
      // El binder atrapa `x`: el cuerpo no ve `x` libre, no hay que descender.
      if (p.bind === x) {
        return { kind: 'input', channel: newChannel, bind: p.bind, cont: p.cont };
      }
      // Capture: el binder es justo `v`. Refrescamos el binder.
      if (p.bind === v) {
        const avoid = new Set<string>();
        for (const n of freeNames(p.cont)) avoid.add(n);
        avoid.add(x);
        avoid.add(v);
        const fresh = freshName(p.bind, avoid);
        const renamed = alphaRename(p.cont, p.bind, fresh);
        return {
          kind: 'input',
          channel: newChannel,
          bind: fresh,
          cont: substitute(renamed, x, v),
        };
      }
      return {
        kind: 'input',
        channel: newChannel,
        bind: p.bind,
        cont: substitute(p.cont, x, v),
      };
    }
    case 'output':
      return {
        kind: 'output',
        channel: p.channel === x ? v : p.channel,
        value: p.value === x ? v : p.value,
        cont: substitute(p.cont, x, v),
      };
    case 'parallel':
      return {
        kind: 'parallel',
        left: substitute(p.left, x, v),
        right: substitute(p.right, x, v),
      };
    case 'choice':
      return {
        kind: 'choice',
        left: substitute(p.left, x, v),
        right: substitute(p.right, x, v),
      };
    case 'new': {
      if (p.channel === x) {
        return p;
      }
      if (p.channel === v) {
        const avoid = new Set<string>();
        for (const n of freeNames(p.body)) avoid.add(n);
        avoid.add(x);
        avoid.add(v);
        const fresh = freshName(p.channel, avoid);
        const renamed = alphaRename(p.body, p.channel, fresh);
        return {
          kind: 'new',
          channel: fresh,
          body: substitute(renamed, x, v),
        };
      }
      return {
        kind: 'new',
        channel: p.channel,
        body: substitute(p.body, x, v),
      };
    }
    case 'replication':
      return { kind: 'replication', body: substitute(p.body, x, v) };
    case 'match':
      return {
        kind: 'match',
        left: p.left === x ? v : p.left,
        right: p.right === x ? v : p.right,
        cont: substitute(p.cont, x, v),
      };
  }
}
