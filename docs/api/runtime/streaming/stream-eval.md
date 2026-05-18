# `runtime/streaming/stream-eval.ts`

============================================================ ST Streaming — streamEval(): evaluación incremental con AsyncIterable ============================================================

## Contents

- [`StreamEvalOptions`](#streamevaloptions) — Interface
- [`streamEval`](#streameval) — Function

## `StreamEvalOptions`

> Interface · `runtime/streaming/stream-eval.ts:13`

```ts
export interface StreamEvalOptions
```


## `streamEval`

> Function · `runtime/streaming/stream-eval.ts:90`

Evalúa una fórmula AST bajo el perfil dado y emite eventos progresivos.

Orden garantizado de eventos:
  `start` → (`subproof` | `progress`)* → `partial` → `done` | `error`

Soporta cancelación vía `AbortSignal`. Cuando se cancela:
  - Se emite un evento `error` con mensaje de cancelación.
  - El iterable termina inmediatamente.

Errores en la evaluación producen un evento `error` (no throw).

```ts
export async function* streamEval( formula: Formula, profile: ProfileName, opts?: StreamEvalOptions, ): AsyncIterable<StreamEvent>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `profile` | `ProfileName` | no |  |
| `opts` | `StreamEvalOptions` | yes |  |

### Returns

`AsyncIterable<StreamEvent>` — 

### Examples

```ts
const formula: Formula = { kind: 'implies', args: [
  { kind: 'atom', name: 'P' },
  { kind: 'atom', name: 'P' },
]};
for await (const event of streamEval(formula, 'classical.propositional')) {
  console.log(event);
}
```

