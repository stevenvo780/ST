// ============================================================
// ST Parser — Parsing de formulas con precedencia
// ============================================================
//
// Precedencia (de menor a mayor):
//   1. <-> (bicondicional)
//   2. -> (implicacion, asocia a la derecha)
//   3. | / xor / nor (disyuncion)
//   4. U (until temporal, entre disyuncion y conjuncion)
//   5. & / nand (conjuncion)
//   6. comparacion (<, >, <=, >=)
//   7. aditiva (+ -)
//   8. multiplicativa (* / %)
//   9. unario (! -unario [] <> forall exists X)
//  10. postfix (indexacion [...])
//  11. primary (atomos, parens, predicados, fn calls)

import { TokenType } from '../lexer/tokens';
import { Formula } from '../types';
import { ParserState } from './state';

// Modal aliases por perfil: mapea nombres de identifier a tipos modales
export const MODAL_ALIASES: Record<string, Record<string, 'box' | 'diamond' | 'box_not'>> = {
  'deontic.standard': { O: 'box', P: 'diamond', F: 'box_not' },
  'epistemic.s5': { K: 'box', B: 'diamond' },
  'temporal.ltl': { G: 'box', F: 'diamond' },
  'modal.k': { Box: 'box', Dia: 'diamond' },
  'modal.s4': { Box: 'box', Dia: 'diamond' },
  'modal.s5': { Box: 'box', Dia: 'diamond' },
  'modal.t': { Box: 'box', Dia: 'diamond' },
};

export function parseFormula(s: ParserState): Formula {
  return parseBiconditional(s);
}

function parseBiconditional(s: ParserState): Formula {
  let left = parseImplication(s);
  while (s.match(TokenType.BICONDITIONAL)) {
    const right = parseImplication(s);
    left = { kind: 'biconditional', args: [left, right], source: s.loc() };
  }
  return left;
}

function parseImplication(s: ParserState): Formula {
  const left = parseDisjunction(s);
  if (s.match(TokenType.ARROW)) {
    // Asociatividad a la derecha
    const right = parseImplication(s);
    return { kind: 'implies', args: [left, right], source: s.loc() };
  }
  return left;
}

function parseDisjunction(s: ParserState): Formula {
  let left = parseUntil(s);
  let firstKind: 'or' | 'xor' | 'nor' | null = null;
  while (s.match(TokenType.OR) || s.match(TokenType.XOR) || s.match(TokenType.NOR)) {
    const type = s.previous().type;
    const currentKind: 'or' | 'xor' | 'nor' =
      type === TokenType.OR ? 'or' : type === TokenType.XOR ? 'xor' : 'nor';
    if (firstKind !== null && firstKind !== currentKind) {
      const tok = s.previous();
      s.diagnostics.push({
        severity: 'warning',
        message: `Mezcla de conectivos ${firstKind}/${currentKind} al mismo nivel de precedencia; asociación izquierda aplicada — usar paréntesis para desambiguar`,
        file: s.file,
        line: tok.line,
        column: tok.column,
      });
    }
    firstKind = firstKind ?? currentKind;
    const right = parseUntil(s);
    left = { kind: currentKind, args: [left, right], source: s.loc() };
  }
  return left;
}

function parseUntil(s: ParserState): Formula {
  let left = parseConjunction(s);
  while (s.match(TokenType.UNTIL)) {
    const right = parseConjunction(s);
    left = { kind: 'temporal_until', args: [left, right], source: s.loc() };
  }
  return left;
}

function parseConjunction(s: ParserState): Formula {
  let left = parseComparison(s);
  let firstKind: 'and' | 'nand' | null = null;
  while (s.match(TokenType.AND) || s.match(TokenType.NAND)) {
    const type = s.previous().type;
    const currentKind: 'and' | 'nand' = type === TokenType.AND ? 'and' : 'nand';
    if (firstKind !== null && firstKind !== currentKind) {
      const tok = s.previous();
      s.diagnostics.push({
        severity: 'warning',
        message: `Mezcla de conectivos ${firstKind}/${currentKind} al mismo nivel de precedencia; asociación izquierda aplicada — usar paréntesis para desambiguar`,
        file: s.file,
        line: tok.line,
        column: tok.column,
      });
    }
    firstKind = firstKind ?? currentKind;
    const right = parseComparison(s);
    left = { kind: currentKind, args: [left, right], source: s.loc() };
  }
  return left;
}

// --- Arithmetic precedence ---

function parseComparison(s: ParserState): Formula {
  let left = parseAdditive(s);
  while (
    s.checkType(TokenType.LT) ||
    s.checkType(TokenType.GT) ||
    s.checkType(TokenType.LTE) ||
    s.checkType(TokenType.GTE)
  ) {
    if (s.match(TokenType.LT)) {
      const right = parseAdditive(s);
      left = { kind: 'less', args: [left, right], source: s.loc() };
    } else if (s.match(TokenType.GT)) {
      const right = parseAdditive(s);
      left = { kind: 'greater', args: [left, right], source: s.loc() };
    } else if (s.match(TokenType.LTE)) {
      const right = parseAdditive(s);
      left = { kind: 'less_eq', args: [left, right], source: s.loc() };
    } else if (s.match(TokenType.GTE)) {
      const right = parseAdditive(s);
      left = { kind: 'greater_eq', args: [left, right], source: s.loc() };
    }
  }
  return left;
}

function parseAdditive(s: ParserState): Formula {
  let left = parseMultiplicative(s);
  while (s.checkType(TokenType.PLUS) || s.checkType(TokenType.MINUS)) {
    if (s.match(TokenType.PLUS)) {
      const right = parseMultiplicative(s);
      left = { kind: 'add', args: [left, right], source: s.loc() };
    } else if (s.match(TokenType.MINUS)) {
      const right = parseMultiplicative(s);
      left = { kind: 'subtract', args: [left, right], source: s.loc() };
    }
  }
  return left;
}

function parseMultiplicative(s: ParserState): Formula {
  let left = parseUnary(s);
  while (
    s.checkType(TokenType.STAR) ||
    s.checkType(TokenType.SLASH) ||
    s.checkType(TokenType.PERCENT)
  ) {
    if (s.match(TokenType.STAR)) {
      const right = parseUnary(s);
      left = { kind: 'multiply', args: [left, right], source: s.loc() };
    } else if (s.match(TokenType.SLASH)) {
      const right = parseUnary(s);
      left = { kind: 'divide', args: [left, right], source: s.loc() };
    } else if (s.match(TokenType.PERCENT)) {
      const right = parseUnary(s);
      left = { kind: 'modulo', args: [left, right], source: s.loc() };
    }
  }
  return left;
}

function parseUnary(s: ParserState): Formula {
  // Acumula operadores unarios iterativamente para no recursar por cada nivel
  // (evita stack overflow en formulas con 500+ niveles de NOT/paren anidados).
  // Cada wrapper recibe el operando y devuelve el nuevo nodo Formula.
  type UnaryWrapper = (operand: Formula) => Formula;
  const wrappers: UnaryWrapper[] = [];

  while (true) {
    if (s.match(TokenType.MINUS)) {
      const src = s.loc();
      wrappers.push((operand) => ({
        kind: 'subtract',
        args: [{ kind: 'number', value: 0, source: src }, operand],
        source: src,
      }));
      continue;
    }
    if (s.match(TokenType.NOT)) {
      const src = s.loc();
      wrappers.push((operand) => ({ kind: 'not', args: [operand], source: src }));
      continue;
    }
    if (s.match(TokenType.BOX)) {
      const src = s.loc();
      wrappers.push((operand) => ({ kind: 'modal_necessity', args: [operand], source: src }));
      continue;
    }
    if (s.match(TokenType.DIAMOND)) {
      const src = s.loc();
      wrappers.push((operand) => ({ kind: 'modal_possibility', args: [operand], source: src }));
      continue;
    }
    if (s.match(TokenType.FORALL)) {
      const variable = s.expectIdent();
      const src = s.loc();
      wrappers.push((operand) => ({ kind: 'forall', variable, args: [operand], source: src }));
      continue;
    }
    if (s.match(TokenType.EXISTS)) {
      const variable = s.expectIdent();
      const src = s.loc();
      wrappers.push((operand) => ({ kind: 'exists', variable, args: [operand], source: src }));
      continue;
    }
    if (s.match(TokenType.NEXT)) {
      const src = s.loc();
      wrappers.push((operand) => ({ kind: 'temporal_next', args: [operand], source: src }));
      continue;
    }
    break;
  }

  let result = parsePostfix(s);
  // Aplica wrappers de adentro hacia afuera (orden inverso al de adquisicion)
  for (let i = wrappers.length - 1; i >= 0; i--) {
    result = wrappers[i](result);
  }
  return result;
}

function parsePostfix(s: ParserState): Formula {
  let expr = parsePrimary(s);

  while (s.match(TokenType.LBRACKET)) {
    const index = parseFormula(s);
    s.expect(TokenType.RBRACKET);
    expr = {
      kind: 'fn_call',
      name: 'at',
      args: [expr, index],
      source: expr.source ?? index.source ?? s.loc(),
    };
  }

  return expr;
}

function parsePrimary(s: ParserState): Formula {
  // Constantes lógicas ⊤/⊥ (true/false/verdadero/falso)
  if (s.checkType(TokenType.TRUE_CONST)) {
    const tok = s.current();
    s.advance();
    return { kind: 'true', source: { line: tok.line, column: tok.column } };
  }
  if (s.checkType(TokenType.FALSE_CONST)) {
    const tok = s.current();
    s.advance();
    return { kind: 'false', source: { line: tok.line, column: tok.column } };
  }

  // Literal numérico
  if (s.checkType(TokenType.NUMBER)) {
    const tok = s.current();
    s.advance();
    return {
      kind: 'number',
      value: parseFloat(tok.value),
      source: { line: tok.line, column: tok.column },
    };
  }

  if (s.match(TokenType.LBRACKET)) {
    const items: Formula[] = [];
    if (!s.checkType(TokenType.RBRACKET)) {
      items.push(parseFormula(s));
      while (s.match(TokenType.COMMA)) {
        items.push(parseFormula(s));
      }
    }
    s.expect(TokenType.RBRACKET);
    return {
      kind: 'list',
      args: items,
      source: s.loc(),
    };
  }

  // Literal de texto (String)
  if (s.checkType(TokenType.STRING)) {
    const tok = s.current();
    s.advance();
    return {
      kind: 'atom',
      name: `"${tok.value}"`,
      source: { line: tok.line, column: tok.column },
    };
  }

  // Paréntesis
  if (s.match(TokenType.LPAREN)) {
    const inner = parseFormula(s);
    s.expect(TokenType.RPAREN);
    return inner;
  }

  // Dot notation con keyword como prefijo: Logic.mp, Theory.axiom, etc.
  if (
    s.checkType(TokenType.DOT) === false &&
    s.current().type !== TokenType.IDENTIFIER &&
    s.current().type !== TokenType.NEWLINE &&
    s.current().type !== TokenType.EOF &&
    s.peek(1) === TokenType.DOT &&
    s.peek(2) === TokenType.IDENTIFIER
  ) {
    const tok = s.current();
    s.advance(); // consumir keyword
    s.advance(); // consumir DOT
    const memberTok = s.current();
    s.advance(); // consumir IDENTIFIER
    return {
      kind: 'atom',
      name: `${tok.value}.${memberTok.value}`,
      source: { line: tok.line, column: tok.column },
    };
  }

  // Predicado o Atomo proposicional
  if (s.checkType(TokenType.IDENTIFIER)) {
    const tok = s.current();
    s.advance();

    // Notación con punto: Theory.member (acceso calificado)
    if (s.checkType(TokenType.DOT) && s.peek(1) === TokenType.IDENTIFIER) {
      s.advance(); // consumir DOT
      const memberTok = s.current();
      s.advance(); // consumir IDENTIFIER
      return {
        kind: 'atom',
        name: `${tok.value}.${memberTok.value}`,
        source: { line: tok.line, column: tok.column },
      };
    }

    if (s.match(TokenType.LPAREN)) {
      // Modal alias check: e.g. K(P) in epistemic, O(P) in deontic
      const profileAliases = MODAL_ALIASES[s.currentProfile];
      const aliasType = profileAliases?.[tok.value];
      if (aliasType) {
        const inner = parseFormula(s);
        s.expect(TokenType.RPAREN);
        if (aliasType === 'box') {
          return {
            kind: 'modal_necessity',
            args: [inner],
            source: { line: tok.line, column: tok.column },
          };
        } else if (aliasType === 'diamond') {
          return {
            kind: 'modal_possibility',
            args: [inner],
            source: { line: tok.line, column: tok.column },
          };
        } else {
          // box_not: e.g. deontic F(φ) = □(¬φ)
          return {
            kind: 'modal_necessity',
            args: [
              { kind: 'not', args: [inner], source: { line: tok.line, column: tok.column } },
            ],
            source: { line: tok.line, column: tok.column },
          };
        }
      }

      // Podría ser un predicado P(x, y) o una llamada a función fn(arg1, arg2)
      if (s.knownFunctionNames.has(tok.value) || s.knownTheoryNames.has(tok.value)) {
        const args: Formula[] = [];
        if (!s.checkType(TokenType.RPAREN)) {
          args.push(parseFormula(s));
          while (s.match(TokenType.COMMA)) {
            args.push(parseFormula(s));
          }
        }
        s.expect(TokenType.RPAREN);
        return {
          kind: 'fn_call',
          name: tok.value,
          args,
          source: { line: tok.line, column: tok.column },
        };
      }

      // Predicado: P(x, y, ...)
      const args: Formula[] = [];
      if (!s.checkType(TokenType.RPAREN)) {
        args.push(parseFormula(s));
        while (s.match(TokenType.COMMA)) {
          args.push(parseFormula(s));
        }
      }
      s.expect(TokenType.RPAREN);

      const paramStrings = args.map((a) => formulaToString(a));
      const predFormula: Formula = {
        kind: 'predicate',
        name: tok.value,
        params: paramStrings,
        source: { line: tok.line, column: tok.column },
      };

      // FOL igualdad: P(x) = Q(y)
      if (s.checkType(TokenType.EQUALS)) {
        s.advance();
        const right = parsePrimary(s);
        return {
          kind: 'equals',
          args: [predFormula, right],
          source: { line: tok.line, column: tok.column },
        };
      }
      return predFormula;
    }

    // FOL igualdad: x = y
    if (s.checkType(TokenType.EQUALS)) {
      s.advance();
      const rightTok = s.current();
      if (s.checkType(TokenType.IDENTIFIER)) {
        s.advance();
        const left: Formula = {
          kind: 'atom',
          name: tok.value,
          source: { line: tok.line, column: tok.column },
        };
        const right: Formula = {
          kind: 'atom',
          name: rightTok.value,
          source: { line: rightTok.line, column: rightTok.column },
        };
        return {
          kind: 'equals',
          args: [left, right],
          source: { line: tok.line, column: tok.column },
        };
      }
      // Si no es un identificador, backtrack — el = pertenece al statement
      s.pos--;
    }
    return { kind: 'atom', name: tok.value, source: { line: tok.line, column: tok.column } };
  }

  throw new Error(
    `Se esperaba formula en linea ${s.current().line}, columna ${s.current().column}, ` +
      `encontrado: '${s.current().value}' (${s.current().type})`,
  );
}

// --- Helpers de presentacion de formula ---

function collectAssociativeArgs(f: Formula, kind: 'and' | 'or' | 'xor'): Formula[] {
  if (f.kind !== kind || !f.args?.length) return [f];
  const items: Formula[] = [];
  for (const arg of f.args) {
    if (!arg) continue;
    items.push(...collectAssociativeArgs(arg, kind));
  }
  return items;
}

export function formulaToString(f: Formula): string {
  const arg0 = f.args?.[0];
  const arg1 = f.args?.[1];

  switch (f.kind) {
    case 'atom':
      return f.name || '?';
    case 'list':
      return `[${(f.args ?? []).map((a) => formulaToString(a)).join(', ')}]`;
    case 'number':
      return f.value !== undefined ? String(f.value) : '?';
    case 'not':
      return arg0 ? `!${formulaToString(arg0)}` : '!?';
    case 'modal_necessity':
      return arg0 ? `[]${formulaToString(arg0)}` : '[]?';
    case 'modal_possibility':
      return arg0 ? `<>${formulaToString(arg0)}` : '<>?';
    case 'forall':
      return arg0 ? `forall ${f.variable} ${formulaToString(arg0)}` : `forall ${f.variable} ?`;
    case 'exists':
      return arg0 ? `exists ${f.variable} ${formulaToString(arg0)}` : `exists ${f.variable} ?`;
    case 'predicate': {
      const params = f.params || [];
      return `${f.name || '?'}(${params.join(', ')})`;
    }
    case 'and':
      return arg0 && arg1
        ? `(${collectAssociativeArgs(f, 'and')
            .map((a) => formulaToString(a))
            .join(' & ')})`
        : '(? & ?)';
    case 'or':
      return arg0 && arg1
        ? `(${collectAssociativeArgs(f, 'or')
            .map((a) => formulaToString(a))
            .join(' | ')})`
        : '(? | ?)';
    case 'nand':
      return arg0 && arg1 ? `(${formulaToString(arg0)} ↑ ${formulaToString(arg1)})` : '(? ↑ ?)';
    case 'nor':
      return arg0 && arg1 ? `(${formulaToString(arg0)} ↓ ${formulaToString(arg1)})` : '(? ↓ ?)';
    case 'xor':
      return arg0 && arg1
        ? `(${collectAssociativeArgs(f, 'xor')
            .map((a) => formulaToString(a))
            .join(' ⊕ ')})`
        : '(? ⊕ ?)';
    case 'implies':
      return arg0 && arg1 ? `(${formulaToString(arg0)} -> ${formulaToString(arg1)})` : '(? -> ?)';
    case 'biconditional':
      return arg0 && arg1 ? `(${formulaToString(arg0)} <-> ${formulaToString(arg1)})` : '(? <-> ?)';
    case 'equals':
      return arg0 && arg1 ? `(${formulaToString(arg0)} = ${formulaToString(arg1)})` : '(? = ?)';
    case 'temporal_next':
      return arg0 ? `X(${formulaToString(arg0)})` : 'X(?)';
    case 'temporal_until':
      return arg0 && arg1 ? `(${formulaToString(arg0)} U ${formulaToString(arg1)})` : '(? U ?)';
    case 'fn_call':
      return `${f.name || '?'}(${(f.args ?? []).map((a) => formulaToString(a)).join(', ')})`;
    default:
      return '?';
  }
}

// --- Helper expuesto: parseIdList (usado por derive/prove y futuras) ---

export function parseIdList(s: ParserState): string[] {
  s.expect(TokenType.LBRACE);
  const ids: string[] = [];
  if (!s.checkType(TokenType.RBRACE)) {
    ids.push(s.expectIdent());
    while (s.match(TokenType.COMMA)) {
      ids.push(s.expectIdent());
    }
  }
  s.expect(TokenType.RBRACE);
  return ids;
}
