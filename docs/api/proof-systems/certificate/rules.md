# `proof-systems/certificate/rules.ts`

============================================================ ST Proof Certificate — Standard rule checkers ============================================================ Cada checker recibe (args, conclusion, premises) y retorna true si el paso aplica la regla correctamente. NO hacen búsqueda — sólo chequean estructura sintáctica de strings canonicalizados. Las fórmulas viajan como strings. Reconocemos los operadores estándar de proposicional/clásico con variantes ASCII y Unicode:   negación:     ~ A   |   ¬A   |   !A   |   not A   conjunción:   A & B |  A ∧ B |  A and B   disyunción:   A | B |  A ∨ B |  A or B   implicación:  A -> B |  A → B   bicondicional: A <-> B |  A ↔ B Para minimizar dependencia con el AST interno, comparamos por igualdad de la forma normalizada (`normalizeFormula`). Cuando necesitamos descomponer un operador binario, escaneamos a top-level respetando paréntesis.

## `STANDARD_RULES`

> Const · `proof-systems/certificate/rules.ts:306`

Tabla de reglas estándar. El verificador busca primero en esta tabla
(o en una tabla custom pasada como parámetro). Si la regla no
existe, registra un error pero no aborta para listar todos.

```ts
const STANDARD_RULES: Map<string, CertRuleChecker>
```

