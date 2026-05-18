// ============================================================
// Bayesian Inference — Algorithms
// ============================================================
//
// - jointProbability: producto P(Xᵢ | parents(Xᵢ)) sobre asignación completa.
// - variableElimination: P(Q | E) marginalizando variables no-evidencia.
// - query: alias semántico de variableElimination.
// - mostProbableExplanation: MAP/MPE sobre variables no-evidencia.

import {
  assignmentKey,
  buildParentKey,
  factorFromCPT,
  maxOut,
  multiplyFactors,
  normalizeFactor,
  parseAssignmentKey,
  restrictFactor,
  sumOut,
  variableDomainsOf,
  type Factor,
} from './factor';
import type { BayesianNetwork, CPT, Evidence, PosteriorDistribution } from './types';

// ── Validación ───────────────────────────────────────────────

function indexCPTs(net: BayesianNetwork): Map<string, CPT> {
  const m = new Map<string, CPT>();
  for (const c of net.cpts) m.set(c.variable, c);
  return m;
}

function assertVariableExists(net: BayesianNetwork, name: string): void {
  if (!net.variables.some((v) => v.name === name)) {
    throw new Error(`Variable "${name}" no existe en la red`);
  }
}

function assertEvidenceValid(net: BayesianNetwork, evidence: Evidence): void {
  for (const [k, v] of Object.entries(evidence)) {
    const dvar = net.variables.find((x) => x.name === k);
    if (!dvar) throw new Error(`Evidencia "${k}" no existe en la red`);
    if (!dvar.values.includes(v)) {
      throw new Error(`Evidencia "${k}=${v}" fuera del dominio [${dvar.values.join(', ')}]`);
    }
  }
}

// ── jointProbability ─────────────────────────────────────────

export function jointProbability(net: BayesianNetwork, assignment: Record<string, string>): number {
  // Toda variable de la red debe estar asignada y dentro del dominio.
  for (const v of net.variables) {
    const val = assignment[v.name];
    if (val === undefined) {
      throw new Error(`Asignación incompleta: falta "${v.name}"`);
    }
    if (!v.values.includes(val)) {
      throw new Error(`Valor "${val}" fuera del dominio de "${v.name}" [${v.values.join(', ')}]`);
    }
  }
  const cptIndex = indexCPTs(net);
  let p = 1;
  for (const v of net.variables) {
    const cpt = cptIndex.get(v.name);
    if (!cpt) throw new Error(`Sin CPT para "${v.name}"`);
    const parentKey = buildParentKey(cpt.parents, assignment);
    const row = cpt.entries[parentKey];
    if (!row) {
      throw new Error(`CPT incompleta: falta fila "${parentKey}" para "${v.name}"`);
    }
    const prob = row[assignment[v.name]];
    if (prob === undefined) {
      throw new Error(`CPT incompleta: sin entrada para "${v.name}=${assignment[v.name]}"`);
    }
    p *= prob;
  }
  return p;
}

// ── Heurística de orden de eliminación ───────────────────────
//
// Min-fill simple: eliminar primero la variable cuya remoción
// agrega menos aristas al gráfico residual. Implementación O(n²)
// — suficiente para redes pequeñas. Para redes triviales con
// pocas variables el costo es despreciable.

function eliminationOrder(toEliminate: string[], factors: Factor[]): string[] {
  const remaining = new Set(toEliminate);
  const order: string[] = [];
  const factorsAlive = factors.slice();
  while (remaining.size > 0) {
    let best: string | null = null;
    let bestCost = Infinity;
    for (const v of remaining) {
      const involved = factorsAlive.filter((f) => f.variables.includes(v));
      const merged = new Set<string>();
      for (const f of involved) for (const x of f.variables) merged.add(x);
      merged.delete(v);
      const cost = merged.size; // proxy del tamaño del cluster
      if (cost < bestCost) {
        bestCost = cost;
        best = v;
      }
    }
    if (best === null) break;
    order.push(best);
    remaining.delete(best);
    // simular eliminación: reemplazar factores involucrados por uno fusionado
    const involved = factorsAlive.filter((f) => f.variables.includes(best));
    const others = factorsAlive.filter((f) => !f.variables.includes(best));
    const mergedVars = new Set<string>();
    const mergedDomains: Record<string, string[]> = {};
    for (const f of involved) {
      for (const v of f.variables) {
        if (v === best) continue;
        mergedVars.add(v);
        mergedDomains[v] = f.domains[v] ?? [];
      }
    }
    const fakeFactor: Factor = {
      variables: Array.from(mergedVars).sort(),
      domains: mergedDomains,
      values: new Map(),
    };
    factorsAlive.length = 0;
    factorsAlive.push(...others, fakeFactor);
  }
  return order;
}

// ── variableElimination ──────────────────────────────────────

export function variableElimination(
  net: BayesianNetwork,
  queryVar: string,
  evidence: Evidence = {},
): PosteriorDistribution {
  assertVariableExists(net, queryVar);
  assertEvidenceValid(net, evidence);
  if (queryVar in evidence) {
    // Si la query está observada, el posterior es degenerado.
    const qVar = net.variables.find((v) => v.name === queryVar);
    if (qVar === undefined) throw new Error(`variableElimination: variable "${queryVar}" no encontrada`);
    const qDomain = qVar.values;
    const dist: Record<string, string> | Record<string, number> = {};
    const out: Record<string, number> = {};
    for (const val of qDomain) out[val] = val === evidence[queryVar] ? 1 : 0;
    void dist;
    return { variable: queryVar, distribution: out };
  }
  const domains = variableDomainsOf(net);
  // 1. Construir factores desde CPTs, restringidos por evidencia.
  let factors: Factor[] = net.cpts.map((cpt) => {
    const f = factorFromCPT(cpt, domains);
    return restrictFactor(f, evidence);
  });
  // 2. Determinar variables a eliminar (todas menos query y evidencia).
  const toEliminate = net.variables
    .map((v) => v.name)
    .filter((n) => n !== queryVar && !(n in evidence));
  const order = eliminationOrder(toEliminate, factors);
  // 3. Eliminar cada variable: multiplicar todos los factores que la contengan
  //    y sumar-marginalizar.
  for (const v of order) {
    const involved = factors.filter((f) => f.variables.includes(v));
    const others = factors.filter((f) => !f.variables.includes(v));
    if (involved.length === 0) continue;
    let product = involved[0];
    for (let i = 1; i < involved.length; i++) {
      product = multiplyFactors(product, involved[i]);
    }
    const reduced = sumOut(product, v);
    factors = [...others, reduced];
  }
  // 4. Multiplicar los factores restantes (todos sobre queryVar tras la elim).
  let result = factors[0];
  for (let i = 1; i < factors.length; i++) {
    result = multiplyFactors(result, factors[i]);
  }
  // 5. Normalizar.
  const normalized = normalizeFactor(result);
  // 6. Extraer la distribución sobre la query.
  const distribution: Record<string, number> = {};
  const qVarDef = net.variables.find((v) => v.name === queryVar);
  if (qVarDef === undefined) throw new Error(`variableElimination: variable "${queryVar}" no encontrada`);
  const qDomain = qVarDef.values;
  for (const val of qDomain) {
    const key = assignmentKey([queryVar], { [queryVar]: val });
    distribution[val] = normalized.values.get(key) ?? 0;
  }
  return { variable: queryVar, distribution };
}

// ── query (alias semántico) ──────────────────────────────────

export function query(
  net: BayesianNetwork,
  queryVar: string,
  evidence: Evidence = {},
): PosteriorDistribution {
  return variableElimination(net, queryVar, evidence);
}

// ── Most Probable Explanation (MPE / MAP completo) ───────────
//
// Devuelve la asignación de máxima probabilidad sobre todas las
// variables no observadas, dada la evidencia. Implementación:
// max-product variable elimination con tracking de backpointers.

export function mostProbableExplanation(
  net: BayesianNetwork,
  evidence: Evidence = {},
): Record<string, string> {
  assertEvidenceValid(net, evidence);
  const domains = variableDomainsOf(net);
  let factors: Factor[] = net.cpts.map((cpt) => {
    const f = factorFromCPT(cpt, domains);
    return restrictFactor(f, evidence);
  });
  const toEliminate = net.variables.map((v) => v.name).filter((n) => !(n in evidence));
  // Para reconstruir el argmax necesitamos eliminar en un orden
  // determinístico y guardar, en cada paso, la mejor asignación
  // de la variable eliminada como función de las restantes.
  const order = eliminationOrder(toEliminate, factors);
  interface Step {
    variable: string;
    contextVars: string[];
    chooser: Map<string, string>;
  }
  const steps: Step[] = [];
  for (const v of order) {
    const involved = factors.filter((f) => f.variables.includes(v));
    const others = factors.filter((f) => !f.variables.includes(v));
    if (involved.length === 0) continue;
    let product = involved[0];
    for (let i = 1; i < involved.length; i++) {
      product = multiplyFactors(product, involved[i]);
    }
    const contextVars = product.variables.filter((x) => x !== v);
    // Construir chooser: para cada asignación de contextVars,
    // qué valor de v maximiza el producto.
    const chooser = new Map<string, string>();
    const best = new Map<string, number>();
    for (const [key, val] of product.values) {
      const assign = parseAssignmentKey(key);
      const ctx: Record<string, string> = {};
      for (const c of contextVars) ctx[c] = assign[c] ?? '';
      const ctxKey = assignmentKey(contextVars, ctx);
      const prev = best.get(ctxKey);
      if (prev === undefined || val > prev) {
        best.set(ctxKey, val);
        chooser.set(ctxKey, assign[v]);
      }
    }
    steps.push({ variable: v, contextVars, chooser });
    const { factor: reduced } = maxOut(product, v);
    factors = [...others, reduced];
  }
  // Tras eliminar todas las variables no-evidencia, queda un
  // factor escalar (sin variables). La asignación óptima se
  // reconstruye recorriendo `steps` en orden inverso.
  const assignment: Record<string, string> = { ...evidence };
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    const ctx: Record<string, string> = {};
    for (const c of step.contextVars) {
      const val = assignment[c];
      if (val === undefined) {
        // No debería ocurrir si el orden es válido — defensa.
        ctx[c] = '';
      } else {
        ctx[c] = val;
      }
    }
    const ctxKey = assignmentKey(step.contextVars, ctx);
    const chosen = step.chooser.get(ctxKey);
    if (chosen !== undefined) {
      assignment[step.variable] = chosen;
    } else {
      // Fallback: primer valor del dominio. Solo posible con CPT degenerada.
      const dom = domains[step.variable];
      if (dom && dom.length > 0) assignment[step.variable] = dom[0] ?? '';
    }
  }
  return assignment;
}
