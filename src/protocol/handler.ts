// ============================================================
// ST Editor Protocol — Handler
// ============================================================

import {
  ProtocolRequest,
  ProtocolResponse,
  SymbolInfo,
  HoverInfo,
  CompletionItem,
  ExecutionOutput,
} from '../types';
import { Parser } from '../parser/parser';
import { Interpreter } from '../runtime/interpreter';
import { Statement } from '../ast/nodes';
import { formulaToString } from '../profiles/classical/propositional';

export class ProtocolHandler {
  private interpreter: Interpreter;

  constructor() {
    this.interpreter = new Interpreter();
  }

  handle(request: ProtocolRequest): ProtocolResponse {
    switch (request.method) {
      case 'parse':
        return this.handleParse(request);
      case 'check':
        return this.handleCheck(request);
      case 'run':
        return this.handleRun(request);
      case 'hover':
        return this.handleHover(request);
      case 'symbols':
        return this.handleSymbols(request);
      case 'goto_definition':
        return this.handleGotoDefinition(request);
      case 'completion':
        return this.handleCompletion(request);
      case 'render':
        return this.handleRender(request);
      default: {
        const method = request.method;
        return {
          id: request.id,
          error: { code: -1, message: `Metodo desconocido: ${String(method)}` },
        };
      }
    }
  }

  private handleParse(request: ProtocolRequest): ProtocolResponse {
    const source = request.params.source as string;
    const file = (request.params.file as string) || '<stdin>';
    const parser = new Parser(file);
    const program = parser.parse(source);
    return {
      id: request.id,
      result: { statements: program.statements.length, file: program.file },
      diagnostics: parser.diagnostics,
    };
  }

  private handleCheck(request: ProtocolRequest): ProtocolResponse {
    const source = request.params.source as string;
    const file = (request.params.file as string) || '<stdin>';
    const parser = new Parser(file);
    const program = parser.parse(source);
    const diagnostics = [...parser.diagnostics];

    // Solo chequear sintaxis y bien-formación
    if (diagnostics.length === 0) {
      diagnostics.push({
        severity: 'info',
        message: `Archivo parseado correctamente: ${program.statements.length} statements`,
        file,
      });
    }

    return {
      id: request.id,
      result: { valid: diagnostics.filter((d) => d.severity === 'error').length === 0 },
      diagnostics,
    };
  }

  private handleRun(request: ProtocolRequest): ProtocolResponse {
    const source = request.params.source as string;
    const file = (request.params.file as string) || '<stdin>';
    const output = this.interpreter.execute(source, file);
    return {
      id: request.id,
      result: output,
      diagnostics: output.diagnostics,
    };
  }

  private handleHover(request: ProtocolRequest): ProtocolResponse {
    const source = request.params.source as string;
    const line = request.params.line as number;
    const file = (request.params.file as string) || '<stdin>';

    const parser = new Parser(file);
    const program = parser.parse(source);

    // Buscar statement en la posición
    for (const stmt of program.statements) {
      if (stmt.source.line === line) {
        const info = this.getStatementHoverInfo(stmt);
        if (info) {
          return { id: request.id, result: info };
        }
      }
    }

    return { id: request.id, result: null };
  }

  private handleSymbols(request: ProtocolRequest): ProtocolResponse {
    const source = request.params.source as string;
    const file = (request.params.file as string) || '<stdin>';
    const parser = new Parser(file);
    const program = parser.parse(source);

    const symbols: SymbolInfo[] = [];

    for (const stmt of program.statements) {
      switch (stmt.kind) {
        case 'axiom_decl':
          symbols.push({
            name: stmt.name,
            kind: 'axiom',
            location: stmt.source,
          });
          break;
        case 'theorem_decl':
          symbols.push({
            name: stmt.name,
            kind: 'theorem',
            location: stmt.source,
          });
          break;
        case 'claim_decl':
          symbols.push({
            name: stmt.name,
            kind: 'claim',
            location: stmt.source,
          });
          break;
        case 'let_decl':
          symbols.push({
            name: stmt.name,
            kind: stmt.letType === 'passage' ? 'passage' : 'formula',
            location: stmt.source,
          });
          break;
      }
    }

    return { id: request.id, result: symbols };
  }

  private handleGotoDefinition(request: ProtocolRequest): ProtocolResponse {
    const source = request.params.source as string;
    const name = request.params.name as string;
    const file = (request.params.file as string) || '<stdin>';
    const parser = new Parser(file);
    const program = parser.parse(source);

    for (const stmt of program.statements) {
      if ('name' in stmt && (stmt as { name: string }).name === name) {
        return { id: request.id, result: stmt.source };
      }
    }

    return { id: request.id, result: null };
  }

  private handleCompletion(request: ProtocolRequest): ProtocolResponse {
    const items: CompletionItem[] = [
      // ── Declaración de perfil lógico ────────────────────────────
      { label: 'logic', kind: 'keyword', detail: 'Declarar perfil lógico', insertText: 'logic ' },
      {
        label: 'logic classical.propositional',
        kind: 'value',
        detail: 'Lógica proposicional clásica (tablas de verdad + tableau)',
        insertText: 'logic classical.propositional',
      },
      {
        label: 'logic classical.first_order',
        kind: 'value',
        detail: 'Lógica de primer orden (∀, ∃, predicados)',
        insertText: 'logic classical.first_order',
      },
      {
        label: 'logic modal.k',
        kind: 'value',
        detail: 'Lógica modal K (□, ◇, mundos posibles)',
        insertText: 'logic modal.k',
      },
      {
        label: 'logic paraconsistent.belnap',
        kind: 'value',
        detail: 'Lógica paraconsistente Belnap (4 valores: T, F, B, N)',
        insertText: 'logic paraconsistent.belnap',
      },
      {
        label: 'logic deontic.standard',
        kind: 'value',
        detail: 'Lógica deóntica KD — obligación (O), permisión (P), prohibición (F)',
        insertText: 'logic deontic.standard',
      },
      {
        label: 'logic epistemic.s5',
        kind: 'value',
        detail: 'Lógica epistémica S5 — conocimiento (K), creencia (B)',
        insertText: 'logic epistemic.s5',
      },
      {
        label: 'logic intuitionistic.propositional',
        kind: 'value',
        detail: 'Lógica intuicionista (sin tercero excluido, traducción Gödel-McKinsey-Tarski)',
        insertText: 'logic intuitionistic.propositional',
      },
      {
        label: 'logic temporal.ltl',
        kind: 'value',
        detail: 'Lógica temporal lineal (LTL) — G(lobally), F(inally), X(next), U(ntil)',
        insertText: 'logic temporal.ltl',
      },
      {
        label: 'logic aristotelian.syllogistic',
        kind: 'value',
        detail: 'Silogística aristotélica — 24 formas válidas (Barbara, Celarent, etc.)',
        insertText: 'logic aristotelian.syllogistic',
      },
      {
        label: 'logic probabilistic.basic',
        kind: 'value',
        detail: 'Lógica probabilística — razonamiento con probabilidades [0,1]',
        insertText: 'logic probabilistic.basic',
      },

      // ── Declaraciones ───────────────────────────────────────────
      {
        label: 'axiom',
        kind: 'keyword',
        detail: 'Declarar axioma',
        insertText: 'axiom ${1:name} : ${2:formula}',
      },
      {
        label: 'theorem',
        kind: 'keyword',
        detail: 'Declarar teorema',
        insertText: 'theorem ${1:name} : ${2:formula}',
      },
      {
        label: 'let',
        kind: 'keyword',
        detail: 'Declarar variable/fórmula',
        insertText: 'let ${1:name} = ${2:expression}',
      },

      // ── Comandos lógicos ────────────────────────────────────────
      {
        label: 'derive',
        kind: 'keyword',
        detail: 'Derivar fórmula desde premisas',
        insertText: 'derive ${1:formula} from {${2:premises}}',
      },
      {
        label: 'check valid',
        kind: 'keyword',
        detail: 'Verificar validez (tautología)',
        insertText: 'check valid ${1:formula}',
      },
      {
        label: 'check satisfiable',
        kind: 'keyword',
        detail: 'Verificar satisfacibilidad',
        insertText: 'check satisfiable ${1:formula}',
      },
      {
        label: 'check equivalent',
        kind: 'keyword',
        detail: 'Verificar equivalencia lógica entre dos fórmulas',
        insertText: 'check equivalent ${1:formula1} ${2:formula2}',
      },
      {
        label: 'prove',
        kind: 'keyword',
        detail: 'Probar fórmula desde premisas',
        insertText: 'prove ${1:formula} from {${2:premises}}',
      },
      {
        label: 'countermodel',
        kind: 'keyword',
        detail: 'Buscar contramodelo (asignación que falsifica)',
        insertText: 'countermodel ${1:formula}',
      },
      {
        label: 'truth_table',
        kind: 'keyword',
        detail: 'Generar tabla de verdad completa',
        insertText: 'truth_table ${1:formula}',
      },
      {
        label: 'explain',
        kind: 'keyword',
        detail: 'Explicar fórmula paso a paso',
        insertText: 'explain ${1:formula}',
      },

      // ── Capa textual ────────────────────────────────────────────
      {
        label: 'passage',
        kind: 'keyword',
        detail: 'Declarar pasaje de texto',
        insertText: 'passage([[${1:path}]])',
      },
      {
        label: 'formalize',
        kind: 'keyword',
        detail: 'Formalizar pasaje como fórmula',
        insertText: 'formalize ${1:passage} as ${2:formula}',
      },
      {
        label: 'claim',
        kind: 'keyword',
        detail: 'Declarar claim (afirmación)',
        insertText: 'claim ${1:name} = ${2:value}',
      },
      {
        label: 'support',
        kind: 'keyword',
        detail: 'Registrar soporte para claim',
        insertText: 'support ${1:claim} <- ${2:source}',
      },
      {
        label: 'confidence',
        kind: 'keyword',
        detail: 'Asignar confianza a claim (0-1)',
        insertText: 'confidence ${1:claim} = ${2:value}',
      },
      {
        label: 'context',
        kind: 'keyword',
        detail: 'Registrar contexto de un claim',
        insertText: 'context ${1:claim} = "${2:text}"',
      },

      // ── Operadores modales (modal.k) ────────────────────────────
      {
        label: '[]',
        kind: 'operator',
        detail: 'Necesidad modal (□) — "necesariamente"',
        insertText: '[](${1:formula})',
      },
      {
        label: '<>',
        kind: 'operator',
        detail: 'Posibilidad modal (◇) — "posiblemente"',
        insertText: '<>(${1:formula})',
      },

      // ── Cuantificadores FOL (classical.first_order) ─────────────
      {
        label: 'forall',
        kind: 'operator',
        detail: 'Cuantificador universal (∀x)',
        insertText: 'forall ${1:x} (${2:formula})',
      },
      {
        label: 'exists',
        kind: 'operator',
        detail: 'Cuantificador existencial (∃x)',
        insertText: 'exists ${1:x} (${2:formula})',
      },

      // ── Operadores lógicos ──────────────────────────────────────
      {
        label: '->',
        kind: 'operator',
        detail: 'Implicación (→)',
        insertText: '${1:A} -> ${2:B}',
      },
      {
        label: '<->',
        kind: 'operator',
        detail: 'Bicondicional (↔)',
        insertText: '${1:A} <-> ${2:B}',
      },
      {
        label: '&',
        kind: 'operator',
        detail: 'Conjunción (∧)',
        insertText: '${1:A} & ${2:B}',
      },
      {
        label: '|',
        kind: 'operator',
        detail: 'Disyunción (∨)',
        insertText: '${1:A} | ${2:B}',
      },
      {
        label: '!',
        kind: 'operator',
        detail: 'Negación (¬)',
        insertText: '!${1:A}',
      },

      // ── Renderizado ─────────────────────────────────────────────
      {
        label: 'render',
        kind: 'keyword',
        detail: 'Renderizar salida en formato markdown/json',
        insertText: 'render',
      },

      // ── Operadores deónticos (deontic.standard) ─────────────────
      {
        label: '[] (obligación)',
        kind: 'operator',
        detail: 'O(φ) = Obligación — "es obligatorio que φ" (lógica deóntica)',
        insertText: '[](${1:formula})',
      },
      {
        label: '<> (permisión)',
        kind: 'operator',
        detail: 'P(φ) = Permisión — "está permitido que φ" (lógica deóntica)',
        insertText: '<>(${1:formula})',
      },
      {
        label: '[]! (prohibición)',
        kind: 'operator',
        detail: 'F(φ) = Prohibición — "está prohibido que φ" = O(¬φ)',
        insertText: '[](!${1:formula})',
      },

      // ── Operadores epistémicos (epistemic.s5) ──────────────────
      {
        label: '[] (conocimiento)',
        kind: 'operator',
        detail: 'K(φ) = Conocimiento — "se sabe que φ" (epistémica S5)',
        insertText: '[](${1:formula})',
      },
      {
        label: '<> (creencia)',
        kind: 'operator',
        detail: 'B(φ) = Creencia compatible — "es compatible con lo que se sabe" (epistémica S5)',
        insertText: '<>(${1:formula})',
      },

      // ── Operadores temporales (temporal.ltl) ────────────────────
      {
        label: '[] (Globally)',
        kind: 'operator',
        detail: 'G(φ) = Globally — "siempre φ" (LTL temporal)',
        insertText: '[](${1:formula})',
      },
      {
        label: '<> (Finally)',
        kind: 'operator',
        detail: 'F(φ) = Finally — "eventualmente φ" (LTL temporal)',
        insertText: '<>(${1:formula})',
      },
    ];

    return { id: request.id, result: items };
  }

  private handleRender(request: ProtocolRequest): ProtocolResponse {
    const source = request.params.source as string;
    const format = (request.params.format as string) || 'markdown';
    const file = (request.params.file as string) || '<stdin>';

    const output = this.interpreter.execute(source, file);
    const rendered = this.renderOutput(output, format);

    return {
      id: request.id,
      result: { rendered, format },
      diagnostics: output.diagnostics,
    };
  }

  private getStatementHoverInfo(stmt: Statement): HoverInfo | null {
    switch (stmt.kind) {
      case 'axiom_decl':
        return {
          content: `**Axioma** \`${stmt.name}\` = ${formulaToString(stmt.formula)}`,
          range: stmt.source,
        };
      case 'theorem_decl':
        return {
          content: `**Teorema** \`${stmt.name}\` = ${formulaToString(stmt.formula)}`,
          range: stmt.source,
        };
      case 'claim_decl':
        return { content: `**Claim** \`${stmt.name}\``, range: stmt.source };
      default:
        return null;
    }
  }

  private renderOutput(output: ExecutionOutput, format: string): string {
    if (format === 'json') {
      return JSON.stringify(output, null, 2);
    }

    // Default: markdown
    let md = '';
    if (output.stdout) {
      md += output.stdout;
    }
    if (output.diagnostics && output.diagnostics.length > 0) {
      md += '\n\n## Diagnosticos\n\n';
      for (const d of output.diagnostics) {
        md += `- **${d.severity}**: ${d.message}`;
        if (d.line) md += ` (linea ${d.line})`;
        md += '\n';
      }
    }
    return md;
  }
}
