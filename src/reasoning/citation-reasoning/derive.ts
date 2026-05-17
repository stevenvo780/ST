// ============================================================
// ST Citation Reasoning — deriveWithCitations + explainProof
// ============================================================

import type {
  CitedClaim,
  CitationDerivation,
  CitationDerivationResult,
  DerivationStep,
} from './types';

/**
 * Evaluador externo que el caller provee.
 * Recibe premisas (en orden: citadas primero, luego locales), el goal y el
 * perfil lógico dominante; devuelve { valid, proof? }.
 */
export type Evaluator = (
  premises: string[],
  goal: string,
  profile: string,
) => Promise<{ valid: boolean; proof?: unknown }>;

/**
 * Escoge el perfil dominante de la derivación.
 * Si todas las citas comparten el mismo perfil, se usa ese.
 * Si hay mezcla (o no hay citas), se cae a 'classical.propositional'.
 */
function dominantProfile(
  citations: CitedClaim[],
  localFallback = 'classical.propositional',
): string {
  if (citations.length === 0) return localFallback;
  const profiles = new Set(citations.map((c) => c.profile));
  if (profiles.size === 1) {
    const first = citations[0];
    return first !== undefined ? first.profile : localFallback;
  }
  return localFallback;
}

/**
 * Ejecuta una derivación que combina premisas de documentos externos (citations)
 * con premisas locales para intentar demostrar `goal`.
 *
 * Contrato:
 * - Las citas se ordenan por `weight` descendente (mayor peso = premisa más
 *   fuerte primero). Empates se resuelven por `id` lexicográfico.
 * - El evaluador recibe: [...formulas_citadas_ordenadas, ...localPremises].
 * - Si no hay citas, la derivación es puramente local.
 * - La traza incluye un paso por cada citación y uno por cada premisa local,
 *   más el paso de conclusión.
 */
export async function deriveWithCitations(
  derivation: CitationDerivation,
  evaluator: Evaluator,
): Promise<CitationDerivationResult> {
  const { goal, citations, localPremises } = derivation;

  // Ordenar citas: peso descendente, desempate por id ascendente.
  const sortedCitations = [...citations].sort((a, b) => {
    const wa = a.weight ?? 1;
    const wb = b.weight ?? 1;
    if (wb !== wa) return wb - wa;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const profile = dominantProfile(sortedCitations);
  const allPremises = [...sortedCitations.map((c) => c.formula), ...localPremises];

  // Construir traza antes de llamar al evaluador.
  const trace: DerivationStep[] = [];

  for (const c of sortedCitations) {
    trace.push({
      step: `premisa citada: ${c.formula}`,
      cite: `${c.docId}#${c.id}`,
    });
  }

  for (const p of localPremises) {
    trace.push({ step: `premisa local: ${p}` });
  }

  const evalResult = await evaluator(allPremises, goal, profile);
  const valid = evalResult.valid;
  const proof: unknown = evalResult.proof;

  // Paso de conclusión.
  trace.push({
    step: valid
      ? `conclusión: ${goal} (válida)`
      : `conclusión: ${goal} (no derivable con las premisas dadas)`,
  });

  const explanation = buildExplanation({
    valid,
    goal,
    sortedCitations,
    localPremises,
    profile,
    proof,
  });

  return { valid, trace, explanation };
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

interface ExplanationContext {
  valid: boolean;
  goal: string;
  sortedCitations: CitedClaim[];
  localPremises: string[];
  profile: string;
  proof: unknown;
}

function buildExplanation(ctx: ExplanationContext): string {
  const { valid, goal, sortedCitations, localPremises, profile, proof } = ctx;

  const parts: string[] = [];

  if (sortedCitations.length === 0 && localPremises.length === 0) {
    parts.push(
      `No se proveyeron premisas (ni citadas ni locales). No es posible derivar "${goal}".`,
    );
    return parts.join(' ');
  }

  if (sortedCitations.length > 0) {
    const citeDesc = sortedCitations
      .map((c) => `"${c.formula}" (de ${c.docId}#${c.id})`)
      .join(', ');
    parts.push(`Premisas citadas: ${citeDesc}.`);
  } else {
    parts.push('Sin premisas citadas; derivación puramente local.');
  }

  if (localPremises.length > 0) {
    parts.push(`Premisas locales: ${localPremises.join(', ')}.`);
  }

  parts.push(`Perfil lógico utilizado: ${profile}.`);
  parts.push(`Objetivo: "${goal}".`);

  if (valid) {
    const proofNote = proof !== undefined ? ' Prueba formal disponible.' : '';
    parts.push(`Resultado: VÁLIDO.${proofNote}`);
  } else {
    parts.push(
      `Resultado: NO VÁLIDO. El objetivo no es derivable desde las premisas proporcionadas.`,
    );

    // Si hay citas sin peso o con weight=0, advertir.
    const unweighted = sortedCitations.filter((c) => (c.weight ?? 1) === 0);
    if (unweighted.length > 0) {
      const ids = unweighted.map((c) => `${c.docId}#${c.id}`).join(', ');
      parts.push(
        `ADVERTENCIA: las siguientes citas tienen peso 0 y pueden no aportar fuerza epistémica: ${ids}.`,
      );
    }

    // Advertir citas que individualmente no son válidas según el proof.
    if (sortedCitations.length > 0) {
      parts.push(
        'ADVERTENCIA: una o más premisas citadas pueden no estar probadas en su contexto original.',
      );
    }
  }

  return parts.join(' ');
}

/**
 * Genera una explicación en lenguaje natural de una prueba formal,
 * referenciando las citas que participaron como premisas.
 *
 * Si `proof` es null/undefined devuelve un mensaje genérico.
 */
export function explainProof(proof: unknown, citations: CitedClaim[]): string {
  if (proof === null || proof === undefined) {
    return 'No hay prueba formal disponible para explicar.';
  }

  const parts: string[] = ['Resumen de la prueba:'];

  if (citations.length > 0) {
    const citeSummary = citations
      .map((c) => `  - [${c.docId}#${c.id}] "${c.formula}" (perfil: ${c.profile})`)
      .join('\n');
    parts.push(`Premisas externas utilizadas:\n${citeSummary}`);
  } else {
    parts.push('No se utilizaron premisas externas (derivación local).');
  }

  // Intentar mostrar pasos si el proof tiene forma conocida.
  if (typeof proof === 'object' && proof !== null && 'steps' in proof) {
    const steps = (proof as { steps: unknown[] }).steps;
    if (Array.isArray(steps) && steps.length > 0) {
      const stepsDesc = steps
        .map((s, i) => {
          if (typeof s === 'object' && s !== null && 'formula' in s) {
            return `  ${i + 1}. ${String((s as { formula: unknown }).formula)}`;
          }
          return `  ${i + 1}. ${String(s)}`;
        })
        .join('\n');
      parts.push(`Pasos formales:\n${stepsDesc}`);
    }
  } else {
    parts.push(`Datos de la prueba: ${JSON.stringify(proof)}`);
  }

  return parts.join('\n');
}
