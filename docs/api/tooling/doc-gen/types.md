# `tooling/doc-gen/types.ts`

============================================================ ST doc-gen — tipos públicos. Modelo de documentación derivado de TSDoc/JSDoc + TS Compiler API: un ApiDoc por símbolo exportado (function/class/interface /type/const/enum/namespace), agrupado por módulo (archivo). ============================================================

## Contents

- [`ApiKind`](#apikind) — Type
- [`ApiParameter`](#apiparameter) — Interface
- [`ApiReturns`](#apireturns) — Interface
- [`ApiDoc`](#apidoc) — Interface
- [`DocModule`](#docmodule) — Interface
- [`DocOptions`](#docoptions) — Interface
- [`JSDocTag`](#jsdoctag) — Interface
- [`ParsedJSDoc`](#parsedjsdoc) — Interface
- [`GenerateResult`](#generateresult) — Interface

## `ApiKind`

> Type · `tooling/doc-gen/types.ts:9`

```ts
export type ApiKind = 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum' | 'namespace';
```


## `ApiParameter`

> Interface · `tooling/doc-gen/types.ts:11`

```ts
export interface ApiParameter
```


## `ApiReturns`

> Interface · `tooling/doc-gen/types.ts:18`

```ts
export interface ApiReturns
```


## `ApiDoc`

> Interface · `tooling/doc-gen/types.ts:23`

```ts
export interface ApiDoc
```


## `DocModule`

> Interface · `tooling/doc-gen/types.ts:40`

```ts
export interface DocModule
```


## `DocOptions`

> Interface · `tooling/doc-gen/types.ts:46`

```ts
export interface DocOptions
```


## `JSDocTag`

> Interface · `tooling/doc-gen/types.ts:53`

```ts
export interface JSDocTag
```


## `ParsedJSDoc`

> Interface · `tooling/doc-gen/types.ts:58`

```ts
export interface ParsedJSDoc
```


## `GenerateResult`

> Interface · `tooling/doc-gen/types.ts:63`

```ts
export interface GenerateResult
```

