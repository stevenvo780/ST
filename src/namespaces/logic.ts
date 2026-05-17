/**
 * Namespace: Logic
 *
 * Agrupa los perfiles lógicos disponibles en ST. Cada sub-namespace expone
 * los símbolos del módulo correspondiente sin colisiones de nombres entre
 * lógicas (CTL.Formula vs LTL.Formula, etc).
 *
 * Importa así:
 *   import { Logic } from '@stevenvo780/st-lang';
 *   Logic.modal.s5.isValid(formula);
 *   Logic.ctl.modelCheckCTL(kripke, formula);
 */

// Perfil registry + interfaces compartidas
export { LogicProfile, ProfileRegistry, registry } from '../logic/profiles/interface';

// Perfiles "clase suelta" (un solo símbolo)
export { ClassicalPropositional, formulaToString } from '../logic/profiles/classical/propositional';
export { ClassicalFirstOrder } from '../logic/profiles/classical/first-order';
export { ModalK } from '../logic/profiles/modal/k';
export { ParaconsistentBelnap } from '../logic/profiles/paraconsistent/belnap';
export { IntuitionisticPropositional } from '../logic/profiles/intuitionistic/propositional';
export { TemporalLTL } from '../logic/profiles/temporal/ltl';
export { EpistemicS5 } from '../logic/profiles/epistemic/s5';
export { DeonticStandard } from '../logic/profiles/deontic/standard';
export { AristotelianSyllogistic } from '../logic/profiles/aristotelian/syllogistic';
export { ProbabilisticBasic } from '../logic/profiles/probabilistic/basic';

// Sub-namespaces (cada perfil con barrel propio)
import * as ctl from '../logic/profiles/ctl';
import * as ltl from '../logic/profiles/ltl-sat';
import * as muCalculus from '../logic/profiles/mu-calculus';
import * as hybrid from '../logic/profiles/hybrid-logic';
import * as descriptionLogic from '../logic/profiles/description-logic';
import * as modalAxioms from '../logic/profiles/modal-frame-axioms';
import * as sequentG3 from '../logic/profiles/sequent-g3';
import * as sequentLK from '../logic/profiles/sequent-lk';
import * as intuitNJ from '../logic/profiles/intuitionistic-nj';
import * as defaultLogic from '../logic/profiles/default-logic';
import * as manyValued from '../logic/profiles/many-valued';
import * as substructural from '../logic/profiles/substructural';
import * as arithmetic from '../logic/profiles/arithmetic';

export {
  ctl,
  ltl,
  muCalculus,
  hybrid,
  descriptionLogic,
  modalAxioms,
  sequentG3,
  sequentLK,
  intuitNJ,
  defaultLogic,
  manyValued,
  substructural,
  arithmetic,
};

// SAT solving (algoritmos clásicos para evaluación de fórmulas)
export { cdcl, cdclAsync } from '../logic/profiles/classical/cdcl';
export type { CDCLResult } from '../logic/profiles/classical/cdcl';
export { dpll, dpllAsync } from '../logic/profiles/classical/dpll';
export { workersAvailable, PARALLEL_THRESHOLD } from '../logic/profiles/classical/parallel-sat';
