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

/**
 * Returns distribution info for a categorical proposition (#21)
 */
function getDistribution(c: CategoricalProp): string {
  switch (c.type) {
    case 'A':
      return `S(+) P(-)`; // Subject distributed, Predicate not
    case 'E':
      return `S(+) P(+)`; // Both distributed
    case 'I':
      return `S(-) P(-)`; // Neither distributed
    case 'O':
      return `S(-) P(+)`; // Predicate distributed
  }
}

// ── Validación de silogismos ────────────────────────────────

function checkSyllogism(
  premise1: CategoricalProp,
  premise2: CategoricalProp,
  conclusion: CategoricalProp,
): SyllogismForm | null {
  // S = subject of conclusion, P = predicate of conclusion
  const S = conclusion.subject;
  const P = conclusion.predicate;

  // M = the term that appears in both premises but not in the conclusion
  const p1Terms = [premise1.subject, premise1.predicate];
  const p2Terms = [premise2.subject, premise2.predicate];
  const middleCandidates = p1Terms.filter((t) => p2Terms.includes(t) && t !== S && t !== P);

  if (middleCandidates.length === 0) return null;
  const M = middleCandidates[0];

  // Determine figure by position of the middle term M
  // Figure 1: M-P, S-M (M is subject of P1, predicate of P2)
  // Figure 2: P-M, S-M (M is predicate of P1, predicate of P2)
  // Figure 3: M-P, M-S (M is subject of P1, subject of P2)
  // Figure 4: P-M, M-S (M is predicate of P1, subject of P2)
  let figure: number;
  const mIsSubjP1 = premise1.subject === M;
  const mIsSubjP2 = premise2.subject === M;

  if (mIsSubjP1 && !mIsSubjP2) {
    figure = 1; // M-?, ?-M
  } else if (!mIsSubjP1 && !mIsSubjP2) {
    figure = 2; // ?-M, ?-M
  } else if (mIsSubjP1 && mIsSubjP2) {
    figure = 3; // M-?, M-?
  } else {
    figure = 4; // ?-M, M-?
  }

  // Verify P1 relates M and P correctly, P2 relates S and M correctly
  // Figure 1: P1 must contain M (subj) and P (pred), P2 must contain S (subj) and M (pred)
  // Figure 2: P1 must contain P (subj) and M (pred), P2 must contain S (subj) and M (pred)
  // Figure 3: P1 must contain M (subj) and P (pred), P2 must contain M (subj) and S (pred)
  // Figure 4: P1 must contain P (subj) and M (pred), P2 must contain M (subj) and S (pred)
  let valid = false;
  switch (figure) {
    case 1:
      valid =
        premise1.subject === M &&
        premise1.predicate === P &&
        premise2.subject === S &&
        premise2.predicate === M;
      break;
    case 2:
      valid =
        premise1.subject === P &&
        premise1.predicate === M &&
        premise2.subject === S &&
        premise2.predicate === M;
      break;
    case 3:
      valid =
        premise1.subject === M &&
        premise1.predicate === P &&
        premise2.subject === M &&
        premise2.predicate === S;
      break;
    case 4:
      valid =
        premise1.subject === P &&
        premise1.predicate === M &&
        premise2.subject === M &&
        premise2.predicate === S;
      break;
  }

  if (!valid) return null;

  // Now check for a matching valid syllogism with the correct figure
  for (const syl of VALID_SYLLOGISMS) {
    if (
      syl.figure === figure &&
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

  prove(goal: Formula, theory: Theory, premises?: string[]): RunResult {
    const useRestricted = premises !== undefined && premises.length > 0;
    const diagnostics: Diagnostic[] = [];
    let axioms: [string, Formula][];
    if (useRestricted) {
      axioms = [];
      for (const n of premises) {
        const f = theory.axioms.get(n) || theory.theorems.get(n);
        if (f) axioms.push([n, f]);
        else
          diagnostics.push({
            severity: 'warning',
            message: `Premisa '${n}' no encontrada en la teoría; será ignorada en prove`,
          });
      }
    } else {
      axioms = Array.from(theory.axioms.entries());
    }
    const conclusion = extractCategorical(goal);
    if (!conclusion || axioms.length < 2) {
      return {
        status: 'unknown',
        output: 'Se necesitan al menos 2 premisas categóricas para un silogismo',
        diagnostics,
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
              diagnostics,
              formula: goal,
            };
          }
        }
      }
    }

    return {
      status: 'unknown',
      output: `No se encontró silogismo válido para derivar: ${formulaToString(goal)}`,
      diagnostics,
      formula: goal,
    };
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const conclusion = extractCategorical(goal);

    // Entimema detection: only 1 premise (#9)
    if (conclusion && premises.length === 1) {
      const premName = premises[0];
      const premF = theory.axioms.get(premName) || theory.theorems.get(premName);
      const prem = premF ? extractCategorical(premF) : null;
      if (prem) {
        let out = `⚠ Solo se proporcionó 1 premisa — posible entimema\n`;
        out += `  Premisa dada: ${categoricalToString(prem)}\n`;
        out += `  Conclusión buscada: ${categoricalToString(conclusion)}\n`;
        out += `  Premisa faltante para completar silogismo:\n`;

        // Try to find valid completions
        const completions: string[] = [];
        const types: CategoricalType[] = ['A', 'E', 'I', 'O'];
        // Get potential middle term
        const allTerms = new Set([
          prem.subject,
          prem.predicate,
          conclusion.subject,
          conclusion.predicate,
        ]);
        for (const middle of allTerms) {
          for (const t2 of allTerms) {
            if (t2 === middle) continue;
            for (const type of types) {
              const candidate: CategoricalProp = { type, subject: t2, predicate: middle };
              // Try both orderings
              const syl1 = checkSyllogism(prem, candidate, conclusion);
              const syl2 = checkSyllogism(candidate, prem, conclusion);
              if (syl1)
                completions.push(
                  `"${categoricalToString(candidate)}" → ${syl1.name} (${syl1.premises.join('')}-${syl1.figure})`,
                );
              if (syl2)
                completions.push(
                  `"${categoricalToString(candidate)}" → ${syl2.name} (${syl2.premises.join('')}-${syl2.figure})`,
                );
            }
          }
        }

        if (completions.length > 0) {
          for (const c of completions.slice(0, 3)) {
            out += `    Opción: ${c}\n`;
          }
        } else {
          out += `    No se encontró premisa que complete un silogismo válido.\n`;
        }

        return { status: 'unknown', output: out, diagnostics: [], formula: goal };
      }
    }

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
          // Distribution analysis per premise (#21)
          const distP1 = getDistribution(premiseFormulas[i][1]);
          const distP2 = getDistribution(premiseFormulas[j][1]);
          const distC = getDistribution(conclusion);
          let distOutput = `DERIVADO por ${syl.name} (Figura ${syl.figure})\n`;
          distOutput += `  ${premiseFormulas[i][0]}: ${categoricalToString(premiseFormulas[i][1])} — ${distP1}\n`;
          distOutput += `  ${premiseFormulas[j][0]}: ${categoricalToString(premiseFormulas[j][1])} — ${distP2}\n`;
          distOutput += `  ∴ ${categoricalToString(conclusion)} — ${distC}`;
          return {
            status: 'provable',
            output: distOutput,
            diagnostics: [],
            formula: goal,
          };
        }
      }
    }

    return {
      status: 'unknown',
      output: `No se encontró derivación por silogismo válido (incompletitud de la heurística)`,
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

      const aProp = categoricalToString({
        type: 'A',
        subject: cat.subject,
        predicate: cat.predicate,
      });
      const eProp = categoricalToString({
        type: 'E',
        subject: cat.subject,
        predicate: cat.predicate,
      });
      const iProp = categoricalToString({
        type: 'I',
        subject: cat.subject,
        predicate: cat.predicate,
      });
      const oProp = categoricalToString({
        type: 'O',
        subject: cat.subject,
        predicate: cat.predicate,
      });

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
      if (cat.type === 'A')
        explanation += `  Sujeto (${cat.subject}): distribuido (+), Predicado (${cat.predicate}): no distribuido (-)\n\n`;
      if (cat.type === 'E')
        explanation += `  Sujeto (${cat.subject}): distribuido (+), Predicado (${cat.predicate}): distribuido (+)\n\n`;
      if (cat.type === 'I')
        explanation += `  Sujeto (${cat.subject}): no distribuido (-), Predicado (${cat.predicate}): no distribuido (-)\n\n`;
      if (cat.type === 'O')
        explanation += `  Sujeto (${cat.subject}): no distribuido (-), Predicado (${cat.predicate}): distribuido (+)\n\n`;

      // Immediate inferences (#8)
      explanation += `Inferencias inmediatas:\n`;
      if (cat.type === 'A') {
        explanation += `  Conversión (por limitación): "Algún ${cat.predicate} es ${cat.subject}" (I)\n`;
        explanation += `  Obversión: "Ningún ${cat.subject} es no-${cat.predicate}" (E)\n`;
        explanation += `  Contraposición: "Todo no-${cat.predicate} es no-${cat.subject}" (A)\n\n`;
      } else if (cat.type === 'E') {
        explanation += `  Conversión (simple): "Ningún ${cat.predicate} es ${cat.subject}" (E)\n`;
        explanation += `  Obversión: "Todo ${cat.subject} es no-${cat.predicate}" (A)\n`;
        explanation += `  Contraposición: "Algún no-${cat.predicate} no es no-${cat.subject}" (O)\n\n`;
      } else if (cat.type === 'I') {
        explanation += `  Conversión (simple): "Algún ${cat.predicate} es ${cat.subject}" (I)\n`;
        explanation += `  Obversión: "Algún ${cat.subject} no es no-${cat.predicate}" (O)\n`;
        explanation += `  Contraposición: No válida para I\n\n`;
      } else if (cat.type === 'O') {
        explanation += `  Conversión: No válida para O\n`;
        explanation += `  Obversión: "Algún ${cat.subject} es no-${cat.predicate}" (I)\n`;
        explanation += `  Contraposición: "Algún no-${cat.predicate} no es no-${cat.subject}" (O)\n\n`;
      }
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
