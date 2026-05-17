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
export { LogicProfile, ProfileRegistry, registry } from '../profiles/interface';

// Perfiles "clase suelta" (un solo símbolo)
export { ClassicalPropositional, formulaToString } from '../profiles/classical/propositional';
export { ClassicalFirstOrder } from '../profiles/classical/first-order';
export { ModalK } from '../profiles/modal/k';
export { ParaconsistentBelnap } from '../profiles/paraconsistent/belnap';
export { IntuitionisticPropositional } from '../profiles/intuitionistic/propositional';
export { TemporalLTL } from '../profiles/temporal/ltl';
export { EpistemicS5 } from '../profiles/epistemic/s5';
export { DeonticStandard } from '../profiles/deontic/standard';
export { AristotelianSyllogistic } from '../profiles/aristotelian/syllogistic';
export { ProbabilisticBasic } from '../profiles/probabilistic/basic';

// Sub-namespaces (cada perfil con barrel propio)
import * as ctl from '../profiles/ctl';
import * as ltl from '../profiles/ltl-sat';
import * as muCalculus from '../profiles/mu-calculus';
import * as hybrid from '../profiles/hybrid-logic';
import * as descriptionLogic from '../profiles/description-logic';
import * as modalAxioms from '../profiles/modal-frame-axioms';
import * as sequentG3 from '../profiles/sequent-g3';
import * as sequentLK from '../profiles/sequent-lk';
import * as intuitNJ from '../profiles/intuitionistic-nj';
import * as defaultLogic from '../profiles/default-logic';
import * as manyValued from '../profiles/many-valued';
import * as substructural from '../profiles/substructural';
import * as arithmetic from '../profiles/arithmetic';

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
export { cdcl, cdclAsync } from '../profiles/classical/cdcl';
export type { CDCLResult } from '../profiles/classical/cdcl';
export { dpll, dpllAsync } from '../profiles/classical/dpll';
export { workersAvailable, PARALLEL_THRESHOLD } from '../profiles/classical/parallel-sat';
