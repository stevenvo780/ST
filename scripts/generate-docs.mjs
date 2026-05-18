import { generateDocs } from '../dist/tooling/doc-gen/index.js';

const result = await generateDocs({
  rootDir: 'src',
  outputDir: 'docs/api',
  template: 'markdown',
  includeInternal: false
});

console.log(`Generados: ${result.filesWritten.length} archivos`);
if (result.warnings.length) {
  console.warn(`Warnings: ${result.warnings.length}`);
  const top = result.warnings.slice(0, 20);
  for (const w of top) console.warn(' ', w);
  if (result.warnings.length > 20) console.warn(`  ... y ${result.warnings.length - 20} más`);
}
