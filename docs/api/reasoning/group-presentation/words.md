# `reasoning/group-presentation/words.ts`

============================================================ Aritmética del grupo libre F(S) sobre palabras. ============================================================ Convención de inversos: letras a-z son generadores positivos; A-Z son sus inversos. `inverse('a') === 'A'` y viceversa. Para símbolos fuera de a-zA-Z (uso interno opcional), se asume que el caller pasa pares (g, g⁻¹) ya emparejados — pero las APIs públicas estándar (cyclic/dihedral/free/symmetric) viven en el alfabeto a-z/A-Z. ============================================================

## Contents

- [`inverse`](#inverse) — Function
- [`reduceWord`](#reduceword) — Function
- [`multiplyWords`](#multiplywords) — Function
- [`invertWord`](#invertword) — Function
- [`wordEquals`](#wordequals) — Function
- [`isReduced`](#isreduced) — Function
- [`parseWord`](#parseword) — Function
- [`wordToString`](#wordtostring) — Function

## `inverse`

> Function · `reasoning/group-presentation/words.ts:18`

```ts
export function inverse(g: Generator): Generator
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `g` | `Generator` | no |  |

### Returns

`Generator` — 


## `reduceWord`

> Function · `reasoning/group-presentation/words.ts:33`

```ts
export function reduceWord(w: Word): Word
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `w` | `Word` | no |  |

### Returns

`Word` — 


## `multiplyWords`

> Function · `reasoning/group-presentation/words.ts:48`

```ts
export function multiplyWords(a: Word, b: Word): Word
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Word` | no |  |
| `b` | `Word` | no |  |

### Returns

`Word` — 


## `invertWord`

> Function · `reasoning/group-presentation/words.ts:53`

```ts
export function invertWord(w: Word): Word
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `w` | `Word` | no |  |

### Returns

`Word` — 


## `wordEquals`

> Function · `reasoning/group-presentation/words.ts:63`

```ts
export function wordEquals(a: Word, b: Word): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Word` | no |  |
| `b` | `Word` | no |  |

### Returns

`boolean` — 


## `isReduced`

> Function · `reasoning/group-presentation/words.ts:72`

```ts
export function isReduced(w: Word): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `w` | `Word` | no |  |

### Returns

`boolean` — 


## `parseWord`

> Function · `reasoning/group-presentation/words.ts:90`

```ts
export function parseWord(s: string): Word
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `string` | no |  |

### Returns

`Word` — 


## `wordToString`

> Function · `reasoning/group-presentation/words.ts:99`

```ts
export function wordToString(w: Word): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `w` | `Word` | no |  |

### Returns

`string` — 

