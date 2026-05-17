/**
 * Namespace: ProofSystems
 *
 * Probadores formales y mecanismos de intercambio/manipulación de pruebas.
 *
 * Importa así:
 *   import { ProofSystems } from '@stevenvo780/st-lang';
 *   ProofSystems.folProver.proveFOL(theory);
 *   ProofSystems.proofExchange.signProof(pkg, key);
 */

import * as folProver from '../fol-prover';
import * as folProverEquality from '../fol-prover-equality';
import * as proofExchange from '../proof-exchange';
import * as proofMinify from '../runtime/proof-minify';
import * as tableauFramework from '../tableau-framework';
import * as proofNets from '../proof-nets';

export {
  folProver,
  folProverEquality,
  proofExchange,
  proofMinify,
  tableauFramework,
  proofNets,
};
