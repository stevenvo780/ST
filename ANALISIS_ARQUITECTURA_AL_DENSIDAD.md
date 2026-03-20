# Análisis de Arquitectura: ST para Alta Densidad (128GB - 2TB)

Para escalar ST, no solo necesitamos "espacio", necesitamos "densidad". El problema de los 128GB es que, con la arquitectura actual, Node.js gastará 100GB en "gestión de objetos" y solo 28GB en lógica real.

A continuación, analizo las opciones para usar tu servidor de forma eficiente sin romper el lenguaje.

---

## Opción A: AST Linealizado (Memoria Plana / Buffers)
Consiste en guardar la fórmula como una secuencia de números en un `Uint32Array`.
- **Cómo funciona**: `(P & Q) | R` se convierte en `[OR, AND, P, Q, R]`.
- **Pros**: Es la opción más eficiente en memoria. Cero presión para el Garbage Collector (GC). Podrías representar fórmulas de billones de nodos.
- **Contras (El riesgo de ruptura)**: **Ruptura Total de API.** Todas las funciones que hoy usan `f.kind` y `f.args` dejarían de funcionar. Tendríamos que reescribir cada perfil lógico desde cero.
- **Veredicto**: Solo recomendable como una "capa de aceleración" opcional para el perfil proposicional, no como cambio global.

## Opción B: Compartición Estructural (DAG - Directed Acyclic Graph)
En lugar de un árbol donde cada rama es una copia nueva, usamos un grafo donde las partes idénticas apuntan al mismo objeto en memoria.
- **Cómo funciona**: En el ataque fractal `f = (f|f) & (f|f)`, el motor detecta que `f` es el mismo objeto y solo guarda **una instancia** con múltiples punteros hacia ella.
- **Pros**: **Resuelve el "Ataque Omega 3" instantáneamente.** Una fórmula de mil millones de nodos pasaría a ocupar unos pocos kilobytes si es repetitiva. No rompe la API actual (sigue usando objetos `Formula`).
- **Contras**: La serialización (`formulaToString`) podría entrar en bucles si no se maneja con cuidado. Requiere una "Fábrica de Fórmulas" (Hash-consing).
- **Veredicto**: **La mejor opción para empezar.** Es la forma en que los solvers profesionales (como Z3 o CVC4) gestionan la memoria.

## Opción C: Valuaciones por Lotes (Bitsets Masivos)
En lugar de evaluar una fila de la tabla de verdad a la vez, evaluamos 64 o 1024 filas en un solo paso usando operaciones de bits de la CPU.
- **Cómo funciona**: Guardamos los valores de `P` para 64 mundos en un solo `BigInt`. `AND(P, Q)` se convierte en una sola operación `P & Q` a nivel de CPU.
- **Pros**: Velocidad absurda (64x más rápido). Uso de RAM extremadamente compacto.
- **Contras**: Solo aplica a lógica clásica proposicional. No ayuda en Lógica de Primer Orden o Modal.
- **Veredicto**: Necesario para que las tablas de verdad no tarden siglos en tus 128GB.

---

## Consecuencias y Riesgos de Ejecución

| Opción | Complejidad | Riesgo de "Bugs" | Impacto en RAM | ¿Rompe Perfiles? |
| :--- | :--- | :--- | :--- | :--- |
| **A (Lineal)** | Muy Alta | Muy Alto | Máximo (95% ahorro) | **SÍ** |
| **B (Grafo/DAG)** | Media | Bajo | Alto (en fórmulas repetitivas) | **NO** |
| **C (Bitsets)** | Baja | Medio | Medio (en tablas de verdad) | **NO** |

---

## Mi Recomendación Estratégica: "El Camino del Grafo"

Para usar tus 128GB sin romper ST, yo implementaría la **Opción B (Compartición Estructural)** mediante una técnica llamada **Hash-Consing**:

1. Creamos una "Caché de Unicidad".
2. Cada vez que el motor intenta crear un nodo `AND(P, Q)`, primero mira si ya existe un nodo idéntico en la caché.
3. Si existe, devuelve el puntero al existente.
4. **Resultado**: El Ataque Omega que antes consumía 40GB ahora consumirá 1MB, porque el servidor entenderá que la fórmula es solo una repetición de lo mismo.

### ¿Cómo ejecutar en 128GB hoy mismo?
Usa este comando para que Node.js no se auto-limite:
```bash
node --max-old-space-size=120000 dist/cli/index.js run script.st
```

¿Deseas que implemente la **Compartición Estructural (DAG)** para que el motor detecte automáticamente fórmulas repetitivas y ahorre el 90% de la RAM?
