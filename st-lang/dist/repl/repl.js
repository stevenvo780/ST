"use strict";
// ============================================================
// ST REPL — Read-Eval-Print Loop interactivo
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPL = void 0;
const readline = __importStar(require("readline"));
const interpreter_1 = require("../runtime/interpreter");
const propositional_1 = require("../profiles/classical/propositional");
const interface_1 = require("../profiles/interface");
class REPL {
    interpreter;
    rl = null;
    constructor() {
        this.interpreter = new interpreter_1.Interpreter();
    }
    start() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'st> ',
            terminal: true,
        });
        console.log('ST REPL v0.1.0');
        console.log('Lenguaje ejecutable con nucleo logico y capa textual');
        console.log('Escribe :help para ver comandos. :quit para salir.\n');
        this.rl.prompt();
        let buffer = '';
        this.rl.on('line', (line) => {
            const trimmed = line.trim();
            // Comandos especiales del REPL
            if (trimmed.startsWith(':')) {
                this.handleMetaCommand(trimmed);
                this.rl.prompt();
                return;
            }
            // Línea vacía ejecuta el buffer si hay algo
            if (trimmed === '' && buffer !== '') {
                this.executeBuffer(buffer);
                buffer = '';
                this.rl.prompt();
                return;
            }
            if (trimmed === '') {
                this.rl.prompt();
                return;
            }
            // Acumular o ejecutar directo
            // Si la línea parece un statement completo, ejecutar directo
            buffer = trimmed;
            this.executeBuffer(buffer);
            buffer = '';
            this.rl.prompt();
        });
        this.rl.on('close', () => {
            console.log('\nAdios.');
            process.exit(0);
        });
    }
    executeBuffer(source) {
        const output = this.interpreter.executeSingle(source);
        if (output.stdout) {
            console.log(output.stdout);
        }
        if (output.stderr) {
            console.error(`Error: ${output.stderr}`);
        }
        for (const d of output.diagnostics) {
            if (d.severity === 'warning') {
                console.log(`Advertencia: ${d.message}`);
            }
        }
    }
    handleMetaCommand(cmd) {
        const parts = cmd.split(/\s+/);
        const command = parts[0].toLowerCase();
        switch (command) {
            case ':help':
            case ':h':
                this.printHelp();
                break;
            case ':quit':
            case ':q':
            case ':exit':
                console.log('Adios.');
                process.exit(0);
                break;
            case ':profiles':
                console.log('Perfiles disponibles:');
                for (const name of interface_1.registry.list()) {
                    const p = interface_1.registry.get(name);
                    console.log(`  ${name} — ${p?.description || ''}`);
                }
                break;
            case ':theory':
                this.printTheory();
                break;
            case ':reset':
                this.interpreter.reset();
                console.log('Estado reiniciado.');
                break;
            case ':profile':
                const p = this.interpreter.getProfile();
                if (p) {
                    console.log(`Perfil actual: ${p.name}`);
                }
                else {
                    console.log('No hay perfil activo. Use: logic <perfil>');
                }
                break;
            case ':claims':
                this.printClaims();
                break;
            default:
                console.log(`Comando desconocido: ${command}. Escribe :help para ver comandos.`);
        }
    }
    printHelp() {
        console.log(`
Comandos del REPL:
  :help, :h          Mostrar esta ayuda
  :quit, :q, :exit   Salir
  :profiles          Listar perfiles logicos disponibles
  :profile           Mostrar perfil activo
  :theory            Mostrar teoria actual (axiomas, teoremas)
  :claims            Mostrar claims registrados
  :reset             Reiniciar estado

Sintaxis ST:
  logic <perfil>                         Seleccionar perfil logico
  axiom <nombre> = <formula>             Declarar axioma
  theorem <nombre> = <formula>           Declarar teorema
  derive <formula> from {p1, p2, ...}    Derivar formula
  check valid <formula>                  Verificar validez (tautologia)
  check satisfiable <formula>            Verificar satisfacibilidad
  check equivalent <f1>, <f2>            Verificar equivalencia
  prove <formula> from {p1, p2, ...}     Probar formula
  countermodel <formula>                 Buscar contramodelo
  truth_table <formula>                  Tabla de verdad

  let <nombre> = passage([[path]])       Declarar pasaje
  let <nombre> = formalize p as F        Formalizar pasaje
  claim <nombre> = <ref>                 Declarar claim
  support <claim> <- <fuente>            Registrar soporte
  confidence <claim> = <0..1>            Registrar confianza
  context <claim> = "texto"              Registrar contexto

Formulas:
  P, Q, R       Atomos proposicionales
  !P             Negacion
  P & Q          Conjuncion
  P | Q          Disyuncion
  P -> Q         Implicacion
  P <-> Q        Bicondicional
  (P -> Q)       Agrupacion con parentesis
`);
    }
    printTheory() {
        const theory = this.interpreter.getTheory();
        const profile = this.interpreter.getProfile();
        console.log(`Perfil: ${profile?.name || '(ninguno)'}`);
        if (theory.axioms.size > 0) {
            console.log('Axiomas:');
            for (const [name, formula] of theory.axioms) {
                console.log(`  ${name} = ${(0, propositional_1.formulaToString)(formula)}`);
            }
        }
        else {
            console.log('Axiomas: (ninguno)');
        }
        if (theory.theorems.size > 0) {
            console.log('Teoremas:');
            for (const [name, formula] of theory.theorems) {
                console.log(`  ${name} = ${(0, propositional_1.formulaToString)(formula)}`);
            }
        }
    }
    printClaims() {
        const tl = this.interpreter.getTextLayer();
        if (tl.passages.size > 0) {
            console.log('Passages:');
            for (const [name, p] of tl.passages) {
                console.log(`  ${name} -> ${p.anchor.path}${p.anchor.fragment ? '#' + p.anchor.fragment : ''}`);
            }
        }
        if (tl.claims.size > 0) {
            console.log('Claims:');
            for (const [name, c] of tl.claims) {
                let info = name;
                if (c.formula)
                    info += ` = ${(0, propositional_1.formulaToString)(c.formula)}`;
                if (c.support)
                    info += ` (soporte: ${c.support})`;
                if (c.confidence !== undefined)
                    info += ` [confianza: ${c.confidence}]`;
                if (c.context)
                    info += ` {contexto: "${c.context}"}`;
                console.log(`  ${info}`);
            }
        }
    }
}
exports.REPL = REPL;
//# sourceMappingURL=repl.js.map