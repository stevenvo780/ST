// ============================================================
// Markov Logic — Grounding de fórmulas
// ============================================================
//
// `ground(theory)` produce TODAS las instancias cerradas (sin
// variables libres) de cada fórmula de la teoría, una por
// combinación de constantes compatible con los tipos del
// predicado en el que aparece la variable.
//
// La inferencia de tipos por variable se hace en una primera pasada
// sobre la fórmula: por cada átomo `Pred(x, y, ...)` consultamos
// `predicates[Pred].types` y asignamos el tipo de cada argumento a la
// variable correspondiente. Si la misma variable aparece en dos
// posiciones tipadas distintamente, se reporta error (typing claro
// como pide la convención del workspace).

import { type FOLNode, freeVariables, isVariable, parseFOL } from './parser';
import type { GroundedFormula, MLNFormula, MLNTheory, MLNWorld } from './types';

interface PredicateMap {
  [name: string]: string[]; // arg types
}

function buildPredicateMap(theory: MLNTheory): PredicateMap {
  const out: PredicateMap = {};
  for (const p of theory.predicates) {
    out[p.name] = p.types;
  }
  return out;
}

/** Recorre `node` y devuelve `{ variable → tipo }` inferido. */
function inferVariableTypes(
  node: FOLNode,
  predMap: PredicateMap,
  src: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  const visit = (n: FOLNode): void => {
    switch (n.kind) {
      case 'atom': {
        const types = predMap[n.predicate];
        if (!types) {
          throw new Error(`Predicado "${n.predicate}" no declarado (fórmula: "${src}")`);
        }
        if (types.length !== n.args.length) {
          throw new Error(
            `Predicado "${n.predicate}" espera ${types.length} args, recibió ${n.args.length} (fórmula: "${src}")`,
          );
        }
        for (let i = 0; i < n.args.length; i++) {
          const arg = n.args[i];
          const t = types[i];
          if (isVariable(arg)) {
            const prev = out[arg];
            if (prev !== undefined && prev !== t) {
              throw new Error(
                `Variable "${arg}" usada con tipos distintos: "${prev}" vs "${t}" en "${src}"`,
              );
            }
            out[arg] = t;
          }
        }
        return;
      }
      case 'not':
        visit(n.arg);
        return;
      case 'and':
      case 'or':
      case 'implies':
        visit(n.left);
        visit(n.right);
        return;
    }
  };
  visit(node);
  return out;
}

/** Sustituye variables → constantes y devuelve nuevo nodo. */
function substitute(node: FOLNode, sub: Record<string, string>): FOLNode {
  switch (node.kind) {
    case 'atom':
      return {
        kind: 'atom',
        predicate: node.predicate,
        args: node.args.map((a) => (isVariable(a) && sub[a] !== undefined ? sub[a] : a)),
      };
    case 'not':
      return { kind: 'not', arg: substitute(node.arg, sub) };
    case 'and':
      return { kind: 'and', left: substitute(node.left, sub), right: substitute(node.right, sub) };
    case 'or':
      return { kind: 'or', left: substitute(node.left, sub), right: substitute(node.right, sub) };
    case 'implies':
      return {
        kind: 'implies',
        left: substitute(node.left, sub),
        right: substitute(node.right, sub),
      };
  }
}

/** Canonical key para un ground atom: "Pred(a1,a2,...)". */
export function atomKey(predicate: string, args: string[]): string {
  return `${predicate}(${args.join(',')})`;
}

/** Recopila los atom keys que aparecen en `node`. */
function collectAtoms(node: FOLNode, acc: Set<string>): void {
  switch (node.kind) {
    case 'atom':
      acc.add(atomKey(node.predicate, node.args));
      return;
    case 'not':
      collectAtoms(node.arg, acc);
      return;
    case 'and':
    case 'or':
    case 'implies':
      collectAtoms(node.left, acc);
      collectAtoms(node.right, acc);
      return;
  }
}

/** Evalúa un nodo ya groundeado contra un mundo. */
export function evaluateGround(node: FOLNode, world: MLNWorld): boolean {
  switch (node.kind) {
    case 'atom': {
      const key = atomKey(node.predicate, node.args);
      return world.groundAtoms[key] === true;
    }
    case 'not':
      return !evaluateGround(node.arg, world);
    case 'and':
      return evaluateGround(node.left, world) && evaluateGround(node.right, world);
    case 'or':
      return evaluateGround(node.left, world) || evaluateGround(node.right, world);
    case 'implies':
      return !evaluateGround(node.left, world) || evaluateGround(node.right, world);
  }
}

/** Renderiza un nodo groundeado a string canónico. */
export function renderGround(node: FOLNode): string {
  switch (node.kind) {
    case 'atom':
      return atomKey(node.predicate, node.args);
    case 'not':
      return `¬${renderGround(node.arg)}`;
    case 'and':
      return `(${renderGround(node.left)} ∧ ${renderGround(node.right)})`;
    case 'or':
      return `(${renderGround(node.left)} ∨ ${renderGround(node.right)})`;
    case 'implies':
      return `(${renderGround(node.left)} → ${renderGround(node.right)})`;
  }
}

/** Producto cartesiano de los dominios de cada variable. */
function cartesian(
  vars: string[],
  varTypes: Record<string, string>,
  constants: Record<string, string[]>,
  src: string,
): Array<Record<string, string>> {
  if (vars.length === 0) return [{}];
  // build domain per var
  const domains: string[][] = vars.map((v) => {
    const t = varTypes[v];
    if (!t) {
      throw new Error(`No pude inferir el tipo de la variable "${v}" en "${src}"`);
    }
    const dom = constants[t];
    if (!dom) {
      throw new Error(`Tipo "${t}" no tiene constantes declaradas (fórmula: "${src}")`);
    }
    return dom;
  });
  const out: Array<Record<string, string>> = [];
  const buf: string[] = new Array<string>(vars.length).fill('');
  const rec = (i: number): void => {
    if (i === vars.length) {
      const sub: Record<string, string> = {};
      for (let j = 0; j < vars.length; j++) {
        sub[vars[j]] = buf[j]!;
      }
      out.push(sub);
      return;
    }
    const dom = domains[i];
    for (const c of dom) {
      buf[i] = c;
      rec(i + 1);
    }
  };
  rec(0);
  return out;
}

/** Groundea una sola fórmula. */
export function groundFormula(
  formula: MLNFormula,
  predMap: PredicateMap,
  constants: Record<string, string[]>,
): GroundedFormula[] {
  const ast = parseFOL(formula.formula);
  const varTypes = inferVariableTypes(ast, predMap, formula.formula);
  const vars = freeVariables(ast);
  const subs = cartesian(vars, varTypes, constants, formula.formula);
  const out: GroundedFormula[] = [];
  for (const sub of subs) {
    const ground = substitute(ast, sub);
    const atomSet = new Set<string>();
    collectAtoms(ground, atomSet);
    const atoms = Array.from(atomSet);
    out.push({
      groundFormula: renderGround(ground),
      weight: formula.weight,
      satisfied: (w) => evaluateGround(ground, w),
      violations: (w) => (evaluateGround(ground, w) ? 0 : 1),
      atoms,
    });
  }
  return out;
}

/** Groundea TODAS las fórmulas de la teoría. */
export function ground(theory: MLNTheory): GroundedFormula[] {
  const predMap = buildPredicateMap(theory);
  const out: GroundedFormula[] = [];
  for (const f of theory.formulas) {
    for (const g of groundFormula(f, predMap, constantsOf(theory))) {
      out.push(g);
    }
  }
  return out;
}

function constantsOf(theory: MLNTheory): Record<string, string[]> {
  return theory.constants;
}

/** Enumera TODOS los ground atoms de la teoría (Herbrand base). */
export function allGroundAtoms(theory: MLNTheory): string[] {
  const out: string[] = [];
  for (const p of theory.predicates) {
    const arity = p.types.length;
    if (arity === 0) {
      out.push(atomKey(p.name, []));
      continue;
    }
    // cartesian over each arg's type
    const domains: string[][] = p.types.map((t) => {
      const d = theory.constants[t];
      if (!d) throw new Error(`Tipo "${t}" sin constantes (predicado "${p.name}")`);
      return d;
    });
    const buf: string[] = new Array<string>(arity).fill('');
    const rec = (i: number): void => {
      if (i === arity) {
        out.push(atomKey(p.name, buf.slice()));
        return;
      }
      const dom = domains[i];
      for (const c of dom) {
        buf[i] = c;
        rec(i + 1);
      }
    };
    rec(0);
  }
  return out;
}
