# `reasoning/ban-logic/protocols.ts`

============================================================ BAN Logic — Catálogo de protocolos ============================================================ Protocolos clásicos modelados en estilo BAN para validar el motor. - Needham-Schroeder symmetric (1978): autenticación basada en   servidor de confianza. BAN-correcto bajo assumptions estándar   (frescura de los nonces). - Needham-Schroeder public-key (1978): el famoso protocolo con   el "Lowe attack" (1995). Sin las correcciones de Lowe, NO logra   autenticar B con A (deja un goal sin probar). Lo modelamos así   para que `analyzeProtocol` lo refleje. - Kerberos (variant clásica simplificada): cliente C, servidor S   con la KDC, autenticación mutua.

## Contents

- [`needhamSchroederSymmetric`](#needhamschroedersymmetric) — Function
- [`needhamSchroederPublicKey`](#needhamschroederpublickey) — Function
- [`kerberos`](#kerberos) — Function
- [`protocolUtils`](#protocolutils) — Const

## `needhamSchroederSymmetric`

> Function · `reasoning/ban-logic/protocols.ts:44`

Needham-Schroeder shared-key (simplificado para BAN).

1. A → S : A, B, N_a
2. S → A : {N_a, K_ab, B, {K_ab, A}_{K_bs}}_{K_as}
3. A → B : {K_ab, A}_{K_bs}
4. B → A : {N_b}_{K_ab}
5. A → B : {N_b - 1}_{K_ab}   (representamos como nonce(N_b'))

```ts
export function needhamSchroederSymmetric(): Protocol
```

### Returns

`Protocol` — 


## `needhamSchroederPublicKey`

> Function · `reasoning/ban-logic/protocols.ts:128`

Needham-Schroeder public-key (Lowe attack territory).

Original:
  1. A → B : {N_a, A}_{K_b}
  2. B → A : {N_a, N_b}_{K_a}
  3. A → B : {N_b}_{K_b}

El "Lowe attack" (1995) muestra que un atacante M puede intercalar
y hacer creer a B que está hablando con A cuando en realidad A
habla con M. Modelamos el protocolo TAL CUAL, sin la corrección
de Lowe; el resultado: el goal "B|≡A|≡(sesión con B)" NO se
deriva.

```ts
export function needhamSchroederPublicKey(): Protocol
```

### Returns

`Protocol` — 


## `kerberos`

> Function · `reasoning/ban-logic/protocols.ts:179`

Kerberos (simplificación BAN).

1. C → S : C, T, N_c
2. S → C : {N_c, T_C, K_ct}_{K_cs}, {C, T_C, K_ct}_{K_ts}
3. C → T : {C, T_C, K_ct}_{K_ts}, {C, t}_{K_ct}
4. T → C : {t + 1}_{K_ct}

Goal: C cree que T comparte K_ct con C; T cree lo mismo.

```ts
export function kerberos(): Protocol
```

### Returns

`Protocol` — 


## `protocolUtils`

> Const · `reasoning/ban-logic/protocols.ts:222`

```ts
const protocolUtils
```

