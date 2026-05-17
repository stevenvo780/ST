// ============================================================
// ST Description Logic — Tableau de decisión para ALC
// ============================================================
// Procedimiento estándar de tableau con blocking (subset blocking)
// para garantizar terminación con TBox cíclica.
//
// Estado de la rama:
//   - individuals: id -> Set<conceptHash> (labels)
//   - roles:       roleName -> Array<[from, to]>
//   - blocked:     id -> id  (ancestro que bloquea, si aplica)
//
// Reglas:
//   ⊓: añade ambos children
//   ⊔: bifurca
//   ∃R.C: si no hay R-sucesor con C, crea fresh y, R(x,y), C(y)
//   ∀R.C: para todo R(x,y), añade C(y)
//
// Clash: A ∈ labels(x) y ¬A ∈ labels(x); o ⊥ ∈ labels(x).
//
// TBox internalization: cada axioma C ⊑ D se convierte en
// el concepto axiom = ¬C ⊔ D, que se añade a cada individuo
// (existente y futuro). C ≡ D se desdobla en C ⊑ D y D ⊑ C.
// ============================================================

import { DLConcept, DLKnowledgeBase, TOP, BOTTOM, atomic, not, and, or } from './types';
import { toNNF, conceptHash, conceptToString } from './nnf';

// ── Estado interno ──────────────────────────────────────────

interface Individual {
  /** Identificador de nodo (puede ser un individuo de la ABox o un fresh anonymous). */
  id: string;
  /** Etiquetas (conceptos NNF) ya asertados sobre el individuo. */
  labels: Map<string, DLConcept>;
  /** Padre en el árbol generado por expansiones ∃. Undefined para los originales. */
  parent?: string;
}

interface Branch {
  individuals: Map<string, Individual>;
  /** roleName -> array de pares [from, to]. */
  roleAssertions: Map<string, Array<[string, string]>>;
  /** Axiomas TBox internalizados (lista de conceptos NNF a aplicar a cada individuo). */
  tboxAxioms: DLConcept[];
  /** Conjuntos disyuntivos pendientes: cada uno es [indId, disjunct[]] (para ⊔). */
  pendingOr: Array<{ indId: string; disjuncts: DLConcept[]; sourceHash: string }>;
  /** Marcas de "ya procesé este ⊔ para esta rama" para evitar re-bifurcar. */
  processedOr: Set<string>;
  freshCounter: number;
}

const MAX_INDIVIDUALS = 5000;

// ── Helpers ─────────────────────────────────────────────────

function makeBranch(): Branch {
  return {
    individuals: new Map(),
    roleAssertions: new Map(),
    tboxAxioms: [],
    pendingOr: [],
    processedOr: new Set(),
    freshCounter: 0,
  };
}

function cloneBranch(b: Branch): Branch {
  const c: Branch = {
    individuals: new Map(),
    roleAssertions: new Map(),
    tboxAxioms: [...b.tboxAxioms],
    pendingOr: b.pendingOr.map((p) => ({
      indId: p.indId,
      disjuncts: [...p.disjuncts],
      sourceHash: p.sourceHash,
    })),
    processedOr: new Set(b.processedOr),
    freshCounter: b.freshCounter,
  };
  for (const [k, ind] of b.individuals) {
    c.individuals.set(k, {
      id: ind.id,
      labels: new Map(ind.labels),
      parent: ind.parent,
    });
  }
  for (const [role, pairs] of b.roleAssertions) {
    c.roleAssertions.set(
      role,
      pairs.map((p) => [p[0], p[1]]),
    );
  }
  return c;
}

function getOrCreateIndividual(branch: Branch, id: string, parent?: string): Individual {
  let ind = branch.individuals.get(id);
  if (!ind) {
    ind = { id, labels: new Map(), parent };
    branch.individuals.set(id, ind);
  }
  return ind;
}

function freshIndividual(branch: Branch, parent: string): Individual {
  const id = `_x${branch.freshCounter++}`;
  return getOrCreateIndividual(branch, id, parent);
}

function roleSuccessors(branch: Branch, role: string, from: string): string[] {
  const pairs = branch.roleAssertions.get(role);
  if (!pairs) return [];
  const out: string[] = [];
  for (const [a, b] of pairs) if (a === from) out.push(b);
  return out;
}

function addRoleAssertion(branch: Branch, role: string, from: string, to: string): void {
  let pairs = branch.roleAssertions.get(role);
  if (!pairs) {
    pairs = [];
    branch.roleAssertions.set(role, pairs);
  }
  // de-dup
  for (const [a, b] of pairs) if (a === from && b === to) return;
  pairs.push([from, to]);
}

/**
 * Subset blocking: un individuo anónimo x está bloqueado si existe un ancestro y
 * (a través de la cadena parent → parent) tal que labels(x) ⊆ labels(y).
 * Solo bloquea para conceptos generados por ∃ (no aplica a individuos de la ABox).
 */
function isBlocked(branch: Branch, indId: string): boolean {
  const ind = branch.individuals.get(indId);
  if (!ind || !ind.parent) return false;
  // Solo fresh individuals son bloqueables.
  if (!indId.startsWith('_x')) return false;
  let ancestorId = ind.parent;
  while (ancestorId) {
    const anc = branch.individuals.get(ancestorId);
    if (!anc) break;
    if (subsetOf(ind.labels, anc.labels)) return true;
    ancestorId = anc.parent || '';
  }
  return false;
}

function subsetOf(a: Map<string, DLConcept>, b: Map<string, DLConcept>): boolean {
  for (const k of a.keys()) if (!b.has(k)) return false;
  return true;
}

// ── Adición de concepto al individuo ────────────────────────

/**
 * Añade `concept` (NNF) como label de `indId`. Devuelve:
 *   - 'clash' si la rama cierra
 *   - 'added' si era nuevo
 *   - 'dup'   si ya estaba
 */
function addLabel(branch: Branch, indId: string, concept: DLConcept): 'clash' | 'added' | 'dup' {
  if (concept.kind === 'bottom') return 'clash';
  if (concept.kind === 'top') return 'dup';
  const ind = getOrCreateIndividual(branch, indId);
  const h = conceptHash(concept);
  if (ind.labels.has(h)) return 'dup';
  // Check clash con negación.
  const negH = conceptHash(toNNF(not(concept)));
  if (ind.labels.has(negH)) return 'clash';
  ind.labels.set(h, concept);
  // Si era ⊓ → enqueuemos children directamente.
  if (concept.kind === 'and') {
    for (const c of concept.args || []) {
      const r = addLabel(branch, indId, c);
      if (r === 'clash') return 'clash';
    }
  } else if (concept.kind === 'or') {
    const sourceHash = `${indId}::${h}`;
    if (!branch.processedOr.has(sourceHash)) {
      branch.pendingOr.push({
        indId,
        disjuncts: concept.args || [],
        sourceHash,
      });
    }
  }
  return 'added';
}

// ── Aplicación de TBox al individuo ─────────────────────────

function applyTBoxTo(branch: Branch, indId: string): 'clash' | 'ok' {
  for (const ax of branch.tboxAxioms) {
    const r = addLabel(branch, indId, ax);
    if (r === 'clash') return 'clash';
  }
  return 'ok';
}

// ── Reglas ∃ / ∀ ────────────────────────────────────────────

/**
 * Aplica una pasada de reglas determinísticas: ∀, ∃.
 * Devuelve true si se hizo algún cambio.
 */
function applyDeterministicRules(branch: Branch): 'clash' | 'changed' | 'stable' {
  let changed = false;

  // ── ∀R.C: para cada individuo no bloqueado con ∀R.C y cada R(x,y), añade C(y)
  // Iteramos sobre un snapshot porque podemos crear nuevos sucesores.
  const indSnapshot = Array.from(branch.individuals.values());
  for (const ind of indSnapshot) {
    if (isBlocked(branch, ind.id)) continue;
    for (const [, c] of ind.labels) {
      if (c.kind !== 'forall') continue;
      if (!c.role || !c.arg) continue;
      const role = c.role;
      const inner = c.arg;
      for (const succ of roleSuccessors(branch, role, ind.id)) {
        const succInd = branch.individuals.get(succ);
        if (!succInd) continue;
        if (succInd.labels.has(conceptHash(inner))) continue;
        const r = addLabel(branch, succ, inner);
        if (r === 'clash') return 'clash';
        if (r === 'added') changed = true;
      }
    }
  }

  // ── ∃R.C: para cada individuo no bloqueado con ∃R.C que no tenga
  // un R-sucesor con C, crear uno fresh.
  // (Se aplica DESPUÉS de ∀ porque generar sucesor podría requerir refrescar.)
  const indSnapshot2 = Array.from(branch.individuals.values());
  for (const ind of indSnapshot2) {
    if (isBlocked(branch, ind.id)) continue;
    for (const [, c] of ind.labels) {
      if (c.kind !== 'exists') continue;
      if (!c.role || !c.arg) continue;
      const role = c.role;
      const inner = c.arg;
      const innerH = conceptHash(inner);
      const succs = roleSuccessors(branch, role, ind.id);
      const satisfied = succs.some((s) => {
        const si = branch.individuals.get(s);
        return si ? si.labels.has(innerH) : false;
      });
      if (satisfied) continue;
      if (branch.individuals.size >= MAX_INDIVIDUALS) {
        // Tableau agotado — para ALC con blocking no debería pasar, pero
        // por defensa devolvemos stable para no diverger.
        return 'stable';
      }
      const fresh = freshIndividual(branch, ind.id);
      addRoleAssertion(branch, role, ind.id, fresh.id);
      // Aplicar TBox al recién nacido.
      const t = applyTBoxTo(branch, fresh.id);
      if (t === 'clash') return 'clash';
      const r1 = addLabel(branch, fresh.id, inner);
      if (r1 === 'clash') return 'clash';
      // Propagar ∀ del padre al recién nacido.
      for (const [, vc] of ind.labels) {
        if (vc.kind === 'forall' && vc.role === role && vc.arg) {
          const r2 = addLabel(branch, fresh.id, vc.arg);
          if (r2 === 'clash') return 'clash';
        }
      }
      changed = true;
    }
  }

  return changed ? 'changed' : 'stable';
}

// ── Expansión principal ─────────────────────────────────────

function saturate(branch: Branch, depth: number): boolean {
  if (depth > 1000) return true; // se considera abierta por defensa.

  // 1) Aplicar reglas determinísticas hasta estabilizar.
  for (;;) {
    const r = applyDeterministicRules(branch);
    if (r === 'clash') return false;
    if (r === 'stable') break;
  }

  // 2) Procesar próximo ⊔ pendiente.
  // Saltamos disyunciones cuyo individuo ya tiene un disyunto satisfecho.
  while (branch.pendingOr.length > 0) {
    const next = branch.pendingOr.shift();
    if (!next) break;
    if (branch.processedOr.has(next.sourceHash)) continue;
    const ind = branch.individuals.get(next.indId);
    if (!ind) {
      branch.processedOr.add(next.sourceHash);
      continue;
    }
    // Si alguno de los disyuntos ya está en labels, no hace falta bifurcar.
    const alreadySatisfied = next.disjuncts.some((d) => ind.labels.has(conceptHash(d)));
    if (alreadySatisfied) {
      branch.processedOr.add(next.sourceHash);
      continue;
    }
    branch.processedOr.add(next.sourceHash);
    // Bifurcar: probar cada disyunto.
    for (const d of next.disjuncts) {
      const child = cloneBranch(branch);
      const r = addLabel(child, next.indId, d);
      if (r === 'clash') continue;
      if (saturate(child, depth + 1)) return true;
    }
    return false;
  }

  // 3) Sin más pendings ni cambios: rama abierta y saturada.
  return true;
}

// ── Carga de KB ─────────────────────────────────────────────

function internalizeTBox(branch: Branch, tbox: DLKnowledgeBase['tbox']): void {
  for (const ax of tbox) {
    if (ax.kind === 'subsumes') {
      // C ⊑ D  ≡  ⊤ ⊑ ¬C ⊔ D
      const left = ax.left as DLConcept;
      const right = ax.right as DLConcept;
      branch.tboxAxioms.push(toNNF(or(not(left), right)));
    } else if (ax.kind === 'equivalent') {
      const left = ax.left as DLConcept;
      const right = ax.right as DLConcept;
      branch.tboxAxioms.push(toNNF(or(not(left), right)));
      branch.tboxAxioms.push(toNNF(or(not(right), left)));
    }
    // instance / role-instance no son TBox — se ignoran aquí.
  }
}

function loadABox(branch: Branch, abox: DLKnowledgeBase['abox']): 'clash' | 'ok' {
  // Primero crear todos los individuos referenciados.
  const seen = new Set<string>();
  const ensure = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    getOrCreateIndividual(branch, id);
  };
  for (const ax of abox) {
    if (ax.kind === 'instance') ensure(ax.left as string);
    if (ax.kind === 'role-instance') {
      ensure(ax.left as string);
      ensure(ax.right as string);
    }
  }
  // Aplicar TBox a todos los individuos existentes.
  for (const id of seen) {
    if (applyTBoxTo(branch, id) === 'clash') return 'clash';
  }
  // Cargar asertions.
  for (const ax of abox) {
    if (ax.kind === 'instance') {
      const c = toNNF(ax.right as DLConcept);
      if (addLabel(branch, ax.left as string, c) === 'clash') return 'clash';
    } else if (ax.kind === 'role-instance') {
      if (!ax.role) continue;
      addRoleAssertion(branch, ax.role, ax.left as string, ax.right as string);
    }
  }
  return 'ok';
}

// ── API pública ─────────────────────────────────────────────

/**
 * Decide si `concept` es satisfacible (eventualmente bajo la KB).
 * Construye un tableau iniciando con un individuo fresco x : concept,
 * y aplica las reglas hasta cerrar todas las ramas o encontrar una abierta.
 */
export function isSatisfiable(concept: DLConcept, kb?: DLKnowledgeBase): boolean {
  const branch = makeBranch();
  if (kb) internalizeTBox(branch, kb.tbox);

  // Si hay KB no-vacía, cargamos su ABox primero (puede ya cerrar).
  if (kb && kb.abox.length > 0) {
    if (loadABox(branch, kb.abox) === 'clash') return false;
  }

  // Individuo testigo para `concept`.
  const witness = '_root';
  getOrCreateIndividual(branch, witness);
  if (applyTBoxTo(branch, witness) === 'clash') return false;
  if (addLabel(branch, witness, toNNF(concept)) === 'clash') return false;

  return saturate(branch, 0);
}

/**
 * Decide si `sub ⊑ sup` (bajo la KB). Equivale a: ¬(sub ⊓ ¬sup) es válida,
 * o sea, `sub ⊓ ¬sup` es insatisfacible.
 */
export function isSubsumed(sub: DLConcept, sup: DLConcept, kb?: DLKnowledgeBase): boolean {
  const probe = and(sub, not(sup));
  return !isSatisfiable(probe, kb);
}

/**
 * Decide si `individual` es instancia de `concept` bajo la KB.
 * Equivale a: KB ∪ {individual : ¬concept} es inconsistente.
 */
export function isInstance(individual: string, concept: DLConcept, kb: DLKnowledgeBase): boolean {
  // Construimos una KB extendida con el axioma de instancia negada.
  const extended: DLKnowledgeBase = {
    tbox: kb.tbox,
    abox: [...kb.abox, { kind: 'instance', left: individual, right: not(concept) }],
  };
  // El test es: ¿es la KB consistente? Si NO lo es, individuo es instancia.
  const branch = makeBranch();
  internalizeTBox(branch, extended.tbox);
  if (loadABox(branch, extended.abox) === 'clash') return true;
  // Aún si la ABox carga sin clash inmediato, hay que saturar.
  // Iniciamos saturación sin "concepto probe": el branch ya contiene
  // todas las afirmaciones de la KB extendida.
  // Si saturate devuelve true (abierta) → consistente → NO es instancia.
  // Si saturate devuelve false (cerrada) → inconsistente → SÍ es instancia.
  return !saturate(branch, 0);
}

/**
 * Clasificación: produce taxonomía de conceptos atómicos de la KB.
 * Devuelve Map<conceptName, Set<conceptName>> donde `Set` contiene
 * los conceptos atómicos que subsumen al name (es decir: superconceptos).
 * ⊤ y ⊥ se incluyen siempre.
 */
export function classify(kb: DLKnowledgeBase): Map<string, Set<string>> {
  const names = collectAtomicNames(kb);
  names.add('⊤');
  names.add('⊥');
  const result = new Map<string, Set<string>>();
  for (const n of names) result.set(n, new Set());

  const conceptOf = (n: string): DLConcept => {
    if (n === '⊤') return TOP;
    if (n === '⊥') return BOTTOM;
    return atomic(n);
  };

  for (const sub of names) {
    const subSet = result.get(sub);
    if (!subSet) continue;
    const subC = conceptOf(sub);
    // ¿es satisfacible sub bajo KB? Si no, sub ≡ ⊥ → subsumido por todo.
    const subSat = isSatisfiable(subC, kb);
    if (!subSat) {
      // sub es ⊥ bajo la KB: subsumido por todos.
      for (const sup of names) subSet.add(sup);
      continue;
    }
    for (const sup of names) {
      if (sub === sup) {
        subSet.add(sup);
        continue;
      }
      const supC = conceptOf(sup);
      if (isSubsumed(subC, supC, kb)) {
        subSet.add(sup);
      }
    }
  }
  return result;
}

function collectAtomicNames(kb: DLKnowledgeBase): Set<string> {
  const out = new Set<string>();
  const walk = (c: DLConcept) => {
    if (c.kind === 'atomic' && c.name) out.add(c.name);
    if (c.arg) walk(c.arg);
    if (c.args) for (const a of c.args) walk(a);
  };
  for (const ax of kb.tbox) {
    if (typeof ax.left !== 'string') walk(ax.left);
    if (typeof ax.right !== 'string') walk(ax.right);
  }
  for (const ax of kb.abox) {
    if (typeof ax.right !== 'string') walk(ax.right);
  }
  return out;
}

// Export interno para tests / debug.
export { conceptToString };
