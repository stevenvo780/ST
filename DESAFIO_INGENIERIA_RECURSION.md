# Reporte Técnico: El Desafío de la Muralla Simbólica en ST

## 1. El Diagnóstico: ¿Por qué explota el motor?

A pesar de haber implementado **Reducción Ansiosa (Constant Folding)** y **Límites de Seguridad**, el motor de ST sigue colapsando bajo ataques de recursión infinita o bucles masivos por una razón arquitectónica fundamental: **ST es un Intérprete de Expansión Simbólica, no una Máquina Virtual de Estado.**

### El Problema de la Memoria (OOM en Aritmética)
Cuando ejecutas un bucle como `while x > 0 { set x = x + 1 }`:
1. **Sustitución en lugar de Mutación**: ST no incrementa un puntero en memoria. El motor busca el átomo `x`, lo reemplaza por su definición, evalúa la fórmula resultante y vuelve a guardar el árbol. 
2. **Carga de Objetos en V8**: Cada paso del bucle genera nuevos objetos de JavaScript para representar nodos del AST (`Formula`). Aunque sean "números", son objetos pesados. En 100,000 iteraciones, generas millones de objetos que el Garbage Collector de Node.js no puede limpiar lo suficientemente rápido porque están siendo referenciados por el Scope de ejecución actual.

### El Problema del Stack (Stack Overflow en FOL/Recursión)
1. **Recursión Sincrónica**: El método `executeStatement` del `Interpreter` se llama a sí mismo para manejar `if`, `while`, `for` y `fn_call`. 
2. **Profundidad de V8**: JavaScript tiene un límite de pila (Call Stack) de ~10,000 llamadas. Un modelo de Primer Orden complejo o una función recursiva profunda agota este stack físico mucho antes de que ST pueda terminar su razonamiento lógico.

---

## 2. La Solución: Hoja de Ruta de Ingeniería

Para que ST soporte bucles de millones de iteraciones y recursión profunda, se requiere una transición de un **Tree-Walking Interpreter** a una **Arquitectura de Máquina Virtual (VM)**.

### Paso 1: Implementar un "Trampoline" o Bucle de Despacho
En lugar de que `executeFnCall` llame a `executeStatement` (recursión), debe devolver una estructura de datos que describa la siguiente operación. Un bucle `while` central en el intérprete manejaría la ejecución. Esto mueve la carga de la **Pila de Llamadas (Stack)** a la **Memoria Dinámica (Heap)**, que es mucho más grande.

### Paso 2: Sistema de Scopes por Referencia (Environment Frames)
Actualmente, ST clona mapas de variables (`new Map(this.letBindings)`) para proteger el scope en llamadas a funciones. Esto es letal para la RAM.
- **Solución**: Usar una cadena de Scopes. Cada función nueva crea un objeto pequeño que apunta a su padre. La búsqueda de variables sube por la cadena. Costo de memoria: casi cero por llamada.

### Paso 3: Compilación a Bytecode (El Salto de Calidad)
El desafío real se resuelve compilando el script `.st` a una lista plana de instrucciones (Bytecode) antes de ejecutarlo.
- `LOAD_VAR x`
- `PUSH_CONST 1`
- `ADD`
- `STORE_VAR x`
Esto elimina la necesidad de caminar el árbol AST durante la ejecución del bucle, acelerando la velocidad en un 1000% y reduciendo el consumo de RAM drásticamente.

### Paso 4: Motor de Razonamiento Asíncrono (Iterative Tableau)
Para la Lógica de Primer Orden (FOL), el algoritmo de Tableau debe dejar de ser recursivo y pasar a ser un algoritmo basado en una **Agenda de Trabajo (Queue)**.
- En lugar de bajar por una rama, se guardan los "trabajos pendientes" en una cola y se procesan uno a uno. Esto permite pausar, reanudar y limitar el razonamiento sin bloquear el hilo principal.

---

## 3. Impacto del incremento de RAM

Aumentar la RAM del sistema (ej. a 16GB o más) ayudará a ST a manejar fórmulas proposicionales con más átomos (2^n) y tablas de verdad masivas. Sin embargo, **no evitará el Stack Overflow** (ya que el límite de la pila es del motor V8, no de la RAM total) a menos que se use el flag `--stack-size`.

### Recomendación de ejecución para tests extremos:
Si vas a darle más potencia, usa este comando para permitir que Node.js respire:
```bash
node --max-old-space-size=8192 --stack-size=10000 dist/cli/index.js run script.st
```

## Conclusión
ST ha alcanzado el límite de lo que un intérprete simbólico simple puede hacer. El siguiente paso es la **re-ingeniería hacia una VM basada en registros o stack**, lo que lo convertiría no solo en un lenguaje de lógica, sino en un lenguaje de programación de alto rendimiento para sistemas formales.

---
**Status**: Los parches de seguridad actuales (Constant Folding + Depth Limits) actúan como un "Escudo de Emergencia", pero el camino a la infinitud requiere una nueva arquitectura de ejecución.
