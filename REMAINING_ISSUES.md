# ST — Issues pendientes y mejoras identificadas

Documento actualizado tras la auditoría técnica integral de v3.1.1.
Organizado por severidad y módulo.

---

## RESUELTOS EN ESTA AUDITORÍA

Los siguientes issues identificados en auditorías anteriores quedaron cerrados
en esta pasada. No requieren acción adicional:

| Código | Descripción | Dónde se resolvió |
|--------|-------------|-------------------|
| C1 | `prove` ignoraba las premisas explícitas — usaba toda la teoría. | Todos los perfiles aceptan `premises?: string[]` (base-profile, classical.propositional, classical.first-order, intuitionistic, paraconsistent.belnap, aristotelian, probabilistic, arithmetic). `interpreter.execProveCmd` y el handler de la acción `prove` pasan `stmt.premises`. |
| C2 | Pruebas semánticas se auto-registraban como teoremas sin distinguirse de una derivación sintáctica. | `enrichResult` marca `proof.method = 'semantic'`; el output de `prove` incluye `"(verificación semántica, sin derivación sintáctica)"`; el interpreter no auto-registra teoremas cuando `proof.method === 'semantic'`. |
| C3 | `derive` retornaba `refutable` cuando realmente era incompletitud del motor. | `derive` retorna `unknown` cuando no hay derivación sintáctica y el fallback semántico no encuentra contramodelo; los perfiles paraconsistente/first-order mantienen `refutable` solo cuando hay contramodelo real. |
| C4 | `formulasEqual` fallaba con cuantificadores α-equivalentes y predicados con argumentos. | Nuevo `alphaEqualFormulas` en `classical/propositional.ts` maneja α-renombrado en `forall`/`exists` y compara nombre + args en `predicate`. |
| A1 | Filtros por substring de `justification` para detectar pasos semánticos/premisas. | `ProofStep.source: 'premise' \| 'assumption' \| 'rule' \| 'semantic' \| 'subproof' \| 'goal'`. Todos los constructores de `ProofStep` propagan `source`. Las comparaciones en `propositional.ts` leen el campo tipado, no substrings. |
| A2 | `package.json` declaraba dependencia circular a `@stevenvo780/st-lang ^3.1.0` y arrastraba `@replit/codemirror-minimap`. | Eliminados de `dependencies`. |
| A3 | README desactualizado (badges y URLs de release a v2.0.1). | Badges y URLs actualizadas a 3.1.1. |
| A4 | REPL saludaba con `ST REPL v1.0.0` hardcodeado. | Lee `version` de `package.json` en runtime. |
| A5 | Constantes `⊥`/`⊤` no eran formulas de primera clase (se expandían a átomos `_FALSE`/`_TRUE` vía compat). | `FormulaKind` incluye `'true'` y `'false'`. Lexer reconoce `⊤`, `⊥`, `true`, `false`, `verdadero`, `falso`. Parser emite nodos `{kind:'true'}`/`{kind:'false'}`. `evaluateClassical`, NNF, `formulaToString`, `forces` (intuicionista), `evaluateBelnap` y el tableau engine (`closes`) los tratan como constantes. |
| A6 | `isFormula` aceptaba cualquier objeto con `kind: string`. | Valida contra `FORMULA_KIND_SET` en runtime; rechaza strings arbitrarios. |

---

## CRITICO

### 1. REPL: buffer multilinea roto

**Archivo**: `src/repl/repl.ts:74`

El REPL sobrescribe `buffer` en cada linea en lugar de acumularlo:

```typescript
buffer = trimmed;          // ← sobrescribe, deberia ser buffer += '\n' + trimmed
this.executeBuffer(buffer);
buffer = '';
```

**Impacto**: Cualquier entrada multilinea (proof blocks `assume/show/qed`, theories, bloques con `{...}`) pierde todas las lineas anteriores. Solo se ejecuta la ultima linea.

**Fix**: Detectar si la linea actual abre un bloque (`assume`, `theory`, `{`) y acumular hasta el cierre correspondiente antes de ejecutar.

---

### 2. KD seriality incompleta en el motor de tableaux

**Archivo**: `src/profiles/shared/tableau-engine.ts:80-103`

`FRAME_KD.enforceFrameConditions()` solo crea mundos sucesores para mundos que tienen gamma-watchers (`□φ`). La serialidad de KD exige que **todo** mundo tenga al menos un sucesor, incluyendo mundos con solo formulas diamante (`◇φ`).

**Impacto**: Juicios de validez incorrectos en logica deontica/modal KD para formulas que solo usan `◇` sin `□`. Un mundo con `◇P` y sin formulas de necesidad no recibira sucesor.

**Fix**: Revisar tambien `branch.pending` y `branch.worlds` para crear sucesores en mundos sin gamma-watchers que tengan formulas delta pendientes.

---

### 3. `explain()` crashea con formulas no-proposicionales

**Archivo**: `src/runtime/interpreter.ts:2895+` → delega a `profile.explain()`
**Archivo**: `src/profiles/classical/propositional.ts:2263-2368`

`explain()` llama a `truthTable()` internamente, que depende de `evaluateClassical()`. Este switch solo maneja operadores proposicionales (`atom`, `not`, `and`, `or`, `implies`, `biconditional`).

**Formulas que causan crash**:
- Modal: `□P`, `◇P`
- Temporal: `○P`, `U(P,Q)`
- FOL: `∀x.P(x)`, `∃x.P(x)`
- Predicados: `P(a,b)`
- Aritmetica: `a + b < c`

**Impacto**: Runtime error sin diagnostico util si el usuario ejecuta `explain` sobre una formula no-proposicional.

**Fix**: Guard en `explain()` que verifique que la formula es puramente proposicional antes de llamar a `truthTable()`, o implementar explain semantico por perfil.

---

## ALTO

### 4. ~33 casts `as Formula` sin validacion en interpreter.ts

**Archivo**: `src/runtime/interpreter.ts` (lineas 471, 475, 2618-2745, etc.)

Aunque A6 endureció `isFormula`, los call sites todavía hacen cast directo en vez de invocar el type-guard. El riesgo es mayor en el protocol handler donde los datos vienen de fuentes externas.

**Fix**: Reemplazar `as Formula` por `isFormula(x) ? x : throw ...` al menos en los puntos de entrada del protocolo.

---

### 5. Parser no soporta proof blocks anidados

**Archivo**: `src/parser/parser.ts:618-661`

`parseProofBlock()` parsea `assume/show/qed` pero el body solo acepta statements genericos via `parseStatement()`. No hay manejo recursivo para proof blocks dentro de proof blocks.

**Impacto**: Pruebas de deduccion natural con sub-derivaciones anidadas (conditional proof dentro de conditional proof) no pueden expresarse. Esto es fundamental para ND completo.

**Fix**: Permitir que `parseStatement()` dentro de un proof block reconozca otro `assume` como inicio de sub-bloque y llame recursivamente a `parseProofBlock()`.

---

### 6. Recuperacion de errores del parser limitada

**Archivo**: `src/parser/parser.ts:1661-1712`

`advanceToNextStatement()` es el unico mecanismo de recovery. Solo avanza tokens hasta encontrar newline o keyword de statement.

**Problemas**:
- No hay tracking de profundidad de brackets — un error dentro de `(a & ERROR & b)` consume tokens del siguiente statement
- No hay intento de salvar parseos parciales
- Errores en cascada: un error temprano corrompe el estado y genera multiples errores espurios

**Fix**: Implementar skip bracket-aware que cuente `()`, `{}`, `[]` abiertos y cierre antes de sincronizar.

---

## MEDIO

### 7. Text layer: validacion de anchors ausente

**Archivo**: `src/text-layer/compiler.ts:33-47`

`parseAnchorPath()` no valida entrada:

```typescript
parseAnchorPath("")         // → {path: "", fragment: undefined, type: 'block'}
parseAnchorPath("###")      // → {path: "", fragment: "##", type: 'block'}
parseAnchorPath(null as any) // → crash
```

**Fix**: Validar que `path` no este vacio, que `fragment` sea un identificador valido, y usar regex para detectar tipo de anchor.

---

### 8. Mensajes de error genericos en el parser

**Archivo**: `src/parser/parser.ts` (multiples ubicaciones)

Muchos errores usan mensajes genericos como `"Se esperaba ':' o '='"`, `"Error de parseo"`, `"Token inesperado"` — sin contexto de que se estaba parseando ni sugerencias de correccion.

**Fix**: Incluir contexto en los mensajes.

---

### 9. `tableauTrace` sin tipado semantico rico

**Archivo**: `src/types/index.ts` — `TableauTraceEntry`

Existe tipado básico, pero los consumidores de la API sólo tienen árbol plano de entradas. No hay metadata de rama cerrada/abierta, no hay relación parent/child explícita, ni clasificación de la regla aplicada (α/β/γ/δ) en el nivel de trace.

**Fix**: Enriquecer `TableauTraceEntry` con `rule: 'alpha'|'beta'|'gamma'|'delta'|'close'|'generate_world'|...` y `branchStatus: 'open'|'closed'`.

---

### 10. Deduccion natural: reglas derivadas faltantes

**Archivo**: `src/profiles/classical/propositional.ts` (funcion `tryDerive()`)

Faltan algunas reglas derivadas utiles: conmutatividad explicita, asociatividad, idempotencia, absorcion, ley de exclusion del medio generada explícitamente para proof-by-cases. El fallback semantico las cubre, pero los traces no las muestran.

---

### 11. `prove` sin trace detallado para sub-derivaciones

Cuando `tryDerive()` usa sub-derivaciones recursivas (conditional proof, RAA), los pasos internos de la sub-derivacion NO se incluyen en el trace final.

**Fix**: Retornar los sub-pasos como campo anidado en `ProofStep` o aplanarlos con indentacion en el trace.

---

### 12. Protocol handler: validacion de parametros parcial

**Archivo**: `src/protocol/handler.ts`

El handler ya tiene validaciones básicas de parámetros, pero los casts `as Formula` en el interpreter hacia las acciones del protocolo no usan `isFormula`. Alinear con el endurecimiento de A6.

---

## BAJO

### 13. `formulaToString` no es round-trip safe

Formulas con operadores especiales (`nand`, `nor`) se imprimen con texto que el parser no reconoce como operador binario.

---

### 14. Sin limite de profundidad en tryDerive BFS

Usa `maxIterations` pero sin limite de profundidad del grafo de derivacion.

**Fix**: Agregar limite de profundidad + heuristica de relevancia respecto al goal.

---

### 15. Perfiles no-clasicos: `prove` y `derive` delegan al motor proposicional

Una formula genuinamente modal como `□(P → Q) → (□P → □Q)` solo puede ser probada via tableau, no via deduccion natural con trace sintáctico. Limitacion de diseño.

---

### 16. Sin soporte para exportar/importar teorias

No hay mecanismo para serializar una `Theory` a disco y recargarla.

---

### 17. Belnap: logica de 4 valores sin `explain` especifico

El perfil Belnap implementa evaluacion y check pero no tiene `explain()` propio. Intentar `explain` usa el proposicional clasico (2 valores), que da resultados incorrectos.

---

### 18. Probabilistic profile: sin verificacion de coherencia

El perfil probabilistico acepta asignaciones sin verificar P(A) + P(¬A) = 1, P(A|B)·P(B) = P(A∩B), etc.

---

### 19. Aristotelian: sin soporte para silogismos compuestos

Solo maneja silogismos simples (2 premisas, 1 conclusion). No soporta sorites ni silogismos modales.

---

## DEUDA TECNICA

### 20. `interpreter.ts` excesivamente grande (~2950 lineas)

Deberia separarse en `interpreter.ts` (ejecucion core), `formatter.ts`, `actions.ts`.

### 21. `propositional.ts` excesivamente grande (~2400 lineas)

Deberia separarse en `sat.ts` (DPLL + CDCL), `truth-table.ts`, `natural-deduction.ts`, `propositional.ts`.

### 22. Tests de compat solo cubren happy-path

`src/tests/compat.test.ts` tiene 31 tests todos exitosos. Faltan edge cases, sintaxis malformada, interaccion con perfiles no-clasicos.

### 23. Sin benchmarks de rendimiento

Faltan mediciones para explosion combinatoria en tryDerive, truth tables grandes (bitset vs DPLL crossover), tableau S5 con muchos mundos.

---

## RESUMEN POR PRIORIDAD

| # | Severidad | Issue | Modulo |
|---|-----------|-------|--------|
| 1 | CRITICO | REPL buffer multilinea roto | repl.ts |
| 2 | CRITICO | KD seriality incompleta | tableau-engine.ts |
| 3 | CRITICO | `explain()` crashea con no-proposicional | propositional.ts |
| 4 | ALTO | Casts `as Formula` sin `isFormula` | interpreter.ts |
| 5 | ALTO | Sin proof blocks anidados | parser.ts |
| 6 | ALTO | Parser recovery limitada | parser.ts |
| 7 | MEDIO | Text layer validation ausente | text-layer/compiler.ts |
| 8 | MEDIO | Mensajes de error genericos | parser.ts |
| 9 | MEDIO | `tableauTrace` sin semantica rica | types/index.ts |
| 10 | MEDIO | Reglas derivadas faltantes en ND | propositional.ts |
| 11 | MEDIO | Sub-derivaciones sin trace | propositional.ts |
| 12 | MEDIO | Protocol handler validacion parcial | handler.ts |
| 13 | BAJO | `formulaToString` no round-trip | propositional.ts |
| 14 | BAJO | Sin limite de profundidad en BFS | propositional.ts |
| 15 | BAJO | ND solo proposicional en perfiles modales | profiles/* |
| 16 | BAJO | Sin exportar/importar teorias | interpreter.ts |
| 17 | BAJO | Belnap sin explain propio | belnap.ts |
| 18 | BAJO | Probabilistic sin coherencia | probabilistic.ts |
| 19 | BAJO | Aristotelian sin sorites | aristotelian.ts |
| 20 | DEUDA | `interpreter.ts` muy grande | interpreter.ts |
| 21 | DEUDA | `propositional.ts` muy grande | propositional.ts |
| 22 | DEUDA | Tests solo happy-path | compat.test.ts |
| 23 | DEUDA | Sin benchmarks | tests/* |
