# `reasoning/datalog/index.ts`

============================================================ ST Datalog — Motor de evaluación ============================================================ Datalog: subconjunto declarativo de Prolog sin functores ni términos compuestos. Programas son siempre terminantes (no hay recursión por estructuras), y la semántica fixpoint coincide con la semántica de modelo mínimo (Herbrand). Soporta:   - Parser textual ("p(X, Y) :- q(X, Z), r(Z, Y).")   - Evaluación bottom-up semi-naive con tracking de delta   - Evaluación top-down (SLD) con memoización para terminación   - Negación estratificada (¬p en cuerpo, p en estrato menor)   - Magic sets transformation para focalizar bottom-up por consulta   - Programas comunes: clausura transitiva, alcanzabilidad Convención de términos:   - Identificador que empieza con mayúscula = variable (X, Y, Z).   - Identificador que empieza con minúscula o dígito = constante. Nota: este módulo es puro TypeScript, sin dependencias del resto del repo. Las estructuras son inmutables hacia afuera y se reutilizan internamente con copias defensivas donde corresponde. ── Tipos básicos ────────────────────────────────────────────

## Contents

- [`DatalogTerm`](#datalogterm) — Type
- [`DatalogAtom`](#datalogatom) — Interface
- [`DatalogRule`](#datalogrule) — Interface
- [`DatalogProgram`](#datalogprogram) — Interface
- [`Substitution`](#substitution) — Interface
- [`EvaluationResult`](#evaluationresult) — Interface
- [`StratifiedRule`](#stratifiedrule) — Interface
- [`isVariable`](#isvariable) — Function
- [`isGround`](#isground) — Function
- [`parseAtom`](#parseatom) — Function
- [`parseRule`](#parserule) — Function
- [`unifyAtoms`](#unifyatoms) — Function
- [`applySubstitution`](#applysubstitution) — Function
- [`evaluateBottomUp`](#evaluatebottomup) — Function
- [`querySLD`](#querysld) — Function
- [`evaluateStratified`](#evaluatestratified) — Function
- [`magicSets`](#magicsets) — Function
- [`transitiveClosure`](#transitiveclosure) — Function
- [`pathReachability`](#pathreachability) — Function

## `DatalogTerm`

> Type · `reasoning/datalog/index.ts:28`

```ts
export type DatalogTerm = string;
```


## `DatalogAtom`

> Interface · `reasoning/datalog/index.ts:30`

```ts
export interface DatalogAtom
```


## `DatalogRule`

> Interface · `reasoning/datalog/index.ts:35`

```ts
export interface DatalogRule
```


## `DatalogProgram`

> Interface · `reasoning/datalog/index.ts:40`

```ts
export interface DatalogProgram
```


## `Substitution`

> Interface · `reasoning/datalog/index.ts:45`

```ts
export interface Substitution
```


## `EvaluationResult`

> Interface · `reasoning/datalog/index.ts:49`

```ts
export interface EvaluationResult
```


## `StratifiedRule`

> Interface · `reasoning/datalog/index.ts:54`

```ts
export interface StratifiedRule extends DatalogRule
```


## `isVariable`

> Function · `reasoning/datalog/index.ts:65`

Una variable Datalog es un término cuyo primer carácter es una
letra mayúscula. Todo lo demás (minúsculas, dígitos, comillas)
cuenta como constante.

```ts
export function isVariable(term: DatalogTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `DatalogTerm` | no |  |

### Returns

`boolean` — 


## `isGround`

> Function · `reasoning/datalog/index.ts:72`

Un átomo es ground sii ninguno de sus argumentos es variable.

```ts
export function isGround(atom: DatalogAtom): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `atom` | `DatalogAtom` | no |  |

### Returns

`boolean` — 


## `parseAtom`

> Function · `reasoning/datalog/index.ts:102`

Parsea un átomo de la forma `predicate(arg1, arg2, ...)`.
Devuelve null si la sintaxis es inválida.

```ts
export function parseAtom(s: string): DatalogAtom | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `string` | no |  |

### Returns

`DatalogAtom \| null` — 


## `parseRule`

> Function · `reasoning/datalog/index.ts:119`

Parsea una regla `head :- body1, body2, ...` o un hecho `head`.
El punto final es opcional. Devuelve null si la sintaxis falla.

```ts
export function parseRule(s: string): DatalogRule | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `string` | no |  |

### Returns

`DatalogRule \| null` — 


## `unifyAtoms`

> Function · `reasoning/datalog/index.ts:187`

Unificación de dos átomos. Devuelve la sustitución más general que
los unifica, o null si no son unificables.

Reglas:
  - Predicados distintos o aridades distintas → fallo.
  - Variable vs término → bind (sin occurs check; Datalog no tiene
    functores compuestos así que occurs check no aplica).
  - Constante vs constante → match exacto.

```ts
export function unifyAtoms(a: DatalogAtom, b: DatalogAtom): Substitution | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `DatalogAtom` | no |  |
| `b` | `DatalogAtom` | no |  |

### Returns

`Substitution \| null` — 


## `applySubstitution`

> Function · `reasoning/datalog/index.ts:213`

Aplica una sustitución a un átomo, resolviendo cadenas vía walk.
Si una variable queda sin binding, se conserva tal cual.

```ts
export function applySubstitution(atom: DatalogAtom, subst: Substitution): DatalogAtom
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `atom` | `DatalogAtom` | no |  |
| `subst` | `Substitution` | no |  |

### Returns

`DatalogAtom` — 


## `evaluateBottomUp`

> Function · `reasoning/datalog/index.ts:318`

Evaluación bottom-up con la variante semi-naive: en cada iteración
sólo recomputamos sustituciones que involucran al menos un fact
nuevo del paso anterior. Para Datalog puro (sin negación) esto
computa el modelo mínimo de Herbrand en O(|reglas| · |facts|^aridad)
en el peor caso.

Notas:
  - `opts.maxIterations` por defecto 1000. Datalog termina siempre,
    pero programas con muchos términos requieren un techo defensivo
    para no colgar tests.
  - Variables anónimas (no aparecen renombradas externamente) se
    reinstancian por regla en cada paso.

```ts
export function evaluateBottomUp( p: DatalogProgram, opts: { maxIterations?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `DatalogProgram` | no |  |
| `opts` | `{ maxIterations?: number }` | yes |  |

### Returns

`EvaluationResult` — 


## `querySLD`

> Function · `reasoning/datalog/index.ts:374`

Devuelve todas las instancias ground del query derivables del
programa, evaluando top-down como SLD con memoización por átomo
(tabling). La memoización es esencial: SLD puro sobre programas
recursivos (ej. transitive closure) no terminaría.

`maxDepth` limita la profundidad de resolución para evitar
explosión exponencial. Default 100.

```ts
export function querySLD(p: DatalogProgram, query: DatalogAtom, maxDepth = 100): DatalogAtom[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `DatalogProgram` | no |  |
| `query` | `DatalogAtom` | no |  |
| `maxDepth` | `any` | yes |  |

### Returns

`DatalogAtom[]` — 


## `evaluateStratified`

> Function · `reasoning/datalog/index.ts:471`

Evalúa un programa con negación estratificada. En cada estrato
se ejecuta bottom-up con el set de facts acumulado, interpretando
los literales negados bajo CWA (closed world assumption): `¬p(t)`
es verdadero sii `p(t)` no está en el modelo del estrato previo.

Si el programa no se puede estratificar, devuelve un resultado con
0 iteraciones y solo los facts iniciales (mejor que arrojar).

```ts
export function evaluateStratified(p:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `{   facts: DatalogAtom[];   rules: StratifiedRule[]; }` | no |  |

### Returns

`EvaluationResult` — 


## `magicSets`

> Function · `reasoning/datalog/index.ts:573`

Magic sets: transforma un programa P y una consulta Q en un
programa P' tal que la evaluación bottom-up de P' computa sólo
los facts relevantes para Q, en vez del modelo mínimo completo.

Implementación mínima pero funcional:
  - Introduce predicados `magic_<head>` con los args bound del query.
  - Reescribe cada regla para que su disparo dependa del magic seed
    correspondiente y propague seeds a literales recursivos.

Para consultas con todos los args ground, devuelve la consulta
cerrada como seed inicial. Para args variables, devuelve el
programa original (no hay focus posible).

```ts
export function magicSets(program: DatalogProgram, query: DatalogAtom): DatalogProgram
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `program` | `DatalogProgram` | no |  |
| `query` | `DatalogAtom` | no |  |

### Returns

`DatalogProgram` — 


## `transitiveClosure`

> Function · `reasoning/datalog/index.ts:659`

Programa canónico de clausura transitiva:

  parent(alice, bob).
  parent(bob, carol).
  parent(carol, dave).
  ancestor(X, Y) :- parent(X, Y).
  ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).

```ts
export function transitiveClosure(): DatalogProgram
```

### Returns

`DatalogProgram` — 


## `pathReachability`

> Function · `reasoning/datalog/index.ts:689`

Programa de alcanzabilidad en un grafo dirigido de 4 nodos:

  edge(n1, n2). edge(n2, n3). edge(n3, n4). edge(n1, n3).
  reach(X, Y) :- edge(X, Y).
  reach(X, Y) :- edge(X, Z), reach(Z, Y).

```ts
export function pathReachability(): DatalogProgram
```

### Returns

`DatalogProgram` — 

