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

import * as folProver from '../proof-systems/fol-prover';
import * as folProverEquality from '../proof-systems/fol-prover-equality';
import * as proofExchange from '../proof-systems/proof-exchange';
import * as proofMinify from '../proof-systems/proof-minify';
import * as tableauFramework from '../proof-systems/tableau-framework';
import * as proofNets from '../proof-systems/proof-nets';

export { folProver, folProverEquality, proofExchange, proofMinify, tableauFramework, proofNets };
