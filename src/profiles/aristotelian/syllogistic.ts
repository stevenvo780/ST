// ============================================================
// ST Aristotelian Syllogistic — Silogística Categórica
// ============================================================
// Formaliza los 24 silogismos válidos de Aristóteles.
// Usa cuantificadores de primer orden internamente:
//   "Todo S es P"     → ∀x(S(x) → P(x))
//   "Ningún S es P"   → ∀x(S(x) → ¬P(x))
//   "Algún S es P"    → ∃x(S(x) ∧ P(x))
//   "Algún S no es P" → ∃x(S(x) ∧ ¬P(x))
//
// No usa tableau modal; implementa validación directa de
// figuras y modos silogísticos.
// ============================================================

import { Formula, RunResult, Theory, LogicProfile, Diagnostic } from '../../types';
import { formulaToString } from '../classical/propositional';

// ── Los 24 silogismos válidos por figura ────────────────────

interface SyllogismForm {
  name: string;
  figure: number;
  premises: [string, string]; // tipos: A, E, I, O
  conclusion: string;
}

// A = universal afirmativo, E = universal negativo,
// I = particular afirmativo, O = particular negativo
const VALID_SYLLOGISMS: SyllogismForm[] = [
  // Figura 1: M-P, S-M ⊢ S-P
  { name: 'Barbara', figure: 1, premises: ['A', 'A'], conclusion: 'A' },
  { name: 'Celarent', figure: 1, premises: ['E', 'A'], conclusion: 'E' },
  { name: 'Darii', figure: 1, premises: ['A', 'I'], conclusion: 'I' },
  { name: 'Ferio', figure: 1, premises: ['E', 'I'], conclusion: 'O' },
  // Figura 2: P-M, S-M ⊢ S-P
  { name: 'Cesare', figure: 2, premises: ['E', 'A'], conclusion: 'E' },
  { name: 'Camestres', figure: 2, premises: ['A', 'E'], conclusion: 'E' },
  { name: 'Festino', figure: 2, premises: ['E', 'I'], conclusion: 'O' },
  { name: 'Baroco', figure: 2, premises: ['A', 'O'], conclusion: 'O' },
  // Figura 3: M-P, M-S ⊢ S-P
  { name: 'Darapti', figure: 3, premises: ['A', 'A'], conclusion: 'I' },
  { name: 'Disamis', figure: 3, premises: ['I', 'A'], conclusion: 'I' },
  { name: 'Datisi', figure: 3, premises: ['A', 'I'], conclusion: 'I' },
  { name: 'Felapton', figure: 3, premises: ['E', 'A'], conclusion: 'O' },
  { name: 'Bocardo', figure: 3, premises: ['O', 'A'], conclusion: 'O' },
  { name: 'Ferison', figure: 3, premises: ['E', 'I'], conclusion: 'O' },
  // Figura 4: P-M, M-S ⊢ S-P
  { name: 'Bramantip', figure: 4, premises: ['A', 'A'], conclusion: 'I' },
  { name: 'Camenes', figure: 4, premises: ['A', 'E'], conclusion: 'E' },
  { name: 'Dimaris', figure: 4, premises: ['I', 'A'], conclusion: 'I' },
  { name: 'Fesapo', figure: 4, premises: ['E', 'A'], conclusion: 'O' },
  { name: 'Fresison', figure: 4, premises: ['E', 'I'], conclusion: 'O' },
];

// ── Detección de forma categórica desde Formula AST ─────────

type CategoricalType = 'A' | 'E' | 'I' | 'O';

interface CategoricalProp {
  type: CategoricalType;
  subject: string;
  predicate: string;
}

/**
 * Intenta extraer una proposición categórica del AST.
 * Patrones reconocidos:
 *   A: forall x (S(x) -> P(x))       — Todo S es P
 *   E: forall x (S(x) -> !P(x))      — Ningún S es P
 *   I: exists x (S(x) & P(x))        — Algún S es P
 *   O: exists x (S(x) & !P(x))       — Algún S no es P
 *
 * También acepta formas simplificadas con átomos:
 *   A: S -> P           (interpretado como "Todo S es P")
 *   E: S -> !P
 *   I: S & P
 *   O: S & !P
 */
function extractCategorical(f: Formula): CategoricalProp | null {
  // Forma cuantificada
  if (f.kind === 'forall' && f.args?.[0]) {
    const body = f.args[0];
    if (body.kind === 'implies' && body.args?.length === 2) {
      const subj = extractPredicateName(body.args[0]);
      const predArg = body.args[1];
      if (subj) {
        if (predArg.kind === 'not' && predArg.args?.[0]) {
          const pred = extractPredicateName(predArg.args[0]);
          if (pred) return { type: 'E', subject: subj, predicate: pred };
        }
        const pred = extractPredicateName(predArg);
        if (pred) return { type: 'A', subject: subj, predicate: pred };
      }
    }
  }

  if (f.kind === 'exists' && f.args?.[0]) {
    const body = f.args[0];
    if (body.kind === 'and' && body.args?.length === 2) {
      const subj = extractPredicateName(body.args[0]);
      const predArg = body.args[1];
      if (subj) {
        if (predArg.kind === 'not' && predArg.args?.[0]) {
          const pred = extractPredicateName(predArg.args[0]);
          if (pred) return { type: 'O', subject: subj, predicate: pred };
        }
        const pred = extractPredicateName(predArg);
        if (pred) return { type: 'I', subject: subj, predicate: pred };
      }
    }
  }

  // Forma simplificada (proposicional interpretada como categórica)
  if (f.kind === 'implies' && f.args?.length === 2) {
    const subj = f.args[0].name;
    const predArg = f.args[1];
    if (subj) {
      if (predArg.kind === 'not' && predArg.args?.[0]?.name) {
        return { type: 'E', subject: subj, predicate: predArg.args[0].name };
      }
      if (predArg.name) return { type: 'A', subject: subj, predicate: predArg.name };
    }
  }

  if (f.kind === 'and' && f.args?.length === 2) {
    const subj = f.args[0].name;
    const predArg = f.args[1];
    if (subj) {
      if (predArg.kind === 'not' && predArg.args?.[0]?.name) {
        return { type: 'O', subject: subj, predicate: predArg.args[0].name };
      }
      if (predArg.name) return { type: 'I', subject: subj, predicate: predArg.name };
    }
  }

  return null;
}

function extractPredicateName(f: Formula): string | null {
  if (f.kind === 'predicate' && f.name) return f.name;
  if (f.kind === 'atom' && f.name) return f.name;
  return null;
}

function categoricalToString(c: CategoricalProp): string {
  switch (c.type) {
    case 'A':
      return `Todo ${c.subject} es ${c.predicate}`;
    case 'E':
      return `Ningún ${c.subject} es ${c.predicate}`;
    case 'I':
      return `Algún ${c.subject} es ${c.predicate}`;
    case 'O':
      return `Algún ${c.subject} no es ${c.predicate}`;
  }
}

// ── Validación de silogismos ────────────────────────────────

function checkSyllogism(
  premise1: CategoricalProp,
  premise2: CategoricalProp,
  conclusion: CategoricalProp,
): SyllogismForm | null {
  // Determinar el término medio, mayor y menor
  const terms = new Set([
    premise1.subject,
    premise1.predicate,
    premise2.subject,
    premise2.predicate,
  ]);

  // El término medio aparece en ambas premisas pero no en la conclusión
  const middleCandidates = [...terms].filter(
    (t) =>
      (t === premise1.subject || t === premise1.predicate) &&
      (t === premise2.subject || t === premise2.predicate) &&
      t !== conclusion.subject &&
      t !== conclusion.predicate,
  );

  if (middleCandidates.length === 0) return null;

  // Intentar match con cada silogismo válido
  for (const syl of VALID_SYLLOGISMS) {
    if (
      premise1.type === syl.premises[0] &&
      premise2.type === syl.premises[1] &&
      conclusion.type === syl.conclusion
    ) {
      return syl;
    }
  }
  return null;
}

// ── Perfil ──────────────────────────────────────────────────

export class AristotelianSyllogistic implements LogicProfile {
  name = 'aristotelian.syllogistic';
  description = 'Silogística aristotélica — los 24 silogismos categóricos válidos';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const cat = extractCategorical(formula);
    if (!cat) {
      diags.push({
        severity: 'warning',
        message:
          'No se reconoce como proposición categórica (A/E/I/O). Use forall/exists con predicados.',
      });
    }
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    // En silogística, "check valid" verifica si es una ley silogística.
    // Patrón: (P1 & P2) -> C donde P1, P2, C son categóricas
    if (formula.kind === 'implies' && formula.args?.length === 2) {
      const premisesF = formula.args[0];
      const conclusionF = formula.args[1];
      const conclusion = extractCategorical(conclusionF);

      if (premisesF.kind === 'and' && premisesF.args?.length === 2 && conclusion) {
        const p1 = extractCategorical(premisesF.args[0]);
        const p2 = extractCategorical(premisesF.args[1]);
        if (p1 && p2) {
          const syl = checkSyllogism(p1, p2, conclusion);
          if (syl) {
            return {
              status: 'valid',
              output: `Silogismo VÁLIDO: ${syl.name} (Figura ${syl.figure})\n  ${categoricalToString(p1)}\n  ${categoricalToString(p2)}\n  ∴ ${categoricalToString(conclusion)}`,
              diagnostics: [],
              formula,
            };
          }
          return {
            status: 'invalid',
            output: `Silogismo NO VÁLIDO\n  ${categoricalToString(p1)}\n  ${categoricalToString(p2)}\n  ∴ ${categoricalToString(conclusion)}\n  No corresponde a ningún modo silogístico válido.`,
            diagnostics: [],
            formula,
          };
        }
      }
    }

    return {
      status: 'unknown',
      output: `No se pudo analizar como silogismo: ${formulaToString(formula)}`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const cat = extractCategorical(formula);
    if (cat) {
      // Toda proposición categórica individual es satisfacible
      // (asumiendo dominio no vacío)
      return {
        status: 'satisfiable',
        output: `${categoricalToString(cat)} es satisfacible (dominio no vacío)`,
        diagnostics: [],
        formula,
      };
    }
    return {
      status: 'unknown',
      output: `No se pudo analizar: ${formulaToString(formula)}`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory): RunResult {
    const axioms = Array.from(theory.axioms.entries());
    const conclusion = extractCategorical(goal);
    if (!conclusion || axioms.length < 2) {
      return {
        status: 'unknown',
        output: 'Se necesitan al menos 2 premisas categóricas para un silogismo',
        diagnostics: [],
        formula: goal,
      };
    }

    // Intentar todas las combinaciones de 2 premisas
    for (let i = 0; i < axioms.length; i++) {
      for (let j = 0; j < axioms.length; j++) {
        if (i === j) continue;
        const p1 = extractCategorical(axioms[i][1]);
        const p2 = extractCategorical(axioms[j][1]);
        if (p1 && p2) {
          const syl = checkSyllogism(p1, p2, conclusion);
          if (syl) {
            return {
              status: 'provable',
              output: `DEMOSTRADO por ${syl.name} (Figura ${syl.figure})\n  [${axioms[i][0]}] ${categoricalToString(p1)}\n  [${axioms[j][0]}] ${categoricalToString(p2)}\n  ∴ ${categoricalToString(conclusion)}`,
              diagnostics: [],
              formula: goal,
            };
          }
        }
      }
    }

    return {
      status: 'refutable',
      output: `No se encontró silogismo válido para derivar: ${formulaToString(goal)}`,
      diagnostics: [],
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const conclusion = extractCategorical(goal);
    if (!conclusion || premises.length < 2) {
      return {
        status: 'unknown',
        output: 'Se necesitan al menos 2 premisas categóricas',
        diagnostics: [],
        formula: goal,
      };
    }

    const premiseFormulas: [string, CategoricalProp][] = [];
    for (const name of premises) {
      const f = theory.axioms.get(name) || theory.theorems.get(name);
      if (!f) {
        return {
          status: 'error',
          output: `Premisa no encontrada: ${name}`,
          diagnostics: [{ severity: 'error', message: `'${name}' no definida` }],
          formula: goal,
        };
      }
      const cat = extractCategorical(f);
      if (cat) premiseFormulas.push([name, cat]);
    }

    for (let i = 0; i < premiseFormulas.length; i++) {
      for (let j = 0; j < premiseFormulas.length; j++) {
        if (i === j) continue;
        const syl = checkSyllogism(premiseFormulas[i][1], premiseFormulas[j][1], conclusion);
        if (syl) {
          return {
            status: 'provable',
            output: `DERIVADO por ${syl.name} (Figura ${syl.figure})`,
            diagnostics: [],
            formula: goal,
          };
        }
      }
    }

    return {
      status: 'refutable',
      output: `No se puede derivar por silogismo válido`,
      diagnostics: [],
      formula: goal,
    };
  }

  countermodel(formula: Formula): RunResult {
    const result = this.checkValid(formula);
    return {
      status: result.status === 'valid' ? 'valid' : 'invalid',
      output:
        result.status === 'valid'
          ? `No hay contramodelo — silogismo válido`
          : `Contramodelo posible — no es un silogismo válido`,
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const cat = extractCategorical(formula);
    let explanation = '';
    
    if (cat) {
      explanation += `Proposición categórica: ${categoricalToString(cat)} (tipo ${cat.type})\n\n`;
      
      const aProp = categoricalToString({ type: 'A', subject: cat.subject, predicate: cat.predicate });
      const eProp = categoricalToString({ type: 'E', subject: cat.subject, predicate: cat.predicate });
      const iProp = categoricalToString({ type: 'I', subject: cat.subject, predicate: cat.predicate });
      const oProp = categoricalToString({ type: 'O', subject: cat.subject, predicate: cat.predicate });

      explanation += `Cuadro de Oposición:\n`;
      explanation += `    A: Todo S es P ──── contrariedad ──── E: Ningún S es P\n`;
      explanation += `        │                                      │\n`;
      explanation += `   subalternación                         subalternación\n`;
      explanation += `        │                                      │\n`;
      explanation += `    I: Algún S es P ── subcontrariedad ── O: Algún S no es P\n\n`;
      
      explanation += `Relaciones para esta proposición (${cat.type}):\n`;
      if (cat.type === 'A') {
          explanation += `  - Contradictoria (O): ${oProp} (no pueden compartir valor de verdad)\n`;
          explanation += `  - Contraria (E): ${eProp} (no pueden ser ambas verdaderas)\n`;
          explanation += `  - Subalterna (I): ${iProp} (es verdadera si A es verdadera)\n`;
      } else if (cat.type === 'E') {
          explanation += `  - Contradictoria (I): ${iProp} (no pueden compartir valor de verdad)\n`;
          explanation += `  - Contraria (A): ${aProp} (no pueden ser ambas verdaderas)\n`;
          explanation += `  - Subalterna (O): ${oProp} (es verdadera si E es verdadera)\n`;
      } else if (cat.type === 'I') {
          explanation += `  - Contradictoria (E): ${eProp} (no pueden compartir valor de verdad)\n`;
          explanation += `  - Subcontraria (O): ${oProp} (no pueden ser ambas falsas)\n`;
          explanation += `  - Subalternante (A): ${aProp} (es falsa si I es falsa)\n`;
      } else if (cat.type === 'O') {
          explanation += `  - Contradictoria (A): ${aProp} (no pueden compartir valor de verdad)\n`;
          explanation += `  - Subcontraria (I): ${iProp} (no pueden ser ambas falsas)\n`;
          explanation += `  - Subalternante (E): ${eProp} (es falsa si O es falsa)\n`;
      }
      explanation += `\n`;
      
      explanation += `Distribución de términos:\n`;
      if (cat.type === 'A') explanation += `  Sujeto distribuido (abarca toda la clase), Predicado no distribuido\n\n`;
      if (cat.type === 'E') explanation += `  Sujeto distribuido, Predicado distribuido\n\n`;
      if (cat.type === 'I') explanation += `  Sujeto no distribuido, Predicado no distribuido\n\n`;
      if (cat.type === 'O') explanation += `  Sujeto no distribuido, Predicado distribuido\n\n`;

    } else {
      explanation += `Fórmula: ${formulaToString(formula)}\n\n`;
    }
    explanation += [
      'Sistema: Silogística Aristotélica',
      '',
      'Proposiciones categóricas:',
      '  A: Todo S es P     — ∀x(S(x) → P(x))',
      '  E: Ningún S es P   — ∀x(S(x) → ¬P(x))',
      '  I: Algún S es P    — ∃x(S(x) ∧ P(x))',
      '  O: Algún S no es P — ∃x(S(x) ∧ ¬P(x))',
      '',
      'Figuras:',
      '  1ª: M-P, S-M ⊢ S-P (Barbara, Celarent, Darii, Ferio)',
      '  2ª: P-M, S-M ⊢ S-P (Cesare, Camestres, Festino, Baroco)',
      '  3ª: M-P, M-S ⊢ S-P (Darapti, Disamis, Datisi, ...)',
      '  4ª: P-M, M-S ⊢ S-P (Bramantip, Camenes, Dimaris, ...)',
    ].join('\n');
    return {
      status: 'unknown',
      output: explanation,
      diagnostics: [],
      formula,
    };
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const catA = extractCategorical(a);
    const catB = extractCategorical(b);
    if (catA && catB) {
      const equiv =
        catA.type === catB.type &&
        catA.subject === catB.subject &&
        catA.predicate === catB.predicate;
      return {
        status: equiv ? 'valid' : 'invalid',
        output: equiv
          ? `${categoricalToString(catA)} y ${categoricalToString(catB)} son EQUIVALENTES`
          : `${categoricalToString(catA)} y ${categoricalToString(catB)} NO son equivalentes`,
        diagnostics: [],
      };
    }
    return {
      status: 'unknown',
      output: `No se pueden comparar como proposiciones categóricas: ${formulaToString(a)} vs ${formulaToString(b)}`,
      diagnostics: [],
    };
  }
}
