import { Formula, Diagnostic, RunResult, Theory, LogicProfile, TruthTableResult } from '../../types';
export declare function formulaToString(f: Formula): string;
export declare class ClassicalPropositional implements LogicProfile {
    name: string;
    description: string;
    checkWellFormed(formula: Formula): Diagnostic[];
    checkValid(formula: Formula): RunResult;
    checkSatisfiable(formula: Formula): RunResult;
    prove(goal: Formula, theory: Theory): RunResult;
    derive(goal: Formula, premises: string[], theory: Theory): RunResult;
    countermodel(formula: Formula): RunResult;
    explain(formula: Formula): RunResult;
    truthTable(formula: Formula): TruthTableResult;
    checkEquivalent(a: Formula, b: Formula): RunResult;
}
//# sourceMappingURL=propositional.d.ts.map