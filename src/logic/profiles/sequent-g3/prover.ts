// ============================================================
// G3 — Backward proof search
// ============================================================
//
// Busqueda hacia atras (root-first). Las reglas de G3 son
// invertibles, por lo que NO hay que retroceder al elegir la
// proxima regla: cualquier formula compleja que aplique cierra
// el subgoal sii la version sin descomponer era cerrable.
//
// Terminacion: cada paso reemplaza una formula compleja por
// sub-formulas estrictamente menores. Para evitar contracciones
// redundantes en multisets, se dedupica por clave sintactica
// antes de aplicar la siguiente regla.
//
// Branching:
//   - andR, orL, impL ramifican en 2 premisas (cada una debe cerrar).
//   - andL, orR, impR, notL, notR son lineales (1 premisa).

import { Formula } from '../../../types';
import { ProofTree, Sequent, ProveResult } from './types';
import { normalizeForG3, formulaKey } from './normalize';

interface FormulaSlot {
  formula: Formula;
  key: string;
}

function slotsOf(list: Formula[]): FormulaSlot[] {
  return list.map((f) => ({ formula: f, key: formulaKey(f) }));
}

function dedupSlots(slots: FormulaSlot[]): FormulaSlot[] {
  const seen = new Set<string>();
  const out: FormulaSlot[] = [];
  for (const slot of slots) {
    if (!seen.has(slot.key)) {
      seen.add(slot.key);
      out.push(slot);
    }
  }
  return out;
}

function isAtomic(f: Formula): boolean {
  // En G3, los atomos del calculo proposicional son atom/true/false.
  // Tambien tratamos como opacas las formulas no-proposicionales
  // (predicados, modales, ...) para que el prover no las descomponga.
  switch (f.kind) {
    case 'atom':
    case 'true':
    case 'false':
      return true;
    case 'not':
    case 'and':
    case 'or':
    case 'implies':
      return false;
    default:
      // Predicados/cuantificadores/etc: opacos.
      return true;
  }
}

function findAxiomMatch(left: FormulaSlot[], right: FormulaSlot[]): Formula | undefined {
  const rightKeys = new Set(right.map((s) => s.key));
  for (const slot of left) {
    if (rightKeys.has(slot.key)) return slot.formula;
  }
  return undefined;
}

function findFalseLeft(left: FormulaSlot[]): Formula | undefined {
  return left.find((s) => s.formula.kind === 'false')?.formula;
}

function findTrueRight(right: FormulaSlot[]): Formula | undefined {
  return right.find((s) => s.formula.kind === 'true')?.formula;
}

/**
 * Busca la primera formula no-atomica en `slots` y devuelve su indice y
 * el slot. Si no hay ninguna, devuelve undefined.
 */
function findFirstComplex(slots: FormulaSlot[]): { index: number; slot: FormulaSlot } | undefined {
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot && !isAtomic(slot.formula)) return { index: i, slot };
  }
  return undefined;
}

function removeAt<T>(arr: T[], idx: number): T[] {
  const copy = arr.slice();
  copy.splice(idx, 1);
  return copy;
}

function toSequent(left: FormulaSlot[], right: FormulaSlot[]): Sequent {
  return {
    left: left.map((s) => s.formula),
    right: right.map((s) => s.formula),
  };
}

interface ProveCtx {
  /** Cota maxima de nodos generados para evitar explosion en patologicos. */
  budget: number;
  used: number;
}

function exhausted(ctx: ProveCtx): boolean {
  return ctx.used >= ctx.budget;
}

function prove(left: FormulaSlot[], right: FormulaSlot[], ctx: ProveCtx): ProofTree | undefined {
  ctx.used++;
  if (exhausted(ctx)) return undefined;

  const dedupL = dedupSlots(left);
  const dedupR = dedupSlots(right);
  const goal = toSequent(dedupL, dedupR);

  // 1. Axioma: misma formula a izquierda y derecha.
  const axiomFormula = findAxiomMatch(dedupL, dedupR);
  if (axiomFormula) {
    return { goal, rule: 'axiom', principalFormula: axiomFormula, premises: [], closed: true };
  }

  // 2. ⊥ en la izquierda cierra inmediatamente.
  const bottomLeft = findFalseLeft(dedupL);
  if (bottomLeft) {
    return { goal, rule: 'falseL', principalFormula: bottomLeft, premises: [], closed: true };
  }

  // 3. ⊤ en la derecha cierra inmediatamente.
  const topRight = findTrueRight(dedupR);
  if (topRight) {
    return { goal, rule: 'trueR', principalFormula: topRight, premises: [], closed: true };
  }

  // 4. Reglas no-ramificantes primero (siempre que existan).
  //    Esto reduce el espacio antes de ramificar y produce arboles mas
  //    pequenos sin sacrificar completitud (las reglas son invertibles).

  // notL: Γ, ¬A ⊢ Δ  ↦  Γ ⊢ A, Δ
  for (let i = 0; i < dedupL.length; i++) {
    const slot = dedupL[i];
    if (slot && slot.formula.kind === 'not' && slot.formula.args && slot.formula.args[0]) {
      const inner = slot.formula.args[0];
      const newL = removeAt(dedupL, i);
      const newR = [{ formula: inner, key: formulaKey(inner) }, ...dedupR];
      const sub = prove(newL, newR, ctx);
      if (!sub) return undefined;
      return {
        goal,
        rule: 'notL',
        principalFormula: slot.formula,
        premises: [sub],
        closed: sub.closed,
      };
    }
  }

  // notR: Γ ⊢ ¬A, Δ  ↦  Γ, A ⊢ Δ
  for (let i = 0; i < dedupR.length; i++) {
    const slot = dedupR[i];
    if (slot && slot.formula.kind === 'not' && slot.formula.args && slot.formula.args[0]) {
      const inner = slot.formula.args[0];
      const newR = removeAt(dedupR, i);
      const newL = [{ formula: inner, key: formulaKey(inner) }, ...dedupL];
      const sub = prove(newL, newR, ctx);
      if (!sub) return undefined;
      return {
        goal,
        rule: 'notR',
        principalFormula: slot.formula,
        premises: [sub],
        closed: sub.closed,
      };
    }
  }

  // andL: Γ, A∧B ⊢ Δ  ↦  Γ, A, B ⊢ Δ
  for (let i = 0; i < dedupL.length; i++) {
    const slot = dedupL[i];
    if (
      slot &&
      slot.formula.kind === 'and' &&
      slot.formula.args &&
      slot.formula.args[0] &&
      slot.formula.args[1]
    ) {
      const a = slot.formula.args[0];
      const b = slot.formula.args[1];
      const newL = [
        { formula: a, key: formulaKey(a) },
        { formula: b, key: formulaKey(b) },
        ...removeAt(dedupL, i),
      ];
      const sub = prove(newL, dedupR, ctx);
      if (!sub) return undefined;
      return {
        goal,
        rule: 'andL',
        principalFormula: slot.formula,
        premises: [sub],
        closed: sub.closed,
      };
    }
  }

  // orR: Γ ⊢ A∨B, Δ  ↦  Γ ⊢ A, B, Δ
  for (let i = 0; i < dedupR.length; i++) {
    const slot = dedupR[i];
    if (
      slot &&
      slot.formula.kind === 'or' &&
      slot.formula.args &&
      slot.formula.args[0] &&
      slot.formula.args[1]
    ) {
      const a = slot.formula.args[0];
      const b = slot.formula.args[1];
      const newR = [
        { formula: a, key: formulaKey(a) },
        { formula: b, key: formulaKey(b) },
        ...removeAt(dedupR, i),
      ];
      const sub = prove(dedupL, newR, ctx);
      if (!sub) return undefined;
      return {
        goal,
        rule: 'orR',
        principalFormula: slot.formula,
        premises: [sub],
        closed: sub.closed,
      };
    }
  }

  // impR: Γ ⊢ A→B, Δ  ↦  Γ, A ⊢ B, Δ
  for (let i = 0; i < dedupR.length; i++) {
    const slot = dedupR[i];
    if (
      slot &&
      slot.formula.kind === 'implies' &&
      slot.formula.args &&
      slot.formula.args[0] &&
      slot.formula.args[1]
    ) {
      const a = slot.formula.args[0];
      const b = slot.formula.args[1];
      const newL = [{ formula: a, key: formulaKey(a) }, ...dedupL];
      const newR = [{ formula: b, key: formulaKey(b) }, ...removeAt(dedupR, i)];
      const sub = prove(newL, newR, ctx);
      if (!sub) return undefined;
      return {
        goal,
        rule: 'impR',
        principalFormula: slot.formula,
        premises: [sub],
        closed: sub.closed,
      };
    }
  }

  // 5. Reglas ramificantes (despues de las lineales).

  // andR: Γ ⊢ A∧B, Δ  ↦  Γ ⊢ A, Δ  ∧  Γ ⊢ B, Δ
  for (let i = 0; i < dedupR.length; i++) {
    const slot = dedupR[i];
    if (
      slot &&
      slot.formula.kind === 'and' &&
      slot.formula.args &&
      slot.formula.args[0] &&
      slot.formula.args[1]
    ) {
      const a = slot.formula.args[0];
      const b = slot.formula.args[1];
      const restR = removeAt(dedupR, i);
      const subA = prove(dedupL, [{ formula: a, key: formulaKey(a) }, ...restR], ctx);
      if (!subA) return undefined;
      const subB = prove(dedupL, [{ formula: b, key: formulaKey(b) }, ...restR], ctx);
      if (!subB) return undefined;
      return {
        goal,
        rule: 'andR',
        principalFormula: slot.formula,
        premises: [subA, subB],
        closed: subA.closed && subB.closed,
      };
    }
  }

  // orL: Γ, A∨B ⊢ Δ  ↦  Γ, A ⊢ Δ  ∧  Γ, B ⊢ Δ
  for (let i = 0; i < dedupL.length; i++) {
    const slot = dedupL[i];
    if (
      slot &&
      slot.formula.kind === 'or' &&
      slot.formula.args &&
      slot.formula.args[0] &&
      slot.formula.args[1]
    ) {
      const a = slot.formula.args[0];
      const b = slot.formula.args[1];
      const restL = removeAt(dedupL, i);
      const subA = prove([{ formula: a, key: formulaKey(a) }, ...restL], dedupR, ctx);
      if (!subA) return undefined;
      const subB = prove([{ formula: b, key: formulaKey(b) }, ...restL], dedupR, ctx);
      if (!subB) return undefined;
      return {
        goal,
        rule: 'orL',
        principalFormula: slot.formula,
        premises: [subA, subB],
        closed: subA.closed && subB.closed,
      };
    }
  }

  // impL: Γ, A→B ⊢ Δ  ↦  Γ ⊢ A, Δ  ∧  Γ, B ⊢ Δ
  for (let i = 0; i < dedupL.length; i++) {
    const slot = dedupL[i];
    if (
      slot &&
      slot.formula.kind === 'implies' &&
      slot.formula.args &&
      slot.formula.args[0] &&
      slot.formula.args[1]
    ) {
      const a = slot.formula.args[0];
      const b = slot.formula.args[1];
      const restL = removeAt(dedupL, i);
      const subA = prove(restL, [{ formula: a, key: formulaKey(a) }, ...dedupR], ctx);
      if (!subA) return undefined;
      const subB = prove([{ formula: b, key: formulaKey(b) }, ...restL], dedupR, ctx);
      if (!subB) return undefined;
      return {
        goal,
        rule: 'impL',
        principalFormula: slot.formula,
        premises: [subA, subB],
        closed: subA.closed && subB.closed,
      };
    }
  }

  // 6. Si llegamos aca, no quedan formulas complejas que descomponer y
  //    no se encontro axioma: el secuente no es derivable (es una hoja
  //    abierta del arbol de busqueda).
  const complexL = findFirstComplex(dedupL);
  const complexR = findFirstComplex(dedupR);
  if (!complexL && !complexR) {
    return { goal, premises: [], closed: false };
  }

  // Si todavia queda complejidad pero nuestras ramas fueron consumidas,
  // significa que el algoritmo no encontro forma de avanzar. No deberia
  // ocurrir con la base normalizada; devolvemos undefined como senal.
  return undefined;
}

/**
 * Demuestra `seq` (Γ ⊢ Δ) por backward search en G3.
 * Normaliza las formulas antes de comenzar.
 */
export function proveSequent(seq: Sequent, options: { budget?: number } = {}): ProveResult {
  const normLeft = seq.left.map(normalizeForG3);
  const normRight = seq.right.map(normalizeForG3);
  const ctx: ProveCtx = { budget: options.budget ?? 5_000, used: 0 };
  const tree = prove(slotsOf(normLeft), slotsOf(normRight), ctx);
  if (!tree) return { provable: false };
  return { provable: tree.closed, proof: tree };
}

/**
 * Atajo: demuestra que `⊢ φ` (formula sin hipotesis) es valida en G3.
 */
export function proveFormula(formula: Formula, options: { budget?: number } = {}): ProveResult {
  return proveSequent({ left: [], right: [formula] }, options);
}
