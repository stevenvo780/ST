# `logic/profiles/paraconsistent/belnap.ts`

============================================================ ST Belnap — Motor Paraconsistente de 4 Valores ============================================================

## Contents

- [`BelnapValue`](#belnapvalue) — Type
- [`ParaconsistentBelnap`](#paraconsistentbelnap) — Class

## `BelnapValue`

> Type · `logic/profiles/paraconsistent/belnap.ts:23`

Valores de verdad en la lógica de Belnap (A4):
T: True (Solo verdad)
F: False (Solo falsedad)
B: Both (Verdadero y Falso - Inconsistente)
N: None (Ni Verdadero ni Falso - Indeterminado)

```ts
export type BelnapValue = 'T' | 'F' | 'B' | 'N';
```


## `ParaconsistentBelnap`

> Class · `logic/profiles/paraconsistent/belnap.ts:160`

```ts
export class ParaconsistentBelnap implements LogicProfile
```

