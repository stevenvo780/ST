# `runtime/typecheck/checker.ts`

============================================================ ST TypeChecker — Validación estática con sugerencias humanas ============================================================ TypeChecker implementa BaseASTVisitor<TypeError[]> y recorre el AST emitiendo errores antes de evaluar. El caller decide si abortar o continuar (no bloquea evaluate por defecto). ============================================================

## Contents

- [`TypeChecker`](#typechecker) — Class
- [`typeCheck`](#typecheck) — Function

## `TypeChecker`

> Class · `runtime/typecheck/checker.ts:79`

```ts
export class TypeChecker extends BaseASTVisitor<TypeError[]>
```


## `typeCheck`

> Function · `runtime/typecheck/checker.ts:702`

Ejecuta el type-checker estático sobre un Program ya parseado.

```ts
export function typeCheck(program: Program, profile: ProfileName = '', file?: string): TypeError[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `program` | `Program` | no | AST del programa ST |
| `profile` | `ProfileName` | yes | Nombre del perfil activo (puede estar en el AST como logic_decl) |
| `file` | `string` | yes | Nombre del archivo (para TC007) |

### Returns

`TypeError[]` — Lista de TypeError[]  — vacía si no hay errores

