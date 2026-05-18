# `lexer/tokens.ts`

============================================================ ST Lexer — Tokens ============================================================

## Contents

- [`TokenType`](#tokentype) — Enum
- [`Token`](#token) — Interface
- [`CORE_KEYWORDS`](#core-keywords) — Const
- [`PROFILE_KEYWORDS`](#profile-keywords) — Const
- [`getKeywordsForProfile`](#getkeywordsforprofile) — Function
- [`KEYWORDS`](#keywords) — Const

## `TokenType`

> Enum · `lexer/tokens.ts:5`

```ts
export enum TokenType
```


## `Token`

> Interface · `lexer/tokens.ts:119`

```ts
export interface Token
```


## `CORE_KEYWORDS`

> Const · `lexer/tokens.ts:129`

Core keywords — always reserved regardless of profile.

```ts
const CORE_KEYWORDS: Record<string, TokenType>
```


## `PROFILE_KEYWORDS`

> Const · `lexer/tokens.ts:245`

Profile-specific keywords — only reserved when the matching profile is active.
Keys are profile prefixes: a keyword activates when the current profile starts with the key.

```ts
const PROFILE_KEYWORDS: Record<string, Record<string, TokenType>>
```


## `getKeywordsForProfile`

> Function · `lexer/tokens.ts:258`

Build the full keyword map for a given profile.
If no profile is given, all keywords (core + all profile) are active (backward compatible).

```ts
export function getKeywordsForProfile(profile?: string): Record<string, TokenType>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `profile` | `string` | yes |  |

### Returns

`Record<string, TokenType>` — 


## `KEYWORDS`

> Const · `lexer/tokens.ts:280`

Legacy: all keywords combined (for backward compatibility).

```ts
const KEYWORDS: Record<string, TokenType>
```

