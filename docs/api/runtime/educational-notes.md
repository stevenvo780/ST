# `runtime/educational-notes.ts`

Pool de notas pedagógicas contextuales para enriquecer los resultados del motor.
Cada operación/resultado tiene varias notas posibles; se elige una al azar.

## Contents

- [`NoteContext`](#notecontext) — Type
- [`pickEducationalNote`](#pickeducationalnote) — Function

## `NoteContext`

> Type · `runtime/educational-notes.ts:99`

```ts
export type NoteContext = | { op: 'satisfiable'; sat: boolean } | { op: 'valid'; valid: boolean } | { op: 'equivalent'; equiv: boolean } | { op: 'derive'; ok: boolean; steps?: number; rules?: string[] } | { op: 'prove'; ok: boolean } | { op: 'countermodel'; found: boolean };
```


## `pickEducationalNote`

> Function · `runtime/educational-notes.ts:107`

```ts
export function pickEducationalNote(ctx: NoteContext): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `NoteContext` | no |  |

### Returns

`string` — 

