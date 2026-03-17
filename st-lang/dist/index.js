"use strict";
// ============================================================
// ST — Exports públicos
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPL = exports.ProtocolHandler = exports.Interpreter = exports.compileClaimsToTheory = exports.registerContext = exports.registerConfidence = exports.registerSupport = exports.registerClaim = exports.registerFormalization = exports.registerPassage = exports.parseAnchorPath = exports.createTextLayerState = exports.ParaconsistentBelnap = exports.ModalK = exports.ClassicalFirstOrder = exports.formulaToString = exports.ClassicalPropositional = exports.registry = exports.ProfileRegistry = exports.Parser = exports.KEYWORDS = exports.TokenType = exports.Lexer = exports.render = exports.completion = exports.gotoDefinition = exports.symbols = exports.hover = exports.listProfiles = exports.createInterpreter = exports.quickEval = exports.check = exports.parse = exports.evaluate = void 0;
// API programática (uso recomendado para integración)
var api_1 = require("./api");
Object.defineProperty(exports, "evaluate", { enumerable: true, get: function () { return api_1.evaluate; } });
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return api_1.parse; } });
Object.defineProperty(exports, "check", { enumerable: true, get: function () { return api_1.check; } });
Object.defineProperty(exports, "quickEval", { enumerable: true, get: function () { return api_1.quickEval; } });
Object.defineProperty(exports, "createInterpreter", { enumerable: true, get: function () { return api_1.createInterpreter; } });
Object.defineProperty(exports, "listProfiles", { enumerable: true, get: function () { return api_1.listProfiles; } });
Object.defineProperty(exports, "hover", { enumerable: true, get: function () { return api_1.hover; } });
Object.defineProperty(exports, "symbols", { enumerable: true, get: function () { return api_1.symbols; } });
Object.defineProperty(exports, "gotoDefinition", { enumerable: true, get: function () { return api_1.gotoDefinition; } });
Object.defineProperty(exports, "completion", { enumerable: true, get: function () { return api_1.completion; } });
Object.defineProperty(exports, "render", { enumerable: true, get: function () { return api_1.render; } });
// Tipos
__exportStar(require("./types"), exports);
// Lexer
var lexer_1 = require("./lexer/lexer");
Object.defineProperty(exports, "Lexer", { enumerable: true, get: function () { return lexer_1.Lexer; } });
var tokens_1 = require("./lexer/tokens");
Object.defineProperty(exports, "TokenType", { enumerable: true, get: function () { return tokens_1.TokenType; } });
Object.defineProperty(exports, "KEYWORDS", { enumerable: true, get: function () { return tokens_1.KEYWORDS; } });
// AST
__exportStar(require("./ast/nodes"), exports);
// Parser
var parser_1 = require("./parser/parser");
Object.defineProperty(exports, "Parser", { enumerable: true, get: function () { return parser_1.Parser; } });
// Perfiles
var interface_1 = require("./profiles/interface");
Object.defineProperty(exports, "ProfileRegistry", { enumerable: true, get: function () { return interface_1.ProfileRegistry; } });
Object.defineProperty(exports, "registry", { enumerable: true, get: function () { return interface_1.registry; } });
var propositional_1 = require("./profiles/classical/propositional");
Object.defineProperty(exports, "ClassicalPropositional", { enumerable: true, get: function () { return propositional_1.ClassicalPropositional; } });
Object.defineProperty(exports, "formulaToString", { enumerable: true, get: function () { return propositional_1.formulaToString; } });
var first_order_1 = require("./profiles/classical/first-order");
Object.defineProperty(exports, "ClassicalFirstOrder", { enumerable: true, get: function () { return first_order_1.ClassicalFirstOrder; } });
var k_1 = require("./profiles/modal/k");
Object.defineProperty(exports, "ModalK", { enumerable: true, get: function () { return k_1.ModalK; } });
var belnap_1 = require("./profiles/paraconsistent/belnap");
Object.defineProperty(exports, "ParaconsistentBelnap", { enumerable: true, get: function () { return belnap_1.ParaconsistentBelnap; } });
// Text Layer
var compiler_1 = require("./text-layer/compiler");
Object.defineProperty(exports, "createTextLayerState", { enumerable: true, get: function () { return compiler_1.createTextLayerState; } });
Object.defineProperty(exports, "parseAnchorPath", { enumerable: true, get: function () { return compiler_1.parseAnchorPath; } });
Object.defineProperty(exports, "registerPassage", { enumerable: true, get: function () { return compiler_1.registerPassage; } });
Object.defineProperty(exports, "registerFormalization", { enumerable: true, get: function () { return compiler_1.registerFormalization; } });
Object.defineProperty(exports, "registerClaim", { enumerable: true, get: function () { return compiler_1.registerClaim; } });
Object.defineProperty(exports, "registerSupport", { enumerable: true, get: function () { return compiler_1.registerSupport; } });
Object.defineProperty(exports, "registerConfidence", { enumerable: true, get: function () { return compiler_1.registerConfidence; } });
Object.defineProperty(exports, "registerContext", { enumerable: true, get: function () { return compiler_1.registerContext; } });
Object.defineProperty(exports, "compileClaimsToTheory", { enumerable: true, get: function () { return compiler_1.compileClaimsToTheory; } });
// Runtime
var interpreter_1 = require("./runtime/interpreter");
Object.defineProperty(exports, "Interpreter", { enumerable: true, get: function () { return interpreter_1.Interpreter; } });
// Protocol
var handler_1 = require("./protocol/handler");
Object.defineProperty(exports, "ProtocolHandler", { enumerable: true, get: function () { return handler_1.ProtocolHandler; } });
// REPL
var repl_1 = require("./repl/repl");
Object.defineProperty(exports, "REPL", { enumerable: true, get: function () { return repl_1.REPL; } });
//# sourceMappingURL=index.js.map