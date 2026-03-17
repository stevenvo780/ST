# ST Logic Engine — Limitaciones conocidas (v0.4.0)

## 1. ~~Axioma K en Lógica Modal (modal.k)~~ — ✅ RESUELTO en v0.4.0

### Problema original (v0.2–v0.3)
El motor de Tableau sistemático implementado en la v2 tenía dificultades para cerrar el **Axioma K**: `[](P -> Q) -> ([]P -> []Q)`.

### Solución implementada (v0.4.0)
Se reescribió completamente el motor modal K con tres mejoras clave:

1. **Labeled Tableau v3 con Gamma-Watchers**: Las reglas Gamma (□φ) se registran como "observadores permanentes". Cuando una regla Delta (◇φ) crea un nuevo mundo, **todos los gamma-watchers** del mundo origen se re-instancian automáticamente en el nuevo mundo. Esto elimina la sensibilidad al orden de la pila.

2. **`eliminateConnectives()`**: Pre-procesamiento que convierte `→` a `¬A ∨ B` y `↔` a `(A ∧ B) ∨ (¬A ∧ ¬B)` **antes** de la NNF. Resuelve el bug donde `toNNF()` preservaba nodos `implies` en caso no-negado, causando expansiones Beta incorrectas.

3. **`formulaHash()` personalizado**: Reemplaza el uso de `formulaToString()` (que retornaba `?` para operadores modales) con un hash que maneja correctamente `□`, `◇`, `∀`, `∃` y predicados. Elimina colisiones de hash entre fórmulas estructuralmente distintas.

**Resultado**: Axioma K, Dualidad, Distribución de □ sobre ∧, y todas las pruebas modales pasan correctamente.

## 2. Indecidibilidad en Primer Orden (classical.first_order)

Como es estándar en FOL, el motor puede no terminar o devolver `unknown` si la fórmula no es válida, debido a que el espacio de constantes puede crecer indefinidamente. Se ha establecido un límite de seguridad de 50 pasos de saturación.

## 3. Lógica Paraconsistente Belnap — Semántica de 4 valores

En Belnap, la implicación es **material** (¬A ∨ B). Esto significa que:
- `P → P` NO es tautología (cuando P = N: N→N = N, que no es valor designado).
- `P ∨ ¬P` NO es tautología (cuando P = N: N∨N = N).
- Estas divergencias con la lógica clásica son **by design**, no bugs.

## 4. Límite de variables en tablas de verdad

Las tablas de verdad crecen exponencialmente ($2^n$ filas). Para evitar explosión de memoria, se recomienda no exceder ~20 variables proposicionales en un solo `truth_table` o `check valid`.
