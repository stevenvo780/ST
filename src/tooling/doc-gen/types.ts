// ============================================================
// ST doc-gen — tipos públicos.
//
// Modelo de documentación derivado de TSDoc/JSDoc + TS Compiler
// API: un ApiDoc por símbolo exportado (function/class/interface
// /type/const/enum/namespace), agrupado por módulo (archivo).
// ============================================================

export type ApiKind = 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum' | 'namespace';

export interface ApiParameter {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

export interface ApiReturns {
  type: string;
  description: string;
}

export interface ApiDoc {
  name: string;
  kind: ApiKind;
  description: string;
  signature: string;
  parameters?: ApiParameter[];
  returns?: ApiReturns;
  examples?: string[];
  remarks?: string;
  see?: string[];
  deprecated?: boolean;
  module: string; // relative path (e.g. tooling/doc-gen/index.ts)
  filePath: string; // absolute path
  lineNumber: number;
  exported: boolean;
}

export interface DocModule {
  path: string; // relative module path
  description?: string; // module-level @fileoverview / leading comment
  exports: ApiDoc[];
}

export interface DocOptions {
  rootDir: string;
  outputDir: string;
  includeInternal?: boolean;
  template?: 'markdown' | 'json' | 'html-minimal';
}

export interface JSDocTag {
  tag: string;
  content: string;
}

export interface ParsedJSDoc {
  description: string;
  tags: JSDocTag[];
}

export interface GenerateResult {
  filesWritten: string[];
  warnings: string[];
}
