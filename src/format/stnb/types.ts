/**
 * Tipos del formato .stnb (ST Notebook)
 * Análogo a Jupyter .ipynb para proofs ST.
 */

export type CellType = 'code' | 'markdown';

export type OutputType = 'result' | 'error' | 'stream';

export interface CellOutputMetadata {
  executionTime?: number;
  [key: string]: unknown;
}

export interface CellOutput {
  type: OutputType;
  data: Record<string, unknown>;
  metadata?: CellOutputMetadata;
}

export interface BaseCell {
  id: string;
  type: CellType;
  source: string;
}

export interface MarkdownCell extends BaseCell {
  type: 'markdown';
}

export interface CodeCell extends BaseCell {
  type: 'code';
  profile?: string;
  outputs: CellOutput[];
}

export type Cell = MarkdownCell | CodeCell;

export interface NotebookMetadata {
  title: string;
  author?: string;
  profile: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface Notebook {
  version: string;
  kernel: string;
  kernelVersion: string;
  metadata: NotebookMetadata;
  cells: Cell[];
}
