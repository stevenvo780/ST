import { Formula } from '../types';
import { ProfileRegistry } from '../profiles/interface';

export function compareAcrossSystems(
  formula: Formula,
  registry: ProfileRegistry,
): Record<string, string> {
  const results: Record<string, string> = {};

  // Define systems to check in order
  const systemsToCheck = [
    'classical.propositional',
    'intuitionistic.propositional',
    'paraconsistent.belnap',
    'modal.k',
    'modal.t',
    'modal.s4',
    'modal.s5',
    'deontic.standard',
    'epistemic.s5',
  ];

  for (const sysName of systemsToCheck) {
    const profile = registry.get(sysName);
    if (!profile) continue;

    try {
      // If there are quantifiers, many propositional systems will return well-formed errors
      if (profile.checkWellFormed(formula).length > 0) {
        results[sysName] = 'N/A (Sintaxis no compatible)';
        continue;
      }

      const res = profile.checkValid(formula);
      if (res.status === 'valid') {
        results[sysName] = 'VÁLIDA';
      } else {
        // Also check if satisfiable in Belnap for instance
        if (sysName === 'paraconsistent.belnap') {
          const satRes = profile.checkSatisfiable(formula);
          if (satRes.status === 'satisfiable') {
            results[sysName] = 'NO VÁLIDA (pero SATISFACIBLE)';
            continue;
          }
        }
        results[sysName] = 'NO VÁLIDA';
      }
    } catch {
      results[sysName] = 'Error computacional';
    }
  }

  return results;
}
