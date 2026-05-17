// ============================================================
// SMT-LIB v2 — Emitter
// ============================================================
//
// Produce texto SMT-LIB v2 a partir de un árbol `SmtCommand[]`. La salida
// está pensada para ser parseable por solvers reales (z3, cvc5, yices) y
// para round-trip estable (parse → emit → parse → emit = idempotente).
//
// Convenciones:
//   - paréntesis canónicos, espacio entre tokens.
//   - identificadores se citan con `|...|` si contienen caracteres no
//     simples (espacios, caracteres reservados, vacío, empieza con dígito).
//   - strings emiten escape doble-comilla (SMT-LIB v2.6 §3.1).
//   - hex/binary preservan los prefijos `#x` / `#b`.

import type { SmtCommand, SmtSort, SmtTerm } from './ast';

const SIMPLE_SYMBOL_FULL = /^[A-Za-z~!@$%^&*_\-+=<>.?/][A-Za-z0-9~!@$%^&*_\-+=<>.?/]*$/;

/** Cita un identificador si no es un simple-symbol válido. */
export function quoteSymbol(name: string): string {
  if (name.length === 0) return '||';
  if (SIMPLE_SYMBOL_FULL.test(name)) return name;
  // No se permite `|` ni `\` dentro de un pipe-quoted symbol (SMT-LIB v2.6).
  const safe = name.replace(/\|/g, '').replace(/\\/g, '');
  return `|${safe}|`;
}

function quoteString(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

/** Emite un sort SMT-LIB. */
export function emitSort(sort: SmtSort): string {
  if (sort.kind === 'symbol') return quoteSymbol(sort.name);
  // app
  if (sort.name.startsWith('_ ')) {
    // identificador indexado preservado por el parser
    const inner = sort.name.slice(2);
    if (sort.args.length === 0) {
      return `(_ ${quoteSymbol(inner)})`;
    }
    return `(_ ${quoteSymbol(inner)} ${sort.args.map((a) => emitIndexArg(a)).join(' ')})`;
  }
  if (sort.args.length === 0) {
    return `(${quoteSymbol(sort.name)})`;
  }
  return `(${quoteSymbol(sort.name)} ${sort.args.map(emitSort).join(' ')})`;
}

function emitIndexArg(s: SmtSort): string {
  if (s.kind === 'symbol') {
    // numeral o symbol; ambos van crudos
    if (/^[0-9]+$/.test(s.name)) return s.name;
    return quoteSymbol(s.name);
  }
  return emitSort(s);
}

/** Emite un término SMT-LIB. */
export function emitTerm(term: SmtTerm): string {
  switch (term.kind) {
    case 'spec-constant':
      switch (term.type) {
        case 'numeral':
        case 'decimal':
          return term.value;
        case 'hex':
          return `#x${term.value}`;
        case 'binary':
          return `#b${term.value}`;
        case 'string':
          return quoteString(term.value);
      }
      // exhaustive — fallback (TS no lo necesita pero mantiene shape)
      return JSON.stringify(term.value);
    case 'symbol':
      // si ya tiene forma indexada `(_ ...)`, no la requote
      if (term.name.startsWith('(') && term.name.endsWith(')')) return term.name;
      return quoteSymbol(term.name);
    case 'app': {
      // si fn fue preservado como s-expr completa (qualified ident), va literal
      const head = term.fn.startsWith('(') ? term.fn : quoteSymbol(term.fn);
      if (term.args.length === 0) return `(${head})`;
      return `(${head} ${term.args.map(emitTerm).join(' ')})`;
    }
    case 'let': {
      const bindings = term.bindings
        .map((b) => `(${quoteSymbol(b.name)} ${emitTerm(b.value)})`)
        .join(' ');
      return `(let (${bindings}) ${emitTerm(term.body)})`;
    }
    case 'forall':
    case 'exists': {
      const vars = term.vars.map((v) => `(${quoteSymbol(v.name)} ${emitSort(v.sort)})`).join(' ');
      return `(${term.kind} (${vars}) ${emitTerm(term.body)})`;
    }
    case 'match': {
      const cases = term.cases.map((c) => `(${emitTerm(c.pattern)} ${emitTerm(c.body)})`).join(' ');
      return `(match ${emitTerm(term.scrutinee)} (${cases}))`;
    }
    case 'annotated': {
      const attrs = term.attrs
        .map((a) => (a.value !== undefined ? `:${a.key} ${a.value}` : `:${a.key}`))
        .join(' ');
      return `(! ${emitTerm(term.term)} ${attrs})`;
    }
  }
}

/** Emite un único comando SMT-LIB. */
export function emitCommand(cmd: SmtCommand): string {
  switch (cmd.kind) {
    case 'set-logic':
      return `(set-logic ${quoteSymbol(cmd.logic)})`;
    case 'set-option':
      return `(set-option :${cmd.key} ${cmd.value})`;
    case 'set-info':
      return `(set-info :${cmd.key} ${cmd.value})`;
    case 'declare-sort':
      return `(declare-sort ${quoteSymbol(cmd.name)} ${cmd.arity})`;
    case 'define-sort':
      return `(define-sort ${quoteSymbol(cmd.name)} (${cmd.params.map(quoteSymbol).join(' ')}) ${emitSort(cmd.body)})`;
    case 'declare-fun': {
      const params = cmd.paramSorts.map(emitSort).join(' ');
      return `(declare-fun ${quoteSymbol(cmd.name)} (${params}) ${emitSort(cmd.resultSort)})`;
    }
    case 'define-fun': {
      const params = cmd.params
        .map((p) => `(${quoteSymbol(p.name)} ${emitSort(p.sort)})`)
        .join(' ');
      return `(define-fun ${quoteSymbol(cmd.name)} (${params}) ${emitSort(cmd.resultSort)} ${emitTerm(cmd.body)})`;
    }
    case 'declare-const':
      return `(declare-const ${quoteSymbol(cmd.name)} ${emitSort(cmd.sort)})`;
    case 'assert':
      return `(assert ${emitTerm(cmd.formula)})`;
    case 'check-sat':
      return `(check-sat)`;
    case 'check-sat-assuming':
      return `(check-sat-assuming (${cmd.assumptions.map(emitTerm).join(' ')}))`;
    case 'get-assertions':
      return `(get-assertions)`;
    case 'get-model':
      return `(get-model)`;
    case 'get-proof':
      return `(get-proof)`;
    case 'get-unsat-core':
      return `(get-unsat-core)`;
    case 'get-value':
      return `(get-value (${cmd.terms.map(emitTerm).join(' ')}))`;
    case 'push':
      return `(push ${cmd.levels})`;
    case 'pop':
      return `(pop ${cmd.levels})`;
    case 'reset':
      return `(reset)`;
    case 'reset-assertions':
      return `(reset-assertions)`;
    case 'exit':
      return `(exit)`;
    case 'echo':
      return `(echo ${quoteString(cmd.message)})`;
  }
}

/** Emite un script entero (1 comando por línea). */
export function emitSmtLib(commands: SmtCommand[]): string {
  return commands.map(emitCommand).join('\n');
}
