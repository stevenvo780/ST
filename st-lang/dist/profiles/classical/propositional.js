"use strict";
// ============================================================
// ST Classical Propositional — Motor completo
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassicalPropositional = void 0;
exports.formulaToString = formulaToString;
// --- Utilidades de fórmulas ---
function collectAtoms(f) {
    const atoms = new Set();
    function walk(node) {
        switch (node.kind) {
            case 'atom':
                if (node.name)
                    atoms.add(node.name);
                break;
            case 'not':
                walk(node.args[0]);
                break;
            case 'and':
            case 'or':
            case 'implies':
            case 'biconditional':
                walk(node.args[0]);
                walk(node.args[1]);
                break;
        }
    }
    walk(f);
    return atoms;
}
function evaluate(f, v) {
    switch (f.kind) {
        case 'atom':
            return v[f.name] ?? false;
        case 'not':
            return !evaluate(f.args[0], v);
        case 'and':
            return evaluate(f.args[0], v) && evaluate(f.args[1], v);
        case 'or':
            return evaluate(f.args[0], v) || evaluate(f.args[1], v);
        case 'implies':
            return !evaluate(f.args[0], v) || evaluate(f.args[1], v);
        case 'biconditional':
            return evaluate(f.args[0], v) === evaluate(f.args[1], v);
        default:
            return false;
    }
}
function generateValuations(atoms) {
    const n = atoms.length;
    const total = 1 << n;
    const valuations = [];
    for (let i = 0; i < total; i++) {
        const v = {};
        for (let j = 0; j < n; j++) {
            v[atoms[j]] = Boolean((i >> (n - 1 - j)) & 1);
        }
        valuations.push(v);
    }
    return valuations;
}
function formulaToString(f) {
    switch (f.kind) {
        case 'atom': return f.name || '?';
        case 'not': {
            const inner = f.args[0];
            if (inner.kind === 'atom')
                return `!${formulaToString(inner)}`;
            return `!(${formulaToString(inner)})`;
        }
        case 'and': return `(${formulaToString(f.args[0])} & ${formulaToString(f.args[1])})`;
        case 'or': return `(${formulaToString(f.args[0])} | ${formulaToString(f.args[1])})`;
        case 'implies': return `(${formulaToString(f.args[0])} -> ${formulaToString(f.args[1])})`;
        case 'biconditional': return `(${formulaToString(f.args[0])} <-> ${formulaToString(f.args[1])})`;
        default: return '?';
    }
}
function formulasEqual(a, b) {
    if (a.kind !== b.kind)
        return false;
    if (a.kind === 'atom' && b.kind === 'atom')
        return a.name === b.name;
    if (a.args && b.args) {
        if (a.args.length !== b.args.length)
            return false;
        return a.args.every((arg, i) => formulasEqual(arg, b.args[i]));
    }
    return false;
}
function formulaHash(f) {
    return formulaToString(f);
}
function tryDerive(goal, theory, premiseNames) {
    const state = {
        known: new Map(),
        steps: [],
        stepCount: 0,
    };
    // Cargar premisas
    for (const name of premiseNames) {
        const f = theory.axioms.get(name) || theory.theorems.get(name);
        if (f) {
            state.stepCount++;
            state.steps.push({
                stepNumber: state.stepCount,
                formula: f,
                justification: `Premisa (${name})`,
                premises: [],
            });
            state.known.set(formulaHash(f), f);
        }
    }
    // Intentar derivar con BFS aplicando reglas
    const maxIterations = 200;
    let changed = true;
    let iterations = 0;
    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        const currentFormulas = Array.from(state.known.values());
        for (const f1 of currentFormulas) {
            // Check if goal already found
            if (state.known.has(formulaHash(goal)))
                break;
            for (const f2 of currentFormulas) {
                if (state.known.has(formulaHash(goal)))
                    break;
                // Modus Ponens: de A y (A -> B), derivar B
                if (f2.kind === 'implies' && formulasEqual(f2.args[0], f1)) {
                    const conclusion = f2.args[1];
                    const hash = formulaHash(conclusion);
                    if (!state.known.has(hash)) {
                        state.stepCount++;
                        const s1 = findStep(state.steps, f1);
                        const s2 = findStep(state.steps, f2);
                        state.steps.push({
                            stepNumber: state.stepCount,
                            formula: conclusion,
                            justification: 'Modus Ponens',
                            premises: [s1, s2],
                        });
                        state.known.set(hash, conclusion);
                        changed = true;
                    }
                }
                // Modus Ponens inverso: de (A -> B) y A, derivar B
                if (f1.kind === 'implies' && formulasEqual(f1.args[0], f2)) {
                    const conclusion = f1.args[1];
                    const hash = formulaHash(conclusion);
                    if (!state.known.has(hash)) {
                        state.stepCount++;
                        const s1 = findStep(state.steps, f1);
                        const s2 = findStep(state.steps, f2);
                        state.steps.push({
                            stepNumber: state.stepCount,
                            formula: conclusion,
                            justification: 'Modus Ponens',
                            premises: [s1, s2],
                        });
                        state.known.set(hash, conclusion);
                        changed = true;
                    }
                }
                // Modus Tollens: de !B y (A -> B), derivar !A
                if (f1.kind === 'not' && f2.kind === 'implies' &&
                    formulasEqual(f1.args[0], f2.args[1])) {
                    const conclusion = { kind: 'not', args: [f2.args[0]] };
                    const hash = formulaHash(conclusion);
                    if (!state.known.has(hash)) {
                        state.stepCount++;
                        state.steps.push({
                            stepNumber: state.stepCount,
                            formula: conclusion,
                            justification: 'Modus Tollens',
                            premises: [findStep(state.steps, f1), findStep(state.steps, f2)],
                        });
                        state.known.set(hash, conclusion);
                        changed = true;
                    }
                }
                // Conjunction Introduction: de A y B, derivar A & B
                if (f1 !== f2) {
                    const conj = { kind: 'and', args: [f1, f2] };
                    const hash = formulaHash(conj);
                    if (!state.known.has(hash) && formulasEqual(conj, goal)) {
                        state.stepCount++;
                        state.steps.push({
                            stepNumber: state.stepCount,
                            formula: conj,
                            justification: 'Introduccion de conjuncion',
                            premises: [findStep(state.steps, f1), findStep(state.steps, f2)],
                        });
                        state.known.set(hash, conj);
                        changed = true;
                    }
                }
            }
            // Conjunction Elimination: de A & B, derivar A y B
            if (f1.kind === 'and') {
                for (const sub of f1.args) {
                    const hash = formulaHash(sub);
                    if (!state.known.has(hash)) {
                        state.stepCount++;
                        state.steps.push({
                            stepNumber: state.stepCount,
                            formula: sub,
                            justification: 'Eliminacion de conjuncion',
                            premises: [findStep(state.steps, f1)],
                        });
                        state.known.set(hash, sub);
                        changed = true;
                    }
                }
            }
            // Disjunction Introduction: de A, derivar A | B (si A|B es la meta)
            if (goal.kind === 'or') {
                if (formulasEqual(f1, goal.args[0]) || formulasEqual(f1, goal.args[1])) {
                    const hash = formulaHash(goal);
                    if (!state.known.has(hash)) {
                        state.stepCount++;
                        state.steps.push({
                            stepNumber: state.stepCount,
                            formula: goal,
                            justification: 'Introduccion de disyuncion',
                            premises: [findStep(state.steps, f1)],
                        });
                        state.known.set(hash, goal);
                        changed = true;
                    }
                }
            }
            // Double Negation Elimination: de !!A, derivar A
            if (f1.kind === 'not' && f1.args[0].kind === 'not') {
                const inner = f1.args[0].args[0];
                const hash = formulaHash(inner);
                if (!state.known.has(hash)) {
                    state.stepCount++;
                    state.steps.push({
                        stepNumber: state.stepCount,
                        formula: inner,
                        justification: 'Doble negacion',
                        premises: [findStep(state.steps, f1)],
                    });
                    state.known.set(hash, inner);
                    changed = true;
                }
            }
            // Contraposition: de A->B, derivar !B->!A
            if (f1.kind === 'implies') {
                const contra = {
                    kind: 'implies',
                    args: [
                        { kind: 'not', args: [f1.args[1]] },
                        { kind: 'not', args: [f1.args[0]] },
                    ]
                };
                const hash = formulaHash(contra);
                if (!state.known.has(hash)) {
                    state.stepCount++;
                    state.steps.push({
                        stepNumber: state.stepCount,
                        formula: contra,
                        justification: 'Contraposicion',
                        premises: [findStep(state.steps, f1)],
                    });
                    state.known.set(hash, contra);
                    changed = true;
                }
            }
            // Biconditional Elimination: de A<->B, derivar A->B y B->A
            if (f1.kind === 'biconditional') {
                const ab = { kind: 'implies', args: [f1.args[0], f1.args[1]] };
                const ba = { kind: 'implies', args: [f1.args[1], f1.args[0]] };
                for (const impl of [ab, ba]) {
                    const hash = formulaHash(impl);
                    if (!state.known.has(hash)) {
                        state.stepCount++;
                        state.steps.push({
                            stepNumber: state.stepCount,
                            formula: impl,
                            justification: 'Eliminacion de bicondicional',
                            premises: [findStep(state.steps, f1)],
                        });
                        state.known.set(hash, impl);
                        changed = true;
                    }
                }
            }
        }
    }
    if (state.known.has(formulaHash(goal))) {
        // Filtrar solo pasos relevantes para la derivación
        const relevantSteps = traceBack(state.steps, goal);
        return {
            goal,
            steps: relevantSteps,
            status: 'complete',
            derivedFrom: premiseNames,
        };
    }
    // Fallback: verificar semánticamente
    const allAxiomFormulas = premiseNames
        .map(n => theory.axioms.get(n) || theory.theorems.get(n))
        .filter((f) => f !== undefined);
    if (allAxiomFormulas.length > 0) {
        const atoms = new Set();
        for (const f of allAxiomFormulas)
            collectAtoms(f).forEach(a => atoms.add(a));
        collectAtoms(goal).forEach(a => atoms.add(a));
        const atomList = Array.from(atoms);
        const valuations = generateValuations(atomList);
        let semanticallyValid = true;
        for (const v of valuations) {
            const premisesTrue = allAxiomFormulas.every(f => evaluate(f, v));
            if (premisesTrue && !evaluate(goal, v)) {
                semanticallyValid = false;
                break;
            }
        }
        if (semanticallyValid) {
            return {
                goal,
                steps: state.steps,
                status: 'complete',
                derivedFrom: premiseNames,
            };
        }
    }
    return null;
}
function findStep(steps, formula) {
    const hash = formulaHash(formula);
    for (const s of steps) {
        if (formulaHash(s.formula) === hash)
            return s.stepNumber;
    }
    return 0;
}
function traceBack(steps, goal) {
    const goalHash = formulaHash(goal);
    const needed = new Set();
    const goalStep = steps.find(s => formulaHash(s.formula) === goalHash);
    if (!goalStep)
        return steps;
    function trace(stepNum) {
        if (needed.has(stepNum))
            return;
        needed.add(stepNum);
        const step = steps.find(s => s.stepNumber === stepNum);
        if (step) {
            for (const p of step.premises) {
                trace(p);
            }
        }
    }
    trace(goalStep.stepNumber);
    return steps.filter(s => needed.has(s.stepNumber));
}
// --- Perfil Classical Propositional ---
class ClassicalPropositional {
    name = 'classical.propositional';
    description = 'Logica clasica proposicional con tabla de verdad, validez, satisfacibilidad, derivacion y contramodelo';
    checkWellFormed(formula) {
        const diags = [];
        function check(f) {
            switch (f.kind) {
                case 'atom':
                    if (!f.name) {
                        diags.push({ severity: 'error', message: 'Atomo sin nombre' });
                    }
                    break;
                case 'not':
                    if (!f.args || f.args.length !== 1) {
                        diags.push({ severity: 'error', message: 'Negacion requiere exactamente un argumento' });
                    }
                    else {
                        check(f.args[0]);
                    }
                    break;
                case 'and':
                case 'or':
                case 'implies':
                case 'biconditional':
                    if (!f.args || f.args.length !== 2) {
                        diags.push({ severity: 'error', message: `${f.kind} requiere exactamente dos argumentos` });
                    }
                    else {
                        check(f.args[0]);
                        check(f.args[1]);
                    }
                    break;
                case 'forall':
                case 'exists':
                case 'predicate':
                case 'equals':
                case 'modal_necessity':
                case 'modal_possibility':
                    diags.push({
                        severity: 'error',
                        message: `'${f.kind}' no esta soportado en logica proposicional clasica`,
                    });
                    break;
            }
        }
        check(formula);
        return diags;
    }
    checkValid(formula) {
        const wf = this.checkWellFormed(formula);
        if (wf.length > 0) {
            return { status: 'error', diagnostics: wf, formula };
        }
        const tt = this.truthTable(formula);
        if (tt.isTautology) {
            return {
                status: 'valid',
                output: `${formulaToString(formula)} es VALIDA (tautologia)`,
                truthTable: tt,
                diagnostics: [],
                formula,
            };
        }
        else {
            // Encontrar contramodelo
            const cm = tt.rows.find(r => !r.result);
            return {
                status: 'invalid',
                output: `${formulaToString(formula)} NO es valida`,
                truthTable: tt,
                model: cm ? { type: 'propositional', valuation: cm.valuation } : undefined,
                diagnostics: [],
                formula,
            };
        }
    }
    checkSatisfiable(formula) {
        const wf = this.checkWellFormed(formula);
        if (wf.length > 0) {
            return { status: 'error', diagnostics: wf, formula };
        }
        const tt = this.truthTable(formula);
        if (tt.isSatisfiable) {
            const sat = tt.rows.find(r => r.result);
            return {
                status: 'satisfiable',
                output: `${formulaToString(formula)} es SATISFACIBLE`,
                model: sat ? { type: 'propositional', valuation: sat.valuation } : undefined,
                truthTable: tt,
                diagnostics: [],
                formula,
            };
        }
        else {
            return {
                status: 'unsatisfiable',
                output: `${formulaToString(formula)} es INSATISFACIBLE (contradiccion)`,
                truthTable: tt,
                diagnostics: [],
                formula,
            };
        }
    }
    prove(goal, theory) {
        const wf = this.checkWellFormed(goal);
        if (wf.length > 0) {
            return { status: 'error', diagnostics: wf, formula: goal };
        }
        const premiseNames = Array.from(theory.axioms.keys());
        const proof = tryDerive(goal, theory, premiseNames);
        if (proof && proof.status === 'complete') {
            return {
                status: 'provable',
                output: `${formulaToString(goal)} es DEMOSTRABLE desde la teoria`,
                proof,
                diagnostics: [],
                formula: goal,
            };
        }
        return {
            status: 'refutable',
            output: `${formulaToString(goal)} NO es demostrable desde la teoria dada`,
            diagnostics: [],
            formula: goal,
        };
    }
    derive(goal, premises, theory) {
        const wf = this.checkWellFormed(goal);
        if (wf.length > 0) {
            return { status: 'error', diagnostics: wf, formula: goal };
        }
        const proof = tryDerive(goal, theory, premises);
        if (proof && proof.status === 'complete') {
            return {
                status: 'provable',
                output: `${formulaToString(goal)} derivado exitosamente`,
                proof,
                diagnostics: [],
                formula: goal,
            };
        }
        return {
            status: 'refutable',
            output: `No se puede derivar ${formulaToString(goal)} desde las premisas dadas`,
            diagnostics: [],
            formula: goal,
        };
    }
    countermodel(formula) {
        const wf = this.checkWellFormed(formula);
        if (wf.length > 0) {
            return { status: 'error', diagnostics: wf, formula };
        }
        const atoms = Array.from(collectAtoms(formula));
        const valuations = generateValuations(atoms);
        for (const v of valuations) {
            if (!evaluate(formula, v)) {
                return {
                    status: 'invalid',
                    output: `Contramodelo encontrado para ${formulaToString(formula)}`,
                    model: { type: 'propositional', valuation: v },
                    diagnostics: [],
                    formula,
                };
            }
        }
        return {
            status: 'valid',
            output: `${formulaToString(formula)} es tautologia, no hay contramodelo`,
            diagnostics: [],
            formula,
        };
    }
    explain(formula) {
        const wf = this.checkWellFormed(formula);
        if (wf.length > 0) {
            return { status: 'error', diagnostics: wf, formula };
        }
        const tt = this.truthTable(formula);
        let explanation = `Formula: ${formulaToString(formula)}\n`;
        explanation += `Variables: ${tt.variables.join(', ')}\n`;
        explanation += `Tautologia: ${tt.isTautology ? 'si' : 'no'}\n`;
        explanation += `Contradiccion: ${tt.isContradiction ? 'si' : 'no'}\n`;
        explanation += `Satisfacible: ${tt.isSatisfiable ? 'si' : 'no'}\n`;
        explanation += `Total valuaciones: ${tt.rows.length}\n`;
        explanation += `Verdaderas: ${tt.rows.filter(r => r.result).length}\n`;
        explanation += `Falsas: ${tt.rows.filter(r => !r.result).length}\n`;
        return {
            status: tt.isTautology ? 'valid' : tt.isSatisfiable ? 'satisfiable' : 'unsatisfiable',
            output: explanation,
            truthTable: tt,
            diagnostics: [],
            formula,
        };
    }
    truthTable(formula) {
        const atoms = Array.from(collectAtoms(formula)).sort();
        const valuations = generateValuations(atoms);
        const rows = valuations.map(v => ({
            valuation: v,
            result: evaluate(formula, v),
        }));
        return {
            variables: atoms,
            rows,
            isTautology: rows.every(r => r.result),
            isContradiction: rows.every(r => !r.result),
            isSatisfiable: rows.some(r => r.result),
        };
    }
    checkEquivalent(a, b) {
        const wfA = this.checkWellFormed(a);
        const wfB = this.checkWellFormed(b);
        if (wfA.length > 0 || wfB.length > 0) {
            return { status: 'error', diagnostics: [...wfA, ...wfB] };
        }
        const biconditional = { kind: 'biconditional', args: [a, b] };
        const tt = this.truthTable(biconditional);
        if (tt.isTautology) {
            return {
                status: 'valid',
                output: `${formulaToString(a)} y ${formulaToString(b)} son EQUIVALENTES`,
                truthTable: tt,
                diagnostics: [],
            };
        }
        const cm = tt.rows.find(r => !r.result);
        return {
            status: 'invalid',
            output: `${formulaToString(a)} y ${formulaToString(b)} NO son equivalentes`,
            model: cm ? { type: 'propositional', valuation: cm.valuation } : undefined,
            diagnostics: [],
        };
    }
}
exports.ClassicalPropositional = ClassicalPropositional;
//# sourceMappingURL=propositional.js.map