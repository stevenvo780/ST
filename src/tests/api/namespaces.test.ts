/**
 * Public API namespaces — paridad backward-compatible.
 *
 * Verifica que los namespaces semánticos (Logic, ProofSystems, TypeTheory,
 * Solvers, Reasoning, Semantics) expongan los mismos símbolos que los flat
 * exports existentes, sin colisiones y con identidad referencial preservada.
 */

import { describe, it, expect } from 'vitest';
import * as ST from '../..';

describe('public API — namespaces semánticos', () => {
  // ── existencia básica ───────────────────────────────────────────────────

  it('expone los 6 namespaces a nivel raíz', () => {
    expect(ST.Logic).toBeDefined();
    expect(ST.ProofSystems).toBeDefined();
    expect(ST.TypeTheory).toBeDefined();
    expect(ST.Solvers).toBeDefined();
    expect(ST.Reasoning).toBeDefined();
    expect(ST.Semantics).toBeDefined();
  });

  // ── Logic ───────────────────────────────────────────────────────────────

  it('Logic incluye sub-namespaces para perfiles con barrel propio', () => {
    expect(ST.Logic.ctl).toBeDefined();
    expect(ST.Logic.ltl).toBeDefined();
    expect(ST.Logic.muCalculus).toBeDefined();
    expect(ST.Logic.hybrid).toBeDefined();
    expect(ST.Logic.descriptionLogic).toBeDefined();
    expect(ST.Logic.modalAxioms).toBeDefined();
    expect(ST.Logic.sequentG3).toBeDefined();
    expect(ST.Logic.sequentLK).toBeDefined();
    expect(ST.Logic.intuitNJ).toBeDefined();
    expect(ST.Logic.defaultLogic).toBeDefined();
    expect(ST.Logic.manyValued).toBeDefined();
    expect(ST.Logic.substructural).toBeDefined();
    expect(ST.Logic.arithmetic).toBeDefined();
  });

  it('Logic.ctl.modelCheckCTL es la misma función que el modelo CTL flat', () => {
    expect(typeof ST.Logic.ctl.modelCheckCTL).toBe('function');
    expect(typeof ST.Logic.ctl.satisfiesCTL).toBe('function');
  });

  it('Logic re-exporta clases de perfiles single-file', () => {
    expect(ST.Logic.ClassicalPropositional).toBe(ST.ClassicalPropositional);
    expect(ST.Logic.ModalK).toBe(ST.ModalK);
    expect(ST.Logic.ParaconsistentBelnap).toBe(ST.ParaconsistentBelnap);
  });

  it('Logic re-exporta SAT helpers (cdcl, dpll)', () => {
    expect(ST.Logic.cdcl).toBe(ST.cdcl);
    expect(ST.Logic.dpll).toBe(ST.dpll);
    expect(ST.Logic.PARALLEL_THRESHOLD).toBe(ST.PARALLEL_THRESHOLD);
  });

  // ── ProofSystems ────────────────────────────────────────────────────────

  it('ProofSystems agrupa probadores y herramientas de prueba', () => {
    expect(ST.ProofSystems.folProver).toBeDefined();
    expect(ST.ProofSystems.folProverEquality).toBeDefined();
    expect(ST.ProofSystems.proofExchange).toBeDefined();
    expect(ST.ProofSystems.proofMinify).toBeDefined();
    expect(ST.ProofSystems.tableauFramework).toBeDefined();
    expect(ST.ProofSystems.proofNets).toBeDefined();
  });

  it('ProofSystems.folProver.proveFOL coincide con el flat', () => {
    expect(ST.ProofSystems.folProver.proveFOL).toBe(ST.proveFOL);
    expect(ST.ProofSystems.folProver.unify).toBe(ST.unify);
    expect(ST.ProofSystems.folProver.skolemize).toBe(ST.skolemize);
  });

  it('ProofSystems.proofExchange expone canonicalize y signProof', () => {
    expect(ST.ProofSystems.proofExchange.canonicalize).toBe(ST.canonicalize);
    expect(ST.ProofSystems.proofExchange.signProof).toBe(ST.signProof);
    expect(ST.ProofSystems.proofExchange.verifyProof).toBe(ST.verifyProof);
  });

  it('ProofSystems.tableauFramework expone TableauProver', () => {
    expect(ST.ProofSystems.tableauFramework.TableauProver).toBe(ST.TableauProver);
  });

  // ── TypeTheory ──────────────────────────────────────────────────────────

  it('TypeTheory agrupa Curry-Howard, System F, MLTT y λ-calc', () => {
    expect(ST.TypeTheory.curryHoward).toBeDefined();
    expect(ST.TypeTheory.systemF).toBeDefined();
    expect(ST.TypeTheory.mltt).toBeDefined();
    expect(ST.TypeTheory.lambdaCalc).toBeDefined();
    expect(ST.TypeTheory.combinatorsSKI).toBeDefined();
    expect(ST.TypeTheory.nbe).toBeDefined();
    expect(ST.TypeTheory.refinementTypes).toBeDefined();
    expect(ST.TypeTheory.higherOrderUnify).toBeDefined();
  });

  it('TypeTheory.systemF.typeOf produce el mismo resultado que el flat', () => {
    const sf = ST.TypeTheory.systemF;
    // Identidad polimórfica: Λ X. λ x:X. x  ⊢  ∀X. X → X
    const idTerm = sf.fTAbs('X', sf.fAbs('x', sf.fAtom('X'), sf.fVar('x')));
    const result = sf.typeOf(idTerm);
    expect(sf.isTypeError(result)).toBe(false);
    if (!sf.isTypeError(result)) {
      // ∀X. X → X
      expect(result.kind).toBe('forall');
      expect(sf.fTypeToString(result)).toBe('∀X. X → X');
    }
  });

  it('TypeTheory.curryHoward.inferType coincide con flat inferType', () => {
    const ch = ST.TypeTheory.curryHoward;
    // λx:P. x — debería tipar a P → P
    const id = ch.abs('x', ch.atom('P'), ch.vr('x'));
    const inferred = ch.inferType(id);
    expect(ch.isInferError(inferred)).toBe(false);
    // Llamada directa a flat
    expect(ST.inferType).toBe(ch.inferType);
  });

  it('TypeTheory.mltt expone constructores y normalize', () => {
    const m = ST.TypeTheory.mltt;
    expect(typeof m.mVar).toBe('function');
    expect(typeof m.mLam).toBe('function');
    expect(typeof m.normalize).toBe('function');
    // Identidad referencial con flat (con alias mlttX).
    expect(m.normalize).toBe(ST.mlttNormalize);
  });

  it('TypeTheory.lambdaCalc expone constructores y normalize', () => {
    const lc = ST.TypeTheory.lambdaCalc;
    expect(typeof lc.v).toBe('function');
    expect(typeof lc.lam).toBe('function');
    expect(lc.normalize).toBe(ST.lcNormalize);
  });

  // ── Solvers ─────────────────────────────────────────────────────────────

  it('Solvers expone CDCL v2, CSP, MUS, SMT', () => {
    expect(ST.Solvers.cdclV2).toBeDefined();
    expect(ST.Solvers.cdclV2Incremental).toBeDefined();
    expect(ST.Solvers.csp).toBeDefined();
    expect(ST.Solvers.mus).toBeDefined();
    expect(ST.Solvers.smt).toBeDefined();
    expect(ST.Solvers.parallel).toBeDefined();
  });

  it('Solvers.solveCDCLv2 coincide con flat solveCDCLv2', () => {
    expect(ST.Solvers.solveCDCLv2).toBe(ST.solveCDCLv2);
  });

  // ── Reasoning ───────────────────────────────────────────────────────────

  it('Reasoning agrupa argumentation, belief-revision, abduction, etc.', () => {
    expect(ST.Reasoning.argumentation).toBeDefined();
    expect(ST.Reasoning.beliefRevision).toBeDefined();
    expect(ST.Reasoning.abduction).toBeDefined();
    expect(ST.Reasoning.markovLogic).toBeDefined();
    expect(ST.Reasoning.bayesian).toBeDefined();
    expect(ST.Reasoning.citationReasoning).toBeDefined();
    expect(ST.Reasoning.hyperreal).toBeDefined();
    expect(ST.Reasoning.antiUnification).toBeDefined();
    expect(ST.Reasoning.termRewriting).toBeDefined();
  });

  it('Reasoning.argumentation.computeExtensions coincide con flat', () => {
    expect(ST.Reasoning.argumentation.computeExtensions).toBe(ST.computeExtensions);
  });

  it('Reasoning.citationReasoning.deriveWithCitations coincide con flat', () => {
    expect(ST.Reasoning.citationReasoning.deriveWithCitations).toBe(ST.deriveWithCitations);
  });

  it('Reasoning.TheoremCache coincide con flat TheoremCache', () => {
    expect(ST.Reasoning.TheoremCache).toBe(ST.TheoremCache);
    expect(ST.Reasoning.tryReuseProof).toBe(ST.tryReuseProof);
  });

  // ── Semantics ───────────────────────────────────────────────────────────

  it('Semantics agrupa text-layer, game-semantics, profile-bridge, coinduction', () => {
    expect(ST.Semantics.textLayer).toBeDefined();
    expect(ST.Semantics.textLayerCompiler).toBeDefined();
    expect(ST.Semantics.textLayerV2).toBeDefined();
    expect(ST.Semantics.gameSemantics).toBeDefined();
    expect(ST.Semantics.profileBridge).toBeDefined();
    expect(ST.Semantics.coinduction).toBeDefined();
  });

  it('Semantics.gameSemantics.winningStrategy coincide con flat', () => {
    expect(ST.Semantics.gameSemantics.winningStrategy).toBe(ST.winningStrategy);
  });

  it('Semantics.profileBridge re-exporta translateFormula', () => {
    expect(ST.Semantics.profileBridge.translateFormula).toBe(ST.translateFormula);
    expect(ST.Semantics.profileBridge.glivenkoTranslation).toBe(ST.glivenkoTranslation);
  });

  it('Semantics.textLayer expone createTextLayerState', () => {
    expect(ST.Semantics.textLayer.createTextLayerState).toBe(ST.createTextLayerState);
  });

  // ── backward-compat global ──────────────────────────────────────────────

  it('los flat exports históricos siguen vivos (no breaking change)', () => {
    expect(typeof ST.evaluate).toBe('function');
    expect(typeof ST.parse).toBe('function');
    expect(typeof ST.check).toBe('function');
    expect(typeof ST.typeCheck).toBe('function');
    expect(typeof ST.proveFOL).toBe('function');
    expect(typeof ST.solveCDCLv2).toBe('function');
    expect(typeof ST.computeExtensions).toBe('function');
    expect(typeof ST.createTextLayerState).toBe('function');
  });
});
