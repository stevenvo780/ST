// ============================================================
// G3 — Export de arboles de prueba a LaTeX (bussproofs)
// ============================================================
//
// Genera codigo bussproofs valido para LaTeX. Cada nodo del arbol
// produce un bloque \AxiomC / \UnaryInfC / \BinaryInfC con la
// regla anotada en \RightLabel. La raiz queda envuelta en un
// $\DisplayProof$ para ser inmediatamente renderizable.

import { Formula } from '../../../types';
import { ProofTree, Sequent, SequentRule } from './types';

const RULE_LABEL: Record<SequentRule, string> = {
  axiom: '\\textsc{Ax}',
  falseL: '$\\bot_L$',
  trueR: '$\\top_R$',
  andL: '$\\wedge_L$',
  andR: '$\\wedge_R$',
  orL: '$\\vee_L$',
  orR: '$\\vee_R$',
  impL: '$\\to_L$',
  impR: '$\\to_R$',
  notL: '$\\neg_L$',
  notR: '$\\neg_R$',
};

function formulaToLatex(f: Formula): string {
  switch (f.kind) {
    case 'atom':
      return escapeAtom(f.name ?? '?');
    case 'true':
      return '\\top';
    case 'false':
      return '\\bot';
    case 'not': {
      const inner = f.args && f.args[0] ? f.args[0] : undefined;
      if (!inner) return '\\neg ?';
      return inner.kind === 'atom' || inner.kind === 'true' || inner.kind === 'false'
        ? `\\neg ${formulaToLatex(inner)}`
        : `\\neg (${formulaToLatex(inner)})`;
    }
    case 'and':
      return binop(f, '\\wedge');
    case 'or':
      return binop(f, '\\vee');
    case 'implies':
      return binop(f, '\\to');
    case 'biconditional':
      return binop(f, '\\leftrightarrow');
    default:
      // Fallback: usar `kind` como etiqueta opaca
      return `\\mathit{${escapeAtom(f.kind)}}`;
  }
}

function binop(f: Formula, op: string): string {
  const a = f.args && f.args[0] ? formulaToLatex(f.args[0]) : '?';
  const b = f.args && f.args[1] ? formulaToLatex(f.args[1]) : '?';
  return `(${a} ${op} ${b})`;
}

function escapeAtom(name: string): string {
  // bussproofs corre dentro de math mode: hay que escapar caracteres
  // problematicos como `_` y `#` para evitar romper el render.
  return name.replace(/([\\#$%&_{}])/g, '\\$1');
}

function sequentToLatex(seq: Sequent): string {
  const left = seq.left.map(formulaToLatex).join(', ');
  const right = seq.right.map(formulaToLatex).join(', ');
  return `$${left} \\vdash ${right}$`;
}

function emit(tree: ProofTree, lines: string[]): void {
  // Recorrido post-orden: emitimos premisas primero porque bussproofs
  // consume el stack de \AxiomC en orden top-down.
  if (!tree.rule || tree.premises.length === 0) {
    // Hoja: axiom, falseL, trueR, o rama abierta.
    if (tree.rule === 'axiom' || tree.rule === 'falseL' || tree.rule === 'trueR') {
      lines.push(`\\AxiomC{${sequentToLatex(tree.goal)}}`);
      lines.push(`\\RightLabel{${RULE_LABEL[tree.rule]}}`);
      lines.push(`\\UnaryInfC{${sequentToLatex(tree.goal)}}`);
    } else {
      // Rama abierta (no cerrable): emitimos como axioma marcado.
      lines.push(`\\AxiomC{${sequentToLatex(tree.goal)}}`);
      lines.push(`\\RightLabel{\\textsc{open}}`);
      lines.push(`\\UnaryInfC{${sequentToLatex(tree.goal)}}`);
    }
    return;
  }

  for (const premise of tree.premises) {
    emit(premise, lines);
  }
  lines.push(`\\RightLabel{${RULE_LABEL[tree.rule]}}`);
  const infCmd =
    tree.premises.length === 1
      ? 'UnaryInfC'
      : tree.premises.length === 2
        ? 'BinaryInfC'
        : 'TrinaryInfC';
  lines.push(`\\${infCmd}{${sequentToLatex(tree.goal)}}`);
}

/**
 * Convierte un `ProofTree` G3 en codigo LaTeX bussproofs listo para
 * embeberse dentro de un documento. Asume `\usepackage{bussproofs}`.
 */
export function proofToLatex(proof: ProofTree): string {
  const lines: string[] = [];
  emit(proof, lines);
  return `\\begin{prooftree}\n${lines.join('\n')}\n\\end{prooftree}`;
}
