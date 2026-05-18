# `runtime/pi-calculus/types.ts`

Proceso del π-calculus. Es un AST con etiquetas discriminadas para
facilitar pattern matching exhaustivo en TypeScript.

## `PiProcess`

> Type · `runtime/pi-calculus/types.ts:25`

Proceso del π-calculus. Es un AST con etiquetas discriminadas para
facilitar pattern matching exhaustivo en TypeScript.

```ts
export type PiProcess = | { kind: 'nil' } | { kind: 'input'; channel: string; bind: string; cont: PiProcess } | { kind: 'output'; channel: string; value: string; cont: PiProcess } | { kind: 'parallel'; left: PiProcess; right: PiProcess } | { kind: 'new'; channel: string; body: PiProcess } | { kind: 'replication'; body: PiProcess } | { kind: 'choice'; left: PiProcess; right: PiProcess } | { kind: 'match'; left: string; right: string; cont: PiProcess };
```

