// ============================================================
// Markov Logic — Mini parser FOL (sin cuantificadores explícitos)
// ============================================================
//
// Gramática soportada (las variables libres se cuantifican
// universalmente al groundear):
//
//   formula  := implication
//   implication := disjunction ('→' | '->' disjunction)*   (right-assoc)
//   disjunction := conjunction ('∨' | '|' | '||' conjunction)*
//   conjunction := unary ('∧' | '&' | '&&' unary)*
//   unary       := ('¬' | '!') unary | atom
//   atom        := '(' formula ')' | predicate
//   predicate   := Ident '(' arg (',' arg)* ')'
//   arg         := Ident
//
// Convención de variables/constantes:
//   - identificadores en minúscula → variables (lower-cased first char)
//   - identificadores en mayúscula → constantes
//
// Esta gramática alcanza para Smoking, Friends, transitividad, etc.
// No soporta cuantificadores explícitos `∀ ∃`; la cuantificación es
// implícitamente universal sobre todas las variables libres.

export type FOLNode =
  | { kind: 'atom'; predicate: string; args: string[] }
  | { kind: 'not'; arg: FOLNode }
  | { kind: 'and'; left: FOLNode; right: FOLNode }
  | { kind: 'or'; left: FOLNode; right: FOLNode }
  | { kind: 'implies'; left: FOLNode; right: FOLNode };

export function parseFOL(input: string): FOLNode {
  const tokens = tokenize(input);
  const parser = new Parser(tokens, input);
  const node = parser.parseImplication();
  parser.expectEOF();
  return node;
}

/** Devuelve las variables libres (lowercase) que aparecen en `node`. */
export function freeVariables(node: FOLNode): string[] {
  const out = new Set<string>();
  walk(node, out);
  return Array.from(out).sort();
}

function walk(node: FOLNode, acc: Set<string>): void {
  switch (node.kind) {
    case 'atom':
      for (const a of node.args) if (isVariable(a)) acc.add(a);
      return;
    case 'not':
      walk(node.arg, acc);
      return;
    case 'and':
    case 'or':
    case 'implies':
      walk(node.left, acc);
      walk(node.right, acc);
      return;
  }
}

export function isVariable(name: string): boolean {
  if (name.length === 0) return false;
  const c = name.charCodeAt(0);
  // 'a'..'z' → variable
  return c >= 97 && c <= 122;
}

// ── Tokenizer ─────────────────────────────────────────────────

type TokKind = 'IDENT' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'NOT' | 'AND' | 'OR' | 'IMPLIES' | 'EOF';

interface Tok {
  kind: TokKind;
  text: string;
  pos: number;
}

function tokenize(input: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (c === undefined) break;
    // whitespace
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    // single chars
    if (c === '(') {
      out.push({ kind: 'LPAREN', text: c, pos: i });
      i++;
      continue;
    }
    if (c === ')') {
      out.push({ kind: 'RPAREN', text: c, pos: i });
      i++;
      continue;
    }
    if (c === ',') {
      out.push({ kind: 'COMMA', text: c, pos: i });
      i++;
      continue;
    }
    if (c === '¬' || c === '!' || c === '~') {
      out.push({ kind: 'NOT', text: c, pos: i });
      i++;
      continue;
    }
    if (c === '∧') {
      out.push({ kind: 'AND', text: c, pos: i });
      i++;
      continue;
    }
    if (c === '&') {
      // accept "&" or "&&"
      let text = '&';
      i++;
      if (input[i] === '&') {
        text = '&&';
        i++;
      }
      out.push({ kind: 'AND', text, pos: i });
      continue;
    }
    if (c === '∨') {
      out.push({ kind: 'OR', text: c, pos: i });
      i++;
      continue;
    }
    if (c === '|') {
      let text = '|';
      i++;
      if (input[i] === '|') {
        text = '||';
        i++;
      }
      out.push({ kind: 'OR', text, pos: i });
      continue;
    }
    if (c === '→') {
      out.push({ kind: 'IMPLIES', text: c, pos: i });
      i++;
      continue;
    }
    if (c === '-') {
      if (input[i + 1] === '>') {
        out.push({ kind: 'IMPLIES', text: '->', pos: i });
        i += 2;
        continue;
      }
      throw new Error(`Carácter inesperado '-' en posición ${i}`);
    }
    // identifier: [A-Za-z_][A-Za-z0-9_]*
    if (isIdentStart(c)) {
      const start = i;
      i++;
      while (i < n) {
        const ch = input[i];
        if (ch !== undefined && isIdentCont(ch)) i++;
        else break;
      }
      out.push({ kind: 'IDENT', text: input.slice(start, i), pos: start });
      continue;
    }
    throw new Error(`Carácter inesperado '${c}' en posición ${i}`);
  }
  out.push({ kind: 'EOF', text: '', pos: n });
  return out;
}

function isIdentStart(c: string): boolean {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
}

function isIdentCont(c: string): boolean {
  return isIdentStart(c) || (c >= '0' && c <= '9');
}

// ── Recursive-descent parser ──────────────────────────────────

class Parser {
  private idx = 0;
  constructor(
    private readonly tokens: Tok[],
    private readonly src: string,
  ) {}

  private peek(): Tok {
    const t = this.tokens[this.idx];
    if (!t) throw new Error('Fin de tokens inesperado');
    return t;
  }

  private consume(): Tok {
    const t = this.peek();
    this.idx++;
    return t;
  }

  private expect(kind: TokKind): Tok {
    const t = this.peek();
    if (t.kind !== kind) {
      throw new Error(
        `Esperaba ${kind} en posición ${t.pos}, encontré ${t.kind} ('${t.text}'). Fórmula: "${this.src}"`,
      );
    }
    return this.consume();
  }

  expectEOF(): void {
    const t = this.peek();
    if (t.kind !== 'EOF') {
      throw new Error(`Tokens sobrantes desde posición ${t.pos} en fórmula: "${this.src}"`);
    }
  }

  // implication is right-associative: A → B → C ≡ A → (B → C)
  parseImplication(): FOLNode {
    const left = this.parseDisjunction();
    if (this.peek().kind === 'IMPLIES') {
      this.consume();
      const right = this.parseImplication();
      return { kind: 'implies', left, right };
    }
    return left;
  }

  private parseDisjunction(): FOLNode {
    let left = this.parseConjunction();
    while (this.peek().kind === 'OR') {
      this.consume();
      const right = this.parseConjunction();
      left = { kind: 'or', left, right };
    }
    return left;
  }

  private parseConjunction(): FOLNode {
    let left = this.parseUnary();
    while (this.peek().kind === 'AND') {
      this.consume();
      const right = this.parseUnary();
      left = { kind: 'and', left, right };
    }
    return left;
  }

  private parseUnary(): FOLNode {
    if (this.peek().kind === 'NOT') {
      this.consume();
      return { kind: 'not', arg: this.parseUnary() };
    }
    return this.parseAtom();
  }

  private parseAtom(): FOLNode {
    const t = this.peek();
    if (t.kind === 'LPAREN') {
      this.consume();
      const inner = this.parseImplication();
      this.expect('RPAREN');
      return inner;
    }
    if (t.kind === 'IDENT') {
      const pred = this.consume().text;
      this.expect('LPAREN');
      const args: string[] = [];
      // accept zero-arity gracefully: P()
      if (this.peek().kind !== 'RPAREN') {
        args.push(this.expect('IDENT').text);
        while (this.peek().kind === 'COMMA') {
          this.consume();
          args.push(this.expect('IDENT').text);
        }
      }
      this.expect('RPAREN');
      return { kind: 'atom', predicate: pred, args };
    }
    throw new Error(`Esperaba un átomo en posición ${t.pos}, encontré ${t.kind} ('${t.text}')`);
  }
}
