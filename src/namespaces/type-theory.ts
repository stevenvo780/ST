/**
 * Namespace: TypeTheory
 *
 * Sistemas de tipos y cálculos lambda — correspondencia Curry-Howard,
 * System F polimórfico, MLTT (Martin-Löf), λ-calc puro, combinadores SKI,
 * NBE (normalization by evaluation), refinement types.
 *
 * Importa así:
 *   import { TypeTheory } from '@stevenvo780/st-lang';
 *   const t = TypeTheory.systemF.typeOf(term);
 *   const proof = TypeTheory.curryHoward.termToProof(lam);
 */

import * as curryHoward from '../curry-howard';
import * as systemF from '../system-f';
import * as mltt from '../mltt';
import * as lambdaCalc from '../lambda-calc';
import * as combinatorsSKI from '../combinators-ski';
import * as nbe from '../nbe';
import * as refinementTypes from '../refinement-types';
import * as higherOrderUnify from '../higher-order-unify';

export {
  curryHoward,
  systemF,
  mltt,
  lambdaCalc,
  combinatorsSKI,
  nbe,
  refinementTypes,
  higherOrderUnify,
};
