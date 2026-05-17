// ============================================================
// ST doc-gen — generador de documentación de API.
//
// Toma JSDoc/TSDoc de fuentes TypeScript usando el TS Compiler
// API y produce Markdown (o JSON, o HTML minimal) por módulo.
//
// Uso típico:
//
// ```ts
// import { generateDocs } from '@stevenvo780/st-lang/tooling/doc-gen';
// await generateDocs({
//   rootDir: 'src',
//   outputDir: 'docs/api',
//   template: 'markdown',
// });
// ```
//
// La librería NO empaqueta a `dist/` un binario CLI; la idea es
// invocarla desde scripts (`scripts/build-docs.mjs`) o desde un
// task externo.
// ============================================================

export type {
  ApiDoc,
  ApiKind,
  ApiParameter,
  ApiReturns,
  DocModule,
  DocOptions,
  GenerateResult,
  JSDocTag,
  ParsedJSDoc,
} from './types';

export { parseJSDoc, parseParamTag, parseReturnsTag, stripCommentMarkers } from './jsdoc';
export { extractDocs } from './extract';
export type { ExtractOptions } from './extract';
export { renderMarkdown, renderJSON, renderIndex, toMarkdownPath } from './render';
export { generateDocs } from './generate';
