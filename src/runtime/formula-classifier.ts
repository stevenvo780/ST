import { Formula } from '../types';
import { formulaToUnicode } from './format';
import { Parser } from '../parser/parser';

interface ClassificationResult {
  formulaClassification?: string;
  reasoningSchema?: string;
  formulaAnalysis: {
    mainConnective?: string;
    depth: number;
    complexity: number;
    subFormulas: string[];
    atomCount: number;
    connectivesUsed: string[];
  };
}

// Basic structural equality check
export function formulasEqual(a: Formula, b: Formula): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'atom' && b.kind === 'atom') return a.name === b.name;
  if (a.args && b.args) {
    if (a.args.length !== b.args.length) return false;
    for (let i = 0; i < a.args.length; i++) {
      if (!formulasEqual(a.args[i], b.args[i])) return false;
    }
    return true;
  }
  return !a.args && !b.args;
}

// Unifier for scheme matching
export function unify(f: Formula, template: Formula, mapping: Map<string, Formula>): boolean {
  if (template.kind === 'atom' && template.name) {
    // If it's a metavariable in the template, e.g. P, Q, R
    const existing = mapping.get(template.name);
    if (existing !== undefined) {
      return formulasEqual(existing, f);
    } else {
      mapping.set(template.name, f);
      return true;
    }
  }
  if (f.kind !== template.kind) return false;
  if (!f.args || !template.args) return f.args === template.args;
  if (f.args.length !== template.args.length) return false;
  for (let i = 0; i < f.args.length; i++) {
    if (!unify(f.args[i], template.args[i], mapping)) return false;
  }
  return true;
}

// Pre-compiled known theorems/tautologies
const knownSchemas = [
  { pattern: 'P -> P', name: 'Identidad / Reflexividad', abbr: 'Id' },
  { pattern: 'P | !P', name: 'Tercero excluido', abbr: 'LEM' },
  { pattern: '!(P & !P)', name: 'No-contradicción', abbr: 'LNC' },
  { pattern: 'P -> (Q -> P)', name: 'Verum ex quodlibet / Axioma K', abbr: 'VEQ' },
  { pattern: '(P->(Q->R))->((P->Q)->(P->R))', name: 'Distribución / Axioma S', abbr: 'Dist' },
  { pattern: '(P->Q)->(!Q->!P)', name: 'Contrapositiva', abbr: 'Contra' },
  { pattern: '(!P->!Q)->(Q->P)', name: 'Contrapositiva inversa', abbr: 'ContraInv' },
  { pattern: '!!P -> P', name: 'Doble negación eliminación', abbr: 'DNE' },
  { pattern: 'P -> !!P', name: 'Doble negación introducción', abbr: 'DNI' },
  { pattern: '((P->Q)->P)->P', name: 'Ley de Peirce', abbr: 'Peirce' },
  { pattern: '!P -> (P -> Q)', name: 'Ex falso quodlibet', abbr: 'EFQ' },
  { pattern: '(P->Q) & (Q->R) -> (P->R)', name: 'Transitividad del condicional', abbr: 'Trans' },
  { pattern: '(P|Q)->(Q|P)', name: 'Conmutatividad ∨', abbr: 'Comm∨' },
  { pattern: '(P&Q)->(Q&P)', name: 'Conmutatividad ∧', abbr: 'Comm∧' },
  { pattern: '!(P&Q) <-> (!P|!Q)', name: 'De Morgan 1', abbr: 'DeMorgan1' },
  { pattern: '!(P|Q) <-> (!P&!Q)', name: 'De Morgan 2', abbr: 'DeMorgan2' },
  { pattern: 'P&(Q|R) <-> (P&Q)|(P&R)', name: 'Distributividad ∧/∨', abbr: 'DistAndOr' },
  { pattern: 'P|(Q&R) <-> (P|Q)&(P|R)', name: 'Distributividad ∨/∧', abbr: 'DistOrAnd' },
  { pattern: '(P->Q) <-> (!P|Q)', name: 'Definición material del condicional', abbr: 'DefCond' },
  {
    pattern: '(P<->Q) <-> ((P->Q)&(Q->P))',
    name: 'Definición del bicondicional',
    abbr: 'DefBicond',
  },
  { pattern: 'P&(P|Q) <-> P', name: 'Absorción ∧', abbr: 'AbsAnd' },
  { pattern: 'P|(P&Q) <-> P', name: 'Absorción ∨', abbr: 'AbsOr' },
  { pattern: '(P&P) <-> P', name: 'Idempotencia ∧', abbr: 'IdempAnd' },
  { pattern: '(P|P) <-> P', name: 'Idempotencia ∨', abbr: 'IdempOr' },
  { pattern: '((P&Q)->R) <-> (P->(Q->R))', name: 'Exportación/Importación', abbr: 'ExpImp' },
  { pattern: '(P<->Q) <-> (Q<->P)', name: 'Simetría del bicondicional', abbr: 'SymBicond' },
  { pattern: '!!P <-> P', name: 'Doble negación', abbr: 'DN_Equiv' },
];

// Parser instanced only once for schema loading (lazy)
interface SchemaDef {
  pattern: string;
  name: string;
  abbr: string;
}
let schemasAST: { tag: SchemaDef; ast: Formula }[] | null = null;
function getSchemas() {
  if (schemasAST === null) {
    schemasAST = [];
    for (const schema of knownSchemas) {
      const parser = new Parser();
      const prog = parser.parse(`claim P = ${schema.pattern}`);
      if (prog.statements[0] && prog.statements[0].kind === 'claim_decl') {
        const ast = prog.statements[0].formula as Formula;
        schemasAST.push({ tag: schema, ast });
      }
    }
  }
  return schemasAST;
}

function getConnectiveSymbol(kind: string): string {
  switch (kind) {
    case 'not':
      return '¬';
    case 'and':
      return '∧';
    case 'or':
      return '∨';
    case 'implies':
      return '→';
    case 'biconditional':
      return '↔';
    case 'nand':
      return '↑';
    case 'nor':
      return '↓';
    case 'xor':
      return '⊕';
    case 'forall':
      return '∀';
    case 'exists':
      return '∃';
    case 'modal_necessity':
      return '□';
    case 'modal_possibility':
      return '◇';
    default:
      return kind;
  }
}

export function classifyFormula(f: Formula): ClassificationResult {
  let depth = 0;
  let complexity = 0;
  const subFormulas = new Set<string>();
  const atoms = new Set<string>();
  const connectives = new Set<string>();

  function walk(node: Formula, currentDepth: number) {
    if (currentDepth > depth) depth = currentDepth;

    const rep = formulaToUnicode(node);
    if (rep !== '?') {
      subFormulas.add(rep);
    }

    if (node.kind === 'atom') {
      if (node.name) atoms.add(node.name);
    } else if (node.kind === 'predicate') {
      // do nothing for predicate names here, but we could count them similarly
    } else {
      complexity++;
      const sym = getConnectiveSymbol(node.kind);
      if (node.kind !== 'number' && node.kind !== 'fn_call') {
        connectives.add(sym);
      }
    }

    if (node.args) {
      for (const arg of node.args) {
        walk(arg, currentDepth + 1);
      }
    }
  }

  walk(f, 1);

  // Match schemas
  let formulaClassification: string | undefined;
  for (const { tag, ast } of getSchemas()) {
    if (unify(f, ast, new Map())) {
      formulaClassification = tag.name;
      break;
    }
  }

  return {
    formulaClassification,
    formulaAnalysis: {
      mainConnective: f.kind === 'atom' ? undefined : getConnectiveSymbol(f.kind),
      depth,
      complexity,
      subFormulas: Array.from(subFormulas).sort((a, b) => a.length - b.length),
      atomCount: atoms.size,
      connectivesUsed: Array.from(connectives),
    },
  };
}
