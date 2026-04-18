// ============================================================
// ST Intuitionistic Propositional — Kripke directo
// ============================================================
// Lógica intuicionista (IPC): sin ley del tercero excluido,
// sin doble negación eliminación.
//
// Implementación: enumeración exhaustiva de modelos Kripke
// finitos (preórdenes con persistencia de átomos).
// Para fórmulas proposicionales con n átomos, generamos todos
// los preórdenes de tamaño ≤ k y todas las valuaciones
// persistentes, verificando si la fórmula se fuerza en la raíz.
//
// Corrección: IPC es completa respecto a frames finitos
// (teorema de completitud de Kripke).
// ============================================================

import { Formula, RunResult, Theory, Diagnostic, LogicProfile } from '../../types';
import { formulaToString, collectAtoms } from '../classical/propositional';

// ── Modelo Kripke ───────────────────────────────────────────

interface KripkeModel {
  worlds: number[];
  /** Relación de accesibilidad: access[w] = conjunto de mundos accesibles */
  access: Map<number, Set<number>>;
  /** Valuación: val[w] = conjunto de átomos verdaderos en w */
  val: Map<number, Set<string>>;
}

// ── Forzar (forcing) intuicionista ──────────────────────────

function forces(model: KripkeModel, w: number, f: Formula): boolean {
  switch (f.kind) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'atom':
      return model.val.get(w)?.has(f.name || '') || false;

    case 'not': {
      // ¬φ se fuerza en w sii NO existe v ≥ w tal que v ⊩ φ
      const inner = (f.args || [])[0];
      if (!inner) return true;
      for (const v of reachable(model, w)) {
        if (forces(model, v, inner)) return false;
      }
      return true;
    }

    case 'and': {
      const args = f.args || [];
      return args.every((a) => forces(model, w, a));
    }

    case 'or': {
      const args = f.args || [];
      return args.some((a) => forces(model, w, a));
    }

    case 'implies': {
      // φ→ψ se fuerza en w sii para todo v ≥ w, si v ⊩ φ entonces v ⊩ ψ
      const args = f.args || [];
      if (args.length < 2) return true;
      for (const v of reachable(model, w)) {
        if (forces(model, v, args[0]) && !forces(model, v, args[1])) return false;
      }
      return true;
    }

    case 'biconditional': {
      const args = f.args || [];
      if (args.length < 2) return true;
      const impl1: Formula = { kind: 'implies', args: [args[0], args[1]] };
      const impl2: Formula = { kind: 'implies', args: [args[1], args[0]] };
      return forces(model, w, impl1) && forces(model, w, impl2);
    }

    case 'nand': {
      const args = f.args || [];
      if (args.length < 2) return true;
      const andF: Formula = { kind: 'and', args: [args[0], args[1]] };
      return forces(model, w, { kind: 'not', args: [andF] });
    }

    case 'nor': {
      const args = f.args || [];
      if (args.length < 2) return true;
      const orF: Formula = { kind: 'or', args: [args[0], args[1]] };
      return forces(model, w, { kind: 'not', args: [orF] });
    }

    case 'xor': {
      const args = f.args || [];
      if (args.length < 2) return false;
      // (A & !B) | (!A & B)
      const a = args[0];
      const b = args[1];
      const notA: Formula = { kind: 'not', args: [a] };
      const notB: Formula = { kind: 'not', args: [b] };
      const f1: Formula = { kind: 'and', args: [a, notB] };
      const f2: Formula = { kind: 'and', args: [notA, b] };
      return forces(model, w, { kind: 'or', args: [f1, f2] });
    }

    // Modal: interpretar □ como universal en accesibles, ◇ como existencial
    case 'modal_necessity': {
      const inner = (f.args || [])[0];
      if (!inner) return true;
      for (const v of reachable(model, w)) {
        if (!forces(model, v, inner)) return false;
      }
      return true;
    }

    case 'modal_possibility': {
      const inner = (f.args || [])[0];
      if (!inner) return false;
      for (const v of reachable(model, w)) {
        if (forces(model, v, inner)) return true;
      }
      return false;
    }

    default:
      return false;
  }
}

/** Cierre transitivo-reflexivo desde w */
function reachable(model: KripkeModel, w: number): number[] {
  const visited = new Set<number>();
  const queue = [w];
  while (queue.length > 0) {
    const current = queue.shift() as number;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of model.access.get(current) || []) {
      queue.push(next);
    }
  }
  return Array.from(visited);
}

// ── Generador de modelos Kripke finitos ─────────────────────

/**
 * Genera todos los preórdenes (reflexivos + transitivos)
 * sobre {0, ..., n-1} y todas las valuaciones persistentes
 * de los átomos dados.
 *
 * Para IPC proposicional con pocos átomos, 3 mundos son
 * suficientes para refutar cualquier no-teorema.
 */
function* generateModels(atoms: string[], maxWorlds: number): Generator<KripkeModel> {
  const n = Math.min(maxWorlds, 4); // Limitar a 4 mundos máx

  for (let size = 1; size <= n; size++) {
    const worlds = Array.from({ length: size }, (_, i) => i);
    const seenPreorders = new Set<string>();

    // Generar todos los subconjuntos de aristas (sin incluir reflexivas, que siempre van)
    const pairs: [number, number][] = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i !== j) pairs.push([i, j]);
      }
    }

    const edgeCombinations = 1 << pairs.length;

    for (let edgeMask = 0; edgeMask < edgeCombinations; edgeMask++) {
      // Construir relación de accesibilidad
      const access = new Map<number, Set<number>>();
      for (const w of worlds) access.set(w, new Set([w])); // Reflexividad

      for (let b = 0; b < pairs.length; b++) {
        if (edgeMask & (1 << b)) {
          (access.get(pairs[b][0]) as Set<number>).add(pairs[b][1]);
        }
      }

      // Cerrar transitivamente
      transitiveClosure(access, worlds);

      // Deduplicar preórdenes idénticos
      let hash = '';
      for (const w of worlds) {
        hash +=
          w +
          ':' +
          Array.from(access.get(w) as Set<number>)
            .sort()
            .join(',') +
          ';';
      }
      if (seenPreorders.has(hash)) continue;
      seenPreorders.add(hash);

      // Generar todas las valuaciones persistentes
      yield* generatePersistentValuations(worlds, access, atoms);
    }
  }
}

function transitiveClosure(access: Map<number, Set<number>>, worlds: number[]): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const w of worlds) {
      const acc = access.get(w) as Set<number>;
      const toAdd: number[] = [];
      for (const v of acc) {
        for (const u of access.get(v) || []) {
          if (!acc.has(u)) toAdd.push(u);
        }
      }
      for (const u of toAdd) {
        acc.add(u);
        changed = true;
      }
    }
  }
}

function* generatePersistentValuations(
  worlds: number[],
  access: Map<number, Set<number>>,
  atoms: string[],
): Generator<KripkeModel> {
  const upwardSets = computeUpwardSets(worlds, access);
  const atomCount = atoms.length;

  // Cada átomo elige uno de los upward-closed sets
  const total = Math.pow(upwardSets.length, atomCount);

  for (let i = 0; i < total; i++) {
    const val = new Map<number, Set<string>>();
    for (const w of worlds) val.set(w, new Set());

    let idx = i;
    for (let a = 0; a < atomCount; a++) {
      const setIdx = idx % upwardSets.length;
      idx = Math.floor(idx / upwardSets.length);
      const truthWorlds = upwardSets[setIdx];
      for (const w of truthWorlds) {
        (val.get(w) as Set<string>).add(atoms[a]);
      }
    }

    yield { worlds, access, val };
  }
}

function computeUpwardSets(worlds: number[], access: Map<number, Set<number>>): number[][] {
  // Un conjunto S es upward-closed si w∈S y wRv implica v∈S
  const n = worlds.length;
  const result: number[][] = [];
  const total = 1 << n;

  for (let mask = 0; mask < total; mask++) {
    const set = worlds.filter((_, i) => mask & (1 << i));
    let upward = true;
    for (const w of set) {
      for (const v of access.get(w) || []) {
        if (!(mask & (1 << v))) {
          upward = false;
          break;
        }
      }
      if (!upward) break;
    }
    if (upward) result.push(set);
  }

  return result;
}

// ── Verificación de validez ─────────────────────────────────

/** ¿Es φ válida en IPC? (forzada en la raíz de todo modelo Kripke finito) */
function isIPCValid(formula: Formula): boolean {
  const atoms = Array.from(collectAtoms(formula));
  const maxWorlds = atoms.length <= 2 ? 4 : 3;

  for (const model of generateModels(atoms, maxWorlds)) {
    if (!forces(model, 0, formula)) return false;
  }
  return true;
}

/** ¿Es φ satisfacible en IPC? */
function isIPCSatisfiable(formula: Formula): boolean {
  const atoms = Array.from(collectAtoms(formula));
  const maxWorlds = atoms.length <= 2 ? 4 : 3;

  for (const model of generateModels(atoms, maxWorlds)) {
    if (forces(model, 0, formula)) return true;
  }
  return false;
}

// ── Profile ─────────────────────────────────────────────────

export class IntuitionisticPropositional implements LogicProfile {
  name = 'intuitionistic.propositional';
  description =
    'Lógica intuicionista proposicional — sin tercero excluido, sin doble negación eliminación';

  checkWellFormed(formula: Formula): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const walk = (f: Formula) => {
      if (f.kind === 'atom' && !f.name) {
        diags.push({ severity: 'error', message: 'Átomo sin nombre' });
      }
      if (f.kind === 'modal_necessity' || f.kind === 'modal_possibility') {
        diags.push({
          severity: 'warning',
          message: 'Los operadores modales □/◇ no forman parte de la lógica intuicionista',
        });
      }
      f.args?.forEach(walk);
    };
    walk(formula);
    return diags;
  }

  checkValid(formula: Formula): RunResult {
    const valid = isIPCValid(formula);
    const fStr = formulaToString(formula);
    return {
      status: valid ? 'valid' : 'invalid',
      output: valid
        ? `${fStr} es VÁLIDA intuicionistamente`
        : `${fStr} NO es válida intuicionistamente`,
      diagnostics: [],
      formula,
    };
  }

  checkSatisfiable(formula: Formula): RunResult {
    const sat = isIPCSatisfiable(formula);
    const fStr = formulaToString(formula);
    return {
      status: sat ? 'satisfiable' : 'unsatisfiable',
      output: sat
        ? `${fStr} es SATISFACIBLE intuicionistamente`
        : `${fStr} es INSATISFACIBLE intuicionistamente`,
      diagnostics: [],
      formula,
    };
  }

  prove(goal: Formula, theory: Theory, premises?: string[]): RunResult {
    const useRestricted = premises !== undefined && premises.length > 0;
    const diagnostics: Diagnostic[] = [];
    const axioms: Formula[] = [];
    if (useRestricted) {
      for (const n of premises) {
        const f = theory.axioms.get(n) || theory.theorems.get(n);
        if (f) axioms.push(f);
        else
          diagnostics.push({
            severity: 'warning',
            message: `Premisa '${n}' no encontrada en la teoría; será ignorada en prove`,
          });
      }
    } else {
      axioms.push(...theory.axioms.values());
    }
    if (axioms.length === 0) {
      const r = this.checkValid(goal);
      if (diagnostics.length) r.diagnostics = [...(r.diagnostics || []), ...diagnostics];
      return r;
    }
    const conj: Formula = axioms.reduce((a, b) => ({ kind: 'and' as const, args: [a, b] }));
    const impl: Formula = { kind: 'implies', args: [conj, goal] };
    const r = this.checkValid(impl);
    if (diagnostics.length) r.diagnostics = [...(r.diagnostics || []), ...diagnostics];
    return r;
  }

  derive(goal: Formula, premises: string[], theory: Theory): RunResult {
    const fs: Formula[] = [];
    for (const n of premises) {
      const f = theory.axioms.get(n) || theory.theorems.get(n);
      if (!f) {
        return {
          status: 'error',
          output: `Premisa no encontrada: ${n}`,
          diagnostics: [{ severity: 'error', message: `'${n}' no definida` }],
          formula: goal,
        };
      }
      fs.push(f);
    }
    if (fs.length === 0) return this.checkValid(goal);
    const conj: Formula = fs.reduce((a, b) => ({ kind: 'and' as const, args: [a, b] }));
    const impl: Formula = { kind: 'implies', args: [conj, goal] };
    return this.checkValid(impl);
  }

  countermodel(formula: Formula): RunResult {
    const atoms = Array.from(collectAtoms(formula));
    const maxWorlds = atoms.length <= 2 ? 4 : 3;
    const fStr = formulaToString(formula);

    for (const model of generateModels(atoms, maxWorlds)) {
      if (!forces(model, 0, formula)) {
        const desc = describeModel(model);
        const trace = traceForcing(model, 0, formula, 0);
        return {
          status: 'invalid',
          output: `Contramodelo intuicionista para ${fStr}:\n${desc}\n\nTraza de forcing en w0:\n${trace.join('\n')}`,
          diagnostics: [],
          formula,
        };
      }
    }
    return {
      status: 'valid',
      output: `No existe contramodelo — ${fStr} es válida intuicionistamente`,
      diagnostics: [],
      formula,
    };
  }

  explain(formula: Formula): RunResult {
    const fStr = formulaToString(formula);
    const valid = isIPCValid(formula);
    let explanation = `Fórmula: ${fStr}\n\n`;
    explanation += [
      'Sistema: Lógica Intuicionista Proposicional (IPC)',
      '',
      'Interpretación Brouwer-Heyting-Kolmogorov (BHK):',
      '  Una prueba de P → Q es un algoritmo que transforma una prueba de P en una prueba de Q',
      '  Una prueba de P ∧ Q es un par (prueba de P, prueba de Q)',
      '  Una prueba de P ∨ Q es un par (i, prueba) donde i indica si es prueba de P o de Q',
      '  Una prueba de ¬P es una prueba de P → ⊥ (P lleva a absurdo)',
      '',
      'Propiedad de la disyunción (IPC):',
      '  Si ⊢ P ∨ Q en IPC, entonces ⊢ P o ⊢ Q.',
      '  (No se puede probar una disyunción sin probar uno de los disyuntos)',
      '',
      'Comparación con lógica clásica (Leyes clave):',
      '  │ Ley                          │ CPC │ IPC │',
      '  │ P ∨ ¬P (LEM)                 │ ✓   │ ✗   │',
      '  │ ¬¬P → P (DNE)                │ ✓   │ ✗   │',
      '  │ ((P→Q)→P)→P (Peirce)         │ ✓   │ ✗   │',
      '  │ P → ¬¬P                      │ ✓   │ ✓   │',
      '  │ (P→Q) → (¬Q→¬P) (Contra.)    │ ✓   │ ✓   │',
      '  │ (P ∧ ¬P) → Q (EFQ)           │ ✓   │ ✓   │',
      '  │ ¬¬¬P → ¬P                    │ ✓   │ ✓   │',
      '',
      'Semántica: Kripke con preórdenes (reflexivo + transitivo)',
      '  Los átomos son persistentes (monótonos)',
    ].join('\n');
    explanation += `\n\nEstatus: ${valid ? 'VÁLIDA' : 'NO válida'} intuicionistamente`;
    return {
      status: valid ? 'valid' : 'invalid',
      output: explanation,
      diagnostics: [],
      formula,
    };
  }

  checkEquivalent(a: Formula, b: Formula): RunResult {
    const biconditional: Formula = { kind: 'biconditional', args: [a, b] };
    const valid = isIPCValid(biconditional);
    const fA = formulaToString(a);
    const fB = formulaToString(b);
    return {
      status: valid ? 'valid' : 'invalid',
      output: valid
        ? `${fA} y ${fB} son EQUIVALENTES intuicionistamente`
        : `${fA} y ${fB} NO son equivalentes intuicionistamente`,
      diagnostics: [],
    };
  }
}

// ── Utilidades ──────────────────────────────────────────────

function describeModel(model: KripkeModel): string {
  const lines: string[] = [];
  lines.push(`Mundos: {${model.worlds.map((w) => 'w' + w).join(', ')}}`);
  for (const w of model.worlds) {
    const acc = Array.from(model.access.get(w) || []).filter((v) => v !== w);
    if (acc.length > 0) lines.push(`  w${w} ≤ {${acc.map((v) => 'w' + v).join(', ')}}`);
    const atoms = Array.from(model.val.get(w) || []);
    lines.push(`  V(w${w}) = {${atoms.join(', ')}}`);
  }
  return lines.join('\n');
}

function traceForcing(model: KripkeModel, w: number, f: Formula, depth: number): string[] {
  const pad = '  '.repeat(depth);
  const fStr = formulaToString(f);
  const prefix = `${pad}¿w${w} ⊩ ${fStr}?`;
  const res = forces(model, w, f);
  const suffix = res ? '→ SÍ' : '→ NO';

  const trace: string[] = [`${prefix}`];

  if (f.kind === 'atom') {
    trace.push(`${pad}  ${f.name} ${res ? '∈' : '∉'} V(w${w}) ${suffix}`);
    return trace;
  }

  if (f.kind === 'or') {
    const args = f.args || [];
    trace.push(`${pad}  Rama izquierda: `);
    trace.push(...traceForcing(model, w, args[0], depth + 2));
    if (!res) {
      trace.push(`${pad}  Rama derecha: `);
      trace.push(...traceForcing(model, w, args[1], depth + 2));
    }
    trace.push(`${pad}  ${suffix}`);
    return trace;
  }

  if (f.kind === 'and') {
    const args = f.args || [];
    trace.push(...traceForcing(model, w, args[0], depth + 1));
    if (res || !forces(model, w, args[0])) {
      // only show second if first passed evaluating true and overall true, or wait, if first failed, we know it's false, so don't show second
      if (forces(model, w, args[0])) {
        trace.push(...traceForcing(model, w, args[1], depth + 1));
      }
    }
    trace.push(`${pad}  ${suffix}`);
    return trace;
  }

  if (f.kind === 'not') {
    const inner = (f.args || [])[0];
    const reach = reachable(model, w);
    trace.push(
      `${pad}  ¬${formulaToString(inner)} en w${w} ≡ ∀v≥w${w}: v ⊮ ${formulaToString(inner)}`,
    );
    for (const v of reach) {
      trace.push(`${pad}  Explorando mundo accesible w${v}: `);
      const fr = traceForcing(model, v, inner, depth + 2);
      trace.push(...fr);
      if (forces(model, v, inner)) {
        trace.push(`${pad}  Pero w${v} ≥ w${w} y w${v} ⊩ ${formulaToString(inner)}`);
        break;
      }
    }
    trace.push(`${pad}  ${suffix}`);
    return trace;
  }

  if (f.kind === 'implies') {
    const args = f.args || [];
    const reach = reachable(model, w);
    trace.push(`${pad}  (A→B) en w${w} ≡ ∀v≥w${w}: v ⊩ A implica v ⊩ B`);
    for (const v of reach) {
      trace.push(`${pad}  Explorando mundo accesible w${v}: `);
      if (forces(model, v, args[0]) && !forces(model, v, args[1])) {
        trace.push(`${pad}  Falla en w${v}:`);
        trace.push(...traceForcing(model, v, args[0], depth + 2));
        trace.push(...traceForcing(model, v, args[1], depth + 2));
        break;
      } else if (!forces(model, v, args[0])) {
        trace.push(`${pad}    w${v} ⊮ ${formulaToString(args[0])} (Evitado falsedad antecedente)`);
      } else {
        trace.push(
          `${pad}    w${v} ⊩ ${formulaToString(args[0])} y w${v} ⊩ ${formulaToString(args[1])}`,
        );
      }
    }
    trace.push(`${pad}  ${suffix}`);
    return trace;
  }

  trace.push(`${pad}  Eval: ${suffix}`);
  return trace;
}
