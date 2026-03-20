import { Interpreter } from './src/runtime/interpreter';

const interpreter = new Interpreter();
// Force actual recursive evaluation via arithmetic
const source = `
logic arithmetic
fn countdown(N) {
  if valid N <= 0 {
    return 0
  }
  let prev = N - 1
  return countdown(prev)
}
let r = countdown(5000)
print r
`;

const res = interpreter.execute(source, 'test.st');
console.log('Exit code:', res.exitCode);
console.log('Diagnostics:', JSON.stringify(res.diagnostics, null, 2));
console.log('Stdout:', res.stdout);
