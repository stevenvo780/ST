# `parser/parser.ts`

ST Parser — Parser recursivo descendente

Refactor α2 (V4): el parser monolitico se descompone en modulos.
- ./state.ts        — ParserState: token cursor + diagnostico
- ./formulas.ts     — precedencia de formulas + MODAL_ALIASES + formulaToString

La clase `Parser` es el facade publico: misma firma de constructor,
mismo `parse(source): Program`, mismo `diagnostics`. Los consumidores
(interpreter, cli, api, protocol/handler) NO cambian.

## `Parser`

> Class · `parser/parser.ts:64`

```ts
export class Parser
```

