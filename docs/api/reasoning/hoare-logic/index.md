# `reasoning/hoare-logic/index.ts`

Operadores binarios del lenguaje IMP: aritméticos, relacionales y lógicos.

## Contents

- [`ImpBinop`](#impbinop) — Type
- [`ImpExpr`](#impexpr) — Type
- [`ImpStmt`](#impstmt) — Type
- [`HoareTriple`](#hoaretriple) — Interface
- [`num`](#num) — Const
- [`bool`](#bool) — Const
- [`v`](#v) — Const
- [`binop`](#binop) — Const
- [`not`](#not) — Const
- [`and`](#and) — Const
- [`or`](#or) — Const
- [`eq`](#eq) — Const
- [`lt`](#lt) — Const
- [`le`](#le) — Const
- [`skip`](#skip) — Const
- [`assign`](#assign) — Const
- [`seq`](#seq) — Function
- [`ifS`](#ifs) — Const
- [`whileS`](#whiles) — Const
- [`substitute`](#substitute) — Function
- [`freeVars`](#freevars) — Function
- [`stmtVars`](#stmtvars) — Function
- [`State`](#state) — Type
- [`evalExpr`](#evalexpr) — Function
- [`ExecError`](#execerror) — Type
- [`execStmt`](#execstmt) — Function
- [`wp`](#wp) — Function
- [`spExtension`](#spextension) — Function
- [`generateVCs`](#generatevcs) — Function
- [`VerificationResult`](#verificationresult) — Interface
- [`VerifyOptions`](#verifyoptions) — Interface
- [`verifyTriple`](#verifytriple) — Function
- [`programSwap`](#programswap) — Function
- [`programFactorial`](#programfactorial) — Function
- [`programGCD`](#programgcd) — Function
- [`programLinearSearch`](#programlinearsearch) — Function
- [`factorial`](#factorial) — Function
- [`gcd`](#gcd) — Function

## `ImpBinop`

> Type · `reasoning/hoare-logic/index.ts:33`

Operadores binarios del lenguaje IMP: aritméticos, relacionales y lógicos.

```ts
export type ImpBinop = | '+' | '-' | '*' | '/' | '%' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||';
```


## `ImpExpr`

> Type · `reasoning/hoare-logic/index.ts:49`

Expresión del lenguaje IMP: constante, booleano, variable o aplicación de operador.

```ts
export type ImpExpr = | { kind: 'const'; value: number } | { kind: 'bool'; value: boolean } | { kind: 'var'; name: string } | { kind: 'binop'; op: ImpBinop; left: ImpExpr; right: ImpExpr } | { kind: 'not'; arg: ImpExpr };
```


## `ImpStmt`

> Type · `reasoning/hoare-logic/index.ts:57`

Sentencia del lenguaje IMP: skip, asignación, secuencia, condicional y bucle while con invariante opcional.

```ts
export type ImpStmt = | { kind: 'skip' } | { kind: 'assign'; var: string; expr: ImpExpr } | { kind: 'seq'; first: ImpStmt; second: ImpStmt } | { kind: 'if'; cond: ImpExpr; then: ImpStmt; else: ImpStmt } | { kind: 'while'; cond: ImpExpr; invariant?: ImpExpr; body: ImpStmt };
```


## `HoareTriple`

> Interface · `reasoning/hoare-logic/index.ts:65`

Tripleta de Hoare {P} stmt {Q}: precondición, comando y postcondición.

```ts
export interface HoareTriple
```


## `num`

> Const · `reasoning/hoare-logic/index.ts:74`

Constructor de literal numérico IMP.

```ts
const num
```


## `bool`

> Const · `reasoning/hoare-logic/index.ts:76`

Constructor de literal booleano IMP.

```ts
const bool
```


## `v`

> Const · `reasoning/hoare-logic/index.ts:78`

Constructor de referencia a variable IMP por nombre.

```ts
const v
```


## `binop`

> Const · `reasoning/hoare-logic/index.ts:80`

Constructor de operación binaria IMP.

```ts
const binop
```


## `not`

> Const · `reasoning/hoare-logic/index.ts:87`

Constructor de negación de expresión IMP.

```ts
const not
```


## `and`

> Const · `reasoning/hoare-logic/index.ts:89`

Constructor de conjunción lógica IMP: `left && right`.

```ts
const and
```


## `or`

> Const · `reasoning/hoare-logic/index.ts:91`

Constructor de disyunción lógica IMP: `left || right`.

```ts
const or
```


## `eq`

> Const · `reasoning/hoare-logic/index.ts:92`

```ts
const eq
```


## `lt`

> Const · `reasoning/hoare-logic/index.ts:93`

```ts
const lt
```


## `le`

> Const · `reasoning/hoare-logic/index.ts:94`

```ts
const le
```


## `skip`

> Const · `reasoning/hoare-logic/index.ts:96`

```ts
const skip
```


## `assign`

> Const · `reasoning/hoare-logic/index.ts:97`

```ts
const assign
```


## `seq`

> Function · `reasoning/hoare-logic/index.ts:102`

```ts
export function seq(...stmts: ImpStmt[]): ImpStmt
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `stmts` | `ImpStmt[]` | no |  |

### Returns

`ImpStmt` — 


## `ifS`

> Const · `reasoning/hoare-logic/index.ts:112`

```ts
const ifS
```


## `whileS`

> Const · `reasoning/hoare-logic/index.ts:118`

```ts
const whileS
```


## `substitute`

> Function · `reasoning/hoare-logic/index.ts:127`

```ts
export function substitute(expr: ImpExpr, varName: string, replacement: ImpExpr): ImpExpr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `ImpExpr` | no |  |
| `varName` | `string` | no |  |
| `replacement` | `ImpExpr` | no |  |

### Returns

`ImpExpr` — 


## `freeVars`

> Function · `reasoning/hoare-logic/index.ts:148`

```ts
export function freeVars(expr: ImpExpr, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `ImpExpr` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `stmtVars`

> Function · `reasoning/hoare-logic/index.ts:166`

```ts
export function stmtVars(stmt: ImpStmt, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `stmt` | `ImpStmt` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `State`

> Type · `reasoning/hoare-logic/index.ts:193`

```ts
export type State = Record<string, number>;
```


## `evalExpr`

> Function · `reasoning/hoare-logic/index.ts:195`

```ts
export function evalExpr(expr: ImpExpr, state: State): number | boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `ImpExpr` | no |  |
| `state` | `State` | no |  |

### Returns

`number \| boolean` — 


## `ExecError`

> Type · `reasoning/hoare-logic/index.ts:262`

```ts
export type ExecError = { error: string };
```


## `execStmt`

> Function · `reasoning/hoare-logic/index.ts:264`

```ts
export function execStmt( stmt: ImpStmt, state: State, maxSteps: number = 10_000, ): State | ExecError
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `stmt` | `ImpStmt` | no |  |
| `state` | `State` | no |  |
| `maxSteps` | `number` | yes |  |

### Returns

`State \| ExecError` — 


## `wp`

> Function · `reasoning/hoare-logic/index.ts:321`

```ts
export function wp(stmt: ImpStmt, post: ImpExpr): ImpExpr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `stmt` | `ImpStmt` | no |  |
| `post` | `ImpExpr` | no |  |

### Returns

`ImpExpr` — 


## `spExtension`

> Function · `reasoning/hoare-logic/index.ts:354`

```ts
export function spExtension(stmt: ImpStmt, pre: ImpExpr): ImpExpr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `stmt` | `ImpStmt` | no |  |
| `pre` | `ImpExpr` | no |  |

### Returns

`ImpExpr` — 


## `generateVCs`

> Function · `reasoning/hoare-logic/index.ts:386`

```ts
export function generateVCs(triple: HoareTriple): ImpExpr[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `triple` | `HoareTriple` | no |  |

### Returns

`ImpExpr[]` — 


## `VerificationResult`

> Interface · `reasoning/hoare-logic/index.ts:434`

```ts
export interface VerificationResult
```


## `VerifyOptions`

> Interface · `reasoning/hoare-logic/index.ts:440`

```ts
export interface VerifyOptions
```


## `verifyTriple`

> Function · `reasoning/hoare-logic/index.ts:450`

```ts
export function verifyTriple(triple: HoareTriple, opts: VerifyOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `triple` | `HoareTriple` | no |  |
| `opts` | `VerifyOptions` | yes |  |

### Returns

`VerificationResult` — 


## `programSwap`

> Function · `reasoning/hoare-logic/index.ts:539`

Swap x ↔ y vía variable temporal `t`.
  t := x; x := y; y := t
Tripleta canónica: {x = a ∧ y = b} swap {x = b ∧ y = a}

```ts
export function programSwap(): ImpStmt
```

### Returns

`ImpStmt` — 


## `programFactorial`

> Function · `reasoning/hoare-logic/index.ts:553`

Factorial:  r := 1; k := 0; while k < n do { k := k+1; r := r * k }
Tripleta:   {n = N ∧ N ≥ 0} fact {r = N!}
Invariant:  k ≤ n ∧ r = k!  (codificable como r = k!, k entre 0 y n)

Como la lógica de Hoare aquí no tiene factorial nativo, exponemos el
código y el invariant en forma `r > 0 ∧ k ≤ n` (suficiente para
los tests de mantenimiento sintácticos con muestreo: el ejecutor
confirma corrección concreta para n pequeños).

```ts
export function programFactorial(): ImpStmt
```

### Returns

`ImpStmt` — 


## `programGCD`

> Function · `reasoning/hoare-logic/index.ts:573`

GCD por algoritmo de Euclides con restas:
  while x != y do { if x > y then x := x - y else y := y - x }
Invariant: gcd(x, y) = gcd(a, b). Como no tenemos gcd nativo,
usamos como invariant `x ≥ 1 ∧ y ≥ 1` (mantenido por restas
positivas cuando x ≠ y y ambos positivos al entrar).

```ts
export function programGCD(): ImpStmt
```

### Returns

`ImpStmt` — 


## `programLinearSearch`

> Function · `reasoning/hoare-logic/index.ts:594`

Búsqueda lineal:
  i := 0; found := 0;
  while i < n && found == 0 do {
    if a == target then found := 1 else skip;
    i := i + 1
  }
Modelo simplificado: `a` representa el elemento actual (no un array;
el AST de IMP no tiene arrays). Sirve como esqueleto pedagógico
para discutir el invariant `i ≤ n` y la post `found == 1 ∨ i == n`.

```ts
export function programLinearSearch(): ImpStmt
```

### Returns

`ImpStmt` — 


## `factorial`

> Function · `reasoning/hoare-logic/index.ts:609`

```ts
export function factorial(n: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`number` — 


## `gcd`

> Function · `reasoning/hoare-logic/index.ts:615`

```ts
export function gcd(a: number, b: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `number` | no |  |
| `b` | `number` | no |  |

### Returns

`number` — 

