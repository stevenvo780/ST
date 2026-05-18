/**
 * Executor del formato .stnb
 * Ejecuta cells de tipo "code" usando la API de ST y captura los outputs.
 */

import { evaluate } from '../../api';
import type { Notebook, CodeCell, CellOutput } from './types';

export interface ExecuteOptions {
  /** Si es true, una cell con error detiene la ejecución. Default: false */
  stopOnError?: boolean;
  /** Timeout por cell en ms. Default: 5000 */
  cellTimeoutMs?: number;
}

export interface ExecuteResult {
  notebook: Notebook;
  cellsExecuted: number;
  errors: Array<{ cellId: string; message: string }>;
}

/**
 * Construye el fuente ST completo para una cell, prefijando el profile si corresponde.
 */
function buildCellSource(cell: CodeCell, defaultProfile: string): string {
  const profile = cell.profile ?? defaultProfile;
  const profileLine = `logic ${profile}\n`;
  if (cell.source.trimStart().startsWith('logic ')) {
    return cell.source;
  }
  return profileLine + cell.source;
}

/**
 * Ejecuta todas las cells de tipo "code" de un notebook en orden.
 * Devuelve una copia del notebook con los outputs actualizados.
 */
export function executeNotebook(
  notebook: Notebook,
  options: ExecuteOptions = {}
): ExecuteResult {
  const { stopOnError = false } = options;
  const errors: Array<{ cellId: string; message: string }> = [];
  let cellsExecuted = 0;

  const updatedCells = notebook.cells.map((cell) => {
    if (cell.type !== 'code') {
      return cell;
    }

    const startTime = Date.now();
    let outputs: CellOutput[] = [];

    try {
      const source = buildCellSource(cell, notebook.metadata.profile);
      const result = evaluate(source);
      const executionTime = Date.now() - startTime;
      cellsExecuted++;

      if (result.ok) {
        outputs = [
          {
            type: 'result',
            data: {
              valid: true,
              stdout: result.stdout,
              results: result.results,
            },
            metadata: { executionTime },
          },
        ];
      } else {
        const errorMsg = result.stderr || result.stdout || 'Unknown error';
        outputs = [
          {
            type: 'error',
            data: {
              valid: false,
              message: errorMsg,
              diagnostics: result.diagnostics,
            },
            metadata: { executionTime },
          },
        ];
        errors.push({ cellId: cell.id, message: errorMsg });
        if (stopOnError) {
          // return partial — this cell gets the error output but loop breaks after
        }
      }
    } catch (e) {
      const executionTime = Date.now() - startTime;
      const message = (e as Error).message;
      outputs = [
        {
          type: 'error',
          data: { valid: false, message },
          metadata: { executionTime },
        },
      ];
      errors.push({ cellId: cell.id, message });
    }

    return { ...cell, outputs };
  });

  const updatedNotebook: Notebook = {
    ...notebook,
    metadata: {
      ...notebook.metadata,
      updatedAt: new Date().toISOString(),
    },
    cells: updatedCells,
  };

  return { notebook: updatedNotebook, cellsExecuted, errors };
}

/**
 * Ejecuta una sola cell de código y devuelve sus outputs.
 */
export function executeCell(
  cell: CodeCell,
  defaultProfile: string
): CellOutput[] {
  const startTime = Date.now();
  try {
    const source = buildCellSource(cell, defaultProfile);
    const result = evaluate(source);
    const executionTime = Date.now() - startTime;

    if (result.ok) {
      return [
        {
          type: 'result',
          data: { valid: true, stdout: result.stdout, results: result.results },
          metadata: { executionTime },
        },
      ];
    } else {
      return [
        {
          type: 'error',
          data: {
            valid: false,
            message: result.stderr || result.stdout,
            diagnostics: result.diagnostics,
          },
          metadata: { executionTime },
        },
      ];
    }
  } catch (e) {
    const executionTime = Date.now() - startTime;
    return [
      {
        type: 'error',
        data: { valid: false, message: (e as Error).message },
        metadata: { executionTime },
      },
    ];
  }
}
