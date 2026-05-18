# `solver/cdcl-v2/vsids.ts`

VSIDS (Variable State Independent Decaying Sum) — Moskewicz et al. (2001) + EVSIDS (Exponential VSIDS) con rescaling para evitar overflow (MiniSat 2.0+). Cada conflicto bumpea las variables que aparecen en la cláusula aprendida. El `varInc` se incrementa periódicamente (cada conflicto) mediante división por VAR_DECAY, lo que efectivamente decae las activities viejas relativas a las nuevas — equivalente matemáticamente a multiplicar todo el array por VAR_DECAY pero O(1) en vez de O(n).

## `VSIDS`

> Class · `solver/cdcl-v2/vsids.ts:13`

```ts
export class VSIDS
```

