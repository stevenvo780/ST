# Auditoría de Implementación — PLAN_MEJORA_SALIDAS.md v2

> **Fecha**: 2026-03-19
> **Método**: Revisión línea a línea del código fuente + ejecución real de todos los examples
> **Compilación**: ✅ `npx tsc` sin errores
> **Tests**: 9/11 archivos pasan (2 timeout por bug de derive)

---

## 🔴 BUGS CRÍTICOS (requieren fix inmediato)

### BUG-1: Deadlock en `derive` proposicional
- **Archivo**: `src/profiles/classical/propositional.ts` (línea 508)
- **Causa**: Las reglas Absorción, Exportación e Importación generan fórmulas exponencialmente sin verificar primero si son útiles para la meta. Con premisas `P→Q` y `Q`, Absorción genera `P→(P∧Q)`, luego Exportación genera `P→(P∧(P∧Q))`, etc. en cascada infinita.
- **Impacto**: `contramodel.st` y `stress-all-profiles.st` entran en timeout (>10s). Los tests `examples.test.ts` y `stress-exhaustive.test.ts` se cuelgan.
- **Fix**: Aplicar estas reglas (Absorción, Exportación, Importación) **solo cuando el resultado sea sub-fórmula del goal** o limitar `MAX_KNOWN` a un valor razonable (~200) y reducir `maxIterations`.

### BUG-2: `console.log` de debug en producción
- **Archivo**: `src/runtime/known-theorems.ts` (líneas ~100-110)
- **Causa**: `console.log('Loading known theorems...')`, `console.log('Parsing theorem:', ...)`, `console.log('Finished loading known theorems.')` se ejecutan cada vez que se identifica un teorema modal.
- **Impacto**: Contamina stdout en toda ejecución modal. Visible en la salida de `modal-family.st`.
- **Fix**: Eliminar los 3 `console.log`.

---

## ✅ IMPLEMENTADO CORRECTAMENTE

### Archivos nuevos creados (5/5 del plan)
| Archivo | Líneas | Estado | Notas |
|---|---|---|---|
| `src/runtime/formula-classifier.ts` | 192 | ✅ | 27 esquemas, unificador, classifyFormula() |
| `src/runtime/known-theorems.ts` | 133 | ✅ (con BUG-2) | Axiomas K/T/D/4/5/B + paradojas Ross/Samaritano/Omnisciencia |
| `src/runtime/cross-system-compare.ts` | 54 | ✅ pero NO SE USA | compareAcrossSystems() nunca es invocado |
| `src/runtime/format.ts` | 281 | ✅ | formulaToUnicode(), formulaToLaTeX(), proofToLaTeX() |
| `src/runtime/fallacies.ts` | 399 | ✅ | 10 detectores (5 originales + 5 nuevos) |

### Tipos enriquecidos (`src/types/index.ts`)
| Campo RunResult | Implementado | Se usa |
|---|---|---|
| `reasoningType` | ✅ | ✅ en interpreter |
| `reasoningSchema` | ✅ | ✅ en interpreter |
| `formulaClassification` | ✅ | ✅ en interpreter |
| `normalForms` (nnf/cnf/dnf/pnf/skolem) | ✅ | ✅ en verbose |
| `formulaAnalysis` | ✅ | ✅ en verbose |
| `crossSystemComparison` | ✅ | ❌ nunca se popula |
| `tableauTrace` | ✅ | ⚠️ se almacena pero no se muestra |
| `educationalNote` | ✅ | ✅ en verbose |
| `paradoxWarning` | ✅ | ✅ siempre |
| `TruthTableResult.subFormulas` | ✅ | ✅ en verbose |
| `TruthTableResult.satisfyingCount/totalCount` | ✅ | ✅ |

### Proposicional — Reglas de derivación nuevas (8/10)
| Regla | Estado | Línea en propositional.ts |
|---|---|---|
| Dilema Constructivo | ✅ | 644 |
| Dilema Destructivo | ✅ | 663 |
| Absorción | ✅ (causa BUG-1) | 836 |
| Exportación | ✅ (causa BUG-1) | 846 |
| Importación | ✅ (causa BUG-1) | 862 |
| Resolución | ✅ | 716 |
| De Morgan (AND) | ✅ | 878 |
| De Morgan (OR) | ✅ | 896 |
| Dilema Simple | ✅ | 688 |
| Reducción al absurdo (RAA) | ❌ | — |
| Prueba condicional | ❌ | — |

### Proposicional — Formas normales
| Función | Estado |
|---|---|
| `toNNF()` | ✅ (ya existía) |
| `toCNF()` | ✅ (línea 364) |
| `toDNF()` | ✅ (línea 395) |
| `extractClauses()` | ❌ |

### Proposicional — explain() mejorado
- Conectivo principal: ✅
- Profundidad: ✅
- Complejidad: ✅
- Sub-fórmulas: ✅
- NNF/CNF/DNF: ✅
- Clasificación semántica: ✅
- Nombre conocido: ✅
- Tabla de verdad con conteo: ✅

### FOL — Funciones correctas
| Función | Estado |
|---|---|
| `toPrenex()` | ✅ |
| `skolemize()` | ✅ |
| Tableau recursivo con trace | ✅ |
| UI/EI nombrados en trace | ✅ |

### Modales — BaseTableauProfile
| Funcionalidad | Estado |
|---|---|
| `extractKripkeModel()` | ✅ |
| `enrichResult()` con identifyTheorem | ✅ |
| Tableau trace instrumental | ✅ |
| Paradojas Ross/Samaritano | ✅ |
| Paradoja Omnisciencia | ✅ |

### Intuicionista — MEJOR PERFIL IMPLEMENTADO
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
| 24 silogismos válidos | ✅ |

### Probabilística
| Funcionalidad | Estado |
|---|---|
| Axiomas de Kolmogorov | ✅ |
| Análisis de sensibilidad | ✅ |
| Bayes (2 variables) | ✅ |
| truthTable con sub-fórmulas | ✅ |

### Belnap
| Funcionalidad | Estado |
|---|---|
| Retículo A4 en explain() | ✅ |
| Leyes que fallan (3) | ✅ |
| Nota educativa | ✅ |
| Semántica 4-valorada correcta | ✅ |

### Aritmética
| Funcionalidad | Estado |
|---|---|
| Evaluación paso a paso | ✅ |
| Propiedades matemáticas (suma, mult.) | ✅ |
| Simplificación básica | ✅ |

### Transversales
| Funcionalidad | Estado |
|---|---|
| `set verbose on/off/proof/model` | ✅ |
| `formulaToLaTeX()` | ✅ |
| `proofToLaTeX()` | ✅ |

---

## ❌ NO IMPLEMENTADO (27 items)

### 🔴 Prioridad Alta (impacto pedagógico directo)

| # | Item | Fase del plan | Dificultad | Líneas est. |
|---|---|---|---|---|
| 1 | **Tableau trace NO se muestra al usuario** — `tableauTrace` se almacena en RunResult pero el interpreter nunca lo imprime. Es la mejora más visible que falta para modales. | F3 §3.1 | Media | ~40 |
| 2 | **Contramodelo Kripke NO se muestra** para modales — `model` se genera pero interpreter no lo imprime (solo para proposicional). | F3 §3.2 | Media | ~30 |
| 3 | **FOL explain() demasiado básico** — Falta: variables libres/ligadas, aridad predicados, alcance cuantificadores, interpretación natural, lectura categórica | F2 §2.1 | Alta | ~100 |
| 4 | **FOL derive() sin ProofStep[]** — Solo devuelve texto plano, no la prueba paso a paso nombrada (UI/EG/UG/EI) | F2 §2.2 | Alta | ~80 |
| 5 | **FOL countermodel sin dominio/interpretación** — Solo dice "Existe al menos un modelo" pero no lo muestra | F2 §2.3 | Alta | ~60 |
| 6 | **cross-system-compare.ts nunca se invoca** — El módulo existe (54 líneas) pero nadie lo llama ni lo conecta al explain() o emitResult() | F9 T3 | Baja | ~15 |
| 7 | **Patrones temporales (Safety/Liveness/Response)** — No se detectan ni clasifican | F3 §3.8 | Media | ~60 |
| 8 | **Inferencias inmediatas aristotélicas** — Conversión, Obversión, Contraposición no implementadas | F7 §7.3 | Media | ~50 |
| 9 | **Entimemas aristotélicos** — Detección de silogismos incompletos con premisa faltante | F7 §7.4 | Media | ~60 |

### 🟡 Prioridad Media (completitud del plan)

| # | Item | Fase del plan | Dificultad | Líneas est. |
|---|---|---|---|---|
| 10 | Propiedades del frame en check valid modal | F3 §3.4 | Baja | ~20 |
| 11 | Modalidades iteradas / simplificación S5 | F3 §3.5 | Media | ~40 |
| 12 | Paradoja de Moore (epistémica) | F3 §3.7 | Baja | ~15 |
| 13 | Paradoja de Chisholm (deóntica) | F3 §3.6 | Media | ~30 |
| 14 | Introspección negativa (epistémica) | F3 §3.7 | Baja | ~10 |
| 15 | Consecuencia ⊨ vs ⊢ explícita en derive | F1 §1.5 | Media | ~30 |
| 16 | Evaluación detallada por valor en Belnap explain | F4 §4.1 | Baja | ~25 |
| 17 | Marcas ⊛ de designación en tabla Belnap | F4 §4.2 | Baja | ~15 |
| 18 | Leyes que se MANTIENEN en Belnap | F4 §4.4 | Baja | ~10 |
| 19 | Comparación clásica en CADA resultado Belnap | F4 §4.3 | Baja | ~20 |
| 20 | Cálculo paso a paso con nombre de regla en probabilístico | F5 §5.1 | Media | ~40 |
| 21 | Distribución por premisa en derive aristotélico | F7 §7.2 | Baja | ~20 |
| 22 | Esquema/instanciación detallada en derive proposicional | F1 §1.1 | Media | ~30 |
| 23 | Análisis de variables/cuantificadores FOL | F2 §2.4 | Media | ~50 |

### 🟢 Prioridad Baja (nice-to-have)

| # | Item | Fase del plan | Dificultad | Líneas est. |
|---|---|---|---|---|
| 24 | Completitud funcional en análisis de fórmula | F1 §1.4 | Baja | ~15 |
| 25 | Contramodelo marcado con ← en tabla de verdad | F1 §1.6 | Baja | ~10 |
| 26 | Esquemas de dominancia/identidad (P∧⊤↔P, etc.) | F1 §1.2 | Baja | ~10 |
| 27 | Falacia de anfibología | F1 §1.7 | Baja | ~20 |
| 28 | `extractClauses()` para análisis de resolución | F1 §1.3 | Baja | ~20 |
| 29 | RAA (Reducción al absurdo) como regla explícita | F1 §1.1 | Media | ~40 |
| 30 | Prueba condicional como regla explícita | F1 §1.1 | Media | ~40 |

---

## ⚠️ PARCIALMENTE IMPLEMENTADO (requiere ajuste)

| # | Item | Lo que hay | Lo que falta |
|---|---|---|---|
| P1 | Bayes en probabilístico | Funciona solo con 2 variables, hardcoded P=0.5 | Generalizar a N variables con probabilidades reales |
| P2 | Notas pedagógicas | Solo en Belnap y modales (paradojas) | Faltan en derive (MP, MT, etc.), check valid (tautología), contradicción |
| P3 | known-theorems.ts | Axiomas K/T/D/4/5/B + 3 paradojas | Faltan Moore, Chisholm, introspección, patrones LTL |
| P4 | Belnap explain | Retículo + 3 leyes que fallan | Falta evaluación por valor, leyes que se mantienen |

---

## Resumen cuantitativo

| Categoría | Items | % del plan |
|---|---|---|
| ✅ Implementado correctamente | ~45 funcionalidades | **~60%** |
| ⚠️ Parcialmente implementado | 4 items | **~5%** |
| ❌ No implementado | 30 items | **~35%** |
| 🔴 Bugs críticos | 2 bugs | — |

### Estimación de trabajo restante
- **Líneas nuevas/modificadas**: ~1,000–1,200
- **Archivos a tocar**: 8-10
- **Esfuerzo**: ~2-3 sprints adicionales

---

## Prioridad de ejecución recomendada

### Sprint A — Fixes + Visibilidad (mayor impacto)
1. **Fix BUG-1**: Guardia en Absorción/Exportación/Importación (propositional.ts)
2. **Fix BUG-2**: Eliminar console.log (known-theorems.ts)
3. **#1**: Imprimir tableauTrace en interpreter (emitResult)
4. **#2**: Imprimir contramodelo Kripke para modales en interpreter
5. **#6**: Conectar cross-system-compare al explain/emitResult
6. **#22**: Esquema/instanciación en derive proposicional

### Sprint B — FOL + Modales
7. **#3**: FOL explain profundo
8. **#4**: FOL derive con ProofStep
9. **#5**: FOL countermodel con dominio
10. **#7**: Patrones temporales
11. **#10-14**: Propiedades frame, paradojas faltantes, S5

### Sprint C — Aristotélica + Belnap + Polish
12. **#8-9**: Inferencias inmediatas + entimemas
13. **#15-21**: Belnap completo, ⊨ vs ⊢, distribución
14. **#23-30**: Nice-to-have y pulido final

---
*Generado por auditoría automatizada contra PLAN_MEJORA_SALIDAS.md v2*
