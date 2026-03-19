# Auditoría de Implementación — PLAN_MEJORA_SALIDAS.md v2

> **Fecha**: 2026-03-19 (rev. 2)
> **Método**: Revisión línea a línea del código fuente + ejecución real de todos los examples + vitest run
> **Compilación**: ✅ `npx tsc` sin errores
> **Examples**: ✅ 15/15 pasan (0 timeouts)
> **Tests**: 641/648 pasan (9/11 archivos OK) — 7 fallos en 2 archivos

---

## 🔴 BUGS ACTIVOS

### BUG-A: Validación de figuras en silogística aristotélica
- **Archivo**: `src/profiles/aristotelian/syllogistic.ts` → `checkSyllogism()`
- **Causa**: Solo compara los **tipos** de premisas (A/E/I/O) sin verificar la **figura** (posición del término medio). Cualquier silogismo AAA se detecta como Barbara, aunque el término medio no esté distribuido correctamente.
- **Ejemplo**: `(∀x(M→P)) ∧ (∀x(S→P)) → (∀x(S→M))` ("Affirming consequent") se detecta erróneamente como Barbara.
- **Impacto**: 1 test falla en `stress-exhaustive.test.ts`.
- **Fix**: `checkSyllogism()` debe identificar S, P, M por posición en premisas y conclusión, y luego verificar que correspondan a la figura correcta.

### BUG-B: Discordancia de strings en tests aritméticos
- **Archivo**: `src/tests/stress-exhaustive.test.ts` + `src/tests/examples.test.ts`
- **Causa**: Los tests esperan `"verdadera"` pero la salida actual dice `"verdadero"`. También `examples.test.ts` busca `"Expresión aritmética: resultado = 14"` que ya no es el formato de salida.
- **Impacto**: 5 tests aritméticos + 1 test de regression de examples fallan (6 tests total).
- **Fix**: Actualizar los strings esperados en los tests para coincidir con la salida actual.

### BUGS PREVIOS RESUELTOS ✅
- ~~BUG-1 (Deadlock derive)~~: Arreglado con guardia `isRelevantToGoal()` en Absorción/Exportación/Importación.
- ~~BUG-2 (console.log en producción)~~: Eliminados los `console.log` de `known-theorems.ts`.

---

## ✅ IMPLEMENTADO CORRECTAMENTE

### Archivos nuevos creados (5/5 del plan)
| Archivo | Líneas | Estado | Notas |
|---|---|---|---|
| `src/runtime/formula-classifier.ts` | 197 | ✅ | 27 esquemas, unificador, classifyFormula() |
| `src/runtime/known-theorems.ts` | 161 | ✅ | K/T/D/4/5/B + Ross/Samaritano/Omnisciencia + Moore/Chisholm/Introspección |
| `src/runtime/cross-system-compare.ts` | 54 | ✅ | Invocado desde interpreter.ts línea 1461 |
| `src/runtime/format.ts` | 280 | ✅ | formulaToUnicode(), formulaToLaTeX(), proofToLaTeX() |
| `src/runtime/fallacies.ts` | 398 | ✅ | 10 detectores (5 originales + 5 nuevos) |

### Tipos enriquecidos (`src/types/index.ts`)
| Campo RunResult | Implementado | Se usa en interpreter |
|---|---|---|
| `reasoningType` | ✅ | ✅ |
| `reasoningSchema` | ✅ | ✅ |
| `formulaClassification` | ✅ | ✅ |
| `normalForms` (nnf/cnf/dnf/pnf/skolem) | ✅ | ✅ verbose |
| `formulaAnalysis` | ✅ | ✅ verbose |
| `crossSystemComparison` | ✅ | ✅ verbose + explain |
| `tableauTrace` | ✅ | ✅ verbose + proof |
| `educationalNote` | ✅ | ✅ verbose |
| `paradoxWarning` | ✅ | ✅ siempre |
| `TruthTableResult.subFormulas` | ✅ | ✅ verbose |
| `TruthTableResult.satisfyingCount/totalCount` | ✅ | ✅ |

### Proposicional — Reglas de derivación (9/11)
| Regla | Estado |
|---|---|
| Dilema Constructivo | ✅ |
| Dilema Destructivo | ✅ |
| Absorción (con guardia) | ✅ |
| Exportación (con guardia) | ✅ |
| Importación (con guardia) | ✅ |
| Resolución | ✅ |
| De Morgan (AND) | ✅ |
| De Morgan (OR) | ✅ |
| Dilema Simple | ✅ |
| Reducción al absurdo (RAA) | ❌ |
| Prueba condicional | ❌ |

### Proposicional — Formas normales
| Función | Estado |
|---|---|
| `toNNF()` | ✅ |
| `toCNF()` | ✅ |
| `toDNF()` | ✅ |
| `extractClauses()` | ❌ |

### Proposicional — explain() mejorado
- Conectivo principal, profundidad, complejidad: ✅
- Sub-fórmulas, NNF/CNF/DNF: ✅
- Clasificación semántica + nombre conocido: ✅
- Tabla de verdad con conteo: ✅

### FOL — Motor v2 completo (759 líneas)
| Función | Estado |
|---|---|
| `toPrenex()` | ✅ |
| `skolemize()` | ✅ |
| Tableau recursivo con trace (α/β/γ/δ labels) | ✅ |
| `derive()` con ProofStep[] + reasoningSchema | ✅ |
| `countermodel()` con dominio + interpretación + aridad | ✅ |
| `explain()` con variables lib/lig, aridad, alcance, alternancia, interpretación natural, lectura categórica | ✅ |
| `checkEquivalent()` | ✅ |

### Modales — BaseTableauProfile + Perfiles
| Funcionalidad | Estado |
|---|---|
| `extractKripkeModel()` | ✅ |
| `enrichResult()` con identifyTheorem | ✅ |
| Tableau trace visible en interpreter | ✅ |
| Contramodelo Kripke visible en interpreter | ✅ |
| Propiedades del frame en explain (reflexividad, serialidad, etc.) | ✅ |
| Simplificación modalidades iteradas S5 | ✅ |
| Paradojas: Ross, Samaritano, Omnisciencia | ✅ |
| Paradoja de Moore (epistémica) | ✅ |
| Paradoja de Chisholm (deóntica) | ✅ |
| Introspección negativa | ✅ |
| Patrones temporales LTL (Safety/Liveness/Response/Persistence/Recurrence/Precedence) | ✅ |

### Intuicionista — MEJOR PERFIL
| Funcionalidad | Estado |
|---|---|
| `traceForcing()` completo | ✅ |
| BHK en explain() | ✅ |
| Tabla IPC vs CPC | ✅ |
| Propiedad de la disyunción | ✅ |
| Countermodel con traza | ✅ |

### Aristotélica
| Funcionalidad | Estado |
|---|---|
| Cuadro de oposición en explain() | ✅ |
| Distribución de términos | ✅ |
| Relaciones (contrariedad, etc.) | ✅ |
| 24 silogismos válidos | ✅ (con BUG-A en validación de figuras) |

### Belnap — COMPLETO
| Funcionalidad | Estado |
|---|---|
| Retículo A4 en explain() | ✅ |
| Evaluación detallada por valor | ✅ |
| Marcas ⊛ de designación | ✅ |
| Leyes que fallan (4) | ✅ |
| Leyes que se mantienen (De Morgan, Distributividad, Idempotencia, Doble negación) | ✅ |
| Comparación con lógica clásica | ✅ |
| Nota educativa | ✅ |
| Semántica 4-valorada correcta | ✅ |

### Probabilística
| Funcionalidad | Estado |
|---|---|
| Axiomas de Kolmogorov | ✅ |
| Análisis de sensibilidad | ✅ |
| Bayes (2 variables, P=0.5) | ✅ |
| Reglas nombradas (¬A, A∧B, A∨B, A→B) | ✅ |
| truthTable con sub-fórmulas | ✅ |

### Aritmética
| Funcionalidad | Estado |
|---|---|
| Evaluación paso a paso | ✅ |
| Propiedades matemáticas | ✅ |
| Simplificación básica | ✅ |

### Transversales
| Funcionalidad | Estado |
|---|---|
| `set verbose on/off/proof/model` | ✅ |
| `formulaToLaTeX()` | ✅ |
| `proofToLaTeX()` | ✅ |
| cross-system-compare integrado | ✅ |
| Tableau trace en emitResult | ✅ |
| Kripke model en emitResult | ✅ |

---

## ❌ NO IMPLEMENTADO (12 items restantes)

### 🔴 Prioridad Alta

| # | Item | Fase del plan | Dificultad |
|---|---|---|---|
| 8 | **Inferencias inmediatas aristotélicas** — Conversión, Obversión, Contraposición | F7 §7.3 | Media |
| 9 | **Entimemas aristotélicos** — Detección de silogismos incompletos | F7 §7.4 | Media |

### 🟡 Prioridad Media

| # | Item | Fase del plan | Dificultad |
|---|---|---|---|
| 15 | Consecuencia ⊨ vs ⊢ explícita en derive proposicional | F1 §1.5 | Media |
| 21 | Distribución por premisa en derive aristotélico | F7 §7.2 | Baja |
| 22 | Esquema/instanciación detallada en derive proposicional (solo FOL lo tiene) | F1 §1.1 | Media |
| 29 | RAA (Reducción al absurdo) como regla explícita en derive | F1 §1.1 | Media |
| 30 | Prueba condicional como regla explícita en derive | F1 §1.1 | Media |

### 🟢 Prioridad Baja (nice-to-have)

| # | Item | Fase del plan | Dificultad |
|---|---|---|---|
| 24 | Completitud funcional en análisis de fórmula | F1 §1.4 | Baja |
| 25 | Contramodelo marcado con ← en tabla de verdad | F1 §1.6 | Baja |
| 26 | Esquemas de dominancia/identidad (P∧⊤↔P, P∨⊥↔P, etc.) | F1 §1.2 | Baja |
| 27 | Falacia de anfibología | F1 §1.7 | Baja |
| 28 | `extractClauses()` para análisis de resolución | F1 §1.3 | Baja |

---

## ⚠️ PARCIALMENTE IMPLEMENTADO

| # | Item | Lo que hay | Lo que falta |
|---|---|---|---|
| P1 | Bayes en probabilístico | Funciona con 2 variables, hardcoded P=0.5 | Generalizar a N variables con probabilidades reales |
| P2 | Notas pedagógicas | En Belnap, modales (paradojas), intuicionista | Faltan en derive proposicional (MP, MT, etc.), check valid (por qué es tautología) |

---

## Resumen cuantitativo

| Categoría | Items | % del plan | Δ vs rev.1 |
|---|---|---|---|
| ✅ Implementado correctamente | ~63 funcionalidades | **~82%** | +22% |
| ⚠️ Parcialmente implementado | 2 items | **~3%** | -2% |
| ❌ No implementado | 12 items | **~15%** | -20% |
| 🔴 Bugs activos | 2 (menores) | — | -2 críticos, +2 menores |

### Tests: 641/648 (98.9%)
| Archivo | Estado | Fallos |
|---|---|---|
| parser.test.ts | ✅ 23/23 | — |
| core.test.ts | ✅ 31/31 | — |
| profiles.test.ts | ✅ 27/27 | — |
| engines.test.ts | ✅ 8/8 | — |
| v1-features.test.ts | ✅ 106/106 | — |
| philosophy.test.ts | ✅ 46/46 | — |
| arithmetic.test.ts | ✅ 63/63 | — |
| cli.test.ts | ✅ 14/14 | — |
| exhaustive-matrix.test.ts | ✅ 12/12 | — |
| examples.test.ts | ⚠️ | 1 fallo (string obsoleto en regression `arithmetic-programming.st`) |
| stress-exhaustive.test.ts | ⚠️ | 6 fallos (5× "verdadera"→"verdadero" + 1× Affirming Consequent) |

### Estimación de trabajo restante
- **Líneas nuevas/modificadas**: ~300–400
- **Archivos a tocar**: 3-5
- **Esfuerzo**: ~1 sprint adicional

---

## Prioridad de ejecución recomendada

### Sprint Único — Completar + Fix tests
1. **Fix BUG-A**: Validación de figuras en syllogistic.ts (verificar posición del término medio)
2. **Fix BUG-B**: Actualizar strings en tests (6 assertions)
3. **#8-9**: Inferencias inmediatas + entimemas (aristotélica)
4. **#29-30**: RAA + Prueba condicional (proposicional derive)
5. **#15**: ⊨ vs ⊢ en derive
6. **#22**: Esquema/instanciación en derive proposicional
7. **#24-28**: Nice-to-have si queda tiempo

---

## Cambios entre rev.1 → rev.2 (lo que se arregló)

| Item | rev.1 | rev.2 |
|---|---|---|
| BUG-1 Deadlock derive | 🔴 CRÍTICO | ✅ Arreglado (isRelevantToGoal) |
| BUG-2 console.log | 🔴 CRÍTICO | ✅ Arreglado (eliminados) |
| #1 Tableau trace mostrado | ❌ | ✅ interpreter.ts:1545 |
| #2 Kripke model mostrado | ❌ | ✅ interpreter.ts:1510 |
| #3 FOL explain profundo | ❌ | ✅ vars/aridad/alcance/lectura categórica |
| #4 FOL derive ProofStep[] | ❌ | ✅ con UI/EI + reasoningSchema |
| #5 FOL countermodel dominio | ❌ | ✅ dominio + interpretación |
| #6 cross-system-compare | ❌ Dead code | ✅ Conectado en interpreter |
| #7 Patrones temporales | ❌ | ✅ classifyTemporalPattern() en ltl.ts |
| #10 Frame properties | ❌ | ✅ en modal explain |
| #11 S5 simplificación | ❌ | ✅ colapsamiento mostrado |
| #12 Moore | ❌ | ✅ en known-theorems.ts |
| #13 Chisholm | ❌ | ✅ en known-theorems.ts |
| #14 Introspección negativa | ❌ | ✅ en known-theorems.ts |
| #16 Belnap per-value | ❌ | ✅ en explain() |
| #17 Belnap ⊛ | ❌ | ✅ en explain() |
| #18 Belnap leyes que se mantienen | ❌ | ✅ De Morgan, Dist., Idemp., ¬¬ |
| #19 Belnap comparación clásica | ❌ | ✅ en explain() |
| #20 Prob. reglas nombradas | ❌ | ✅ sección "Reglas" |
| #23 FOL análisis variables | ❌ | ✅ en explain() |
| P3 known-theorems paradojas | ⚠️ 3 paradojas | ✅ 6 paradojas (+ Moore, Chisholm, Intro.Neg.) |
| P4 Belnap explain | ⚠️ parcial | ✅ completo |

---
*Generado por auditoría automatizada contra PLAN_MEJORA_SALIDAS.md v2 — Revisión 2*
