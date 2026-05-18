# `reasoning/ban-logic/terms.ts`

============================================================ BAN Logic — Constructores y equality de términos/fórmulas ============================================================

## Contents

- [`principal`](#principal) — Const
- [`key`](#key) — Const
- [`nonce`](#nonce) — Const
- [`atom`](#atom) — Const
- [`message`](#message) — Const
- [`encrypted`](#encrypted) — Const
- [`hashed`](#hashed) — Const
- [`compound`](#compound) — Const
- [`believes`](#believes) — Const
- [`sees`](#sees) — Const
- [`said`](#said) — Const
- [`saidMessage`](#saidmessage) — Const
- [`jurisdiction`](#jurisdiction) — Const
- [`fresh`](#fresh) — Const
- [`sharedKey`](#sharedkey) — Const
- [`publicKey`](#publickey) — Const
- [`sharedSecret`](#sharedsecret) — Const
- [`controls`](#controls) — Const
- [`formulaAnd`](#formulaand) — Const
- [`termEquals`](#termequals) — Function
- [`formulaEquals`](#formulaequals) — Function
- [`hasFormula`](#hasformula) — Function
- [`termToString`](#termtostring) — Function
- [`formulaToString`](#formulatostring) — Function

## `principal`

> Const · `reasoning/ban-logic/terms.ts:10`

Crea un principal BAN: agente con identidad nominal (e.g. Alice, Bob).

```ts
const principal
```


## `key`

> Const · `reasoning/ban-logic/terms.ts:13`

Crea una clave BAN. Si `shared` = [A, B], representa la clave simétrica K_{AB} (= K_{BA}).

```ts
const key
```


## `nonce`

> Const · `reasoning/ban-logic/terms.ts:17`

Crea un nonce BAN (número usado una vez, evidencia de frescura).

```ts
const nonce
```


## `atom`

> Const · `reasoning/ban-logic/terms.ts:20`

Crea un átomo BAN (valor opaco / constante del dominio de mensajes).

```ts
const atom
```


## `message`

> Const · `reasoning/ban-logic/terms.ts:23`

Crea un mensaje BAN compuesto de una lista de sub-términos.

```ts
const message
```


## `encrypted`

> Const · `reasoning/ban-logic/terms.ts:26`

Crea un término cifrado `{msg}_k`: el mensaje `msg` bajo la clave `k`.

```ts
const encrypted
```


## `hashed`

> Const · `reasoning/ban-logic/terms.ts:33`

Crea un término hasheado `H(msg)`.

```ts
const hashed
```


## `compound`

> Const · `reasoning/ban-logic/terms.ts:36`

Crea un término compuesto de partes (concatenación de mensajes).

```ts
const compound
```


## `believes`

> Const · `reasoning/ban-logic/terms.ts:41`

`p |≡ f` — el principal `p` cree la fórmula `f`.

```ts
const believes
```


## `sees`

> Const · `reasoning/ban-logic/terms.ts:48`

`p ◁ w` — el principal `p` ve el término `w` (lo recibió en el mensaje).

```ts
const sees
```


## `said`

> Const · `reasoning/ban-logic/terms.ts:55`

`p |~ f` — el principal `p` alguna vez dijo la fórmula `f`.

```ts
const said
```


## `saidMessage`

> Const · `reasoning/ban-logic/terms.ts:62`

`p |~ w` — el principal `p` alguna vez dijo el mensaje `w`.

```ts
const saidMessage
```


## `jurisdiction`

> Const · `reasoning/ban-logic/terms.ts:69`

`p |⇒ f` — el principal `p` tiene jurisdicción sobre la fórmula `f`.

```ts
const jurisdiction
```


## `fresh`

> Const · `reasoning/ban-logic/terms.ts:76`

`#(w)` — el término `w` es fresco (generado en esta sesión de protocolo).

```ts
const fresh
```


## `sharedKey`

> Const · `reasoning/ban-logic/terms.ts:79`

`a ↔K b` — `k` es la clave compartida entre los agentes `a` y `b` (simétrico).

```ts
const sharedKey
```


## `publicKey`

> Const · `reasoning/ban-logic/terms.ts:87`

`|→k p` — `k` es la clave pública del principal `p`.

```ts
const publicKey
```


## `sharedSecret`

> Const · `reasoning/ban-logic/terms.ts:94`

`a ⇌s b` — `s` es el secreto compartido entre los agentes `a` y `b` (simétrico).

```ts
const sharedSecret
```


## `controls`

> Const · `reasoning/ban-logic/terms.ts:102`

`p |⇒ f` — el principal `p` controla (tiene autoridad sobre) la fórmula `f`.

```ts
const controls
```


## `formulaAnd`

> Const · `reasoning/ban-logic/terms.ts:109`

Conjunción de dos fórmulas BAN: `left ∧ right`.

```ts
const formulaAnd
```


## `termEquals`

> Function · `reasoning/ban-logic/terms.ts:118`

Igualdad estructural entre dos términos BAN. Las claves compartidas son simétricas: K_{AB} = K_{BA}.

```ts
export function termEquals(a: BANTerm, b: BANTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `BANTerm` | no |  |
| `b` | `BANTerm` | no |  |

### Returns

`boolean` — 


## `formulaEquals`

> Function · `reasoning/ban-logic/terms.ts:170`

Igualdad estructural entre dos fórmulas BAN. Los predicados sharedKey y sharedSecret son simétricos en sus agentes.

```ts
export function formulaEquals(a: BANFormula, b: BANFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `BANFormula` | no |  |
| `b` | `BANFormula` | no |  |

### Returns

`boolean` — 


## `hasFormula`

> Function · `reasoning/ban-logic/terms.ts:226`

Comprueba si `target` está en la lista de fórmulas BAN `state` (usando igualdad estructural).

```ts
export function hasFormula(state: ReadonlyArray<BANFormula>, target: BANFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `target` | `BANFormula` | no |  |

### Returns

`boolean` — 


## `termToString`

> Function · `reasoning/ban-logic/terms.ts:233`

Serializa un término BAN a su representación textual estándar.

```ts
export function termToString(t: BANTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `BANTerm` | no |  |

### Returns

`string` — 


## `formulaToString`

> Function · `reasoning/ban-logic/terms.ts:253`

Serializa una fórmula BAN a su representación textual estándar.

```ts
export function formulaToString(f: BANFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `BANFormula` | no |  |

### Returns

`string` — 

