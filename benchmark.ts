import { Interpreter } from './src/runtime/interpreter';

const interpreter = new Interpreter();
const source = `
logic classical.propositional
check valid ((P1 | P2) & (P3 | P4)) -> (P1 | P3)
`;

console.time('Ejecución');
const res = interpreter.execute(source, 'benchmark.st');
console.timeEnd('Ejecución');
console.log(JSON.stringify(res, null, 2));
