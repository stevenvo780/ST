"use strict";
// ============================================================
// ST CLI — Entry point principal
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const interpreter_1 = require("../runtime/interpreter");
const repl_1 = require("../repl/repl");
const handler_1 = require("../protocol/handler");
const VERSION = '0.1.0';
function printUsage() {
    console.log(`
st v${VERSION} — Lenguaje ejecutable con nucleo logico y capa textual

Uso:
  st run <archivo.st>                    Ejecutar script
  st check <archivo.st>                  Verificar sintaxis y bien-formacion
  st repl                                Iniciar REPL interactivo
  st eval "<expresion>"                  Evaluar expresion directa
  st render <archivo.st> --format <fmt>  Renderizar salida (markdown|json)
  st version                             Mostrar version
  st help                                Mostrar esta ayuda
  st profiles                            Listar perfiles logicos

Codigos de salida:
  0  Ejecucion correcta
  1  Error de parseo o tipado
  2  Error de resolucion
  3  Error de runtime
  4  Resultado logico negativo esperado

Ejemplos:
  st run demo.st
  st check demo.st
  st eval "check valid (P -> (Q -> P))"
  st repl
`);
}
function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        printUsage();
        process.exit(0);
    }
    const command = args[0];
    switch (command) {
        case 'run':
            return cmdRun(args.slice(1));
        case 'check':
            return cmdCheck(args.slice(1));
        case 'repl':
            return cmdRepl();
        case 'eval':
            return cmdEval(args.slice(1));
        case 'render':
            return cmdRender(args.slice(1));
        case 'version':
        case '--version':
        case '-v':
            console.log(`st v${VERSION}`);
            process.exit(0);
            break;
        case 'help':
        case '--help':
        case '-h':
            printUsage();
            process.exit(0);
            break;
        case 'profiles':
            return cmdProfiles();
        case 'protocol':
            return cmdProtocol(args.slice(1));
        default:
            // Si es un archivo, ejecutar como `st run`
            if (args[0].endsWith('.st') || args[0].endsWith('.md.st')) {
                return cmdRun(args);
            }
            console.error(`Comando desconocido: ${command}`);
            console.error(`Usa 'st help' para ver los comandos disponibles.`);
            process.exit(1);
    }
}
function cmdRun(args) {
    if (args.length === 0) {
        console.error('Error: se necesita un archivo. Uso: st run <archivo.st>');
        process.exit(1);
    }
    const filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) {
        console.error(`Error: archivo no encontrado: ${filePath}`);
        process.exit(1);
    }
    const source = fs.readFileSync(filePath, 'utf-8');
    const interpreter = new interpreter_1.Interpreter();
    const output = interpreter.execute(source, filePath);
    if (output.stdout) {
        console.log(output.stdout);
    }
    if (output.stderr) {
        console.error(output.stderr);
    }
    // Escribir diagnósticos si se pide
    if (args.includes('--diagnostics')) {
        const diagPath = filePath.replace(/\.st$/, '.diagnostics.json');
        fs.writeFileSync(diagPath, JSON.stringify(output.diagnostics, null, 2));
        console.log(`Diagnosticos escritos en: ${diagPath}`);
    }
    process.exit(output.exitCode);
}
function cmdCheck(args) {
    if (args.length === 0) {
        console.error('Error: se necesita un archivo. Uso: st check <archivo.st>');
        process.exit(1);
    }
    const filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) {
        console.error(`Error: archivo no encontrado: ${filePath}`);
        process.exit(1);
    }
    const source = fs.readFileSync(filePath, 'utf-8');
    const interpreter = new interpreter_1.Interpreter();
    const output = interpreter.execute(source, filePath);
    const errors = output.diagnostics.filter(d => d.severity === 'error');
    const warnings = output.diagnostics.filter(d => d.severity === 'warning');
    if (errors.length === 0) {
        console.log(`✓ ${filePath}: sin errores`);
        if (warnings.length > 0) {
            console.log(`  ${warnings.length} advertencia(s)`);
            for (const w of warnings) {
                console.log(`  ⚠ ${w.message}${w.line ? ` (linea ${w.line})` : ''}`);
            }
        }
        // Mostrar resultados lógicos
        for (const r of output.results) {
            if (r.status === 'invalid' || r.status === 'refutable' || r.status === 'unsatisfiable') {
                console.log(`  ✗ Resultado negativo: ${r.output}`);
            }
        }
        const hasNegativeResults = output.results.some(r => r.status === 'invalid' || r.status === 'refutable');
        process.exit(hasNegativeResults ? 4 : 0);
    }
    else {
        console.error(`✗ ${filePath}: ${errors.length} error(es)`);
        for (const e of errors) {
            console.error(`  ✗ ${e.message}${e.line ? ` (linea ${e.line})` : ''}`);
        }
        process.exit(1);
    }
}
function cmdRepl() {
    const repl = new repl_1.REPL();
    repl.start();
}
function cmdEval(args) {
    if (args.length === 0) {
        console.error('Error: se necesita una expresion. Uso: st eval "<expresion>"');
        process.exit(1);
    }
    const source = args.join(' ');
    const interpreter = new interpreter_1.Interpreter();
    // Si no empieza con "logic", prepend classical.propositional
    let fullSource = source;
    if (!source.trim().startsWith('logic ')) {
        fullSource = `logic classical.propositional\n${source}`;
    }
    const output = interpreter.execute(fullSource, '<eval>');
    if (output.stdout) {
        console.log(output.stdout);
    }
    if (output.stderr) {
        console.error(output.stderr);
    }
    process.exit(output.exitCode);
}
function cmdRender(args) {
    if (args.length === 0) {
        console.error('Error: se necesita un archivo. Uso: st render <archivo.st> --format <fmt>');
        process.exit(1);
    }
    const filePath = path.resolve(args[0]);
    let format = 'markdown';
    const fmtIdx = args.indexOf('--format');
    if (fmtIdx !== -1 && args[fmtIdx + 1]) {
        format = args[fmtIdx + 1];
    }
    if (!fs.existsSync(filePath)) {
        console.error(`Error: archivo no encontrado: ${filePath}`);
        process.exit(1);
    }
    const source = fs.readFileSync(filePath, 'utf-8');
    const handler = new handler_1.ProtocolHandler();
    const response = handler.handle({
        id: 1,
        method: 'render',
        params: { source, file: filePath, format },
    });
    if (response.result) {
        const res = response.result;
        console.log(res.rendered);
    }
    if (response.error) {
        console.error(response.error.message);
        process.exit(3);
    }
    process.exit(0);
}
function cmdProfiles() {
    // Forzar registro
    const interpreter = new interpreter_1.Interpreter();
    const { registry } = require('../profiles/interface');
    console.log('Perfiles logicos disponibles:\n');
    for (const name of registry.list()) {
        const p = registry.get(name);
        const status = name === 'classical.propositional' ? '✓ completo' : '○ stub';
        console.log(`  ${name}`);
        console.log(`    ${p?.description || ''}`);
        console.log(`    Estado: ${status}`);
        console.log('');
    }
}
function cmdProtocol(args) {
    // Modo JSON-RPC sobre stdin/stdout para integración con editores
    const handler = new handler_1.ProtocolHandler();
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    rl.on('line', (line) => {
        try {
            const request = JSON.parse(line);
            const response = handler.handle(request);
            console.log(JSON.stringify(response));
        }
        catch (e) {
            console.log(JSON.stringify({
                id: -1,
                error: { code: -32700, message: `Parse error: ${e.message}` },
            }));
        }
    });
}
main();
//# sourceMappingURL=index.js.map