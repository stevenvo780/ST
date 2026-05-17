// ============================================================
// Plantillas de ejercicios por nivel
// ============================================================

import { ExerciseKind, ExerciseLevel, ProfileName } from './types';
import { SeededRng } from './rng';

export interface TemplateContext {
  vars: string[];
  rng: SeededRng;
}

export interface BuildResult {
  formula?: string;
  premises?: string[];
  goal?: string;
  expectedStatus: 'valid' | 'invalid' | 'satisfiable' | 'unsatisfiable' | 'provable' | 'refutable';
  prompt: string;
  hints: string[];
  explanation: string;
  canonicalFormula?: string;
  countermodelHint?: Record<string, boolean>;
}

export interface ExerciseTemplate {
  id: string;
  level: ExerciseLevel;
  kind: ExerciseKind;
  profiles: ProfileName[];
  minVars: number;
  build(ctx: TemplateContext): BuildResult;
}

const DEFAULT_VARS = ['P', 'Q', 'R', 'S', 'T', 'U'];

export function pickVars(rng: SeededRng, count: number): string[] {
  const shuffled = rng.shuffle(DEFAULT_VARS);
  return shuffled.slice(0, count);
}

// ─── Nivel 1: introductorios (tautologías clásicas básicas) ───

const T_L1_VALIDITY: ExerciseTemplate[] = [
  {
    id: 'l1-identity',
    level: 1,
    kind: 'validity',
    profiles: ['classical.propositional'],
    minVars: 1,
    build: ({ vars }) => {
      const p = vars[0] ?? 'P';
      return {
        formula: `(${p} -> ${p})`,
        canonicalFormula: `(${p} -> ${p})`,
        expectedStatus: 'valid',
        prompt: `¿La fórmula \`${p} -> ${p}\` es válida (tautología) en lógica clásica?`,
        hints: [
          'Una fórmula es válida si es verdadera en toda interpretación.',
          `Considerá los dos casos: ${p}=V y ${p}=F. ¿Qué pasa con ${p} -> ${p} en cada uno?`,
          'Cualquier proposición se implica a sí misma. Esta es la "ley de identidad".',
        ],
        explanation: `${p} -> ${p} es la ley de identidad: una de las tautologías más básicas. Por definición material de la implicación, si el antecedente es falso la implicación es verdadera, y si es verdadero el consecuente también lo es.`,
      };
    },
  },
  {
    id: 'l1-double-neg-elim',
    level: 1,
    kind: 'validity',
    profiles: ['classical.propositional'],
    minVars: 1,
    build: ({ vars }) => {
      const p = vars[0] ?? 'P';
      return {
        formula: `(~~${p} -> ${p})`,
        canonicalFormula: `(~~${p} -> ${p})`,
        expectedStatus: 'valid',
        prompt: `¿La fórmula \`¬¬${p} -> ${p}\` es válida en lógica clásica?`,
        hints: [
          'Pensá en la doble negación.',
          'En lógica clásica, no-no-P equivale a P.',
          'Esta es la eliminación de la doble negación.',
        ],
        explanation:
          'Doble negación clásica: ¬¬P es equivalente a P. Tabla de verdad: si P=V entonces ¬¬P=V; si P=F entonces ¬¬P=F. Por tanto la implicación siempre se cumple.',
      };
    },
  },
  {
    id: 'l1-and-elim-left',
    level: 1,
    kind: 'validity',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        formula: `((${p} & ${q}) -> ${p})`,
        canonicalFormula: `((${p} & ${q}) -> ${p})`,
        expectedStatus: 'valid',
        prompt: `¿La fórmula \`(${p} ∧ ${q}) -> ${p}\` es válida?`,
        hints: [
          'Si una conjunción es verdadera, ¿qué pasa con cada uno de sus términos?',
          `Si ${p} y ${q} ambos son verdaderos, entonces ${p} solo también lo es.`,
          'Esta es la regla de eliminación de la conjunción (∧-E).',
        ],
        explanation:
          'Eliminación de la conjunción: de A∧B se sigue A. Es uno de los axiomas básicos de la lógica proposicional.',
      };
    },
  },
  {
    id: 'l1-or-intro',
    level: 1,
    kind: 'validity',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        formula: `(${p} -> (${p} | ${q}))`,
        canonicalFormula: `(${p} -> (${p} | ${q}))`,
        expectedStatus: 'valid',
        prompt: `¿La fórmula \`${p} -> (${p} ∨ ${q})\` es válida?`,
        hints: [
          'Si tenés A, ¿podés afirmar A∨B aunque no sepás nada de B?',
          'Una disyunción es verdadera si al menos uno de sus términos lo es.',
          'Esta es la introducción de la disyunción (∨-I).',
        ],
        explanation:
          'Introducción de la disyunción: de A se sigue A∨B. Si A es verdadero, agregar disyuntivamente cualquier cosa preserva la verdad.',
      };
    },
  },
  {
    id: 'l1-lem-classical',
    level: 1,
    kind: 'validity',
    profiles: ['classical.propositional'],
    minVars: 1,
    build: ({ vars }) => {
      const p = vars[0] ?? 'P';
      return {
        formula: `(${p} | ~${p})`,
        canonicalFormula: `(${p} | ~${p})`,
        expectedStatus: 'valid',
        prompt: `¿La fórmula \`${p} ∨ ¬${p}\` es válida en lógica clásica?`,
        hints: [
          'En lógica clásica, ¿qué pasa con toda proposición y su negación?',
          'Esto se conoce como "tercio excluso" o "tertium non datur".',
          'Toda proposición o su negación tiene que ser verdadera. No hay punto medio.',
        ],
        explanation:
          'Principio del tercio excluso (LEM): A ∨ ¬A. Es válido en lógica clásica pero NO en lógica intuicionista. Es uno de los principios que distingue ambas lógicas.',
      };
    },
  },
];

// ─── Nivel 1: satisfacibilidad básica ───

const T_L1_SAT: ExerciseTemplate[] = [
  {
    id: 'l1-sat-atom',
    level: 1,
    kind: 'satisfiability',
    profiles: ['classical.propositional'],
    minVars: 1,
    build: ({ vars }) => {
      const p = vars[0] ?? 'P';
      return {
        formula: `${p}`,
        canonicalFormula: `${p}`,
        expectedStatus: 'satisfiable',
        prompt: `¿La fórmula \`${p}\` es satisfacible?`,
        hints: [
          'Una fórmula es satisfacible si existe alguna asignación que la haga verdadera.',
          `¿Qué pasa si ${p}=V?`,
          `Sí: cuando ${p}=V la fórmula vale V. Es satisfacible.`,
        ],
        explanation: `Un átomo solo es satisfacible: basta con asignar ${p}=V.`,
      };
    },
  },
  {
    id: 'l1-unsat-contradiction',
    level: 1,
    kind: 'satisfiability',
    profiles: ['classical.propositional'],
    minVars: 1,
    build: ({ vars }) => {
      const p = vars[0] ?? 'P';
      return {
        formula: `(${p} & ~${p})`,
        canonicalFormula: `(${p} & ~${p})`,
        expectedStatus: 'unsatisfiable',
        prompt: `¿La fórmula \`${p} ∧ ¬${p}\` es satisfacible?`,
        hints: [
          '¿Puede ser verdadero algo y a la vez su negación?',
          'Principio de no contradicción.',
          'No: esta fórmula es una contradicción, no admite asignación que la haga verdadera.',
        ],
        explanation:
          'Una conjunción de algo con su negación es la contradicción clásica. Es insatisfacible (no hay valuación que la haga verdadera).',
      };
    },
  },
];

// ─── Nivel 2: básico (combina dos pasos) ───

const T_L2: ExerciseTemplate[] = [
  {
    id: 'l2-modus-ponens',
    level: 2,
    kind: 'derive',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        premises: [`(${p} -> ${q})`, `${p}`],
        goal: `${q}`,
        canonicalFormula: `${q}`,
        expectedStatus: 'provable',
        prompt: `Derivá \`${q}\` a partir de las premisas: \`${p} -> ${q}\` y \`${p}\`.`,
        hints: [
          'Conocés una implicación y su antecedente.',
          `Si tenés "si ${p} entonces ${q}" y sabés ${p}, ¿qué podés concluir?`,
          'Modus ponens: de A→B y A se sigue B.',
        ],
        explanation:
          'Modus ponens es la regla de inferencia fundamental: si A→B y A son verdaderos, entonces B también.',
      };
    },
  },
  {
    id: 'l2-modus-tollens',
    level: 2,
    kind: 'derive',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        premises: [`(${p} -> ${q})`, `~${q}`],
        goal: `~${p}`,
        canonicalFormula: `~${p}`,
        expectedStatus: 'provable',
        prompt: `Derivá \`¬${p}\` a partir de: \`${p} -> ${q}\` y \`¬${q}\`.`,
        hints: [
          'Si la implicación es verdadera pero el consecuente es falso, ¿qué pasa con el antecedente?',
          `Si ${p} fuera verdadero, ${q} debería serlo. Pero ${q} es falso.`,
          'Modus tollens: de A→B y ¬B se sigue ¬A.',
        ],
        explanation:
          'Modus tollens: cuando la implicación se cumple y el consecuente es falso, el antecedente tiene que ser falso también.',
      };
    },
  },
  {
    id: 'l2-hypothetical-syllogism',
    level: 2,
    kind: 'derive',
    profiles: ['classical.propositional'],
    minVars: 3,
    build: ({ vars }) => {
      const [p, q, r] = [vars[0] ?? 'P', vars[1] ?? 'Q', vars[2] ?? 'R'];
      return {
        premises: [`(${p} -> ${q})`, `(${q} -> ${r})`],
        goal: `(${p} -> ${r})`,
        canonicalFormula: `(${p} -> ${r})`,
        expectedStatus: 'provable',
        prompt: `Derivá \`${p} -> ${r}\` a partir de \`${p} -> ${q}\` y \`${q} -> ${r}\`.`,
        hints: [
          'La implicación es transitiva.',
          `Si ${p} lleva a ${q} y ${q} lleva a ${r}, ¿qué relación hay entre ${p} y ${r}?`,
          'Silogismo hipotético: de A→B y B→C se sigue A→C.',
        ],
        explanation:
          'Silogismo hipotético encadena dos implicaciones por transitividad de la implicación.',
      };
    },
  },
  {
    id: 'l2-disjunctive-syllogism',
    level: 2,
    kind: 'derive',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        premises: [`(${p} | ${q})`, `~${p}`],
        goal: `${q}`,
        canonicalFormula: `${q}`,
        expectedStatus: 'provable',
        prompt: `Derivá \`${q}\` a partir de \`${p} ∨ ${q}\` y \`¬${p}\`.`,
        hints: [
          'Sabés que una de dos opciones es verdadera y que la primera es falsa.',
          `Si ${p} ∨ ${q} es verdadero y ${p} es falso, ¿qué tiene que ser ${q}?`,
          'Silogismo disyuntivo: de A∨B y ¬A se sigue B.',
        ],
        explanation: 'El silogismo disyuntivo elimina una alternativa de la disyunción.',
      };
    },
  },
  {
    id: 'l2-invalid-affirm-consequent',
    level: 2,
    kind: 'validity',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        formula: `(((${p} -> ${q}) & ${q}) -> ${p})`,
        canonicalFormula: `(((${p} -> ${q}) & ${q}) -> ${p})`,
        expectedStatus: 'invalid',
        prompt: `¿La fórmula \`((${p} -> ${q}) ∧ ${q}) -> ${p}\` es válida?`,
        hints: [
          'Cuidado: ¿qué pasa si la implicación se cumple por vacuidad?',
          `Considerá ${p}=F, ${q}=V. ¿La implicación se cumple? ¿Y el consecuente?`,
          'Esta es la falacia de afirmación del consecuente: A→B y B no implica A.',
        ],
        explanation:
          'Falacia de afirmación del consecuente. Contramodelo: P=F, Q=V — entonces la premisa es V pero la conclusión es F.',
        countermodelHint: { [p]: false, [q]: true },
      };
    },
  },
];

// ─── Nivel 2: contramodelos básicos ───

const T_L2_COUNTERMODEL: ExerciseTemplate[] = [
  {
    id: 'l2-cm-pq',
    level: 2,
    kind: 'countermodel',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        formula: `(${p} -> ${q})`,
        canonicalFormula: `(${p} -> ${q})`,
        expectedStatus: 'invalid',
        prompt: `Encontrá un contramodelo para la fórmula \`${p} -> ${q}\`. Es decir, una asignación de valores a ${p} y ${q} que la haga falsa. Responde con formato \`${p}=V, ${q}=F\` o equivalente.`,
        hints: [
          'Una implicación es falsa solo en un caso. ¿Cuál?',
          'La implicación A→B es falsa si y solo si A es verdadero y B es falso.',
          `${p}=V, ${q}=F hace que la implicación sea falsa.`,
        ],
        explanation: `La implicación ${p}→${q} solo es falsa cuando ${p}=V y ${q}=F. Esa es la única valuación contramodelo.`,
        countermodelHint: { [p]: true, [q]: false },
      };
    },
  },
];

// ─── Nivel 3: intermedio (LEM en intuicionista, De Morgan, etc.) ───

const T_L3: ExerciseTemplate[] = [
  {
    id: 'l3-intuit-lem',
    level: 3,
    kind: 'validity',
    profiles: ['intuitionistic.propositional'],
    minVars: 1,
    build: ({ vars }) => {
      const p = vars[0] ?? 'P';
      return {
        formula: `(${p} | ~${p})`,
        canonicalFormula: `(${p} | ~${p})`,
        expectedStatus: 'invalid',
        prompt: `¿La fórmula \`${p} ∨ ¬${p}\` es válida en lógica intuicionista?`,
        hints: [
          'En lógica intuicionista, una disyunción A∨B exige una prueba de A o una prueba de B.',
          'No tenemos prueba constructiva de "P o no-P" para una P arbitraria.',
          'El tercio excluso NO es válido intuicionistamente, aunque sí en lógica clásica.',
        ],
        explanation:
          'El principio del tercio excluso (LEM) no es válido en lógica intuicionista porque exige una decisión efectiva sobre toda proposición, lo cual no siempre puede construirse.',
      };
    },
  },
  {
    id: 'l3-intuit-dne',
    level: 3,
    kind: 'validity',
    profiles: ['intuitionistic.propositional'],
    minVars: 1,
    build: ({ vars }) => {
      const p = vars[0] ?? 'P';
      return {
        formula: `(~~${p} -> ${p})`,
        canonicalFormula: `(~~${p} -> ${p})`,
        expectedStatus: 'invalid',
        prompt: `¿La fórmula \`¬¬${p} -> ${p}\` (eliminación de doble negación) es válida en lógica intuicionista?`,
        hints: [
          'Comparalo con lógica clásica: ¿allí es válida?',
          'En intuicionista, ¬¬P significa "P no es refutable", no "P es verdadero".',
          'La eliminación de doble negación NO es válida intuicionistamente.',
        ],
        explanation:
          'Intuicionistamente, ¬¬P → P no es válido en general. ¬¬P solo dice que P no es refutable, no que tengamos una prueba de P.',
      };
    },
  },
  {
    id: 'l3-de-morgan-1',
    level: 3,
    kind: 'validity',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        formula: `(~(${p} & ${q}) <-> (~${p} | ~${q}))`,
        canonicalFormula: `(~(${p} & ${q}) <-> (~${p} | ~${q}))`,
        expectedStatus: 'valid',
        prompt: `¿La fórmula \`¬(${p} ∧ ${q}) <-> (¬${p} ∨ ¬${q})\` es válida en lógica clásica?`,
        hints: [
          'Esta es una de las leyes de De Morgan.',
          'Negar una conjunción equivale a la disyunción de las negaciones.',
          'Las leyes de De Morgan son tautologías clásicas.',
        ],
        explanation:
          'Ley de De Morgan: ¬(A∧B) ↔ (¬A∨¬B). Vale clásicamente; la dirección izq→der requiere LEM en intuicionista.',
      };
    },
  },
  {
    id: 'l3-contraposition',
    level: 3,
    kind: 'derive',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        premises: [`(${p} -> ${q})`],
        goal: `(~${q} -> ~${p})`,
        canonicalFormula: `(~${q} -> ~${p})`,
        expectedStatus: 'provable',
        prompt: `Derivá \`¬${q} -> ¬${p}\` a partir de \`${p} -> ${q}\`.`,
        hints: [
          'Esta es la contraposición de una implicación.',
          'Si A→B, entonces ¬B→¬A.',
          'Es derivable por reductio ad absurdum o por equivalencia material.',
        ],
        explanation:
          'La contraposición es lógicamente equivalente a la implicación original en lógica clásica.',
      };
    },
  },
];

// ─── Nivel 4: avanzado (cadenas, derivaciones largas) ───

const T_L4: ExerciseTemplate[] = [
  {
    id: 'l4-three-chain',
    level: 4,
    kind: 'derive',
    profiles: ['classical.propositional'],
    minVars: 4,
    build: ({ vars }) => {
      const [p, q, r, s] = [vars[0] ?? 'P', vars[1] ?? 'Q', vars[2] ?? 'R', vars[3] ?? 'S'];
      return {
        premises: [`(${p} -> ${q})`, `(${q} -> ${r})`, `(${r} -> ${s})`, `${p}`],
        goal: `${s}`,
        canonicalFormula: `${s}`,
        expectedStatus: 'provable',
        prompt: `Derivá \`${s}\` a partir de \`${p} -> ${q}\`, \`${q} -> ${r}\`, \`${r} -> ${s}\` y \`${p}\`.`,
        hints: [
          'Aplicá modus ponens repetidas veces.',
          `Desde ${p} y ${p}→${q} obtenés ${q}. Continuá.`,
          `Cadena: ${p} → ${q} → ${r} → ${s}.`,
        ],
        explanation:
          'Cadena de modus ponens: tres implicaciones encadenadas más el antecedente inicial dan el consecuente final.',
      };
    },
  },
  {
    id: 'l4-pierce',
    level: 4,
    kind: 'validity',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        formula: `(((${p} -> ${q}) -> ${p}) -> ${p})`,
        canonicalFormula: `(((${p} -> ${q}) -> ${p}) -> ${p})`,
        expectedStatus: 'valid',
        prompt: `¿La fórmula de Peirce \`((${p} -> ${q}) -> ${p}) -> ${p}\` es válida en lógica clásica?`,
        hints: [
          'La fórmula de Peirce es una tautología clásica, pero no contiene negación explícita.',
          'Curiosamente, equivale al tercio excluso en presencia de las otras reglas.',
          'En lógica intuicionista NO es válida, en clásica SÍ.',
        ],
        explanation:
          'La fórmula (ley) de Peirce es la única tautología clásica sin negación explícita que separa la lógica clásica de la intuicionista.',
      };
    },
  },
  {
    id: 'l4-pierce-intuit',
    level: 4,
    kind: 'validity',
    profiles: ['intuitionistic.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        formula: `(((${p} -> ${q}) -> ${p}) -> ${p})`,
        canonicalFormula: `(((${p} -> ${q}) -> ${p}) -> ${p})`,
        expectedStatus: 'invalid',
        prompt: `¿La fórmula de Peirce \`((${p} -> ${q}) -> ${p}) -> ${p}\` es válida en lógica intuicionista?`,
        hints: [
          'Pensá si requiere un razonamiento clásico.',
          'La fórmula de Peirce es equivalente al LEM en presencia del resto.',
          'En intuicionista no es válida: requiere doble negación clásica.',
        ],
        explanation:
          'La fórmula de Peirce no vale intuicionistamente; es uno de los principios que caracterizan la lógica clásica.',
      };
    },
  },
  {
    id: 'l4-disjunctive-derive',
    level: 4,
    kind: 'derive',
    profiles: ['classical.propositional'],
    minVars: 3,
    build: ({ vars }) => {
      const [p, q, r] = [vars[0] ?? 'P', vars[1] ?? 'Q', vars[2] ?? 'R'];
      return {
        premises: [`(${p} | ${q})`, `(${p} -> ${r})`, `(${q} -> ${r})`],
        goal: `${r}`,
        canonicalFormula: `${r}`,
        expectedStatus: 'provable',
        prompt: `Derivá \`${r}\` a partir de \`${p} ∨ ${q}\`, \`${p} -> ${r}\` y \`${q} -> ${r}\`.`,
        hints: [
          'Tenés una disyunción y dos implicaciones que llegan al mismo lado.',
          'Aplicá eliminación de la disyunción (proof by cases).',
          'En ambos casos llegás a ${r}, por tanto ${r} se sigue.',
        ],
        explanation:
          'Eliminación de la disyunción (proof by cases): de A∨B, A→C, B→C se sigue C. Esta regla es válida tanto clásica como intuicionistamente.',
      };
    },
  },
];

// ─── Nivel 1: traducción de lenguaje natural ───

const T_L1_TRANSLATE: ExerciseTemplate[] = [
  {
    id: 'l1-translate-and',
    level: 1,
    kind: 'translate',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        canonicalFormula: `(${p} & ${q})`,
        expectedStatus: 'valid',
        prompt: `Traducí al lenguaje formal: "${p} y ${q}". Usá los símbolos & (o ∧) para conjunción.`,
        hints: [
          'La conjunción se traduce con &.',
          `La estructura es: ${p} & ${q}.`,
          `Respuesta: ${p} & ${q}.`,
        ],
        explanation: 'La conjunción "y" se formaliza con el símbolo & (también ∧).',
      };
    },
  },
  {
    id: 'l1-translate-implies',
    level: 1,
    kind: 'translate',
    profiles: ['classical.propositional'],
    minVars: 2,
    build: ({ vars }) => {
      const [p, q] = [vars[0] ?? 'P', vars[1] ?? 'Q'];
      return {
        canonicalFormula: `(${p} -> ${q})`,
        expectedStatus: 'valid',
        prompt: `Traducí al lenguaje formal: "si ${p} entonces ${q}". Usá -> para la implicación.`,
        hints: [
          'La implicación se traduce con -> (o →).',
          `"si A entonces B" = A -> B.`,
          `Respuesta: ${p} -> ${q}.`,
        ],
        explanation: 'La implicación material "si... entonces..." se escribe A -> B.',
      };
    },
  },
];

const TEMPLATES: ExerciseTemplate[] = [
  ...T_L1_VALIDITY,
  ...T_L1_SAT,
  ...T_L1_TRANSLATE,
  ...T_L2,
  ...T_L2_COUNTERMODEL,
  ...T_L3,
  ...T_L4,
];

export function listTemplates(): ExerciseTemplate[] {
  return TEMPLATES.slice();
}

export function findTemplatesFor(
  level: ExerciseLevel,
  profile: ProfileName,
  kind: ExerciseKind,
): ExerciseTemplate[] {
  return TEMPLATES.filter(
    (t) => t.level === level && t.kind === kind && t.profiles.includes(profile),
  );
}

export function findTemplateById(id: string): ExerciseTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
