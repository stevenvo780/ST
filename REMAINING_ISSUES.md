# ST — Issues pendientes y mejoras identificadas

Documento generado tras un analisis riguroso de todo el motor ST (1113 tests passing).
Organizado por severidad y modulo.

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

```typescript
const worldsWithGamma = new Set<string>();
for (const gw of branch.gammaWatchers) worldsWithGamma.add(gw.sourceWorld);
// ↑ ignora mundos sin gamma-watchers
```

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

Patrones como:

```typescript
snapshot.value as Formula     // linea 471, 475
action.formula as Formula     // linea 2618, 2627
action.left as Formula        // linea 2639
action.right as Formula       // linea 2640
action.goal as Formula        // linea 2665
```

**Impacto**: Si los valores fuente son `undefined` o de tipo incorrecto, se produce un error silencioso o NullPointerException sin diagnostico claro. Especialmente peligroso en las acciones del protocol handler donde los datos vienen de fuentes externas.

**Fix**: Agregar guardas de tipo (`isFormula()` type-guard) o validacion en las fronteras de entrada, al menos en el protocol handler.

---

### 5. Parser no soporta proof blocks anidados

**Archivo**: `src/parser/parser.ts:618-661`

`parseProofBlock()` parsea `assume/show/qed` pero el body solo acepta statements genericos via `parseStatement()`. No hay manejo recursivo para proof blocks dentro de proof blocks.

```
assume P
  show Q -> P
    assume Q     ← esto falla o se interpreta incorrectamente
    show P
    qed
  qed
qed
```

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

### 7. Tipo `Proof` incompleto

**Archivo**: `src/types/index.ts:184-189`

```typescript
export interface Proof {
  goal: Formula;
  steps: ProofStep[];
  status: 'complete' | 'incomplete' | 'failed';
  derivedFrom?: string[];
}
```

Falta informacion para uso educativo y de auditoria:

- No hay campo para la **regla aplicada globalmente** (ND, tableau, semantico)
- No hay campo para **sub-pruebas** (conditional proof, RAA) — `steps` es plano
- No hay **timestamp** ni **metadata de profiling**
- `derivedFrom` es `string[]` sin tipado (podria ser `PremiseRef[]` con ubicacion)

**Impacto**: Los pasos de prueba no pueden representar la estructura arborescente real de una deduccion natural. Comparar prueba manual vs automatica es dificil sin esta estructura.

**Fix**: Agregar `method?: 'natural_deduction' | 'tableau' | 'semantic' | 'sat'`, `subproofs?: Proof[]`, y enriquecer `ProofStep` con informacion de sub-derivacion.

---

## MEDIO

### 8. Text layer: validacion de anchors ausente

**Archivo**: `src/text-layer/compiler.ts:33-47`

`parseAnchorPath()` no valida entrada:

```typescript
parseAnchorPath("")         // → {path: "", fragment: undefined, type: 'block'}
parseAnchorPath("###")      // → {path: "", fragment: "##", type: 'block'}
parseAnchorPath(null as any) // → crash
```

- No validacion de strings vacios
- No manejo de multiples `#` (solo toma el primer split)
- Deteccion de tipo por prefijo es fragil (`fragment.startsWith('h')` matchea `hello`, no solo `h1`)

**Fix**: Validar que `path` no este vacio, que `fragment` sea un identificador valido, y usar regex para detectar tipo de anchor.

---

### 9. Mensajes de error genericos en el parser

**Archivo**: `src/parser/parser.ts` (multiples ubicaciones)

Muchos errores usan mensajes genericos como:

```
"Se esperaba ':' o '='"
"Error de parseo"
"Token inesperado"
```

Sin contexto de que se estaba parseando (axioma, derive, proof block) ni sugerencias de correccion.

**Fix**: Incluir contexto en los mensajes: `"Se esperaba ':' despues del nombre del axioma 'a1'"`, `"Se esperaba 'qed' para cerrar el proof block abierto en linea 5"`.

---

### 10. `tableauTrace` sin tipado en RunResult

**Archivo**: `src/types/index.ts:193+`

`RunResult` tiene `output?: string` que se usa para pasar traces de tableau como texto plano. No hay campo tipado para el arbol de tableau.

**Impacto**: Los consumidores de la API no pueden programaticamente inspeccionar el arbol de tableau — solo hay un string formateado.

**Fix**: Agregar `tableauTrace?: TableauNode[]` con interfaz tipada para nodos, mundos, y ramas.

---

### 11. Deduccion natural: reglas derivadas faltantes

**Archivo**: `src/profiles/classical/propositional.ts` (funcion `tryDerive()`)

Las reglas **fundamentales** estan presentes (MP, MT, silogismo, De Morgan, doble negacion, conditional proof, RAA, exportacion, importacion, dilemas). Pero faltan algunas reglas derivadas utiles:

- **Conmutatividad explicita**: `A & B` → `B & A`, `A | B` → `B | A` (solo se aplica implicitamente via semantica)
- **Asociatividad**: `(A & B) & C` ↔ `A & (B & C)` (no como regla sintactica)
- **Idempotencia**: `A & A` → `A`, `A | A` → `A`
- **Absorcion**: `A & (A | B)` → `A`, `A | (A & B)` → `A`
- **Ley de exclusion del medio**: Generacion de `P | ¬P` como tautologia para proof by cases

**Nota**: Estas NO son reglas basicas de ND, sino reglas derivadas que hacen pruebas mas cortas. La ausencia no afecta completitud (el fallback semantico cubre), pero limita la calidad de los traces de prueba.

---

### 12. `prove` sin trace detallado para sub-derivaciones

**Archivo**: `src/profiles/classical/propositional.ts` (funciones de conditional proof, RAA)

Cuando `tryDerive()` usa sub-derivaciones recursivas (conditional proof lineas 1448-1475, RAA lineas 1383-1410), los pasos internos de la sub-derivacion NO se incluyen en el trace final. Solo aparece el resultado ("Prueba condicional", "RAA").

**Impacto**: El usuario no puede ver los pasos intermedios de una sub-derivacion. Para uso educativo esto es una limitacion importante.

**Fix**: Retornar los sub-pasos como campo anidado en `ProofStep` o aplanarlos con indentacion en el trace.

---

### 13. Protocol handler: sin validacion de parametros de entrada

**Archivo**: `src/protocol/handler.ts`

El handler acepta requests sin validar que los parametros requeridos existan o sean del tipo correcto. Los casts `as Formula` en las lineas 2618-2745 del interpreter dependen de esto.

**Fix**: Validar schema de cada metodo del protocolo antes de despachar.

---

## BAJO

### 14. `formulaToString` no es round-trip safe

**Archivo**: `src/profiles/classical/propositional.ts`

`formulaToString()` genera notacion legible pero `parseFormula()` no siempre puede re-parsear el resultado. Ejemplo: formulas con operadores especiales (`nand`, `nor`) se imprimen como `A nand B` pero el parser no reconoce `nand` como keyword binaria.

**Fix**: Asegurar que `parseFormula(formulaToString(f))` produce un AST equivalente para toda formula valida.

---

### 15. Sin limite de profundidad en tryDerive BFS

**Archivo**: `src/profiles/classical/propositional.ts` (linea ~800)

`tryDerive()` usa un BFS con `maxIterations` de 8000 pasos pero sin limite de profundidad del grafo de derivacion. Para formulas con muchos atomos, la explosion combinatoria de reglas puede generar miles de formulas intermedias sin llegar a ningun resultado util.

**Fix**: Agregar limite de profundidad ademas del limite de iteraciones. Priorizar formulas mas cercanas al goal (heuristica de relevancia).

---

### 16. Perfiles no-clasicos: `prove` y `derive` delegan al motor proposicional

Los perfiles modal, temporal, epistemico, etc. implementan `prove()` y `derive()` delegando al engine proposicional cuando la formula "parece proposicional". Esto es correcto para esos casos, pero significa que una formula genuinamente modal como `□(P → Q) → (□P → □Q)` (axioma K) no puede ser probada via deduccion natural — solo via tableau.

**Impacto**: Limitacion de diseño, no un bug. Los perfiles no-clasicos solo tienen ND proposicional + tableau modal.

---

### 17. Sin soporte para exportar/importar teorias

No hay mecanismo para serializar una `Theory` (axiomas + teoremas + claims) a disco y recargarla. El `import` del parser solo importa archivos fuente completos.

---

### 18. Belnap: logica de 4 valores sin explain

El perfil Belnap (`four-valued`) implementa evaluacion y check pero no tiene `explain()`. Intentar explicar una formula Belnap usara el explain proposicional clasico, que dara resultados incorrectos (2 valores vs 4).

---

### 19. Probabilistic profile: sin verificacion de coherencia

El perfil probabilistico registra asignaciones de probabilidad pero no verifica coherencia (e.g., P(A) + P(¬A) = 1, P(A|B) * P(B) = P(A∩B)). Las asignaciones inconsistentes se aceptan silenciosamente.

---

### 20. Aristotelian: sin soporte para silogismos compuestos

El perfil aristotelico solo maneja silogismos simples (dos premisas, una conclusion). No soporta sorites (cadenas de silogismos) ni silogismos con premisas modales.

---

## DEUDA TECNICA

### 21. Archivo `interpreter.ts` excesivamente grande (~2943 lineas)

Contiene logica de ejecucion, formateo, protocol handling, y despacho de comandos. Deberia separarse en:
- `interpreter.ts` — ejecucion core
- `formatter.ts` — formateo de resultados
- `actions.ts` — despacho de comandos individuales

### 22. `propositional.ts` excesivamente grande (~2400 lineas)

Contiene SAT solvers, truth tables, natural deduction, explain, y formulaToString. Deberia separarse en:
- `sat.ts` — DPLL + CDCL
- `truth-table.ts` — evaluacion bitset
- `natural-deduction.ts` — tryDerive + sub-derivaciones
- `propositional.ts` — orquestacion del perfil

### 23. Tests de compat solo cubren happy-path

`src/tests/compat.test.ts` tiene 31 tests pero todos son casos exitosos. No hay tests para:
- Sintaxis malformada que deberia producir error
- Edge cases (formulas vacias, premises circulares, atomos con nombres reservados)
- Interaccion entre compat layer y perfiles no-clasicos

### 24. Sin benchmarks de rendimiento

No hay tests de rendimiento para:
- Explosion combinatoria en tryDerive con muchos atomos (>10)
- Truth tables con 20+ atomos (bitset vs DPLL crossover)
- Tableau con muchos mundos en S5

---

## RESUMEN POR PRIORIDAD

| # | Severidad | Issue | Modulo |
|---|-----------|-------|--------|
| 1 | CRITICO | REPL buffer multilinea roto | repl.ts |
| 2 | CRITICO | KD seriality incompleta | tableau-engine.ts |
| 3 | CRITICO | explain() crashea con no-proposicional | propositional.ts |
| 4 | ALTO | ~33 casts as Formula sin validar | interpreter.ts |
| 5 | ALTO | Sin proof blocks anidados | parser.ts |
| 6 | ALTO | Parser recovery limitada | parser.ts |
| 7 | ALTO | Tipo Proof incompleto | types/index.ts |
| 8 | MEDIO | Text layer validation ausente | compiler.ts |
| 9 | MEDIO | Mensajes de error genericos | parser.ts |
| 10 | MEDIO | tableauTrace sin tipado | types/index.ts |
| 11 | MEDIO | Reglas derivadas faltantes en ND | propositional.ts |
| 12 | MEDIO | Sub-derivaciones sin trace | propositional.ts |
| 13 | MEDIO | Protocol handler sin validacion | handler.ts |
| 14 | BAJO | formulaToString no round-trip | propositional.ts |
| 15 | BAJO | Sin limite de profundidad en BFS | propositional.ts |
| 16 | BAJO | ND solo proposicional en perfiles modales | profiles/* |
| 17 | BAJO | Sin exportar/importar teorias | interpreter.ts |
| 18 | BAJO | Belnap sin explain propio | belnap.ts |
| 19 | BAJO | Probabilistic sin coherencia | probabilistic.ts |
| 20 | BAJO | Aristotelian sin sorites | aristotelian.ts |
| 21 | DEUDA | interpreter.ts muy grande | interpreter.ts |
| 22 | DEUDA | propositional.ts muy grande | propositional.ts |
| 23 | DEUDA | Tests solo happy-path | compat.test.ts |
| 24 | DEUDA | Sin benchmarks | tests/* |
