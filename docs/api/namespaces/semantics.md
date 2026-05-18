# `namespaces/semantics.ts`

Namespace: Semantics

Capas semánticas y puentes de interpretación: text-layer (claims/passages
con grafo de dependencias), MDX bridge, game semantics dialógico (IPC
Lorenzen-Felscher), profile-bridge (traducciones entre lógicas), y
coinducción (streams, bisimulación).

Importa así:
  import { Semantics } from '@stevenvo780/st-lang';
  const state = Semantics.textLayer.createTextLayerState();
  const win = Semantics.gameSemantics.winningStrategy(formula);

## `textLayer`

> Const · `namespaces/semantics.ts:33`

```ts
const textLayer
```

