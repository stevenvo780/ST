import { quickEval } from './src/api';

const code = `
logic modal.k
check valid [](P -> Q) -> ([]P -> []Q)
`;

try {
  const r = quickEval(code);
  console.log("OK?", r.ok);
  console.log("ExitCode:", r.exitCode);
  console.log("Diagnostics:", JSON.stringify(r.diagnostics, null, 2));
  console.log("Status0:", r.results[0]?.status);
  console.log("Status1:", r.results[1]?.status);
  console.log("Status2:", r.results[2]?.status);
} catch (e) {
  console.error(e);
}
