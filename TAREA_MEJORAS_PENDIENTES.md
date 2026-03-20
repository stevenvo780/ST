# ST Language — Tareas de Mejora Pendientes

> **Contexto**: El sistema ST tiene 5 limitaciones por diseño identificadas en la auditoría v3.  
> 3 de ellas son resolubles. 1 es discutible. 1 es intocable.  
> Este documento describe EXACTAMENTE qué hacer para resolver las 3 arreglables.

---

## ❌ NO TOCAR — L-2: Modus Ponens en Belnap

**Esto NO es una tarea. No se debe modificar.**

MP falla en Belnap/FDE porque el valor `Both` (verdadero Y falso) rompe la preservación de verdad. Si se "arregla" MP, se destruye la paraconsistencia y el sistema colapsa a lógica clásica. Es una propiedad fundamental de la lógica de 4 valores.

---

## ⚖️ DISCUTIBLE — L-1: `prove` requiere `from`

**Prioridad**: Baja  
**Riesgo**: Ninguno técnico, pero empeora la semántica

Actualmente `prove P` sin `from` da error. Se podría hacer que `prove P` (sin axiomas) sea un alias de `check valid P`. Pero esto confunde dos conceptos: validez lógica (tautología) vs. derivabilidad desde premisas.

**Decisión del mantenedor**: si se quiere, implementar como sugar sintáctico en el parser. Si no, dejar como está (es lo semánticamente correcto).

---

## ✅ TAREA 1: Tabla de verdad Belnap visible al usuario (L-3)

**Prioridad**: Media  
**Riesgo**: Ninguno  
**Archivo**: `src/profiles/paraconsistent/belnap.ts`

### Situación actual

El método `generateBelnapTable()` (línea 378) YA calcula la tabla de 4 valores internamente. Se usa en `checkValid`, `checkSatisfiable`, `countermodel`, etc. Pero cuando el usuario ejecuta `truth_table P & !P` en perfil `paraconsistent.belnap`, no obtiene la tabla formateada.

### Qué hacer

Agregar/modificar el método `truthTable()` en la clase `BelnapProfile` para que retorne un `RunResult` con la tabla formateada en el campo `output`.

### Formato esperado de salida

```
Tabla de verdad Belnap (4 valores) para: P ∧ ¬P

| P | ¬P | P ∧ ¬P |
|---|-----|---------|
| T |  F |    F    |
| F |  T |    F    |
| B |  B |    B    | ⊛ Designado
| N |  N |    F    |

Valores designados (portadores de verdad): {T, B}
Tautología: NO
Satisfacible: SÍ (B es designado)
Contradicción: NO
```

### Implementación sugerida

1. El método `generateBelnapTable()` ya retorna `TruthTableResult` con `variables`, `rows`, `isTautology`, `isSatisfiable`, `isContradiction`.
2. Cada `row` tiene `valuation` (mapa variable→valor) y `result` (valor Belnap).
3. Solo falta un formateador que itere `rows` y construya la tabla como string.
4. Marcar con `⊛` las filas donde `result ∈ {T, B}` (valores designados).

### Referencia

- `generateBelnapTable()`: línea 378 de `belnap.ts`
- `evaluateBelnap()`: línea ~330 de `belnap.ts`
- `VALUES = ['T', 'F', 'B', 'N']`: línea 25
- El tipo `TruthTableResult` está en `src/types/index.ts`

### Tests que agregar

```typescript
// En src/tests/paraconsistent.test.ts
test('truth_table devuelve tabla formateada con 4 valores', () => {
  const result = profile.truthTable(parse('P & !P'));
  expect(result.output).toContain('B');
  expect(result.output).toContain('N');
  expect(result.output).toContain('Designado');
});

test('truth_table marca valores designados correctamente', () => {
  const result = profile.truthTable(parse('P | !P'));
  // En Belnap P|!P NO es tautología (falla para N)
  expect(result.output).toContain('NO'); // no tautología
});
```

---

## ✅ TAREA 2: Contramodelo Belnap con valuaciones específicas (L-4)

**Prioridad**: Media  
**Riesgo**: Ninguno  
**Archivo**: `src/profiles/paraconsistent/belnap.ts`

### Situación actual

El método `countermodel()` (línea 207) ya encuentra la fila de la tabla donde el resultado no es designado. Pero retorna un `Model` genérico con `type: 'propositional'` y valuación clásica, perdiendo la información de los 4 valores.

### Código actual (línea 207-229)

```typescript
countermodel(formula: Formula): RunResult {
  const tt = this.generateBelnapTable(formula);
  const designated = new Set(['T', 'B']);
  const cm = tt.rows.find((r) => !designated.has(String(r.result)));

  if (cm) {
    return {
      status: 'invalid',
      output: `Contramodelo encontrado en Belnap`,
      model: { type: 'propositional', valuation: cm.valuation },
      diagnostics: [],
      formula,
    };
  }
  // ...
}
```

### Qué hacer

Enriquecer el `output` para mostrar las valuaciones Belnap específicas.

### Formato esperado de salida

```
Contramodelo Belnap para: P | !P
  Valuación:
    P = N (Neither — ni verdadero ni falso)
  Resultado: P | !P = N (no designado)
  
  Explicación: En la lógica de Belnap, el valor "Neither" (N) 
  no es designado, por lo que la fórmula falla bajo esta valuación.
```

### Implementación sugerida

1. La variable `cm` ya contiene `cm.valuation` (mapa variable→BelnapValue) y `cm.result`.
2. Construir un string que itere `cm.valuation` mostrando cada variable y su valor Belnap.
3. Agregar explicación del valor no-designado.
4. Mantener el `model` para compatibilidad, pero enriquecer `output`.

### Tests que agregar

```typescript
test('countermodel Belnap muestra valuaciones de 4 valores', () => {
  const result = profile.countermodel(parse('P | !P'));
  expect(result.output).toContain('N'); // Neither
  expect(result.output).toContain('no designado');
});
```

---

## ✅ TAREA 3: Alias de sintaxis modal por perfil (L-5)

**Prioridad**: Alta (mejora UX significativa)  
**Riesgo**: Medio — requiere diseño cuidadoso para evitar conflictos de tokens  
**Archivos**: `src/lexer/lexer.ts`, `src/lexer/tokens.ts`, `src/parser/parser.ts`

### Situación actual

Todos los perfiles modales usan `[]` (BOX) y `<>` (DIAMOND) como sintaxis de input:

- Deóntico: `[]P` = O(P), `<>P` = P(P)
- Epistémico: `[]P` = K(P), `<>P` = B(P)
- Temporal: `[]P` = G(P), `<>P` = F(P)

El `explain()` muestra notación de dominio (K, O, G, F) pero el usuario NO puede escribir `K(P)` — se parsea como predicado `K` aplicado a argumento `P`.

### El problema

Un estudiante que lee `explain` y ve `K(φ) → φ` intenta escribir `check valid K(P) -> P` y no funciona. Debe escribir `check valid []P -> P`.

### Qué hacer

Agregar tokens de alias que se mapeen a BOX/DIAMOND según el perfil activo.

### Diseño propuesto (Opción A — Aliases en el lexer, sensibles a perfil)

**Tokens nuevos** en `src/lexer/tokens.ts`:

No se necesitan tokens nuevos. La idea es que el lexer reciba el perfil activo y, cuando encuentre ciertos identificadores, los trate como BOX/DIAMOND.

**Modificar el lexer** (`src/lexer/lexer.ts`):

1. El `Lexer` ya recibe el source. Agregar un parámetro opcional `profileHint?: string`.
2. Cuando el lexer encuentra un IDENTIFIER seguido de `(`, verificar si es un alias modal:

```typescript
// Mapa de aliases por perfil
const MODAL_ALIASES: Record<string, Record<string, TokenType>> = {
  'deontic.standard': { 'O': TokenType.BOX, 'P': TokenType.DIAMOND, 'F': /* special: BOX+NOT */ },
  'epistemic.s5':     { 'K': TokenType.BOX, 'B': TokenType.DIAMOND },
  'temporal.ltl':     { 'G': TokenType.BOX, 'F': TokenType.DIAMOND },
  'modal.k':          { 'Box': TokenType.BOX, 'Dia': TokenType.DIAMOND },
};
```

3. Cuando se reconoce un alias + `(`, emitir `BOX` + `LPAREN` (o `DIAMOND` + `LPAREN`) en vez de `IDENTIFIER` + `LPAREN`.
4. El parser ya sabe manejar `BOX expr` y `DIAMOND expr` — no necesita cambios.

### Complicaciones a resolver

1. **`F` es ambiguo**: en deóntico `F(P)` = prohibición = `[](¬P)`, en temporal `F(P)` = eventualidad = `<>P`. Solución: depende del perfil activo.
2. **`P` es ambiguo**: en deóntico `P(P)` = permisión = `<>P`, pero `P` también es un nombre de proposición. Solución: solo tratar como alias si va seguido de `(`. Si es `P` solo, es un átomo.
3. **Propagación del perfil**: el statement `logic deontic.standard` ya se parsea. El runtime sabe el perfil. El lexer necesita saberlo también. Opciones:
   - (a) Pre-scan: escanear el source buscando `logic <profile>` antes de tokenizar → más simple.
   - (b) Re-lex: lexear dos veces, la segunda con el perfil conocido.
   - (c) Lazy aliases: no tocar el lexer, sino hacer la transformación en el parser cuando ve `IDENTIFIER(expr)` y el perfil está activo.

**Opción recomendada**: (c) Lazy aliases en el parser. Es la menos invasiva:

```typescript
// En parser.ts, cuando parsea una expresión primaria:
// Si ve IDENTIFIER + LPAREN y el identifier está en MODAL_ALIASES[currentProfile]:
//   → parsear como modal_necessity/modal_possibility en vez de predicate call
```

### Cómo pasa el perfil al parser

El parser ya maneja `logic <profile>` como statement. Cuando lo encuentra, puede setear `this.currentProfile = profileName`. Luego, en el parseo de expresiones, consulta `MODAL_ALIASES[this.currentProfile]`.

### Caso especial: `F(P)` deóntico = `[](¬P)`

En deóntico, `F(φ)` no es simplemente BOX ni DIAMOND, sino `BOX(NOT(φ))`. El parser debe construir:

```typescript
{ kind: 'modal_necessity', args: [{ kind: 'not', args: [innerExpr] }] }
```

### Tests que agregar

```typescript
// Deóntico
test('O(P) parsea como modal_necessity', () => {
  const ast = parseWithProfile('check valid O(P) -> P(P)', 'deontic.standard');
  // La fórmula interna debe ser modal_necessity -> modal_possibility
});

// Epistémico  
test('K(P) parsea como modal_necessity en epistemic', () => {
  const ast = parseWithProfile('check valid K(P) -> P', 'epistemic.s5');
  // K(P) debe ser modal_necessity, P suelto debe ser átomo
});

// Temporal
test('G(P) parsea como modal_necessity en temporal', () => {
  const ast = parseWithProfile('check valid G(P) -> F(P)', 'temporal.ltl');
  // G = BOX, F = DIAMOND
});

// Sin perfil: K es predicado normal
test('K(P) sin perfil modal es un predicado', () => {
  const ast = parseWithProfile('check valid K(P) -> P', 'classical.first_order');
  // K(P) debe ser un predicado, no modal
});
```

### Flujo completo del cambio

```
1. src/parser/parser.ts
   - Agregar propiedad: currentProfile: string = ''
   - En parseLogicStatement(): setear this.currentProfile
   - En parsePrimaryExpression(): si IDENTIFIER + LPAREN y alias match → construir modal node

2. src/lexer/* → SIN CAMBIOS (opción c)

3. Tests nuevos en src/tests/

4. Recompilar: npx tsc
5. Correr tests: npx vitest run
6. Probar manualmente:
   logic deontic.standard
   check valid O(P) -> P(P)    // debe dar VÁLIDA
   
   logic epistemic.s5
   check valid K(P) -> P       // debe dar VÁLIDA
   
   logic temporal.ltl
   check valid G(P) -> F(P)    // debe dar VÁLIDA
```

---

## Resumen de tareas

| # | Tarea | Prioridad | Riesgo | Archivos | Esfuerzo estimado |
|---|---|---|---|---|---|
| 1 | Tabla de verdad Belnap visible | Media | Ninguno | `belnap.ts` | ~30 min |
| 2 | Contramodelo Belnap enriquecido | Media | Ninguno | `belnap.ts` | ~20 min |
| 3 | Alias modal por perfil (K/O/G/F) | Alta | Medio | `parser.ts` | ~2-3 horas |
| — | ~~prove sin from~~ | Baja | Ninguno | — | Discutible, no prioritario |
| — | ~~MP en Belnap~~ | — | — | — | **INTOCABLE** |

### Orden recomendado de ejecución

1. **Tarea 2** (contramodel Belnap) — la más simple, aislada
2. **Tarea 1** (truth_table Belnap) — simple, mismo archivo
3. **Tarea 3** (alias modal) — la más compleja, hacer al final

### Validación post-implementación

```bash
npx tsc                    # 0 errores
npx vitest run             # 648+ tests pass (se agregarán nuevos)
node dist/cli/index.js examples/theory-showcase.st  # sin regresiones
```

---

## 🚨 NUEVAS VULNERABILIDADES DESCUBIERTAS (Test de Estrés Extremo)

**Prioridad**: Crítica  
**Riesgo**: Alto (Crash del motor por OOM y Stack Overflow)

Durante las pruebas de estrés, se encontraron tres formas de destruir el intérprete que deben ser parcheadas:

### 1. Ataque Aritmético: OOM por Evaluación Simbólica Perezosa
- **Problema**: El perfil aritmético no reduce `N + 1` a un valor (ej. `2`), sino que construye un árbol AST `add(1, 1)`. En loops y recursiones, esto genera árboles infinitamente grandes `add(add(add...))` hasta causar un `JavaScript heap out of memory`.
- **Solución Propuesta**: Implementar reducción ansiosa (eager evaluation) o plegado de constantes (constant folding) en las asignaciones aritméticas.

### 2. Ataque FOL (Dominio Infinito): Stack Overflow en Tableau
- **Problema**: Evaluar fórmulas de modelo infinito (ej. transitividad irreflexiva + serialidad: `∀x∃y R(x,y)`) provoca que la alternancia de reglas Delta (crear constante) y Gamma (instanciar universalmente) multiplique las ramas exponencialmente. Revienta el límite de la pila de V8 (`Maximum call stack size exceeded`) ANTES de llegar al límite de seguridad `depth > 3000`.
- **Solución Propuesta**: Reducir el límite de seguridad `MAX_DEPTH` del tableau de FOL a un valor conservador (ej. 500) o limitar el número máximo de iteraciones de la regla Gamma.

### 3. Agujero Negro Recursivo (Recursión Silenciosa)
- **Problema**: Las funciones declaradas con `fn` permiten recursión mutua sin límite. Si se fuerza su evaluación, rompen la pila sin arrojar un error semántico manejado por ST.
- **Solución Propuesta**: Inyectar un limitador de profundidad (call-stack limiter) directamente en el método `Interpreter.executeFnCall()`.
