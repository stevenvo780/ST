import { Formula } from '../types';
import { unify } from './formula-classifier';
import { Parser } from '../parser/parser';

export interface KnownTheorem {
  pattern: string;
  name: string;
  abbr: string;
  systems: string[];
  note?: string;
  paradox?: boolean;
}

export const MODAL_THEOREMS: KnownTheorem[] = [
  // Modal K
  { pattern: '[](P -> Q) -> ([]P -> []Q)', name: 'Axioma K (Distribución)', abbr: 'K', systems: ['modal.k', 'modal.t', 'modal.s4', 'modal.s5', 'deontic.standard', 'epistemic.s5', 'temporal.ltl'] },
  // Modal T
  { pattern: '[]P -> P', name: 'Axioma T (Reflexividad)', abbr: 'T', systems: ['modal.t', 'modal.s4', 'modal.s5', 'epistemic.s5'], note: 'Propiedad del marco: Reflexividad' },
  { pattern: 'P -> <>P', name: 'Axioma T (Dual)', abbr: 'T-Dual', systems: ['modal.t', 'modal.s4', 'modal.s5', 'epistemic.s5'] },
  // Modal D
  { pattern: '[]P -> <>P', name: 'Axioma D (Serialidad)', abbr: 'D', systems: ['modal.d', 'deontic.standard'], note: 'Propiedad del marco: Serialidad' },
  // Modal S4
  { pattern: '[]P -> [][]P', name: 'Axioma 4 (Transitividad)', abbr: '4', systems: ['modal.s4', 'modal.s5', 'epistemic.s5', 'temporal.ltl'], note: 'Propiedad del marco: Transitividad' },
  // Modal S5
  { pattern: '<>P -> []<>P', name: 'Axioma 5 (Euclidianidad)', abbr: '5', systems: ['modal.s5', 'epistemic.s5'], note: 'Propiedad del marco: Euclidianidad / Simetría' },
  { pattern: 'P -> []<>P', name: 'Axioma B (Simetría)', abbr: 'B', systems: ['modal.s5', 'epistemic.s5'], note: 'Propiedad del marco: Simetría' },
  
  // Deóntica Paradojas
  { pattern: '[]P -> [](P | Q)', name: 'Paradoja de Ross', abbr: 'Ross', systems: ['deontic.standard'], paradox: true, note: 'Si es obligatorio enviar la carta, entonces es obligatorio enviarla o quemarla.' },
  { pattern: 'P -> []<>P', name: 'Buen Samaritano (Aprox)', abbr: 'Samaritano', systems: ['deontic.standard'], paradox: true, note: 'Paradoja del Buen Samaritano.' },
  
  // Epistémica Paradojas
  { pattern: '[](P -> Q) -> ([]P -> []Q)', name: 'Omnisciencia Lógica', abbr: 'Omniscience', systems: ['epistemic.s5'], paradox: true, note: 'El agente conoce todas las consecuencias lógicas de su conocimiento.' }
];

let schemasAST: { tag: KnownTheorem; ast: Formula }[] | null = null;
function getSchemas() {
  if (schemasAST === null) {
    schemasAST = [];
    console.log("Loading known theorems...");
    for (const schema of MODAL_THEOREMS) {
      console.log("Parsing theorem:", schema.pattern);
      const parser = new Parser();
      const prog = parser.parse(`claim P = ${schema.pattern}`);
      if (prog.statements[0] && prog.statements[0].kind === 'claim_decl') {
        const ast = prog.statements[0].formula!;
        schemasAST.push({ tag: schema, ast });
      }
    }
    console.log("Finished loading known theorems.");
  }
  return schemasAST;
}

export function identifyTheorem(f: Formula, system: string): KnownTheorem | undefined {
  for (const { tag, ast } of getSchemas()) {
    if (tag.systems.includes(system)) {
      if (unify(f, ast, new Map())) {
        return tag;
      }
    }
  }
  return undefined;
}
