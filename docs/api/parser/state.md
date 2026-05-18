# `parser/state.ts`

============================================================ ST Parser — Estado compartido (token cursor + diagnostico) ============================================================ Encapsula el estado mutable del parser y todos los helpers de bajo nivel (current/peek/advance/match/expect). Los modulos de parsing especializados (statements, control-flow, formulas, etc.) operan sobre una instancia de ParserState pasada por referencia. Esta capa NO produce nodos AST — solo navega tokens y emite diagnosticos. Toda la logica de construccion de nodos vive en los modulos hijos.

## `ParserState`

> Class · `parser/state.ts:18`

```ts
export class ParserState
```

