// ============================================================
// ST Editor Protocol — Handler
// ============================================================

import {
  ProtocolRequest,
  ProtocolResponse,
  Diagnostic,
  SymbolInfo,
  HoverInfo,
  CompletionItem,
  RunResult,
  SourceLocation,
} from '../types';
import { Parser } from '../parser/parser';
import { Interpreter } from '../runtime/interpreter';
import { Program, Statement } from '../ast/nodes';
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
      default:
        return {
          id: request.id,
          error: { code: -1, message: `Metodo desconocido: ${request.method}` },
        };
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
    const column = request.params.column as number;
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
      if ('name' in stmt && (stmt as any).name === name) {
        return { id: request.id, result: stmt.source };
      }
    }

    return { id: request.id, result: null };
  }

  private handleCompletion(request: ProtocolRequest): ProtocolResponse {
    const items: CompletionItem[] = [
      { label: 'logic', kind: 'keyword', detail: 'Declarar perfil logico', insertText: 'logic ' },
      {
        label: 'axiom',
        kind: 'keyword',
        detail: 'Declarar axioma',
        insertText: 'axiom ${1:name} = ${2:formula}',
      },
      {
        label: 'theorem',
        kind: 'keyword',
        detail: 'Declarar teorema',
        insertText: 'theorem ${1:name} = ${2:formula}',
      },
      {
        label: 'derive',
        kind: 'keyword',
        detail: 'Derivar formula',
        insertText: 'derive ${1:formula} from {${2:premises}}',
      },
      {
        label: 'check valid',
        kind: 'keyword',
        detail: 'Verificar validez',
        insertText: 'check valid ${1:formula}',
      },
      {
        label: 'check satisfiable',
        kind: 'keyword',
        detail: 'Verificar satisfacibilidad',
        insertText: 'check satisfiable ${1:formula}',
      },
      {
        label: 'prove',
        kind: 'keyword',
        detail: 'Probar formula',
        insertText: 'prove ${1:formula} from {${2:premises}}',
      },
      {
        label: 'countermodel',
        kind: 'keyword',
        detail: 'Buscar contramodelo',
        insertText: 'countermodel ${1:formula}',
      },
      {
        label: 'truth_table',
        kind: 'keyword',
        detail: 'Tabla de verdad',
        insertText: 'truth_table ${1:formula}',
      },
      {
        label: 'let',
        kind: 'keyword',
        detail: 'Declarar variable',
        insertText: 'let ${1:name} = ',
      },
      {
        label: 'passage',
        kind: 'keyword',
        detail: 'Declarar pasaje',
        insertText: 'passage([[${1:path}]])',
      },
      {
        label: 'formalize',
        kind: 'keyword',
        detail: 'Formalizar pasaje',
        insertText: 'formalize ${1:passage} as ${2:formula}',
      },
      {
        label: 'claim',
        kind: 'keyword',
        detail: 'Declarar claim',
        insertText: 'claim ${1:name} = ${2:value}',
      },
      {
        label: 'support',
        kind: 'keyword',
        detail: 'Registrar soporte',
        insertText: 'support ${1:claim} <- ${2:source}',
      },
      {
        label: 'confidence',
        kind: 'keyword',
        detail: 'Registrar confianza',
        insertText: 'confidence ${1:claim} = ${2:value}',
      },
      {
        label: 'context',
        kind: 'keyword',
        detail: 'Registrar contexto',
        insertText: 'context ${1:claim} = "${2:text}"',
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

  private renderOutput(output: any, format: string): string {
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
