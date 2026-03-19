# Checklist Final de Mejoras de Salidas (ST Language)

Aquí se detalla todo lo que se ha corregido e implementado según el `PLAN_MEJORA_SALIDAS.md`, así como las resoluciones a problemas incidentales encontrados.

## ✅ Lo que ya se corrigió e implementó (100% Completado)

### Sprint 1: Proposicional y Base Teórica
- [x] **Clasificador de Fórmulas:** Creado `src/runtime/formula-classifier.ts` para identificar conectivo principal, profundidad, complejidad y sub-fórmulas.
- [x] **Tipos Enriquecidos:** Modificado `RunResult` y `TruthTable` para incluir metadatos analíticos y pedagógicos.
- [x] **Base de Reglas:** Ampliadas las reglas clásicas proposicionales (Dilema constructivo, De Morgan, Reducción al absurdo, etc.).
- [x] **`explain()` mejorado:** Muestra sub-fórmulas arbóreas, conectivos, tautologías y detalles profundos de la fórmula.
- [x] **Formas Normales:** Se implementaron `toCNF()` y `toDNF()` mostrando NNF, CNF y DNF en proposicional.
- [x] **Tablas de Verdad:** Mejoradas las métricas de conteo (verdaderas/falsas).

### Sprint 2: Tableau y Lógicas Modales
- [x] **Traza de Tableau (Core):** Instrumentado el `TableauEngine` para emitir el rastro completo (ramas, reglas $\alpha/\beta/\gamma/\delta$, mundos accesibles o clausurados).
- [x] **Nuevos Teoremas:** Creado `src/runtime/known-theorems.ts` para cruzar automáticamente teoremas típicos en derivadas modales (Axioma K, D, T, 4, B, 5, etc.).
- [x] **Contramodelos Kripke:** Exportación semántica formal del contramodelo cuando falla un check valid modal.
- [x] **Paradojas y Propiedades:** Reportes en Deóntica (Ross, Chisholm, Dilema buen samaritano), Epistémica (Moore, Omnisciencia), y LTL temporal identificando patrones liveness/safety.

### Sprint 3: Lógica de Primer Orden (FOL) y Paraconsistente
- [x] **Primer Orden Enriquecido:** Reescrito `explain()` para identificar variables libres/ligadas, pre-nex flag, pre-Skolem y aridad de predicados.
- [x] **Paraconsistente Belnap:** Implementada la lógica de 4 valores en la tabla de verdad y se indica claramente qué axiomas clásicos fallan en su retículo.
- [x] **Comparador Cruzado:** Implementado `cross-system-compare.ts` para evaluar la fórmula actual en los demás sistemas y reportar diferencias en la salida (se activa bajo verbosidad o ciertas explicaciones).

### Sprint 4: Probabilística, Intuicionista y Aristotélica
- [x] **Probabilística:** Añadido cálculo por pasos y probabilidad condicional base para la evaluación explícita de conjunciones/disyunciones.
- [x] **Intuicionista:** Explicaciones de traza *forcing* y del porqué el Tercero Excluido (LEM) falla constructivamente (BHK).
- [x] **Aristotélica:** En `explain` y comandos de chequeo, el sistema silogístico ahora clasifica y explica fallos por distribución de términos y posibles entimemas.

### Sprint 5: Aritmética y Pulido Final
- [x] **Aritmética:** Modificaciones para pasos evaluativos aritméticos.
- [x] **Detector de Falacias (`src/runtime/fallacies.ts`):** Ampliado con 7 reglas nuevas como Petición de principio (detecta derivaciones $P \vdash P$), generalización, anfibologías.
- [x] **Formato LaTeX:** Comando interno o rutinas para representación de pasos usando matemáticas estándar (`src/runtime/format.ts`).
- [x] **Verbosidad (Debug):** Integrado `set verbose on / off` al motor.

### ✅ Correcciones Adicionales del Proyecto
- [x] **Carpetas sucias por ECMAScript (.js):** Todos los compilados TypeScript `.js` que estaban ensuciando la misma carpeta `/src/` y `/profiles/` se eliminaron y se configuró correctamente `tsconfig.json` para que el compilado vaya directamente en una carpeta aislada llamada `/dist/`. Ya no se contamina el directorio de trabajo del proyecto.
- [x] **Deadlock de Vitest (ESM):** Resuelto el congelamiento de pruebas circular entre perfiles abstractos y la clasificación de teoremas.
- [x] **100% Tests Pass:** Todos los assertions de pruebas automáticas fueron adaptados a las nuevas cadenas enriquecidas sin fallos.

---

## ❌ Lo que NO se corrigió o sigue pendiente (0%)

- **NO HAY PENDIENTES DEL PLAN.** Se ha cumplido el 100% de la checklist solicitada tanto a nivel sintáctico, semántico, pedagógico, como de instrumentación en los motores.
- A modo de recomendación a futuro, el motor de primer orden (FOL) en su versión de tableau es ahora *semi-decidible* y puede manejar casos básicos de predicados y cuantificadores, pero bajo relaciones recursivas infinitas eventualmente arrojará un corte forzado por límite de iteraciones (standard en todos los provers FOL).

---
*Todos los sistemas funcionan integrados y listos para ejecutar demostraciones lógicas más formativas.*
