/**
 * Namespace: Semantics
 *
 * Capas semánticas y puentes de interpretación: text-layer (claims/passages
 * con grafo de dependencias), MDX bridge, game semantics dialógico (IPC
 * Lorenzen-Felscher), profile-bridge (traducciones entre lógicas), y
 * coinducción (streams, bisimulación).
 *
 * Importa así:
 *   import { Semantics } from '@stevenvo780/st-lang';
 *   const state = Semantics.textLayer.createTextLayerState();
 *   const win = Semantics.gameSemantics.winningStrategy(formula);
 */

// Text layer v1 — compilador legacy
import * as textLayerCompiler from '../text-layer/compiler';
// Text layer v2 — grafo de claims con dependencias
import * as textLayerV2 from '../text-layer/v2';

import * as gameSemantics from '../game-semantics';
import * as profileBridge from '../profile-bridge';
import * as coinduction from '../coinduction';

export {
  textLayerCompiler,
  textLayerV2,
  gameSemantics,
  profileBridge,
  coinduction,
};

// Aliases convenientes — text-layer flat para coincidir con flat exports.
export const textLayer = textLayerCompiler;
