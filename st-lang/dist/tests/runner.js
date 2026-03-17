"use strict";
// ============================================================
// ST Tests — Runner simple sin dependencias
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.describe = describe;
exports.it = it;
exports.assert = assert;
exports.assertEqual = assertEqual;
exports.assertIncludes = assertIncludes;
const core_test_1 = require("./core.test");
const parser_test_1 = require("./parser.test");
const cli_test_1 = require("./cli.test");
let results = [];
let currentSuite = '';
function describe(name, fn) {
    currentSuite = name;
    console.log(`\n  ${name}`);
    fn();
}
function it(name, fn) {
    try {
        fn();
        results.push({ name: `${currentSuite} > ${name}`, passed: true });
        console.log(`    ✓ ${name}`);
    }
    catch (e) {
        results.push({ name: `${currentSuite} > ${name}`, passed: false, error: e.message });
        console.log(`    ✗ ${name}`);
        console.log(`      ${e.message}`);
    }
}
function assert(condition, message = 'Assertion failed') {
    if (!condition)
        throw new Error(message);
}
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
function assertIncludes(str, substring, message) {
    if (!str.includes(substring)) {
        throw new Error(message || `Expected string to include "${substring}", got: "${str.slice(0, 200)}"`);
    }
}
// Main
console.log('ST Tests');
console.log('========\n');
(0, core_test_1.runCoreTests)();
(0, parser_test_1.runParserTests)();
(0, cli_test_1.runCLITests)();
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;
console.log(`\n========`);
console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter(r => !r.passed)) {
        console.log(`  ✗ ${r.name}: ${r.error}`);
    }
    process.exit(1);
}
else {
    console.log('\n✓ Todos los tests pasaron');
    process.exit(0);
}
//# sourceMappingURL=runner.js.map