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
  {
    pattern: '[](P -> Q) -> ([]P -> []Q)',
    name: 'Axioma K (Distribución)',
    abbr: 'K',
    systems: [
      'modal.k',
      'modal.t',
      'modal.s4',
      'modal.s5',
      'deontic.standard',
      'epistemic.s5',
      'temporal.ltl',
    ],
  },
  // Modal T
  {
    pattern: '[]P -> P',
    name: 'Axioma T (Reflexividad)',
    abbr: 'T',
    systems: ['modal.t', 'modal.s4', 'modal.s5', 'epistemic.s5'],
    note: 'Propiedad del marco: Reflexividad',
  },
  {
    pattern: 'P -> <>P',
    name: 'Axioma T (Dual)',
    abbr: 'T-Dual',
    systems: ['modal.t', 'modal.s4', 'modal.s5', 'epistemic.s5'],
  },
  // Modal D
  {
    pattern: '[]P -> <>P',
    name: 'Axioma D (Serialidad)',
    abbr: 'D',
    systems: ['modal.d', 'deontic.standard'],
    note: 'Propiedad del marco: Serialidad',
  },
  // Modal S4
  {
    pattern: '[]P -> [][]P',
    name: 'Axioma 4 (Transitividad)',
    abbr: '4',
    systems: ['modal.s4', 'modal.s5', 'epistemic.s5', 'temporal.ltl'],
    note: 'Propiedad del marco: Transitividad',
  },
  // Modal S5
  {
    pattern: '<>P -> []<>P',
    name: 'Axioma 5 (Euclidianidad)',
    abbr: '5',
    systems: ['modal.s5', 'epistemic.s5'],
    note: 'Propiedad del marco: Euclidianidad / Simetría',
  },
  {
    pattern: 'P -> []<>P',
    name: 'Axioma B (Simetría)',
    abbr: 'B',
    systems: ['modal.s5', 'epistemic.s5'],
    note: 'Propiedad del marco: Simetría',
  },

  // Deóntica Paradojas
  {
    pattern: '[]P -> [](P | Q)',
    name: 'Paradoja de Ross',
    abbr: 'Ross',
    systems: ['deontic.standard'],
    paradox: true,
    note: 'Si es obligatorio enviar la carta, entonces es obligatorio enviarla o quemarla.',
  },
  {
    pattern: 'P -> []<>P',
    name: 'Buen Samaritano (Aprox)',
    abbr: 'Samaritano',
    systems: ['deontic.standard'],
    paradox: true,
    note: 'Paradoja del Buen Samaritano.',
  },

  // Epistémica Paradojas
  {
    pattern: '[](P -> Q) -> ([]P -> []Q)',
    name: 'Omnisciencia Lógica',
    abbr: 'Omniscience',
    systems: ['epistemic.s5'],
    paradox: true,
    note: 'El agente conoce todas las consecuencias lógicas de su conocimiento.',
  },

  // Paradoja de Moore (#12)
  {
    pattern: 'P & ![]P',
    name: 'Paradoja de Moore',
    abbr: 'Moore',
    systems: ['epistemic.s5'],
    paradox: true,
    note: "Satisfacible pero no asertable: 'llueve pero no sé que llueve'. Coherente semánticamente pero pragmáticamente absurda.",
  },

  // Introspección negativa (#14)
  {
    pattern: '![]P -> []![]P',
    name: 'Introspección Negativa (Axioma 5)',
    abbr: '5-Intro',
    systems: ['epistemic.s5', 'modal.s5'],
    paradox: false,
    note: 'Si no sabes algo, sabes que no lo sabes. Requiere euclidianidad.',
  },

  // Paradoja de Chisholm (#13) — simplified recognizable pattern
  {
    pattern: '[]P & [](P -> Q) & (!P -> []!Q) & !P',
    name: 'Paradoja de Chisholm',
    abbr: 'Chisholm',
    systems: ['deontic.standard'],
    paradox: true,
    note: 'Conjunto contrary-to-duty: obligaciones derivadas de actos que no deberían ocurrir. Inconsistente en KD estándar.',
  },
];

let schemasAST: { tag: KnownTheorem; ast: Formula }[] | null = null;
function getSchemas() {
  if (schemasAST === null) {
    schemasAST = [];
    for (const schema of MODAL_THEOREMS) {
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

export function identifyTheorem(f: Formula, system: string): KnownTheorem | undefined {
  const candidates: KnownTheorem[] = [];
  for (const { tag, ast } of getSchemas()) {
    if (tag.systems.includes(system) && unify(f, ast, new Map())) {
      candidates.push(tag);
    }
  }
  if (candidates.length === 0) return undefined;
  // Prefer specialized matches: fewer systems listed ≈ more specific.
  // Break ties by preferring paradox-flagged schemas (usually the contextual reading).
  candidates.sort((a, b) => {
    if (a.systems.length !== b.systems.length) return a.systems.length - b.systems.length;
    const ap = a.paradox ? 1 : 0;
    const bp = b.paradox ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return 0;
  });
  return candidates[0];
}
