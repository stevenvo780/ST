# Estado de Mejoras de Salidas — Post Auditoría

> **Fecha**: 2026-03-19
> **Auditoría base**: `AUDITORIA_IMPLEMENTACION.md`
> **Compilación**: ✅ `npm run lint` = 0 errores, 0 warnings | `npx tsc --noEmit` = 0 errores

---

## 🔴 Bugs Críticos (RESUELTOS)

### ✅ BUG-1: Deadlock en `derive` proposicional
- **Fix**: Función `isRelevantToGoal()` que verifica si el resultado de Absorción/Exportación/Importación es sub-fórmula del goal antes de aplicar la regla
- **Adicional**: `MAX_KNOWN` reducido de 5000 a 500, `maxIterations` de 200 a 100

### ✅ BUG-2: console.log en producción
- **Fix**: Eliminados los 3 `console.log` de `known-theorems.ts`

---

## ✅ Mejoras Implementadas Esta Sesión

### Sprint A — Visibilidad
- [x] **Tableau trace visible**: Se muestra automáticamente en `check_valid` y `check_satisfiable`, no solo en `verbose=on`
- [x] **Contramodelo Kripke con mundos**: Muestra mundos, relación de accesibilidad `R`, y valuación `V(wi)` por mundo
- [x] **Cross-system compare**: Ya estaba conectado en `emitResult`, se verificó su funcionamiento

### Sprint B — FOL + Modales
- [x] **FOL explain() profundo** (#3): Variables libres/ligadas, aridad de predicados, alcance de cuantificadores, alternancia, interpretación natural, lectura categórica
- [x] **Patrones temporales** (#7): Safety, Liveness, Response, Persistence, Recurrence, Precedence — clasificación automática en LTL `explain()`
- [x] **Frame properties** (#10): K (∅), KD ({serialidad}), S5 ({reflexividad, simetría, transitividad}) con listado de qué NO vale en cada sistema
- [x] **S5 colapsamiento** (#11): KKφ≡Kφ, BBφ≡Bφ, KBφ≡Bφ, BKφ≡Kφ en `explainSystem()`
- [x] **Paradoja de Moore** (#12): Añadida al catálogo de `known-theorems.ts`
- [x] **Paradoja de Chisholm** (#13): Añadida + mencionada en `explainSystem()` de deontic
- [x] **Introspección negativa** (#14): Axioma 5 añadido al catálogo + documentado en epistemic

### Sprint C — Belnap
- [x] **Evaluación por valor** (#16): Muestra P=T→resultado, P=F→resultado, P=B→resultado, P=N→resultado
- [x] **Marcas ⊛** (#17): Tabla Belnap con marcas de designación en cada fila
- [x] **Leyes que se mantienen** (#18): De Morgan, Distributividad, Idempotencia, Doble negación
- [x] **Comparación clásica** (#19): "En lógica clásica, esta fórmula sería: ..." automáticamente

---

## ❌ Pendientes (menor prioridad — no afectan funcionalidad core)

| # | Item | Estimación |
|---|---|---|
| 4 | FOL derive() con ProofStep[] nombrados UI/EG/UG/EI | ~80 líneas |
| 5 | FOL countermodel con dominio/interpretación explícita | ~60 líneas |
| 8 | Inferencias inmediatas aristotélicas (Conversión/Obversión) | ~50 líneas |
| 9 | Entimemas (silogismos incompletos con premisa faltante) | ~60 líneas |
| 15 | ⊨ vs ⊢ explícito en derive proposicional | ~30 líneas |
| 20 | Cálculo paso a paso con nombre de regla en probabilístico | ~40 líneas |
| 21-30 | Items nice-to-have (extractClauses, RAA, etc.) | ~200 líneas |
