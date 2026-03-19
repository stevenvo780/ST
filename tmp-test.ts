import { Interpreter } from './src/runtime/interpreter';
const interp = new Interpreter();
const result = interp.execute('logic classical.propositional\nexplain (P & !P)');
console.log("ExitCode:", result.exitCode);
console.log("Diagnostics:", JSON.stringify(result.diagnostics, null, 2));
