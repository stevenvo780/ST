# `reasoning/ban-logic/rules.ts`

============================================================ BAN Logic — Reglas de inferencia ============================================================ 10 reglas estándar BAN (1989) operando sobre un estado de creencias. Cada regla intenta producir UNA nueva fórmula a partir del estado. Si la regla no aplica, devuelve null. Convención: cada regla recibe `state` (lista de fórmulas conocidas) y un foco opcional `beliefP` (el principal P sobre cuyo punto de vista estamos razonando, si la regla lo necesita). Reglas:   R1  message-meaning (shared key)       P|≡ A↔K B  ,  P◁ {X}_K     ⇒  P|≡ A|~ X   R2  message-meaning (public key)       P|≡ |→K Q  ,  P◁ {X}_{K^-1} ⇒  P|≡ Q|~ X       (modelamos con encryption con key inversa; ver más abajo)   R3  message-meaning (shared secret)       P|≡ A⇌Y B  ,  P◁ <X>_Y     ⇒  P|≡ A|~ X   R4  nonce-verification       P|≡ #X  ,  P|≡ Q|~ X       ⇒  P|≡ Q|≡ X   R5  jurisdiction       P|≡ Q|⇒ X  ,  P|≡ Q|≡ X    ⇒  P|≡ X   R6  belief-conjunction (descomposición y composición)       P|≡ (X ∧ Y)                ⇒  P|≡ X  ,  P|≡ Y   R7  said-conjunction       P|≡ Q|~ (X ∧ Y)            ⇒  P|≡ Q|~ X  ,  P|≡ Q|~ Y   R8  freshness-propagation       P|≡ #X                     ⇒  P|≡ #(X, Y) (cuando X aparece en compound)   R9  seeing-compound (descomposición de mensajes vistos)       P◁ <X, Y>                  ⇒  P◁ X , P◁ Y   R10 seeing-encrypted (cuando P tiene la clave)       P◁ {X}_K  ,  P|≡ A↔K P     ⇒  P◁ X Implementación: cada `applyXxx` busca un par de fórmulas en `state` que satisfaga las premisas y devuelve la conclusión. Para enumerar todas las nuevas creencias, ver `saturate()` en `analyze.ts`.

## Contents

- [`applyMessageMeaningShared`](#applymessagemeaningshared) — Function
- [`applyMessageMeaningPublic`](#applymessagemeaningpublic) — Function
- [`applyMessageMeaningSecret`](#applymessagemeaningsecret) — Function
- [`applyNonceVerification`](#applynonceverification) — Function
- [`applyJurisdiction`](#applyjurisdiction) — Function
- [`applySeeingEncrypted`](#applyseeingencrypted) — Function
- [`applySeesCompound`](#applyseescompound) — Function
- [`applyBeliefConjunction`](#applybeliefconjunction) — Function
- [`applyBeliefConjunctionRight`](#applybeliefconjunctionright) — Function
- [`applySaidConjunction`](#applysaidconjunction) — Function
- [`applyFreshnessPropagation`](#applyfreshnesspropagation) — Function
- [`RULES_REGISTRY`](#rules-registry) — Const

## `applyMessageMeaningShared`

> Function · `reasoning/ban-logic/rules.ts:53`

R1 — Message-meaning (shared key).

Si P cree A↔K B y P ve {X}_K, entonces P cree que A dijo X
(asumiendo P ≠ originador, y la clave es genuinamente compartida
solo entre A y B + posibles autoridades).

Devuelve la primera derivación posible o null. La variante que enumera
TODAS está en `saturate()`.

```ts
export function applyMessageMeaningShared( state: ReadonlyArray<BANFormula>, beliefP: BANFormula, ): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applyMessageMeaningPublic`

> Function · `reasoning/ban-logic/rules.ts:102`

R2 — Message-meaning (public key).

Si P cree |→K Q y P ve {X}_{K^-1} (cifrado con la clave privada de Q),
entonces P cree que Q dijo X.

Modelo: tratamos `encrypted(X, privateKey_Q)` como "Q firmó X".
Convención de naming: si la clave pública se llama K, la privada
compartirá el nombre con sufijo "_inv" o es identificable porque
el atributo `shared` corresponde a Q.

Para simplificar el motor, modelamos firma como `encrypted(X, K)` donde
K es la clave pública y publicKey(Q, K). El "sentido directo" en
la verdad: solo Q pudo haber producido ese ciphertext porque solo
Q tiene la inversa. Así que la regla R2 dice: si P|≡|→K Q y P◁{X}_K
entonces P|≡ Q|~ X. Esto es la versión "firma con clave pública".

```ts
export function applyMessageMeaningPublic( state: ReadonlyArray<BANFormula>, beliefP: BANFormula, ): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applyMessageMeaningSecret`

> Function · `reasoning/ban-logic/rules.ts:132`

R3 — Message-meaning (shared secret).

Si P cree A⇌Y B y P ve un mensaje compound que combina X con Y
(modelo `compound([X, Y])`), entonces P cree que A dijo X.

```ts
export function applyMessageMeaningSecret( state: ReadonlyArray<BANFormula>, beliefP: BANFormula, ): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applyNonceVerification`

> Function · `reasoning/ban-logic/rules.ts:169`

R4 — Nonce-verification.

Si P cree que X es fresco y P cree que Q dijo X, entonces P cree
que Q realmente cree X (porque sólo lo pudo haber dicho recientemente).

```ts
export function applyNonceVerification( state: ReadonlyArray<BANFormula>, beliefP: BANFormula, ): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applyJurisdiction`

> Function · `reasoning/ban-logic/rules.ts:227`

R5 — Jurisdiction.

Si P cree que Q tiene jurisdicción sobre X (P|≡ Q|⇒ X) y P cree
que Q cree X (P|≡ Q|≡ X), entonces P cree X.

```ts
export function applyJurisdiction( state: ReadonlyArray<BANFormula>, beliefP: BANFormula, ): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applySeeingEncrypted`

> Function · `reasoning/ban-logic/rules.ts:275`

R10 — Seeing encrypted: si P tiene la clave, ver {X}_K implica ver X.

```ts
export function applySeeingEncrypted( state: ReadonlyArray<BANFormula>, beliefP: BANFormula, ): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applySeesCompound`

> Function · `reasoning/ban-logic/rules.ts:300`

Decomposición de "ver compound": P ◁ <X1,...,Xn>  ⇒  P ◁ Xi  (todos).
Devuelve la primera Xi que NO esté ya en state (para evitar duplicados).

```ts
export function applySeesCompound( state: ReadonlyArray<BANFormula>, beliefP: BANFormula, ): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applyBeliefConjunction`

> Function · `reasoning/ban-logic/rules.ts:323`

Belief-conjunction descomposición.

```ts
export function applyBeliefConjunction(beliefP: BANFormula): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applyBeliefConjunctionRight`

> Function · `reasoning/ban-logic/rules.ts:330`

```ts
export function applyBeliefConjunctionRight(beliefP: BANFormula): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applySaidConjunction`

> Function · `reasoning/ban-logic/rules.ts:339`

Said-conjunction descomposición.

```ts
export function applySaidConjunction(beliefP: BANFormula): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `applyFreshnessPropagation`

> Function · `reasoning/ban-logic/rules.ts:354`

Propagación de frescura: si P|≡#X y X aparece dentro de un compound C
que está en state, entonces P|≡#C.

```ts
export function applyFreshnessPropagation( state: ReadonlyArray<BANFormula>, beliefP: BANFormula, ): BANFormula | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `beliefP` | `BANFormula` | no |  |

### Returns

`BANFormula \| null` — 


## `RULES_REGISTRY`

> Const · `reasoning/ban-logic/rules.ts:381`

```ts
const RULES_REGISTRY
```

