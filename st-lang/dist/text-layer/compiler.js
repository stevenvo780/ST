"use strict";
// ============================================================
// ST Text Layer — Compilador texto -> formula/claim
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTextLayerState = createTextLayerState;
exports.parseAnchorPath = parseAnchorPath;
exports.registerPassage = registerPassage;
exports.registerFormalization = registerFormalization;
exports.registerClaim = registerClaim;
exports.registerSupport = registerSupport;
exports.registerConfidence = registerConfidence;
exports.registerContext = registerContext;
exports.compileClaimsToTheory = compileClaimsToTheory;
function createTextLayerState() {
    return {
        passages: new Map(),
        formalizations: new Map(),
        claims: new Map(),
        supports: [],
        confidences: [],
        contexts: [],
    };
}
// Parsear anchor path: "archivo.md#heading" -> Anchor
function parseAnchorPath(raw) {
    const parts = raw.split('#');
    const path = parts[0].trim();
    const fragment = parts[1]?.trim();
    let type = 'block';
    if (fragment) {
        if (fragment.startsWith('h'))
            type = 'heading';
        else if (fragment.startsWith('p'))
            type = 'paragraph';
        else if (fragment.startsWith('r'))
            type = 'range';
        else
            type = 'block';
    }
    return { path, fragment, type };
}
// Registrar un passage
function registerPassage(state, name, anchorPath) {
    const anchor = parseAnchorPath(anchorPath);
    state.passages.set(name, { name, anchor });
    return [];
}
// Registrar una formalización
function registerFormalization(state, name, passageName, formula) {
    const diags = [];
    if (!state.passages.has(passageName)) {
        diags.push({
            severity: 'warning',
            message: `Passage '${passageName}' no encontrado al formalizar '${name}'`,
        });
    }
    state.formalizations.set(name, { name, passage: passageName, formula });
    return diags;
}
// Registrar un claim
function registerClaim(state, name, formula, formalizationRef) {
    const diags = [];
    if (formalizationRef && !state.formalizations.has(formalizationRef) && !state.passages.has(formalizationRef)) {
        diags.push({
            severity: 'warning',
            message: `Referencia '${formalizationRef}' no encontrada para claim '${name}'`,
        });
    }
    state.claims.set(name, { name, formula, formalization: formalizationRef });
    return diags;
}
// Registrar soporte
function registerSupport(state, claimName, sourceName) {
    const diags = [];
    if (!state.claims.has(claimName)) {
        diags.push({
            severity: 'warning',
            message: `Claim '${claimName}' no encontrado para registrar soporte`,
        });
    }
    state.supports.push({ claimName, sourceName });
    // Actualizar claim si existe
    const claim = state.claims.get(claimName);
    if (claim) {
        claim.support = sourceName;
    }
    return diags;
}
// Registrar confianza
function registerConfidence(state, claimName, value) {
    const diags = [];
    if (value < 0 || value > 1) {
        diags.push({
            severity: 'error',
            message: `Confidence debe estar entre 0 y 1, recibido: ${value}`,
        });
    }
    if (!state.claims.has(claimName)) {
        diags.push({
            severity: 'warning',
            message: `Claim '${claimName}' no encontrado para registrar confianza`,
        });
    }
    state.confidences.push({ claimName, value });
    const claim = state.claims.get(claimName);
    if (claim) {
        claim.confidence = value;
    }
    return diags;
}
// Registrar contexto
function registerContext(state, claimName, text) {
    const diags = [];
    if (!state.claims.has(claimName)) {
        diags.push({
            severity: 'warning',
            message: `Claim '${claimName}' no encontrado para registrar contexto`,
        });
    }
    state.contexts.push({ claimName, text });
    const claim = state.claims.get(claimName);
    if (claim) {
        claim.context = text;
    }
    return diags;
}
// Compilar claims a la teoría
function compileClaimsToTheory(state, theory) {
    const diags = [];
    for (const [name, claim] of state.claims) {
        if (claim.formula) {
            theory.claims.set(name, claim);
        }
        else if (claim.formalization) {
            const fz = state.formalizations.get(claim.formalization);
            if (fz) {
                claim.formula = fz.formula;
                theory.claims.set(name, claim);
            }
            else {
                diags.push({
                    severity: 'error',
                    message: `Claim '${name}' refiere a formalizacion '${claim.formalization}' que no existe`,
                });
            }
        }
    }
    return diags;
}
//# sourceMappingURL=compiler.js.map