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

> Const · `reasoning/hoare-logic/index.ts:93`

Constructor de igualdad IMP: `left == right`.

```ts
const eq
```


## `lt`

> Const · `reasoning/hoare-logic/index.ts:95`

Constructor de menor estricto IMP: `left < right`.

```ts
const lt
```


## `le`

> Const · `reasoning/hoare-logic/index.ts:97`

Constructor de menor o igual IMP: `left <= right`.

```ts
const le
```


## `skip`

> Const · `reasoning/hoare-logic/index.ts:100`

Instrucción `skip` (no-op).

```ts
const skip
```


## `assign`

> Const · `reasoning/hoare-logic/index.ts:102`

Instrucción de asignación: `varName := expr`.

```ts
const assign
```


## `seq`

> Function · `reasoning/hoare-logic/index.ts:108`

Secuencia de instrucciones (asociativa a la derecha). Con 0 args devuelve `skip`.

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

> Const · `reasoning/hoare-logic/index.ts:119`

Instrucción condicional `if cond then then_ else else_`.

```ts
const ifS
```


## `whileS`

> Const · `reasoning/hoare-logic/index.ts:126`

Instrucción `while cond body` con invariante opcional para verificación.

```ts
const whileS
```


## `substitute`

> Function · `reasoning/hoare-logic/index.ts:136`

Sustitución sintáctica `expr[replacement/varName]` en expresiones IMP.

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

> Function · `reasoning/hoare-logic/index.ts:158`

Variables libres en la expresión IMP `expr`. Acumula en `acc` (o devuelve un nuevo Set).

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

> Function · `reasoning/hoare-logic/index.ts:177`

Variables mencionadas en la instrucción IMP `stmt` (asignadas y/o leídas).

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

> Type · `reasoning/hoare-logic/index.ts:205`

Estado concreto de IMP: mapa de variables a valores enteros (variables no definidas = 0).

```ts
export type State = Record<string, number>;
```


## `evalExpr`

> Function · `reasoning/hoare-logic/index.ts:208`

Evalúa la expresión IMP `expr` en el estado `state`. Devuelve un número o booleano.

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

> Type · `reasoning/hoare-logic/index.ts:276`

Error de ejecución en IMP (e.g. timeout por bucle infinito).

```ts
export type ExecError = { error: string };
```


## `execStmt`

> Function · `reasoning/hoare-logic/index.ts:279`

Ejecuta `stmt` sobre `state` con un límite de `maxSteps` pasos. Devuelve el estado final o un error.

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

> Function · `reasoning/hoare-logic/index.ts:337`

Precondición más débil `wp(stmt, post)`. Para while requiere invariant anotado; sin él devuelve `false`.

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

> Function · `reasoning/hoare-logic/index.ts:371`

Postcondición más fuerte aproximada `sp(stmt, pre)`. Para x := E cuando E no menciona x; sino devuelve `true`.

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

> Function · `reasoning/hoare-logic/index.ts:404`

Genera las condiciones de verificación (VCs) para la tripla de Hoare: pre, wp global y VCs de loops.

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

> Interface · `reasoning/hoare-logic/index.ts:453`

Resultado de `verifyTriple`: validez, lista de VCs y fallos con contraejemplo.

```ts
export interface VerificationResult
```


## `VerifyOptions`

> Interface · `reasoning/hoare-logic/index.ts:460`

Opciones para `verifyTriple`: tamaño de muestreo, rango de enteros, semilla y estados extra.

```ts
export interface VerifyOptions
```


## `verifyTriple`

> Function · `reasoning/hoare-logic/index.ts:471`

Verifica la tripla `{pre} stmt {post}` por muestreo aleatorio de estados.

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

> Function · `reasoning/hoare-logic/index.ts:560`

Swap x ↔ y vía variable temporal `t`.
  t := x; x := y; y := t
Tripleta canónica: {x = a ∧ y = b} swap {x = b ∧ y = a}

```ts
export function programSwap(): ImpStmt
```

### Returns

`ImpStmt` — 


## `programFactorial`

> Function · `reasoning/hoare-logic/index.ts:574`

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

> Function · `reasoning/hoare-logic/index.ts:594`

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

> Function · `reasoning/hoare-logic/index.ts:615`

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

> Function · `reasoning/hoare-logic/index.ts:631`

Calcula el factorial de `n` en enteros (JavaScript). Solo para tests.

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

> Function · `reasoning/hoare-logic/index.ts:638`

Máximo común divisor de `a` y `b` (Euclides). Solo para tests.

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

