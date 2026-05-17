// ============================================================
// Bayesian Inference — Factor representation
// ============================================================
//
// Un Factor representa una función φ(X₁,…,Xₙ) → ℝ⁺ sobre un
// conjunto de variables discretas. Las CPTs se convierten a
// factores; los algoritmos de variable elimination producen
// y consumen factores con tres operaciones: restricción por
// evidencia, producto, y suma-marginalización.

import type { BayesianNetwork, CPT, Evidence } from './types';

export interface Factor {
  variables: string[]; // orden canónico (asc) usado para iterar
  domains: Record<string, string[]>; // dominio por variable presente en el factor
  // values: indexado por la asignación serializada (clave estable).
  // Para evitar overhead se guarda un Map<key, number>.
  values: Map<string, number>;
}

// ── Helpers de claves ─────────────────────────────────────────

export function assignmentKey(variables: string[], assignment: Record<string, string>): string {
  // Asume `variables` ya está ordenado consistentemente.
  const parts: string[] = [];
  for (const v of variables) {
    parts.push(`${v}=${assignment[v]}`);
  }
  return parts.join('|');
}

export function parseParentKey(parents: string[], key: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (parents.length === 0) return out;
  const parts = key.split('|');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq);
    const v = part.slice(eq + 1);
    out[k] = v;
  }
  return out;
}

// Construye la clave canónica de padres en el orden declarado por el CPT.
export function buildParentKey(parents: string[], assignment: Record<string, string>): string {
  if (parents.length === 0) return '';
  const parts: string[] = [];
  for (const p of parents) {
    parts.push(`${p}=${assignment[p]}`);
  }
  return parts.join('|');
}

// ── Iteración cartesiana sobre dominios ──────────────────────

export function* iterateAssignments(
  variables: string[],
  domains: Record<string, string[]>,
): Generator<Record<string, string>> {
  if (variables.length === 0) {
    yield {};
    return;
  }
  const sizes = variables.map((v) => domains[v]?.length ?? 0);
  if (sizes.some((s) => s === 0)) return;
  const idx = variables.map(() => 0);
  while (true) {
    const a: Record<string, string> = {};
    for (let i = 0; i < variables.length; i++) {
      const v = variables[i];
      const dom = domains[v];
      a[v] = dom[idx[i]]!;
    }
    yield a;
    // incrementar como contador
    let k = variables.length - 1;
    while (k >= 0) {
      idx[k] = (idx[k] ?? 0) + 1;
      if (idx[k] < sizes[k]) break;
      idx[k] = 0;
      k--;
    }
    if (k < 0) break;
  }
}

// ── Construcción de factor desde CPT ─────────────────────────

export function factorFromCPT(cpt: CPT, variableDomains: Record<string, string[]>): Factor {
  const factorVars = [cpt.variable, ...cpt.parents].slice().sort();
  const domains: Record<string, string[]> = {};
  for (const v of factorVars) {
    const dom = variableDomains[v];
    if (!dom) throw new Error(`Variable "${v}" sin dominio definido`);
    domains[v] = dom;
  }
  const values = new Map<string, number>();
  for (const assign of iterateAssignments(factorVars, domains)) {
    const parentKey = buildParentKey(cpt.parents, assign);
    const row = cpt.entries[parentKey];
    if (!row) {
      // Fila ausente: probabilidad 0 (red mal definida — pero no fallamos aquí).
      values.set(assignmentKey(factorVars, assign), 0);
      continue;
    }
    const p = row[assign[cpt.variable]];
    values.set(assignmentKey(factorVars, assign), p ?? 0);
  }
  return { variables: factorVars, domains, values };
}

// ── Restricción por evidencia ────────────────────────────────

export function restrictFactor(factor: Factor, evidence: Evidence): Factor {
  const evVars = factor.variables.filter((v) => v in evidence);
  if (evVars.length === 0) return factor;
  const newVars = factor.variables.filter((v) => !(v in evidence));
  const newDomains: Record<string, string[]> = {};
  for (const v of newVars) newDomains[v] = factor.domains[v]!;
  const values = new Map<string, number>();
  for (const [key, val] of factor.values) {
    const assign = parseAssignmentKey(key);
    let consistent = true;
    for (const ev of evVars) {
      if (assign[ev] !== evidence[ev]) {
        consistent = false;
        break;
      }
    }
    if (!consistent) continue;
    const projected: Record<string, string> = {};
    for (const v of newVars) projected[v] = assign[v]!;
    values.set(assignmentKey(newVars, projected), val);
  }
  return { variables: newVars, domains: newDomains, values };
}

export function parseAssignmentKey(key: string): Record<string, string> {
  if (key === '') return {};
  const out: Record<string, string> = {};
  for (const part of key.split('|')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    out[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return out;
}

// ── Producto de factores ─────────────────────────────────────

export function multiplyFactors(a: Factor, b: Factor): Factor {
  const varSet = new Set<string>([...a.variables, ...b.variables]);
  const newVars = Array.from(varSet).sort();
  const domains: Record<string, string[]> = {};
  for (const v of newVars) {
    domains[v] = a.domains[v] ?? b.domains[v];
  }
  const values = new Map<string, number>();
  for (const assign of iterateAssignments(newVars, domains)) {
    const aKey = assignmentKey(a.variables, projectAssignment(assign, a.variables));
    const bKey = assignmentKey(b.variables, projectAssignment(assign, b.variables));
    const va = a.values.get(aKey) ?? 0;
    const vb = b.values.get(bKey) ?? 0;
    values.set(assignmentKey(newVars, assign), va * vb);
  }
  return { variables: newVars, domains, values };
}

function projectAssignment(assign: Record<string, string>, vars: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of vars) out[v] = assign[v]!;
  return out;
}

// ── Suma-marginalización ─────────────────────────────────────

export function sumOut(factor: Factor, variable: string): Factor {
  if (!factor.variables.includes(variable)) return factor;
  const newVars = factor.variables.filter((v) => v !== variable);
  const newDomains: Record<string, string[]> = {};
  for (const v of newVars) newDomains[v] = factor.domains[v]!;
  const values = new Map<string, number>();
  for (const [key, val] of factor.values) {
    const assign = parseAssignmentKey(key);
    const projected: Record<string, string> = {};
    for (const v of newVars) projected[v] = assign[v]!;
    const pKey = assignmentKey(newVars, projected);
    values.set(pKey, (values.get(pKey) ?? 0) + val);
  }
  return { variables: newVars, domains: newDomains, values };
}

// ── Max-marginalización (para MPE) ───────────────────────────
//
// Devuelve dos factores: el factor max-marginalizado y un mapa
// backpointer key→valor(varEliminada) usado para reconstruir el
// argmax.

export function maxOut(
  factor: Factor,
  variable: string,
): { factor: Factor; backpointer: Map<string, string> } {
  if (!factor.variables.includes(variable)) {
    return { factor, backpointer: new Map() };
  }
  const newVars = factor.variables.filter((v) => v !== variable);
  const newDomains: Record<string, string[]> = {};
  for (const v of newVars) newDomains[v] = factor.domains[v]!;
  const values = new Map<string, number>();
  const backpointer = new Map<string, string>();
  for (const [key, val] of factor.values) {
    const assign = parseAssignmentKey(key);
    const projected: Record<string, string> = {};
    for (const v of newVars) projected[v] = assign[v]!;
    const pKey = assignmentKey(newVars, projected);
    const prev = values.get(pKey);
    if (prev === undefined || val > prev) {
      values.set(pKey, val);
      backpointer.set(`${pKey}::${variable}`, assign[variable]);
    }
  }
  return {
    factor: { variables: newVars, domains: newDomains, values },
    backpointer,
  };
}

// ── Normalización ────────────────────────────────────────────

export function normalizeFactor(factor: Factor): Factor {
  let total = 0;
  for (const v of factor.values.values()) total += v;
  if (total === 0) {
    // Evidencia inconsistente: devolver factor uniforme nulo.
    return factor;
  }
  const values = new Map<string, number>();
  for (const [k, v] of factor.values) values.set(k, v / total);
  return { variables: factor.variables, domains: factor.domains, values };
}

// ── Utilidades de red ────────────────────────────────────────

export function variableDomainsOf(net: BayesianNetwork): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const v of net.variables) out[v.name] = v.values;
  return out;
}
