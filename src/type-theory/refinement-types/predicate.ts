// ============================================================
// Refinement types — Parser y evaluador de predicados
// ============================================================
//
// Los predicados se escriben como cadenas: "x > 0 && x < 100".
// Aquí va un parser recursivo-descendente minimalista y un
// evaluador sobre un entorno de variables. La gramática soportada:
//
//   expr   := or
//   or     := and ('||' and)*
//   and    := cmp ('&&' cmp)*
//   cmp    := add (op add)?      op ∈ { <, <=, >, >=, ==, != }
//   add    := mul (('+'|'-') mul)*
//   mul    := unary (('*'|'/') unary)*
//   unary  := '!' unary | '-' unary | atom
//   atom   := number | bool | ident | '(' expr ')'
//
// El módulo no pretende cubrir aritmética completa: alcanza para
// los predicados típicos de un sistema didáctico (rangos, igualdades).

export type PExpr =
  | { kind: 'num'; value: number }
  | { kind: 'bool'; value: boolean }
  | { kind: 'str'; value: string }
  | { kind: 'var'; name: string }
  | { kind: 'unop'; op: '!' | '-'; arg: PExpr }
  | {
      kind: 'binop';
      op: '+' | '-' | '*' | '/' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||';
      left: PExpr;
      right: PExpr;
    };

// ---------- Lexer ----------

type Token =
  | { type: 'num'; value: number }
  | { type: 'bool'; value: boolean }
  | { type: 'str'; value: string }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'eof' };

function tokenize(input: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const s = input;
  while (i < s.length) {
    const c = s[i] ?? '';
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if (c === '(') {
      out.push({ type: 'lparen' });
      i++;
      continue;
    }
    if (c === ')') {
      out.push({ type: 'rparen' });
      i++;
      continue;
    }
    // string literal
    if (c === '"') {
      let j = i + 1;
      let buf = '';
      while (j < s.length && s[j] !== '"') {
        buf += s[j];
        j++;
      }
      out.push({ type: 'str', value: buf });
      i = j + 1;
      continue;
    }
    // multichar operators
    const two = s.slice(i, i + 2);
    if (['<=', '>=', '==', '!=', '&&', '||'].includes(two)) {
      out.push({ type: 'op', value: two });
      i += 2;
      continue;
    }
    if ('+-*/<>!'.includes(c)) {
      out.push({ type: 'op', value: c });
      i++;
      continue;
    }
    // number
    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < s.length) {
        const ch = s[j] ?? '';
        if (!((ch >= '0' && ch <= '9') || ch === '.')) break;
        j++;
      }
      out.push({ type: 'num', value: Number(s.slice(i, j)) });
      i = j;
      continue;
    }
    // ident / keyword
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
      let j = i;
      while (j < s.length) {
        const ch = s[j] ?? '';
        if (
          !(
            (ch >= 'a' && ch <= 'z') ||
            (ch >= 'A' && ch <= 'Z') ||
            (ch >= '0' && ch <= '9') ||
            ch === '_'
          )
        )
          break;
        j++;
      }
      const word = s.slice(i, j);
      if (word === 'true') out.push({ type: 'bool', value: true });
      else if (word === 'false') out.push({ type: 'bool', value: false });
      else out.push({ type: 'ident', value: word });
      i = j;
      continue;
    }
    throw new Error(`predicate lexer: caracter inesperado "${c}" en posición ${i}`);
  }
  out.push({ type: 'eof' });
  return out;
}

// ---------- Parser ----------

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: 'eof' };
  }
  private next(): Token {
    const t = this.tokens[this.pos] ?? { type: 'eof' };
    this.pos++;
    return t;
  }

  parseExpr(): PExpr {
    const e = this.parseOr();
    if (this.peek().type !== 'eof') {
      throw new Error('predicate parser: tokens sobrantes');
    }
    return e;
  }

  private parseOr(): PExpr {
    let left = this.parseAnd();
    while (this.peek().type === 'op' && (this.peek() as { value: string }).value === '||') {
      this.next();
      const right = this.parseAnd();
      left = { kind: 'binop', op: '||', left, right };
    }
    return left;
  }

  private parseAnd(): PExpr {
    let left = this.parseCmp();
    while (this.peek().type === 'op' && (this.peek() as { value: string }).value === '&&') {
      this.next();
      const right = this.parseCmp();
      left = { kind: 'binop', op: '&&', left, right };
    }
    return left;
  }

  private parseCmp(): PExpr {
    const left = this.parseAdd();
    const t = this.peek();
    if (t.type === 'op' && ['<', '<=', '>', '>=', '==', '!='].includes(t.value)) {
      this.next();
      const right = this.parseAdd();
      return {
        kind: 'binop',
        op: t.value as '<' | '<=' | '>' | '>=' | '==' | '!=',
        left,
        right,
      };
    }
    return left;
  }

  private parseAdd(): PExpr {
    let left = this.parseMul();
    while (
      this.peek().type === 'op' &&
      ['+', '-'].includes((this.peek() as { value: string }).value)
    ) {
      const op = (this.next() as { value: string }).value as '+' | '-';
      const right = this.parseMul();
      left = { kind: 'binop', op, left, right };
    }
    return left;
  }

  private parseMul(): PExpr {
    let left = this.parseUnary();
    while (
      this.peek().type === 'op' &&
      ['*', '/'].includes((this.peek() as { value: string }).value)
    ) {
      const op = (this.next() as { value: string }).value as '*' | '/';
      const right = this.parseUnary();
      left = { kind: 'binop', op, left, right };
    }
    return left;
  }

  private parseUnary(): PExpr {
    const t = this.peek();
    if (t.type === 'op' && (t.value === '!' || t.value === '-')) {
      this.next();
      const arg = this.parseUnary();
      return { kind: 'unop', op: t.value, arg };
    }
    return this.parseAtom();
  }

  private parseAtom(): PExpr {
    const t = this.next();
    if (t.type === 'num') return { kind: 'num', value: t.value };
    if (t.type === 'bool') return { kind: 'bool', value: t.value };
    if (t.type === 'str') return { kind: 'str', value: t.value };
    if (t.type === 'ident') return { kind: 'var', name: t.value };
    if (t.type === 'lparen') {
      const e = this.parseOr();
      const close = this.next();
      if (close.type !== 'rparen') throw new Error('predicate parser: falta ")"');
      return e;
    }
    throw new Error(`predicate parser: token inesperado ${JSON.stringify(t)}`);
  }
}

const PARSE_CACHE = new Map<string, PExpr>();

export function parsePredicate(src: string): PExpr {
  const trimmed = (src ?? '').trim();
  if (trimmed === '' || trimmed === 'true') return { kind: 'bool', value: true };
  if (trimmed === 'false') return { kind: 'bool', value: false };
  const cached = PARSE_CACHE.get(trimmed);
  if (cached) return cached;
  const expr = new Parser(tokenize(trimmed)).parseExpr();
  PARSE_CACHE.set(trimmed, expr);
  return expr;
}

// ---------- Free variables ----------

export function freeVars(e: PExpr, acc: Set<string> = new Set()): Set<string> {
  switch (e.kind) {
    case 'num':
    case 'bool':
    case 'str':
      return acc;
    case 'var':
      acc.add(e.name);
      return acc;
    case 'unop':
      return freeVars(e.arg, acc);
    case 'binop':
      freeVars(e.left, acc);
      freeVars(e.right, acc);
      return acc;
  }
}

// ---------- Substitution (rename var → expr) ----------

export function substVar(e: PExpr, name: string, replacement: PExpr): PExpr {
  switch (e.kind) {
    case 'num':
    case 'bool':
    case 'str':
      return e;
    case 'var':
      return e.name === name ? replacement : e;
    case 'unop':
      return { kind: 'unop', op: e.op, arg: substVar(e.arg, name, replacement) };
    case 'binop':
      return {
        kind: 'binop',
        op: e.op,
        left: substVar(e.left, name, replacement),
        right: substVar(e.right, name, replacement),
      };
  }
}

export function renameVar(predicate: string, fromName: string, toName: string): string {
  if (fromName === toName) return predicate;
  const ast = parsePredicate(predicate);
  const renamed = substVar(ast, fromName, { kind: 'var', name: toName });
  return predicateToString(renamed);
}

// ---------- Pretty-print de la AST a cadena canónica ----------

export function predicateToString(e: PExpr): string {
  switch (e.kind) {
    case 'num':
      return String(e.value);
    case 'bool':
      return e.value ? 'true' : 'false';
    case 'str':
      return JSON.stringify(e.value);
    case 'var':
      return e.name;
    case 'unop':
      return `${e.op}(${predicateToString(e.arg)})`;
    case 'binop':
      return `(${predicateToString(e.left)} ${e.op} ${predicateToString(e.right)})`;
  }
}

// ---------- Evaluador concreto en un entorno ----------

export type PValue = number | boolean | string;
export type PEnv = Record<string, PValue>;

export function evalPredicate(e: PExpr, env: PEnv): PValue {
  switch (e.kind) {
    case 'num':
      return e.value;
    case 'bool':
      return e.value;
    case 'str':
      return e.value;
    case 'var':
      if (!(e.name in env)) {
        throw new Error(`evalPredicate: variable libre "${e.name}" no está en el entorno`);
      }
      return env[e.name];
    case 'unop': {
      const v = evalPredicate(e.arg, env);
      if (e.op === '!') {
        if (typeof v !== 'boolean') throw new Error('evalPredicate: ! aplicado a no-booleano');
        return !v;
      }
      // op === '-'
      if (typeof v !== 'number') throw new Error('evalPredicate: - aplicado a no-número');
      return -v;
    }
    case 'binop': {
      const l = evalPredicate(e.left, env);
      const r = evalPredicate(e.right, env);
      switch (e.op) {
        case '+':
          if (typeof l === 'number' && typeof r === 'number') return l + r;
          if (typeof l === 'string' && typeof r === 'string') return l + r;
          throw new Error('evalPredicate: + sólo entre dos números o dos strings');
        case '-':
        case '*':
        case '/': {
          if (typeof l !== 'number' || typeof r !== 'number')
            throw new Error(`evalPredicate: ${e.op} sólo entre números`);
          if (e.op === '-') return l - r;
          if (e.op === '*') return l * r;
          if (r === 0) throw new Error('evalPredicate: división por cero');
          return l / r;
        }
        case '<':
        case '<=':
        case '>':
        case '>=':
          if (typeof l !== 'number' || typeof r !== 'number')
            throw new Error(`evalPredicate: ${e.op} requiere números`);
          if (e.op === '<') return l < r;
          if (e.op === '<=') return l <= r;
          if (e.op === '>') return l > r;
          return l >= r;
        case '==':
          return l === r;
        case '!=':
          return l !== r;
        case '&&':
          if (typeof l !== 'boolean' || typeof r !== 'boolean')
            throw new Error('evalPredicate: && requiere booleanos');
          return l && r;
        case '||':
          if (typeof l !== 'boolean' || typeof r !== 'boolean')
            throw new Error('evalPredicate: || requiere booleanos');
          return l || r;
      }
    }
  }
}
