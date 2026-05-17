// ============================================================
// ST Proof Certificate — Check-only verifier
// ============================================================
//
// El verificador NO hace búsqueda de prueba. Asume que el
// certificado declara cada paso con su regla y premisas, y se
// limita a:
//   1. validar integridad (hash + estructura);
//   2. validar acíclicidad de `depends`;
//   3. resolver premisas y delegar al `CertRuleChecker` de la regla;
//   4. comprobar que el goal aparece como conclusión.

import { canonicalize, hashCertificate, normalizeFormula } from './canonical';
import { STANDARD_RULES } from './rules';
import type { CertRuleChecker, CertStep, ProofCertificate, VerificationResult } from './types';

function detectCycle(steps: CertStep[]): string[] | null {
  const byId = new Map<string, CertStep>();
  for (const s of steps) byId.set(s.id, s);
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const s of steps) color.set(s.id, WHITE);

  let cyclePath: string[] | null = null;

  function dfs(id: string, path: string[]): boolean {
    color.set(id, GRAY);
    const step = byId.get(id);
    if (!step) return false;
    for (const dep of step.depends) {
      const cdep = color.get(dep);
      if (cdep === undefined) continue; // missing deps reportadas aparte
      if (cdep === GRAY) {
        const cycleStart = path.indexOf(dep);
        cyclePath = cycleStart >= 0 ? path.slice(cycleStart).concat(dep) : [...path, id, dep];
        return true;
      }
      if (cdep === WHITE) {
        if (dfs(dep, [...path, id])) return true;
      }
    }
    color.set(id, BLACK);
    return false;
  }

  for (const s of steps) {
    if (color.get(s.id) === WHITE) {
      if (dfs(s.id, [])) return cyclePath;
    }
  }
  return null;
}

/**
 * Verifica un certificado en modo check-only.
 *
 * Las reglas custom (parámetro `rules`) se prueban PRIMERO; si no
 * está la regla, se busca en `STANDARD_RULES`. Esto permite a
 * profiles externos extender el conjunto sin tocar el core.
 */
export async function verifyCertificate(
  cert: ProofCertificate,
  rules: Map<string, CertRuleChecker> = STANDARD_RULES,
): Promise<VerificationResult> {
  const errors: string[] = [];
  const totalSteps = cert.steps.length;
  let stepsVerified = 0;

  // 1. Versión.
  if (cert.version !== '1.0') {
    errors.push(`unsupported certificate version: ${String(cert.version)}`);
  }

  // 2. Hash.
  try {
    const expected = await hashCertificate({
      version: cert.version,
      goal: cert.goal,
      profile: cert.profile,
      axioms: cert.axioms,
      steps: cert.steps,
    });
    if (expected !== cert.hash) {
      errors.push(`hash mismatch: expected ${expected}, got ${cert.hash}`);
    }
  } catch (err) {
    errors.push(`hash computation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 3. Ids únicos.
  const seenIds = new Set<string>();
  for (const step of cert.steps) {
    if (seenIds.has(step.id)) {
      errors.push(`duplicate step id: ${step.id}`);
    }
    seenIds.add(step.id);
  }

  // 4. Referencias existentes.
  const byId = new Map<string, CertStep>();
  for (const s of cert.steps) byId.set(s.id, s);
  for (const step of cert.steps) {
    for (const dep of step.depends) {
      if (!byId.has(dep)) {
        errors.push(`step "${step.id}" depends on missing step "${dep}"`);
      }
    }
  }

  // 5. Acíclicidad.
  const cycle = detectCycle(cert.steps);
  if (cycle) {
    errors.push(`cycle detected in depends: ${cycle.join(' -> ')}`);
  }

  // 6. Orden topológico (deps deben aparecer antes que dependientes).
  const indexOf = new Map<string, number>();
  cert.steps.forEach((s, i) => indexOf.set(s.id, i));
  for (const step of cert.steps) {
    const myIdx = indexOf.get(step.id) ?? -1;
    for (const dep of step.depends) {
      const depIdx = indexOf.get(dep);
      if (depIdx !== undefined && depIdx >= myIdx) {
        errors.push(`step "${step.id}" references "${dep}" out of topological order`);
      }
    }
  }

  // 7. Goal aparece como conclusión.
  const normalizedGoal = normalizeFormula(cert.goal);
  const goalFound = cert.steps.some((s) => normalizeFormula(s.conclusion) === normalizedGoal);
  if (!goalFound && cert.steps.length > 0) {
    errors.push(`goal "${cert.goal}" not produced by any step`);
  }

  // 8. Chequeo regla a regla.
  if (!cycle) {
    for (const step of cert.steps) {
      const checker = rules.get(step.rule) ?? STANDARD_RULES.get(step.rule);
      if (!checker) {
        errors.push(`step "${step.id}": unknown rule "${step.rule}"`);
        continue;
      }
      // Resolver premisas: las conclusiones de los pasos referenciados
      // en depends, en el orden declarado. Si alguna referencia falta,
      // ya fue reportada en chequeo #4; aquí evitamos crashear.
      const premises = step.depends.map((d) => {
        const ref = byId.get(d);
        return ref ? ref.conclusion : '';
      });
      let ok: boolean;
      try {
        ok = checker(step.args, step.conclusion, premises);
      } catch (err) {
        errors.push(
          `step "${step.id}": checker for "${step.rule}" threw ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        continue;
      }
      if (!ok) {
        errors.push(
          `step "${step.id}": rule "${step.rule}" does not justify conclusion "${step.conclusion}"`,
        );
      } else {
        stepsVerified++;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stepsVerified,
    totalSteps,
  };
}

/**
 * Helper para construir un certificado "a mano" a partir de pasos
 * crudos: rellena `hash` (y opcionalmente firma) y normaliza
 * fórmulas.
 *
 * Acepta un objeto similar a `ProofCertificate` sin `hash`; las
 * fórmulas se normalizan in-place vía `canonicalize`.
 */
export { canonicalize };
