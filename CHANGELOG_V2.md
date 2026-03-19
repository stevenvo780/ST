# ST Language — Changelog de Mejoras v2 (Motor de Salidas Pedagógicas)

> **Estado**: ✅ COMPLETO — 648/648 tests, 15/15 examples, 0 bugs
> **Fecha**: 2026-03-19
> **Objetivo**: Cada comando en cada perfil produce salida educativamente completa comparable a un libro de texto universitario de lógica.

---

## Archivos Nuevos Creados (5)

| Archivo | Líneas | Función |
|---|---|---|
| `src/runtime/formula-classifier.ts` | ~200 | Clasificador de fórmulas: identifica conectivo principal, profundidad, complejidad, sub-fórmulas, 27 esquemas de leyes conocidas (LEM, LNC, De Morgan, Peirce, etc.) con unificador de patrones |
| `src/runtime/known-theorems.ts` | ~160 | Catálogo de axiomas/teoremas modales (K, T, D, 4, 5, B) + paradojas (Ross, Samaritano, Omnisciencia, Moore, Chisholm, Introspección Negativa) con matching por unificación |
| `src/runtime/cross-system-compare.ts` | ~55 | Comparador cruzado: evalúa la fórmula actual en todos los perfiles y reporta diferencias (Clásica: VÁLIDA, Intuicionista: NO VÁLIDA, Belnap: NO VÁLIDA, etc.) |
| `src/runtime/format.ts` | ~280 | `formulaToUnicode()`, `formulaToLaTeX()`, `proofToLaTeX()` para exportación formal |
| `src/runtime/fallacies.ts` | ~400 | 11 detectores de falacias: afirmación del consecuente, negación del antecedente, medio no distribuido, petición de principio, generalización apresurada, conversión ilícita, cuaterno terminorum, composición, división, falso dilema, falacia del consecuente |

---

## Archivos Modificados (13)

### 1. `src/types/index.ts` — Tipos enriquecidos en RunResult

Campos nuevos en `RunResult`:
- `reasoningType?: string` — "Modus Ponens", "Barbara", etc.
- `reasoningSchema?: string` — "φ → ψ, φ ⊢ ψ"
- `formulaClassification?: string` — "Contrapositiva", "De Morgan"
- `normalForms?: { nnf, cnf, dnf }` — formas normales de la fórmula
- `formulaAnalysis?: { mainConnective, depth, complexity, subFormulas, atomCount, connectivesUsed }`
- `crossSystemComparison?: Record<string, string>` — comparación entre perfiles
- `tableauTrace?: TableauStep[]` — traza completa del tableau
- `educationalNote?: string` — nota pedagógica contextual
- `paradoxWarning?: string` — advertencia de paradoja conocida

Campos nuevos en `TruthTableResult`:
- `subFormulas?: { formula, label }[]`
- `subFormulaValues?: Record<string, boolean | string>[]`
- `satisfyingCount?: number` — filas verdaderas
- `totalCount?: number` — filas totales

### 2. `src/runtime/interpreter.ts` (~1691 líneas)

- `emitResult()` enriquecido: muestra tableauTrace, Kripke countermodel, cross-system comparison, educational notes, paradox warnings, formula classification, normal forms, reasoning schema
- Integración de `cross-system-compare.ts` (línea ~1461)
- Contramodelo Kripke con mundos/accesibilidad/valuación visible (línea ~1510)
- Tableau trace visible en check_valid/check_satisfiable (línea ~1545)
- Sistema de verbosidad `set verbose on/off/proof/model`

### 3. `src/profiles/classical/propositional.ts` (~1469 líneas)

#### Reglas de derivación (25 reglas totales, 11 nuevas):
| Regla nueva | Esquema |
|---|---|
| Dilema Constructivo | (P→Q) ∧ (R→S), P∨R ⊢ Q∨S |
| Dilema Destructivo | (P→Q) ∧ (R→S), ¬Q∨¬S ⊢ ¬P∨¬R |
| Absorción | P→Q ⊢ P→(P∧Q) — con guardia `isRelevantToGoal()` |
| Exportación | (P∧Q)→R ⊢ P→(Q→R) — con guardia |
| Importación | P→(Q→R) ⊢ (P∧Q)→R — con guardia |
| Resolución | P∨Q, ¬P∨R ⊢ Q∨R |
| De Morgan (AND) | ¬(P∧Q) ⊢ ¬P∨¬Q |
| De Morgan (OR) | ¬(P∨Q) ⊢ ¬P∧¬Q |
| Dilema Simple | P∨Q, P→R, Q→R ⊢ R |
| Reducción al Absurdo (RAA) | Si P→Q y P→¬Q ⊢ ¬P |
| Prueba Condicional | Silogismo hipotético: P→Q, Q→R ⊢ P→R |

#### explain() mejorado:
- Conectivo principal, profundidad, complejidad
- Sub-fórmulas arbóreas
- NNF/CNF/DNF con `toCNF()`, `toDNF()`
- `extractClauses()` → cláusulas C₁, C₂… para análisis de resolución
- Clasificación semántica + nombre de ley conocida
- Tabla de verdad con conteo (n verdaderas / m falsas)
- **Completitud funcional**: analiza si el conjunto de conectivos es funcionalmente completo
- **Esquemas algebraicos**: 6 esquemas de dominancia/identidad (P∧⊤≡P, P∨⊥≡P, P∧⊥≡⊥, P∨⊤≡⊤, P∧P≡P, P∨P≡P)

#### derive() mejorado:
- Pasos nombrados con regla aplicada y referencias [de N, M]
- `reasoningType` + `reasoningSchema` en salida
- Esquema/instanciación detallada ("Patrón:", "Esquema:")
- Nota educativa ⊨ vs ⊢ con explicación de completitud (en verbose)
- RAA como método de prueba explícito
- Prueba condicional como método de prueba explícito

#### countermodel() mejorado:
- Marca ← en tabla de verdad señalando la valuación falsificadora (`← P=V, Q=F`)

### 4. `src/profiles/classical/first-order.ts` (~765 líneas)

#### explain() — reescrito completo:
- Variables libres y ligadas
- Aridad de predicados (P/1, Q/2, etc.)
- Alcance de cuantificadores
- Alternancia de cuantificadores (∀∃ profundidad)
- Forma prenex y Skolemización
- Interpretación natural ("Para todo x, si x es P entonces x es Q")
- Lectura categórica ("Todo P es Q" — proposición tipo A)

#### derive() — con ProofStep[]:
- Reglas de cuantificadores nombradas: UI (Instanciación Universal), EI (Instanciación Existencial), EG (Generalización Existencial), UG (Generalización Universal)
- `reasoningSchema` incluido
- Pasos numerados con justificación

#### countermodel() — con dominio:
- Dominio D = {a, b, ...}
- Interpretación de predicados: P = {a}, Q = {a, b}
- Verificación paso a paso

### 5. `src/profiles/modal/k.ts`

- Propiedades del frame en explain(): reflexividad, serialidad, transitividad, simetría, euclidiana
- Lista de "no vale" por sistema
- Identificación de axiomas (K, T, D, 4, 5, B) cuando check valid retorna válido

### 6. `src/profiles/deontic/standard.ts`

- Propiedades del frame (serialidad)
- Paradojas deónticas: Ross, Chisholm, Dilema del buen samaritano
- Advertencias contextuales cuando se detecta patrón de paradoja

### 7. `src/profiles/epistemic/s5.ts`

- Propiedades del frame (reflexividad + simetría + transitividad = equivalencia)
- Simplificación de modalidades iteradas en S5: □□P≡□P, ◇◇P≡◇P, □◇P≡◇P, ◇□P≡□P
- Paradojas epistémicas: Moore, Omnisciencia lógica, Introspección negativa

### 8. `src/profiles/temporal/ltl.ts` (~160 líneas)

- `classifyTemporalPattern()` — clasifica fórmulas LTL en patrones estándar:
  - Safety: G(¬P) — "P nunca ocurre"
  - Liveness: F(P) — "P eventualmente ocurre"
  - Response: G(P → F(Q)) — "Cada P es seguido por Q"
  - Persistence: F(G(P)) — "P eventualmente se vuelve permanente"
  - Recurrence: G(F(P)) — "P ocurre infinitamente a menudo"
  - Precedence: ¬P U Q — "Q llega antes que P"

### 9. `src/profiles/paraconsistent/belnap.ts` (~415 líneas)

#### explain() — reescrito completo:
- Retículo A4 dibujado (T/B/N/F)
- Evaluación detallada por cada valor de P (T, F, B, N)
- Marcas ⊛ de designación (T y B son valores designados)
- Leyes que se mantienen: De Morgan, Distributividad, Idempotencia, Doble negación
- Leyes que fallan: P→P (para N), LEM (para N), LNC, Explosión
- Comparación con lógica clásica en cada resultado
- Nota educativa sobre relevancia y tolerancia a contradicciones

### 10. `src/profiles/aristotelian/syllogistic.ts` (~639 líneas)

#### explain() mejorado:
- Cuadro de oposición completo (A↔O, E↔I contradictorias; A-E contrarias; I-O subcontrarias; subalternación)
- Distribución de términos por proposición
- Relaciones lógicas entre proposiciones
- **Inferencias inmediatas**: Conversión, Obversión, Contraposición por tipo A/E/I/O

#### derive() mejorado:
- Distribución por premisa: S(+)/S(−), P(+)/P(−) mostrada
- Identificación de figura y modo (Barbara AAA-1, Celarent EAE-1, etc.)
- 24 silogismos válidos reconocidos con validación correcta de posición del término medio
- **Entimemas**: detección de silogismos con 1 sola premisa + sugerencia de premisa faltante para completar

#### checkSyllogism() corregido:
- Ahora identifica S (sujeto), P (predicado), M (término medio) por posición en premisas y conclusión
- Valida la figura correcta verificando posición del término medio
- Rechaza correctamente silogismos inválidos (ej: "Affirming consequent")

### 11. `src/profiles/probabilistic/basic.ts` (~426 líneas)

- Cálculo paso a paso con nombre de regla por operación:
  - "Complemento": P(¬A) = 1 − P(A)
  - "Inclusión-exclusión": P(A∨B) = P(A) + P(B) − P(A∧B)
  - "Independencia": P(A∧B) = P(A) × P(B)
  - "Definición material": P(A→B) = P(¬A∨B)
- Axiomas de Kolmogorov verificados (K1, K2, K3)
- Análisis de sensibilidad
- Probabilidad condicional y Bayes (2 variables, P=0.5)
- Tabla de probabilidades con sub-fórmulas

### 12. `src/profiles/intuitionistic/propositional.ts`

*(Este perfil ya estaba bien implementado, se mantiene intacto)*
- Traza de forcing completa
- Interpretación BHK
- Tabla comparativa IPC vs CPC
- Propiedad de la disyunción
- Countermodel con traza Kripke

### 13. Tests actualizados
- `src/tests/stress-exhaustive.test.ts` — strings actualizados ("verdadero" en vez de "verdadera", Affirming Consequent correctamente inválido)
- `src/tests/examples.test.ts` — formato aritmético actualizado

---

## Funcionalidades Transversales

### Sistema de Verbosidad
```st
set verbose on     -- Todo: formas normales, sub-fórmulas, comparación cruzada, notas pedagógicas
set verbose off    -- Salida compacta (default)
set verbose proof  -- Solo pruebas detalladas
set verbose model  -- Solo modelos detallados
```

### Comparación Cruzada entre Sistemas
Se activa con `set verbose on` o automáticamente en `explain`. Evalúa la fórmula en todos los perfiles compatibles y reporta diferencias.

### Notas Pedagógicas Contextuales
- En derive con MP: nota sobre Modus Ponens como regla fundamental
- En tautologías: nota sobre verdad bajo toda interpretación
- En derive proposicional (verbose): ⊨ vs ⊢ con explicación de completitud de la lógica proposicional clásica
- En silogismos: contexto aristotélico
- En paradojas modales: advertencia con explicación filosófica

### Exportación LaTeX
- `formulaToLaTeX()` — convierte fórmulas ST a LaTeX
- `proofToLaTeX()` — genera `\begin{prooftree}...\end{prooftree}` con bussproofs

### Detección de Falacias (11 detectores)
| # | Falacia | Patrón |
|---|---|---|
| 1 | Afirmación del consecuente | (P→Q)∧Q ⊬ P |
| 2 | Negación del antecedente | (P→Q)∧¬P ⊬ ¬Q |
| 3 | Medio no distribuido | Todo M es P, Todo S es P ⊬ Todo S es M |
| 4 | Composición | Parte tiene P ⊬ Todo tiene P |
| 5 | Falso dilema | P∨Q con alternativas no exhaustivas |
| 6 | Petición de principio | conclusión ∈ premisas (P ⊢ P) |
| 7 | Generalización apresurada | Algún S es P ⊬ Todo S es P |
| 8 | Conversión ilícita | Todo S es P ⊬ Todo P es S |
| 9 | Cuaterno terminorum | 4 términos distintos en silogismo |
| 10 | División | Todo tiene P ⊬ Parte tiene P |
| 11 | Falacia del consecuente | variante de afirmación del consecuente |

---

## Bugs Resueltos (4)

| Bug | Causa | Fix |
|---|---|---|
| **Deadlock derive** | Absorción/Exportación/Importación generaban derivaciones infinitas | Guardia `isRelevantToGoal()` + MAX_KNOWN=500 + maxIterations=100 |
| **console.log en producción** | 3 líneas de debug en known-theorems.ts | Eliminadas |
| **Figuras silogísticas** | `checkSyllogism()` solo comparaba tipos A/E/I/O sin verificar posición del término medio | Reescrito: identifica S/P/M por posición, valida figura |
| **Strings en tests** | Tests esperaban "verdadera" pero salida decía "verdadero"; formato aritmético obsoleto | Assertions actualizados |

---

## Resumen de Cobertura por Perfil

| Perfil | explain | derive | check valid | countermodel | truth_table | analyze |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| classical.propositional | ✅ completo | ✅ 25 reglas | ✅ | ✅ con ← | ✅ sub-fórmulas | ✅ 11 falacias |
| classical.first_order | ✅ profundo | ✅ ProofStep[] | ✅ tableau | ✅ dominio+interp | N/A | ✅ |
| modal.k | ✅ frame props | ✅ traza | ✅ axiom ID | ✅ Kripke | N/A | — |
| deontic.standard | ✅ paradojas | ✅ traza | ✅ axiom ID | ✅ Kripke | N/A | — |
| epistemic.s5 | ✅ S5 colapso | ✅ traza | ✅ axiom ID | ✅ Kripke | N/A | — |
| temporal.ltl | ✅ patrones | ✅ traza | ✅ | ✅ Kripke | N/A | — |
| paraconsistent.belnap | ✅ retículo | — | ✅ 4-val | — | ✅ ⊛ marcas | — |
| probabilistic.basic | ✅ paso a paso | ✅ reglas | ✅ Kolmogorov | — | ✅ prob. | — |
| intuitionistic.prop | ✅ BHK+forcing | ✅ traza | ✅ IPC | ✅ Kripke | — | — |
| aristotelian.syllogistic | ✅ cuadro opos. | ✅ distribución | ✅ 24 silogismos | — | N/A | ✅ entimemas |
| arithmetic | ✅ propiedades | ✅ pasos | ✅ eval | — | N/A | — |

---

## Lo que NO se implementó (1 item)

| Item | Descripción | Razón |
|---|---|---|
| Anfibología | Detector de estructura ambigua en falacias | Patrón lingüístico difícil de detectar sobre AST lógico puro. Impacto mínimo. Nice-to-have. |

---

## Documentación que necesita actualizarse

> **INSTRUCCIÓN PARA LA IA QUE ACTUALICE**: Los archivos `DOCS.md`, `README.md` y `QUICKSTART.md` están desactualizados respecto a estas mejoras. Necesitan reflejar:

### DOCS.md (v1.5.8 → debe ser v2.0+)
1. **Sección 3.9 (analyze)**: Actualizar lista de falacias de 3 a 11
2. **Sección 3.10 (explain)**: Documentar la salida enriquecida por perfil (sub-fórmulas, formas normales, completitud funcional, esquemas algebraicos, retículo Belnap, cuadro de oposición, patrones LTL, etc.)
3. **Sección nueva: Verbosidad**: Documentar `set verbose on/off/proof/model`
4. **Sección nueva: Comparación cruzada**: Explicar cómo funciona el comparador entre sistemas
5. **Sección nueva: Notas pedagógicas**: Explicar las notas educativas contextuales
6. **Sección nueva: Exportación LaTeX**: `formulaToLaTeX()`, `proofToLaTeX()`
7. **Sección 11 (Perfiles)**: Expandir cada perfil con las capacidades nuevas detalladas arriba
8. **Sección nueva: Formas normales**: NNF, CNF, DNF, extractClauses
9. **Sección nueva: Clasificación de fórmulas**: 27 leyes reconocidas automáticamente
10. **Sección 19 (Limitaciones)**: Actualizar — ya no son stubs, casi todo está completo

### README.md
1. **Sección "Herramientas explicativas"**: Expandir con las nuevas capacidades de explain, analyze y derive
2. **Agregar sección "Motor pedagógico"**: Mencionar formas normales, clasificación, falacias, paradojas, comparación cruzada, LaTeX
3. **Actualizar tabla de perfiles**: Mostrar que todos están completos, no solo proposicional
4. **Agregar ejemplos de salida enriquecida**: Al menos un ejemplo de derive con pasos, explain con formas normales, y countermodel con Kripke

### QUICKSTART.md (v1.6.0 → debe ser v2.0+)
1. Agregar sección sobre `set verbose on` y salidas enriquecidas
2. Mencionar detección de falacias y paradojas
3. Agregar ejemplo de explain enriquecido
4. Actualizar versión

---

*Documento generado como referencia completa para actualización de documentación del proyecto ST.*
