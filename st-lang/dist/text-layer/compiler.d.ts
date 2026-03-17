import { Anchor, Passage, Formalization, Claim, Support, Confidence, Context, Formula, Theory, Diagnostic } from '../types';
export interface TextLayerState {
    passages: Map<string, Passage>;
    formalizations: Map<string, Formalization>;
    claims: Map<string, Claim>;
    supports: Support[];
    confidences: Confidence[];
    contexts: Context[];
}
export declare function createTextLayerState(): TextLayerState;
export declare function parseAnchorPath(raw: string): Anchor;
export declare function registerPassage(state: TextLayerState, name: string, anchorPath: string): Diagnostic[];
export declare function registerFormalization(state: TextLayerState, name: string, passageName: string, formula: Formula): Diagnostic[];
export declare function registerClaim(state: TextLayerState, name: string, formula?: Formula, formalizationRef?: string): Diagnostic[];
export declare function registerSupport(state: TextLayerState, claimName: string, sourceName: string): Diagnostic[];
export declare function registerConfidence(state: TextLayerState, claimName: string, value: number): Diagnostic[];
export declare function registerContext(state: TextLayerState, claimName: string, text: string): Diagnostic[];
export declare function compileClaimsToTheory(state: TextLayerState, theory: Theory): Diagnostic[];
//# sourceMappingURL=compiler.d.ts.map