# `ast/visitor.ts`

============================================================ ST AST — Visitor pattern tipado ============================================================ Define `ASTVisitor<T>` y un dispatcher `visit(node, visitor)` para consumir el AST sin escribir un switch enorme cada vez. Es opcional: el interprete actual sigue usando switch directo. Este modulo existe para que consumidores nuevos (linter, formatter, type-checker, etc.) tengan una API uniforme.

## Contents

- [`ASTVisitor`](#astvisitor) — Interface
- [`visit`](#visit) — Function
- [`visitProgram`](#visitprogram) — Function
- [`BaseASTVisitor`](#baseastvisitor) — Class

## `ASTVisitor`

> Interface · `ast/visitor.ts:52`

```ts
export interface ASTVisitor<T>
```


## `visit`

> Function · `ast/visitor.ts:96`

Dispatch tipado: rutea un `Statement` al metodo correspondiente del visitor.
Exhaustivo por discriminated union — si se agrega un kind nuevo,
TypeScript marca el switch como incompleto.

```ts
export function visit<T>(node: Statement, visitor: ASTVisitor<T>): T
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `node` | `Statement` | no |  |
| `visitor` | `ASTVisitor<T>` | no |  |

### Returns

`T` — 


## `visitProgram`

> Function · `ast/visitor.ts:183`

Recorre todos los statements de un programa aplicando el visitor.
Devuelve la lista de resultados.

```ts
export function visitProgram<T>(program: Program, visitor: ASTVisitor<T>): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `program` | `Program` | no |  |
| `visitor` | `ASTVisitor<T>` | no |  |

### Returns

`T[]` — 


## `BaseASTVisitor`

> Class · `ast/visitor.ts:192`

Visitor base con default a `undefined`. Subclases sobrescriben solo
los metodos que les interesan. Util para herramientas que solo se
preocupan por algunos kinds (ej: linter que solo mira theory_decl).

```ts
export abstract class BaseASTVisitor<T> implements ASTVisitor<T>
```

