// ============================================================
// ST Proof Minification — Núcleo
// ============================================================
//
// Transformaciones puras sobre árboles de pruebas. Ninguna operación
// muta el input — siempre se clonan los nodos al construir el output.
//
// Soundness: cada regla preserva la conclusión raíz y la conformidad
// estructural (premises siempre válidas, sin referencias colgantes).
// El minificador NO re-checkea la prueba — asume que el input ya es
// válido.
//
// Determinismo: las pasadas se aplican en orden fijo (detrivialize →
// compact-mp → cut-elimination-local → remove-unused). El bucle
// global termina cuando una iteración no cambia el árbol o se alcanza
// `maxIterations`.

import type { GenericProofNode, MinifyOptions, MinifyResult, MinifyRule } from './types';

const DEFAULT_MAX_ITERATIONS = 16;

const ALL_RULES: MinifyRule[] = [
  'detrivialize',
  'compact-mp',
  'cut-elimination-local',
  'remove-unused',
];

// ── Reconocedores de reglas (nombres equivalentes) ────────────

const LEAF_RULES = new Set([
  'axiom',
  'ax',
  'hypothesis',
  'hyp',
  'assumption',
  'asm',
  'premise',
  'init',
  'identity',
  'id',
]);

const MP_RULES = new Set([
  '→E',
  '->E',
  'MP',
  'mp',
  'modus-ponens',
  'modus_ponens',
  'impl-elim',
  'implication-elimination',
  '⊃E',
]);

const IMPL_INTRO_RULES = new Set(['→I', '->I', 'impl-intro', 'implication-introduction', '⊃I']);

const AND_INTRO_RULES = new Set([
  '∧I',
  '&I',
  'and-intro',
  'conj-intro',
  'conjunction-introduction',
]);

const AND_ELIM_RULES = new Set([
  '∧E',
  '∧E1',
  '∧E2',
  '&E',
  '&E1',
  '&E2',
  'and-elim',
  'and-elim1',
  'and-elim2',
  'conj-elim',
  'conjunction-elimination',
]);

const CUT_RULES = new Set(['cut', 'Cut', 'CUT']);

const WEAKEN_RULES = new Set(['weakening', 'weaken', 'WL', 'WR', 'exchange', 'XL', 'XR']);

function isLeafRule(rule: string): boolean {
  return LEAF_RULES.has(rule);
}
function isMPRule(rule: string): boolean {
  return MP_RULES.has(rule);
}
function isImplIntroRule(rule: string): boolean {
  return IMPL_INTRO_RULES.has(rule);
}
function isAndIntroRule(rule: string): boolean {
  return AND_INTRO_RULES.has(rule);
}
function isAndElimRule(rule: string): boolean {
  return AND_ELIM_RULES.has(rule);
}
function isCutRule(rule: string): boolean {
  return CUT_RULES.has(rule);
}
function isWeakenRule(rule: string): boolean {
  return WEAKEN_RULES.has(rule);
}

// ── Utilidades de árbol ───────────────────────────────────────

/** Normaliza una conclusión para comparación (trim + collapse ws). */
function normalize(formula: string): string {
  return formula.trim().replace(/\s+/g, ' ');
}

function cloneNode(n: GenericProofNode): GenericProofNode {
  const out: GenericProofNode = {
    conclusion: n.conclusion,
    rule: n.rule,
    premises: n.premises.map(cloneNode),
  };
  if (n.metadata !== undefined) {
    out.metadata = { ...n.metadata };
  }
  return out;
}

/** Cuenta los nodos de un árbol (raíz incluida). */
export function countNodes(n: GenericProofNode): number {
  let total = 1;
  for (const p of n.premises) total += countNodes(p);
  return total;
}

/** Profundidad máxima (raíz = 0). */
export function depthOf(n: GenericProofNode): number {
  if (n.premises.length === 0) return 0;
  let max = 0;
  for (const p of n.premises) {
    const d = depthOf(p);
    if (d > max) max = d;
  }
  return 1 + max;
}

/** Serialización canónica para hashing/dedup. */
function canonicalKey(n: GenericProofNode): string {
  const kids = n.premises.map(canonicalKey).join('|');
  return `${n.rule}::${normalize(n.conclusion)}::(${kids})`;
}

// ── 1. Detrivialize ───────────────────────────────────────────
//
// (a) Si un nodo de eliminación tiene como premisa inmediata su propio
//     introductor con la misma conclusion final, colapsa al sub-árbol
//     que justificó la intro. Ejemplo clásico:
//
//        ⌜A⌝            (∧I)
//        ⌜B⌝   ──────────────
//                A ∧ B
//                (∧E1)
//                  A
//
//     → simplemente la sub-prueba de A.
//
// (b) Dedup de premises: si dos premises directas son estructuralmente
//     iguales, se conserva una sola copia.

function detrivialize(node: GenericProofNode): GenericProofNode {
  // Primero reducimos los hijos.
  const reducedPremises = node.premises.map(detrivialize);

  // (a) ∧E ∘ ∧I → premisa correspondiente.
  if (
    isAndElimRule(node.rule) &&
    reducedPremises.length === 1 &&
    isAndIntroRule(reducedPremises[0].rule) &&
    reducedPremises[0].premises.length === 2
  ) {
    const intro = reducedPremises[0];
    const target = normalize(node.conclusion);
    // Elegir la premisa de la intro cuya conclusion coincide con la
    // conclusion del eliminador.
    for (const p of intro.premises) {
      if (normalize(p.conclusion) === target) {
        return cloneNode(p);
      }
    }
  }

  // (a') →E ∘ →I trivial: si la intro produjo A→B a partir de "asumir
  // A, derivar B" donde B es exactamente la conclusion final y el
  // antecedente A ya estaba como axioma/hipótesis fuera, el MP
  // colapsa al sub-árbol que derivó B. Caso conservador: la sub-prueba
  // de B debe ser una hoja (no re-ejecutamos sustituciones).
  if (
    isMPRule(node.rule) &&
    reducedPremises.length === 2 &&
    isImplIntroRule(reducedPremises[0].rule) &&
    reducedPremises[0].premises.length === 1
  ) {
    const intro = reducedPremises[0];
    const body = intro.premises[0];
    if (normalize(body.conclusion) === normalize(node.conclusion) && isLeafRule(body.rule)) {
      return cloneNode(body);
    }
  }

  // (b) Dedup de premises directas. Importante para conjunciones o
  // pasos que repiten la misma justificación.
  const dedupedPremises: GenericProofNode[] = [];
  const seenKeys = new Set<string>();
  for (const p of reducedPremises) {
    const k = canonicalKey(p);
    if (seenKeys.has(k)) continue;
    seenKeys.add(k);
    dedupedPremises.push(p);
  }

  return {
    conclusion: node.conclusion,
    rule: node.rule,
    premises: dedupedPremises,
    ...(node.metadata !== undefined ? { metadata: { ...node.metadata } } : {}),
  };
}

// ── 2. Compact MP chains ──────────────────────────────────────
//
// Una cadena de modus ponens se ve así (n = 3):
//
//     A     A→B
//     ─────────  MP
//          B           B→C
//          ──────────────── MP
//                   C           C→D
//                   ─────────────── MP
//                            D
//
// El minificador detecta esta estructura y produce un único nodo MP*
// con todas las hipótesis y todas las implicaciones como premisas
// hermanas (estructura plana), con `metadata.chain = ['A','B','C','D']`
// y `rule = 'MP*'`.

export function compactModusPonensChain(proof: GenericProofNode): GenericProofNode {
  // Top-down: primero intentamos compactar EN la raíz; si compactamos
  // recursamos en las premisas resultantes (que serán hojas de la
  // cadena). Si no compactamos en la raíz, recursamos en cada premisa
  // individualmente.
  if (isMPRule(proof.rule) && proof.premises.length === 2) {
    const compacted = tryCompactChain(proof);
    if (compacted !== null) {
      // Las premisas de un MP* son las implicaciones + el antecedente
      // más profundo. Aplicamos recursión a cada una por si tienen
      // sub-cadenas independientes.
      return {
        ...compacted,
        premises: compacted.premises.map(compactModusPonensChain),
      };
    }
  }
  // No compactamos esta raíz; recursamos sobre premisas.
  return {
    conclusion: proof.conclusion,
    rule: proof.rule,
    premises: proof.premises.map(compactModusPonensChain),
    ...(proof.metadata !== undefined ? { metadata: { ...proof.metadata } } : {}),
  };
}

/**
 * Intenta detectar una cadena de modus ponens partiendo del nodo dado.
 * Devuelve el nodo compactado o `null` si no hay cadena de tamaño ≥ 2.
 */
function tryCompactChain(node: GenericProofNode): GenericProofNode | null {
  const conclusions: string[] = [];
  const impls: GenericProofNode[] = [];
  let cursor: GenericProofNode | null = node;
  const visited = new Set<GenericProofNode>();
  let mpDepth = 0;

  while (cursor && isMPRule(cursor.rule) && cursor.premises.length === 2 && !visited.has(cursor)) {
    visited.add(cursor);
    mpDepth++;
    const [a, b] = cursor.premises as [GenericProofNode, GenericProofNode];
    const target = normalize(cursor.conclusion);
    const aConc = normalize(a.conclusion);
    const bConc = normalize(b.conclusion);
    const isAImpl = matchesImplication(aConc, target);
    const isBImpl = matchesImplication(bConc, target);
    let antecedent: GenericProofNode;
    let implication: GenericProofNode;
    if (isAImpl && !isBImpl) {
      implication = a;
      antecedent = b;
    } else if (isBImpl && !isAImpl) {
      implication = b;
      antecedent = a;
    } else {
      // Ambiguo o ambas son implicaciones: no compactamos esta cadena.
      return null;
    }
    impls.push(implication);
    conclusions.push(antecedent.conclusion);
    if (isMPRule(antecedent.rule) && antecedent.premises.length === 2) {
      cursor = antecedent;
    } else {
      conclusions.push(cursor.conclusion);
      impls.push(antecedent);
      break;
    }
  }

  // Sólo compactamos si hubo al menos 2 MPs encadenados.
  if (mpDepth < 2) return null;

  return {
    conclusion: node.conclusion,
    rule: 'MP*',
    premises: impls,
    metadata: {
      chain: conclusions,
      compactedFrom: 'modus-ponens-chain',
      length: conclusions.length,
    },
  };
}

/**
 * Heurística: ¿`impl` parece ser una implicación cuyo consecuente es
 * `target`? Reconoce los conectores `→`, `->`, `⊃`, ` implies `.
 * NO hace parsing real — sólo string-matching del lado derecho.
 */
function matchesImplication(impl: string, target: string): boolean {
  const connectors = ['→', '->', '⊃', ' implies '];
  for (const conn of connectors) {
    const idx = impl.lastIndexOf(conn);
    if (idx < 0) continue;
    let rhs = impl.slice(idx + conn.length).trim();
    // Strip outer parens si está balanceado.
    rhs = stripOuterParens(rhs);
    const tgt = stripOuterParens(target);
    if (rhs === tgt) return true;
  }
  return false;
}

function stripOuterParens(s: string): string {
  let cur = s.trim();
  while (cur.startsWith('(') && cur.endsWith(')')) {
    let depth = 0;
    let balanced = true;
    for (let i = 0; i < cur.length; i++) {
      const ch = cur[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0 && i < cur.length - 1) {
          balanced = false;
          break;
        }
      }
    }
    if (!balanced) break;
    cur = cur.slice(1, -1).trim();
  }
  return cur;
}

// ── 3. Local cut elimination ──────────────────────────────────
//
// Caso elemental: nodo `cut` con cut-formula A donde una de las dos
// premisas es exactamente una hoja con conclusion A (la regla de
// identidad). En ese caso el cut es trivial y se reemplaza por la
// otra premisa, que ya derivaba la conclusion.

function eliminateLocalCuts(node: GenericProofNode): GenericProofNode {
  const reducedPremises = node.premises.map(eliminateLocalCuts);
  const next: GenericProofNode = {
    conclusion: node.conclusion,
    rule: node.rule,
    premises: reducedPremises,
    ...(node.metadata !== undefined ? { metadata: { ...node.metadata } } : {}),
  };

  if (!isCutRule(next.rule)) return next;
  if (next.premises.length !== 2) return next;
  const [left, right] = next.premises as [GenericProofNode, GenericProofNode];

  // Si la rama izquierda es una hoja-identidad cuya conclusión coincide
  // con la conclusión del cut, la rama derecha YA derivó la conclusión.
  if (isLeafRule(left.rule) && normalize(left.conclusion) === normalize(next.conclusion)) {
    return cloneNode(right);
  }
  if (isLeafRule(right.rule) && normalize(right.conclusion) === normalize(next.conclusion)) {
    return cloneNode(left);
  }
  return next;
}

// ── 4. Remove unused subproofs ────────────────────────────────
//
// Para pasos de weakening/exchange, la(s) sub-prueba(s) que no
// contribuyen a la conclusión del nodo padre se pueden recortar. Aquí
// definimos "no contribuye" como: la conclusion del sub-árbol no
// coincide con ninguna conclusion en el camino raíz→nodo, y tampoco
// es premisa formal del nodo (caso weakening).
//
// Aplicación práctica: nodos weakening con N premisas donde sólo una
// coincide con la conclusion del padre → se conservan únicamente las
// premisas relevantes.

export function removeUnusedSubproofs(proof: GenericProofNode): GenericProofNode {
  const cleaned = cleanWeakenings(proof);
  return pruneOrphanPremises(cleaned);
}

function cleanWeakenings(node: GenericProofNode): GenericProofNode {
  const reduced = node.premises.map(cleanWeakenings);
  if (isWeakenRule(node.rule)) {
    const target = normalize(node.conclusion);
    // Buscamos la(s) premisa(s) que derivan exactamente la conclusion.
    const relevant = reduced.filter((p) => containsConclusion(p, target));
    if (relevant.length >= 1 && relevant.length < reduced.length) {
      return {
        conclusion: node.conclusion,
        rule: node.rule,
        premises: relevant,
        ...(node.metadata !== undefined ? { metadata: { ...node.metadata } } : {}),
      };
    }
    // Si todas las premisas son irrelevantes (caso degenerado): mantén
    // sólo la primera para no perder el árbol.
    if (relevant.length === 0 && reduced.length > 0) {
      return {
        conclusion: node.conclusion,
        rule: node.rule,
        premises: [reduced[0]],
        ...(node.metadata !== undefined ? { metadata: { ...node.metadata } } : {}),
      };
    }
  }
  return {
    conclusion: node.conclusion,
    rule: node.rule,
    premises: reduced,
    ...(node.metadata !== undefined ? { metadata: { ...node.metadata } } : {}),
  };
}

/**
 * Recorta sub-pruebas huérfanas: una sub-prueba es huérfana si su
 * conclusion no aparece en ninguna parte del árbol (ni como premisa
 * referenciada, ni como conclusion intermedia útil) excepto a sí
 * misma. Conservador: sólo opera sobre nodos con >2 premisas donde
 * todas menos una son axiomas/hipótesis cuya conclusion nunca aparece.
 */
function pruneOrphanPremises(node: GenericProofNode): GenericProofNode {
  const reduced = node.premises.map(pruneOrphanPremises);
  if (reduced.length <= 1) {
    return {
      conclusion: node.conclusion,
      rule: node.rule,
      premises: reduced,
      ...(node.metadata !== undefined ? { metadata: { ...node.metadata } } : {}),
    };
  }
  // Conjunto de conclusiones que aparecen en el árbol completo bajo
  // las premisas que SÍ son no-hojas: si una hoja-hipótesis tiene
  // conclusion que no aparece como sub-fórmula de ningún otro nodo,
  // probablemente sea dead weight.
  const liveConclusions = new Set<string>();
  for (const p of reduced) {
    collectNonLeafConclusions(p, liveConclusions);
  }
  liveConclusions.add(normalize(node.conclusion));

  // Filtramos hojas cuya conclusion no aparece como sub-string de
  // ninguna conclusion viva. Esto es heurístico (no semántico) — sirve
  // sólo para casos donde la hipótesis es claramente independiente.
  const pruned: GenericProofNode[] = [];
  for (const p of reduced) {
    if (isLeafRule(p.rule) && !appearsInAnyConclusion(normalize(p.conclusion), liveConclusions)) {
      // huérfano: no incluir.
      continue;
    }
    pruned.push(p);
  }
  // Aseguramos al menos una premisa si node no es hoja por naturaleza.
  if (pruned.length === 0 && reduced.length > 0) {
    pruned.push(reduced[0]);
  }
  return {
    conclusion: node.conclusion,
    rule: node.rule,
    premises: pruned,
    ...(node.metadata !== undefined ? { metadata: { ...node.metadata } } : {}),
  };
}

function collectNonLeafConclusions(n: GenericProofNode, set: Set<string>): void {
  if (!isLeafRule(n.rule)) {
    set.add(normalize(n.conclusion));
  }
  for (const p of n.premises) collectNonLeafConclusions(p, set);
}

function appearsInAnyConclusion(needle: string, hay: Set<string>): boolean {
  if (hay.has(needle)) return true;
  for (const conc of hay) {
    if (conc.includes(needle)) return true;
  }
  return false;
}

function containsConclusion(n: GenericProofNode, target: string): boolean {
  if (normalize(n.conclusion) === target) return true;
  for (const p of n.premises) {
    if (containsConclusion(p, target)) return true;
  }
  return false;
}

// ── API principal ─────────────────────────────────────────────

/**
 * Minifica un árbol de pruebas iterando las reglas hasta punto fijo
 * o agotar `maxIterations`.
 */
export function minifyProof(proof: GenericProofNode, opts: MinifyOptions = {}): MinifyResult {
  const maxIterations = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const rules = opts.rules ?? ALL_RULES;
  const ruleSet = new Set(rules);

  const originalNodes = countNodes(proof);
  const originalDepth = depthOf(proof);

  let current = cloneNode(proof);
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    const before = canonicalKey(current);

    if (ruleSet.has('detrivialize')) current = detrivialize(current);
    if (ruleSet.has('compact-mp')) current = compactModusPonensChain(current);
    if (ruleSet.has('cut-elimination-local')) current = eliminateLocalCuts(current);
    if (ruleSet.has('remove-unused')) current = removeUnusedSubproofs(current);

    const after = canonicalKey(current);
    if (before === after) break; // punto fijo
  }

  const minNodes = countNodes(current);
  const minDepth = depthOf(current);
  const removed = originalNodes - minNodes;
  const pct = originalNodes === 0 ? 0 : (removed / originalNodes) * 100;

  return {
    original: { nodes: originalNodes, depth: originalDepth },
    minified: current,
    reduction: {
      nodesRemoved: removed,
      depthDelta: originalDepth - minDepth,
      percentage: Math.round(pct * 100) / 100,
    },
    iterations,
  };
}
