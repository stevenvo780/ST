// ============================================================
// FOL Undecidability Detector
// Detects patterns known to be undecidable in first-order logic,
// provides meaningful warnings to users.
// ============================================================

import { Formula } from '../../types';

export interface UndecidabilityWarning {
  pattern: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  suggestion: string;
}

/**
 * Analyze a first-order formula for known undecidable or computationally
 * intractable patterns. Returns warnings if any are detected.
 */
export function detectUndecidable(formula: Formula): UndecidabilityWarning[] {
  const warnings: UndecidabilityWarning[] = [];

  // 1. Quantifier alternation depth
  const altDepth = quantifierAlternationDepth(formula);
  if (altDepth >= 3) {
    warnings.push({
      pattern: 'quantifier_alternation',
      description:
        `Alternación de cuantificadores de profundidad ${altDepth} (∀∃∀...) detectada. ` +
        `La satisfacibilidad de fórmulas con alternación profunda es computacionalmente extrema.`,
      severity: altDepth >= 4 ? 'critical' : 'warning',
      suggestion:
        'Considere reducir la alternación de cuantificadores o usar fragmentos decidibles (∃*, ∀∃*, Bernays-Schönfinkel).',
    });
  }

  // 2. Nested quantifiers depth
  const nestDepth = quantifierNestingDepth(formula);
  if (nestDepth >= 5) {
    warnings.push({
      pattern: 'deep_quantifier_nesting',
      description:
        `Anidamiento de cuantificadores de profundidad ${nestDepth}. ` +
        `El tableau puede requerir tiempo exponencial.`,
      severity: nestDepth >= 8 ? 'critical' : 'warning',
      suggestion: 'Simplifique la fórmula reduciendo niveles de anidamiento cuantificado.',
    });
  }

  // 3. Self-reference patterns (Gödel-like)
  if (hasSelfReference(formula)) {
    warnings.push({
      pattern: 'goedel_self_reference',
      description:
        `Posible auto-referencia detectada (patrón similar a la sentencia de Gödel). ` +
        `No existe algoritmo que pueda decidir todas las fórmulas auto-referenciales (Gödel, 1931).`,
      severity: 'critical',
      suggestion:
        'Las fórmulas auto-referenciales son inherentemente indecidibles en aritmética formal.',
    });
  }

  // 4. Function symbols with deep nesting (potential infinity)
  const fnDepth = functionNestingDepth(formula);
  if (fnDepth >= 4) {
    warnings.push({
      pattern: 'deep_function_nesting',
      description:
        `Funciones anidadas de profundidad ${fnDepth} con cuantificadores. ` +
        `Esto puede generar infinitos términos durante la instanciación.`,
      severity: fnDepth >= 6 ? 'critical' : 'warning',
      suggestion: 'Limite la profundidad de términos funcionales o use skolemización temprana.',
    });
  }

  // 5. Monadic vs polyadic predicates
  const predicateArities = collectPredicateArities(formula);
  const hasPolyadic = Array.from(predicateArities.values()).some((a) => a >= 3);
  if (hasPolyadic && altDepth >= 2) {
    warnings.push({
      pattern: 'polyadic_with_alternation',
      description:
        `Predicados con aridad ≥3 combinados con alternación de cuantificadores. ` +
        `Este fragmento es generalmente indecidible (Church, 1936).`,
      severity: 'warning',
      suggestion:
        'El fragmento monádico (aridad 1) de FOL es decidible. Considere reducir la aridad de predicados.',
    });
  }

  // 6. Detect potential infinite domain requirements
  if (requiresInfiniteDomain(formula)) {
    warnings.push({
      pattern: 'infinite_domain',
      description:
        `La fórmula parece requerir un dominio infinito para ser satisfacible. ` +
        `Solo la búsqueda en dominios finitos es decidible.`,
      severity: 'info',
      suggestion:
        'ST buscará modelos en dominios finitos crecientes. Si es válida solo en dominios infinitos, el tableau puede no terminar.',
    });
  }

  return warnings;
}

/**
 * Count the maximum quantifier alternation depth.
 * ∀∃ = 1, ∀∃∀ = 2, ∀∃∀∃ = 3, etc.
 */
function quantifierAlternationDepth(f: Formula): number {
  let maxDepth = 0;

  function walk(node: Formula, lastQ: string, depth: number): void {
    if (node.kind === 'forall' || node.kind === 'exists') {
      const currentQ = node.kind;
      const newDepth = lastQ !== '' && lastQ !== currentQ ? depth + 1 : depth;
      maxDepth = Math.max(maxDepth, newDepth);
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, currentQ, newDepth);
        }
      }
      // Also check body (second arg for forall/exists)
      if (node.args && node.args.length >= 2) {
        walk(node.args[1], currentQ, newDepth);
      }
    } else {
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, lastQ, depth);
        }
      }
    }
  }

  walk(f, '', 0);
  return maxDepth;
}

/**
 * Count the maximum quantifier nesting depth.
 */
function quantifierNestingDepth(f: Formula): number {
  let maxDepth = 0;

  function walk(node: Formula, depth: number): void {
    if (node.kind === 'forall' || node.kind === 'exists') {
      const newDepth = depth + 1;
      maxDepth = Math.max(maxDepth, newDepth);
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, newDepth);
        }
      }
    } else {
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, depth);
        }
      }
    }
  }

  walk(f, 0);
  return maxDepth;
}

/**
 * Detect self-referential patterns in formulas.
 * Looks for predicates that reference their own derivability
 * or formulas that encode their own truth conditions.
 */
function hasSelfReference(f: Formula): boolean {
  // Collect all predicate names
  const predicates = new Set<string>();
  const atoms = new Set<string>();

  function collectNames(node: Formula): void {
    if (node.kind === 'predicate' && node.name) {
      predicates.add(node.name);
    }
    if (node.kind === 'atom' && node.name) {
      atoms.add(node.name);
    }
    if (node.args) {
      for (const arg of node.args) {
        collectNames(arg);
      }
    }
  }
  collectNames(f);

  // Check for names that suggest self-reference
  const selfRefPatterns = [
    /^(provable|derivable|demostrable)/i,
    /^(truth|verdad|true_of)/i,
    /^(goedel|godel|diagonal)/i,
    /^(halts?|termina)/i,
    /^(self|auto|reflexi)/i,
  ];

  for (const name of [...predicates, ...atoms]) {
    for (const pattern of selfRefPatterns) {
      if (pattern.test(name)) return true;
    }
  }

  return false;
}

/**
 * Calculate maximum function symbol nesting depth.
 */
function functionNestingDepth(f: Formula): number {
  let maxDepth = 0;

  function walk(node: Formula, depth: number): void {
    if (node.kind === 'fn_call') {
      const newDepth = depth + 1;
      maxDepth = Math.max(maxDepth, newDepth);
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, newDepth);
        }
      }
    } else if (node.kind === 'predicate') {
      // Reset depth for predicate arguments
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, 0);
        }
      }
    } else {
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, depth);
        }
      }
    }
  }

  walk(f, 0);
  return maxDepth;
}

/**
 * Collect predicate arities.
 */
function collectPredicateArities(f: Formula): Map<string, number> {
  const arities = new Map<string, number>();

  function walk(node: Formula): void {
    if (node.kind === 'predicate' && node.name && node.args) {
      const arity = node.args.length;
      const existing = arities.get(node.name);
      if (existing === undefined || arity > existing) {
        arities.set(node.name, arity);
      }
    }
    if (node.args) {
      for (const arg of node.args) {
        walk(arg);
      }
    }
  }

  walk(f);
  return arities;
}

/**
 * Detect if a formula likely requires an infinite domain.
 * Patterns: ∀x∃y(y ≠ x), successor axioms, induction schemas.
 */
function requiresInfiniteDomain(f: Formula): boolean {
  // Look for ∀x∃y patterns where y depends on x
  let hasForallExists = false;
  let hasDisequalityPattern = false;

  function walk(node: Formula, inForall: boolean): void {
    if (node.kind === 'forall') {
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, true);
        }
      }
    } else if (node.kind === 'exists' && inForall) {
      hasForallExists = true;
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, inForall);
        }
      }
    } else {
      // Check for inequality-like patterns
      if (node.kind === 'not') {
        if (node.args?.[0]?.kind === 'atom' || node.args?.[0]?.kind === 'predicate') {
          if (hasForallExists) hasDisequalityPattern = true;
        }
      }
      if (node.args) {
        for (const arg of node.args) {
          walk(arg, inForall);
        }
      }
    }
  }

  walk(f, false);
  return hasForallExists && hasDisequalityPattern;
}
