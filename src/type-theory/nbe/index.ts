// Punto de entrada público del módulo NbE.

export {
  type Env,
  type Neutral,
  type Term,
  type Type,
  type Value,
  alphaEq,
  ap,
  apN,
  lam,
  tArr,
  tBase,
  termToString,
  typeEq,
  typeToString,
  v,
  vClosure,
  vNeutral,
  vNeutralVar,
} from './types';

export { apply, evaluate, makeFreshSupply, normalize, reify } from './nbe';
