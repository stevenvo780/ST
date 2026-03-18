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
import { Statement, TheoryDeclNode } from '../ast/nodes';
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
    const column = request.params.column as number;
    const file = (request.params.file as string) || '<stdin>';

    const parser = new Parser(file);
    const program = parser.parse(source);

    // Recopilar todas las definiciones let del programa
    const letDefs: Map<string, { formula?: string; description?: string; line: number }> = new Map();
    const axiomDefs: Map<string, { formula: string; line: number }> = new Map();
    const theoremDefs: Map<string, { formula: string; line: number }> = new Map();

    for (const stmt of program.statements) {
      switch (stmt.kind) {
        case 'let_decl':
          if (stmt.letType === 'description') {
            letDefs.set(stmt.name, { description: stmt.description, line: stmt.source.line });
          } else if (stmt.letType === 'formula') {
            const desc = 'description' in stmt ? (stmt as { description?: string }).description : undefined;
            letDefs.set(stmt.name, { formula: formulaToString(stmt.formula), description: desc, line: stmt.source.line });
          } else if (stmt.letType === 'passage') {
            letDefs.set(stmt.name, { description: `passage([[${stmt.anchorPath}]])`, line: stmt.source.line });
          }
          break;
        case 'axiom_decl':
          axiomDefs.set(stmt.name, { formula: formulaToString(stmt.formula), line: stmt.source.line });
          break;
        case 'theorem_decl':
          theoremDefs.set(stmt.name, { formula: formulaToString(stmt.formula), line: stmt.source.line });
          break;
        case 'theory_decl':
          // Registrar miembros de la teoría como defs prefijados
          for (const member of stmt.members) {
            const ms = member.statement;
            const qPrefix = `${stmt.name}.`;
            if (ms.kind === 'let_decl') {
              if (ms.letType === 'description') {
                letDefs.set(qPrefix + ms.name, { description: ms.description, line: ms.source.line });
              } else if (ms.letType === 'formula') {
                const desc = 'description' in ms ? (ms as { description?: string }).description : undefined;
                letDefs.set(qPrefix + ms.name, { formula: formulaToString(ms.formula), description: desc, line: ms.source.line });
              }
            } else if (ms.kind === 'axiom_decl') {
              axiomDefs.set(qPrefix + ms.name, { formula: formulaToString(ms.formula), line: ms.source.line });
            } else if (ms.kind === 'theorem_decl') {
              theoremDefs.set(qPrefix + ms.name, { formula: formulaToString(ms.formula), line: ms.source.line });
            }
          }
          break;
      }
    }

    // Intentar encontrar la palabra en la posición del cursor
    if (column !== undefined) {
      const lines = source.split('\n');
      if (line >= 1 && line <= lines.length) {
        const lineText = lines[line - 1];
        const word = this.getWordAtColumn(lineText, column);
        if (word) {
          // Buscar en let definitions
          const letDef = letDefs.get(word);
          if (letDef) {
            let content = `**Let** \`${word}\``;
            if (letDef.description) content += `\n\n📝 *"${letDef.description}"*`;
            if (letDef.formula) content += `\n\n🔢 \`${letDef.formula}\``;
            return {
              id: request.id,
              result: { content, range: { line, column } } as HoverInfo,
            };
          }
          // Buscar en axiomas
          const axiomDef = axiomDefs.get(word);
          if (axiomDef) {
            const desc = letDefs.get(word)?.description;
            let content = `**Axioma** \`${word}\` = \`${axiomDef.formula}\``;
            if (desc) content += `\n\n📝 *"${desc}"*`;
            return {
              id: request.id,
              result: { content, range: { line, column } } as HoverInfo,
            };
          }
          // Buscar en teoremas
          const theoremDef = theoremDefs.get(word);
          if (theoremDef) {
            return {
              id: request.id,
              result: { content: `**Teorema** \`${word}\` = \`${theoremDef.formula}\``, range: { line, column } } as HoverInfo,
            };
          }

          const staticHover = this.getStaticHoverInfo(word);
          if (staticHover) {
            return {
              id: request.id,
              result: { content: staticHover, range: { line, column } } as HoverInfo,
            };
          }
        }
      }
    }

    // Fallback: hover a nivel de statement (línea)
    for (const stmt of program.statements) {
      if (stmt.source.line === line) {
        const info = this.getStatementHoverInfo(stmt, letDefs);
        if (info) {
          return { id: request.id, result: info };
        }
      }
    }

    return { id: request.id, result: null };
  }

  /** Extrae la palabra (identificador, con soporte dot notation) en la posición de columna dada */
  private getWordAtColumn(lineText: string, column: number): string | null {
    const col = column - 1; // 0-based
    if (col < 0 || col >= lineText.length) return null;
    // Encontrar inicio de la palabra (soporta puntos para dot notation)
    let start = col;
    while (start > 0 && /[a-zA-Z0-9_.]/.test(lineText[start - 1])) start--;
    // Encontrar fin de la palabra
    let end = col;
    while (end < lineText.length && /[a-zA-Z0-9_.]/.test(lineText[end])) end++;
    const word = lineText.substring(start, end);
    // Limpiar puntos al inicio/final
    const cleaned = word.replace(/^\.+|\.+$/g, '');
    return cleaned.length > 0 ? cleaned : null;
  }

  private getStaticHoverInfo(word: string): string | null {
    const lower = word.toLowerCase();
    const keywordInfo: Record<string, string> = {
      logic: '**logic**\n\nActiva el perfil lógico del script actual.\n\nEjemplo: `logic arithmetic`',
      axiom: '**axiom**\n\nDeclara una premisa o ley base disponible para derivaciones.\n\nEjemplo: `axiom regla : P -> Q`',
      theorem: '**theorem**\n\nDeclara un teorema nombrado dentro de una teoría o script.\n\nEjemplo: `theorem identidad : P -> P`',
      let: '**let**\n\nCrea un alias reutilizable para fórmulas, descripciones o pasajes.',
      derive: '**derive**\n\nIntenta derivar una conclusión a partir de premisas nombradas.\n\nEjemplo: `derive Q from {regla, hecho}`',
      check: '**check**\n\nEvalúa propiedades como validez, satisfacibilidad o equivalencia.',
      prove: '**prove**\n\nSolicita una demostración formal del objetivo.',
      countermodel: '**countermodel**\n\nBusca un modelo que haga falsa la fórmula dada.',
      truth_table: '**truth_table**\n\nGenera la tabla de verdad de una fórmula proposicional.',
      explain: '**explain**\n\nDevuelve una explicación del perfil o del juicio ejecutado.',
      analyze: '**analyze**\n\nAnaliza premisas y conclusión para detectar estructura inferencial o falacias.',
      import: '**import**\n\nImporta otro archivo `.st` dentro del script actual.',
      theory: '**theory**\n\nDefine un bloque reutilizable con miembros públicos y privados.\n\nEjemplo:\n```st\ntheory Algebra {\n  axiom neutral : x + 0 = x\n}\n```',
      extends: '**extends**\n\nPermite que una teoría herede miembros públicos de otra teoría.',
      private: '**private**\n\nMarca un miembro de teoría como interno y no accesible externamente.',
      print: '**print**\n\nImprime texto o fórmulas durante la ejecución.',
      set: '**set**\n\nReasigna el valor de una variable o alias en tiempo de ejecución.',
      if: '**if**\n\nEjecuta un bloque cuando una condición (`valid`, `satisfiable`, etc.) se cumple.',
      else: '**else**\n\nDefine la rama alternativa de un bloque condicional.',
      for: '**for**\n\nItera sobre una colección de fórmulas o valores.',
      in: '**in**\n\nIntroduce la colección usada por un bucle `for`.',
      while: '**while**\n\nRepite un bloque mientras una condición siga siendo verdadera.',
      fn: '**fn**\n\nDeclara una función con parámetros y posible retorno.',
      return: '**return**\n\nDevuelve un valor desde una función.',
      arithmetic: '**arithmetic**\n\nPerfil numérico para expresiones aritméticas, comparaciones y scripting ST.',
      '+': '**+**\n\nSuma dos expresiones numéricas.',
      '-': '**-**\n\nResta dos expresiones numéricas o expresa signo negativo.',
      '*': '**\\***\n\nMultiplica dos expresiones numéricas.',
      '/': '**/**\n\nDivide una expresión numérica por otra.',
      '%': '**%**\n\nCalcula el residuo de una división entera.',
      '<': '**<**\n\nCompara si el operando izquierdo es menor.',
      '>': '**>**\n\nCompara si el operando izquierdo es mayor.',
      '<=': '**<=**\n\nCompara si el operando izquierdo es menor o igual.',
      '>=': '**>=**\n\nCompara si el operando izquierdo es mayor o igual.',
      '≤': '**≤**\n\nVersión Unicode de `<=`.',
      '≥': '**≥**\n\nVersión Unicode de `>=`.'
    };

    const aliases: Record<string, string> = {
      logica: keywordInfo.logic,
      axioma: keywordInfo.axiom,
      teorema: keywordInfo.theorem,
      derivar: keywordInfo.derive,
      contramodelo: keywordInfo.countermodel,
      tabla_verdad: keywordInfo.truth_table,
      explicar: keywordInfo.explain,
      analizar: keywordInfo.analyze,
      importar: keywordInfo.import,
      teoria: keywordInfo.theory,
      extiende: keywordInfo.extends,
      privado: keywordInfo.private,
      imprimir: keywordInfo.print,
      asignar: keywordInfo.set,
      si: keywordInfo.if,
      sino: keywordInfo.else,
      para: keywordInfo.for,
      en: keywordInfo.in,
      mientras: keywordInfo.while,
      funcion: keywordInfo.fn,
      retornar: keywordInfo.return
    };

    const profileInfo: Record<string, string> = {
      'classical.propositional': '**classical.propositional**\n\nLógica proposicional clásica con tablas de verdad y tableaux.',
      'classical.first_order': '**classical.first_order**\n\nLógica de primer orden con cuantificadores, predicados e igualdad.',
      'modal.k': '**modal.k**\n\nLógica modal mínima con necesidad (`[]`) y posibilidad (`<>`).',
      'paraconsistent.belnap': '**paraconsistent.belnap**\n\nLógica paraconsistente de cuatro valores.',
      'deontic.standard': '**deontic.standard**\n\nLógica deóntica para obligación, permisión y prohibición.',
      'epistemic.s5': '**epistemic.s5**\n\nLógica epistémica del conocimiento en marcos S5.',
      'intuitionistic.propositional': '**intuitionistic.propositional**\n\nLógica constructiva sin tercero excluido general.',
      'temporal.ltl': '**temporal.ltl**\n\nLógica temporal lineal con `next` y `until`.',
      'aristotelian.syllogistic': '**aristotelian.syllogistic**\n\nSilogística categórica clásica.',
      'probabilistic.basic': '**probabilistic.basic**\n\nRazonamiento probabilístico básico.',
      arithmetic: keywordInfo.arithmetic,
    };

    return keywordInfo[word] ?? keywordInfo[lower] ?? aliases[lower] ?? profileInfo[word] ?? profileInfo[lower] ?? null;
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
            detail: formulaToString(stmt.formula),
            location: stmt.source,
          });
          break;
        case 'theorem_decl':
          symbols.push({
            name: stmt.name,
            kind: 'theorem',
            detail: formulaToString(stmt.formula),
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
            kind: stmt.letType === 'passage' ? 'passage' : stmt.letType === 'description' ? 'variable' : 'formula',
            description: stmt.letType === 'description' ? stmt.description : ('description' in stmt ? (stmt as { description?: string }).description : undefined),
            detail: stmt.letType === 'formula' ? formulaToString(stmt.formula) : stmt.letType === 'description' ? `"${stmt.description}"` : undefined,
            location: stmt.source,
          });
          break;
        case 'theory_decl': {
          // Agregar la teoría como símbolo
          const theoryStmt = stmt as TheoryDeclNode;
          symbols.push({
            name: theoryStmt.name,
            kind: 'axiom',
            description: `Theory${theoryStmt.parent ? ` extends ${theoryStmt.parent}` : ''}`,
            detail: `${theoryStmt.members.length} miembros`,
            location: theoryStmt.source,
          });
          // Agregar cada miembro como símbolo con prefijo
          for (const member of theoryStmt.members) {
            const ms = member.statement;
            if ('name' in ms) {
              const memberName = `${theoryStmt.name}.${(ms as { name: string }).name}`;
              const vis = member.visibility === 'private' ? '🔒 ' : '';
              if (ms.kind === 'axiom_decl') {
                symbols.push({ name: memberName, kind: 'axiom', detail: `${vis}${formulaToString(ms.formula)}`, location: ms.source });
              } else if (ms.kind === 'theorem_decl') {
                symbols.push({ name: memberName, kind: 'theorem', detail: `${vis}${formulaToString(ms.formula)}`, location: ms.source });
              } else if (ms.kind === 'let_decl') {
                symbols.push({
                  name: memberName,
                  kind: ms.letType === 'description' ? 'variable' : 'formula',
                  description: ms.letType === 'description' ? ms.description : undefined,
                  detail: `${vis}${ms.letType === 'formula' ? formulaToString(ms.formula) : ms.letType === 'description' ? `"${ms.description}"` : ''}`,
                  location: ms.source,
                });
              }
            }
          }
          break;
        }
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
      {
        label: 'logic arithmetic',
        kind: 'value',
        detail: 'Perfil aritmético para cálculos numéricos, comparaciones y scripting',
        documentation: 'Activa el perfil `arithmetic` para usar `+`, `-`, `*`, `/`, `%`, `<`, `>`, `<=` y `>=` con evaluación numérica.',
        insertText: 'logic arithmetic',
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
        label: 'refute',
        kind: 'keyword',
        detail: 'Refutar fórmula (alias de countermodel)',
        insertText: 'refute ${1:formula}',
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
      {
        label: 'analyze',
        kind: 'keyword',
        detail: 'Analizar argumento (detectar falacias)',
        insertText: 'analyze {${1:premises}} -> ${2:conclusion}',
      },

      // ── Alias en español ────────────────────────────────────────
      {
        label: 'axioma',
        kind: 'keyword',
        detail: 'Declarar axioma (español)',
        insertText: 'axioma ${1:nombre} : ${2:formula}',
      },
      {
        label: 'teorema',
        kind: 'keyword',
        detail: 'Declarar teorema (español)',
        insertText: 'teorema ${1:nombre} : ${2:formula}',
      },
      {
        label: 'derivar',
        kind: 'keyword',
        detail: 'Derivar fórmula (español)',
        insertText: 'derivar ${1:formula} desde {${2:premisas}}',
      },
      {
        label: 'verificar valido',
        kind: 'keyword',
        detail: 'Verificar validez (español)',
        insertText: 'verificar valido ${1:formula}',
      },
      {
        label: 'verificar satisfacible',
        kind: 'keyword',
        detail: 'Verificar satisfacibilidad (español)',
        insertText: 'verificar satisfacible ${1:formula}',
      },
      {
        label: 'probar',
        kind: 'keyword',
        detail: 'Probar fórmula (español)',
        insertText: 'probar ${1:formula}',
      },
      {
        label: 'contramodelo',
        kind: 'keyword',
        detail: 'Buscar contramodelo (español)',
        insertText: 'contramodelo ${1:formula}',
      },
      {
        label: 'refutar',
        kind: 'keyword',
        detail: 'Refutar fórmula (español)',
        insertText: 'refutar ${1:formula}',
      },
      {
        label: 'tabla_verdad',
        kind: 'keyword',
        detail: 'Tabla de verdad (español)',
        insertText: 'tabla_verdad ${1:formula}',
      },
      {
        label: 'explicar',
        kind: 'keyword',
        detail: 'Explicar fórmula (español)',
        insertText: 'explicar ${1:formula}',
      },
      {
        label: 'analizar',
        kind: 'keyword',
        detail: 'Analizar argumento (español)',
        insertText: 'analizar {${1:premisas}} -> ${2:conclusion}',
      },
      {
        label: 'paratodo',
        kind: 'operator',
        detail: 'Cuantificador universal ∀ (español)',
        insertText: 'paratodo ${1:x} (${2:formula})',
      },
      {
        label: 'existe',
        kind: 'operator',
        detail: 'Cuantificador existencial ∃ (español)',
        insertText: 'existe ${1:x} (${2:formula})',
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
      {
        label: 'next',
        kind: 'operator',
        detail: 'X(φ) = Next — "en el siguiente estado φ" (LTL temporal)',
        insertText: 'next (${1:formula})',
      },
      {
        label: 'until',
        kind: 'operator',
        detail: 'φ U ψ = Until — "φ vale hasta que ψ" (LTL temporal)',
        insertText: '${1:A} until ${2:B}',
      },

      // ── Import ──────────────────────────────────────────────────
      {
        label: 'import',
        kind: 'keyword',
        detail: 'Importar archivo .st externo',
        insertText: 'import "${1:path.st}"',
      },
      {
        label: 'importar',
        kind: 'keyword',
        detail: 'Importar archivo .st (español)',
        insertText: 'importar "${1:ruta.st}"',
      },

      // ── Proof blocks ────────────────────────────────────────────
      {
        label: 'assume',
        kind: 'keyword',
        detail: 'Asumir hipótesis para proof block',
        insertText: 'assume ${1:name} : ${2:formula}',
      },
      {
        label: 'asumir',
        kind: 'keyword',
        detail: 'Asumir hipótesis (español)',
        insertText: 'asumir ${1:nombre} : ${2:formula}',
      },
      {
        label: 'show',
        kind: 'keyword',
        detail: 'Declarar goal de un proof block',
        insertText: 'show ${1:formula}',
      },
      {
        label: 'demostrar',
        kind: 'keyword',
        detail: 'Declarar goal de un proof block (español)',
        insertText: 'demostrar ${1:formula}',
      },
      {
        label: 'qed',
        kind: 'keyword',
        detail: 'Cerrar proof block',
        insertText: 'qed',
      },

      // ── Theory blocks (OOP) ─────────────────────────────────────
      {
        label: 'theory',
        kind: 'keyword',
        detail: 'Declarar bloque de teoría (encapsula axiomas, let, teoremas)',
        insertText: 'theory ${1:Name} {\n  ${2}\n}',
      },
      {
        label: 'teoria',
        kind: 'keyword',
        detail: 'Declarar bloque de teoría (español)',
        insertText: 'teoria ${1:Nombre} {\n  ${2}\n}',
      },
      {
        label: 'theory extends',
        kind: 'keyword',
        detail: 'Declarar teoría que hereda de otra (herencia OOP)',
        insertText: 'theory ${1:Child} extends ${2:Parent} {\n  ${3}\n}',
      },
      {
        label: 'teoria extiende',
        kind: 'keyword',
        detail: 'Declarar teoría con herencia (español)',
        insertText: 'teoria ${1:Hijo} extiende ${2:Padre} {\n  ${3}\n}',
      },
      {
        label: 'private',
        kind: 'keyword',
        detail: 'Miembro privado de teoría (no accesible via dot notation)',
        insertText: 'private ${1:statement}',
      },
      {
        label: 'privado',
        kind: 'keyword',
        detail: 'Miembro privado de teoría (español)',
        insertText: 'privado ${1:statement}',
      },

      // ── Programación y control de flujo ───────────────────────
      {
        label: 'print',
        kind: 'keyword',
        detail: 'Imprimir texto o fórmulas durante la ejecución',
        documentation: 'Úsalo para inspeccionar valores intermedios, resultados o mensajes del script.',
        insertText: 'print ${1:value}',
      },
      {
        label: 'imprimir',
        kind: 'keyword',
        detail: 'Imprimir texto o fórmulas (español)',
        insertText: 'imprimir ${1:valor}',
      },
      {
        label: 'set',
        kind: 'keyword',
        detail: 'Reasignar una variable o alias',
        documentation: 'Actualiza un valor en tiempo de ejecución, útil dentro de loops y funciones.',
        insertText: 'set ${1:name} = ${2:value}',
      },
      {
        label: 'asignar',
        kind: 'keyword',
        detail: 'Reasignar una variable o alias (español)',
        insertText: 'asignar ${1:nombre} = ${2:valor}',
      },
      {
        label: 'if',
        kind: 'keyword',
        detail: 'Condicional ST con rama else',
        documentation: 'Evalúa condiciones como `valid`, `invalid`, `satisfiable` o `unsatisfiable` y ejecuta bloques según el resultado.',
        insertText: 'if ${1:valid} ${2:formula} {\n  ${3}\n} else {\n  ${4}\n}',
      },
      {
        label: 'si',
        kind: 'keyword',
        detail: 'Condicional ST con rama sino (español)',
        insertText: 'si ${1:valido} ${2:formula} {\n  ${3}\n} sino {\n  ${4}\n}',
      },
      {
        label: 'for',
        kind: 'keyword',
        detail: 'Bucle sobre colección de valores o fórmulas',
        insertText: 'for ${1:item} in {${2:items}} {\n  ${3}\n}',
      },
      {
        label: 'para',
        kind: 'keyword',
        detail: 'Bucle sobre colección (español)',
        insertText: 'para ${1:item} en {${2:items}} {\n  ${3}\n}',
      },
      {
        label: 'while',
        kind: 'keyword',
        detail: 'Bucle condicionado',
        insertText: 'while ${1:valid} ${2:formula} {\n  ${3}\n}',
      },
      {
        label: 'mientras',
        kind: 'keyword',
        detail: 'Bucle condicionado (español)',
        insertText: 'mientras ${1:valido} ${2:formula} {\n  ${3}\n}',
      },
      {
        label: 'fn',
        kind: 'keyword',
        detail: 'Declarar función con parámetros y retorno',
        insertText: 'fn ${1:name}(${2:params}) {\n  ${3}\n  return ${4:result}\n}',
      },
      {
        label: 'funcion',
        kind: 'keyword',
        detail: 'Declarar función con parámetros y retorno (español)',
        insertText: 'funcion ${1:nombre}(${2:parametros}) {\n  ${3}\n  retornar ${4:resultado}\n}',
      },
      {
        label: 'return',
        kind: 'keyword',
        detail: 'Retornar un valor desde una función',
        insertText: 'return ${1:value}',
      },
      {
        label: 'retornar',
        kind: 'keyword',
        detail: 'Retornar un valor desde una función (español)',
        insertText: 'retornar ${1:valor}',
      },

      // ── Aritmética ────────────────────────────────────────────
      {
        label: '+',
        kind: 'operator',
        detail: 'Suma dos expresiones numéricas',
        insertText: '${1:a} + ${2:b}',
      },
      {
        label: '-',
        kind: 'operator',
        detail: 'Resta dos expresiones numéricas',
        insertText: '${1:a} - ${2:b}',
      },
      {
        label: '*',
        kind: 'operator',
        detail: 'Multiplicación numérica',
        insertText: '${1:a} * ${2:b}',
      },
      {
        label: '/',
        kind: 'operator',
        detail: 'División numérica',
        insertText: '${1:a} / ${2:b}',
      },
      {
        label: '%',
        kind: 'operator',
        detail: 'Residuo de división entera',
        insertText: '${1:a} % ${2:b}',
      },
      {
        label: '<',
        kind: 'operator',
        detail: 'Comparación menor que',
        insertText: '${1:a} < ${2:b}',
      },
      {
        label: '>',
        kind: 'operator',
        detail: 'Comparación mayor que',
        insertText: '${1:a} > ${2:b}',
      },
      {
        label: '<=',
        kind: 'operator',
        detail: 'Comparación menor o igual que',
        insertText: '${1:a} <= ${2:b}',
      },
      {
        label: '>=',
        kind: 'operator',
        detail: 'Comparación mayor o igual que',
        insertText: '${1:a} >= ${2:b}',
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

  private getStatementHoverInfo(stmt: Statement, letDefs?: Map<string, { formula?: string; description?: string; line: number }>): HoverInfo | null {
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
      case 'let_decl': {
        let content = `**Let** \`${stmt.name}\``;
        if (stmt.letType === 'description') {
          content += `\n\n📝 *"${stmt.description}"*`;
        } else if (stmt.letType === 'formula') {
          content += ` = \`${formulaToString(stmt.formula)}\``;
          const desc = 'description' in stmt ? (stmt as { description?: string }).description : undefined;
          if (desc) content += `\n\n📝 *"${desc}"*`;
        } else if (stmt.letType === 'passage') {
          content += ` = passage([[${stmt.anchorPath}]])`;
        }
        return { content, range: stmt.source };
      }
      case 'theory_decl': {
        const theoryStmt = stmt as TheoryDeclNode;
        const parentStr = theoryStmt.parent ? ` extends \`${theoryStmt.parent}\`` : '';
        const pubCount = theoryStmt.members.filter(m => m.visibility === 'public').length;
        const privCount = theoryStmt.members.filter(m => m.visibility === 'private').length;
        let content = `**Theory** \`${theoryStmt.name}\`${parentStr}\n\n`;
        content += `📦 ${pubCount} miembros públicos`;
        if (privCount > 0) content += `, 🔒 ${privCount} privados`;
        return { content, range: stmt.source };
      }
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
